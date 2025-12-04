import crypto from 'crypto';
import { db } from '../db';
import { posIntegrations, posCustomers, salesTransactions } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const LIGHTSPEED_CLIENT_ID = process.env.LIGHTSPEED_CLIENT_ID!;
const LIGHTSPEED_CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET!;
const APP_URL = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || '';

const ENCRYPTION_KEY = process.env.POS_ENCRYPTION_KEY || 'default-32-char-key-for-development';

interface LightspeedTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires: string;
}

interface LightspeedCustomer {
  id: string;
  name: string;
  customer_code?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  loyalty_balance?: string;
  year_to_date?: string;
  balance?: string;
}

interface LightspeedSale {
  id: string;
  invoice_number?: string;
  status?: string;
  total_price?: number;
  total_tax?: number;
  sale_date?: string;
  customer?: LightspeedCustomer;
  line_items?: Array<{
    product_id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  payments?: Array<{
    payment_type_id: string;
    amount: number;
  }>;
}

export class LightspeedService {
  private encryptData(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decryptData(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt Lightspeed data:', error);
      return '';
    }
  }

  generateAuthUrl(state: string, domainPrefix: string): string {
    const redirectUri = `${APP_URL}/api/lightspeed/callback`;
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LIGHTSPEED_CLIENT_ID,
      redirect_uri: redirectUri,
      state: state,
    });

    // Use domain-specific vendhq.com endpoint for X-Series OAuth
    // X-Series (formerly Vend) uses {domain}.vendhq.com for OAuth authorization
    return `https://${domainPrefix}.vendhq.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, domainPrefix: string): Promise<LightspeedTokenResponse> {
    const redirectUri = `${APP_URL}/api/lightspeed/callback`;
    
    const response = await fetch(`https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: LIGHTSPEED_CLIENT_ID,
        client_secret: LIGHTSPEED_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lightspeed token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  async refreshAccessToken(integration: typeof posIntegrations.$inferSelect): Promise<string> {
    const domainPrefix = (integration.settings as any)?.domainPrefix;
    if (!domainPrefix) {
      throw new Error('Domain prefix not found in integration settings');
    }

    const refreshToken = this.decryptData(integration.refreshToken || '');
    
    const response = await fetch(`https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: LIGHTSPEED_CLIENT_ID,
        client_secret: LIGHTSPEED_CLIENT_SECRET,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lightspeed token refresh failed:', errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens: LightspeedTokenResponse = await response.json();

    await db.update(posIntegrations)
      .set({
        accessToken: this.encryptData(tokens.access_token),
        refreshToken: this.encryptData(tokens.refresh_token),
        settings: {
          ...(integration.settings as object || {}),
          tokenExpiresAt: tokens.expires,
        },
        updatedAt: new Date(),
      })
      .where(eq(posIntegrations.id, integration.id));

    return tokens.access_token;
  }

  async getValidAccessToken(integration: typeof posIntegrations.$inferSelect): Promise<string> {
    const settings = integration.settings as any;
    const tokenExpiresAt = settings?.tokenExpiresAt;
    
    if (tokenExpiresAt) {
      const expiresDate = new Date(tokenExpiresAt);
      const now = new Date();
      const bufferTime = 5 * 60 * 1000;
      
      if (expiresDate.getTime() - now.getTime() < bufferTime) {
        return this.refreshAccessToken(integration);
      }
    }
    
    return this.decryptData(integration.accessToken || '');
  }

  async createIntegration(
    userId: string,
    brandId: string,
    domainPrefix: string,
    tokens: LightspeedTokenResponse,
    storeInfo?: any
  ): Promise<string> {
    const [integration] = await db.insert(posIntegrations)
      .values({
        userId,
        brandId,
        provider: 'lightspeed',
        storeName: storeInfo?.businessName || `Lightspeed Store (${domainPrefix})`,
        accessToken: this.encryptData(tokens.access_token),
        refreshToken: this.encryptData(tokens.refresh_token),
        storeUrl: `https://${domainPrefix}.retail.lightspeed.app`,
        isActive: true,
        syncEnabled: true,
        settings: {
          domainPrefix,
          tokenExpiresAt: tokens.expires,
          storeInfo,
        },
      })
      .returning();

    return integration.id;
  }

  async syncCustomers(integration: typeof posIntegrations.$inferSelect): Promise<number> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;
    
    if (!domainPrefix) {
      throw new Error('Domain prefix not found');
    }

    const response = await fetch(`https://${domainPrefix}.retail.lightspeed.app/api/2.0/customers`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch Lightspeed customers:', errorText);
      throw new Error(`Failed to fetch customers: ${response.status}`);
    }

    const data = await response.json();
    const customers: LightspeedCustomer[] = data.data || [];
    let syncedCount = 0;

    for (const customer of customers) {
      try {
        const existingCustomer = await db.query.posCustomers.findFirst({
          where: and(
            eq(posCustomers.posIntegrationId, integration.id),
            eq(posCustomers.externalCustomerId, customer.id)
          ),
        });

        const customerData = {
          posIntegrationId: integration.id,
          userId: integration.userId!,
          brandId: integration.brandId!,
          externalCustomerId: customer.id,
          customerCode: customer.customer_code,
          name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
          firstName: customer.first_name,
          lastName: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          mobile: customer.mobile,
          companyName: customer.company_name,
          loyaltyBalance: customer.loyalty_balance,
          yearToDate: customer.year_to_date,
          balance: customer.balance,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        };

        if (existingCustomer) {
          await db.update(posCustomers)
            .set(customerData)
            .where(eq(posCustomers.id, existingCustomer.id));
        } else {
          await db.insert(posCustomers).values(customerData);
        }
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync customer ${customer.id}:`, error);
      }
    }

    await db.update(posIntegrations)
      .set({ lastSyncAt: new Date() })
      .where(eq(posIntegrations.id, integration.id));

    return syncedCount;
  }

  async syncSales(integration: typeof posIntegrations.$inferSelect, dateFrom?: Date): Promise<number> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;
    
    if (!domainPrefix) {
      throw new Error('Domain prefix not found');
    }

    const params = new URLSearchParams();
    if (dateFrom) {
      params.set('date_from', dateFrom.toISOString());
    }

    const url = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/sales${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch Lightspeed sales:', errorText);
      throw new Error(`Failed to fetch sales: ${response.status}`);
    }

    const data = await response.json();
    const sales: LightspeedSale[] = data.data || [];
    let syncedCount = 0;

    for (const sale of sales) {
      try {
        const existingTransaction = await db.query.salesTransactions.findFirst({
          where: and(
            eq(salesTransactions.posIntegrationId, integration.id),
            eq(salesTransactions.transactionId, sale.id)
          ),
        });

        if (existingTransaction) continue;

        await db.insert(salesTransactions).values({
          posIntegrationId: integration.id,
          userId: integration.userId,
          transactionId: sale.id,
          customerId: sale.customer?.id,
          customerEmail: sale.customer?.email,
          customerName: sale.customer?.name,
          customerPhone: sale.customer?.phone || sale.customer?.mobile,
          totalAmount: Math.round((sale.total_price || 0) * 100),
          currency: 'USD',
          status: sale.status || 'completed',
          paymentMethod: sale.payments?.[0] ? 'card' : 'unknown',
          items: sale.line_items || [],
          metadata: {
            invoiceNumber: sale.invoice_number,
            totalTax: sale.total_tax,
          },
          transactionDate: sale.sale_date ? new Date(sale.sale_date) : new Date(),
        });
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync sale ${sale.id}:`, error);
      }
    }

    return syncedCount;
  }

  async getIntegrationByBrand(brandId: string): Promise<typeof posIntegrations.$inferSelect | null> {
    const integration = await db.query.posIntegrations.findFirst({
      where: and(
        eq(posIntegrations.brandId, brandId),
        eq(posIntegrations.provider, 'lightspeed'),
        eq(posIntegrations.isActive, true)
      ),
    });
    return integration || null;
  }

  async getIntegrationsByUser(userId: string): Promise<(typeof posIntegrations.$inferSelect)[]> {
    return db.query.posIntegrations.findMany({
      where: and(
        eq(posIntegrations.userId, userId),
        eq(posIntegrations.provider, 'lightspeed'),
        eq(posIntegrations.isActive, true)
      ),
    });
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    await db.update(posIntegrations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(posIntegrations.id, integrationId));
  }

  async getCustomers(integrationId: string): Promise<(typeof posCustomers.$inferSelect)[]> {
    return db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integrationId),
    });
  }

  async getSales(integrationId: string, limit = 100): Promise<(typeof salesTransactions.$inferSelect)[]> {
    return db.query.salesTransactions.findMany({
      where: eq(salesTransactions.posIntegrationId, integrationId),
      orderBy: (table, { desc }) => [desc(table.transactionDate)],
      limit,
    });
  }

  async getSalesStats(integrationId: string): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageOrderValue: number;
    totalCustomers: number;
  }> {
    const sales = await db.query.salesTransactions.findMany({
      where: eq(salesTransactions.posIntegrationId, integrationId),
    });

    const customers = await db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integrationId),
    });

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = sales.length;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      totalCustomers: customers.length,
    };
  }
}

export const lightspeedService = new LightspeedService();
