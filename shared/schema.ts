import { sql, relations } from "drizzle-orm";
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
  unique,
  numeric,
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
// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Eliminar .default(sql`gen_random_uuid()`)
  email: varchar("email").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  firebaseUid: varchar("firebase_uid").unique(),
  provider: varchar("provider"), // Auth provider: google.com, password, etc.
  role: varchar("role").default("agency_owner"), // agency_owner, agency_member, client_viewer
  hierarchyLevel: integer("hierarchy_level").default(1), // 1=CEO/Owner, 2=Manager, 3=Supervisor, 4=Employee
  canApprove: boolean("can_approve").default(false), // Can approve tasks from lower hierarchy
  reportsTo: varchar("reports_to"), // Direct manager/supervisor - will add reference in relations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  phone: varchar("phone"),
  address: varchar("address"),
});

// Subscription plans for tiered pricing
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  planType: varchar("plan_type").notNull(), // starter, professional, enterprise, agency
  planTier: varchar("plan_tier"), // For agency: agency-5, agency-10, agency-20, agency-50+
  brandLimit: integer("brand_limit"), // Number of brands allowed
  monthlyPrice: integer("monthly_price").notNull(), // Price in cents
  isActive: boolean("is_active").default(true),
  billingCycle: varchar("billing_cycle").default("monthly"), // monthly, yearly
  trialEndsAt: timestamp("trial_ends_at"),
  lastBilledAt: timestamp("last_billed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brands/Clients table for multi-tenant agency management
export const brands = pgTable("brands", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }), // agency owner
  name: varchar("name").notNull(),
  domain: varchar("domain"),
  industry: varchar("industry"),
  logo: varchar("logo"),
  primaryColor: varchar("primary_color").default("#0066cc"),
  description: text("description"),
  settings: jsonb("settings"), // brand-specific settings
  isActive: boolean("is_active").default(true),
  onboardingStep: integer("onboarding_step").default(1), // Current step in onboarding (1-5)
  onboardingCompleted: boolean("onboarding_completed").default(false), // Whether onboarding is finished
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand memberships - Associates users with brands and their roles
export const brandMemberships = pgTable(
  "brand_memberships",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    role: varchar("role").notNull().default("viewer"), // owner, admin, editor, viewer
    status: varchar("status").notNull().default("active"), // active, invited, suspended
    invitedBy: varchar("invited_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("brand_memberships_user_brand_unique").on(
      table.userId,
      table.brandId,
    ),
    index("brand_memberships_user_idx").on(table.userId),
    index("brand_memberships_brand_idx").on(table.brandId),
  ],
);

// Brand invitations - Invite codes for joining brands
export const brandInvitations = pgTable(
  "brand_invitations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    inviteCode: varchar("invite_code").notNull().unique(),
    email: varchar("email"), // Optional: pre-assign to specific email
    role: varchar("role").notNull().default("viewer"), // Role to assign when accepted
    invitedBy: varchar("invited_by")
      .notNull()
      .references(() => users.id),
    status: varchar("status").notNull().default("pending"), // pending, accepted, expired
    expiresAt: timestamp("expires_at"), // Optional expiration
    acceptedBy: varchar("accepted_by").references(() => users.id),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("brand_invitations_brand_idx").on(table.brandId)],
);

// Social media accounts connected to users and brands
export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  platform: varchar("platform").notNull(), // instagram, whatsapp, email, tiktok
  accountId: varchar("account_id").notNull(),
  accountName: varchar("account_name").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations table - Groups messages from Meta platforms
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    metaConversationId: text("meta_conversation_id").notNull(), // Meta-specific conversation ID
    platform: varchar("platform").notNull(), // whatsapp, messenger, instagram, threads
    contactName: varchar("contact_name"), // Contact/participant name
    contactProfilePicture: text("contact_profile_picture"), // Profile picture URL from Meta API
    contactProfilePictureFetchedAt: timestamp(
      "contact_profile_picture_fetched_at",
    ), // When profile picture was last fetched
    lastMessage: text("last_message"), // Preview of last message
    lastMessageAt: timestamp("last_message_at").defaultNow(),
    unreadCount: integer("unread_count").default(0),
    flag: varchar("flag").default("none"), // none, important, archived
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("conversations_integration_meta_unique").on(
      table.integrationId,
      table.metaConversationId,
    ),
    index("conversations_integration_idx").on(table.integrationId),
    index("conversations_user_idx").on(table.userId),
    index("conversations_brand_idx").on(table.brandId),
  ],
);

// DEPRECATED: Old conversation threads table - Use conversations table instead
export const conversationThreads = pgTable("conversation_threads", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  socialAccountId: uuid("social_account_id").references(
    () => socialAccounts.id,
    { onDelete: "cascade" },
  ),
  participantId: varchar("participant_id").notNull(), // customer's ID on the platform
  participantName: varchar("participant_name").notNull(),
  participantAvatar: varchar("participant_avatar"),
  platform: varchar("platform").notNull(), // instagram, whatsapp, etc.
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  lastMessagePreview: text("last_message_preview"),
  isRead: boolean("is_read").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages from all social platforms - Webhook storage
export const messages = pgTable(
  "messages",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }), // Routing key: platform user who owns the conversation
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => integrations.id, { onDelete: "cascade" }), // Integration that received the message
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }), // Link to conversation
    platform: varchar("platform").notNull(), // whatsapp, messenger, instagram
    metaMessageId: varchar("meta_message_id").notNull(), // Unique Meta ID (wamid... or mid...) - Composite UNIQUE with integrationId
    metaConversationId: text("meta_conversation_id"), // Meta conversation/thread ID for grouping messages
    senderId: varchar("sender_id").notNull(), // ID of the end user who sent the message
    recipientId: varchar("recipient_id").notNull(), // ID of the page/number that received the message
    contactName: varchar("contact_name"), // Contact profile name from WhatsApp
    textContent: text("text_content"), // Message content
    direction: varchar("direction").notNull(), // inbound (Incoming) or outbound (Outgoing/Echo)
    isRead: boolean("is_read").default(false), // Read status for message
    timestamp: timestamp("timestamp").notNull(), // When the event occurred
    rawPayload: jsonb("raw_payload"), // Complete webhook payload for reference
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("messages_integration_message_unique").on(
      table.integrationId,
      table.metaMessageId,
    ),
    index("messages_conversation_idx").on(table.conversationId),
    index("messages_brand_idx").on(table.brandId),
  ],
);

// Message attachments (images, videos, files)
export const messageAttachments = pgTable("message_attachments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  messageId: uuid("message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  type: varchar("type").notNull(), // image, video, file, audio
  url: text("url").notNull(),
  fileName: varchar("file_name"),
  fileSize: integer("file_size"), // in bytes
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversation history between user and AI agent
export const conversationHistory = pgTable(
  "conversation_history",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role").notNull(), // "user" or "agent"
    contentType: varchar("content_type").notNull(), // "text" or "image"
    content: text("content").notNull(), // Message text or image URL
    metadata: jsonb("metadata"), // Additional data (image dimensions, etc.)
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("conversation_history_brand_idx").on(table.brandId),
    index("conversation_history_user_idx").on(table.userId),
    index("conversation_history_created_idx").on(table.createdAt),
  ],
);

// AI-generated content plans per brand
export const contentPlans = pgTable("content_plans", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
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

// Social media campaigns per brand
export const campaigns = pgTable("campaigns", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  title: varchar("title").notNull(),
  description: text("description"),
  platforms: text("platforms").array(), // which platforms to post to
  content: jsonb("content"), // post content, images, etc
  platformContent: jsonb("platform_content"), // platform-specific content variations
  adFormats: jsonb("ad_formats"), // selected ad formats per platform
  targetAudience: jsonb("target_audience"), // audience targeting per platform
  budget: jsonb("budget"), // budget allocation per platform/format
  scheduledFor: timestamp("scheduled_for"),
  status: varchar("status").default("draft"), // draft, scheduled, published, failed
  aiGenerated: boolean("ai_generated").default(false),
  performance: jsonb("performance"), // engagement metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Business analytics data per brand
export const analytics = pgTable("analytics", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  platform: varchar("platform").notNull(),
  metric: varchar("metric").notNull(), // reach, engagement, clicks, etc
  value: integer("value").notNull(),
  period: varchar("period").default("daily"), // daily, weekly, monthly
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team activity logs per brand
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  action: varchar("action").notNull(),
  description: text("description"),
  entityType: varchar("entity_type"), // message, campaign, content_plan, brand
  entityId: varchar("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// POS system integrations (Square, Shopify, etc.) per brand
export const posIntegrations = pgTable("pos_integrations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  provider: varchar("provider").notNull(), // square, shopify, stripe, woocommerce, etc.
  storeName: varchar("store_name").notNull(),
  apiKey: text("api_key"), // encrypted
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  storeUrl: varchar("store_url"),
  webhookUrl: varchar("webhook_url"),
  isActive: boolean("is_active").default(true),
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings"), // provider-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales transactions from POS systems
export const salesTransactions = pgTable("sales_transactions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  posIntegrationId: uuid("pos_integration_id").references(
    () => posIntegrations.id,
    { onDelete: "cascade" },
  ),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  posCustomerId: uuid("pos_customer_id"), // link to internal posCustomers table
  transactionId: varchar("transaction_id").notNull(), // external transaction ID
  customerId: varchar("customer_id"), // external customer ID
  customerEmail: varchar("customer_email"),
  customerName: varchar("customer_name"),
  customerPhone: varchar("customer_phone"),
  totalAmount: integer("total_amount").notNull(), // in cents
  currency: varchar("currency").default("USD"),
  status: varchar("status").notNull(), // completed, refunded, pending
  paymentMethod: varchar("payment_method"), // card, cash, digital_wallet
  items: jsonb("items"), // array of purchased items
  metadata: jsonb("metadata"), // additional transaction data
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product catalog from POS systems
export const products = pgTable("products", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  posIntegrationId: uuid("pos_integration_id").references(
    () => posIntegrations.id,
    { onDelete: "cascade" },
  ),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  externalProductId: varchar("external_product_id").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: integer("price"), // in cents
  currency: varchar("currency").default("USD"),
  sku: varchar("sku"),
  category: varchar("category"),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  stockQuantity: integer("stock_quantity"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// POS Customers - Customers synced from POS systems (Lightspeed, Square, etc.)
export const posCustomers = pgTable(
  "pos_customers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    posIntegrationId: uuid("pos_integration_id")
      .notNull()
      .references(() => posIntegrations.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    externalCustomerId: varchar("external_customer_id").notNull(), // Lightspeed customer ID
    customerCode: varchar("customer_code"), // Lightspeed customer_code
    name: varchar("name").notNull(),
    firstName: varchar("first_name"),
    lastName: varchar("last_name"),
    email: varchar("email"),
    phone: varchar("phone"),
    mobile: varchar("mobile"),
    companyName: varchar("company_name"),
    loyaltyBalance: numeric("loyalty_balance"),
    yearToDate: numeric("year_to_date"), // Total spent this year
    balance: numeric("balance"), // Account balance
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }), // Link to WhatsApp conversation
    metadata: jsonb("metadata"), // Additional customer data from POS
    lastSyncAt: timestamp("last_sync_at").defaultNow(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("pos_customers_integration_external_unique").on(
      table.posIntegrationId,
      table.externalCustomerId,
    ),
    index("pos_customers_brand_idx").on(table.brandId),
    index("pos_customers_phone_idx").on(table.phone),
    index("pos_customers_mobile_idx").on(table.mobile),
  ],
);

// Automated campaign triggers based on POS data
export const campaignTriggers = pgTable("campaign_triggers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  name: varchar("name").notNull(),
  triggerType: varchar("trigger_type").notNull(), // purchase_milestone, low_stock, new_customer, abandoned_cart
  conditions: jsonb("conditions"), // trigger conditions
  campaignTemplate: jsonb("campaign_template"), // template for auto-generated campaigns
  platforms: text("platforms").array(), // which platforms to post to
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table for business customer management
export const customers = pgTable(
  "customers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: varchar("name").notNull(),
    email: varchar("email"),
    phone: varchar("phone"),
    company: varchar("company"),
    address: text("address"),
    notes: text("notes"),
    status: varchar("status").default("active"), // active, inactive, prospect
    totalInvoiced: integer("total_invoiced").default(0),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("customers_brand_idx").on(table.brandId)],
);

// Invoices table for customer invoicing with file uploads
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
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
  },
  (table) => [index("invoices_brand_idx").on(table.brandId)],
);

// Team tasks for enhanced team management
export const teamTasks = pgTable("team_tasks", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  assignedBy: varchar("assigned_by").references(() => users.id, {
    onDelete: "cascade",
  }),
  assignedTo: varchar("assigned_to").references(() => users.id, {
    onDelete: "cascade",
  }),
  title: varchar("title").notNull(),
  description: text("description"),
  priority: varchar("priority").default("medium"), // low, medium, high, urgent
  status: varchar("status").default("pending"), // pending, in_progress, completed, cancelled
  dueDate: timestamp("due_date"),
  requiresProof: boolean("requires_proof").default(true),
  proofFileUrl: varchar("proof_file_url"), // URL to uploaded proof file
  proofSubmittedAt: timestamp("proof_submitted_at"),
  proofSubmittedBy: varchar("proof_submitted_by").references(() => users.id),
  approvalStatus: varchar("approval_status").default("pending"), // pending, submitted, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task completions with proof file uploads
export const taskCompletions = pgTable("task_completions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").references(() => teamTasks.id, {
    onDelete: "cascade",
  }),
  completedBy: varchar("completed_by").references(() => users.id, {
    onDelete: "cascade",
  }),
  notes: text("notes"),
  proofFileUrl: varchar("proof_file_url"), // path to uploaded proof file
  completedAt: timestamp("completed_at").defaultNow(),
});

// Task approval workflow table
export const taskApprovals = pgTable("task_approvals", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").references(() => teamTasks.id, {
    onDelete: "cascade",
  }),
  approverLevel: integer("approver_level").notNull(), // Hierarchy level required to approve
  approverId: varchar("approver_id").references(() => users.id),
  status: varchar("status").default("pending"), // pending, approved, rejected
  comments: text("comments"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification system for approvals
export const approvalNotifications = pgTable("approval_notifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  taskId: uuid("task_id").references(() => teamTasks.id, {
    onDelete: "cascade",
  }),
  type: varchar("type").notNull(), // approval_request, task_approved, task_rejected, proof_submitted
  title: varchar("title").notNull(),
  message: text("message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  subscriptionPlan: one(subscriptionPlans, {
    fields: [users.id],
    references: [subscriptionPlans.userId],
  }),
  brands: many(brands),
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
  // Hierarchy relations
  manager: one(users, {
    fields: [users.reportsTo],
    references: [users.id],
    relationName: "manager",
  }),
  subordinates: many(users, { relationName: "manager" }),
  // Approval relations
  approvals: many(taskApprovals, { relationName: "approver" }),
  notifications: many(approvalNotifications, { relationName: "user" }),
}));

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ one }) => ({
    user: one(users, {
      fields: [subscriptionPlans.userId],
      references: [users.id],
    }),
  }),
);

export const brandsRelations = relations(brands, ({ one, many }) => ({
  owner: one(users, {
    fields: [brands.userId],
    references: [users.id],
  }),
  socialAccounts: many(socialAccounts),
  contentPlans: many(contentPlans),
  campaigns: many(campaigns),
  analytics: many(analytics),
  activityLogs: many(activityLogs),
  posIntegrations: many(posIntegrations),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
  brand: one(brands, {
    fields: [socialAccounts.brandId],
    references: [brands.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    integration: one(integrations, {
      fields: [conversations.integrationId],
      references: [integrations.id],
    }),
    messages: many(messages),
  }),
);

export const conversationThreadsRelations = relations(
  conversationThreads,
  ({ one }) => ({
    socialAccount: one(socialAccounts, {
      fields: [conversationThreads.socialAccountId],
      references: [socialAccounts.id],
    }),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  integration: one(integrations, {
    fields: [messages.integrationId],
    references: [integrations.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const messageAttachmentsRelations = relations(
  messageAttachments,
  ({ one }) => ({
    message: one(messages, {
      fields: [messageAttachments.messageId],
      references: [messages.id],
    }),
  }),
);

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
  approvals: many(taskApprovals, { relationName: "taskApprovals" }),
  notifications: many(approvalNotifications, { relationName: "task" }),
  // Proof submission relation
  proofSubmitter: one(users, {
    fields: [teamTasks.proofSubmittedBy],
    references: [users.id],
    relationName: "proofSubmissions",
  }),
  approver: one(users, {
    fields: [teamTasks.approvedBy],
    references: [users.id],
    relationName: "taskApprovals",
  }),
}));

export const taskCompletionsRelations = relations(
  taskCompletions,
  ({ one }) => ({
    task: one(teamTasks, {
      fields: [taskCompletions.taskId],
      references: [teamTasks.id],
    }),
    completedByUser: one(users, {
      fields: [taskCompletions.completedBy],
      references: [users.id],
    }),
  }),
);

export const taskApprovalsRelations = relations(taskApprovals, ({ one }) => ({
  task: one(teamTasks, {
    fields: [taskApprovals.taskId],
    references: [teamTasks.id],
    relationName: "taskApprovals",
  }),
  approver: one(users, {
    fields: [taskApprovals.approverId],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const approvalNotificationsRelations = relations(
  approvalNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [approvalNotifications.userId],
      references: [users.id],
      relationName: "user",
    }),
    task: one(teamTasks, {
      fields: [approvalNotifications.taskId],
      references: [teamTasks.id],
      relationName: "task",
    }),
  }),
);

// Insert schemas
export const insertSocialAccountSchema = createInsertSchema(
  socialAccounts,
).omit({
  id: true,
  createdAt: true,
});

export const insertConversationThreadSchema = createInsertSchema(
  conversationThreads,
).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertMessageAttachmentSchema = createInsertSchema(
  messageAttachments,
).omit({
  id: true,
  createdAt: true,
});

export const insertContentPlanSchema = createInsertSchema(contentPlans).omit({
  id: true,
  userId: true,
  brandId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  userId: true,
  brandId: true,
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
  userId: true,
  brandId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    userId: true,
    brandId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    dueDate: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === "string" ? new Date(val) : val))
      .optional()
      .nullable(),
    paidDate: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === "string" ? new Date(val) : val))
      .optional()
      .nullable(),
  });

export const insertTeamTaskSchema = createInsertSchema(teamTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  proofSubmittedAt: true,
  approvedAt: true,
});

export const insertTaskCompletionSchema = createInsertSchema(
  taskCompletions,
).omit({
  id: true,
  completedAt: true,
});

export const insertTaskApprovalSchema = createInsertSchema(taskApprovals).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertApprovalNotificationSchema = createInsertSchema(
  approvalNotifications,
).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Brand types
export const insertSubscriptionPlanSchema = createInsertSchema(
  subscriptionPlans,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscriptionPlan = z.infer<
  typeof insertSubscriptionPlanSchema
>;
export type SelectSubscriptionPlan = typeof subscriptionPlans.$inferSelect;

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBrand = z.infer<typeof insertBrandSchema>;
export type SelectBrand = typeof brands.$inferSelect;

// Brand Memberships insert/select schemas
export const insertBrandMembershipSchema = createInsertSchema(
  brandMemberships,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertBrandMembership = z.infer<typeof insertBrandMembershipSchema>;
export type SelectBrandMembership = typeof brandMemberships.$inferSelect;

// Extended type for API response with brand metadata
export type BrandMembershipWithBrand = SelectBrandMembership & {
  brandName: string;
  brandColor: string | null;
  brandIndustry: string | null;
  brandDescription: string | null;
  brandDomain: string | null;
};

// Brand Invitations insert/select schemas
export const insertBrandInvitationSchema = createInsertSchema(
  brandInvitations,
).omit({
  id: true,
  createdAt: true,
});
export type InsertBrandInvitation = z.infer<typeof insertBrandInvitationSchema>;
export type SelectBrandInvitation = typeof brandInvitations.$inferSelect;
export type Brand = typeof brands.$inferSelect;

// POS Integration types
export type InsertPosIntegration = typeof posIntegrations.$inferInsert;
export type PosIntegration = typeof posIntegrations.$inferSelect;

export type InsertSalesTransaction = typeof salesTransactions.$inferInsert;
export type SalesTransaction = typeof salesTransactions.$inferSelect;

export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;

export type InsertCampaignTrigger = typeof campaignTriggers.$inferInsert;
export type CampaignTrigger = typeof campaignTriggers.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertConversationThread = z.infer<
  typeof insertConversationThreadSchema
>;
export type ConversationThread = typeof conversationThreads.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertMessageAttachment = z.infer<
  typeof insertMessageAttachmentSchema
>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
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
export type InsertTaskApproval = z.infer<typeof insertTaskApprovalSchema>;
export type TaskApproval = typeof taskApprovals.$inferSelect;
export type InsertApprovalNotification = z.infer<
  typeof insertApprovalNotificationSchema
>;
export type ApprovalNotification = typeof approvalNotifications.$inferSelect;

// POS Integration schemas
export const insertPosIntegrationSchema = createInsertSchema(
  posIntegrations,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesTransactionSchema = createInsertSchema(
  salesTransactions,
).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignTriggerSchema = createInsertSchema(
  campaignTriggers,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPosIntegrationType = z.infer<
  typeof insertPosIntegrationSchema
>;
export type InsertSalesTransactionType = z.infer<
  typeof insertSalesTransactionSchema
>;
export type InsertProductType = z.infer<typeof insertProductSchema>;
export type InsertCampaignTriggerType = z.infer<
  typeof insertCampaignTriggerSchema
>;

// Brand Design System tables
export const brandDesigns = pgTable("brand_designs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  brandStyle: varchar("brand_style"), // minimalist, luxury, etc.
  colorPrimary: varchar("color_primary"),
  colorAccent1: varchar("color_accent1"),
  colorAccent2: varchar("color_accent2"),
  colorAccent3: varchar("color_accent3"),
  colorAccent4: varchar("color_accent4"),
  colorText1: varchar("color_text1"),
  colorText2: varchar("color_text2"),
  colorText3: varchar("color_text3"),
  colorText4: varchar("color_text4"),
  fontPrimary: varchar("font_primary"),
  fontSecondary: varchar("font_secondary"),
  customFonts: jsonb("custom_fonts"), // array with {name, url}
  logoUrl: varchar("logo_url"), // deprecated - use specific logo fields below
  whiteLogoUrl: varchar("white_logo_url"),
  blackLogoUrl: varchar("black_logo_url"),
  whiteFaviconUrl: varchar("white_favicon_url"),
  blackFaviconUrl: varchar("black_favicon_url"),
  assets: jsonb("assets"), // list of assets with {id, url, name, category, assetType}
  isDesignStudioEnabled: boolean("is_design_studio_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Design Assets
export const campaignDesigns = pgTable("campaign_designs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "cascade",
  }),
  brandDesignId: uuid("brand_design_id").references(() => brandDesigns.id, {
    onDelete: "cascade",
  }),
  platform: varchar("platform").notNull(), // instagram, tiktok, facebook, etc.

  // Visual Content
  designUrl: varchar("design_url"), // generated design file
  canvaDesignId: varchar("canva_design_id"), // if created in Canva
  designData: jsonb("design_data"), // design specifications
  isCustomized: boolean("is_customized").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand Assets table
export const brandAssets = pgTable("brand_assets", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brandDesignId: uuid("brand_design_id").references(() => brandDesigns.id, {
    onDelete: "cascade",
  }),
  url: varchar("url").notNull(),
  name: varchar("name").notNull(),
  category: varchar("category"),
  assetType: varchar("asset_type").notNull(), // image, video, document
  publicId: varchar("public_id").notNull(), // 🔹 para borrar en Cloudinary
  createdAt: timestamp("created_at").defaultNow(),
  description: text("description"),
});

// Brand Design schemas
export const insertBrandDesignSchema = createInsertSchema(brandDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignDesignSchema = createInsertSchema(
  campaignDesigns,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandAssetSchema = createInsertSchema(brandAssets).omit({
  id: true,
  createdAt: true,
});

export type InsertBrandDesign = z.infer<typeof insertBrandDesignSchema>;
export type BrandDesign = typeof brandDesigns.$inferSelect;
export type InsertCampaignDesign = z.infer<typeof insertCampaignDesignSchema>;
export type CampaignDesign = typeof campaignDesigns.$inferSelect;
export type InsertBrandAsset = z.infer<typeof insertBrandAssetSchema>;
export type BrandAsset = typeof brandAssets.$inferSelect;

// AI Chatbot Configuration
export const chatbotConfigs = pgTable("chatbot_configs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),

  // Chatbot Settings
  name: varchar("name").default("LeadBoost Assistant"),
  welcomeMessage: text("welcome_message").default(
    "Hi! I'm here to help you. How can I assist you today?",
  ),
  businessHours: jsonb("business_hours"), // {monday: {start: "09:00", end: "17:00"}, ...}
  timezone: varchar("timezone").default("America/New_York"),
  language: varchar("language").default("en"), // en, es, etc.

  // Lead Qualification
  qualificationQuestions: jsonb("qualification_questions"), // [{question: "", type: "text|select|email|phone", required: true}]
  leadScoreRules: jsonb("lead_score_rules"), // rules for scoring leads

  // AI Personality
  tone: varchar("tone").default("professional"), // professional, friendly, casual, formal
  industry: varchar("industry"), // for context-aware responses
  specialInstructions: text("special_instructions"), // custom AI instructions

  // Features
  canScheduleAppointments: boolean("can_schedule_appointments").default(true),
  canQualifyLeads: boolean("can_qualify_leads").default(true),
  canHandoffToHuman: boolean("can_handoff_to_human").default(true),
  autoResponseEnabled: boolean("auto_response_enabled").default(true),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar Integrations
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  userId: varchar("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),

  // Integration Details
  provider: varchar("provider").notNull(), // calendly, google, outlook, acuity, square, setmore
  providerUserId: varchar("provider_user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  calendarId: varchar("calendar_id"),

  // Settings
  defaultServiceDuration: integer("default_service_duration").default(30), // minutes
  bufferTime: integer("buffer_time").default(15), // minutes between appointments
  advanceBookingDays: integer("advance_booking_days").default(30), // how far ahead can book

  // Business Hours
  businessHours: jsonb("business_hours"), // {monday: {start: "09:00", end: "17:00", enabled: true}}
  timezone: varchar("timezone").default("America/New_York"),

  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services/Appointment Types
export const appointmentServices = pgTable("appointment_services", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  calendarIntegrationId: uuid("calendar_integration_id").references(
    () => calendarIntegrations.id,
    { onDelete: "cascade" },
  ),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),

  // Service Details
  name: varchar("name").notNull(), // "Consultation", "Hair Cut", "Massage"
  description: text("description"),
  duration: integer("duration").notNull(), // minutes
  price: integer("price"), // in cents
  bufferTimeBefore: integer("buffer_time_before").default(0),
  bufferTimeAfter: integer("buffer_time_after").default(15),

  // Availability
  isActive: boolean("is_active").default(true),
  maxAdvanceBookingDays: integer("max_advance_booking_days").default(30),

  // Questions for this service
  intakeQuestions: jsonb("intake_questions"), // [{question: "", type: "text", required: true}]

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// @shared/schema.ts
// Integration table schema - matches PostgreSQL structure exactly
export const integrations = pgTable(
  "integrations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(), // Maps to: user_id
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    provider: varchar("provider").notNull(), // Maps to: provider
    category: varchar("category").notNull().default("social"),
    storeName: varchar("store_name").notNull(), // Maps to: store_name
    storeUrl: varchar("store_url"), // Maps to: store_url
    pageId: varchar("page_id"), // Maps to: page_id
    accessToken: text("access_token"), // Maps to: access_token (TEXT, nullable)
    refreshToken: text("refresh_token"), // Maps to: refresh_token
    isActive: boolean("is_active").default(true), // Maps to: is_active
    syncEnabled: boolean("sync_enabled").default(true), // Maps to: sync_enabled
    lastSyncAt: timestamp("last_sync_at"), // Maps to: last_sync_at
    hasFetchedHistory: boolean("has_fetched_history").default(false), // For Messenger/Instagram initial sync
    settings: jsonb("settings").default({}), // Maps to: settings
    createdAt: timestamp("created_at").defaultNow(), // Maps to: created_at
    updatedAt: timestamp("updated_at").defaultNow(), // Maps to: updated_at
    accountName: text("account_name"), // Maps to: account_name
    accountId: text("account_id"), // Maps to: account_id
    expiresAt: timestamp("expires_at"), // Maps to: expires_at
    metadata: jsonb("metadata"), // Maps to: metadata (JSONB for structured data queries)
  },
  (table) => [index("integrations_brand_idx").on(table.brandId)],
);

// Scheduled Appointments
export const appointments = pgTable("appointments", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  calendarIntegrationId: uuid("calendar_integration_id").references(
    () => calendarIntegrations.id,
    { onDelete: "cascade" },
  ),
  serviceId: uuid("service_id").references(() => appointmentServices.id, {
    onDelete: "cascade",
  }),
  messageId: uuid("message_id").references(() => messages.id), // original conversation

  // Appointment Details
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  timezone: varchar("timezone").notNull(),

  // Customer Details
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  customerNotes: text("customer_notes"),

  // Status
  status: varchar("status").default("scheduled"), // scheduled, confirmed, cancelled, completed, no_show
  confirmationSentAt: timestamp("confirmation_sent_at"),
  reminderSentAt: timestamp("reminder_sent_at"),

  // External IDs
  providerEventId: varchar("provider_event_id"), // ID from calendar provider

  // Intake Data
  intakeResponses: jsonb("intake_responses"), // responses to service questions

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatbot Conversations for Analytics
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  chatbotConfigId: uuid("chatbot_config_id").references(
    () => chatbotConfigs.id,
    { onDelete: "cascade" },
  ),
  messageId: uuid("message_id").references(() => messages.id), // linked to original message

  // Conversation Data
  customerIdentifier: varchar("customer_identifier"), // phone, email, or platform ID
  platform: varchar("platform").notNull(), // whatsapp, instagram, etc.

  // Lead Data
  leadScore: integer("lead_score").default(0),
  qualificationData: jsonb("qualification_data"), // answers to qualification questions
  interestedServices: jsonb("interested_services"), // array of service names

  // Conversation Status
  status: varchar("status").default("active"), // active, qualified, scheduled, converted, closed
  handedOffToHuman: boolean("handed_off_to_human").default(false),
  handoffReason: varchar("handoff_reason"),

  // Outcomes
  appointmentScheduled: boolean("appointment_scheduled").default(false),
  appointmentId: uuid("appointment_id").references(() => appointments.id),

  conversationStartedAt: timestamp("conversation_started_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  closedAt: timestamp("closed_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social Posting Frequency - AI-suggested and custom posting schedules
export const socialPostingFrequency = pgTable("social_posting_frequency", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "cascade",
  }),
  platform: text("platform").notNull(), // facebook, instagram, etc.
  frequencyDays: integer("frequency_days").notNull(), // posts per week
  daysWeek: text("days_week").array().notNull(), // ["mon","tue","thu"]
  source: text("source").default("ai"), // ai | custom
  status: text("status").default("pending"), // pending | accepted | customized
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }),
  insightsData: jsonb("insights_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Generator Jobs - Async job tracking for long-running n8n workflows
export const postGeneratorJobs = pgTable("post_generator_jobs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Generated Posts - Posts suggested by n8n AI that user can accept/reject
export const aiGeneratedPosts = pgTable("ai_generated_posts", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  jobId: uuid("job_id")
    .notNull()
    .references(() => postGeneratorJobs.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // instagram, facebook, etc.
  titulo: text("titulo").notNull(),
  content: text("content"), // copy
  imageUrl: text("image_url"),
  cloudinaryPublicId: text("cloudinary_public_id"),
  dia: text("dia").notNull(), // day of week: sunday, monday, etc.
  hashtags: text("hashtags"),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatbot schemas
export const insertChatbotConfigSchema = createInsertSchema(
  chatbotConfigs,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarIntegrationSchema = createInsertSchema(
  calendarIntegrations,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertAppointmentServiceSchema = createInsertSchema(
  appointmentServices,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatbotConversationSchema = createInsertSchema(
  chatbotConversations,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  conversationStartedAt: true,
  lastActivityAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertChatbotConfig = z.infer<typeof insertChatbotConfigSchema>;
export type ChatbotConfig = typeof chatbotConfigs.$inferSelect;
export type InsertCalendarIntegration = z.infer<
  typeof insertCalendarIntegrationSchema
>;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type InsertAppointmentService = z.infer<
  typeof insertAppointmentServiceSchema
>;
export type AppointmentService = typeof appointmentServices.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertChatbotConversation = z.infer<
  typeof insertChatbotConversationSchema
>;
export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Social Posting Frequency schemas
export const insertSocialPostingFrequencySchema = createInsertSchema(
  socialPostingFrequency,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialPostingFrequency = z.infer<
  typeof insertSocialPostingFrequencySchema
>;
export type SocialPostingFrequency = typeof socialPostingFrequency.$inferSelect;

// Conversation History schemas
export const insertConversationHistorySchema = createInsertSchema(
  conversationHistory,
).omit({
  id: true,
  createdAt: true,
});

export type InsertConversationHistory = z.infer<
  typeof insertConversationHistorySchema
>;
export type ConversationHistory = typeof conversationHistory.$inferSelect;

// POS Customers schemas
export const insertPosCustomerSchema = createInsertSchema(posCustomers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export type InsertPosCustomer = z.infer<typeof insertPosCustomerSchema>;
export type PosCustomer = typeof posCustomers.$inferSelect;
