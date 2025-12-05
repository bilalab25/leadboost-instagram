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

  async syncSales(
    integration: typeof posIntegrations.$inferSelect,
    dateFrom?: Date,
  ): Promise<number> {
    const accessToken = await this.getValidAccessToken(integration);
    const domainPrefix = (integration.settings as any)?.domainPrefix;

    if (!domainPrefix) {
      throw new Error("Domain prefix not found");
    }

    let effectiveDateFrom: Date;

    if (dateFrom) {
      // Use provided date
      effectiveDateFrom = dateFrom;
      console.log("Using provided date for sync");
    } else {
      // Check for the most recent sale we already have for this integration
      const mostRecentSale = await db.query.salesTransactions.findFirst({
        where: eq(salesTransactions.posIntegrationId, integration.id),
        orderBy: [desc(salesTransactions.transactionDate)],
      });

      if (mostRecentSale?.transactionDate) {
        // Use the most recent sale date minus 1 hour buffer (to avoid missing any)
        effectiveDateFrom = new Date(mostRecentSale.transactionDate.getTime() - 60 * 60 * 1000);
        console.log(`Incremental sync: found ${mostRecentSale.transactionId}, syncing from ${effectiveDateFrom.toISOString()}`);
      } else {
        // No existing sales - default to current month (start of month)
        const now = new Date();
        effectiveDateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        console.log("Initial sync: no existing sales, fetching current month");
      }
    }

    // Format date for Lightspeed API (UTC ISO format)
    const dateFromStr = effectiveDateFrom.toISOString().replace(/\.\d{3}Z$/, 'Z');
    
    console.log(`Syncing sales from: ${dateFromStr} using /api/2.0/search endpoint`);

    // Pre-fetch all customers for this integration to enable linking
    const posCustomersList = await db.query.posCustomers.findMany({
      where: eq(posCustomers.posIntegrationId, integration.id),
    });
    const customerMap = new Map(
      posCustomersList.map((c) => [c.externalCustomerId, c.id]),
    );

    let syncedCount = 0;
    let inlineCustomersCreated = 0;
    let offset = 0;
    let hasMorePages = true;
    let totalFetched = 0;
    const pageSize = 500; // Search endpoint allows up to 1000
    const maxPages = 20; // Safety limit
    let pageCount = 0;

    // Also build lookup maps by other fields for fallback matching
    const customerByCodeMap = new Map<string, string>();
    const customerByPhoneMap = new Map<string, string>();
    const customerByNameMap = new Map<string, { id: string; name: string }>();
    
    for (const customer of posCustomersList) {
      if (customer.customerCode) {
        customerByCodeMap.set(customer.customerCode, customer.id);
      }
      // Normalize phone numbers for matching
      const normalizePhone = (p: string | null | undefined) => p?.replace(/\D/g, '').slice(-10) || '';
      const phone = normalizePhone(customer.phone);
      const mobile = normalizePhone(customer.mobile);
      if (phone.length >= 10) customerByPhoneMap.set(phone, customer.id);
      if (mobile.length >= 10) customerByPhoneMap.set(mobile, customer.id);
      // Name-based lookup (exact match, lowercase)
      if (customer.name && customer.name !== "Unknown") {
        customerByNameMap.set(customer.name.toLowerCase().trim(), { id: customer.id, name: customer.name });
      }
    }
    
    console.log(`Customer lookup maps: ID=${customerMap.size}, Code=${customerByCodeMap.size}, Phone=${customerByPhoneMap.size}, Name=${customerByNameMap.size}`);

    while (hasMorePages && pageCount < maxPages) {
      pageCount++;
      
      // Use the search endpoint with date filtering
      const params = new URLSearchParams();
      params.set("type", "sales");
      params.set("date_from", dateFromStr);
      params.set("page_size", String(pageSize));
      params.set("offset", String(offset));
      params.set("order_direction", "desc");

      const url = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/search?${params.toString()}`;
      console.log(`Fetching sales page ${pageCount} (offset: ${offset})...`);

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
      
      totalFetched += sales.length;
      console.log(`Page ${pageCount}: Found ${sales.length} sales (total: ${totalFetched})`);
      
      // Log first 3 raw sale objects to see structure (including customer fields)
      if (pageCount === 1 && sales.length > 0) {
        console.log("=== RAW SALE OBJECTS FROM LIGHTSPEED (first 3) ===");
        for (let i = 0; i < Math.min(3, sales.length); i++) {
          const rawSale = sales[i] as any;
          console.log(`\n--- Sale #${i + 1} (ID: ${rawSale.id}) ---`);
          console.log("All keys:", Object.keys(rawSale));
          console.log("customer field:", JSON.stringify(rawSale.customer, null, 2));
          console.log("customer_id field:", rawSale.customer_id);
          console.log("customerId field:", rawSale.customerId);
          console.log("buyer field:", rawSale.buyer);
          console.log("Full sale object:", JSON.stringify(rawSale, null, 2));
        }
        console.log("=== END RAW SALE OBJECTS ===\n");
      }

      for (const sale of sales) {
        try {
          const existingTransaction = await db.query.salesTransactions.findFirst({
            where: and(
              eq(salesTransactions.posIntegrationId, integration.id),
              eq(salesTransactions.transactionId, sale.id),
            ),
          });

          if (existingTransaction) continue;

          // Lightspeed API has TWO customer ID formats:
          // - sale.customer_id: A reference/lookup ID (different format, used for searching)
          // - sale.customer.id: The actual customer UUID that matches /customers endpoint
          // The search endpoint often doesn't include the full customer object, just customer_id
          let nestedCustomerId = sale.customer?.id; // Correct ID (matches /customers)
          const topLevelCustomerId = sale.customer_id; // Reference ID (different format)
          let saleCustomer = sale.customer;
          
          // Track if we have customer data from the sale object
          let hasCustomerData = !!saleCustomer;
          let fetchedCustomerData = false;
          
          // If we have a customer_id but no customer object, try to:
          // 1. Check if this ID exists in our customer map
          // 2. If not, fetch the customer from Lightspeed API to get the canonical UUID
          if (!hasCustomerData && topLevelCustomerId) {
            // First check if this customer_id is in our database (by external ID)
            const existingByTopLevel = customerMap.get(topLevelCustomerId);
            if (existingByTopLevel) {
              // We found a match using the top-level ID - use it
              nestedCustomerId = topLevelCustomerId;
            } else {
              // Try to fetch the customer from Lightspeed to get the canonical ID
              // This is expensive, so we only do it when we can't match otherwise
              try {
                const customerUrl = `https://${domainPrefix}.retail.lightspeed.app/api/2.0/customers/${topLevelCustomerId}`;
                const customerResponse = await fetch(customerUrl, {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                  },
                });
                
                if (customerResponse.ok) {
                  const customerData = await customerResponse.json();
                  const fetchedCustomer = customerData.data;
                  if (fetchedCustomer?.id) {
                    // Use the fetched customer's canonical ID
                    nestedCustomerId = fetchedCustomer.id;
                    saleCustomer = fetchedCustomer;
                    hasCustomerData = true;
                    fetchedCustomerData = true;
                    
                    // Add to customer map for future lookups
                    const existingInMap = customerMap.get(fetchedCustomer.id);
                    if (!existingInMap) {
                      // Also try to match by code/phone/name in existing customers
                      if (fetchedCustomer.customer_code && customerByCodeMap.has(fetchedCustomer.customer_code)) {
                        const matchedId = customerByCodeMap.get(fetchedCustomer.customer_code);
                        if (matchedId) customerMap.set(fetchedCustomer.id, matchedId);
                      }
                    }
                    
                    if (syncedCount < 3) {
                      console.log(`  -> Fetched customer ${fetchedCustomer.id} for sale ${sale.id}`);
                    }
                  }
                }
              } catch (fetchError) {
                // Silently continue - we'll store what we have
                if (syncedCount < 3) {
                  console.log(`  -> Failed to fetch customer for ${topLevelCustomerId}`);
                }
              }
            }
          }
          
          // Use nested ID as the primary external ID (if available)
          // This is the ID that should match pos_customers.external_customer_id
          const correctExternalId = nestedCustomerId;
          const referenceId = topLevelCustomerId; // Save this for correlation
          
          // Look up the internal posCustomer using multiple strategies
          let posCustomerId: string | null = null;
          let matchMethod = "";
          
          // Strategy 1: Match by nested customer ID (the correct one)
          if (correctExternalId) {
            posCustomerId = customerMap.get(correctExternalId) || null;
            if (posCustomerId) matchMethod = "NestedID";
          }
          
          // Strategy 2: Match by top-level customer_id (fallback, might work for some)
          if (!posCustomerId && referenceId) {
            posCustomerId = customerMap.get(referenceId) || null;
            if (posCustomerId) matchMethod = "TopLevelID";
          }
          
          // Strategy 3: Match by customer_code (often a phone number or barcode)
          if (!posCustomerId && saleCustomer?.customer_code) {
            posCustomerId = customerByCodeMap.get(saleCustomer.customer_code) || null;
            if (posCustomerId) matchMethod = "Code";
          }
          
          // Strategy 4: Match by phone number (if customer data available)
          if (!posCustomerId && hasCustomerData) {
            const normalizePhone = (p: string | null | undefined) => p?.replace(/\D/g, '').slice(-10) || '';
            const phone = normalizePhone(saleCustomer?.phone);
            const mobile = normalizePhone(saleCustomer?.mobile);
            if (phone.length >= 10) {
              posCustomerId = customerByPhoneMap.get(phone) || null;
              if (posCustomerId) matchMethod = "Phone";
            }
            if (!posCustomerId && mobile.length >= 10) {
              posCustomerId = customerByPhoneMap.get(mobile) || null;
              if (posCustomerId) matchMethod = "Mobile";
            }
          }
          
          // Strategy 5: Match by name (exact match, less reliable)
          if (!posCustomerId && saleCustomer?.name && saleCustomer.name.trim() !== "") {
            const nameKey = saleCustomer.name.toLowerCase().trim();
            const nameMatch = customerByNameMap.get(nameKey);
            if (nameMatch) {
              posCustomerId = nameMatch.id;
              matchMethod = "Name";
            }
          }
          
          // Log for debugging (first few sales only)
          if (pageCount === 1 && syncedCount < 5) {
            console.log(`Sale ${sale.id}: hasCustomer=${hasCustomerData}, nested.id=${nestedCustomerId}, customer_id=${topLevelCustomerId}, matched by ${matchMethod || 'NONE'}, posCustomerId=${posCustomerId}`);
          }

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

          // Get customer details from our database if we have a linked customer
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
            // Store the nested customer.id (if available) which matches /customers endpoint
            // Fall back to top-level customer_id if nested is not available
            customerId: correctExternalId || referenceId,
            // Use saleCustomer (which may be fetched data) instead of sale.customer
            customerEmail: customerEmail || saleCustomer?.email || sale.customer?.email,
            customerName: customerName || saleCustomer?.name || sale.customer?.name,
            customerPhone: customerPhone || saleCustomer?.phone || saleCustomer?.mobile || sale.customer?.phone || sale.customer?.mobile,
            totalAmount: Math.round((sale.total_price || 0) * 100),
            currency: "USD",
            status: normalizedStatus,
            paymentMethod: sale.payments?.[0] ? "card" : "unknown",
            items: sale.line_items || [],
            metadata: {
              invoiceNumber: sale.invoice_number,
              totalTax: sale.total_tax,
              state: saleState,
              // Store both IDs for correlation/debugging
              nestedCustomerId: nestedCustomerId,
              topLevelCustomerId: topLevelCustomerId,
              matchMethod: matchMethod || null,
              hasCustomerData: hasCustomerData,
              fetchedCustomerData: fetchedCustomerData,
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
        // Less than page_size means we've reached the end
        hasMorePages = false;
      } else {
        // Move to next page
        offset += pageSize;
      }
    }

    console.log(`Sync complete: ${syncedCount} new sales synced from ${totalFetched} total fetched`);
    if (inlineCustomersCreated > 0) {
      console.log(`Created ${inlineCustomersCreated} inline customers from sales data`);
    }
    console.log(`Customer map now has ${customerMap.size} entries`);
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
