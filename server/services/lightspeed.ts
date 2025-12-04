import crypto from "crypto";
import { db } from "../db";
import {
  posIntegrations,
  posCustomers,
  salesTransactions,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

const LIGHTSPEED_CLIENT_ID = process.env.LIGHTSPEED_CLIENT_ID!;
const LIGHTSPEED_CLIENT_SECRET = process.env.LIGHTSPEED_CLIENT_SECRET!;
const APP_URL = process.env.APP_URL || process.env.REPLIT_DEV_DOMAIN || "";

const ENCRYPTION_KEY =
  process.env.POS_ENCRYPTION_KEY || "default-32-char-key-for-development";

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
    const cipher = crypto.createCipher("aes-256-cbc", ENCRYPTION_KEY);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  private decryptData(encryptedText: string): string {
    try {
      const decipher = crypto.createDecipher("aes-256-cbc", ENCRYPTION_KEY);
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (error) {
      console.error("Failed to decrypt Lightspeed data:", error);
      return "";
    }
  }

  generateAuthUrl(state: string, domainPrefix?: string): string {
    const redirectUri = `${APP_URL}/api/lightspeed/callback`;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: LIGHTSPEED_CLIENT_ID,
      redirect_uri: redirectUri,
      state: state,
    });

    // Use the official Lightspeed X-Series OAuth endpoint
    // This is the central auth server - domain_prefix is returned in the callback
    return `https://secure.retail.lightspeed.app/connect?${params.toString()}`;
  }

  async exchangeCodeForToken(
    code: string,
    domainPrefix: string,
  ): Promise<LightspeedTokenResponse> {
    const redirectUri = `${APP_URL}/api/lightspeed/callback`;

    const response = await fetch(
      `https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          client_id: LIGHTSPEED_CLIENT_ID,
          client_secret: LIGHTSPEED_CLIENT_SECRET,
          redirect_uri: redirectUri,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lightspeed token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    return response.json();
  }

  async refreshAccessToken(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<string> {
    const domainPrefix = (integration.settings as any)?.domainPrefix;
    if (!domainPrefix) {
      throw new Error("Domain prefix not found in integration settings");
    }

    const refreshToken = this.decryptData(integration.refreshToken || "");

    const response = await fetch(
      `https://${domainPrefix}.retail.lightspeed.app/api/1.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: LIGHTSPEED_CLIENT_ID,
          client_secret: LIGHTSPEED_CLIENT_SECRET,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lightspeed token refresh failed:", errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokens: LightspeedTokenResponse = await response.json();

    await db
      .update(posIntegrations)
      .set({
        accessToken: this.encryptData(tokens.access_token),
        refreshToken: this.encryptData(tokens.refresh_token),
        settings: {
          ...((integration.settings as object) || {}),
          tokenExpiresAt: tokens.expires,
        },
        updatedAt: new Date(),
      })
      .where(eq(posIntegrations.id, integration.id));

    return tokens.access_token;
  }

  async getValidAccessToken(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<string> {
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

    return this.decryptData(integration.accessToken || "");
  }

  async createIntegration(
    userId: string,
    brandId: string,
    domainPrefix: string,
    tokens: LightspeedTokenResponse,
    storeInfo?: any,
  ): Promise<string> {
    const [integration] = await db
      .insert(posIntegrations)
      .values({
        userId,
        brandId,
        provider: "lightspeed",
        storeName:
          storeInfo?.businessName || `Lightspeed Store (${domainPrefix})`,
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

  async syncCustomers(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<number> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    const response = await fetch(
      `https://${domainPrefix}.retail.lightspeed.app/api/2.0/customers?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch Lightspeed customers:", errorText);
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
            eq(posCustomers.externalCustomerId, customer.id),
          ),
        });

        const customerData = {
          posIntegrationId: integration.id,
          userId: integration.userId!,
          brandId: integration.brandId!,
          externalCustomerId: customer.id,
          customerCode: customer.customer_code,
          name:
            customer.name ||
            `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
            "Unknown",
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
          await db
            .update(posCustomers)
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

    await db
      .update(posIntegrations)
      .set({ lastSyncAt: new Date() })
      .where(eq(posIntegrations.id, integration.id));

    return syncedCount;
  }

  async syncSales(
    integration: typeof posIntegrations.$inferSelect,
    dateFrom?: Date,
  ): Promise<number> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    // Default to last 365 days if no date provided
    const effectiveDateFrom =
      dateFrom || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    console.log(`Syncing sales from: ${effectiveDateFrom.toISOString()}`);

    // Pre-fetch all customers for this integration to enable linking
    const posCustomersList = await db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integration.id),
    });
    const customerMap = new Map(
      posCustomersList.map((c) => [c.externalCustomerId, c.id]),
    );

    let syncedCount = 0;
    let afterVersion: number | undefined = undefined;
    let hasMorePages = true;
    let totalFetched = 0;
    const maxPages = 20; // Safety limit to avoid infinite loops
    let pageCount = 0;

    while (hasMorePages && pageCount < maxPages) {
      pageCount++;
      const params = new URLSearchParams();
      params.set("page_size", "100");
      
      // Use version-based pagination (after parameter)
      if (afterVersion !== undefined) {
        params.set("after", String(afterVersion));
      }

      const url = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/sales?${params.toString()}`;
      console.log(`Fetching sales page ${pageCount}${afterVersion ? ` (after version ${afterVersion})` : ''}...`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch Lightspeed sales:", errorText);
        throw new Error(`Failed to fetch sales: ${response.status}`);
      }

      const data = await response.json();
      const sales: LightspeedSale[] = data.data || [];
      const versionInfo = data.version as { min: number; max: number } | undefined;
      
      totalFetched += sales.length;
      console.log(`Page ${pageCount}: Found ${sales.length} sales (total: ${totalFetched})`);

      // Filter sales by date (only process sales from the effective date onwards)
      const filteredSales = sales.filter((sale) => {
        if (!sale.sale_date) return false;
        const saleDate = new Date(sale.sale_date);
        return saleDate >= effectiveDateFrom;
      });

      console.log(`Filtered to ${filteredSales.length} sales after ${effectiveDateFrom.toISOString()}`);

      for (const sale of filteredSales) {
        try {
          const existingTransaction = await db.query.salesTransactions.findFirst({
            where: and(
              eq(salesTransactions.posIntegrationId, integration.id),
              eq(salesTransactions.transactionId, sale.id),
            ),
          });

          if (existingTransaction) continue;

          // Look up the internal posCustomer by external customer ID
          const posCustomerId = sale.customer?.id
            ? customerMap.get(sale.customer.id)
            : null;

          // Map state to a normalized status (state is the new field, status is deprecated)
          const saleState = (sale as any).state as string | undefined;
          let normalizedStatus = "completed";
          if (saleState === "voided") {
            normalizedStatus = "cancelled";
          } else if (saleState === "parked" || saleState === "pending") {
            normalizedStatus = "pending";
          } else if (saleState === "closed") {
            normalizedStatus = "completed";
          }

          await db.insert(salesTransactions).values({
            posIntegrationId: integration.id,
            userId: integration.userId,
            posCustomerId: posCustomerId || null,
            transactionId: sale.id,
            customerId: sale.customer?.id,
            customerEmail: sale.customer?.email,
            customerName: sale.customer?.name,
            customerPhone: sale.customer?.phone || sale.customer?.mobile,
            totalAmount: Math.round((sale.total_price || 0) * 100),
            currency: "USD",
            status: normalizedStatus,
            paymentMethod: sale.payments?.[0] ? "card" : "unknown",
            items: sale.line_items || [],
            metadata: {
              invoiceNumber: sale.invoice_number,
              totalTax: sale.total_tax,
              state: saleState,
            },
            transactionDate: sale.sale_date
              ? new Date(sale.sale_date)
              : new Date(),
          });
          syncedCount++;
        } catch (error) {
          console.error(`Failed to sync sale ${sale.id}:`, error);
        }
      }

      // Check if there are more pages
      if (sales.length < 100) {
        // Less than page_size means we've reached the end
        hasMorePages = false;
      } else if (versionInfo && versionInfo.max) {
        // Use the max version from this page for the next request
        afterVersion = versionInfo.max;
      } else {
        // No version info and full page - stop to be safe
        hasMorePages = false;
      }
    }

    console.log(`Sync complete: ${syncedCount} new sales synced from ${totalFetched} total fetched`);
    return syncedCount;
  }

  async getIntegrationByBrand(
    brandId: string,
  ): Promise<typeof posIntegrations.$inferSelect | null> {
    const integration = await db.query.posIntegrations.findFirst({
      where: and(
        eq(posIntegrations.brandId, brandId),
        eq(posIntegrations.provider, "lightspeed"),
        eq(posIntegrations.isActive, true),
      ),
    });
    return integration || null;
  }

  async getIntegrationsByUser(
    userId: string,
  ): Promise<(typeof posIntegrations.$inferSelect)[]> {
    return db.query.posIntegrations.findMany({
      where: and(
        eq(posIntegrations.userId, userId),
        eq(posIntegrations.provider, "lightspeed"),
        eq(posIntegrations.isActive, true),
      ),
    });
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    await db
      .update(posIntegrations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(posIntegrations.id, integrationId));
  }

  async getCustomers(
    integrationId: string,
  ): Promise<(typeof posCustomers.$inferSelect)[]> {
    return db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integrationId),
    });
  }

  async getSales(
    integrationId: string,
    limit = 100,
  ): Promise<(typeof salesTransactions.$inferSelect)[]> {
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
    const averageOrderValue =
      totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0;

    return {
      totalSales,
      totalTransactions,
      averageOrderValue,
      totalCustomers: customers.length,
    };
  }

  // ============ WEBHOOK METHODS ============

  async registerWebhooks(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<{ saleWebhookId?: string; customerWebhookId?: string }> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    const webhookUrl = `${APP_URL}/api/lightspeed/webhook`;
    const results: { saleWebhookId?: string; customerWebhookId?: string } = {};

    // Register sale.update webhook
    try {
      const saleResponse = await fetch(
        `https://${domainPrefix}.retail.lightspeed.app/api/2.0/webhooks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: webhookUrl,
            type: "sale.update",
          }),
        },
      );

      if (saleResponse.ok) {
        const data = await saleResponse.json();
        results.saleWebhookId = data.data?.id;
        console.log(
          `✅ Registered sale.update webhook: ${results.saleWebhookId}`,
        );
      } else {
        const errorText = await saleResponse.text();
        console.error("Failed to register sale.update webhook:", errorText);
      }
    } catch (error) {
      console.error("Error registering sale.update webhook:", error);
    }

    // Register customer.update webhook
    try {
      const customerResponse = await fetch(
        `https://${domainPrefix}.retail.lightspeed.app/api/2.0/webhooks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: webhookUrl,
            type: "customer.update",
          }),
        },
      );

      if (customerResponse.ok) {
        const data = await customerResponse.json();
        results.customerWebhookId = data.data?.id;
        console.log(
          `✅ Registered customer.update webhook: ${results.customerWebhookId}`,
        );
      } else {
        const errorText = await customerResponse.text();
        console.error("Failed to register customer.update webhook:", errorText);
      }
    } catch (error) {
      console.error("Error registering customer.update webhook:", error);
    }

    // Store webhook IDs in integration settings
    if (results.saleWebhookId || results.customerWebhookId) {
      const currentSettings = (integration.settings as any) || {};
      await db
        .update(posIntegrations)
        .set({
          settings: {
            ...currentSettings,
            webhooks: {
              saleWebhookId: results.saleWebhookId,
              customerWebhookId: results.customerWebhookId,
            },
          },
          updatedAt: new Date(),
        })
        .where(eq(posIntegrations.id, integration.id));
    }

    return results;
  }

  async listWebhooks(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<any[]> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    const response = await fetch(
      `https://${domainPrefix}.retail.lightspeed.app/api/2.0/webhooks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to list webhooks: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  async deleteWebhook(
    integration: typeof posIntegrations.$inferSelect,
    webhookId: string,
  ): Promise<void> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    const response = await fetch(
      `https://${domainPrefix}.retail.lightspeed.app/api/2.0/webhooks/${webhookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to delete webhook: ${response.status} - ${errorText}`,
      );
    }

    console.log(`✅ Deleted webhook: ${webhookId}`);
  }

  verifyWebhookSignature(body: string, signatureHeader: string): boolean {
    if (!signatureHeader) return false;

    try {
      // Parse signature header: signature=abc123,algorithm=HMAC-SHA256
      const parts: Record<string, string> = {};
      signatureHeader.split(",").forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) parts[key.trim()] = value.trim();
      });

      const expectedSignature = parts.signature;
      const algorithm = parts.algorithm;

      if (algorithm !== "HMAC-SHA256" || !expectedSignature) {
        return false;
      }

      // Compute signature using client secret
      const computed = crypto
        .createHmac("sha256", LIGHTSPEED_CLIENT_SECRET)
        .update(body)
        .digest("hex");

      return crypto.timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(expectedSignature),
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  async processWebhookEvent(eventType: string, payload: any): Promise<void> {
    console.log(`📥 Processing Lightspeed webhook: ${eventType}`);

    // Find integration by looking up the customer/sale data
    // The webhook payload includes store-specific data

    if (eventType === "sale.update") {
      await this.processSaleWebhook(payload);
    } else if (eventType === "customer.update") {
      await this.processCustomerWebhook(payload);
    }
  }

  private async processSaleWebhook(sale: any): Promise<void> {
    // Find the integration by looking for matching webhooks or domain
    const allIntegrations = await db.query.posIntegrations.findMany({
      where: and(
        eq(posIntegrations.provider, "lightspeed"),
        eq(posIntegrations.isActive, true),
      ),
    });

    for (const integration of allIntegrations) {
      try {
        // Check if this sale belongs to this integration
        const existingTransaction = await db.query.salesTransactions.findFirst({
          where: and(
            eq(salesTransactions.posIntegrationId, integration.id),
            eq(salesTransactions.transactionId, sale.id),
          ),
        });

        if (existingTransaction) {
          // Update existing transaction
          await db
            .update(salesTransactions)
            .set({
              totalAmount: Math.round(
                (sale.total_price || sale.totals?.total_price || 0) * 100,
              ),
              status: sale.status || "completed",
              customerName: sale.customer?.first_name
                ? `${sale.customer.first_name} ${sale.customer.last_name || ""}`.trim()
                : sale.customer?.name,
              customerEmail: sale.customer?.email,
              customerPhone: sale.customer?.phone || sale.customer?.mobile,
            })
            .where(eq(salesTransactions.id, existingTransaction.id));
          console.log(`✅ Updated sale: ${sale.id}`);
          return;
        }

        // Look up internal customer
        let posCustomerId: string | null = null;
        if (sale.customer?.id || sale.customer_id) {
          const customerId = sale.customer?.id || sale.customer_id;
          const posCustomer = await db.query.posCustomers.findFirst({
            where: and(
              eq(posCustomers.posIntegrationId, integration.id),
              eq(posCustomers.externalCustomerId, customerId),
            ),
          });
          posCustomerId = posCustomer?.id || null;
        }

        // Insert new sale
        await db.insert(salesTransactions).values({
          posIntegrationId: integration.id,
          userId: integration.userId,
          posCustomerId: posCustomerId,
          transactionId: sale.id,
          customerId: sale.customer?.id || sale.customer_id,
          customerEmail: sale.customer?.email,
          customerName: sale.customer?.first_name
            ? `${sale.customer.first_name} ${sale.customer.last_name || ""}`.trim()
            : sale.customer?.name,
          customerPhone: sale.customer?.phone || sale.customer?.mobile,
          totalAmount: Math.round(
            (sale.total_price || sale.totals?.total_price || 0) * 100,
          ),
          currency: "USD",
          status: sale.status || "completed",
          paymentMethod: sale.register_sale_payments?.[0] ? "card" : "unknown",
          items: sale.line_items || [],
          metadata: {
            invoiceNumber: sale.invoice_number,
            totalTax: sale.total_tax || sale.totals?.total_tax,
          },
          transactionDate: sale.sale_date
            ? new Date(sale.sale_date)
            : new Date(),
        });
        console.log(`✅ New sale synced via webhook: ${sale.id}`);
        return;
      } catch (error) {
        console.error(
          `Error processing sale webhook for integration ${integration.id}:`,
          error,
        );
      }
    }
  }

  private async processCustomerWebhook(customer: any): Promise<void> {
    const allIntegrations = await db.query.posIntegrations.findMany({
      where: and(
        eq(posIntegrations.provider, "lightspeed"),
        eq(posIntegrations.isActive, true),
      ),
    });

    for (const integration of allIntegrations) {
      try {
        const existingCustomer = await db.query.posCustomers.findFirst({
          where: and(
            eq(posCustomers.posIntegrationId, integration.id),
            eq(posCustomers.externalCustomerId, customer.id),
          ),
        });

        const customerName = customer.first_name
          ? `${customer.first_name} ${customer.last_name || ""}`.trim()
          : customer.name || "Unknown";

        const customerData = {
          name: customerName,
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
          await db
            .update(posCustomers)
            .set(customerData)
            .where(eq(posCustomers.id, existingCustomer.id));
          console.log(`✅ Updated customer via webhook: ${customer.id}`);
        } else {
          if (!integration.brandId) {
            console.log(
              `Skipping customer insert - no brandId for integration ${integration.id}`,
            );
            continue;
          }
          await db.insert(posCustomers).values({
            posIntegrationId: integration.id,
            userId: integration.userId!,
            brandId: integration.brandId,
            externalCustomerId: customer.id,
            customerCode: customer.customer_code,
            name: customerName,
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
          });
          console.log(`✅ New customer synced via webhook: ${customer.id}`);
        }
        return;
      } catch (error) {
        console.error(
          `Error processing customer webhook for integration ${integration.id}:`,
          error,
        );
      }
    }
  }
}

export const lightspeedService = new LightspeedService();
