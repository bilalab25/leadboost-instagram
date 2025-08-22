import { text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Social Accounts
export const socialAccounts = pgTable('social_accounts', {
  id: serial('id').primaryKey(),
  platformType: varchar('platform_type', { length: 50 }).notNull(), // 'instagram', 'whatsapp', 'email', 'tiktok'
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accountId: varchar('account_id', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Conversations/Leads
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  socialAccountId: integer('social_account_id').references(() => socialAccounts.id),
  customerName: varchar('customer_name', { length: 255 }),
  customerId: varchar('customer_id', { length: 255 }),
  platform: varchar('platform', { length: 50 }).notNull(),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at'),
  status: varchar('status', { length: 50 }).default('open'), // 'open', 'closed', 'pending'
  assignedToUser: varchar('assigned_to_user', { length: 255 }),
  metadata: jsonb('metadata'), // Platform-specific data
  createdAt: timestamp('created_at').defaultNow(),
});

// Messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').references(() => conversations.id),
  messageId: varchar('message_id', { length: 255 }), // Platform message ID
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text'), // 'text', 'image', 'video', 'file'
  direction: varchar('direction', { length: 10 }).notNull(), // 'inbound', 'outbound'
  senderName: varchar('sender_name', { length: 255 }),
  attachments: jsonb('attachments'), // Array of attachment URLs/data
  timestamp: timestamp('timestamp').defaultNow(),
});

// Campaigns
export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content').notNull(),
  visualDesign: jsonb('visual_design'), // Generated visual elements
  targetPlatforms: text('target_platforms').array(), // ['instagram', 'tiktok', etc.]
  scheduledDate: timestamp('scheduled_date'),
  status: varchar('status', { length: 50 }).default('draft'), // 'draft', 'scheduled', 'published', 'completed'
  createdBy: varchar('created_by', { length: 255 }),
  aiGenerated: boolean('ai_generated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// AI Feed Plans
export const feedPlans = pgTable('feed_plans', {
  id: serial('id').primaryKey(),
  month: varchar('month', { length: 7 }).notNull(), // '2025-08' format
  businessData: jsonb('business_data'), // POS data, sales data, etc.
  industryTrends: jsonb('industry_trends'),
  generatedContent: jsonb('generated_content'), // Array of planned posts
  aiPrompt: text('ai_prompt'),
  status: varchar('status', { length: 50 }).default('draft'),
  approvedBy: varchar('approved_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Business Data Integration
export const businessData = pgTable('business_data', {
  id: serial('id').primaryKey(),
  dataType: varchar('data_type', { length: 100 }).notNull(), // 'pos', 'sales', 'inventory', 'customers'
  source: varchar('source', { length: 255 }), // POS system name, database, etc.
  data: jsonb('data').notNull(),
  lastSync: timestamp('last_sync').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Posts/Content
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  campaignId: integer('campaign_id').references(() => campaigns.id),
  feedPlanId: integer('feed_plan_id').references(() => feedPlans.id),
  content: text('content').notNull(),
  mediaUrls: text('media_urls').array(),
  platforms: text('platforms').array(),
  scheduledDate: timestamp('scheduled_date'),
  publishedAt: timestamp('published_at'),
  status: varchar('status', { length: 50 }).default('draft'),
  engagement: jsonb('engagement'), // Likes, shares, comments per platform
  aiGenerated: boolean('ai_generated').default(false),
});

// Insert schemas
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, createdAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertFeedPlanSchema = createInsertSchema(feedPlans).omit({ id: true, createdAt: true });
export const insertBusinessDataSchema = createInsertSchema(businessData).omit({ id: true, lastSync: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true });

// Types
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type FeedPlan = typeof feedPlans.$inferSelect;
export type InsertFeedPlan = z.infer<typeof insertFeedPlanSchema>;
export type BusinessData = typeof businessData.$inferSelect;
export type InsertBusinessData = z.infer<typeof insertBusinessDataSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;