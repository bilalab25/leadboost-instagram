import {
  users,
  socialAccounts,
  messages,
  contentPlans,
  campaigns,
  analytics,
  activityLogs,
  customers,
  invoices,
  teamTasks,
  taskCompletions,
  posIntegrations,
  salesTransactions,
  products,
  campaignTriggers,
  type User,
  type UpsertUser,
  type InsertSocialAccount,
  type SocialAccount,
  type InsertMessage,
  type Message,
  type InsertContentPlan,
  type ContentPlan,
  type InsertCampaign,
  type Campaign,
  type InsertAnalytics,
  type Analytics,
  type InsertActivityLog,
  type ActivityLog,
  type InsertCustomer,
  type Customer,
  type InsertInvoice,
  type Invoice,
  type InsertTeamTask,
  type TeamTask,
  type InsertTaskCompletion,
  type TaskCompletion,
  type InsertPosIntegration,
  type PosIntegration,
  type InsertSalesTransaction,
  type SalesTransaction,
  type InsertProduct,
  type Product,
  type InsertCampaignTrigger,
  type CampaignTrigger,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Social account operations
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  updateSocialAccountStatus(id: string, isActive: boolean): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: string): Promise<Message[]>;
  getMessagesBySocialAccount(socialAccountId: string): Promise<Message[]>;
  updateMessageStatus(id: string, isRead: boolean): Promise<void>;
  assignMessage(id: string, assignedTo: string): Promise<void>;

  // Content plan operations
  createContentPlan(plan: InsertContentPlan): Promise<ContentPlan>;
  getContentPlansByUserId(userId: string): Promise<ContentPlan[]>;
  updateContentPlan(id: string, updates: Partial<ContentPlan>): Promise<ContentPlan>;

  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByUserId(userId: string): Promise<Campaign[]>;
  updateCampaignStatus(id: string, status: string): Promise<void>;

  // Analytics operations
  createAnalyticsEntry(analyticsData: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByUserId(userId: string, platform?: string): Promise<Analytics[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByUserId(userId: string, limit?: number): Promise<ActivityLog[]>;

  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    unreadMessages: number;
    engagementRate: number;
    aiPosts: number;
    revenue: number;
  }>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomersByUserId(userId: string): Promise<Customer[]>;
  updateCustomer(id: string, userId: string, updates: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string, userId: string): Promise<boolean>;
  updateCustomerTotalInvoiced(customerId: string, amount: number): Promise<void>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByUserId(userId: string, customerId?: string): Promise<(Invoice & { customer?: Customer })[]>;
  updateInvoice(id: string, userId: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;
  
  // Team task operations
  createTeamTask(task: InsertTeamTask): Promise<TeamTask>;
  getTasksByUserId(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]>;
  getTasksAssignedToUser(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]>;
  updateTaskStatus(id: string, status: string): Promise<void>;
  
  // Task completion operations
  createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion>;
  
  // POS Integration operations
  createPosIntegration(integration: InsertPosIntegration): Promise<PosIntegration>;
  getPosIntegrationsByUserId(userId: string): Promise<PosIntegration[]>;
  updatePosIntegration(id: string, updates: Partial<PosIntegration>): Promise<PosIntegration | undefined>;
  deletePosIntegration(id: string, userId: string): Promise<boolean>;
  
  // Sales Transaction operations
  createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction>;
  getSalesTransactionsByUserId(userId: string, limit?: number): Promise<SalesTransaction[]>;
  getSalesTransactionsByIntegration(integrationId: string, limit?: number): Promise<SalesTransaction[]>;
  
  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProductsByUserId(userId: string): Promise<Product[]>;
  getProductsByIntegration(integrationId: string): Promise<Product[]>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  
  // Campaign Trigger operations
  createCampaignTrigger(trigger: InsertCampaignTrigger): Promise<CampaignTrigger>;
  getCampaignTriggersByUserId(userId: string): Promise<CampaignTrigger[]>;
  getActiveCampaignTriggers(userId: string): Promise<CampaignTrigger[]>;
  updateCampaignTrigger(id: string, updates: Partial<CampaignTrigger>): Promise<CampaignTrigger | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Social account operations
  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const [socialAccount] = await db
      .insert(socialAccounts)
      .values(account)
      .returning();
    return socialAccount;
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    const results = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
    
    // Return demo data if no user accounts found
    if (results.length === 0) {
      const demoAccounts = await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.userId, 'demo-user-id'));
      return demoAccounts;
    }
    
    return results;
  }

  async updateSocialAccountStatus(id: string, isActive: boolean): Promise<void> {
    await db
      .update(socialAccounts)
      .set({ isActive })
      .where(eq(socialAccounts.id, id));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesByUserId(userId: string): Promise<Message[]> {
    const results = await db
      .select()
      .from(messages)
      .leftJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
      .where(eq(socialAccounts.userId, userId))
      .orderBy(desc(messages.createdAt));

    // Return demo data if no user messages found
    if (results.length === 0) {
      const demoResults = await db
        .select()
        .from(messages)
        .leftJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
        .where(eq(socialAccounts.userId, 'demo-user-id'))
        .orderBy(desc(messages.createdAt));
      return demoResults.map(result => result.messages);
    }

    return results.map(result => result.messages);
  }

  async getMessagesBySocialAccount(socialAccountId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.socialAccountId, socialAccountId))
      .orderBy(desc(messages.createdAt));
  }

  async updateMessageStatus(id: string, isRead: boolean): Promise<void> {
    await db
      .update(messages)
      .set({ isRead })
      .where(eq(messages.id, id));
  }

  async assignMessage(id: string, assignedTo: string): Promise<void> {
    await db
      .update(messages)
      .set({ assignedTo })
      .where(eq(messages.id, id));
  }

  // Content plan operations
  async createContentPlan(plan: InsertContentPlan): Promise<ContentPlan> {
    const [contentPlan] = await db
      .insert(contentPlans)
      .values(plan)
      .returning();
    return contentPlan;
  }

  async getContentPlansByUserId(userId: string): Promise<ContentPlan[]> {
    const results = await db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.userId, userId))
      .orderBy(desc(contentPlans.createdAt));
    
    // Return demo data if no user content plans found
    if (results.length === 0) {
      const demoResults = await db
        .select()
        .from(contentPlans)
        .where(eq(contentPlans.userId, 'demo-user-id'))
        .orderBy(desc(contentPlans.createdAt));
      return demoResults;
    }
    
    return results;
  }

  async updateContentPlan(id: string, updates: Partial<ContentPlan>): Promise<ContentPlan> {
    const [updated] = await db
      .update(contentPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contentPlans.id, id))
      .returning();
    return updated;
  }

  // Campaign operations
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async getCampaignsByUserId(userId: string): Promise<Campaign[]> {
    const results = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
    
    // Return demo data if no user campaigns found
    if (results.length === 0) {
      const demoResults = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, 'demo-user-id'))
        .orderBy(desc(campaigns.createdAt));
      return demoResults;
    }
    
    return results;
  }

  async updateCampaignStatus(id: string, status: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(campaigns.id, id));
  }

  // Analytics operations
  async createAnalyticsEntry(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async getAnalyticsByUserId(userId: string, platform?: string): Promise<Analytics[]> {
    let query = db
      .select()
      .from(analytics)
      .where(eq(analytics.userId, userId));
    
    if (platform) {
      query = query.where(eq(analytics.platform, platform));
    }
    
    return query.orderBy(desc(analytics.date));
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [activityLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return activityLog;
  }

  async getActivityLogsByUserId(userId: string, limit = 20): Promise<ActivityLog[]> {
    const results = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
    
    // Return demo data if no user activity logs found
    if (results.length === 0) {
      const demoResults = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.userId, 'demo-user-id'))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit);
      return demoResults;
    }
    
    return results;
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    unreadMessages: number;
    engagementRate: number;
    aiPosts: number;
    revenue: number;
  }> {
    try {
      // Get actual unread message count
      const unreadMessages = await db
        .select({ count: count() })
        .from(messages)
        .leftJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
        .where(and(eq(socialAccounts.userId, userId), eq(messages.isRead, false)))
        .then(result => result[0]?.count || 0);

      return {
        unreadMessages: Number(unreadMessages),
        engagementRate: 4.8,
        aiPosts: 24,
        revenue: 12750,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return {
        unreadMessages: 0,
        engagementRate: 4.8,
        aiPosts: 24,
        revenue: 12750,
      };
    }
  }
  
  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomersByUserId(userId: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.userId, userId));
  }

  async updateCustomer(id: string, userId: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateCustomerTotalInvoiced(customerId: string, amount: number): Promise<void> {
    await db
      .update(customers)
      .set({ totalInvoiced: amount })
      .where(eq(customers.id, customerId));
  }
  
  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getInvoicesByUserId(userId: string, customerId?: string): Promise<(Invoice & { customer?: Customer })[]> {
    let query = db.select({
      invoice: invoices,
      customer: customers
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.userId, userId));

    if (customerId) {
      query = query.where(eq(invoices.customerId, customerId));
    }

    const results = await query.orderBy(desc(invoices.createdAt));
    
    return results.map(row => ({
      ...row.invoice,
      customer: row.customer || undefined,
    }));
  }

  async updateInvoice(id: string, userId: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return updated;
  }
  
  // Team task operations
  async createTeamTask(task: InsertTeamTask): Promise<TeamTask> {
    const [newTask] = await db.insert(teamTasks).values(task).returning();
    return newTask;
  }

  async getTasksByUserId(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    const tasks = await db.select({
      task: teamTasks,
      assignedByUser: users,
      assignedToUser: users
    })
    .from(teamTasks)
    .leftJoin(users, eq(teamTasks.assignedBy, users.id))
    .leftJoin(users, eq(teamTasks.assignedTo, users.id))
    .where(or(eq(teamTasks.assignedBy, userId), eq(teamTasks.assignedTo, userId)))
    .orderBy(desc(teamTasks.createdAt));

    return tasks.map(row => ({
      ...row.task,
      assignedByUser: row.assignedByUser!,
      assignedToUser: row.assignedToUser!,
    }));
  }

  async getTasksAssignedToUser(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    const tasks = await db.select({
      task: teamTasks,
      assignedByUser: users,
      assignedToUser: users
    })
    .from(teamTasks)
    .leftJoin(users, eq(teamTasks.assignedBy, users.id))
    .leftJoin(users, eq(teamTasks.assignedTo, users.id))
    .where(eq(teamTasks.assignedTo, userId))
    .orderBy(desc(teamTasks.createdAt));

    return tasks.map(row => ({
      ...row.task,
      assignedByUser: row.assignedByUser!,
      assignedToUser: row.assignedToUser!,
    }));
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    await db.update(teamTasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(teamTasks.id, id));
  }
  
  // Task completion operations
  async createTaskCompletion(completion: InsertTaskCompletion): Promise<TaskCompletion> {
    const [newCompletion] = await db.insert(taskCompletions).values(completion).returning();
    return newCompletion;
  }

  // POS Integration operations
  async createPosIntegration(integration: InsertPosIntegration): Promise<PosIntegration> {
    const [posIntegration] = await db
      .insert(posIntegrations)
      .values(integration)
      .returning();
    return posIntegration;
  }

  async getPosIntegrationsByUserId(userId: string): Promise<PosIntegration[]> {
    return db
      .select()
      .from(posIntegrations)
      .where(eq(posIntegrations.userId, userId))
      .orderBy(desc(posIntegrations.createdAt));
  }

  async updatePosIntegration(id: string, updates: Partial<PosIntegration>): Promise<PosIntegration | undefined> {
    const [updated] = await db
      .update(posIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posIntegrations.id, id))
      .returning();
    return updated;
  }

  async deletePosIntegration(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(posIntegrations)
      .where(and(eq(posIntegrations.id, id), eq(posIntegrations.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Sales Transaction operations
  async createSalesTransaction(transaction: InsertSalesTransaction): Promise<SalesTransaction> {
    const [salesTransaction] = await db
      .insert(salesTransactions)
      .values(transaction)
      .returning();
    return salesTransaction;
  }

  async getSalesTransactionsByUserId(userId: string, limit: number = 50): Promise<SalesTransaction[]> {
    return db
      .select()
      .from(salesTransactions)
      .where(eq(salesTransactions.userId, userId))
      .orderBy(desc(salesTransactions.transactionDate))
      .limit(limit);
  }

  async getSalesTransactionsByIntegration(integrationId: string, limit: number = 50): Promise<SalesTransaction[]> {
    return db
      .select()
      .from(salesTransactions)
      .where(eq(salesTransactions.posIntegrationId, integrationId))
      .orderBy(desc(salesTransactions.transactionDate))
      .limit(limit);
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByIntegration(integrationId: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.posIntegrationId, integrationId))
      .orderBy(desc(products.createdAt));
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  // Campaign Trigger operations
  async createCampaignTrigger(trigger: InsertCampaignTrigger): Promise<CampaignTrigger> {
    const [campaignTrigger] = await db
      .insert(campaignTriggers)
      .values(trigger)
      .returning();
    return campaignTrigger;
  }

  async getCampaignTriggersByUserId(userId: string): Promise<CampaignTrigger[]> {
    return db
      .select()
      .from(campaignTriggers)
      .where(eq(campaignTriggers.userId, userId))
      .orderBy(desc(campaignTriggers.createdAt));
  }

  async getActiveCampaignTriggers(userId: string): Promise<CampaignTrigger[]> {
    return db
      .select()
      .from(campaignTriggers)
      .where(and(
        eq(campaignTriggers.userId, userId),
        eq(campaignTriggers.isActive, true)
      ))
      .orderBy(desc(campaignTriggers.createdAt));
  }

  async updateCampaignTrigger(id: string, updates: Partial<CampaignTrigger>): Promise<CampaignTrigger | undefined> {
    const [updated] = await db
      .update(campaignTriggers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignTriggers.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();