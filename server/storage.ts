import {
  users,
  socialAccounts,
  messages,
  contentPlans,
  campaigns,
  analytics,
  activityLogs,
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
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, userId));
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
    return db
      .select()
      .from(contentPlans)
      .where(eq(contentPlans.userId, userId))
      .orderBy(desc(contentPlans.createdAt));
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
    return db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
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
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
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
}

export const storage = new DatabaseStorage();
