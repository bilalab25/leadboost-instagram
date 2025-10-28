import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import OpenAI from "openai";
import chatRoutes from "./chatRoutes";
import {
  generateMonthlyContentStrategy,
  generateCampaignContent,
  analyzeMessageSentiment,
  generateVisualContent,
} from "./services/openai";
import { socialMediaService } from "./services/socialMedia";
import { imageProcessor } from "./services/imageProcessor";
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
  insertSubscriptionPlanSchema,
  type BrandDesign,
} from "@shared/schema";
import { posIntegrationService } from "./services/posIntegrations";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import cloudinary from "./cloudinary";
import { db } from "./db";
import { brandDesigns } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const upload = multer({ dest: "uploads/" });

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Auth middleware
  await setupAuth(app);

  // Add site-wide password protection middleware

  // Site password endpoint (must come before other routes)
  app.post("/api/site-auth", (req, res) => {
    const { password } = req.body;

    if (password === process.env.WEBSITE_PASSWORD) {
      (req.session as any).siteAccess = true;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // The user is already in the session from our auth middleware
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const allowedFields = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
      ];
      const updates: any = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.updateUser(id, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("Error updating profile:", error);

      // 👇 Esto es clave: siempre responde JSON
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Chat routes
  app.use("/api", chatRoutes);

  // Subscription plan routes
  app.get("/api/subscription-plans", async (req: any, res) => {
    try {
      // Return available subscription plan tiers for agency plans
      const agencyTiers = [
        {
          id: "agency-5",
          planType: "agency",
          planTier: "agency-5",
          brandLimit: 5,
          monthlyPrice: 19900, // $199 in cents
          displayPrice: "$199",
          description: "Perfect for small agencies managing 5 brands",
        },
        {
          id: "agency-10",
          planType: "agency",
          planTier: "agency-10",
          brandLimit: 10,
          monthlyPrice: 34900, // $349 in cents
          displayPrice: "$349",
          description: "Ideal for growing agencies with 10 brands",
        },
        {
          id: "agency-20",
          planType: "agency",
          planTier: "agency-20",
          brandLimit: 20,
          monthlyPrice: 59900, // $599 in cents
          displayPrice: "$599",
          description: "Great for established agencies managing 20 brands",
        },
        {
          id: "agency-50",
          planType: "agency",
          planTier: "agency-50+",
          brandLimit: 50,
          monthlyPrice: 99900, // $999 in cents
          displayPrice: "$999",
          description: "Perfect for large agencies with 50+ brands",
        },
      ];

      res.json(agencyTiers);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Brand management routes
  app.get("/api/brands", async (req: any, res) => {
    try {
      // Return Said's Renuve brands
      const mockBrands = [
        {
          id: "brand-1",
          name: "Renuve Aesthetics Bar",
          description:
            "Premier beauty clinic offering advanced aesthetic treatments",
          industry: "Beauty & Wellness",
          targetAudience:
            "Beauty-conscious clients seeking aesthetic enhancement",
          website: "https://renuveaesthetics.com",
          logoUrl: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "brand-2",
          name: "Renuve Plastic Surgery",
          description:
            "Expert plastic surgery practice with cutting-edge procedures",
          industry: "Medical & Plastic Surgery",
          targetAudience: "Clients seeking surgical aesthetic solutions",
          website: "https://renuveplasticsurgery.com",
          logoUrl: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "brand-3",
          name: "Renuve Skin Care",
          description: "Premium skincare products and treatments",
          industry: "Skincare & Cosmetics",
          targetAudience: "Individuals focused on premium skincare routines",
          website: "https://renuveskincare.com",
          logoUrl: null,
          createdAt: new Date().toISOString(),
        },
      ];
      res.json(mockBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.post("/api/brands", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.get("/api/brands/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.put("/api/brands/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.delete("/api/brands/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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
  app.post(
    "/api/populate-demo-data",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        await populateDemoData(userId);
        res.json({ message: "Demo data populated successfully" });
      } catch (error) {
        console.error("Error populating demo data:", error);
        res.status(500).json({ message: "Failed to populate demo data" });
      }
    },
  );

  // Dashboard stats (Demo mode)
  app.get("/api/dashboard/stats", async (req: any, res) => {
    try {
      // Return Said's Renuve dashboard stats
      const mockStats = {
        totalMessages: 2134,
        unreadMessages: 42,
        totalCampaigns: 28,
        activeCampaigns: 15,
        totalSocialAccounts: 6,
        connectedPlatforms: [
          "instagram",
          "facebook",
          "tiktok",
          "whatsapp",
          "email",
          "linkedin",
        ],
        monthlyEngagement: 38200,
        responseTime: "45 minutes",
        engagementRate: 8.7,
        aiPosts: 203,
        revenue: 100000,
      };
      res.json(mockStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Social accounts routes
  app.get("/api/social-accounts", async (req: any, res) => {
    try {
      // Return Said's Renuve social accounts
      const mockAccounts = [
        {
          id: "social-1",
          platform: "instagram",
          accountName: "@renuvederm",
          accountId: "12345",
          isConnected: true,
          followers: 28500,
          lastSync: new Date().toISOString(),
        },
        {
          id: "social-2",
          platform: "facebook",
          accountName: "Renuve Aesthetics Bar",
          accountId: "67890",
          isConnected: true,
          followers: 12400,
          lastSync: new Date().toISOString(),
        },
        {
          id: "social-3",
          platform: "tiktok",
          accountName: "@renuveskin",
          accountId: "54321",
          isConnected: true,
          followers: 45200,
          lastSync: new Date().toISOString(),
        },
        {
          id: "social-4",
          platform: "whatsapp",
          accountName: "Renuve Aesthetics WhatsApp",
          accountId: "business-123",
          isConnected: true,
          followers: 0,
          lastSync: new Date().toISOString(),
        },
        {
          id: "social-5",
          platform: "instagram",
          accountName: "@renuveplasticsurgery",
          accountId: "98765",
          isConnected: true,
          followers: 18700,
          lastSync: new Date().toISOString(),
        },
        {
          id: "social-6",
          platform: "instagram",
          accountName: "@renuveskin",
          accountId: "11223",
          isConnected: true,
          followers: 22100,
          lastSync: new Date().toISOString(),
        },
      ];
      res.json(mockAccounts);
    } catch (error) {
      console.error("Error fetching social accounts:", error);
      res.status(500).json({ message: "Failed to fetch social accounts" });
    }
  });

  app.post("/api/social-accounts", async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const accountData = insertSocialAccountSchema.parse({
        ...req.body,
        userId,
      });

      // Validate platform credentials
      const validation = await socialMediaService.validatePlatformCredentials(
        accountData.platform,
        accountData.accessToken || "",
      );

      if (!validation.valid) {
        return res
          .status(400)
          .json({ message: validation.error || "Invalid credentials" });
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

  // Messages routes (Demo mode without auth)
  app.get("/api/messages", async (req: any, res) => {
    try {
      // Return mock conversations for demo in Spanish
      const mockMessages = [
        {
          id: "msg-18",
          senderId: "food_blogger_alex",
          senderName: "Alex Rivera",
          senderAvatar: null,
          content:
            "Your kitchen gadget changed my cooking game! 👨‍🍳 Posted a recipe TikTok featuring it. Mind if I tag you in more content?",
          priority: "normal",
          isRead: true,
          createdAt: new Date(Date.now() - 1000 * 60 * 450).toISOString(),
          socialAccount: {
            platform: "tiktok",
            accountName: "@democompany_official",
          },
        },
      ];

      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      res.json(mockMessages.slice(0, limit));
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
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

  app.patch("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const messageId = req.params.id;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.patch("/api/messages/:id/priority", isAuthenticated, async (req, res) => {
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

  app.patch("/api/messages/:id/assign", isAuthenticated, async (req, res) => {
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

  // Conversation routes
  app.post(
    "/api/conversations/from-message/:messageId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const messageId = req.params.messageId;

        // For mock messages, create a mock conversation response
        // In production, this would fetch the actual message and create/find a conversation
        const mockConversation = {
          id: messageId, // Use message ID as conversation ID for mock
          participantName:
            messageId === "msg-1"
              ? "María González"
              : messageId === "msg-2"
                ? "Carlos Rivera"
                : messageId === "msg-3"
                  ? "Ana López"
                  : messageId === "msg-4"
                    ? "Diego Morales"
                    : "Customer",
          participantAvatar: null,
          platform:
            messageId === "msg-1"
              ? "instagram"
              : messageId === "msg-2"
                ? "facebook"
                : messageId === "msg-3"
                  ? "tiktok"
                  : messageId === "msg-4"
                    ? "whatsapp"
                    : "email",
          socialAccountId: "social-1",
          lastMessageAt: new Date(),
          lastMessagePreview: "Preview...",
        };

        res.json(mockConversation);
      } catch (error) {
        console.error("Error creating conversation from message:", error);
        res.status(500).json({ message: "Failed to create conversation" });
      }
    },
  );

  app.get("/api/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const conversationId = req.params.id;

      // For mock message IDs, return mock conversation
      if (conversationId.startsWith("msg-")) {
        const mockConversation = {
          id: conversationId,
          participantName:
            conversationId === "msg-1"
              ? "María González"
              : conversationId === "msg-2"
                ? "Carlos Rivera"
                : conversationId === "msg-3"
                  ? "Ana López"
                  : conversationId === "msg-4"
                    ? "Diego Morales"
                    : "Customer",
          participantAvatar: null,
          platform:
            conversationId === "msg-1"
              ? "instagram"
              : conversationId === "msg-2"
                ? "facebook"
                : conversationId === "msg-3"
                  ? "tiktok"
                  : conversationId === "msg-4"
                    ? "whatsapp"
                    : "email",
          socialAccountId: "social-1",
          lastMessageAt: new Date(),
          lastMessagePreview: "Preview...",
        };

        return res.json(mockConversation);
      }

      // For real conversation IDs, query the database
      const conversation = await storage.getConversationById(conversationId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.get(
    "/api/conversations/:id/messages",
    isAuthenticated,
    async (req, res) => {
      try {
        const conversationId = req.params.id;

        // For mock message IDs, return mock conversation messages
        if (conversationId.startsWith("msg-")) {
          const mockMessages = [
            {
              id: `${conversationId}-thread-1`,
              conversationId,
              senderId:
                conversationId === "msg-1"
                  ? "maria_gonzalez"
                  : conversationId === "msg-2"
                    ? "carlos_rivera"
                    : conversationId === "msg-3"
                      ? "ana_lopez"
                      : conversationId === "msg-4"
                        ? "diego_morales"
                        : "customer",
              senderName:
                conversationId === "msg-1"
                  ? "María González"
                  : conversationId === "msg-2"
                    ? "Carlos Rivera"
                    : conversationId === "msg-3"
                      ? "Ana López"
                      : conversationId === "msg-4"
                        ? "Diego Morales"
                        : "Customer",
              senderAvatar: null,
              content:
                conversationId === "msg-1"
                  ? "¡Hola! ¡Me encanta los resultados de mi último tratamiento facial! ¿Cuándo pueden agendar mi próxima cita? 💆‍♀️"
                  : conversationId === "msg-2"
                    ? "¿Pueden ayudarme con mi cita de cirugía plástica? Necesito confirmar los detalles pre-operatorios para mi procedimiento de la próxima semana. Cita #12345"
                    : conversationId === "msg-3"
                      ? "¡Servicio al cliente increíble! Gracias por resolver mi problema tan rápido 🙌"
                      : conversationId === "msg-4"
                        ? "Hola, vi su anuncio en Facebook sobre el paquete de rejuvenecimiento facial. ¿Podrían enviarme más detalles e información de precios?"
                        : "Hello, I have a question",
              direction: "inbound" as const,
              status: "read" as const,
              messageType: "text" as const,
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
          ];

          return res.json(mockMessages);
        }

        // For real conversation IDs, query the database
        const messages = await storage.getConversationMessages(conversationId);
        res.json(messages);
      } catch (error) {
        console.error("Error fetching conversation messages:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch conversation messages" });
      }
    },
  );

  app.post(
    "/api/conversations/:id/messages",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const conversationId = req.params.id;
        const { content } = req.body;

        // For mock message IDs, return a mock outbound message
        if (conversationId.startsWith("msg-")) {
          const mockMessage = {
            id: `${conversationId}-reply-${Date.now()}`,
            conversationId,
            senderId: req.user?.id || "agent-1",
            senderName: req.user?.firstName || "Agent",
            senderAvatar: req.user?.profilePicture || null,
            content,
            direction: "outbound" as const,
            status: "sent" as const,
            messageType: "text" as const,
            createdAt: new Date().toISOString(),
          };

          return res.json(mockMessage);
        }

        // For real conversation IDs, create in database
        const conversation = await storage.getConversationById(conversationId);

        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        // Create the outbound message
        const message = await storage.createConversationMessage({
          conversationId,
          socialAccountId: conversation.socialAccountId,
          senderId: req.user.id,
          senderName: req.user.firstName || "Agent",
          senderAvatar: req.user.profilePicture,
          content,
          direction: "outbound",
          status: "sent",
          messageType: "text",
        });

        res.json(message);
      } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Failed to send message" });
      }
    },
  );

  // Content plans routes
  app.get("/api/content-plans", async (req: any, res) => {
    try {
      // Return mock AI-generated content plans
      const mockContentPlans = [
        {
          id: "plan-1",
          title: "March 2024 Content Strategy",
          month: 3,
          year: 2024,
          status: "active",
          strategy: JSON.stringify({
            theme: "Spring Product Launch",
            objectives: [
              "Increase brand awareness",
              "Drive product sales",
              "Build community engagement",
            ],
            keyMessages: [
              "Fresh start with our products",
              "Spring cleaning made easy",
              "Community-driven innovation",
            ],
          }),
          insights: {
            theme: "Spring Product Launch",
            objectives: [
              "Increase brand awareness by 40%",
              "Drive product sales for new spring collection",
              "Build community engagement through UGC campaigns",
            ],
            keyMessages: [
              "Fresh start with our products",
              "Spring cleaning made easy",
              "Community-driven innovation",
            ],
            platforms: {
              instagram: {
                focus: "Visual storytelling",
                postFrequency: "Daily",
              },
              tiktok: {
                focus: "Trending challenges",
                postFrequency: "2x daily",
              },
              facebook: {
                focus: "Community building",
                postFrequency: "5x weekly",
              },
              email: {
                focus: "Product education",
                frequency: "Weekly newsletter",
              },
            },
          },
          posts: [
            {
              date: "2024-03-01",
              platform: "instagram",
              type: "image",
              caption:
                "Spring is here! 🌸 Time to refresh your routine with our new collection. What's your favorite spring ritual?",
              hashtags: ["#SpringVibes", "#NewCollection", "#FreshStart"],
              scheduledTime: "09:00",
            },
            {
              date: "2024-03-02",
              platform: "tiktok",
              type: "video",
              caption:
                "POV: You're getting your life together this spring ✨ #SpringCleaning #Organized",
              hashtags: ["#SpringCleaning", "#Organized", "#LifeHacks"],
              scheduledTime: "15:30",
            },
          ],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
        },
        {
          id: "plan-2",
          title: "April 2024 Content Strategy",
          month: 4,
          year: 2024,
          status: "draft",
          strategy: JSON.stringify({
            theme: "Earth Month Sustainability",
            objectives: [
              "Promote eco-friendly practices",
              "Showcase sustainable products",
              "Partner with environmental influencers",
            ],
            keyMessages: [
              "Sustainability made simple",
              "Small changes, big impact",
              "Eco-conscious living",
            ],
          }),
          insights: {
            theme: "Earth Month Sustainability",
            objectives: [
              "Promote eco-friendly practices",
              "Showcase sustainable product line",
              "Partner with 5 environmental influencers",
            ],
            keyMessages: [
              "Sustainability made simple",
              "Small changes, big impact",
              "Eco-conscious living",
            ],
            platforms: {
              instagram: {
                focus: "Educational content",
                postFrequency: "Daily",
              },
              tiktok: { focus: "Eco-tips & hacks", postFrequency: "Daily" },
              linkedin: {
                focus: "Industry insights",
                postFrequency: "3x weekly",
              },
              email: { focus: "Sustainability guide", frequency: "Bi-weekly" },
            },
          },
          posts: [
            {
              date: "2024-04-01",
              platform: "instagram",
              type: "carousel",
              caption:
                "5 simple swaps for a more sustainable lifestyle 🌱 Save this post for later!",
              hashtags: ["#EarthMonth", "#Sustainability", "#EcoFriendly"],
              scheduledTime: "10:00",
            },
          ],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
      ];

      res.json(mockContentPlans);
    } catch (error) {
      console.error("Error fetching content plans:", error);
      res.status(500).json({ message: "Failed to fetch content plans" });
    }
  });

  app.post(
    "/api/content-plans/generate",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { month, year, businessData } = req.body;

        const strategy = await generateMonthlyContentStrategy(
          businessData,
          month,
          year,
        );

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
    },
  );

  // Campaigns routes
  app.get("/api/campaigns", async (req: any, res) => {
    try {
      // Return mock campaigns
      const mockCampaigns = [
        {
          id: "campaign-1",
          title: "Spring Product Launch",
          description:
            "Comprehensive campaign to launch our new spring collection across all social platforms",
          status: "active",
          startDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 7,
          ).toISOString(),
          endDate: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 23,
          ).toISOString(),
          budget: 5000,
          spent: 2450,
          platforms: ["instagram", "tiktok", "facebook", "email"],
          targetAudience: {
            demographics: "Women 25-40",
            interests: ["lifestyle", "home decor", "sustainable living"],
            location: "North America",
          },
          content: {
            posts: 24,
            videos: 8,
            emails: 4,
            stories: 16,
          },
          performance: {
            impressions: 156000,
            engagements: 12400,
            clicks: 3200,
            conversions: 89,
            revenue: 8940,
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 10,
          ).toISOString(),
        },
        {
          id: "campaign-2",
          title: "TikTok Viral Challenge",
          description:
            "Branded hashtag challenge to increase brand awareness and user-generated content",
          status: "scheduled",
          startDate: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
          endDate: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 17,
          ).toISOString(),
          budget: 3000,
          spent: 0,
          platforms: ["tiktok", "instagram"],
          targetAudience: {
            demographics: "Gen Z 16-24",
            interests: ["dance", "trends", "lifestyle"],
            location: "Global",
          },
          content: {
            posts: 0,
            videos: 12,
            emails: 0,
            stories: 8,
          },
          performance: {
            impressions: 0,
            engagements: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0,
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
        },
        {
          id: "campaign-3",
          title: "Email Nurture Sequence",
          description:
            "7-email sequence for new subscribers to introduce brand and products",
          status: "completed",
          startDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
          endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          budget: 800,
          spent: 750,
          platforms: ["email"],
          targetAudience: {
            demographics: "New subscribers",
            interests: ["product education", "brand story"],
            location: "All regions",
          },
          content: {
            posts: 0,
            videos: 0,
            emails: 7,
            stories: 0,
          },
          performance: {
            impressions: 8500,
            engagements: 3400,
            clicks: 1200,
            conversions: 156,
            revenue: 4680,
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 35,
          ).toISOString(),
        },
      ];

      res.json(mockCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.post(
    "/api/campaigns/generate",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { prompt, platforms, businessContext } = req.body;

        const generatedContent = await generateCampaignContent(
          prompt,
          platforms,
          businessContext,
        );

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
    },
  );

  app.post(
    "/api/campaigns/:id/publish",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const campaignId = req.params.id;

        // Get campaign details
        const campaigns = await storage.getCampaignsByUserId(userId);
        const campaign = campaigns.find((c) => c.id === campaignId);

        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        // Get user's social accounts
        const socialAccounts = await storage.getSocialAccountsByUserId(userId);
        const accessTokens = socialAccounts.reduce(
          (acc, account) => {
            if (
              account.accessToken &&
              campaign.platforms?.includes(account.platform)
            ) {
              acc[account.platform] = account.accessToken;
            }
            return acc;
          },
          {} as { [platform: string]: string },
        );

        // Post to social media platforms
        const results = await socialMediaService.postToMultiplePlatforms(
          campaign.platforms || [],
          {
            text:
              (campaign.content as any)?.content || campaign.description || "",
            scheduledTime: campaign.scheduledFor || undefined,
          },
          accessTokens,
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
    },
  );

  // AI Chatbot routes
  app.post("/api/chatbot/message", async (req: any, res) => {
    try {
      const { message, brandId, customerIdentifier, platform } = req.body;

      if (!message || !brandId || !customerIdentifier || !platform) {
        return res.status(400).json({
          message:
            "Missing required fields: message, brandId, customerIdentifier, platform",
        });
      }

      // Import chatbot service
      const { chatbotService } = await import("./chatbotService");

      // Generate AI response
      const response = await chatbotService.generateResponse(
        message,
        brandId,
        customerIdentifier,
        platform,
      );

      res.json(response);
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({
        message:
          "I'm having technical difficulties. Let me connect you with a human representative.",
        action: "handoff_to_human",
      });
    }
  });

  app.post("/api/chatbot/schedule", async (req: any, res) => {
    try {
      const { schedulingData, brandId, customerIdentifier } = req.body;

      if (!schedulingData || !brandId || !customerIdentifier) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { chatbotService } = await import("./chatbotService");

      const result = await chatbotService.processSchedulingRequest(
        schedulingData,
        brandId,
        customerIdentifier,
      );

      res.json(result);
    } catch (error) {
      console.error("Scheduling error:", error);
      res.status(500).json({
        success: false,
        message:
          "I had trouble scheduling your appointment. Please contact us directly.",
      });
    }
  });

  app.get("/api/chatbot/available-times", async (req: any, res) => {
    try {
      const { brandId, serviceId, date } = req.query;

      if (!brandId || !serviceId || !date) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const { chatbotService } = await import("./chatbotService");

      const availableTimes = await chatbotService.getAvailableTimeSlots(
        brandId as string,
        serviceId as string,
        date as string,
      );

      res.json({ availableTimes });
    } catch (error) {
      console.error("Error fetching available times:", error);
      res.status(500).json({ message: "Failed to fetch available times" });
    }
  });

  // Chatbot configuration routes
  app.get("/api/chatbot/config/:brandId", async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const configs = await storage.getChatbotConfigs(brandId);
      res.json(configs);
    } catch (error) {
      console.error("Error fetching chatbot config:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch chatbot configuration" });
    }
  });

  app.post("/api/chatbot/config", async (req: any, res) => {
    try {
      const configData = req.body;
      const config = await storage.createChatbotConfig(configData);
      res.json(config);
    } catch (error) {
      console.error("Error creating chatbot config:", error);
      res
        .status(500)
        .json({ message: "Failed to create chatbot configuration" });
    }
  });

  // Help Chat route
  app.post("/api/help-chat", async (req: any, res) => {
    try {
      const { message, language } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Create system prompt for help assistant
      const systemPrompt = `You are a helpful assistant for LeadBoost, a comprehensive marketing campaign management platform. 
      
      LeadBoost features include:
      - CampAIgner: AI campaign generator that creates content for 21+ platforms in one click
      - 30 Day Planner: AI content creation and strategy for the entire month automatically  
      - Brand Studio: Edit and customize AI-proposed campaigns with professional design tools
      - Chat Deck: Multi-platform unified inbox with automated customer profiles, purchase history and digital file attachments
      - Analytics Dashboard: Advanced metrics and real-time performance reports
      - Teams: Team collaboration and management
      - Global Support: 24/7 multilingual support
      
      Answer questions about platform features, pricing, usage, and provide helpful guidance.
      Keep responses concise and friendly. If you can't answer something specific, direct users to FAQ or support.
      
      Respond in English.`;

      // Generate response using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      });

      const botMessage =
        completion.choices[0]?.message?.content ||
        "Sorry, I couldn't process your message. Please check our FAQ or contact support.";

      res.json({ message: botMessage });
    } catch (error) {
      console.error("Help chat error:", error);
      res.status(500).json({
        message:
          "Sorry, there's a technical issue. You can check our FAQ or contact support.",
      });
    }
  });

  app.get("/api/integrations/facebook/connect", isAuthenticated, (req, res) => {
    const redirectUri = `${process.env.APP_URL}/api/integrations/facebook/callback`;
    const clientId = process.env.FB_APP_ID;

    const scopes = [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_metadata",
      "pages_manage_posts",
      "pages_messaging",
    ].join(",");
    console.log(scopes, "scopes");

    const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${scopes}&state=${req.user.id}`;

    res.redirect(authUrl);
  });

  app.get("/api/integrations/facebook/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");

      const redirect_uri = `${process.env.APP_URL}/api/integrations/facebook/callback`;

      // Step 1: Exchange code for a user access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${process.env.FB_APP_ID}&redirect_uri=${encodeURIComponent(
          redirect_uri,
        )}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`,
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("❌ Facebook token error:", tokenData.error);
        return res.status(500).json(tokenData.error);
      }

      // Step 2: Get list of Pages the user manages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${tokenData.access_token}`,
      );
      const pagesData = await pagesResponse.json();

      if (!pagesData.data || pagesData.data.length === 0) {
        console.error("❌ No Facebook Pages found for this user");
        return res.status(400).send("No Facebook Pages found");
      }

      // ✅ Take only the first Page (limit to one)
      const page = pagesData.data[0];

      // Step 3: Save Page info instead of User info
      const expiresAt = tokenData.expires_in
        ? dayjs().add(tokenData.expires_in, "seconds").toDate()
        : null;

      await storage.createOrUpdateIntegration({
        userId: state,
        provider: "facebook",
        category: "social_media",
        storeName: "Facebook",
        storeUrl: `https://facebook.com/${page.id}`,
        pageId: page.id,
        accessToken: page.access_token, // ✅ Page Token (not user)
        accountName: page.name, // Page name
        accountId: page.id, // same as page_id
        settings: {
          fbUserId: page.id,
          fbUserName: page.name,
        },
        expiresAt,
        isActive: true,
        syncEnabled: true,
        lastSyncAt: null,
        metadata: {
          category: page.category,
          permissions: page.tasks || [],
        },
      });

      console.log(`✅ Facebook Page connected: ${page.name} (${page.id})`);

      // 🟪 Auto-detect Instagram & Threads accounts
      try {
        const igResponse = await fetch(
          `https://graph.facebook.com/v24.0/${page.id}?fields=connected_instagram_account&access_token=${page.access_token}`
        );
        const igData = await igResponse.json();
        const igAccount = igData.connected_instagram_account;

        if (igAccount && igAccount.id) {
          // Create Instagram integration
          await storage.createOrUpdateIntegration({
            userId: state as string,
            provider: "instagram",
            category: "social_media",
            storeName: "Instagram",
            storeUrl: `https://instagram.com/${page.name}`,
            accountId: igAccount.id,
            accessToken: page.access_token,
            accountName: page.name,
            pageId: page.id,
            metadata: { fbPageId: page.id },
            isActive: true,
            syncEnabled: true,
          });
          console.log(`✅ Instagram auto-connected: ${page.name}`);

          // Create Threads integration (uses same Instagram account)
          await storage.createOrUpdateIntegration({
            userId: state as string,
            provider: "threads",
            category: "social_media",
            storeName: "Threads",
            storeUrl: `https://threads.net/@${page.name}`,
            accountId: igAccount.id,
            accessToken: page.access_token,
            accountName: page.name,
            pageId: page.id,
            metadata: { fbPageId: page.id, igAccountId: igAccount.id },
            isActive: true,
            syncEnabled: true,
          });
          console.log(`✅ Threads auto-connected: ${page.name}`);
        }
      } catch (igErr) {
        console.warn("⚠️ Could not auto-detect Instagram/Threads:", igErr);
      }

      res.redirect("/settings");
    } catch (err) {
      console.error("❌ Callback error:", err);
      res.status(500).send("Error in Facebook callback");
    }
  });

  // 📍 /api/integrations/instagram/connect
  app.get("/api/integrations/instagram/connect", async (req, res) => {
    try {
      // ✅ 1. Obtener el ID del usuario autenticado
      const state = encodeURIComponent(req.user?.id || "anonymous");

      // ✅ 2. Usar variables de entorno, no hardcodear los IDs
      const clientId = process.env.IG_APP_ID;
      const redirectUri = `${process.env.APP_URL}/api/integrations/instagram/callback`;

      // ✅ 3. Construir la URL correctamente (con state incluido)
      const authUrl = `https://www.instagram.com/oauth/authorize
        ?force_reauth=true
        &client_id=${clientId}
        &redirect_uri=${encodeURIComponent(redirectUri)}
        &response_type=code
        &scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights
        &state=${state}`.replace(/\s+/g, ""); // quitar saltos de línea

      console.log("🌐 Redirecting to Instagram Auth:", authUrl);
      res.redirect(authUrl);
    } catch (error) {
      console.error("❌ Error generating Instagram auth URL:", error);
      res.status(500).send("Error starting Instagram OAuth");
    }
  });

  // 📍 /api/integrations/instagram/callback
  app.get("/api/integrations/instagram/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const redirectUri = `${process.env.APP_URL}/api/integrations/instagram/callback`;

      if (!code) return res.status(400).send("Missing authorization code");

      console.log("📥 Instagram callback hit:", { code, state, redirectUri });

      // ✅ Exchange code for access token
      const tokenResponse = await fetch(
        "https://api.instagram.com/oauth/access_token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.IG_APP_ID!,
            client_secret: process.env.IG_APP_SECRET!, // ✅ corregido
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code: code as string,
          }),
        },
      );

      const rawText = await tokenResponse.text();
      console.log("📦 Raw Instagram Token Response:", rawText);

      const tokenData = JSON.parse(rawText);

      if (!tokenData.access_token) {
        console.error("❌ Invalid token data:", tokenData);
        return res.status(400).json(tokenData);
      }

      // ✅ Get user data
      const userResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`,
      );
      const userData = await userResponse.json();
      console.log("👤 Instagram User Data:", userData);

      // ✅ Save integration
      await storage.createOrUpdateIntegration({
        userId: state as string,
        provider: "instagram",
        category: "social_media",
        storeName: userData.username,
        accessToken: tokenData.access_token,
        isActive: true,
        syncEnabled: true,
        metadata: {
          igUserId: userData.id,
          account_type: userData.account_type,
        },
        accountName: userData.username,
      });

      res.redirect("/settings");
    } catch (error) {
      console.error("❌ Instagram Callback Error:", error);
      res.status(500).send("Error in Instagram callback");
    }
  });

  // 🟩 WhatsApp Cloud API Connect
  app.post("/api/integrations/whatsapp/connect", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const accessToken = process.env.WHATSAPP_TOKEN;
      const wabaId = process.env.WABA_ID;

      if (!accessToken || !wabaId) {
        return res.status(400).json({ 
          error: "WhatsApp credentials not configured. Please set WHATSAPP_TOKEN and WABA_ID environment variables." 
        });
      }

      const response = await fetch(
        `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers?access_token=${accessToken}`
      );
      const data = await response.json();

      const phone = data.data?.[0];
      if (!phone) {
        return res.status(400).json({ error: "No WhatsApp phone numbers found" });
      }

      await storage.createOrUpdateIntegration({
        userId,
        provider: "whatsapp",
        category: "social_media",
        storeName: "WhatsApp Business",
        storeUrl: `https://wa.me/${phone.display_phone_number.replace(/\D/g, '')}`,
        accountId: phone.id,
        accessToken,
        accountName: phone.display_phone_number,
        metadata: { wabaId },
        isActive: true,
        syncEnabled: true,
      });

      console.log(`✅ WhatsApp connected: ${phone.display_phone_number}`);
      res.json({ success: true, phone });
    } catch (err) {
      console.error("❌ WhatsApp connect error:", err);
      res.status(500).json({ error: "Failed to connect WhatsApp" });
    }
  });

  app.get("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;

      // ✅ Usa el método del storage (más limpio y consistente)
      const userIntegrations = await storage.getIntegrations(userId);
      res.status(200).json(userIntegrations);
    } catch (error) {
      console.error("❌ Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // 1️⃣ Listar conversaciones (últimos chats)
  app.get("/api/facebook/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const integrations = await storage.getIntegrations(userId);
      const fbIntegration = integrations.find((i) =>
        i.provider.includes("facebook"),
      );
      console.log(fbIntegration, "fbIntegration");
      if (!fbIntegration)
        return res.status(404).json({ error: "No Facebook account connected" });

      const { accountId: pageId, accessToken } = fbIntegration;
      const url = `https://graph.facebook.com/v24.0/${pageId}/conversations?fields=senders,link,updated_time,snippet&access_token=${accessToken}`;
      const r = await fetch(url);
      const data = await r.json();

      res.json({ conversations: data.data });
    } catch (err) {
      console.error("Facebook conversations error:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // 3️⃣ Enviar mensaje (Messenger Send API)
  app.post("/api/facebook/messages/send", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { recipientId, message } = req.body;

      const integrations = await storage.getIntegrations(userId);
      const fbIntegration = integrations.find((i) =>
        i.platform.includes("facebook"),
      );
      if (!fbIntegration)
        return res.status(404).json({ error: "No Facebook account connected" });

      const { accountId: pageId, accessToken } = fbIntegration;

      const url = `https://graph.facebook.com/v24.0/${pageId}/messages`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_type: "RESPONSE",
          recipient: { id: recipientId },
          message: { text: message },
          access_token: accessToken,
        }),
      });
      const data = await r.json();

      res.json(data);
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // 2️⃣ Obtener mensajes de una conversación de Facebook
  app.get(
    "/api/facebook/conversations/:conversationId/messages",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user.id;
        const { conversationId } = req.params;

        const integrations = await storage.getIntegrations(userId);
        const fbIntegration = integrations.find((i) =>
          i.provider.includes("facebook"),
        );
        if (!fbIntegration)
          return res
            .status(404)
            .json({ error: "No Facebook account connected" });

        const { accessToken } = fbIntegration;

        // 🔹 Obtener page_id
        const pageInfoRes = await fetch(
          `https://graph.facebook.com/v24.0/me?access_token=${accessToken}`,
        );
        const pageInfo = await pageInfoRes.json();
        const pageId = pageInfo.id;

        // 🔹 Obtener mensajes
        const url = `https://graph.facebook.com/v24.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${accessToken}`;
        const r = await fetch(url);
        const data = await r.json();

        const messages = (data.data || []).map((m) => ({
          id: m.id,
          text: m.message,
          from: m.from?.name,
          fromId: m.from?.id,
          created_time: m.created_time,
        }));

        // 🔹 Encontrar el último mensaje inbound (del usuario)
        const lastInbound = messages
          .filter((m) => m.fromId !== pageId)
          .sort(
            (a, b) =>
              new Date(b.created_time).getTime() -
              new Date(a.created_time).getTime(),
          )[0];

        res.json({
          pageId,
          messages,
          lastUserMessageTime: lastInbound?.created_time || null,
        });
      } catch (err) {
        console.error("Facebook messages error:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
      }
    },
  );

  // backend/routes/facebook-pages.ts
  app.get("/api/facebook/pages", async (req, res) => {
    try {
      const userToken = await db.getFacebookAuthToken(req.user.id);

      const response = await fetch(
        `https://graph.facebook.com/v22.0/me/accounts?access_token=${userToken}`,
      );
      const data = await response.json();

      // Esto devuelve un array con las páginas y su page_access_token
      // Ejemplo: data.data[0].access_token
      await db.saveFacebookPages(req.user.id, data.data);

      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error fetching Facebook pages" });
    }
  });

  app.post("/api/facebook/publish", async (req, res) => {
    const { pageId, message } = req.body;
    const pageToken = await db.getFacebookPageToken(pageId);

    const postResponse = await fetch(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, access_token: pageToken }),
      },
    );

    const result = await postResponse.json();
    res.json(result);
  });

  // 🔄 Unified Provider Endpoints
  // Get conversations for any provider (facebook, instagram, threads, whatsapp)
  app.get("/api/:provider/conversations", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = req.user.id;
      const integrations = await storage.getIntegrations(userId);
      const integration = integrations.find((i) => i.provider === provider);

      if (!integration) {
        return res.status(404).json({ error: `No ${provider} integration found` });
      }

      let url = "";

      if (provider === "facebook") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=senders,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "instagram") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=id,participants,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "threads") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=id,participants,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "whatsapp") {
        // WhatsApp doesn't have a conversations list - you need webhook for incoming messages
        // Here we return empty or fetch from your local database
        const messages = await storage.getMessages(userId);
        const whatsappMessages = messages.filter((m: any) => m.socialAccount?.provider === "whatsapp");
        return res.json({ conversations: whatsappMessages });
      } else {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const r = await fetch(url);
      const data = await r.json();

      if (data.error) {
        console.error(`${provider} API error:`, data.error);
        return res.status(400).json({ error: data.error.message });
      }

      res.json({ conversations: data.data || [] });
    } catch (err) {
      console.error("Conversation fetch error:", err);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a specific conversation from any provider
  app.get("/api/:provider/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const { provider, conversationId } = req.params;
      const userId = req.user.id;

      const integrations = await storage.getIntegrations(userId);
      const integration = integrations.find((i) => i.provider === provider);

      if (!integration) {
        return res.status(404).json({ error: `No ${provider} integration found` });
      }

      let url = "";
      let pageId = integration.accountId;

      if (provider === "facebook" || provider === "instagram" || provider === "threads") {
        // Get page ID for detecting inbound vs outbound
        const pageInfoRes = await fetch(
          `https://graph.facebook.com/v24.0/me?access_token=${integration.accessToken}`
        );
        const pageInfo = await pageInfoRes.json();
        pageId = pageInfo.id || integration.accountId;

        url = `https://graph.facebook.com/v24.0/${conversationId}/messages?fields=from,to,message,created_time&access_token=${integration.accessToken}`;
      } else if (provider === "whatsapp") {
        // For WhatsApp, fetch from local database or use webhook data
        const messages = await storage.getMessages(userId);
        const conversationMessages = messages.filter((m: any) => m.conversationId === conversationId);
        return res.json({ 
          pageId: integration.accountId,
          messages: conversationMessages,
          lastUserMessageTime: null 
        });
      } else {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const r = await fetch(url);
      const data = await r.json();

      if (data.error) {
        console.error(`${provider} API error:`, data.error);
        return res.status(400).json({ error: data.error.message });
      }

      const messages = (data.data || []).map((m: any) => ({
        id: m.id,
        text: m.message,
        from: m.from?.name,
        fromId: m.from?.id,
        created_time: m.created_time,
      }));

      // Find last inbound message (from user, not from page)
      const lastInbound = messages
        .filter((m: any) => m.fromId !== pageId)
        .sort(
          (a: any, b: any) =>
            new Date(b.created_time).getTime() -
            new Date(a.created_time).getTime()
        )[0];

      res.json({
        pageId,
        messages,
        lastUserMessageTime: lastInbound?.created_time || null,
      });
    } catch (err) {
      console.error("Messages fetch error:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message to any provider
  app.post("/api/:provider/messages/send", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = req.user.id;
      const { recipientId, message } = req.body;

      if (!recipientId || !message) {
        return res.status(400).json({ error: "recipientId and message are required" });
      }

      const integrations = await storage.getIntegrations(userId);
      const integration = integrations.find((i) => i.provider === provider);
      
      if (!integration) {
        return res.status(404).json({ error: `No ${provider} integration found` });
      }

      let url, payload;

      if (provider === "facebook" || provider === "instagram") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/messages`;
        payload = {
          messaging_type: "RESPONSE",
          recipient: { id: recipientId },
          message: { text: message },
        };
      } else if (provider === "threads") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/messages`;
        payload = {
          recipient: { id: recipientId },
          message: { text: message },
        };
      } else if (provider === "whatsapp") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/messages`;
        payload = {
          messaging_product: "whatsapp",
          to: recipientId,
          type: "text",
          text: { body: message },
        };
      } else {
        return res.status(400).json({ error: "Invalid provider" });
      }

      const r = await fetch(`${url}?access_token=${integration.accessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();

      if (data.error) {
        console.error(`${provider} send error:`, data.error);
        return res.status(400).json({ error: data.error.message });
      }

      res.json(data);
    } catch (err) {
      console.error("Send message error:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Calendar integration routes
  app.get("/api/calendar/integrations/:brandId", async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const integrations = await storage.getCalendarIntegrations(brandId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching calendar integrations:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch calendar integrations" });
    }
  });

  app.post("/api/calendar/integrations", async (req: any, res) => {
    try {
      const integrationData = req.body;
      const integration =
        await storage.createCalendarIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating calendar integration:", error);
      res
        .status(500)
        .json({ message: "Failed to create calendar integration" });
    }
  });

  app.get("/api/appointments/:brandId", async (req: any, res) => {
    try {
      const { brandId } = req.params;
      const appointments = await storage.getAppointments(brandId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", isAuthenticated, async (req: any, res) => {
    try {
      // Return comprehensive mock analytics
      const mockAnalytics = {
        overview: {
          totalFollowers: 47832,
          totalEngagement: 156940,
          avgEngagementRate: 4.2,
          totalReach: 245600,
          totalImpressions: 892000,
          growthRate: 12.5,
        },
        platformMetrics: {
          instagram: {
            followers: 18500,
            posts: 45,
            engagement: 4.1,
            reach: 89000,
            impressions: 234000,
            topPost: "Spring collection reveal - 2,340 likes",
          },
          tiktok: {
            followers: 22100,
            posts: 38,
            engagement: 6.8,
            reach: 145000,
            impressions: 456000,
            topPost: "Product demo dance - 45.2K views",
          },
          facebook: {
            followers: 5200,
            posts: 28,
            engagement: 2.9,
            reach: 8500,
            impressions: 67000,
            topPost: "Behind the scenes - 89 reactions",
          },
          email: {
            subscribers: 2032,
            campaigns: 12,
            openRate: 24.5,
            clickRate: 3.2,
            unsubscribeRate: 0.8,
            topEmail: "Weekly newsletter #47",
          },
        },
        timeSeriesData: [
          {
            date: "2024-03-01",
            instagram: 1240,
            tiktok: 2100,
            facebook: 340,
            email: 450,
          },
          {
            date: "2024-03-02",
            instagram: 1180,
            tiktok: 2450,
            facebook: 290,
            email: 380,
          },
          {
            date: "2024-03-03",
            instagram: 1350,
            tiktok: 2200,
            facebook: 320,
            email: 420,
          },
          {
            date: "2024-03-04",
            instagram: 1420,
            tiktok: 2800,
            facebook: 380,
            email: 510,
          },
          {
            date: "2024-03-05",
            instagram: 1380,
            tiktok: 2300,
            facebook: 350,
            email: 460,
          },
          {
            date: "2024-03-06",
            instagram: 1500,
            tiktok: 2600,
            facebook: 400,
            email: 520,
          },
          {
            date: "2024-03-07",
            instagram: 1620,
            tiktok: 2900,
            facebook: 420,
            email: 580,
          },
        ],
        topContent: [
          {
            id: "post-1",
            platform: "tiktok",
            type: "video",
            content: "Morning routine with our products",
            engagement: 12450,
            views: 89600,
            date: "2024-03-05",
          },
          {
            id: "post-2",
            platform: "instagram",
            type: "image",
            content: "Spring collection flat lay",
            engagement: 3420,
            views: 28900,
            date: "2024-03-04",
          },
          {
            id: "post-3",
            platform: "tiktok",
            type: "video",
            content: "Behind the scenes packaging",
            engagement: 8900,
            views: 67200,
            date: "2024-03-03",
          },
        ],
        demographics: {
          ageGroups: {
            "18-24": 32,
            "25-34": 41,
            "35-44": 18,
            "45-54": 7,
            "55+": 2,
          },
          gender: {
            female: 68,
            male: 29,
            other: 3,
          },
          topLocations: [
            { country: "United States", percentage: 45 },
            { country: "Canada", percentage: 18 },
            { country: "United Kingdom", percentage: 12 },
            { country: "Australia", percentage: 8 },
            { country: "Germany", percentage: 6 },
          ],
        },
      };

      res.json(mockAnalytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Activity logs
  app.get("/api/activity", async (req: any, res) => {
    try {
      // Return mock activity logs for demo in Spanish
      const mockActivities = [
        {
          id: "activity-1",
          userId: "demo-user",
          brandId: null,
          action: "create_campaign",
          description:
            "Creada nueva campaña de Instagram: Lanzamiento Producto Primavera",
          entityType: "campaign",
          entityId: "camp-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: "activity-2",
          userId: "demo-user",
          brandId: null,
          action: "connect_social_account",
          description: "Conectada cuenta de TikTok: @miempresa_oficial",
          entityType: "social_account",
          entityId: "social-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
        {
          id: "activity-3",
          userId: "demo-user",
          brandId: null,
          action: "generate_content_plan",
          description: "Generado plan de contenido IA para Marzo 2024",
          entityType: "content_plan",
          entityId: "plan-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
        {
          id: "activity-4",
          userId: "demo-user",
          brandId: null,
          action: "response_message",
          description: "Respondido mensaje urgente de WhatsApp",
          entityType: "message",
          entityId: "msg-4",
          createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        },
        {
          id: "activity-5",
          userId: "demo-user",
          brandId: null,
          action: "schedule_post",
          description: "Programado post de Instagram para mañana 10:00 AM",
          entityType: "post",
          entityId: "post-1",
          createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        },
      ];

      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      res.json(mockActivities.slice(0, limit));
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  // AI visual generation
  app.post("/api/ai/generate-visual", isAuthenticated, async (req, res) => {
    try {
      const { description } = req.body;
      const result = await generateVisualContent(description);
      res.json(result);
    } catch (error) {
      console.error("Error generating visual:", error);
      res.status(500).json({ message: "Failed to generate visual content" });
    }
  });

  // Midjourney video generation
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, style, duration, aspectRatio } = req.body;

      // Validate required fields
      if (!prompt) {
        return res.status(400).json({ message: "Video prompt is required" });
      }

      // Simulate Midjourney video generation process
      console.log(
        `Generating video with Midjourney: ${prompt}, style: ${style}, duration: ${duration}s`,
      );

      // In a real implementation, this would call Midjourney's API
      // For now, we'll simulate the process and return a mock video URL

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock video URL (in production this would be the actual Midjourney video URL)
      const videoUrl = `https://example.com/midjourney-videos/video-${Date.now()}.mp4`;

      res.json({
        videoUrl,
        prompt,
        style,
        duration,
        aspectRatio,
        status: "completed",
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res
        .status(500)
        .json({ message: "Failed to generate video with Midjourney" });
    }
  });

  // Image processing endpoint for pixel-perfect platform assets
  app.post("/api/process-campaign-images", async (req, res) => {
    try {
      const {
        sourceImageUrl,
        campaignText,
        brandStyle = "professional",
        platforms,
      } = req.body;

      if (!sourceImageUrl || !campaignText) {
        return res
          .status(400)
          .json({ error: "sourceImageUrl and campaignText are required" });
      }

      // For demo purposes, return optimized image URLs with proper aspect ratios
      const processedImages: Record<string, string> = {};
      const platformsToProcess = platforms || [
        "Instagram Post",
        "Instagram Story",
        "LinkedIn Post",
        "Facebook Post",
        "Twitter/X Post",
        "TikTok Cover",
        "Email Banner",
      ];

      // Generate properly sized image URLs using Unsplash with exact dimensions
      for (const platform of platformsToProcess) {
        const platformDimensions = {
          "Instagram Post": { width: 1080, height: 1080 },
          "Instagram Story": { width: 1080, height: 1920 },
          "LinkedIn Post": { width: 1200, height: 627 },
          "Facebook Post": { width: 1200, height: 630 },
          "Twitter/X Post": { width: 1200, height: 675 },
          "TikTok Cover": { width: 1080, height: 1920 },
          "Email Banner": { width: 1200, height: 400 },
        };
        const dimensions =
          platformDimensions[platform as keyof typeof platformDimensions];
        if (dimensions) {
          // Use the source image with exact dimensions and smart cropping
          const optimizedUrl = `${sourceImageUrl}&w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart`;
          processedImages[platform] = optimizedUrl;
        }
      }

      res.json({ processedImages });
    } catch (error) {
      console.error("Error processing campaign images:", error);
      res.status(500).json({ error: "Failed to process images" });
    }
  });

  // Campaign visual generation with platform-specific sizing
  app.post("/api/ai/generate-campaign-visuals", async (req, res) => {
    try {
      const { businessDescription, businessType, campaignTheme, posts } =
        req.body;

      const visuals = [];

      // Generate visuals for each post with appropriate descriptions
      for (const post of posts) {
        const visualPrompt = `Create a professional social media visual for a ${businessType} business.
        Business: ${businessDescription}
        Campaign theme: ${campaignTheme}
        Post content: ${post.caption}
        
        Make it modern, eye-catching, and suitable for ${businessType} industry.
        Include the business's branding elements like colors and style.
        Make it professional yet engaging for social media.`;

        try {
          const result = await generateVisualContent(visualPrompt);
          visuals.push({
            postIndex: posts.indexOf(post),
            url: result.url,
            caption: post.caption,
            platforms: {
              instagram_post: { width: 1080, height: 1080, url: result.url },
              instagram_story: { width: 1080, height: 1920, url: result.url },
              facebook: { width: 1200, height: 628, url: result.url },
              twitter: { width: 1600, height: 900, url: result.url },
              linkedin: { width: 1200, height: 628, url: result.url },
              tiktok: { width: 1080, height: 1920, url: result.url },
              email_banner: { width: 600, height: 200, url: result.url },
            },
          });
        } catch (error) {
          console.error("Error generating visual for post:", error);
          // Continue with next post even if one fails
        }
      }

      res.json({
        visuals,
        businessType,
        campaignTheme,
        totalGenerated: visuals.length,
      });
    } catch (error) {
      console.error("Error generating campaign visuals:", error);
      res.status(500).json({ message: "Failed to generate campaign visuals" });
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
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
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
  app.get("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      // Return mock customer data
      const mockCustomers = [
        {
          id: "customer-1",
          name: "Sarah Martinez",
          email: "sarah.martinez@email.com",
          phone: "+1-555-0123",
          avatar: null,
          totalSpent: 1247.5,
          lastOrderDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
          orderCount: 8,
          lifetimeValue: 2340.75,
          acquisitionChannel: "instagram",
          status: "active",
          tags: ["VIP", "influencer"],
          notes:
            "Social media influencer with 15K followers. Great brand advocate.",
          addresses: [
            {
              type: "shipping",
              street: "123 Main St",
              city: "Los Angeles",
              state: "CA",
              zip: "90210",
              country: "USA",
            },
          ],
          preferredPlatform: "instagram",
          engagementLevel: "high",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 120,
          ).toISOString(),
        },
        {
          id: "customer-2",
          name: "Mike Johnson",
          email: "mike.johnson@gmail.com",
          phone: "+1-555-0456",
          avatar: null,
          totalSpent: 892.25,
          lastOrderDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 7,
          ).toISOString(),
          orderCount: 5,
          lifetimeValue: 892.25,
          acquisitionChannel: "facebook",
          status: "active",
          tags: ["repeat-customer"],
          notes:
            "Prefers email communication. Always asks detailed product questions.",
          addresses: [
            {
              type: "shipping",
              street: "456 Oak Ave",
              city: "Chicago",
              state: "IL",
              zip: "60614",
              country: "USA",
            },
          ],
          preferredPlatform: "email",
          engagementLevel: "medium",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 85,
          ).toISOString(),
        },
        {
          id: "customer-3",
          name: "Emma Wilson",
          email: "emma.wilson@yahoo.com",
          phone: "+1-555-0789",
          avatar: null,
          totalSpent: 2156.8,
          lastOrderDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 1,
          ).toISOString(),
          orderCount: 12,
          lifetimeValue: 3240.9,
          acquisitionChannel: "tiktok",
          status: "VIP",
          tags: ["VIP", "high-value", "brand-advocate"],
          notes:
            "Top customer! Creates UGC content regularly. Always leaves positive reviews.",
          addresses: [
            {
              type: "shipping",
              street: "789 Pine St",
              city: "New York",
              state: "NY",
              zip: "10001",
              country: "USA",
            },
          ],
          preferredPlatform: "tiktok",
          engagementLevel: "high",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 200,
          ).toISOString(),
        },
        {
          id: "customer-4",
          name: "David Chen",
          email: "david.chen@outlook.com",
          phone: "+1-555-0321",
          avatar: null,
          totalSpent: 543.75,
          lastOrderDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 14,
          ).toISOString(),
          orderCount: 3,
          lifetimeValue: 543.75,
          acquisitionChannel: "whatsapp",
          status: "active",
          tags: ["business-inquiry"],
          notes:
            "Interested in bulk purchasing for his small business. Potential wholesale customer.",
          addresses: [
            {
              type: "shipping",
              street: "321 Cedar Rd",
              city: "Seattle",
              state: "WA",
              zip: "98101",
              country: "USA",
            },
          ],
          preferredPlatform: "whatsapp",
          engagementLevel: "medium",
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 45,
          ).toISOString(),
        },
      ];

      res.json(mockCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.put("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const customerId = req.params.id;
      const updates = req.body;

      const customer = await storage.updateCustomer(
        customerId,
        userId,
        updates,
      );
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

  app.delete("/api/customers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      // Return mock invoice data
      const mockInvoices = [
        {
          id: "inv-1",
          invoiceNumber: "INV-2024-001",
          customerId: "customer-1",
          customerName: "Sarah Martinez",
          amount: 234.5,
          status: "paid",
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          paidDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
          description: "Social media management services - March 2024",
          items: [
            {
              description: "Instagram management",
              quantity: 1,
              rate: 150.0,
              amount: 150.0,
            },
            {
              description: "TikTok content creation",
              quantity: 1,
              rate: 84.5,
              amount: 84.5,
            },
          ],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 15,
          ).toISOString(),
        },
        {
          id: "inv-2",
          invoiceNumber: "INV-2024-002",
          customerId: "customer-3",
          customerName: "Emma Wilson",
          amount: 450.0,
          status: "pending",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          paidDate: null,
          description: "Premium social media package - April 2024",
          items: [
            {
              description: "Multi-platform management",
              quantity: 1,
              rate: 300.0,
              amount: 300.0,
            },
            {
              description: "AI content planning",
              quantity: 1,
              rate: 150.0,
              amount: 150.0,
            },
          ],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
        },
        {
          id: "inv-3",
          invoiceNumber: "INV-2024-003",
          customerId: "customer-2",
          customerName: "Mike Johnson",
          amount: 180.0,
          status: "overdue",
          dueDate: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 10,
          ).toISOString(),
          paidDate: null,
          description: "Facebook advertising consultation",
          items: [
            {
              description: "Ad campaign setup",
              quantity: 1,
              rate: 120.0,
              amount: 120.0,
            },
            {
              description: "Performance analysis",
              quantity: 1,
              rate: 60.0,
              amount: 60.0,
            },
          ],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 20,
          ).toISOString(),
        },
      ];

      res.json(mockInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        userId,
      });

      const invoice = await storage.createInvoice(invoiceData);

      // Update customer total invoiced amount
      if (invoice.customerId) {
        await storage.updateCustomerTotalInvoiced(
          invoice.customerId,
          invoice.amount,
        );
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

  app.put("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const invoiceId = req.params.id;
      const updates = req.body;

      // Handle file upload URL processing
      if (updates.fileUrl) {
        const objectStorageService = new ObjectStorageService();
        updates.fileUrl =
          await objectStorageService.trySetObjectEntityAclPolicy(
            updates.fileUrl,
            {
              owner: userId,
              visibility: "private",
            },
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
  app.get("/api/team-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const assignedOnly = req.query.assigned === "true";

      // Mock team tasks data
      const mockTasks = [
        {
          id: "task-1",
          title: "Review Q1 Content Performance",
          description:
            "Analyze Q1 social media performance across all platforms and create summary report",
          status: "pending",
          priority: "high",
          assignedBy: "manager-1",
          assignedTo: userId,
          assignedByName: "Marketing Manager",
          assignedToName: "Current User",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
          category: "analytics",
          tags: ["Q1", "report", "performance"],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 1,
          ).toISOString(),
        },
        {
          id: "task-2",
          title: "Create TikTok Content Calendar",
          description:
            "Plan and schedule TikTok content for April 2024, including trending hashtags and challenges",
          status: "in_progress",
          priority: "medium",
          assignedBy: "manager-1",
          assignedTo: "user-2",
          assignedByName: "Marketing Manager",
          assignedToName: "Content Creator",
          dueDate: new Date(
            Date.now() + 1000 * 60 * 60 * 24 * 10,
          ).toISOString(),
          category: "content",
          tags: ["tiktok", "calendar", "april"],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 5,
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        },
        {
          id: "task-3",
          title: "Update Brand Guidelines",
          description:
            "Revise brand guidelines document to include new color palette and typography standards",
          status: "completed",
          priority: "low",
          assignedBy: userId,
          assignedTo: "user-3",
          assignedByName: "Current User",
          assignedToName: "Brand Designer",
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          category: "design",
          tags: ["brand", "guidelines", "design"],
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 12,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 1,
          ).toISOString(),
          completedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 1,
          ).toISOString(),
          completionNotes:
            "Updated brand guidelines with new colors and fonts. Document is ready for review.",
        },
        {
          id: "task-4",
          title: "Respond to Customer Inquiries",
          description:
            "Address high-priority customer messages from Instagram and TikTok platforms",
          status: "pending",
          priority: "urgent",
          assignedBy: "manager-2",
          assignedTo: userId,
          assignedByName: "Customer Success Manager",
          assignedToName: "Current User",
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
          category: "support",
          tags: ["customer", "urgent", "social-media"],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ];

      const filteredTasks = assignedOnly
        ? mockTasks.filter((task) => task.assignedTo === userId)
        : mockTasks.filter((task) => task.assignedBy === userId);

      res.json(filteredTasks);
    } catch (error) {
      console.error("Error fetching team tasks:", error);
      res.status(500).json({ message: "Failed to fetch team tasks" });
    }
  });

  app.post("/api/team-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
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

  app.put(
    "/api/team-tasks/:id/complete",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const taskId = req.params.id;
        const { notes, proofFileUrl } = req.body;

        // Handle proof file upload URL processing
        let processedProofUrl = proofFileUrl;
        if (proofFileUrl) {
          const objectStorageService = new ObjectStorageService();
          processedProofUrl =
            await objectStorageService.trySetObjectEntityAclPolicy(
              proofFileUrl,
              {
                owner: userId,
                visibility: "private",
              },
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
    },
  );

  // POS Integration routes
  // Get user's POS integrations
  app.get("/api/pos-integrations", isAuthenticated, async (req: any, res) => {
    try {
      // Return mock POS integrations
      const mockIntegrations = [
        {
          id: "pos-1",
          provider: "square",
          storeName: "Demo Store",
          storeUrl: "https://squareup.com/dashboard",
          status: "connected",
          isActive: true,
          lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          syncStatus: "success",
          productCount: 24,
          transactionCount: 156,
          settings: {
            autoSync: true,
            syncFrequency: "hourly",
            campaignTriggers: {
              newCustomer: true,
              purchaseAbove: 100,
              abandonedCart: false,
            },
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 30,
          ).toISOString(),
        },
        {
          id: "pos-2",
          provider: "shopify",
          storeName: "Demo Shopify Store",
          storeUrl: "demo-store.myshopify.com",
          status: "connected",
          isActive: true,
          lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          syncStatus: "success",
          productCount: 89,
          transactionCount: 423,
          settings: {
            autoSync: true,
            syncFrequency: "daily",
            campaignTriggers: {
              newCustomer: true,
              purchaseAbove: 50,
              abandonedCart: true,
            },
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 45,
          ).toISOString(),
        },
        {
          id: "pos-3",
          provider: "stripe",
          storeName: "Demo Stripe Account",
          storeUrl: "https://dashboard.stripe.com",
          status: "error",
          isActive: false,
          lastSyncAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 2,
          ).toISOString(),
          syncStatus: "failed",
          productCount: 0,
          transactionCount: 0,
          errorMessage: "API key expired. Please reconnect your account.",
          settings: {
            autoSync: false,
            syncFrequency: "manual",
            campaignTriggers: {
              newCustomer: false,
              purchaseAbove: 0,
              abandonedCart: false,
            },
          },
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 15,
          ).toISOString(),
        },
      ];

      res.json(mockIntegrations);
    } catch (error) {
      console.error("Error fetching POS integrations:", error);
      res.status(500).json({ message: "Failed to fetch POS integrations" });
    }
  });

  // Create new POS integration
  app.post("/api/pos-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const integrationData = insertPosIntegrationSchema.parse({
        ...req.body,
        userId,
      });

      // Validate credentials with POS provider
      const validationResult = await posIntegrationService.validateCredentials(
        integrationData.provider,
        {
          accessToken: integrationData.accessToken,
          storeUrl: integrationData.storeUrl,
          apiKey: integrationData.apiKey,
        },
      );

      if (!validationResult.valid) {
        return res.status(400).json({
          message: "Invalid credentials",
          error: validationResult.error,
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
        await Promise.all(
          products.map((product) => storage.createProduct(product)),
        );
      } catch (syncError) {
        console.error(
          "Product sync failed but integration created:",
          syncError,
        );
      }

      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating POS integration:", error);
      res.status(500).json({ message: "Failed to create POS integration" });
    }
  });

  // Update POS integration
  app.put(
    "/api/pos-integrations/:id",
    isAuthenticated,
    async (req: any, res) => {
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
    },
  );

  // Delete POS integration
  app.delete(
    "/api/pos-integrations/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
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
    },
  );

  // Get sales transactions
  app.get("/api/sales-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getSalesTransactionsByUserId(
        userId,
        limit,
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching sales transactions:", error);
      res.status(500).json({ message: "Failed to fetch sales transactions" });
    }
  });

  // Get products from POS systems
  app.get("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      // Return mock products from POS integrations
      const mockProducts = [
        {
          id: "prod-1",
          externalId: "sq_prod_001",
          provider: "square",
          name: "Premium Wireless Headphones",
          description:
            "High-quality wireless headphones with noise cancellation",
          price: 199.99,
          currency: "USD",
          sku: "WH-001",
          category: "Electronics",
          inventory: 45,
          status: "active",
          images: [],
          tags: ["wireless", "audio", "premium"],
          lastSoldAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          totalSold: 23,
          revenue: 4599.77,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 60,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 1,
          ).toISOString(),
        },
        {
          id: "prod-2",
          externalId: "shopify_prod_002",
          provider: "shopify",
          name: "Organic Green Tea Set",
          description:
            "Premium organic green tea collection with ceramic teapot",
          price: 89.99,
          currency: "USD",
          sku: "TEA-002",
          category: "Food & Beverage",
          inventory: 12,
          status: "active",
          images: [],
          tags: ["organic", "tea", "wellness"],
          lastSoldAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          totalSold: 67,
          revenue: 6029.33,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 90,
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        },
        {
          id: "prod-3",
          externalId: "sq_prod_003",
          provider: "square",
          name: "Yoga Mat & Block Set",
          description:
            "Eco-friendly yoga mat with matching blocks and carrying strap",
          price: 59.99,
          currency: "USD",
          sku: "YOGA-003",
          category: "Fitness",
          inventory: 8,
          status: "low_stock",
          images: [],
          tags: ["yoga", "fitness", "eco-friendly"],
          lastSoldAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          totalSold: 34,
          revenue: 2039.66,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 45,
          ).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: "prod-4",
          externalId: "shopify_prod_004",
          provider: "shopify",
          name: "Handcrafted Leather Wallet",
          description: "Genuine leather wallet with RFID blocking technology",
          price: 79.99,
          currency: "USD",
          sku: "WALLET-004",
          category: "Accessories",
          inventory: 0,
          status: "out_of_stock",
          images: [],
          tags: ["leather", "wallet", "rfid"],
          lastSoldAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
          totalSold: 89,
          revenue: 7119.11,
          createdAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 120,
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 24 * 3,
          ).toISOString(),
        },
      ];

      res.json(mockProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Sync products from specific POS integration
  app.post(
    "/api/pos-integrations/:id/sync-products",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const integration = await storage.getPosIntegrationsByUserId(
          req.user.claims.sub,
        );
        const targetIntegration = integration.find((i) => i.id === id);

        if (!targetIntegration) {
          return res.status(404).json({ message: "Integration not found" });
        }

        const products =
          await posIntegrationService.syncProducts(targetIntegration);
        await Promise.all(
          products.map((product) => storage.createProduct(product)),
        );

        res.json({
          message: "Products synced successfully",
          count: products.length,
        });
      } catch (error) {
        console.error("Error syncing products:", error);
        res.status(500).json({ message: "Failed to sync products" });
      }
    },
  );

  // Get campaign triggers
  app.get("/api/campaign-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const triggers = await storage.getCampaignTriggersByUserId(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching campaign triggers:", error);
      res.status(500).json({ message: "Failed to fetch campaign triggers" });
    }
  });

  // Create campaign trigger
  app.post("/api/campaign-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const triggerData = insertCampaignTriggerSchema.parse({
        ...req.body,
        userId,
      });
      const trigger = await storage.createCampaignTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating campaign trigger:", error);
      res.status(500).json({ message: "Failed to create campaign trigger" });
    }
  });

  // Update campaign trigger
  app.put(
    "/api/campaign-triggers/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const updates = req.body;
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const trigger = await storage.updateCampaignTrigger(
          id,
          userId,
          updates,
        );

        if (!trigger) {
          return res
            .status(404)
            .json({ message: "Campaign trigger not found" });
        }

        res.json(trigger);
      } catch (error) {
        console.error("Error updating campaign trigger:", error);
        res.status(500).json({ message: "Failed to update campaign trigger" });
      }
    },
  );

  // Webhook endpoints for POS systems
  app.post("/api/webhooks/square", async (req, res) => {
    try {
      const signature = req.headers["square-signature"] as string;
      const result = await posIntegrationService.processWebhook(
        "square",
        req.body,
        signature,
      );

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

  app.post("/api/webhooks/shopify", async (req, res) => {
    try {
      const signature = req.headers["x-shopify-hmac-sha256"] as string;
      const result = await posIntegrationService.processWebhook(
        "shopify",
        req.body,
        signature,
      );
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing Shopify webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const result = await posIntegrationService.processWebhook(
        "stripe",
        req.body,
        signature,
      );
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/woocommerce", async (req, res) => {
    try {
      const result = await posIntegrationService.processWebhook(
        "woocommerce",
        req.body,
      );
      res.json({ received: result.processed });
    } catch (error) {
      console.error("Error processing WooCommerce webhook:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Brand Design routes
  app.get("/api/brand-design", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const brandDesign = await storage.getBrandDesignByUserId(userId);

      if (!brandDesign) {
        // Return default structure if no brand design exists
        return res.json({
          isCanvaConnected: false,
          brandStyle: null,
          colorPalette: null,
          typography: null,
          logoUrl: null,
        });
      }

      res.json(brandDesign);
    } catch (error) {
      console.error("Error fetching brand design:", error);
      res.status(500).json({ message: "Failed to fetch brand design" });
    }
  });

  app.post("/api/brand-design", isAuthenticated, async (req, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const designData = { ...req.body, userId };
      console.log("REQ BODY DESIGN DATA:", JSON.stringify(req.body, null, 2));

      const existingDesign = await storage.getBrandDesignByUserId(userId);

      if (existingDesign) {
        const updated = await storage.updateBrandDesign(
          existingDesign.id,
          userId,
          designData,
        );
        res.json(updated);
      } else {
        const newDesign = await storage.createBrandDesign(designData);
        res.json(newDesign);
      }
    } catch (error) {
      console.error("Error saving brand design:", error);
      res.status(500).json({ message: "Failed to save brand design" });
    }
  });

  // utils/cloudinaryPublicId.ts
  function extractPublicIdFromUrl(url: string): string | null {
    try {
      // Formatos típicos:
      // .../image/upload/v1727987227/folder/subfolder/filename.png
      // .../image/upload/c_fill,w_200/v1727987227/folder/file.jpg
      const afterUpload = url.split("/upload/")[1];
      if (!afterUpload) return null;

      // Si hay transformaciones, vendrán antes de /v12345/
      const vIndex = afterUpload.lastIndexOf("/v");
      const afterVersion =
        vIndex !== -1 ? afterUpload.slice(vIndex + 2) : afterUpload; // quita el "/v"
      const firstSlash = afterVersion.indexOf("/");
      const rest =
        firstSlash !== -1 ? afterVersion.slice(firstSlash + 1) : afterVersion;

      // Quita la extensión (usa lastIndexOf por si hay puntos en carpetas)
      const dot = rest.lastIndexOf(".");
      const publicId = dot !== -1 ? rest.slice(0, dot) : rest;

      console.log("[Server] 🔎 extractPublicIdFromUrl", {
        url,
        afterUpload,
        afterVersion,
        rest,
        publicId,
      });
      return publicId || null;
    } catch (e) {
      console.log("[Server] ⚠️ extractPublicIdFromUrl error", e);
      return null;
    }
  }

  app.delete(
    "/api/brand-design/logo/:type",
    isAuthenticated,
    async (req: any, res) => {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const { type } = req.params; // whiteLogo | blackLogo | whiteFavicon | blackFavicon
      const { brandDesignId } = req.query;

      console.log("[Server] ➡️ DELETE /api/brand-design/logo/:type", {
        userId,
        type,
        brandDesignId,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        apiKeyPresent: !!process.env.CLOUDINARY_API_KEY,
      });

      try {
        if (!brandDesignId) {
          console.log("[Server] ❌ Missing brandDesignId");
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        // Obtén por userId para validar ownership (o trae por id y valida userId)
        const brandDesign = await storage.getBrandDesignByUserId(userId);
        console.log("[Server] 🔎 brandDesign", {
          found: !!brandDesign,
          id: brandDesign?.id,
        });

        if (!brandDesign || brandDesign.id !== brandDesignId) {
          console.log("[Server] ❌ Unauthorized to delete this logo", {
            requested: brandDesignId,
            actual: brandDesign?.id,
          });
          return res
            .status(403)
            .json({ message: "Unauthorized to delete this logo" });
        }

        const fieldMap: Record<string, keyof typeof brandDesign> = {
          whiteLogo: "whiteLogoUrl",
          blackLogo: "blackLogoUrl",
          whiteFavicon: "whiteFaviconUrl",
          blackFavicon: "blackFaviconUrl",
        };
        const fieldName = fieldMap[type];

        if (!fieldName) {
          console.log("[Server] ❌ Invalid logo type", { type });
          return res.status(400).json({ message: "Invalid logo type" });
        }

        const logoUrl = brandDesign[fieldName];
        console.log("[Server] 🔗 Current logo URL", { fieldName, logoUrl });

        if (!logoUrl) {
          console.log("[Server] ⚠️ Logo not found in DB, nothing to delete");
          return res.status(404).json({ message: "Logo not found" });
        }

        const publicId = extractPublicIdFromUrl(logoUrl as string);
        console.log("[Server] 🧩 PublicId computed", { publicId });

        if (publicId) {
          try {
            const result = await cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
            });
            console.log("[Server] ☁️ Cloudinary destroy result", result);

            if (result.result !== "ok" && result.result !== "not found") {
              throw new Error(`Cloudinary deletion failed: ${result.result}`);
            }
          } catch (cloudErr) {
            console.error(
              "[Server] ❌ Error deleting from Cloudinary:",
              cloudErr,
            );
            return res.status(500).json({
              message: "Failed to delete logo from Cloudinary",
              error:
                cloudErr instanceof Error ? cloudErr.message : "Unknown error",
            });
          }
        } else {
          console.log(
            "[Server] ⚠️ publicId is null — skipping Cloudinary destroy",
          );
        }

        // ⚠️ Aquí, evita mapToDb para updates parciales o usa mapPartialToDb
        console.log("[Server] 🗃️ Updating DB: setting field to null", {
          brandDesignId,
          fieldName,
        });
        const updated = await db
          .update(brandDesigns)
          .set({ [fieldName]: null, updatedAt: new Date() })
          .where(
            and(
              eq(brandDesigns.id, brandDesignId),
              eq(brandDesigns.userId, userId),
            ),
          )
          .returning();

        console.log("[Server] ✅ DB update result", {
          updatedCount: updated?.length || 0,
          updatedRow: updated?.[0]?.id,
        });

        return res.json({ message: `${type} deleted successfully` });
      } catch (error) {
        console.error("[Server] ❌ Unexpected error in delete logo:", error);
        return res.status(500).json({ message: "Failed to delete logo" });
      }
    },
  );
  app.post(
    "/api/brand-design/connect-canva",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";

        // In a real implementation, this would handle Canva OAuth flow
        // For now, we'll simulate the connection by returning the existing design
        const existingDesign = await storage.getBrandDesignByUserId(userId);

        if (existingDesign) {
          res.json({
            ...existingDesign,
            isCanvaConnected: true,
            canvaUserId: "simulated_canva_user",
            canvaTeamId: "simulated_team",
          });
        } else {
          res.json({
            isCanvaConnected: true,
            canvaUserId: "simulated_canva_user",
            canvaTeamId: "simulated_team",
          });
        }
      } catch (error) {
        console.error("Error connecting Canva:", error);
        res.status(500).json({ message: "Failed to connect Canva" });
      }
    },
  );

  // Upload de un asset
  app.post("/api/brand-assets", isAuthenticated, async (req: any, res) => {
    try {
      const { brandDesignId, url, name, category, assetType, publicId } =
        req.body;
      console.log("📥 BODY recibido:", req.body);
      if (!brandDesignId || !url || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const newAsset = await storage.createBrandAsset({
        brandDesignId,
        url,
        name,
        category,
        assetType,
        publicId,
      });
      console.log("✅ Insertado en DB:", newAsset);
      res.json(newAsset);
    } catch (error) {
      console.error("Error uploading asset:", error);
      res.status(500).json({ message: "Failed to upload asset" });
    }
  });

  // GET /api/brand-assets?brandDesignId=<uuid>
  app.get("/api/brand-assets", isAuthenticated, async (req: any, res) => {
    try {
      console.log("🛣ch�  GET /api/brand-assets");
      console.log("🧭  req.query:", req.query, "req.params:", req.params);
      const { brandDesignId } = req.query;
      if (!brandDesignId) {
        return res.status(400).json({ message: "brandDesignId is required" });
      }
      const assets = await storage.getAssetsByBrandDesignId(
        String(brandDesignId),
      );
      console.log(
        `📦 ${assets.length} asset(s) encontrados para`,
        brandDesignId,
      );
      res.json(assets);
    } catch (error) {
      console.error("Error fetching brand assets:", error);
      res.status(500).json({ message: "Failed to fetch brand assets" });
    }
  });

  // DELETE /api/brand-assets/:id
  app.delete(
    "/api/brand-assets/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const assetId = req.params.id;
        const { brandDesignId } = req.query;

        if (!brandDesignId) {
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        // Verify ownership: check if the brandDesign belongs to the current user
        const brandDesign = await storage.getBrandDesignByUserId(userId);
        if (!brandDesign || brandDesign.id !== brandDesignId) {
          return res
            .status(403)
            .json({ message: "Unauthorized to delete this asset" });
        }

        // Get the asset to retrieve its publicId and assetType
        const assets = await storage.getAssetsByBrandDesignId(
          String(brandDesignId),
        );
        const asset = assets.find((a) => a.id === assetId);

        if (!asset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        // Delete from Cloudinary with correct resource_type
        if (asset.publicId) {
          try {
            // Map assetType to Cloudinary resource_type
            const resourceType =
              asset.assetType === "video"
                ? "video"
                : asset.assetType === "image"
                  ? "image"
                  : "raw";

            const result = await cloudinary.uploader.destroy(asset.publicId, {
              resource_type: resourceType,
            });

            console.log(
              `☁️ Deleted from Cloudinary: ${asset.publicId} (${resourceType})`,
              result,
            );

            // Check if Cloudinary deletion was successful
            if (result.result !== "ok" && result.result !== "not found") {
              throw new Error(`Cloudinary deletion failed: ${result.result}`);
            }
          } catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError);
            return res.status(500).json({
              message: "Failed to delete asset from Cloudinary",
              error:
                cloudinaryError instanceof Error
                  ? cloudinaryError.message
                  : "Unknown error",
            });
          }
        }

        // Delete from database only if Cloudinary deletion succeeded
        const deleted = await storage.deleteBrandAsset(
          assetId,
          String(brandDesignId),
        );

        if (deleted) {
          console.log(`🗑️ Deleted asset from DB: ${assetId}`);
          res.json({ message: "Asset deleted successfully", asset: deleted });
        } else {
          res.status(404).json({ message: "Asset not found in database" });
        }
      } catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({ message: "Failed to delete asset" });
      }
    },
  );

  // Demo data population function
  async function populateDemoData(userId: string) {
    // Create social accounts
    const socialAccountsData = [
      {
        platform: "instagram",
        accountId: "ig_demo_123",
        accountName: "@mybusiness",
        isActive: true,
        accessToken: "demo_token_ig",
      },
      {
        platform: "facebook",
        accountId: "fb_demo_456",
        accountName: "My Business Page",
        isActive: true,
        accessToken: "demo_token_fb",
      },
      {
        platform: "linkedin",
        accountId: "li_demo_789",
        accountName: "My Business",
        isActive: true,
        accessToken: "demo_token_li",
      },
      {
        platform: "tiktok",
        accountId: "tt_demo_012",
        accountName: "@mybiz",
        isActive: true,
        accessToken: "demo_token_tt",
      },
      {
        platform: "x",
        accountId: "x_demo_345",
        accountName: "@MyBusiness",
        isActive: true,
        accessToken: "demo_token_x",
      },
      {
        platform: "youtube",
        accountId: "yt_demo_678",
        accountName: "My Business Channel",
        isActive: true,
        accessToken: "demo_token_yt",
      },
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
        console.log(
          `Social account ${accountData.platform} might already exist`,
        );
      }
    }

    // Create messages
    const messagesData = [
      {
        platform: "instagram",
        senderName: "Sarah Johnson",
        content:
          "Love your latest product! When will you restock the blue variant?",
        type: "comment",
        isRead: false,
        sentiment: "positive",
      },
      {
        platform: "facebook",
        senderName: "Mike Chen",
        content: "I'm having trouble with my order #12345. Can someone help?",
        type: "message",
        isRead: false,
        sentiment: "negative",
      },
      {
        platform: "linkedin",
        senderName: "Emma Wilson",
        content:
          "Great insights in your latest post about social media trends!",
        type: "comment",
        isRead: true,
        sentiment: "positive",
      },
      {
        platform: "tiktok",
        senderName: "Alex Rivera",
        content: "This is amazing! Tutorial please? 🙏",
        type: "comment",
        isRead: true,
        sentiment: "positive",
      },
      {
        platform: "x",
        senderName: "David Kim",
        content:
          "@MyBusiness Your customer service is terrible. Still waiting for a response after 3 days!",
        type: "mention",
        isRead: false,
        sentiment: "negative",
      },
      {
        platform: "instagram",
        senderName: "Lisa Park",
        content: "Can you share the recipe for this? It looks delicious! 😍",
        type: "comment",
        isRead: false,
        sentiment: "positive",
      },
      {
        platform: "facebook",
        senderName: "John Smith",
        content:
          "Do you ship internationally? I'm interested in your services.",
        type: "message",
        isRead: true,
        sentiment: "neutral",
      },
      {
        platform: "linkedin",
        senderName: "Rachel Brown",
        content:
          "Would love to collaborate on a project. Are you open to partnerships?",
        type: "message",
        isRead: false,
        sentiment: "positive",
      },
    ];

    for (const messageData of messagesData) {
      try {
        await storage.createMessage({
          socialAccountId:
            socialAccounts.find((acc) => acc.platform === messageData.platform)
              ?.id || socialAccounts[0].id,
          senderId: messageData.senderName,
          senderName: messageData.senderName,
          content: messageData.content,
          priority:
            messageData.sentiment === "negative"
              ? "high"
              : messageData.sentiment === "positive"
                ? "normal"
                : "low",
        });
      } catch (error) {
        console.log(`Message might already exist`);
      }
    }

    // Create campaigns
    const campaignsData = [
      {
        title: "Summer Product Launch 2024",
        description:
          "Launch campaign for our new summer collection with cross-platform promotion",
        platforms: ["instagram", "facebook", "tiktok"],
        content: {
          content:
            "🌞 Summer vibes are here! Discover our brand new collection that's perfect for those sunny days ahead. From beachwear to casual summer outfits, we've got everything you need to make this summer unforgettable! ✨",
          variations: {
            instagram:
              "🌞 Summer vibes are here! ✨ Discover our brand new collection perfect for sunny days ahead. From beachwear to casual outfits, we've got everything for an unforgettable summer! 🏖️ #SummerCollection #NewLaunch",
            facebook:
              "Summer is finally here! 🌞 We're thrilled to announce our brand new summer collection that's designed to make your sunny days even brighter. Whether you're heading to the beach or just enjoying the warm weather, our latest pieces combine comfort with style. Check out our new arrivals and get ready to embrace the season! What's your favorite summer style?",
            tiktok:
              "Summer collection drop! 🔥 New fits for those sunny day vibes ☀️ Which piece is your fave? #SummerVibes #NewDrop #OOTD",
          },
          suggestedHashtags: {
            instagram: [
              "#SummerCollection",
              "#NewLaunch",
              "#SummerFashion",
              "#BeachWear",
              "#SunnyDays",
            ],
            facebook: ["#SummerStyle", "#NewArrivals", "#FashionLaunch"],
            tiktok: [
              "#SummerVibes",
              "#NewDrop",
              "#OOTD",
              "#FashionTok",
              "#SummerFits",
            ],
          },
          visualSuggestions: {
            instagram: [
              "bright summer product photos",
              "lifestyle beach shots",
              "carousel showing different pieces",
            ],
            facebook: [
              "lifestyle imagery",
              "behind-the-scenes design process",
              "customer photos",
            ],
            tiktok: [
              "quick try-on videos",
              "styling transitions",
              "summer mood board",
            ],
          },
        },
        status: "published",
        aiGenerated: false,
      },
      {
        title: "AI Generated: Weekly Motivation",
        description:
          "Motivational content to inspire our community and drive engagement",
        platforms: ["linkedin", "x", "instagram"],
        content: {
          content:
            "Success isn't just about reaching the destination—it's about who you become on the journey. Every challenge you face, every obstacle you overcome, shapes you into the person capable of achieving your dreams. 💪",
          variations: {
            linkedin:
              "Success isn't just about reaching the destination—it's about who you become on the journey. In business and in life, every challenge we face and every obstacle we overcome shapes us into the leaders capable of achieving our greatest dreams. The skills you develop, the resilience you build, and the relationships you form along the way are often more valuable than the end goal itself. What lesson has your journey taught you recently?",
            x: "Success isn't about the destination—it's about who you become on the journey. Every challenge shapes you into someone capable of achieving your dreams. 💪 #MondayMotivation #GrowthMindset #Success",
            instagram:
              "Success isn't just about reaching the destination—it's about who you become on the journey ✨ Every challenge you face shapes you into the person capable of achieving your dreams 💪 What's one challenge that made you stronger? Share below! 👇",
          },
          suggestedHashtags: {
            linkedin: [
              "#Leadership",
              "#PersonalGrowth",
              "#Success",
              "#Motivation",
            ],
            x: [
              "#MondayMotivation",
              "#GrowthMindset",
              "#Success",
              "#Inspiration",
            ],
            instagram: [
              "#MondayMotivation",
              "#PersonalGrowth",
              "#Inspiration",
              "#Success",
              "#Mindset",
            ],
          },
          visualSuggestions: {
            linkedin: [
              "professional quote graphics",
              "inspirational landscape",
              "team success imagery",
            ],
            x: [
              "motivational quote cards",
              "success imagery",
              "growth graphics",
            ],
            instagram: [
              "inspirational quote overlay",
              "motivational lifestyle photo",
              "success story carousel",
            ],
          },
        },
        status: "scheduled",
        aiGenerated: true,
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
      {
        title: "Behind the Scenes: Our Team",
        description: "Showcase our amazing team and company culture",
        platforms: ["instagram", "linkedin", "facebook"],
        content: {
          content:
            "Meet the incredible team behind our success! 👥 From our creative designers to our dedicated customer service representatives, every person plays a vital role in delivering excellence to our customers every single day.",
          variations: {
            instagram:
              "Meet the incredible team behind our success! 👥✨ From creative designers to amazing customer service reps, every person brings something special to deliver excellence daily 💙 #TeamSpotlight #BehindTheScenes",
            linkedin:
              "Today we want to spotlight the incredible team that makes our success possible. From our innovative designers who bring creative visions to life, to our dedicated customer service representatives who ensure every interaction exceeds expectations, each team member plays a vital role in our mission. We're grateful for their passion, expertise, and commitment to delivering excellence every single day. #TeamAppreciation #CompanyCulture",
            facebook:
              "We believe our team is our greatest asset! 💙 Today we're highlighting the amazing people behind our brand - from our creative designers who bring fresh ideas to life, to our customer service team who go above and beyond for every customer. Each person brings unique talents and passion that make our company special. What qualities do you value most in a great team?",
          },
          suggestedHashtags: {
            instagram: [
              "#TeamSpotlight",
              "#BehindTheScenes",
              "#CompanyCulture",
              "#TeamWork",
            ],
            linkedin: [
              "#TeamAppreciation",
              "#CompanyCulture",
              "#Leadership",
              "#EmployeeSpotlight",
            ],
            facebook: [
              "#TeamWork",
              "#CompanyCulture",
              "#BehindTheScenes",
              "#GreatTeam",
            ],
          },
          visualSuggestions: {
            instagram: [
              "team candid photos",
              "office behind-the-scenes",
              "individual team member spotlights",
            ],
            linkedin: [
              "professional team photos",
              "office culture shots",
              "team collaboration imagery",
            ],
            facebook: [
              "team group photos",
              "workplace candids",
              "team achievement celebrations",
            ],
          },
        },
        status: "draft",
        aiGenerated: false,
      },
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
        description:
          "Comprehensive content strategy for the fourth quarter focusing on holiday campaigns and year-end promotions",
        month: 12,
        year: 2024,
        strategy: JSON.stringify({
          insights: [
            "Holiday shopping peaks in November and December, with Black Friday and Cyber Monday as key conversion periods",
            "Instagram engagement rates increase 23% during holiday season with visual content",
            "LinkedIn shows higher B2B engagement during Q4 planning season",
            "TikTok holiday hashtags trend 300% higher in December",
          ],
          recommendations: [
            "Focus on gift-guide content and holiday styling tips",
            "Create behind-the-scenes content showing holiday preparation",
            "Develop user-generated content campaigns with holiday hashtags",
            "Plan early Black Friday and Cyber Monday promotional content",
          ],
          posts: [
            {
              date: "2024-12-01",
              platform: "instagram",
              contentType: "holiday_gift_guide",
              title: "Ultimate Holiday Gift Guide 2024",
              description:
                "Curated selection of our best products perfect for holiday gifting",
              hashtags: ["#HolidayGifts", "#GiftGuide2024", "#HolidayStyle"],
              optimalTime: "6:00 PM",
            },
            {
              date: "2024-12-15",
              platform: "tiktok",
              contentType: "behind_the_scenes",
              title: "Holiday Package Prep Behind the Scenes",
              description: "Show our team preparing beautiful holiday packages",
              hashtags: ["#BehindTheScenes", "#HolidayPrep", "#PackagingASMR"],
              optimalTime: "7:00 PM",
            },
          ],
        }),
        status: "active",
      },
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
      {
        name: "Tech Solutions Inc",
        email: "contact@techsolutions.com",
        phone: "+1 (555) 123-4567",
        status: "active",
        totalInvoiced: 15750.0,
      },
      {
        name: "Creative Agency LLC",
        email: "hello@creativeagency.com",
        phone: "+1 (555) 234-5678",
        status: "active",
        totalInvoiced: 8900.5,
      },
      {
        name: "Startup Ventures",
        email: "team@startupventures.com",
        phone: "+1 (555) 345-6789",
        status: "active",
        totalInvoiced: 12300.0,
      },
      {
        name: "Local Restaurant Group",
        email: "manager@localeatery.com",
        phone: "+1 (555) 456-7890",
        status: "inactive",
        totalInvoiced: 3200.0,
      },
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
      {
        platform: "instagram",
        metric: "reach",
        value: 15420,
        period: "weekly",
        recordedAt: new Date(),
      },
      {
        platform: "instagram",
        metric: "engagement",
        value: 1247,
        period: "weekly",
        recordedAt: new Date(),
      },
      {
        platform: "facebook",
        metric: "reach",
        value: 8750,
        period: "weekly",
        recordedAt: new Date(),
      },
      {
        platform: "facebook",
        metric: "engagement",
        value: 892,
        period: "weekly",
        recordedAt: new Date(),
      },
      {
        platform: "tiktok",
        metric: "reach",
        value: 22100,
        period: "weekly",
        recordedAt: new Date(),
      },
      {
        platform: "tiktok",
        metric: "engagement",
        value: 2847,
        period: "weekly",
        recordedAt: new Date(),
      },
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
      {
        action: "connect_social_account",
        description: "Connected Instagram account @mybusiness",
        entityType: "social_account",
        entityId: "1",
      },
      {
        action: "create_campaign",
        description: "Created Summer Product Launch 2024 campaign",
        entityType: "campaign",
        entityId: "1",
      },
      {
        action: "generate_ai_campaign",
        description: "Generated AI campaign: Weekly Motivation",
        entityType: "campaign",
        entityId: "2",
      },
      {
        action: "publish_campaign",
        description: "Published Summer Product Launch 2024 to 3 platforms",
        entityType: "campaign",
        entityId: "1",
      },
      {
        action: "connect_social_account",
        description: "Connected TikTok account @mybiz",
        entityType: "social_account",
        entityId: "2",
      },
      {
        action: "create_content_plan",
        description: "Created Q4 2024 Content Strategy",
        entityType: "content_plan",
        entityId: "1",
      },
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
      {
        platform: "instagram",
        accountId: "ig_demo_acc1",
        accountName: "@mybusiness",
        isActive: true,
        accessToken: "demo_token_ig",
        refreshToken: "demo_refresh_ig",
      },
      {
        platform: "whatsapp",
        accountId: "wa_demo_acc2",
        accountName: "Business WhatsApp",
        isActive: true,
        accessToken: "demo_token_wa",
        refreshToken: "demo_refresh_wa",
      },
      {
        platform: "email",
        accountId: "email_demo_acc3",
        accountName: "info@mybusiness.com",
        isActive: true,
        accessToken: "demo_token_email",
        refreshToken: "demo_refresh_email",
      },
      {
        platform: "tiktok",
        accountId: "tt_demo_acc4",
        accountName: "@mybiz_official",
        isActive: true,
        accessToken: "demo_token_tt",
        refreshToken: "demo_refresh_tt",
      },
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
        console.log(
          `Social account ${accountData.platform} might already exist`,
        );
      }
    }

    // Create sample conversations/messages for unified inbox
    const demoConversationsData = [
      // Instagram Messages
      {
        socialAccountId: createdSocialAccounts.instagram,
        senderId: "sarah_lifestyle_23",
        senderName: "Sarah Johnson",
        senderAvatar:
          "https://images.unsplash.com/photo-1494790108755-2616b73d5ba3?w=50&h=50&fit=crop&crop=face",
        content:
          "Hi! I absolutely love your latest product collection! 😍 Is the blue sweater available in medium size?",
        messageType: "text",
        priority: "normal",
        tags: ["product_inquiry", "sizing"],
        isRead: false,
      },
      {
        socialAccountId: createdSocialAccounts.instagram,
        senderId: "mike_runner_pro",
        senderName: "Mike Rodriguez",
        senderAvatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
        content:
          "The running shoes I ordered last week are amazing! 🏃‍♂️ Can I get them in another color?",
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
        senderAvatar:
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=50&h=50&fit=crop&crop=face",
        content:
          "Hello! I saw your ad on Facebook. Do you have any winter jackets available? I'm interested in purchasing for my family.",
        messageType: "text",
        priority: "high",
        tags: ["sales_inquiry", "family_purchase"],
        isRead: false,
      },
      {
        socialAccountId: createdSocialAccounts.whatsapp,
        senderId: "9876543210",
        senderName: "David Park",
        senderAvatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
        content:
          "Hi, I received my order yesterday but the item doesn't fit well. What's your return policy?",
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
        content:
          "Subject: Bulk Order Inquiry\n\nHello, I represent a corporate client interested in placing a bulk order for employee gifts. Could you provide pricing for 50+ units? Thanks!",
        messageType: "text",
        priority: "high",
        tags: ["bulk_order", "corporate"],
        isRead: false,
      },
      {
        socialAccountId: createdSocialAccounts.email,
        senderId: "alex.taylor@company.com",
        senderName: "Alex Taylor",
        content:
          "Subject: Collaboration Opportunity\n\nHi there! I'm a lifestyle blogger with 50K followers. Would you be interested in a product collaboration? I'd love to feature your brand!",
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
        senderAvatar:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=50&h=50&fit=crop&crop=face",
        content:
          "OMG your TikTok is so aesthetic! 💫 Where can I buy that pink hoodie from your last video?? It's perfect!",
        messageType: "text",
        priority: "normal",
        tags: ["product_inquiry", "young_demographic"],
        isRead: false,
      },
      {
        socialAccountId: createdSocialAccounts.tiktok,
        senderId: "fashion_lover_99",
        senderName: "Isabella Garcia",
        senderAvatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
        content:
          "Your latest TikTok inspired my whole outfit today! 👗 Do you ship internationally? I'm in Canada 🇨🇦",
        messageType: "text",
        priority: "normal",
        tags: ["inspiration", "international_shipping"],
        isRead: true,
      },
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

  const server = createServer(app);
  return server;
}
