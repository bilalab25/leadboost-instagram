CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"action" varchar NOT NULL,
	"description" text,
	"entity_type" varchar,
	"entity_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"platform" varchar NOT NULL,
	"metric" varchar NOT NULL,
	"value" integer NOT NULL,
	"period" varchar DEFAULT 'daily',
	"recorded_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointment_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_integration_id" uuid,
	"brand_id" uuid,
	"name" varchar NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"price" integer,
	"buffer_time_before" integer DEFAULT 0,
	"buffer_time_after" integer DEFAULT 15,
	"is_active" boolean DEFAULT true,
	"max_advance_booking_days" integer DEFAULT 30,
	"intake_questions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calendar_integration_id" uuid,
	"service_id" uuid,
	"message_id" uuid,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"timezone" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_email" varchar,
	"customer_phone" varchar,
	"customer_notes" text,
	"status" varchar DEFAULT 'scheduled',
	"confirmation_sent_at" timestamp,
	"reminder_sent_at" timestamp,
	"provider_event_id" varchar,
	"intake_responses" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "approval_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"task_id" uuid,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"user_id" varchar,
	"canva_access_token" text,
	"canva_refresh_token" text,
	"canva_user_id" varchar,
	"canva_team_id" varchar,
	"is_canva_connected" boolean DEFAULT false,
	"brand_style" varchar,
	"color_palette" jsonb,
	"typography" jsonb,
	"logo_url" varchar,
	"logo_variations" jsonb,
	"brand_assets" jsonb,
	"templates" jsonb,
	"brand_guidelines" jsonb,
	"canva_brand_kit" jsonb,
	"canva_templates" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"domain" varchar,
	"industry" varchar,
	"logo" varchar,
	"primary_color" varchar DEFAULT '#0066cc',
	"description" text,
	"settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"user_id" varchar,
	"provider" varchar NOT NULL,
	"provider_user_id" varchar,
	"access_token" text,
	"refresh_token" text,
	"calendar_id" varchar,
	"default_service_duration" integer DEFAULT 30,
	"buffer_time" integer DEFAULT 15,
	"advance_booking_days" integer DEFAULT 30,
	"business_hours" jsonb,
	"timezone" varchar DEFAULT 'America/New_York',
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"brand_design_id" uuid,
	"platform" varchar NOT NULL,
	"design_url" varchar,
	"canva_design_id" varchar,
	"design_data" jsonb,
	"is_customized" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"trigger_type" varchar NOT NULL,
	"conditions" jsonb,
	"campaign_template" jsonb,
	"platforms" text[],
	"is_active" boolean DEFAULT true,
	"last_triggered" timestamp,
	"trigger_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"title" varchar NOT NULL,
	"description" text,
	"platforms" text[],
	"content" jsonb,
	"platform_content" jsonb,
	"ad_formats" jsonb,
	"target_audience" jsonb,
	"budget" jsonb,
	"scheduled_for" timestamp,
	"status" varchar DEFAULT 'draft',
	"ai_generated" boolean DEFAULT false,
	"performance" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chatbot_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"user_id" varchar,
	"name" varchar DEFAULT 'LeadBoost Assistant',
	"welcome_message" text DEFAULT 'Hi! I''m here to help you. How can I assist you today?',
	"business_hours" jsonb,
	"timezone" varchar DEFAULT 'America/New_York',
	"language" varchar DEFAULT 'en',
	"qualification_questions" jsonb,
	"lead_score_rules" jsonb,
	"tone" varchar DEFAULT 'professional',
	"industry" varchar,
	"special_instructions" text,
	"can_schedule_appointments" boolean DEFAULT true,
	"can_qualify_leads" boolean DEFAULT true,
	"can_handoff_to_human" boolean DEFAULT true,
	"auto_response_enabled" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chatbot_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatbot_config_id" uuid,
	"message_id" uuid,
	"customer_identifier" varchar,
	"platform" varchar NOT NULL,
	"lead_score" integer DEFAULT 0,
	"qualification_data" jsonb,
	"interested_services" jsonb,
	"status" varchar DEFAULT 'active',
	"handed_off_to_human" boolean DEFAULT false,
	"handoff_reason" varchar,
	"appointment_scheduled" boolean DEFAULT false,
	"appointment_id" uuid,
	"conversation_started_at" timestamp DEFAULT now(),
	"last_activity_at" timestamp DEFAULT now(),
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"title" varchar NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"strategy" text,
	"insights" jsonb,
	"posts" jsonb,
	"status" varchar DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"name" varchar NOT NULL,
	"email" varchar,
	"phone" varchar,
	"company" varchar,
	"address" text,
	"notes" text,
	"status" varchar DEFAULT 'active',
	"total_invoiced" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid,
	"user_id" varchar,
	"invoice_number" varchar NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"description" text,
	"status" varchar DEFAULT 'pending',
	"file_url" varchar,
	"due_date" timestamp,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"social_account_id" uuid,
	"sender_id" varchar NOT NULL,
	"sender_name" varchar NOT NULL,
	"sender_avatar" varchar,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text',
	"is_read" boolean DEFAULT false,
	"priority" varchar DEFAULT 'normal',
	"tags" text[],
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pos_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"provider" varchar NOT NULL,
	"store_name" varchar NOT NULL,
	"api_key" text,
	"access_token" text,
	"refresh_token" text,
	"store_url" varchar,
	"webhook_url" varchar,
	"is_active" boolean DEFAULT true,
	"sync_enabled" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pos_integration_id" uuid,
	"user_id" varchar,
	"external_product_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" integer,
	"currency" varchar DEFAULT 'USD',
	"sku" varchar,
	"category" varchar,
	"image_url" varchar,
	"is_active" boolean DEFAULT true,
	"stock_quantity" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pos_integration_id" uuid,
	"user_id" varchar,
	"transaction_id" varchar NOT NULL,
	"customer_id" varchar,
	"customer_email" varchar,
	"customer_name" varchar,
	"customer_phone" varchar,
	"total_amount" integer NOT NULL,
	"currency" varchar DEFAULT 'USD',
	"status" varchar NOT NULL,
	"payment_method" varchar,
	"items" jsonb,
	"metadata" jsonb,
	"transaction_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"brand_id" uuid,
	"platform" varchar NOT NULL,
	"account_id" varchar NOT NULL,
	"account_name" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"plan_type" varchar NOT NULL,
	"plan_tier" varchar,
	"brand_limit" integer,
	"monthly_price" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"billing_cycle" varchar DEFAULT 'monthly',
	"trial_ends_at" timestamp,
	"last_billed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"approver_level" integer NOT NULL,
	"approver_id" varchar,
	"status" varchar DEFAULT 'pending',
	"comments" text,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"completed_by" varchar,
	"notes" text,
	"proof_file_url" varchar,
	"completed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assigned_by" varchar,
	"assigned_to" varchar,
	"title" varchar NOT NULL,
	"description" text,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'pending',
	"due_date" timestamp,
	"requires_proof" boolean DEFAULT true,
	"proof_file_url" varchar,
	"proof_submitted_at" timestamp,
	"proof_submitted_by" varchar,
	"approval_status" varchar DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"firebase_uid" varchar,
	"role" varchar DEFAULT 'agency_owner',
	"hierarchy_level" integer DEFAULT 1,
	"can_approve" boolean DEFAULT false,
	"reports_to" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_calendar_integration_id_calendar_integrations_id_fk" FOREIGN KEY ("calendar_integration_id") REFERENCES "public"."calendar_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_calendar_integration_id_calendar_integrations_id_fk" FOREIGN KEY ("calendar_integration_id") REFERENCES "public"."calendar_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_appointment_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."appointment_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_notifications" ADD CONSTRAINT "approval_notifications_task_id_team_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."team_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_designs" ADD CONSTRAINT "brand_designs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_designs" ADD CONSTRAINT "brand_designs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_designs" ADD CONSTRAINT "campaign_designs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_designs" ADD CONSTRAINT "campaign_designs_brand_design_id_brand_designs_id_fk" FOREIGN KEY ("brand_design_id") REFERENCES "public"."brand_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_triggers" ADD CONSTRAINT "campaign_triggers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_configs" ADD CONSTRAINT "chatbot_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_chatbot_config_id_chatbot_configs_id_fk" FOREIGN KEY ("chatbot_config_id") REFERENCES "public"."chatbot_configs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_plans" ADD CONSTRAINT "content_plans_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_integrations" ADD CONSTRAINT "pos_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_integrations" ADD CONSTRAINT "pos_integrations_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_pos_integration_id_pos_integrations_id_fk" FOREIGN KEY ("pos_integration_id") REFERENCES "public"."pos_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_pos_integration_id_pos_integrations_id_fk" FOREIGN KEY ("pos_integration_id") REFERENCES "public"."pos_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_transactions" ADD CONSTRAINT "sales_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_approvals" ADD CONSTRAINT "task_approvals_task_id_team_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."team_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_approvals" ADD CONSTRAINT "task_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_team_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."team_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_proof_submitted_by_users_id_fk" FOREIGN KEY ("proof_submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_tasks" ADD CONSTRAINT "team_tasks_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");