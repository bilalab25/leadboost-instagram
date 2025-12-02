import {
  users,
  brands,
  brandMemberships,
  brandInvitations,
  socialAccounts,
  conversationThreads,
  conversations,
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
  socialPostingFrequency,
  conversationHistory,
  // Asegúrate de que estos tipos en @shared/schema incluyan firebaseUid y hagan password, email, firstName, lastName opcionales/nullable
  type User,
  type UpsertUser, // Asumo que UpsertUser es para operaciones de upsert, no para updateUser
  type InsertUser,
  type InsertBrand,
  type Brand,
  type SelectBrandMembership,
  type BrandMembershipWithBrand,
  type InsertBrandMembership,
  type SelectBrandInvitation,
  type InsertBrandInvitation,
  type InsertSocialAccount,
  type SocialAccount,
  type InsertConversationThread,
  type ConversationThread,
  type InsertConversation,
  type Conversation,
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
  type InsertSocialPostingFrequency,
  type SocialPostingFrequency,
  type InsertConversationHistory,
  type ConversationHistory,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  and,
  desc,
  asc,
  or,
  sql,
  gte,
  lte,
  SQL,
  getTableColumns,
  inArray,
} from "drizzle-orm";
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
  getMessagesByIntegration(integrationId: string): Promise<Message[]>;
  getMessagesByIntegrationAndConversation(
    integrationId: string,
    conversationId: string,
  ): Promise<Message[]>;
  getUnreadCountByConversation(
    integrationId: string,
    conversationId: string,
  ): Promise<number>;
  updateMessageStatus(id: string, isRead: boolean): Promise<void>;
  markMessageAsRead(id: string): Promise<void>;
  markConversationMessagesAsRead(
    integrationId: string,
    conversationId: string,
  ): Promise<void>;
  updateMessagePriority(id: string, priority: string): Promise<void>;
  assignMessage(id: string, assignedTo: string): Promise<void>;

  // New Conversations operations (using conversations table)
  getOrCreateConversation(params: {
    integrationId: string;
    brandId: string;
    userId: string;
    metaConversationId: string;
    platform: string;
    contactName?: string;
    lastMessage?: string;
    lastMessageAt?: Date;
  }): Promise<Conversation>;
  getConversationsByBrandId(
    brandId: string,
    limit?: number,
  ): Promise<Conversation[]>;
  getConversationsByIntegration(integrationId: string): Promise<Conversation[]>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  updateConversationMetadata(
    id: string,
    updates: Partial<Conversation>,
  ): Promise<Conversation | undefined>;
  incrementUnreadCount(conversationId: string): Promise<void>;
  resetUnreadCount(conversationId: string): Promise<void>;

  // Message attachment operations
  createMessageAttachment(
    attachment: InsertMessageAttachment,
  ): Promise<MessageAttachment>;
  getMessageAttachments(messageId: string): Promise<MessageAttachment[]>;

  // Content plan operations
  createContentPlan(plan: InsertContentPlan): Promise<ContentPlan>;
  getContentPlansByBrandId(brandId: string): Promise<ContentPlan[]>;
  updateContentPlan(
    id: string,
    brandId: string,
    updates: Partial<ContentPlan>,
  ): Promise<ContentPlan | undefined>;
  deleteContentPlan(id: string, brandId: string): Promise<boolean>;

  // Campaign operations
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  getCampaignsByBrandId(brandId: string): Promise<Campaign[]>;
  updateCampaign(
    id: string,
    brandId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign | undefined>;
  updateCampaignStatus(
    id: string,
    brandId: string,
    status: string,
  ): Promise<void>;
  deleteCampaign(id: string, brandId: string): Promise<boolean>;

  // Analytics operations
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  createAnalyticsEntry(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByBrandId(brandId: string, days?: number): Promise<Analytics[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByBrandId(
    brandId: string,
    limit?: number,
  ): Promise<ActivityLog[]>;

  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomersByBrandId(brandId: string): Promise<Customer[]>;
  getCustomerByPhone(
    brandId: string,
    phone: string,
  ): Promise<Customer | undefined>;
  getCustomerByName(
    brandId: string,
    name: string,
  ): Promise<Customer | undefined>;
  getCustomerByConversationId(
    conversationId: string,
    brandId: string,
  ): Promise<Customer | undefined>;
  updateCustomer(
    id: string,
    brandId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined>;
  updateCustomerTotalInvoiced(
    customerId: string,
    brandId: string,
    amount: number,
  ): Promise<void>;
  deleteCustomer(id: string, brandId: string): Promise<boolean>;

  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByBrandId(
    brandId: string,
    customerId?: string,
  ): Promise<(Invoice & { customer?: Customer })[]>;
  updateInvoice(
    id: string,
    brandId: string,
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
  getBrandDesignByBrandId(brandId: string): Promise<BrandDesign | undefined>;
  updateBrandDesign(
    id: string,
    brandId: string,
    updates: Partial<BrandDesign>,
  ): Promise<BrandDesign | undefined>;
  deleteBrandDesign(id: string, brandId: string): Promise<boolean>;

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
  getAllIntegrations(): Promise<Integration[]>;
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

  // Meta Messenger/Instagram hybrid sync operations
  bulkInsertMessages(messages: InsertMessage[]): Promise<void>;
  markIntegrationAsFetched(integrationId: string): Promise<void>;
  findIntegrationByAccount(
    accountId: string,
    provider: string,
  ): Promise<Integration | undefined>;

  // Social Posting Frequency operations
  saveSocialPostingFrequencies(
    brandId: string,
    frequencies: InsertSocialPostingFrequency[],
  ): Promise<void>;
  getSocialPostingFrequenciesByBrand(
    brandId: string,
  ): Promise<SocialPostingFrequency[]>;

  // Brand Membership operations
  getBrandMemberships(userId: string): Promise<BrandMembershipWithBrand[]>;
  getBrandMembershipsByBrand(brandId: string): Promise<SelectBrandMembership[]>;
  createBrandMembership(
    membership: InsertBrandMembership,
  ): Promise<SelectBrandMembership>;
  updateBrandMembershipRole(
    id: string,
    role: string,
  ): Promise<SelectBrandMembership | undefined>;
  removeBrandMembership(userId: string, brandId: string): Promise<boolean>;
  getBrandMembershipById(
    id: string,
  ): Promise<SelectBrandMembership | undefined>;
  getUserBrandMembership(
    userId: string,
    brandId: string,
  ): Promise<SelectBrandMembership | undefined>;

  // Brand Invitation operations
  createBrandInvitation(
    invitation: InsertBrandInvitation,
  ): Promise<SelectBrandInvitation>;
  validateInviteCode(code: string): Promise<SelectBrandInvitation | undefined>;
  acceptBrandInvitation(
    code: string,
    userId: string,
  ): Promise<SelectBrandMembership>;
  getBrandInvitations(brandId: string): Promise<SelectBrandInvitation[]>;
  expireBrandInvitation(id: string): Promise<boolean>;
  getBrandInvitationById(
    id: string,
  ): Promise<SelectBrandInvitation | undefined>;
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

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];

    return await db.select().from(users).where(inArray(users.id, userIds));
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

  // Get brand by ID only (use when requireBrand middleware already validated access)
  async getBrandByIdOnly(id: string): Promise<Brand | undefined> {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
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

  async getMessagesByIntegration(integrationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.integrationId, integrationId))
      .orderBy(asc(messages.timestamp));
  }

  async getMessagesByIntegrationAndConversation(
    integrationId: string,
    conversationId: string,
  ): Promise<Message[]> {
    const conversationIdConditions: SQL[] = [
      eq(messages.metaConversationId, conversationId),
      eq(messages.senderId, conversationId),
      eq(messages.recipientId, conversationId),
    ];
    let alternativePhoneNumber: string | null = null;

    const isPhoneNumber =
      /^\d{10,}$/.test(conversationId) && conversationId.startsWith("52");

    if (isPhoneNumber) {
      if (conversationId.startsWith("521")) {
        alternativePhoneNumber =
          conversationId.substring(0, 2) + conversationId.substring(3);
      } else {
        alternativePhoneNumber =
          conversationId.substring(0, 2) + "1" + conversationId.substring(2);
      }
    }

    if (alternativePhoneNumber) {
      conversationIdConditions.push(
        eq(messages.senderId, alternativePhoneNumber),
      );
      conversationIdConditions.push(
        eq(messages.recipientId, alternativePhoneNumber),
      );
    }

    return db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.integrationId, integrationId),
          or(...conversationIdConditions),
        ),
      )
      .orderBy(asc(messages.timestamp));
  }
  async getUnreadCountByConversation(
    integrationId: string,
    conversationId: string,
  ): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.integrationId, integrationId),
          or(
            eq(messages.senderId, conversationId),
            eq(messages.recipientId, conversationId),
          ),
          eq(messages.isRead, false),
          eq(messages.direction, "inbound"), // Only count unread inbound messages
        ),
      );

    return Number(result[0]?.count || 0);
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

  async markConversationMessagesAsRead(
    integrationId: string,
    conversationId: string,
  ): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.integrationId, integrationId),
          or(
            eq(messages.senderId, conversationId),
            eq(messages.recipientId, conversationId),
          ),
          eq(messages.isRead, false), // Only update unread messages
        ),
      );
  }

  async updateMessagePriority(id: string, priority: string): Promise<void> {
    await db.update(messages).set({ priority }).where(eq(messages.id, id));
  }

  // Conversation operations
  // New Conversations operations (using conversations table)
  async getOrCreateConversation(params: {
    integrationId: string;
    brandId: string;
    userId: string;
    metaConversationId: string;
    platform: string;
    contactName?: string;
    lastMessage?: string;
    lastMessageAt?: Date;
  }): Promise<Conversation> {
    return await db.transaction(async (tx) => {
      // Try to insert with ON CONFLICT DO UPDATE
      const [conversation] = await tx
        .insert(conversations)
        .values({
          integrationId: params.integrationId,
          brandId: params.brandId,
          userId: params.userId,
          metaConversationId: params.metaConversationId,
          platform: params.platform,
          contactName: params.contactName,
          lastMessage: params.lastMessage,
          lastMessageAt: params.lastMessageAt || new Date(),
          unreadCount: 0,
          flag: "none",
        })
        .onConflictDoUpdate({
          target: [
            conversations.integrationId,
            conversations.metaConversationId,
          ],
          set: {
            lastMessage:
              params.lastMessage || sql`${conversations.lastMessage}`,
            lastMessageAt: params.lastMessageAt || new Date(),
            updatedAt: new Date(),
          },
        })
        .returning();

      // Validate that the conversation belongs to the correct brand
      if (conversation.brandId !== params.brandId) {
        throw new Error(
          `Brand mismatch: conversation belongs to brand ${conversation.brandId} but brandId ${params.brandId} was requested`,
        );
      }

      return conversation;
    });
  }

  async getConversationsByBrandId(
    brandId: string,
    limit?: number,
  ): Promise<Conversation[]> {
    const query = db
      .select()
      .from(conversations)
      .where(eq(conversations.brandId, brandId))
      .orderBy(desc(conversations.lastMessageAt));

    if (limit && limit > 0) {
      return query.limit(limit);
    }

    return query;
  }

  async getConversationsByIntegration(
    integrationId: string,
  ): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.integrationId, integrationId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.timestamp));
  }

  async updateConversationMetadata(
    id: string,
    updates: Partial<Conversation>,
  ): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async incrementUnreadCount(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        unreadCount: sql`${conversations.unreadCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
  }

  async resetUnreadCount(conversationId: string): Promise<void> {
    await db
      .update(conversations)
      .set({
        unreadCount: 0,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));
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

  async getContentPlansByBrandId(brandId: string): Promise<ContentPlan[]> {
    return db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.brandId, brandId))
      .orderBy(desc(contentPlans.createdAt));
  }

  async updateContentPlan(
    id: string,
    brandId: string,
    updates: Partial<ContentPlan>,
  ): Promise<ContentPlan | undefined> {
    const [updated] = await db
      .update(contentPlans)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(contentPlans.id, id), eq(contentPlans.brandId, brandId)))
      .returning();
    return updated;
  }

  async deleteContentPlan(id: string, brandId: string): Promise<boolean> {
    const result = await db
      .delete(contentPlans)
      .where(and(eq(contentPlans.id, id), eq(contentPlans.brandId, brandId)));
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

  async getCampaignsByBrandId(brandId: string): Promise<Campaign[]> {
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.brandId, brandId))
      .orderBy(desc(campaigns.createdAt));
  }

  async updateCampaign(
    id: string,
    brandId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign | undefined> {
    const [updated] = await db
      .update(campaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.brandId, brandId)))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string, brandId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.brandId, brandId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateCampaignStatus(
    id: string,
    brandId: string,
    status: string,
  ): Promise<void> {
    await db
      .update(campaigns)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.brandId, brandId)));
  }

  // Analytics operations
  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [newAnalytics] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return newAnalytics;
  }

  async getAnalyticsByBrandId(
    brandId: string,
    days: number = 30,
  ): Promise<Analytics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(analytics)
      .where(
        and(
          eq(analytics.brandId, brandId),
          gte(analytics.createdAt, startDate),
        ),
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

  async getActivityLogsByBrandId(
    brandId: string,
    limit: number = 50,
  ): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.brandId, brandId))
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

  async getCustomersByBrandId(brandId: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.brandId, brandId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerByPhone(
    brandId: string,
    phone: string,
  ): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.brandId, brandId), eq(customers.phone, phone)))
      .limit(1);
    return customer;
  }

  async getCustomerByName(
    brandId: string,
    name: string,
  ): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.brandId, brandId), eq(customers.name, name)))
      .limit(1);
    return customer;
  }

  async getCustomerByConversationId(
    conversationId: string,
    brandId: string,
  ): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.conversationId, conversationId),
          eq(customers.brandId, brandId),
        ),
      )
      .limit(1);
    return customer;
  }

  async updateCustomer(
    id: string,
    brandId: string,
    updates: Partial<Customer>,
  ): Promise<Customer | undefined> {
    console.log("🔎 Updating in DB where:", { id, brandId, updates });

    const [updated] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string, brandId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.brandId, brandId)));
    return (result.rowCount ?? 0) > 0;
  }

  async updateCustomerTotalInvoiced(
    customerId: string,
    brandId: string,
    amount: number,
  ): Promise<void> {
    await db
      .update(customers)
      .set({
        totalInvoiced: sql`${customers.totalInvoiced} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(eq(customers.id, customerId), eq(customers.brandId, brandId)));
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async getInvoicesByBrandId(
    brandId: string,
    customerId?: string,
  ): Promise<(Invoice & { customer?: Customer })[]> {
    const whereConditions = [eq(invoices.brandId, brandId)];
    if (customerId) {
      whereConditions.push(eq(invoices.customerId, customerId));
    }

    const query = db
      .select({
        invoice: invoices,
        customer: customers,
      })
      .from(invoices)
      .leftJoin(
        customers,
        and(
          eq(invoices.customerId, customers.id),
          eq(customers.brandId, brandId),
        ),
      )
      .where(and(...whereConditions));

    const results = await query.orderBy(desc(invoices.createdAt));

    return results.map((row) => ({
      ...row.invoice,
      customer: row.customer || undefined,
    }));
  }

  async updateInvoice(
    id: string,
    brandId: string,
    updates: Partial<Invoice>,
  ): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.brandId, brandId)))
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
    brandId: string,
    updates: Partial<BrandDesign>,
  ): Promise<BrandDesign | undefined> {
    const mapped = mapPartialToDb({ ...updates, brandId }); // ✅ nuevo mapper parcial
    const [updated] = await db
      .update(brandDesigns)
      .set({ ...mapped, updatedAt: new Date() })
      .where(and(eq(brandDesigns.id, id), eq(brandDesigns.brandId, brandId)))
      .returning();

    return updated ? mapFromDb(updated) : undefined;
  }

  async getBrandDesignByBrandId(
    brandId: string,
  ): Promise<BrandDesign | undefined> {
    const [design] = await db
      .select()
      .from(brandDesigns)
      .where(eq(brandDesigns.brandId, brandId))
      .orderBy(desc(brandDesigns.createdAt))
      .limit(1);

    if (!design) return undefined;
    return mapFromDb(design);
  }

  async deleteBrandDesign(id: string, brandId: string): Promise<boolean> {
    const result = await db
      .delete(brandDesigns)
      .where(and(eq(brandDesigns.id, id), eq(brandDesigns.brandId, brandId)));
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

  // Obtener assets por brandId (via brandDesign)
  async getAssetsByBrandId(brandId: string): Promise<BrandAsset[]> {
    // First get the brand design for this brand
    const design = await this.getBrandDesignByBrandId(brandId);
    if (!design || !design.id) {
      return [];
    }

    // Then get all assets for that design
    return this.getAssetsByBrandDesignId(design.id);
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

  // ✅ Función corregida y completa con brandId
  async createOrUpdateIntegration(data: any) {
    if (!data.brandId) {
      throw new Error(
        `brandId is required in createOrUpdateIntegration for provider=${data.provider} user=${data.userId}`,
      );
    }

    const now = new Date();

    // 👇 Ahora buscamos por userId + brandId + provider
    const existing = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.provider, data.provider),
          eq(integrations.userId, data.userId),
          eq(integrations.brandId, data.brandId),
        ),
      );

    const baseData = {
      userId: data.userId,
      brandId: data.brandId, // 🔥 CLAVE
      provider: data.provider,
      category: data.category ?? "social_media",
      storeName: data.storeName ?? null,
      storeUrl: data.storeUrl ?? null,
      accountName: data.accountName ?? null,
      accountId: data.accountId ?? null,
      pageId: data.pageId ?? null,
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      settings: data.settings ?? {},
      metadata: data.metadata ?? {},
      expiresAt: data.expiresAt ?? null,
      lastSyncAt: data.lastSyncAt ?? null,
      isActive: data.isActive ?? true,
      syncEnabled: data.syncEnabled ?? true,
      updatedAt: now,
    };

    if (existing.length > 0) {
      console.log(
        `🔄 Updating integration for ${data.provider} (user: ${data.userId}, brand: ${data.brandId})`,
      );
      await db
        .update(integrations)
        .set(baseData)
        .where(
          and(
            eq(integrations.provider, data.provider),
            eq(integrations.userId, data.userId),
            eq(integrations.brandId, data.brandId),
          ),
        );
    } else {
      console.log(
        `🆕 Creating new integration for ${data.provider} (user: ${data.userId}, brand: ${data.brandId})`,
      );
      await db.insert(integrations).values({
        ...baseData,
        createdAt: now,
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

  async getAllIntegrations(): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .orderBy(desc(integrations.createdAt));
  }
  async findMessagesByConversation(
    userId: string,
    integrationId: string,
    metaConversationId: string,
  ) {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.integrationId, integrationId),
          eq(messages.metaConversationId, metaConversationId),
        ),
      )
      .execute();
  }

  async findMessageByUserAndRecipient(
    userId: string,
    integrationId: string,
    recipientId: string,
  ) {
    const result = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, userId),
          eq(messages.integrationId, integrationId),
          or(
            eq(messages.senderId, recipientId),
            eq(messages.recipientId, recipientId),
          ),
        ),
      )
      .limit(1)
      .execute();

    return result?.[0];
  }

  async getIntegrationsByUserId(userId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.userId, userId))
      .orderBy(desc(integrations.createdAt));
  }

  async getIntegrationsByBrandId(brandId: string): Promise<Integration[]> {
    return await db
      .select()
      .from(integrations)
      .where(eq(integrations.brandId, brandId))
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

  // Meta Messenger/Instagram hybrid sync operations
  async bulkInsertMessages(messagesList: InsertMessage[]): Promise<void> {
    if (!messagesList?.length) return;

    await db
      .insert(messages)
      .values(messagesList)
      .onConflictDoNothing({
        target: [messages.integrationId, messages.metaMessageId],
      })
      .execute();

    console.log(`✅ Inserted ${messagesList.length} messages (upsert safe)`);
  }

  async markIntegrationAsFetched(integrationId: string): Promise<void> {
    await db
      .update(integrations)
      .set({
        hasFetchedHistory: true,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, integrationId))
      .execute();
  }

  async findIntegrationByAccount(
    accountId: string,
    provider: string,
  ): Promise<Integration | undefined> {
    // For Instagram, also check instagram_direct provider
    const providersToCheck = provider === "instagram" 
      ? [provider, "instagram_direct"] 
      : [provider];
    
    // First try to find by accountId
    let [integration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.accountId, accountId),
          inArray(integrations.provider, providersToCheck),
        ),
      )
      .limit(1);
    
    // If not found, try to find by pageId (IGBA ID for Instagram)
    if (!integration) {
      [integration] = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.pageId, accountId),
            inArray(integrations.provider, providersToCheck),
          ),
        )
        .limit(1);
    }
    
    return integration;
  }

  // Social Posting Frequency operations
  async saveSocialPostingFrequencies(
    brandId: string,
    frequencies: InsertSocialPostingFrequency[],
  ): Promise<void> {
    if (!brandId) {
      throw new Error("brandId is required to save posting frequencies");
    }
    if (!frequencies || frequencies.length === 0) return;

    // Validate that all frequencies have brandId
    const invalidFrequencies = frequencies.filter((f) => !f.brandId);
    if (invalidFrequencies.length > 0) {
      throw new Error("All posting frequencies must have a brandId");
    }

    // Delete existing frequencies for this brand to avoid duplicates
    await db
      .delete(socialPostingFrequency)
      .where(eq(socialPostingFrequency.brandId, brandId))
      .execute();

    // Insert new frequencies
    await db.insert(socialPostingFrequency).values(frequencies).execute();
  }

  async getSocialPostingFrequenciesByBrand(
    brandId: string,
  ): Promise<SocialPostingFrequency[]> {
    if (!brandId) {
      throw new Error("brandId is required to fetch posting frequencies");
    }
    return await db
      .select()
      .from(socialPostingFrequency)
      .where(eq(socialPostingFrequency.brandId, brandId))
      .orderBy(desc(socialPostingFrequency.createdAt));
  }

  // Conversation History operations
  async saveConversationHistory(
    data: InsertConversationHistory,
  ): Promise<ConversationHistory> {
    if (!data.brandId) {
      throw new Error("brandId is required to save conversation history");
    }
    if (!data.userId) {
      throw new Error("userId is required to save conversation history");
    }

    const [result] = await db
      .insert(conversationHistory)
      .values(data)
      .returning();
    return result;
  }

  async getConversationHistoryByBrand(
    brandId: string,
    limit: number = 100,
  ): Promise<ConversationHistory[]> {
    if (!brandId) {
      throw new Error("brandId is required to fetch conversation history");
    }
    return await db
      .select()
      .from(conversationHistory)
      .where(eq(conversationHistory.brandId, brandId))
      .orderBy(desc(conversationHistory.createdAt))
      .limit(limit);
  }

  async deleteConversationHistory(id: string, brandId: string): Promise<void> {
    if (!id) {
      throw new Error("id is required to delete conversation history");
    }
    if (!brandId) {
      throw new Error("brandId is required to delete conversation history");
    }

    // Delete only if both id and brandId match (prevents cross-tenant deletion)
    await db
      .delete(conversationHistory)
      .where(
        and(
          eq(conversationHistory.id, id),
          eq(conversationHistory.brandId, brandId),
        ),
      )
      .execute();
  }

  // Brand Membership operations
  async getBrandMemberships(
    userId: string,
  ): Promise<BrandMembershipWithBrand[]> {
    return await db
      .select({
        ...getTableColumns(brandMemberships),
        brandName: brands.name,
        brandColor: brands.primaryColor,
        brandIndustry: brands.industry,
        brandDescription: brands.description,
      })
      .from(brandMemberships)
      .innerJoin(brands, eq(brandMemberships.brandId, brands.id))
      .where(eq(brandMemberships.userId, userId))
      .orderBy(desc(brandMemberships.createdAt));
  }

  async getBrandMembershipsByBrand(
    brandId: string,
  ): Promise<SelectBrandMembership[]> {
    return await db
      .select()
      .from(brandMemberships)
      .where(eq(brandMemberships.brandId, brandId))
      .orderBy(desc(brandMemberships.createdAt));
  }

  async createBrandMembership(
    membership: InsertBrandMembership,
  ): Promise<SelectBrandMembership> {
    const [result] = await db
      .insert(brandMemberships)
      .values(membership)
      .returning();
    return result;
  }

  async updateBrandMembershipRole(
    id: string,
    role: string,
  ): Promise<SelectBrandMembership | undefined> {
    const [result] = await db
      .update(brandMemberships)
      .set({ role, updatedAt: new Date() })
      .where(eq(brandMemberships.id, id))
      .returning();
    return result;
  }

  async removeBrandMembership(
    userId: string,
    brandId: string,
  ): Promise<boolean> {
    const result = await db
      .delete(brandMemberships)
      .where(
        and(
          eq(brandMemberships.userId, userId),
          eq(brandMemberships.brandId, brandId),
        ),
      )
      .returning();
    return result.length > 0;
  }

  async getBrandMembershipById(
    id: string,
  ): Promise<SelectBrandMembership | undefined> {
    const [result] = await db
      .select()
      .from(brandMemberships)
      .where(eq(brandMemberships.id, id))
      .limit(1);
    return result;
  }

  async getUserBrandMembership(
    userId: string,
    brandId: string,
  ): Promise<SelectBrandMembership | undefined> {
    const [result] = await db
      .select()
      .from(brandMemberships)
      .where(
        and(
          eq(brandMemberships.userId, userId),
          eq(brandMemberships.brandId, brandId),
        ),
      )
      .limit(1);
    return result;
  }

  // Brand Invitation operations
  async createBrandInvitation(
    invitation: InsertBrandInvitation,
  ): Promise<SelectBrandInvitation> {
    const [result] = await db
      .insert(brandInvitations)
      .values(invitation)
      .returning();
    return result;
  }

  async validateInviteCode(
    code: string,
  ): Promise<SelectBrandInvitation | undefined> {
    const [result] = await db
      .select()
      .from(brandInvitations)
      .where(
        and(
          eq(brandInvitations.inviteCode, code),
          eq(brandInvitations.status, "pending"),
        ),
      )
      .limit(1);
    return result;
  }

  async acceptBrandInvitation(
    code: string,
    userId: string,
  ): Promise<SelectBrandMembership> {
    // Validate invitation with expiration check
    const invitation = await this.validateInviteCode(code);
    if (!invitation) {
      throw new Error("Invalid or expired invitation code");
    }

    // Check if invitation has expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error("Invitation code has expired");
    }

    // Use transaction with uniqueness enforcement
    try {
      return await db.transaction(async (tx) => {
        // Double-check invitation status in transaction
        const [currentInvitation] = await tx
          .select()
          .from(brandInvitations)
          .where(
            and(
              eq(brandInvitations.inviteCode, code),
              eq(brandInvitations.status, "pending"),
            ),
          )
          .limit(1);

        if (!currentInvitation) {
          throw new Error("Invitation has already been used or expired");
        }

        // Check for existing membership inside transaction
        const [existingMembership] = await tx
          .select()
          .from(brandMemberships)
          .where(
            and(
              eq(brandMemberships.userId, userId),
              eq(brandMemberships.brandId, currentInvitation.brandId),
            ),
          )
          .limit(1);

        // If membership exists, mark invitation as accepted and return membership
        if (existingMembership) {
          await tx
            .update(brandInvitations)
            .set({
              status: "accepted",
              acceptedBy: userId,
              acceptedAt: new Date(),
            })
            .where(eq(brandInvitations.id, currentInvitation.id));

          return existingMembership;
        }

        // Mark invitation as accepted first (prevents duplicate use)
        await tx
          .update(brandInvitations)
          .set({
            status: "accepted",
            acceptedBy: userId,
            acceptedAt: new Date(),
          })
          .where(eq(brandInvitations.id, currentInvitation.id));

        // Create brand membership (unique constraint prevents duplicates)
        const [membership] = await tx
          .insert(brandMemberships)
          .values({
            userId,
            brandId: currentInvitation.brandId,
            role: currentInvitation.role,
            status: "active",
            invitedBy: currentInvitation.invitedBy,
          })
          .returning();

        return membership;
      });
    } catch (error: any) {
      // Handle unique constraint violation (duplicate membership)
      if (error?.code === "23505") {
        // Postgres unique violation
        // Fetch and return existing membership
        const [existingMembership] = await db
          .select()
          .from(brandMemberships)
          .where(
            and(
              eq(brandMemberships.userId, userId),
              eq(brandMemberships.brandId, invitation.brandId),
            ),
          )
          .limit(1);

        if (existingMembership) {
          return existingMembership;
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getBrandInvitations(brandId: string): Promise<SelectBrandInvitation[]> {
    return await db
      .select()
      .from(brandInvitations)
      .where(eq(brandInvitations.brandId, brandId))
      .orderBy(desc(brandInvitations.createdAt));
  }

  async expireBrandInvitation(id: string): Promise<boolean> {
    const result = await db
      .update(brandInvitations)
      .set({ status: "expired" })
      .where(eq(brandInvitations.id, id))
      .returning();
    return result.length > 0;
  }

  async getBrandInvitationById(
    id: string,
  ): Promise<SelectBrandInvitation | undefined> {
    const [result] = await db
      .select()
      .from(brandInvitations)
      .where(eq(brandInvitations.id, id))
      .limit(1);
    return result;
  }
}

export const storage = new DatabaseStorage();
