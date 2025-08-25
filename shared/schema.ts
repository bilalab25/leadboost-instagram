import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media accounts connected to users
export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // instagram, whatsapp, email, tiktok
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages from all social platforms
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  socialAccountId: uuid("social_account_id").references(() => socialAccounts.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull(),
  senderName: varchar("sender_name").notNull(),
  senderAvatar: varchar("sender_avatar"),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("text"), // text, image, video, audio
  isRead: boolean("is_read").default(false),
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  tags: text("tags").array(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI-generated content plans
export const contentPlans = pgTable("content_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  strategy: text("strategy"),
  insights: jsonb("insights"),
  posts: jsonb("posts"), // Array of planned posts
  status: varchar("status").default("draft"), // draft, approved, published
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media campaigns
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  platforms: text("platforms").array(), // which platforms to post to
  content: jsonb("content"), // post content, images, etc
  scheduledFor: timestamp("scheduled_for"),
  status: varchar("status").default("draft"), // draft, scheduled, published, failed
  aiGenerated: boolean("ai_generated").default(false),
  performance: jsonb("performance"), // engagement metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business analytics data
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(),
  date: timestamp("date").notNull(),
  metrics: jsonb("metrics"), // reach, engagement, conversions, etc
  createdAt: timestamp("created_at").defaultNow(),
});

// Team activity logs
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(),
  description: text("description"),
  entityType: varchar("entity_type"), // message, campaign, content_plan
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table for business customer management
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  company: varchar("company"),
  address: text("address"),
  notes: text("notes"),
  status: varchar("status").default("active"), // active, inactive, prospect
  totalInvoiced: integer("total_invoiced").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices table for customer invoicing with file uploads
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(), // amount in cents
  currency: varchar("currency").default("USD"),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, paid, overdue, cancelled
  fileUrl: varchar("file_url"), // path to uploaded invoice file
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team tasks for enhanced team management
export const teamTasks = pgTable("team_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  assignedBy: varchar("assigned_by").references(() => users.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  status: varchar("status").default("pending"), // pending, in_progress, completed, cancelled
  dueDate: timestamp("due_date"),
  requiresProof: boolean("requires_proof").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task completions with proof file uploads
export const taskCompletions = pgTable("task_completions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").references(() => teamTasks.id, { onDelete: "cascade" }),
  completedBy: varchar("completed_by").references(() => users.id, { onDelete: "cascade" }),
  notes: text("notes"),
  proofFileUrl: varchar("proof_file_url"), // path to uploaded proof file
  completedAt: timestamp("completed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  contentPlans: many(contentPlans),
  campaigns: many(campaigns),
  analytics: many(analytics),
  activityLogs: many(activityLogs),
  assignedMessages: many(messages),
  customers: many(customers),
  invoices: many(invoices),
  assignedTasks: many(teamTasks, { relationName: "assignedTasks" }),
  createdTasks: many(teamTasks, { relationName: "createdTasks" }),
  completedTasks: many(taskCompletions),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  socialAccount: one(socialAccounts, {
    fields: [messages.socialAccountId],
    references: [socialAccounts.id],
  }),
  assignedUser: one(users, {
    fields: [messages.assignedTo],
    references: [users.id],
  }),
}));

export const contentPlansRelations = relations(contentPlans, ({ one }) => ({
  user: one(users, {
    fields: [contentPlans.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  user: one(users, {
    fields: [analytics.userId],
    references: [users.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, {
    fields: [customers.userId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
}));

export const teamTasksRelations = relations(teamTasks, ({ one, many }) => ({
  assignedByUser: one(users, {
    fields: [teamTasks.assignedBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
  assignedToUser: one(users, {
    fields: [teamTasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  completions: many(taskCompletions),
}));

export const taskCompletionsRelations = relations(taskCompletions, ({ one }) => ({
  task: one(teamTasks, {
    fields: [taskCompletions.taskId],
    references: [teamTasks.id],
  }),
  completedByUser: one(users, {
    fields: [taskCompletions.completedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertContentPlanSchema = createInsertSchema(contentPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamTaskSchema = createInsertSchema(teamTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskCompletionSchema = createInsertSchema(taskCompletions).omit({
  id: true,
  completedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertContentPlan = z.infer<typeof insertContentPlanSchema>;
export type ContentPlan = typeof contentPlans.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertTeamTask = z.infer<typeof insertTeamTaskSchema>;
export type TeamTask = typeof teamTasks.$inferSelect;
export type InsertTaskCompletion = z.infer<typeof insertTaskCompletionSchema>;
export type TaskCompletion = typeof taskCompletions.$inferSelect;
