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
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Social account operations
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  updateSocialAccountStatus(id: string, isActive: boolean): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUserId(userId: string, limit?: number): Promise<(Message & { socialAccount: SocialAccount })[]>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  markMessageAsRead(id: string): Promise<void>;
  updateMessagePriority(id: string, priority: string): Promise<void>;
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
  createAnalyticsEntry(analytics: InsertAnalytics): Promise<Analytics>;
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

  async getMessagesByUserId(userId: string, limit = 50): Promise<(Message & { socialAccount: SocialAccount })[]> {
    const results = await db
      .select({
        // Message fields
        id: messages.id,
        socialAccountId: messages.socialAccountId,
        senderId: messages.senderId,
        senderName: messages.senderName,
        senderAvatar: messages.senderAvatar,
        content: messages.content,
        messageType: messages.messageType,
        isRead: messages.isRead,
        priority: messages.priority,
        tags: messages.tags,
        assignedTo: messages.assignedTo,
        createdAt: messages.createdAt,
        // Social account fields
        socialAccount: socialAccounts,
      })
      .from(messages)
      .innerJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
      .where(eq(socialAccounts.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    // Return demo data if no user messages found
    if (results.length === 0) {
      const demoResults = await db
        .select({
          // Message fields
          id: messages.id,
          socialAccountId: messages.socialAccountId,
          senderId: messages.senderId,
          senderName: messages.senderName,
          senderAvatar: messages.senderAvatar,
          content: messages.content,
          messageType: messages.messageType,
          isRead: messages.isRead,
          priority: messages.priority,
          tags: messages.tags,
          assignedTo: messages.assignedTo,
          createdAt: messages.createdAt,
          // Social account fields
          socialAccount: socialAccounts,
        })
        .from(messages)
        .innerJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
        .where(eq(socialAccounts.userId, 'demo-user-id'))
        .orderBy(desc(messages.createdAt))
        .limit(limit);
      return demoResults as (Message & { socialAccount: SocialAccount })[];
    }
    
    return results as (Message & { socialAccount: SocialAccount })[];
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(socialAccounts, eq(messages.socialAccountId, socialAccounts.id))
      .where(
        and(
          eq(socialAccounts.userId, userId),
          eq(messages.isRead, false)
        )
      );
    return result.count;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
  }

  async updateMessagePriority(id: string, priority: string): Promise<void> {
    await db
      .update(messages)
      .set({ priority })
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
    const unreadMessages = await this.getUnreadMessagesCount(userId);
    
    const [aiPostsResult] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.userId, userId),
          eq(campaigns.aiGenerated, true)
        )
      );

    // Mock engagement rate and revenue for now - in production these would be calculated from analytics data
    const engagementRate = 4.8;
    const revenue = 12400;

    return {
      unreadMessages,
      engagementRate,
      aiPosts: aiPostsResult.count,
      revenue,
    };
  }

  // Customer operations
  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(customerData)
      .returning();
    return customer;
  }

  async getCustomersByUserId(userId: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .orderBy(desc(customers.createdAt));
  }

  async updateCustomer(id: string, userId: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.userId, userId)))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.userId, userId)));
    return result.rowCount > 0;
  }

  async updateCustomerTotalInvoiced(customerId: string, amount: number): Promise<void> {
    await db
      .update(customers)
      .set({
        totalInvoiced: sql`${customers.totalInvoiced} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));
  }

  // Invoice operations
  async createInvoice(invoiceData: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(invoiceData)
      .returning();
    return invoice;
  }

  async getInvoicesByUserId(userId: string, customerId?: string): Promise<(Invoice & { customer?: Customer })[]> {
    let query = db
      .select({
        id: invoices.id,
        customerId: invoices.customerId,
        userId: invoices.userId,
        invoiceNumber: invoices.invoiceNumber,
        amount: invoices.amount,
        currency: invoices.currency,
        description: invoices.description,
        status: invoices.status,
        fileUrl: invoices.fileUrl,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        customer: customers,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .where(eq(invoices.userId, userId));

    if (customerId) {
      query = query.where(eq(invoices.customerId, customerId));
    }

    return query.orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: string, userId: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
      .returning();
    return invoice;
  }

  // Team task operations
  async createTeamTask(taskData: InsertTeamTask): Promise<TeamTask> {
    const [task] = await db
      .insert(teamTasks)
      .values(taskData)
      .returning();
    return task;
  }

  async getTasksByUserId(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    return db
      .select({
        id: teamTasks.id,
        assignedBy: teamTasks.assignedBy,
        assignedTo: teamTasks.assignedTo,
        title: teamTasks.title,
        description: teamTasks.description,
        priority: teamTasks.priority,
        status: teamTasks.status,
        dueDate: teamTasks.dueDate,
        requiresProof: teamTasks.requiresProof,
        createdAt: teamTasks.createdAt,
        updatedAt: teamTasks.updatedAt,
        assignedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(teamTasks)
      .leftJoin(users, eq(teamTasks.assignedBy, users.id))
      .leftJoin(users, eq(teamTasks.assignedTo, users.id))
      .where(eq(teamTasks.assignedBy, userId))
      .orderBy(desc(teamTasks.createdAt));
  }

  async getTasksAssignedToUser(userId: string): Promise<(TeamTask & { assignedByUser: User; assignedToUser: User })[]> {
    return db
      .select({
        id: teamTasks.id,
        assignedBy: teamTasks.assignedBy,
        assignedTo: teamTasks.assignedTo,
        title: teamTasks.title,
        description: teamTasks.description,
        priority: teamTasks.priority,
        status: teamTasks.status,
        dueDate: teamTasks.dueDate,
        requiresProof: teamTasks.requiresProof,
        createdAt: teamTasks.createdAt,
        updatedAt: teamTasks.updatedAt,
        assignedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        assignedToUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(teamTasks)
      .leftJoin(users, eq(teamTasks.assignedBy, users.id))
      .leftJoin(users, eq(teamTasks.assignedTo, users.id))
      .where(eq(teamTasks.assignedTo, userId))
      .orderBy(desc(teamTasks.createdAt));
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    await db
      .update(teamTasks)
      .set({ status, updatedAt: new Date() })
      .where(eq(teamTasks.id, id));
  }

  // Task completion operations
  async createTaskCompletion(completionData: InsertTaskCompletion): Promise<TaskCompletion> {
    const [completion] = await db
      .insert(taskCompletions)
      .values(completionData)
      .returning();
    return completion;
  }
}

export const storage = new DatabaseStorage();

// Initialize with demo data for immediate preview
(async () => {
  try {
    // Check if demo data already exists
    const existingAccounts = await storage.getSocialAccountsByUserId('demo-user-id');
    if (existingAccounts.length === 0) {
      await initializeDemoData();
    }
  } catch (error) {
    console.log('Demo data initialization skipped:', error);
  }
})();

async function initializeDemoData() {
  const userId = 'demo-user-id';
  
  // Create demo social accounts
  const socialAccountsData = [
    { platform: "instagram", accountName: "@mybusiness", followerCount: 15420, isActive: true, accessToken: "demo_token_ig" },
    { platform: "facebook", accountName: "My Business Page", followerCount: 8750, isActive: true, accessToken: "demo_token_fb" },
    { platform: "linkedin", accountName: "My Business", followerCount: 3200, isActive: true, accessToken: "demo_token_li" },
    { platform: "tiktok", accountName: "@mybiz", followerCount: 22100, isActive: true, accessToken: "demo_token_tt" },
    { platform: "x", accountName: "@MyBusiness", followerCount: 12800, isActive: true, accessToken: "demo_token_x" },
    { platform: "youtube", accountName: "My Business Channel", followerCount: 5600, isActive: true, accessToken: "demo_token_yt" },
  ];

  const socialAccounts = [];
  for (const accountData of socialAccountsData) {
    try {
      const account = await storage.createSocialAccount({ userId, ...accountData });
      socialAccounts.push(account);
    } catch (error) {
      console.log(`Social account ${accountData.platform} creation skipped`);
    }
  }

  // Create demo messages
  const messagesData = [
    { platform: "instagram", senderName: "Sarah Johnson", content: "Love your latest product! When will you restock the blue variant?", type: "comment", isRead: false, sentiment: "positive", priority: "normal" },
    { platform: "facebook", senderName: "Mike Chen", content: "I'm having trouble with my order #12345. Can someone help?", type: "message", isRead: false, sentiment: "negative", priority: "high" },
    { platform: "linkedin", senderName: "Emma Wilson", content: "Great insights in your latest post about social media trends!", type: "comment", isRead: true, sentiment: "positive", priority: "normal" },
    { platform: "tiktok", senderName: "Alex Rivera", content: "This is amazing! Tutorial please? 🙏", type: "comment", isRead: true, sentiment: "positive", priority: "normal" },
    { platform: "x", senderName: "David Kim", content: "@MyBusiness Your customer service is terrible. Still waiting for a response after 3 days!", type: "mention", isRead: false, sentiment: "negative", priority: "high" },
    { platform: "instagram", senderName: "Lisa Park", content: "Can you share the recipe for this? It looks delicious! 😍", type: "comment", isRead: false, sentiment: "positive", priority: "normal" },
    { platform: "facebook", senderName: "John Smith", content: "Do you ship internationally? I'm interested in your services.", type: "message", isRead: true, sentiment: "neutral", priority: "low" },
    { platform: "linkedin", senderName: "Rachel Brown", content: "Would love to collaborate on a project. Are you open to partnerships?", type: "message", isRead: false, sentiment: "positive", priority: "normal" },
  ];

  for (const messageData of messagesData) {
    try {
      await storage.createMessage({
        userId,
        socialAccountId: socialAccounts.find(acc => acc.platform === messageData.platform)?.id || socialAccounts[0]?.id || 'demo-account-1',
        ...messageData,
      });
    } catch (error) {
      console.log(`Message creation skipped`);
    }
  }

  // Create demo campaigns
  const campaignsData = [
    {
      title: "Summer Product Launch 2024",
      description: "Launch campaign for our new summer collection with cross-platform promotion",
      platforms: ["instagram", "facebook", "tiktok"],
      content: {
        content: "🌞 Summer vibes are here! Discover our brand new collection that's perfect for those sunny days ahead. From beachwear to casual summer outfits, we've got everything you need to make this summer unforgettable! ✨",
        variations: {
          instagram: "🌞 Summer vibes are here! ✨ Discover our brand new collection perfect for sunny days ahead. From beachwear to casual outfits, we've got everything for an unforgettable summer! 🏖️ #SummerCollection #NewLaunch",
          facebook: "Summer is finally here! 🌞 We're thrilled to announce our brand new summer collection that's designed to make your sunny days even brighter. Whether you're heading to the beach or just enjoying the warm weather, our latest pieces combine comfort with style. Check out our new arrivals and get ready to embrace the season! What's your favorite summer style?",
          tiktok: "Summer collection drop! 🔥 New fits for those sunny day vibes ☀️ Which piece is your fave? #SummerVibes #NewDrop #OOTD"
        },
        suggestedHashtags: {
          instagram: ["#SummerCollection", "#NewLaunch", "#SummerFashion", "#BeachWear", "#SunnyDays"],
          facebook: ["#SummerStyle", "#NewArrivals", "#FashionLaunch"],
          tiktok: ["#SummerVibes", "#NewDrop", "#OOTD", "#FashionTok", "#SummerFits"]
        },
        visualSuggestions: {
          instagram: ["bright summer product photos", "lifestyle beach shots", "carousel showing different pieces"],
          facebook: ["lifestyle imagery", "behind-the-scenes design process", "customer photos"],
          tiktok: ["quick try-on videos", "styling transitions", "summer mood board"]
        }
      },
      status: "published",
      aiGenerated: false,
    },
    {
      title: "AI Generated: Weekly Motivation",
      description: "Motivational content to inspire our community and drive engagement",
      platforms: ["linkedin", "x", "instagram"],
      content: {
        content: "Success isn't just about reaching the destination—it's about who you become on the journey. Every challenge you face, every obstacle you overcome, shapes you into the person capable of achieving your dreams. 💪",
        variations: {
          linkedin: "Success isn't just about reaching the destination—it's about who you become on the journey. In business and in life, every challenge we face and every obstacle we overcome shapes us into the leaders capable of achieving our greatest dreams. The skills you develop, the resilience you build, and the relationships you form along the way are often more valuable than the end goal itself. What lesson has your journey taught you recently?",
          x: "Success isn't about the destination—it's about who you become on the journey. Every challenge shapes you into someone capable of achieving your dreams. 💪 #MondayMotivation #GrowthMindset #Success",
          instagram: "Success isn't just about reaching the destination—it's about who you become on the journey ✨ Every challenge you face shapes you into the person capable of achieving your dreams 💪 What's one challenge that made you stronger? Share below! 👇"
        },
        suggestedHashtags: {
          linkedin: ["#Leadership", "#PersonalGrowth", "#Success", "#Motivation"],
          x: ["#MondayMotivation", "#GrowthMindset", "#Success", "#Inspiration"],
          instagram: ["#MondayMotivation", "#PersonalGrowth", "#Inspiration", "#Success", "#Mindset"]
        },
        visualSuggestions: {
          linkedin: ["professional quote graphics", "inspirational landscape", "team success imagery"],
          x: ["motivational quote cards", "success imagery", "growth graphics"],
          instagram: ["inspirational quote overlay", "motivational lifestyle photo", "success story carousel"]
        }
      },
      status: "scheduled",
      aiGenerated: true,
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      title: "Behind the Scenes: Our Team",
      description: "Showcase our amazing team and company culture",
      platforms: ["instagram", "linkedin", "facebook"],
      content: {
        content: "Meet the incredible team behind our success! 👥 From our creative designers to our dedicated customer service representatives, every person plays a vital role in delivering excellence to our customers every single day.",
        variations: {
          instagram: "Meet the incredible team behind our success! 👥✨ From creative designers to amazing customer service reps, every person brings something special to deliver excellence daily 💙 #TeamSpotlight #BehindTheScenes",
          linkedin: "Today we want to spotlight the incredible team that makes our success possible. From our innovative designers who bring creative visions to life, to our dedicated customer service representatives who ensure every interaction exceeds expectations, each team member plays a vital role in our mission. We're grateful for their passion, expertise, and commitment to delivering excellence every single day. #TeamAppreciation #CompanyCulture",
          facebook: "We believe our team is our greatest asset! 💙 Today we're highlighting the amazing people behind our brand - from our creative designers who bring fresh ideas to life, to our customer service team who go above and beyond for every customer. Each person brings unique talents and passion that make our company special. What qualities do you value most in a great team?"
        },
        suggestedHashtags: {
          instagram: ["#TeamSpotlight", "#BehindTheScenes", "#CompanyCulture", "#TeamWork"],
          linkedin: ["#TeamAppreciation", "#CompanyCulture", "#Leadership", "#EmployeeSpotlight"],
          facebook: ["#TeamWork", "#CompanyCulture", "#BehindTheScenes", "#GreatTeam"]
        },
        visualSuggestions: {
          instagram: ["team candid photos", "office behind-the-scenes", "individual team member spotlights"],
          linkedin: ["professional team photos", "office culture shots", "team collaboration imagery"],
          facebook: ["team group photos", "workplace candids", "team achievement celebrations"]
        }
      },
      status: "draft",
      aiGenerated: false,
    }
  ];

  for (const campaignData of campaignsData) {
    try {
      await storage.createCampaign({ userId, ...campaignData });
    } catch (error) {
      console.log(`Campaign creation skipped`);
    }
  }

  // Create demo content plan
  try {
    await storage.createContentPlan({
      userId,
      title: "Q4 2024 Content Strategy",
      description: "Comprehensive content strategy for the fourth quarter focusing on holiday campaigns and year-end promotions",
      month: 12,
      year: 2024,
      strategy: {
        insights: [
          "Holiday shopping peaks in November and December, with Black Friday and Cyber Monday as key conversion periods",
          "Instagram engagement rates increase 23% during holiday season with visual content",
          "LinkedIn shows higher B2B engagement during Q4 planning season",
          "TikTok holiday hashtags trend 300% higher in December"
        ],
        recommendations: [
          "Focus on gift-guide content and holiday styling tips",
          "Create behind-the-scenes content showing holiday preparation",
          "Develop user-generated content campaigns with holiday hashtags",
          "Plan early Black Friday and Cyber Monday promotional content"
        ],
        posts: [
          {
            date: "2024-12-01",
            platform: "instagram",
            contentType: "holiday_gift_guide",
            title: "Ultimate Holiday Gift Guide 2024",
            description: "Curated selection of our best products perfect for holiday gifting",
            hashtags: ["#HolidayGifts", "#GiftGuide2024", "#HolidayStyle"],
            optimalTime: "6:00 PM"
          },
          {
            date: "2024-12-15",
            platform: "tiktok", 
            contentType: "behind_the_scenes",
            title: "Holiday Package Prep Behind the Scenes",
            description: "Show our team preparing beautiful holiday packages",
            hashtags: ["#BehindTheScenes", "#HolidayPrep", "#PackagingASMR"],
            optimalTime: "7:00 PM"
          }
        ]
      },
      status: "active"
    });
  } catch (error) {
    console.log(`Content plan creation skipped`);
  }

  // Create demo customers
  const customersData = [
    { name: "Tech Solutions Inc", email: "contact@techsolutions.com", phone: "+1 (555) 123-4567", status: "active", totalInvoiced: 15750.00 },
    { name: "Creative Agency LLC", email: "hello@creativeagency.com", phone: "+1 (555) 234-5678", status: "active", totalInvoiced: 8900.50 },
    { name: "Startup Ventures", email: "team@startupventures.com", phone: "+1 (555) 345-6789", status: "active", totalInvoiced: 12300.00 },
    { name: "Local Restaurant Group", email: "manager@localeatery.com", phone: "+1 (555) 456-7890", status: "inactive", totalInvoiced: 3200.00 },
  ];

  for (const customerData of customersData) {
    try {
      await storage.createCustomer({ userId, ...customerData });
    } catch (error) {
      console.log(`Customer creation skipped`);
    }
  }

  // Create demo analytics
  const analyticsData = [
    { platform: "instagram", metric: "reach", value: 15420, period: "weekly", recordedAt: new Date().toISOString() },
    { platform: "instagram", metric: "engagement", value: 1247, period: "weekly", recordedAt: new Date().toISOString() },
    { platform: "facebook", metric: "reach", value: 8750, period: "weekly", recordedAt: new Date().toISOString() },
    { platform: "facebook", metric: "engagement", value: 892, period: "weekly", recordedAt: new Date().toISOString() },
    { platform: "tiktok", metric: "reach", value: 22100, period: "weekly", recordedAt: new Date().toISOString() },
    { platform: "tiktok", metric: "engagement", value: 2847, period: "weekly", recordedAt: new Date().toISOString() },
  ];

  for (const analyticsEntry of analyticsData) {
    try {
      await storage.createAnalyticsEntry({ userId, ...analyticsEntry });
    } catch (error) {
      console.log(`Analytics entry creation skipped`);
    }
  }

  // Create demo activity logs
  const activityLogsData = [
    { action: "connect_social_account", description: "Connected Instagram account @mybusiness", entityType: "social_account", entityId: "1" },
    { action: "create_campaign", description: "Created Summer Product Launch 2024 campaign", entityType: "campaign", entityId: "1" },
    { action: "generate_ai_campaign", description: "Generated AI campaign: Weekly Motivation", entityType: "campaign", entityId: "2" },
    { action: "publish_campaign", description: "Published Summer Product Launch 2024 to 3 platforms", entityType: "campaign", entityId: "1" },
    { action: "connect_social_account", description: "Connected TikTok account @mybiz", entityType: "social_account", entityId: "2" },
    { action: "create_content_plan", description: "Created Q4 2024 Content Strategy", entityType: "content_plan", entityId: "1" },
  ];

  for (const activityData of activityLogsData) {
    try {
      await storage.createActivityLog({ userId, ...activityData });
    } catch (error) {
      console.log(`Activity log creation skipped`);
    }
  }

  console.log("Demo data initialized successfully");
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
