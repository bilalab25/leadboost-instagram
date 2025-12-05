import crypto from "crypto";
import { db } from "../db";
import {
  posIntegrations,
  posCustomers,
  salesTransactions,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

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
  customer_id?: string; // Direct customer ID from Lightspeed API
  customer?: LightspeedCustomer; // Optional nested customer object (may not always be present)
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
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait 5 minutes and try again.`);
      }
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
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait 5 minutes and try again.`);
      }
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

  /**
   * Fetch a customer from Lightspeed by customer_id using search endpoint
   * Uses: /api/2.0/search?type=customers&customer_id=UUID
   */
  private async fetchCustomerFromLightspeed(
    customerId: string,
    accessToken: string,
    domainPrefix: string
  ): Promise<LightspeedCustomer | null> {
    try {
      const url = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/search?type=customers&customer_id=${customerId}`;
      
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const customers = data.data || [];
      
      return customers.length > 0 ? customers[0] as LightspeedCustomer : null;
    } catch (error) {
      console.log(`  -> Error fetching customer ${customerId}`);
      return null;
    }
  }

  async syncSales(
    integration: typeof posIntegrations.$inferSelect,
    dateFrom?: Date,
  ): Promise<number> {
    console.log("🔄 Starting sales sync for integration:", integration.id);
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    let effectiveDateFrom: Date;

    if (dateFrom) {
      effectiveDateFrom = dateFrom;
      console.log("Using provided date for sync");
    } else {
      const mostRecentSale = await db.query.salesTransactions.findFirst({
        where: eq(salesTransactions.posIntegrationId, integration.id),
        orderBy: [desc(salesTransactions.transactionDate)],
      });

      if (mostRecentSale?.transactionDate) {
        effectiveDateFrom = new Date(mostRecentSale.transactionDate.getTime() - 60 * 60 * 1000);
        console.log(`Incremental sync from ${effectiveDateFrom.toISOString()}`);
      } else {
        const now = new Date();
        effectiveDateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        console.log("Initial sync: fetching current month");
      }
    }

    const dateFromStr = effectiveDateFrom.toISOString().replace(/\.\d{3}Z$/, 'Z');
    console.log(`📅 Syncing sales from: ${dateFromStr}`);

    // Load existing customers from our database
    const posCustomersList = await db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integration.id),
    });
    
    // Map by external ID for quick lookup
    const customerMap = new Map(
      posCustomersList.map((c) => [c.externalCustomerId, c.id]),
    );
    
    // Session cache: customer_id -> posCustomer.id
    // This prevents fetching the same customer multiple times in one sync
    const sessionCache = new Map<string, string>();
    
    console.log(`📦 Loaded ${customerMap.size} existing customers from database`);

    let syncedCount = 0;
    let customersCreated = 0;
    let customersFromCache = 0;
    let offset = 0;
    let hasMorePages = true;
    let totalFetched = 0;
    const pageSize = 500;
    const maxPages = 20;
    let pageCount = 0;

    while (hasMorePages && pageCount < maxPages) {
      pageCount++;
      
      const params = new URLSearchParams();
      params.set("type", "sales");
      params.set("date_from", dateFromStr);
      params.set("page_size", String(pageSize));
      params.set("offset", String(offset));
      params.set("order_direction", "desc");

      const url = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/search?${params.toString()}`;
      console.log(`📥 Fetching sales page ${pageCount} (offset: ${offset})...`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch Lightspeed sales:", errorText);
        throw new Error(`Failed to fetch sales: ${response.status}`);
      }

      const data = await response.json();
      const sales: LightspeedSale[] = data.data || [];
      
      totalFetched += sales.length;
      console.log(`Page ${pageCount}: Found ${sales.length} sales`);

      for (const sale of sales) {
        try {
          // Skip if already synced
          const existingTransaction = await db.query.salesTransactions.findFirst({
            where: and(
              eq(salesTransactions.posIntegrationId, integration.id),
              eq(salesTransactions.transactionId, sale.id),
            ),
          });

          if (existingTransaction) continue;

          const saleCustomerId = sale.customer_id;
          let posCustomerId: string | null = null;
          let customerData: LightspeedCustomer | null = null;

          // SIMPLE APPROACH: For each sale with customer_id
          // 1. Check if customer already exists in our DB
          // 2. Check if we already fetched it this session
          // 3. If not, fetch from Lightspeed and create it
          if (saleCustomerId) {
            // Step 1: Check if customer exists in our DB
            posCustomerId = customerMap.get(saleCustomerId) || null;
            
            // Step 2: Check session cache (already fetched this sync)
            if (!posCustomerId && sessionCache.has(saleCustomerId)) {
              posCustomerId = sessionCache.get(saleCustomerId) || null;
              if (posCustomerId) customersFromCache++;
            }
            
            // Step 3: Fetch from Lightspeed and create in our DB
            if (!posCustomerId) {
              customerData = await this.fetchCustomerFromLightspeed(
                saleCustomerId, 
                accessToken, 
                domainPrefix
              );
              
              if (customerData) {
                // Create customer in our database
                const newCustomerId = crypto.randomUUID();
                await db.insert(posCustomers).values({
                  id: newCustomerId,
                  posIntegrationId: integration.id,
                  userId: integration.userId!,
                  brandId: integration.brandId!,
                  externalCustomerId: customerData.id,
                  customerCode: customerData.customer_code,
                  name: customerData.name || 
                    `${customerData.first_name || ""} ${customerData.last_name || ""}`.trim() || 
                    "Unknown",
                  firstName: customerData.first_name,
                  lastName: customerData.last_name,
                  email: customerData.email,
                  phone: customerData.phone,
                  mobile: customerData.mobile,
                  companyName: customerData.company_name,
                  loyaltyBalance: customerData.loyalty_balance,
                  yearToDate: customerData.year_to_date,
                  balance: customerData.balance,
                  lastSyncAt: new Date(),
                  updatedAt: new Date(),
                });
                
                posCustomerId = newCustomerId;
                customersCreated++;
                
                // Add to maps for future lookups
                customerMap.set(customerData.id, newCustomerId);
                sessionCache.set(saleCustomerId, newCustomerId);
                
                if (customersCreated <= 5) {
                  console.log(`  👤 Created customer: ${customerData.name} (${customerData.id})`);
                }
              } else {
                // Mark as checked even if not found
                sessionCache.set(saleCustomerId, "");
              }
            }
          }

          // Map state to normalized status
          const saleState = (sale as any).state as string | undefined;
          let normalizedStatus = "completed";
          if (saleState === "voided") {
            normalizedStatus = "cancelled";
          } else if (saleState === "parked" || saleState === "pending") {
            normalizedStatus = "pending";
          } else if (saleState === "closed") {
            normalizedStatus = "completed";
          }

          // Get customer details for the sale record
          let customerName: string | null = null;
          let customerEmail: string | null = null;
          let customerPhone: string | null = null;
          
          if (posCustomerId) {
            const linkedCustomer = await db.query.posCustomers.findFirst({
              where: eq(posCustomers.id, posCustomerId),
            });
            if (linkedCustomer) {
              customerName = linkedCustomer.name;
              customerEmail = linkedCustomer.email;
              customerPhone = linkedCustomer.phone || linkedCustomer.mobile;
            }
          }

          await db.insert(salesTransactions).values({
            posIntegrationId: integration.id,
            userId: integration.userId,
            posCustomerId: posCustomerId || null,
            transactionId: sale.id,
            customerId: saleCustomerId,
            customerEmail: customerEmail || customerData?.email,
            customerName: customerName || customerData?.name,
            customerPhone: customerPhone || customerData?.phone || customerData?.mobile,
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
      if (sales.length < pageSize) {
        hasMorePages = false;
      } else {
        offset += pageSize;
      }
    }

    console.log(`✅ Sync complete: ${syncedCount} new sales synced from ${totalFetched} total fetched`);
    console.log(`   👤 Customers: ${customersCreated} created, ${customersFromCache} from cache, ${customerMap.size} total`);
    return syncedCount;
  }

  /**
   * Re-link existing sales transactions with customers using multiple strategies:
   * 1. Match by external customer ID (customer.id from Lightspeed)
   * 2. Match by metadata.nestedCustomerId or metadata.topLevelCustomerId
   * 3. Fallback: Match by normalized phone number
   * 4. Fallback: Match by email
   * 5. Fallback: Match by name (exact match)
   */
  async relinkSalesWithCustomers(
    integration: typeof posIntegrations.$inferSelect,
  ): Promise<{ updated: number; total: number; byId: number; byMetadata: number; byPhone: number; byEmail: number; byName: number }> {
    console.log(`🔗 Re-linking sales with customers for integration ${integration.id}...`);
    
    // Get all customers for this integration
    const customers = await db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integration.id),
    });
    
    // Helper to normalize phone for matching (last 10 digits)
    const normalizePhone = (phone: string | null | undefined): string | null => {
      if (!phone) return null;
      const digits = phone.replace(/\D/g, '');
      return digits.length >= 10 ? digits.slice(-10) : null;
    };
    
    // Build multiple lookup maps for different matching strategies
    const idMap = new Map<string, typeof customers[0]>();
    const codeMap = new Map<string, typeof customers[0]>();
    const phoneMap = new Map<string, typeof customers[0]>();
    const emailMap = new Map<string, typeof customers[0]>();
    const nameMap = new Map<string, typeof customers[0]>();
    
    for (const customer of customers) {
      // Map by external ID
      if (customer.externalCustomerId) {
        idMap.set(customer.externalCustomerId, customer);
      }
      
      // Map by customer code
      if (customer.customerCode) {
        codeMap.set(customer.customerCode, customer);
      }
      
      // Map by normalized phone (both phone and mobile fields)
      const phone = normalizePhone(customer.phone);
      const mobile = normalizePhone(customer.mobile);
      if (phone) phoneMap.set(phone, customer);
      if (mobile && mobile !== phone) phoneMap.set(mobile, customer);
      
      // Map by lowercase email
      if (customer.email) {
        emailMap.set(customer.email.toLowerCase(), customer);
      }
      
      // Map by normalized name (lowercase, trimmed)
      if (customer.name && customer.name !== "Unknown") {
        nameMap.set(customer.name.toLowerCase().trim(), customer);
      }
    }
    
    console.log(`Built lookup maps - ID: ${idMap.size}, Code: ${codeMap.size}, Phone: ${phoneMap.size}, Email: ${emailMap.size}, Name: ${nameMap.size}`);
    
    // Get all sales transactions for this integration
    const allSales = await db.query.salesTransactions.findMany({
      where: eq(salesTransactions.posIntegrationId, integration.id),
    });
    
    console.log(`Found ${allSales.length} sales to check`);
    
    let updatedCount = 0;
    let byIdCount = 0;
    let byMetadataCount = 0;
    let byPhoneCount = 0;
    let byEmailCount = 0;
    let byNameCount = 0;
    
    for (const sale of allSales) {
      // Skip if already linked
      if (sale.posCustomerId) continue;
      
      let matchedCustomer: typeof customers[0] | undefined;
      let matchType = "";
      const metadata = sale.metadata as any;
      
      // Strategy 1: Match by external customer ID (customerId field)
      if (sale.customerId && idMap.has(sale.customerId)) {
        matchedCustomer = idMap.get(sale.customerId);
        matchType = "ID";
        byIdCount++;
      }
      
      // Strategy 2: Try matching using metadata IDs (nestedCustomerId, topLevelCustomerId)
      if (!matchedCustomer && metadata) {
        // Try nested customer ID from metadata
        if (metadata.nestedCustomerId && idMap.has(metadata.nestedCustomerId)) {
          matchedCustomer = idMap.get(metadata.nestedCustomerId);
          matchType = "MetadataNested";
          byMetadataCount++;
        }
        // Try top-level customer ID from metadata
        if (!matchedCustomer && metadata.topLevelCustomerId && idMap.has(metadata.topLevelCustomerId)) {
          matchedCustomer = idMap.get(metadata.topLevelCustomerId);
          matchType = "MetadataTopLevel";
          byMetadataCount++;
        }
      }
      
      // Strategy 3: Match by phone
      if (!matchedCustomer && sale.customerPhone) {
        const normalizedSalePhone = normalizePhone(sale.customerPhone);
        if (normalizedSalePhone && phoneMap.has(normalizedSalePhone)) {
          matchedCustomer = phoneMap.get(normalizedSalePhone);
          matchType = "Phone";
          byPhoneCount++;
        }
      }
      
      // Strategy 4: Match by email
      if (!matchedCustomer && sale.customerEmail) {
        const lowerEmail = sale.customerEmail.toLowerCase();
        if (emailMap.has(lowerEmail)) {
          matchedCustomer = emailMap.get(lowerEmail);
          matchType = "Email";
          byEmailCount++;
        }
      }
      
      // Strategy 5: Match by name (exact match, less reliable)
      if (!matchedCustomer && sale.customerName && sale.customerName !== "Unknown") {
        const lowerName = sale.customerName.toLowerCase().trim();
        if (nameMap.has(lowerName)) {
          matchedCustomer = nameMap.get(lowerName);
          matchType = "Name";
          byNameCount++;
        }
      }
      
      // Update the sale if we found a match
      if (matchedCustomer) {
        await db.update(salesTransactions)
          .set({
            posCustomerId: matchedCustomer.id,
            // Update customerId to the correct external ID
            customerId: matchedCustomer.externalCustomerId,
            customerName: matchedCustomer.name,
            customerEmail: matchedCustomer.email || sale.customerEmail,
            customerPhone: matchedCustomer.phone || matchedCustomer.mobile || sale.customerPhone,
          })
          .where(eq(salesTransactions.id, sale.id));
        
        updatedCount++;
        
        if (updatedCount <= 10) {
          console.log(`✓ [${matchType}] Linked sale ${sale.transactionId} to customer ${matchedCustomer.name}`);
        }
      }
    }
    
    const unlinked = allSales.length - updatedCount - allSales.filter(s => s.posCustomerId).length;
    console.log(`✅ Re-linking complete: Updated ${updatedCount} sales (ID: ${byIdCount}, Metadata: ${byMetadataCount}, Phone: ${byPhoneCount}, Email: ${byEmailCount}, Name: ${byNameCount})`);
    console.log(`   Remaining unlinked: ${unlinked} sales`);
    
    return { 
      updated: updatedCount, 
      total: allSales.length, 
      byId: byIdCount, 
      byMetadata: byMetadataCount,
      byPhone: byPhoneCount, 
      byEmail: byEmailCount, 
      byName: byNameCount 
    };
  }

  /**
   * Force re-sync: Delete all existing sales and re-fetch from Lightspeed API
   * This is needed when sales were synced without customer_id being captured
   */
  async forceResyncSales(
    integration: typeof posIntegrations.$inferSelect,
    daysBack: number = 90,
  ): Promise<{ deleted: number; synced: number; linked: number }> {
    console.log(`🔄 Force re-sync: Deleting all sales for integration ${integration.id}...`);
    
    // Delete all existing sales for this integration
    const deleteResult = await db.delete(salesTransactions)
      .where(eq(salesTransactions.posIntegrationId, integration.id));
    
    const deletedCount = deleteResult.rowCount || 0;
    console.log(`🗑️ Deleted ${deletedCount} existing sales`);
    
    // Now sync from scratch with a date range
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - daysBack);
    
    console.log(`📥 Re-syncing sales from ${dateFrom.toISOString()}...`);
    const syncedCount = await this.syncSales(integration, dateFrom);
    
    // After syncing, count how many have customer links
    const linkedSales = await db.query.salesTransactions.findMany({
      where: and(
        eq(salesTransactions.posIntegrationId, integration.id),
      ),
    });
    
    const linkedCount = linkedSales.filter(s => s.posCustomerId !== null).length;
    
    console.log(`✅ Force re-sync complete: Deleted ${deletedCount}, Synced ${syncedCount}, Linked ${linkedCount}`);
    
    return { deleted: deletedCount, synced: syncedCount, linked: linkedCount };
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
