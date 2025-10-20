import {
  users,
  brands,
  socialAccounts,
  conversationThreads,
  messages,
  messageAttachments,
  contentPlans,
  campaigns,
  analytics,
  activityLogs,
  customers,
  invoices,
  teamTasks,
  taskCompletions,
  taskApprovals,
  approvalNotifications,
  posIntegrations,
  salesTransactions,
  products,
  campaignTriggers,
  brandDesigns,
  brandAssets,
  campaignDesigns,
  integrations,
  // Asegúrate de que estos tipos en @shared/schema incluyan firebaseUid y hagan password, email, firstName, lastName opcionales/nullable
  type User,
  type UpsertUser, // Asumo que UpsertUser es para operaciones de upsert, no para updateUser
  type InsertUser,
  type InsertBrand,
  type Brand,
  type InsertSocialAccount,
  type SocialAccount,
  type InsertConversationThread,
  type ConversationThread,
  type InsertMessage,
  type Message,
  type InsertMessageAttachment,
  type MessageAttachment,
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
  type InsertTaskApproval,
  type TaskApproval,
  type InsertApprovalNotification,
  type ApprovalNotification,
  type InsertPosIntegration,
  type PosIntegration,
  type InsertSalesTransaction,
  type SalesTransaction,
  type InsertProduct,
  type Product,
  type InsertCampaignTrigger,
  type CampaignTrigger,
  type InsertBrandDesign,
  type BrandDesign,
  type InsertCampaignDesign,
  type CampaignDesign,
  type BrandAsset,
  type InsertBrandAsset,
  type InsertIntegration,
  type Integration,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, sql, gte, lte } from "drizzle-orm";
import { mapFromDb, mapPartialToDb, mapToDb } from "./mappers/brandDesign";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>; // Cambiado de getUserById a getUser
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>; // <-- ¡AÑADIDO/CORREGIDO AQUÍ!

  // Brand operations
  createBrand(brand: InsertBrand): Promise<Brand>;
  getBrandsByUserId(userId: string): Promise<Brand[]>;
  getBrandById(id: string, userId: string): Promise<Brand | undefined>;
  updateBrand(
    id: string,
    userId: string,
    updates: Partial<Brand>,
  ): Promise<Brand | undefined>;
  deleteBrand(id: string, userId: string): Promise<boolean>;

  // Social account operations
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  updateSocialAccount(
    id: string,
    updates: Partial<SocialAccount>,
  ): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: string, userId: string): Promise<boolean>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: string, unreadOnly?: boolean): Promise<Message[]>;
  getMessagesByAccountId(accountId: string): Promise<Message[]>;
  updateMessageStatus(id: string, isRead: boolean): Promise<void>;
  markMessageAsRead(id: string): Promise<void>;
  updateMessagePriority(id: string, priority: string): Promise<void>;
  assignMessage(id: string, assignedTo: string): Promise<void>;

  // Conversation operations
  createConversation(conversation: InsertConversationThread): Promise<ConversationThread>;
  getConversationById(id: string): Promise<ConversationThread | undefined>;
  getConversationsByUserId(userId: string): Promise<ConversationThread[]>;
  updateConversationLastMessage(id: string, preview: string): Promise<void>;

  // Conversation message operations
  createConversationMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;

  // Message attachment operations
  createMessageAttachment(attachment: InsertMessageAttachment): Promise<MessageAttachment>;
  getMessageAttachments(messageId: string): Promise<MessageAttachment[]>;

  // Content plan operations
  createContentPlan(plan: InsertContentPlan): Promise<ContentPlan>;
  getContentPlansByUserId(userId: string): Promise<ContentPlan[]>;
  updateContentPlan(
    id: string,
    userId: string,
    updates: Partial<ContentPlan>,
  ): Promise<ContentPlan | undefined>;
  deleteContentPlan(id: string, userId: string): Promise<boolean>;

  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByUserId(userId: string): Promise<Campaign[]>;
  updateCampaign(
    id: string,
    userId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign | undefined>;
  updateCampaignStatus(id: string, status: string): Promise<void>;
  deleteCampaign(id: string, userId: string): Promise<boolean>;

  // Analytics operations
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  createAnalyticsEntry(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByUserId(userId: string, days?: number): Promise<Analytics[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByUserId(
    userId: string,
    limit?: number,
  ): Promise<ActivityLog[]>;

  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomersByUserId(userId: string): Promise<Customer[]>;
  updateCustomer(
    id: string,
    userId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined>;
  updateCustomerTotalInvoiced(
    customerId: string,
    amount: number,
  ): Promise<void>;
  deleteCustomer(id: string, userId: string): Promise<boolean>;

  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByUserId(
    userId: string,
    customerId?: string,
  ): Promise<(Invoice & { customer?: Customer })[]>;
  updateInvoice(
    id: string,
    userId: string,
    updates: Partial<Invoice>,
  ): Promise<Invoice | undefined>;

  // Team task operations
  createTeamTask(task: InsertTeamTask): Promise<TeamTask>;
  getTasksByUserId(
    userId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]>;
  getTasksAssignedToUser(
    userId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]>;
  updateTaskStatus(id: string, status: string): Promise<void>;

  // Task completion operations
  createTaskCompletion(
    completion: InsertTaskCompletion,
  ): Promise<TaskCompletion>;

  // Team hierarchy operations
  getUsersByHierarchyLevel(level: number): Promise<User[]>;
  getUsersWithApprovalRights(minLevel?: number): Promise<User[]>;
  getSubordinates(managerId: string): Promise<User[]>;
  updateUserHierarchy(
    userId: string,
    updates: {
      hierarchyLevel?: number;
      canApprove?: boolean;
      reportsTo?: string;
    },
  ): Promise<User | undefined>;

  // Task approval workflow operations
  submitTaskProof(
    taskId: string,
    proofFileUrl: string,
    submittedBy: string,
  ): Promise<void>;
  createTaskApproval(approval: InsertTaskApproval): Promise<TaskApproval>;
  getTaskApprovalsById(taskId: string): Promise<TaskApproval[]>;
  approveTask(
    approvalId: string,
    approverId: string,
    comments?: string,
  ): Promise<void>;
  rejectTask(
    approvalId: string,
    approverId: string,
    comments: string,
  ): Promise<void>;
  finalizeTaskApproval(taskId: string, approvedBy: string): Promise<void>;
  rejectTaskFinal(
    taskId: string,
    approvedBy: string,
    rejectionReason: string,
  ): Promise<void>;

  // Notification operations
  createApprovalNotification(
    notification: InsertApprovalNotification,
  ): Promise<ApprovalNotification>;
  getNotificationsByUserId(
    userId: string,
    unreadOnly?: boolean,
  ): Promise<ApprovalNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  getTasksPendingApproval(
    approverId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]>;

  // POS operations
  createPosIntegration(
    integration: InsertPosIntegration,
  ): Promise<PosIntegration>;
  getPosIntegrationsByUserId(userId: string): Promise<PosIntegration[]>;
  updatePosIntegration(
    id: string,
    updates: Partial<PosIntegration>,
  ): Promise<PosIntegration | undefined>;
  deletePosIntegration(id: string, userId: string): Promise<boolean>;

  // Sales Transaction operations
  createSalesTransaction(
    transaction: InsertSalesTransaction,
  ): Promise<SalesTransaction>;
  getSalesTransactionsByUserId(
    userId: string,
    limit?: number,
  ): Promise<SalesTransaction[]>;
  getSalesTransactionsByIntegration(
    integrationId: string,
    limit?: number,
  ): Promise<SalesTransaction[]>;

  // Product operations
  createProduct(product: InsertProduct): Promise<Product>;
  getProductsByUserId(userId: string): Promise<Product[]>;
  updateProduct(
    id: string,
    userId: string,
    updates: Partial<Product>,
  ): Promise<Product | undefined>;
  deleteProduct(id: string, userId: string): Promise<boolean>;

  // Campaign trigger operations
  createCampaignTrigger(
    trigger: InsertCampaignTrigger,
  ): Promise<CampaignTrigger>;
  getCampaignTriggersByUserId(userId: string): Promise<CampaignTrigger[]>;
  updateCampaignTrigger(
    id: string,
    userId: string,
    updates: Partial<CampaignTrigger>,
  ): Promise<CampaignTrigger | undefined>;
  deleteCampaignTrigger(id: string, userId: string): Promise<boolean>;

  // Chatbot operations
  getChatbotConfigs(brandId: string): Promise<any[]>;
  createChatbotConfig(config: any): Promise<any>;
  getCalendarIntegrations(brandId: string): Promise<any[]>;
  createCalendarIntegration(integration: any): Promise<any>;
  getAppointments(brandId: string): Promise<any[]>;

  // Brand design operations
  createBrandDesign(design: InsertBrandDesign): Promise<BrandDesign>;
  getBrandDesignByUserId(userId: string): Promise<BrandDesign | undefined>;
  updateBrandDesign(
    id: string,
    userId: string,
    updates: Partial<BrandDesign>,
  ): Promise<BrandDesign | undefined>;
  deleteBrandDesign(id: string, userId: string): Promise<boolean>;

  // Campaign design operations
  createCampaignDesign(design: InsertCampaignDesign): Promise<CampaignDesign>;
  getCampaignDesignsByCampaignId(campaignId: string): Promise<CampaignDesign[]>;
  updateCampaignDesign(
    id: string,
    updates: Partial<CampaignDesign>,
  ): Promise<CampaignDesign | undefined>;
  deleteCampaignDesign(id: string, campaignId: string): Promise<boolean>;

  // Integration operations
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  getIntegrationsByUserId(userId: string): Promise<Integration[]>;
  getIntegrationById(id: string): Promise<Integration | undefined>;
  getIntegrationByPageId(
    pageId: string,
    userId: string,
  ): Promise<Integration | undefined>;
  updateIntegration(
    id: string,
    updates: Partial<Integration>,
  ): Promise<Integration | undefined>;
  deleteIntegration(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
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

  // <-- ¡AÑADIDO/CORREGIDO AQUÍ!
  async updateUser(
    id: string,
    updates: Partial<User>,
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  // FIN DE LA CORRECCIÓN

  // Brand operations
  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async getBrandsByUserId(userId: string): Promise<Brand[]> {
    return db
      .select()
      .from(brands)
      .where(eq(brands.userId, userId))
      .orderBy(desc(brands.createdAt));
  }

  async getBrandById(id: string, userId: string): Promise<Brand | undefined> {
    const [brand] = await db
      .select()
      .from(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, userId)));
    return brand;
  }

  async updateBrand(
    id: string,
    userId: string,
    updates: Partial<Brand>,
  ): Promise<Brand | undefined> {
    const [updated] = await db
      .update(brands)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(brands.id, id), eq(brands.userId, userId)))
      .returning();
    return updated;
  }

  async deleteBrand(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(brands)
      .where(and(eq(brands.id, id), eq(brands.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Social account operations
  async createSocialAccount(
    account: InsertSocialAccount,
  ): Promise<SocialAccount> {
    const [newAccount] = await db
      .insert(socialAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
  }

  async updateSocialAccount(
    id: string,
    updates: Partial<SocialAccount>,
  ): Promise<SocialAccount | undefined> {
    const [updated] = await db
      .update(socialAccounts)
      .set(updates)
      .where(eq(socialAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteSocialAccount(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(socialAccounts)
      .where(and(eq(socialAccounts.id, id), eq(socialAccounts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByUserId(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<Message[]> {
    const whereConditions = [eq(socialAccounts.userId, userId)];
    if (unreadOnly) {
      whereConditions.push(eq(messages.isRead, false));
    }

    const query = db
      .select()
      .from(messages)
      .innerJoin(
        socialAccounts,
        eq(messages.socialAccountId, socialAccounts.id),
      )
      .where(and(...whereConditions));

    const results = await query.orderBy(desc(messages.createdAt));
    return results.map((row) => row.messages);
  }

  async getMessagesByAccountId(accountId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.socialAccountId, accountId))
      .orderBy(desc(messages.createdAt));
  }

  async updateMessageStatus(id: string, isRead: boolean): Promise<void> {
    await db.update(messages).set({ isRead }).where(eq(messages.id, id));
  }

  async assignMessage(id: string, assignedTo: string): Promise<void> {
    await db.update(messages).set({ assignedTo }).where(eq(messages.id, id));
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  async updateMessagePriority(id: string, priority: string): Promise<void> {
    await db.update(messages).set({ priority }).where(eq(messages.id, id));
  }

  // Conversation operations
  async createConversation(
    conversation: InsertConversationThread,
  ): Promise<ConversationThread> {
    const [newConversation] = await db
      .insert(conversationThreads)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversationById(
    id: string,
  ): Promise<ConversationThread | undefined> {
    const [conversation] = await db
      .select()
      .from(conversationThreads)
      .where(eq(conversationThreads.id, id));
    return conversation;
  }

  async getConversationsByUserId(
    userId: string,
  ): Promise<ConversationThread[]> {
    const query = db
      .select()
      .from(conversationThreads)
      .innerJoin(
        socialAccounts,
        eq(conversationThreads.socialAccountId, socialAccounts.id),
      )
      .where(eq(socialAccounts.userId, userId));

    const results = await query.orderBy(desc(conversationThreads.lastMessageAt));
    return results.map((row) => row.conversation_threads);
  }

  async updateConversationLastMessage(
    id: string,
    preview: string,
  ): Promise<void> {
    await db
      .update(conversationThreads)
      .set({ lastMessagePreview: preview, lastMessageAt: new Date() })
      .where(eq(conversationThreads.id, id));
  }

  // Conversation message operations
  async createConversationMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update conversation last message
    if (message.conversationId) {
      await this.updateConversationLastMessage(
        message.conversationId,
        message.content.substring(0, 100),
      );
    }

    return newMessage;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  }

  // Message attachment operations
  async createMessageAttachment(
    attachment: InsertMessageAttachment,
  ): Promise<MessageAttachment> {
    const [newAttachment] = await db
      .insert(messageAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getMessageAttachments(messageId: string): Promise<MessageAttachment[]> {
    return db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId));
  }

  // Content plan operations
  async createContentPlan(plan: InsertContentPlan): Promise<ContentPlan> {
    const [newPlan] = await db.insert(contentPlans).values(plan).returning();
    return newPlan;
  }

  async getContentPlansByUserId(userId: string): Promise<ContentPlan[]> {
    return db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.userId, userId))
      .orderBy(desc(contentPlans.createdAt));
  }

  async updateContentPlan(
    id: string,
    userId: string,
    updates: Partial<ContentPlan>,
  ): Promise<ContentPlan | undefined> {
    const [updated] = await db
      .update(contentPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contentPlans.id, id), eq(contentPlans.userId, userId)))
      .returning();
    return updated;
  }

  async deleteContentPlan(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(contentPlans)
      .where(and(eq(contentPlans.id, id), eq(contentPlans.userId, userId)));
    return (result.rowCount ?? 0) > 0;
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
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async updateCampaign(
    id: string,
    userId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateCampaignStatus(id: string, status: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(eq(campaigns.id, id));
  }

  // Analytics operations
  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async getAnalyticsByUserId(
    userId: string,
    days: number = 30,
  ): Promise<Analytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(analytics)
      .where(
        and(eq(analytics.userId, userId), gte(analytics.createdAt, startDate)),
      )
      .orderBy(desc(analytics.createdAt));
  }

  async createAnalyticsEntry(
    analyticsData: InsertAnalytics,
  ): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getActivityLogsByUserId(
    userId: string,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async getCustomersByUserId(userId: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(desc(customers.createdAt));
  }

  async updateCustomer(
    id: string,
    userId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined> {
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
    return (result.rowCount ?? 0) > 0;
  }

  async updateCustomerTotalInvoiced(
    customerId: string,
    amount: number,
  ): Promise<void> {
    await db
      .update(customers)
      .set({
        totalInvoiced: sql`${customers.totalInvoiced} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getInvoicesByUserId(
    userId: string,
    customerId?: string,
  ): Promise<(Invoice & { customer?: Customer })[]> {
    const whereConditions = [eq(invoices.userId, userId)];
    if (customerId) {
      whereConditions.push(eq(invoices.customerId, customerId));
    }

    const query = db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(and(...whereConditions));

    const results = await query.orderBy(desc(invoices.createdAt));

    return results.map((row) => ({
      ...row.invoice,
      customer: row.customer || undefined,
    }));
  }

  async updateInvoice(
    id: string,
    userId: string,
    updates: Partial<Invoice>,
  ): Promise<Invoice | undefined> {
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

  async getTasksByUserId(
    userId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    const tasks = await db
      .select({
        task: teamTasks,
        assignedByUser: users,
        assignedToUser: users,
      })
      .from(teamTasks)
      .leftJoin(users, eq(teamTasks.assignedBy, users.id))
      .leftJoin(users, eq(teamTasks.assignedTo, users.id))
      .where(
        or(eq(teamTasks.assignedBy, userId), eq(teamTasks.assignedTo, userId)),
      )
      .orderBy(desc(teamTasks.createdAt));

    return tasks.map((row) => ({
      ...row.task,
      assignedByUser: row.assignedByUser!,
      assignedToUser: row.assignedToUser!,
    }));
  }

  async getTasksAssignedToUser(
    userId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    const tasks = await db
      .select({
        task: teamTasks,
        assignedByUser: users,
        assignedToUser: users,
      })
      .from(teamTasks)
      .leftJoin(users, eq(teamTasks.assignedBy, users.id))
      .leftJoin(users, eq(teamTasks.assignedTo, users.id))
      .where(eq(teamTasks.assignedTo, userId))
      .orderBy(desc(teamTasks.createdAt));

    return tasks.map((row) => ({
      ...row.task,
      assignedByUser: row.assignedByUser!,
      assignedTo: row.assignedToUser!, // Corregido: assignedToUser
    }));
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    await db
      .update(teamTasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(teamTasks.id, id));
  }

  // Task completion operations
  async createTaskCompletion(
    completion: InsertTaskCompletion,
  ): Promise<TaskCompletion> {
    const [newCompletion] = await db
      .insert(taskCompletions)
      .values(completion)
      .returning();
    return newCompletion;
  }

  // Team hierarchy operations
  async getUsersByHierarchyLevel(level: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.hierarchyLevel, level));
  }

  async getUsersWithApprovalRights(minLevel?: number): Promise<User[]> {
    const whereConditions = [eq(users.canApprove, true)];
    if (minLevel) {
      whereConditions.push(lte(users.hierarchyLevel, minLevel));
    }
    return db
      .select()
      .from(users)
      .where(and(...whereConditions));
  }

  async getSubordinates(managerId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.reportsTo, managerId));
  }

  async updateUserHierarchy(
    userId: string,
    updates: {
      hierarchyLevel?: number;
      canApprove?: boolean;
      reportsTo?: string;
    },
  ): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  // Task approval workflow operations
  async submitTaskProof(
    taskId: string,
    proofFileUrl: string,
    submittedBy: string,
  ): Promise<void> {
    await db
      .update(teamTasks)
      .set({
        proofFileUrl,
        proofSubmittedAt: new Date(),
        proofSubmittedBy: submittedBy,
        approvalStatus: "submitted",
        status: "completed", // Mark task as completed pending approval
        updatedAt: new Date(),
      })
      .where(eq(teamTasks.id, taskId));
  }

  async createTaskApproval(
    approval: InsertTaskApproval,
  ): Promise<TaskApproval> {
    const [newApproval] = await db
      .insert(taskApprovals)
      .values(approval)
      .returning();
    return newApproval;
  }

  async getTaskApprovalsById(taskId: string): Promise<TaskApproval[]> {
    return db
      .select()
      .from(taskApprovals)
      .where(eq(taskApprovals.taskId, taskId))
      .orderBy(desc(taskApprovals.createdAt));
  }

  async approveTask(
    approvalId: string,
    approverId: string,
    comments?: string,
  ): Promise<void> {
    await db
      .update(taskApprovals)
      .set({
        status: "approved",
        approverId,
        comments,
        approvedAt: new Date(),
      })
      .where(eq(taskApprovals.id, approvalId));
  }

  async rejectTask(
    approvalId: string,
    approverId: string,
    comments: string,
  ): Promise<void> {
    await db
      .update(taskApprovals)
      .set({
        status: "rejected",
        approverId,
        comments,
        approvedAt: new Date(),
      })
      .where(eq(taskApprovals.id, approvalId));
  }

  async finalizeTaskApproval(
    taskId: string,
    approvedBy: string,
  ): Promise<void> {
    await db
      .update(teamTasks)
      .set({
        approvalStatus: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teamTasks.id, taskId));
  }

  async rejectTaskFinal(
    taskId: string,
    approvedBy: string,
    rejectionReason: string,
  ): Promise<void> {
    await db
      .update(teamTasks)
      .set({
        approvalStatus: "rejected",
        approvedBy,
        rejectionReason,
        status: "in_progress", // Send back to in progress
        updatedAt: new Date(),
      })
      .where(eq(teamTasks.id, taskId));
  }

  // Notification operations
  async createApprovalNotification(
    notification: InsertApprovalNotification,
  ): Promise<ApprovalNotification> {
    const [newNotification] = await db
      .insert(approvalNotifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUserId(
    userId: string,
    unreadOnly: boolean = false,
  ): Promise<ApprovalNotification[]> {
    const whereConditions = [eq(approvalNotifications.userId, userId)];
    if (unreadOnly) {
      whereConditions.push(eq(approvalNotifications.isRead, false));
    }

    return db
      .select()
      .from(approvalNotifications)
      .where(and(...whereConditions))
      .orderBy(desc(approvalNotifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(approvalNotifications)
      .set({ isRead: true })
      .where(eq(approvalNotifications.id, notificationId));
  }

  async getTasksPendingApproval(
    approverId: string,
  ): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    const tasks = await db
      .select({
        task: teamTasks,
        assignedByUser: users,
        assignedToUser: users,
      })
      .from(teamTasks)
      .leftJoin(users, eq(teamTasks.assignedBy, users.id))
      .leftJoin(users, eq(teamTasks.assignedTo, users.id))
      .where(
        and(
          eq(teamTasks.approvalStatus, "submitted"),
          eq(teamTasks.status, "completed"),
        ),
      )
      .orderBy(desc(teamTasks.proofSubmittedAt));

    return tasks.map((row) => ({
      ...row.task,
      assignedByUser: row.assignedByUser!,
      assignedToUser: row.assignedToUser!,
    }));
  }

  // Continue with remaining methods from original file...
  // POS Integration operations (keeping them from the original)
  async createPosIntegration(
    integration: InsertPosIntegration,
  ): Promise<PosIntegration> {
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

  async updatePosIntegration(
    id: string,
    updates: Partial<PosIntegration>,
  ): Promise<PosIntegration | undefined> {
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
      .where(
        and(eq(posIntegrations.id, id), eq(posIntegrations.userId, userId)),
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Sales Transaction operations
  async createSalesTransaction(
    transaction: InsertSalesTransaction,
  ): Promise<SalesTransaction> {
    const [salesTransaction] = await db
      .insert(salesTransactions)
      .values(transaction)
      .returning();
    return salesTransaction;
  }

  async getSalesTransactionsByUserId(
    userId: string,
    limit: number = 50,
  ): Promise<SalesTransaction[]> {
    return db
      .select()
      .from(salesTransactions)
      .where(eq(salesTransactions.userId, userId))
      .orderBy(desc(salesTransactions.transactionDate))
      .limit(limit);
  }

  async getSalesTransactionsByIntegration(
    integrationId: string,
    limit: number = 50,
  ): Promise<SalesTransaction[]> {
    return db
      .select()
      .from(salesTransactions)
      .where(eq(salesTransactions.posIntegrationId, integrationId))
      .orderBy(desc(salesTransactions.transactionDate))
      .limit(limit);
  }

  // Product operations
  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProductsByUserId(userId: string): Promise<Product[]> {
    return db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async updateProduct(
    id: string,
    userId: string,
    updates: Partial<Product>,
  ): Promise<Product | undefined> {
    const [updated] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .returning();
    return updated;
  }

  async deleteProduct(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Campaign trigger operations
  async createCampaignTrigger(
    trigger: InsertCampaignTrigger,
  ): Promise<CampaignTrigger> {
    const [campaignTrigger] = await db
      .insert(campaignTriggers)
      .values(trigger)
      .returning();
    return campaignTrigger;
  }

  async getCampaignTriggersByUserId(
    userId: string,
  ): Promise<CampaignTrigger[]> {
    return db
      .select()
      .from(campaignTriggers)
      .where(eq(campaignTriggers.userId, userId))
      .orderBy(desc(campaignTriggers.createdAt));
  }

  async updateCampaignTrigger(
    id: string,
    userId: string,
    updates: Partial<CampaignTrigger>,
  ): Promise<CampaignTrigger | undefined> {
    const [updated] = await db
      .update(campaignTriggers)
      .set({ ...updates, updatedAt: new Date() })
      .where(
        and(eq(campaignTriggers.id, id), eq(campaignTriggers.userId, userId)),
      )
      .returning();
    return updated;
  }

  async deleteCampaignTrigger(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(campaignTriggers)
      .where(
        and(eq(campaignTriggers.id, id), eq(campaignTriggers.userId, userId)),
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Brand design operations
  async createBrandDesign(design: InsertBrandDesign): Promise<BrandDesign> {
    const mapped = mapToDb(design);
    const [brandDesign] = await db
      .insert(brandDesigns)
      .values(mapped)
      .returning();
    return mapFromDb(brandDesign);
  }

  async updateBrandDesign(
    id: string,
    userId: string,
    updates: Partial<BrandDesign>,
  ): Promise<BrandDesign | undefined> {
    const mapped = mapPartialToDb({ ...updates, userId }); // ✅ nuevo mapper parcial
    const [updated] = await db
      .update(brandDesigns)
      .set({ ...mapped, updatedAt: new Date() })
      .where(and(eq(brandDesigns.id, id), eq(brandDesigns.userId, userId)))
      .returning();

    return updated ? mapFromDb(updated) : undefined;
  }

  async getBrandDesignByUserId(
    userId: string,
  ): Promise<BrandDesign | undefined> {
    const [design] = await db
      .select()
      .from(brandDesigns)
      .where(eq(brandDesigns.userId, userId))
      .orderBy(desc(brandDesigns.createdAt))
      .limit(1);

    if (!design) return undefined;
    return mapFromDb(design);
  }

  async deleteBrandDesign(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(brandDesigns)
      .where(and(eq(brandDesigns.id, id), eq(brandDesigns.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Crear asset
  async createBrandAsset(asset: InsertBrandAsset): Promise<BrandAsset> {
    const [newAsset] = await db.insert(brandAssets).values(asset).returning();
    return newAsset;
  }

  // Obtener assets de un BrandDesign
  async getAssetsByBrandDesignId(brandDesignId: string): Promise<BrandAsset[]> {
    console.log("🗄️  getAssetsByBrandDesignId:", brandDesignId);
    return db
      .select()
      .from(brandAssets)
      .where(eq(brandAssets.brandDesignId, brandDesignId))
      .orderBy(desc(brandAssets.createdAt));
  }

  // Eliminar asset
  async deleteBrandAsset(
    id: string,
    brandDesignId: string,
  ): Promise<BrandAsset | undefined> {
    const [deleted] = await db
      .delete(brandAssets)
      .where(
        and(
          eq(brandAssets.id, id),
          eq(brandAssets.brandDesignId, brandDesignId),
        ),
      )
      .returning();
    return deleted;
  }

  // Campaign design operations
  async createCampaignDesign(
    design: InsertCampaignDesign,
  ): Promise<CampaignDesign> {
    const [campaignDesign] = await db
      .insert(campaignDesigns)
      .values(design)
      .returning();
    return campaignDesign;
  }

  async getCampaignDesignsByCampaignId(
    campaignId: string,
  ): Promise<CampaignDesign[]> {
    return db
      .select()
      .from(campaignDesigns)
      .where(eq(campaignDesigns.campaignId, campaignId))
      .orderBy(desc(campaignDesigns.createdAt));
  }

  async updateCampaignDesign(
    id: string,
    updates: Partial<CampaignDesign>,
  ): Promise<CampaignDesign | undefined> {
    const [updated] = await db
      .update(campaignDesigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignDesigns.id, id))
      .returning();
    return updated;
  }

  async deleteCampaignDesign(id: string, campaignId: string): Promise<boolean> {
    const result = await db
      .delete(campaignDesigns)
      .where(
        and(
          eq(campaignDesigns.id, id),
          eq(campaignDesigns.campaignId, campaignId),
        ),
      );
    return (result.rowCount ?? 0) > 0;
  }

  // Chatbot operations
  async getChatbotConfigs(brandId: string): Promise<any[]> {
    // Return mock config for now
    return [
      {
        id: "config-1",
        brandId,
        language: "es",
        greeting:
          "¡Hola! Soy el asistente virtual de Renuve. ¿En qué puedo ayudarte hoy?",
        businessHours: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "18:00" },
          saturday: { start: "10:00", end: "16:00" },
          sunday: { start: "closed", end: "closed" },
        },
        services: [
          { id: "botox", name: "Botox", duration: 30, price: 300 },
          {
            id: "facial",
            name: "Tratamiento Facial",
            duration: 60,
            price: 150,
          },
          {
            id: "dermal-fillers",
            name: "Rellenos Dérmicos",
            duration: 45,
            price: 400,
          },
        ],
      },
    ];
  }

  async createChatbotConfig(config: any): Promise<any> {
    // Mock implementation
    return {
      id: `config-${Date.now()}`,
      ...config,
      createdAt: new Date().toISOString(),
    };
  }

  async createOrUpdateIntegration(data: any) {
    const existing = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.provider, data.provider),
          eq(integrations.userId, data.userId),
        ),
      );

    if (existing.length > 0) {
      await db
        .update(integrations)
        .set({
          accessToken: data.accessToken, // Drizzle maps to: access_token
          refreshToken: data.refreshToken, // Drizzle maps to: refresh_token
          accountName: data.accountName, // Drizzle maps to: account_name
          accountId: data.accountId, // Drizzle maps to: account_id
          settings: data.settings, // Drizzle maps to: settings
          isActive: true, // Drizzle maps to: is_active
          updatedAt: new Date(), // Drizzle maps to: updated_at
        })
        .where(
          and(
            eq(integrations.provider, data.provider),
            eq(integrations.userId, data.userId),
          ),
        );
    } else {
      await db.insert(integrations).values({
        userId: data.userId, // Drizzle maps to: user_id
        provider: data.provider, // Drizzle maps to: provider
        category: data.category ?? "social", // Drizzle maps to: category
        storeName: data.storeName ?? "Facebook", // Drizzle maps to: store_name
        accessToken: data.accessToken, // Drizzle maps to: access_token
        refreshToken: data.refreshToken ?? null, // Drizzle maps to: refresh_token
        isActive: true, // Drizzle maps to: is_active
        syncEnabled: true, // Drizzle maps to: sync_enabled
        accountName: data.accountName ?? null, // Drizzle maps to: account_name
        accountId: data.accountId ?? null, // Drizzle maps to: account_id
        settings: data.settings ?? {}, // Drizzle maps to: settings
      });
    }
  }

  async getIntegrations(userId: string) {
    try {
      const result = await db
        .select()
        .from(integrations)
        .where(eq(integrations.userId, userId))
        .orderBy(desc(integrations.createdAt));

      return result;
    } catch (error) {
      console.error("❌ Error fetching integrations:", error);
      throw new Error("Failed to fetch integrations");
    }
  }

  async getCalendarIntegrations(brandId: string): Promise<any[]> {
    // Return mock calendar integration
    return [
      {
        id: "cal-1",
        brandId,
        provider: "google",
        calendarId: "primary",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async createCalendarIntegration(integration: any): Promise<any> {
    // Mock implementation
    return {
      id: `cal-${Date.now()}`,
      ...integration,
      createdAt: new Date().toISOString(),
    };
  }

  async getAppointments(brandId: string): Promise<any[]> {
    // Return mock appointments
    const now = new Date();
    return [
      {
        id: "apt-1",
        brandId,
        customerName: "María González",
        customerPhone: "+1234567890",
        service: "Botox",
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        time: "10:00",
        status: "confirmed",
        notes: "Primera cita, consulta inicial incluida",
      },
      {
        id: "apt-2",
        brandId,
        customerName: "Carmen López",
        customerPhone: "+1234567891",
        service: "Tratamiento Facial",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: "14:30",
        status: "pending",
        notes: "Cliente habitual, piel sensible",
      },
    ];
  }

  // Integration operations
  async createIntegration(
    integration: InsertIntegration,
  ): Promise<Integration> {
    const [created] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return created;
  }

  async getIntegrationsByUserId(userId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  async getIntegrationById(id: string): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));
    return integration;
  }

  async getIntegrationByPageId(
    pageId: string,
    userId: string,
  ): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(
        and(eq(integrations.pageId, pageId), eq(integrations.userId, userId)),
      );
    return integration;
  }

  async updateIntegration(
    id: string,
    updates: Partial<Integration>,
  ): Promise<Integration | undefined> {
    const [updated] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  async deleteIntegration(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.userId, userId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
