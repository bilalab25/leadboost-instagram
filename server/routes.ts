import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateMonthlyContentStrategy, generateCampaignContent, analyzeMessageSentiment, generateVisualContent } from "./services/openai";
import { socialMediaService } from "./services/socialMedia";
import {
  insertMessageSchema,
  insertSocialAccountSchema,
  insertContentPlanSchema,
  insertCampaignSchema,
  insertActivityLogSchema,
} from "@shared/schema";

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

  const httpServer = createServer(app);
  return httpServer;
}
