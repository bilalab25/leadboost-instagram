import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMonthlyContentStrategy, generateCampaignContent, analyzeMessageSentiment, generateVisualContent } from "./services/openai";
import { socialMediaService } from "./services/socialMedia";
import {
  insertMessageSchema,
  insertBrandSchema,
  insertSocialAccountSchema,
  insertContentPlanSchema,
  insertCampaignSchema,
  insertActivityLogSchema,
  insertCustomerSchema,
  insertInvoiceSchema,
  insertTeamTaskSchema,
  insertTaskCompletionSchema,
  insertPosIntegrationSchema,
  insertSalesTransactionSchema,
  insertProductSchema,
  insertCampaignTriggerSchema,
} from "@shared/schema";
import { posIntegrationService } from "./services/posIntegrations";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Brand management routes
  app.get('/api/brands', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const brands = await storage.getBrandsByUserId(userId);
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post('/api/brands', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const brandData = insertBrandSchema.parse({
        ...req.body,
        userId,
      });
      
      const brand = await storage.createBrand(brandData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        brandId: brand.id,
        action: "create_brand",
        description: `Created brand: ${brand.name}`,
        entityType: "brand",
        entityId: brand.id,
      });

      res.json(brand);
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  app.get('/api/brands/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const brandId = req.params.id;
      const brand = await storage.getBrandById(brandId, userId);
      
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      
      res.json(brand);
    } catch (error) {
      console.error("Error fetching brand:", error);
      res.status(500).json({ message: "Failed to fetch brand" });
    }
  });

  app.put('/api/brands/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const brandId = req.params.id;
      const updates = req.body;
      
      const brand = await storage.updateBrand(brandId, userId, updates);
      
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        brandId: brand.id,
        action: "update_brand",
        description: `Updated brand: ${brand.name}`,
        entityType: "brand",
        entityId: brand.id,
      });

      res.json(brand);
    } catch (error) {
      console.error("Error updating brand:", error);
      res.status(500).json({ message: "Failed to update brand" });
    }
  });

  app.delete('/api/brands/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const brandId = req.params.id;
      
      const success = await storage.deleteBrand(brandId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        brandId: brandId,
        action: "delete_brand",
        description: `Deleted brand`,
        entityType: "brand",
        entityId: brandId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting brand:", error);
      res.status(500).json({ message: "Failed to delete brand" });
    }
  });

  // Demo data endpoint
  app.post('/api/populate-demo-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await populateDemoData(userId);
      res.json({ message: "Demo data populated successfully" });
    } catch (error) {
      console.error("Error populating demo data:", error);
      res.status(500).json({ message: "Failed to populate demo data" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Social accounts routes
  app.get('/api/social-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getSocialAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  app.post('/api/social-accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = insertSocialAccountSchema.parse({
        ...req.body,
        userId,
      });
      
      // Validate platform credentials
      const validation = await socialMediaService.validatePlatformCredentials(
        accountData.platform,
        accountData.accessToken || ""
      );
      
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error || "Invalid credentials" });
      }

      const account = await storage.createSocialAccount(accountData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "connect_social_account",
        description: `Connected ${accountData.platform} account`,
        entityType: "social_account",
        entityId: account.id,
      });

      res.json(account);
    } catch (error) {
      console.error("Error creating social account:", error);
      res.status(500).json({ message: "Failed to create social account" });
    }
  });

  // Messages routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const messages = await storage.getMessagesByUserId(userId, limit);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      
      // Analyze message sentiment and priority
      const analysis = await analyzeMessageSentiment(messageData.content);
      
      const message = await storage.createMessage({
        ...messageData,
        priority: analysis.priority,
      });

      res.json({ message, analysis });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/messages/:id/read', isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.patch('/api/messages/:id/priority', isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      const { priority } = req.body;
      await storage.updateMessagePriority(messageId, priority);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating message priority:", error);
      res.status(500).json({ message: "Failed to update message priority" });
    }
  });

  app.patch('/api/messages/:id/assign', isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      const { assignedTo } = req.body;
      await storage.assignMessage(messageId, assignedTo);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning message:", error);
      res.status(500).json({ message: "Failed to assign message" });
    }
  });

  // Content plans routes
  app.get('/api/content-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const plans = await storage.getContentPlansByUserId(userId);
      res.json(plans);
    } catch (error) {
      console.error("Error fetching content plans:", error);
      res.status(500).json({ message: "Failed to fetch content plans" });
    }
  });

  app.post('/api/content-plans/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { month, year, businessData } = req.body;

      const strategy = await generateMonthlyContentStrategy(businessData, month, year);
      
      const plan = await storage.createContentPlan({
        userId,
        title: `Content Plan - ${month}/${year}`,
        month,
        year,
        strategy: JSON.stringify(strategy.insights),
        insights: strategy,
        posts: strategy.posts,
        status: "draft",
      });

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "generate_content_plan",
        description: `Generated AI content plan for ${month}/${year}`,
        entityType: "content_plan",
        entityId: plan.id,
      });

      res.json(plan);
    } catch (error) {
      console.error("Error generating content plan:", error);
      res.status(500).json({ message: "Failed to generate content plan" });
    }
  });

  // Campaigns routes
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getCampaignsByUserId(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({
        ...req.body,
        userId,
      });
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "create_campaign",
        description: `Created campaign: ${campaign.title}`,
        entityType: "campaign",
        entityId: campaign.id,
      });

      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.post('/api/campaigns/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prompt, platforms, businessContext } = req.body;

      const generatedContent = await generateCampaignContent(prompt, platforms, businessContext);
      
      const campaign = await storage.createCampaign({
        userId,
        title: `AI Generated Campaign - ${new Date().toLocaleDateString()}`,
        description: prompt,
        platforms,
        content: generatedContent,
        status: "draft",
        aiGenerated: true,
      });

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "generate_ai_campaign",
        description: `Generated AI campaign: ${campaign.title}`,
        entityType: "campaign",
        entityId: campaign.id,
      });

      res.json(campaign);
    } catch (error) {
      console.error("Error generating campaign:", error);
      res.status(500).json({ message: "Failed to generate campaign" });
    }
  });

  app.post('/api/campaigns/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = req.params.id;
      
      // Get campaign details
      const campaigns = await storage.getCampaignsByUserId(userId);
      const campaign = campaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }

      // Get user's social accounts
      const socialAccounts = await storage.getSocialAccountsByUserId(userId);
      const accessTokens = socialAccounts.reduce((acc, account) => {
        if (account.accessToken && campaign.platforms?.includes(account.platform)) {
          acc[account.platform] = account.accessToken;
        }
        return acc;
      }, {} as { [platform: string]: string });

      // Post to social media platforms
      const results = await socialMediaService.postToMultiplePlatforms(
        campaign.platforms || [],
        {
          text: (campaign.content as any)?.content || campaign.description || "",
          scheduledTime: campaign.scheduledFor || undefined,
        },
        accessTokens
      );

      // Update campaign status
      await storage.updateCampaignStatus(campaignId, "published");

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "publish_campaign",
        description: `Published campaign: ${campaign.title}`,
        entityType: "campaign",
        entityId: campaign.id,
      });

      res.json({ results });
    } catch (error) {
      console.error("Error publishing campaign:", error);
      res.status(500).json({ message: "Failed to publish campaign" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const platform = req.query.platform as string;
      const analytics = await storage.getAnalyticsByUserId(userId, platform);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Activity logs
  app.get('/api/activity', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const activities = await storage.getActivityLogsByUserId(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // AI visual generation
  app.post('/api/ai/generate-visual', isAuthenticated, async (req, res) => {
    try {
      const { description } = req.body;
      const result = await generateVisualContent(description);
      res.json(result);
    } catch (error) {
      console.error("Error generating visual:", error);
      res.status(500).json({ message: "Failed to generate visual content" });
    }
  });

  // Object Storage routes for file uploads
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Customer management routes
  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customers = await storage.getCustomersByUserId(userId);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        userId,
      });
      const customer = await storage.createCustomer(customerData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "customer_created",
        description: `Created customer: ${customer.name}`,
        entityType: "customer",
        entityId: customer.id,
      });

      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = req.params.id;
      const updates = req.body;
      
      const customer = await storage.updateCustomer(customerId, userId, updates);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "customer_updated",
        description: `Updated customer: ${customer.name}`,
        entityType: "customer",
        entityId: customer.id,
      });

      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = req.params.id;
      
      const success = await storage.deleteCustomer(customerId, userId);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "customer_deleted",
        description: `Deleted customer`,
        entityType: "customer",
        entityId: customerId,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Invoice management routes
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const customerId = req.query.customerId;
      const invoices = await storage.getInvoicesByUserId(userId, customerId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        userId,
      });
      
      const invoice = await storage.createInvoice(invoiceData);
      
      // Update customer total invoiced amount
      if (invoice.customerId) {
        await storage.updateCustomerTotalInvoiced(invoice.customerId, invoice.amount);
      }
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "invoice_created",
        description: `Created invoice ${invoice.invoiceNumber}`,
        entityType: "invoice",
        entityId: invoice.id,
      });

      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = req.params.id;
      const updates = req.body;
      
      // Handle file upload URL processing
      if (updates.fileUrl) {
        const objectStorageService = new ObjectStorageService();
        updates.fileUrl = await objectStorageService.trySetObjectEntityAclPolicy(
          updates.fileUrl,
          {
            owner: userId,
            visibility: "private",
          }
        );
      }
      
      const invoice = await storage.updateInvoice(invoiceId, userId, updates);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Log activity
      await storage.createActivityLog({
        userId,
        action: "invoice_updated",
        description: `Updated invoice ${invoice.invoiceNumber}`,
        entityType: "invoice",
        entityId: invoice.id,
      });

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Team task management routes
  app.get('/api/team-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const assignedOnly = req.query.assigned === 'true';
      const tasks = assignedOnly 
        ? await storage.getTasksAssignedToUser(userId)
        : await storage.getTasksByUserId(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching team tasks:", error);
      res.status(500).json({ message: "Failed to fetch team tasks" });
    }
  });

  app.post('/api/team-tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTeamTaskSchema.parse({
        ...req.body,
        assignedBy: userId,
      });
      
      const task = await storage.createTeamTask(taskData);
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "task_assigned",
        description: `Assigned task: ${task.title} to user`,
        entityType: "team_task",
        entityId: task.id,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating team task:", error);
      res.status(500).json({ message: "Failed to create team task" });
    }
  });

  app.put('/api/team-tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskId = req.params.id;
      const { notes, proofFileUrl } = req.body;
      
      // Handle proof file upload URL processing
      let processedProofUrl = proofFileUrl;
      if (proofFileUrl) {
        const objectStorageService = new ObjectStorageService();
        processedProofUrl = await objectStorageService.trySetObjectEntityAclPolicy(
          proofFileUrl,
          {
            owner: userId,
            visibility: "private",
          }
        );
      }
      
      const completionData = insertTaskCompletionSchema.parse({
        taskId,
        completedBy: userId,
        notes,
        proofFileUrl: processedProofUrl,
      });
      
      const completion = await storage.createTaskCompletion(completionData);
      await storage.updateTaskStatus(taskId, "completed");
      
      // Log activity
      await storage.createActivityLog({
        userId,
        action: "task_completed",
        description: `Completed task with proof`,
        entityType: "team_task",
        entityId: taskId,
      });

      res.json(completion);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // POS Integration routes
  // Get user's POS integrations
  app.get('/api/pos-integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getPosIntegrationsByUserId(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching POS integrations:", error);
      res.status(500).json({ message: "Failed to fetch POS integrations" });
    }
  });

  // Create new POS integration
  app.post('/api/pos-integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationData = insertPosIntegrationSchema.parse({ ...req.body, userId });
      
      // Validate credentials with POS provider
      const validationResult = await posIntegrationService.validateCredentials(
        integrationData.provider,
        {
          accessToken: integrationData.accessToken,
          storeUrl: integrationData.storeUrl,
          apiKey: integrationData.apiKey,
        }
      );

      if (!validationResult.valid) {
        return res.status(400).json({ 
          message: "Invalid credentials", 
          error: validationResult.error 
        });
      }

      // Store integration with encrypted credentials
      const integration = await storage.createPosIntegration({
        ...integrationData,
        settings: validationResult.storeInfo,
      });

      // Sync products after successful integration
      try {
        const products = await posIntegrationService.syncProducts(integration);
        await Promise.all(products.map(product => storage.createProduct(product)));
      } catch (syncError) {
        console.error("Product sync failed but integration created:", syncError);
      }

      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating POS integration:", error);
      res.status(500).json({ message: "Failed to create POS integration" });
    }
  });

  // Update POS integration
  app.put('/api/pos-integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const integration = await storage.updatePosIntegration(id, updates);
      
      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      res.json(integration);
    } catch (error) {
      console.error("Error updating POS integration:", error);
      res.status(500).json({ message: "Failed to update POS integration" });
    }
  });

  // Delete POS integration
  app.delete('/api/pos-integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const deleted = await storage.deletePosIntegration(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Integration not found" });
      }
      
      res.json({ message: "Integration deleted successfully" });
    } catch (error) {
      console.error("Error deleting POS integration:", error);
      res.status(500).json({ message: "Failed to delete POS integration" });
    }
  });

  // Get sales transactions
  app.get('/api/sales-transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getSalesTransactionsByUserId(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching sales transactions:", error);
      res.status(500).json({ message: "Failed to fetch sales transactions" });
    }
  });

  // Get products from POS systems
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Sync products from specific POS integration
  app.post('/api/pos-integrations/:id/sync-products', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const integration = await storage.getPosIntegrationsByUserId(req.user.claims.sub);
      const targetIntegration = integration.find(i => i.id === id);
      
      if (!targetIntegration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      const products = await posIntegrationService.syncProducts(targetIntegration);
      await Promise.all(products.map(product => storage.createProduct(product)));
      
      res.json({ message: "Products synced successfully", count: products.length });
    } catch (error) {
      console.error("Error syncing products:", error);
      res.status(500).json({ message: "Failed to sync products" });
    }
  });

  // Get campaign triggers
  app.get('/api/campaign-triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const triggers = await storage.getCampaignTriggersByUserId(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching campaign triggers:", error);
      res.status(500).json({ message: "Failed to fetch campaign triggers" });
    }
  });

  // Create campaign trigger
  app.post('/api/campaign-triggers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const triggerData = insertCampaignTriggerSchema.parse({ ...req.body, userId });
      const trigger = await storage.createCampaignTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating campaign trigger:", error);
      res.status(500).json({ message: "Failed to create campaign trigger" });
    }
  });

  // Update campaign trigger
  app.put('/api/campaign-triggers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const trigger = await storage.updateCampaignTrigger(id, updates);
      
      if (!trigger) {
        return res.status(404).json({ message: "Campaign trigger not found" });
      }
      
      res.json(trigger);
    } catch (error) {
      console.error("Error updating campaign trigger:", error);
      res.status(500).json({ message: "Failed to update campaign trigger" });
    }
  });

  // Webhook endpoints for POS systems
  app.post('/api/webhooks/square', async (req, res) => {
    try {
      const signature = req.headers['square-signature'] as string;
      const result = await posIntegrationService.processWebhook('square', req.body, signature);
      
      if (result.processed && result.transactionId) {
        // Process the transaction and check for campaign triggers
        // Implementation would go here
      }
      
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing Square webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhooks/shopify', async (req, res) => {
    try {
      const signature = req.headers['x-shopify-hmac-sha256'] as string;
      const result = await posIntegrationService.processWebhook('shopify', req.body, signature);
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing Shopify webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhooks/stripe', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const result = await posIntegrationService.processWebhook('stripe', req.body, signature);
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post('/api/webhooks/woocommerce', async (req, res) => {
    try {
      const result = await posIntegrationService.processWebhook('woocommerce', req.body);
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing WooCommerce webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Demo data population function
async function populateDemoData(userId: string) {
  // Create social accounts
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
      const account = await storage.createSocialAccount({
        userId,
        ...accountData,
      });
      socialAccounts.push(account);
    } catch (error) {
      console.log(`Social account ${accountData.platform} might already exist`);
    }
  }

  // Create messages
  const messagesData = [
    { platform: "instagram", senderName: "Sarah Johnson", content: "Love your latest product! When will you restock the blue variant?", type: "comment", isRead: false, sentiment: "positive" },
    { platform: "facebook", senderName: "Mike Chen", content: "I'm having trouble with my order #12345. Can someone help?", type: "message", isRead: false, sentiment: "negative" },
    { platform: "linkedin", senderName: "Emma Wilson", content: "Great insights in your latest post about social media trends!", type: "comment", isRead: true, sentiment: "positive" },
    { platform: "tiktok", senderName: "Alex Rivera", content: "This is amazing! Tutorial please? 🙏", type: "comment", isRead: true, sentiment: "positive" },
    { platform: "x", senderName: "David Kim", content: "@MyBusiness Your customer service is terrible. Still waiting for a response after 3 days!", type: "mention", isRead: false, sentiment: "negative" },
    { platform: "instagram", senderName: "Lisa Park", content: "Can you share the recipe for this? It looks delicious! 😍", type: "comment", isRead: false, sentiment: "positive" },
    { platform: "facebook", senderName: "John Smith", content: "Do you ship internationally? I'm interested in your services.", type: "message", isRead: true, sentiment: "neutral" },
    { platform: "linkedin", senderName: "Rachel Brown", content: "Would love to collaborate on a project. Are you open to partnerships?", type: "message", isRead: false, sentiment: "positive" },
  ];

  for (const messageData of messagesData) {
    try {
      await storage.createMessage({
        userId,
        socialAccountId: socialAccounts.find(acc => acc.platform === messageData.platform)?.id || socialAccounts[0].id,
        ...messageData,
        priority: messageData.sentiment === "negative" ? "high" : messageData.sentiment === "positive" ? "normal" : "low",
      });
    } catch (error) {
      console.log(`Message might already exist`);
    }
  }

  // Create campaigns
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
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
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
      await storage.createCampaign({
        userId,
        ...campaignData,
      });
    } catch (error) {
      console.log(`Campaign might already exist`);
    }
  }

  // Create content plans
  const contentPlansData = [
    {
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
    }
  ];

  for (const planData of contentPlansData) {
    try {
      await storage.createContentPlan({
        userId,
        ...planData,
      });
    } catch (error) {
      console.log(`Content plan might already exist`);
    }
  }

  // Create customers
  const customersData = [
    { name: "Tech Solutions Inc", email: "contact@techsolutions.com", phone: "+1 (555) 123-4567", status: "active", totalInvoiced: 15750.00 },
    { name: "Creative Agency LLC", email: "hello@creativeagency.com", phone: "+1 (555) 234-5678", status: "active", totalInvoiced: 8900.50 },
    { name: "Startup Ventures", email: "team@startupventures.com", phone: "+1 (555) 345-6789", status: "active", totalInvoiced: 12300.00 },
    { name: "Local Restaurant Group", email: "manager@localeatery.com", phone: "+1 (555) 456-7890", status: "inactive", totalInvoiced: 3200.00 },
  ];

  for (const customerData of customersData) {
    try {
      await storage.createCustomer({
        userId,
        ...customerData,
      });
    } catch (error) {
      console.log(`Customer might already exist`);
    }
  }

  // Create analytics entries
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
      await storage.createAnalyticsEntry({
        userId,
        ...analyticsEntry,
      });
    } catch (error) {
      console.log(`Analytics entry might already exist`);
    }
  }

  // Create activity logs
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
      await storage.createActivityLog({
        userId,
        ...activityData,
      });
    } catch (error) {
      console.log(`Activity log might already exist`);
    }
  }

  // Create sample social accounts for different platforms
  const demoSocialAccountsData = [
    { platform: "instagram", accountName: "@mybusiness", isActive: true, accessToken: "demo_token_ig", refreshToken: "demo_refresh_ig" },
    { platform: "whatsapp", accountName: "Business WhatsApp", isActive: true, accessToken: "demo_token_wa", refreshToken: "demo_refresh_wa" },
    { platform: "email", accountName: "info@mybusiness.com", isActive: true, accessToken: "demo_token_email", refreshToken: "demo_refresh_email" },
    { platform: "tiktok", accountName: "@mybiz_official", isActive: true, accessToken: "demo_token_tt", refreshToken: "demo_refresh_tt" },
  ];

  const createdSocialAccounts: { [platform: string]: string } = {};
  for (const accountData of demoSocialAccountsData) {
    try {
      const account = await storage.createSocialAccount({
        userId,
        ...accountData,
      });
      createdSocialAccounts[accountData.platform] = account.id;
    } catch (error) {
      console.log(`Social account ${accountData.platform} might already exist`);
    }
  }

  // Create sample conversations/messages for unified inbox
  const demoConversationsData = [
    // Instagram Messages
    {
      socialAccountId: createdSocialAccounts.instagram,
      senderId: "sarah_lifestyle_23",
      senderName: "Sarah Johnson",
      senderAvatar: "https://images.unsplash.com/photo-1494790108755-2616b73d5ba3?w=50&h=50&fit=crop&crop=face",
      content: "Hi! I absolutely love your latest product collection! 😍 Is the blue sweater available in medium size?",
      messageType: "text",
      priority: "normal",
      tags: ["product_inquiry", "sizing"],
      isRead: false,
    },
    {
      socialAccountId: createdSocialAccounts.instagram,
      senderId: "mike_runner_pro",
      senderName: "Mike Rodriguez",
      senderAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
      content: "The running shoes I ordered last week are amazing! 🏃‍♂️ Can I get them in another color?",
      messageType: "text",
      priority: "normal",
      tags: ["testimonial", "repeat_customer"],
      isRead: true,
    },
    
    // WhatsApp Messages
    {
      socialAccountId: createdSocialAccounts.whatsapp,
      senderId: "1234567890",
      senderName: "Emma Chen",
      senderAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=50&h=50&fit=crop&crop=face",
      content: "Hello! I saw your ad on Facebook. Do you have any winter jackets available? I'm interested in purchasing for my family.",
      messageType: "text",
      priority: "high",
      tags: ["sales_inquiry", "family_purchase"],
      isRead: false,
    },
    {
      socialAccountId: createdSocialAccounts.whatsapp,
      senderId: "9876543210",
      senderName: "David Park",
      senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
      content: "Hi, I received my order yesterday but the item doesn't fit well. What's your return policy?",
      messageType: "text",
      priority: "urgent",
      tags: ["support", "returns"],
      isRead: false,
    },
    
    // Email Messages
    {
      socialAccountId: createdSocialAccounts.email,
      senderId: "jessica.smith@email.com",
      senderName: "Jessica Smith",
      content: "Subject: Bulk Order Inquiry\n\nHello, I represent a corporate client interested in placing a bulk order for employee gifts. Could you provide pricing for 50+ units? Thanks!",
      messageType: "text",
      priority: "high",
      tags: ["bulk_order", "corporate"],
      isRead: false,
    },
    {
      socialAccountId: createdSocialAccounts.email,
      senderId: "alex.taylor@company.com",
      senderName: "Alex Taylor",
      content: "Subject: Collaboration Opportunity\n\nHi there! I'm a lifestyle blogger with 50K followers. Would you be interested in a product collaboration? I'd love to feature your brand!",
      messageType: "text",
      priority: "normal",
      tags: ["influencer", "collaboration"],
      isRead: true,
    },
    
    // TikTok Messages
    {
      socialAccountId: createdSocialAccounts.tiktok,
      senderId: "trendy_teen_23",
      senderName: "Maya Williams",
      senderAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=50&h=50&fit=crop&crop=face",
      content: "OMG your TikTok is so aesthetic! 💫 Where can I buy that pink hoodie from your last video?? It's perfect!",
      messageType: "text",
      priority: "normal",
      tags: ["product_inquiry", "young_demographic"],
      isRead: false,
    },
    {
      socialAccountId: createdSocialAccounts.tiktok,
      senderId: "fashion_lover_99",
      senderName: "Isabella Garcia",
      senderAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
      content: "Your latest TikTok inspired my whole outfit today! 👗 Do you ship internationally? I'm in Canada 🇨🇦",
      messageType: "text",
      priority: "normal",
      tags: ["inspiration", "international_shipping"],
      isRead: true,
    }
  ];

  for (const messageData of demoConversationsData) {
    try {
      if (messageData.socialAccountId) {
        await storage.createMessage(messageData);
      }
    } catch (error) {
      console.log(`Message might already exist or social account not found`);
    }
  }

  console.log("Demo data populated successfully for user:", userId);
}
