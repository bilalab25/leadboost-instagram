import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { requireBrand, requireRole } from "./middleware";
import {
  logFacebookRequest,
  logFacebookResponse,
  logAttachmentFetch,
  logAttachmentFound,
  logAttachmentNotFound,
  logAttachmentError,
  logUnifiedRequest,
  logUnifiedResponse,
} from "./diagnostic";
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
import { z } from "zod";
import { posIntegrationService } from "./services/posIntegrations";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import cloudinary from "./cloudinary";
import { db } from "./db";
import { brandDesigns } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";
import { nanoid } from "nanoid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const upload = multer({ dest: "uploads/" });

// ==================================================================================
// MULTI-PLATFORM MESSAGE FETCH HELPERS
// ==================================================================================

interface NormalizedMessage {
  id: string;
  conversationId: string; // CRITICAL: Separate conversation identifier for detail view
  metaConversationId?: string | null; // ✅ Meta conversation ID for proper grouping
  text: string;
  imageUrl: string | null;
  from: string;
  fromId: string;
  created_time: string;
  provider: string;
  accountId?: string; // ✅ Account ID for message direction detection
}
function logSection(title: string, data?: any) {
  console.log(`\n🟨 === ${title} ===`);
  if (data) console.dir(data, { depth: 2, colors: true });
}

function logMessageSummary(provider: string, m: any, idx: number) {
  console.log(
    `   • [${provider}] #${idx + 1} → id:${m.id || "?"} | from:${m.from?.name || m.from?.username || m.from || "?"} | text:"${m.message || m.text || ""}" | attachments:${
      m.attachments?.data?.length || 0
    } | created:${m.created_time || "?"}`,
  );
}

async function fetchFacebookMessagesFromDB(
  integrationId: string,
  conversationId: string,
  accountId: string,
): Promise<NormalizedMessage[]> {
  const dbMessages = await storage.getMessagesByIntegrationAndConversation(
    integrationId,
    conversationId,
  );

  return dbMessages.map((m) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "Usuario",
    fromId: m.senderId,
    created_time: m.timestamp.toISOString(),
    provider: "facebook",
    accountId,
    direction: m.direction,
  }));
}

async function fetchInstagramMessagesFromDB(
  integrationId: string,
  conversationId: string,
  accountId: string,
): Promise<NormalizedMessage[]> {
  const dbMessages = await storage.getMessagesByIntegrationAndConversation(
    integrationId,
    conversationId,
  );

  return dbMessages.map((m) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "Usuario",
    fromId: m.senderId,
    created_time: m.timestamp.toISOString(),
    provider: "instagram",
    accountId,
    direction: m.direction,
  }));
}

async function fetchThreadsMessagesFromDB(
  integrationId: string,
  conversationId: string,
  accountId: string,
): Promise<NormalizedMessage[]> {
  const dbMessages = await storage.getMessagesByIntegrationAndConversation(
    integrationId,
    conversationId,
  );

  return dbMessages.map((m) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "Usuario",
    fromId: m.senderId,
    created_time: m.timestamp.toISOString(),
    provider: "threads",
    accountId,
    direction: m.direction,
  }));
}

async function fetchWhatsappMessagesFromDB(
  integrationId: string,
  conversationId: string,
  accountId: string,
): Promise<NormalizedMessage[]> {
  const dbMessages = await storage.getMessagesByIntegrationAndConversation(
    integrationId,
    conversationId,
  );

  return dbMessages.map((m) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.contactName || conversationId,
    fromId: m.senderId,
    created_time: m.timestamp.toISOString(),
    provider: "whatsapp",
    accountId,
    direction: m.direction,
  }));
}

// ==================================================================================
// HYBRID SYNC HELPERS FOR MESSENGER/INSTAGRAM
// ==================================================================================

/**
 * Perform initial historical sync for Messenger/Instagram
 * Fetches last 50 conversations and 50 messages per conversation
 */
async function performInitialSync(
  userId: string,
  integration: any,
  provider: string,
): Promise<void> {
  try {
    console.log(
      `\n🔄 [INITIAL SYNC] Starting for ${provider.toUpperCase()}...`,
    );

    const accessToken = integration.accessToken;
    const accountId = integration.pageId;

    // Basic business identifiers (simplified)
    const businessIds = [accountId, integration.pageId].filter(Boolean);
    console.log(`🔍 Business IDs detected:`, businessIds);

    // Fetch all conversations
    const convoUrl = `https://graph.facebook.com/v24.0/${accountId}/conversations?fields=id,platform,participants,updated_time${provider !== "facebook" ? `&platform=${provider}` : ""}&limit=50&access_token=${accessToken}`;
    console.log(
      `📞 Fetching conversations from: ${convoUrl.replace(accessToken, "TOKEN")}`,
    );

    const convoRes = await fetch(convoUrl);
    const convoData = await convoRes.json();

    if (convoData.error) {
      console.error(`❌ Initial sync error for ${provider}:`, convoData.error);
      return;
    }

    const conversations = convoData.data || [];
    console.log(
      `📦 Found ${conversations.length} conversations for ${provider}`,
    );

    const messagesToInsert: any[] = [];
    const conversationMetadata = new Map<string, any>(); // Track latest message per conversation

    // Loop through each conversation
    for (const convo of conversations) {
      const messagesUrl = `https://graph.facebook.com/v24.0/${convo.id}/messages?fields=id,message,text,from,to,created_time,attachments&limit=50&access_token=${accessToken}`;
      const msgRes = await fetch(messagesUrl);
      const msgData = await msgRes.json();

      if (msgData.error) {
        console.error(
          `⚠️ Error fetching messages for conversation ${convo.id}:`,
          msgData.error,
        );
        continue;
      }

      const messages = msgData.data || [];
      console.log(`  📨 Conversation ${convo.id}: ${messages.length} messages`);

      for (const m of messages) {
        const text = m.message || m.text || "";
        const fromId = m.from?.id || "";
        const fromName = m.from?.name || m.from?.username || "Unknown";
        const toId = m.to?.data?.[0]?.id || "";
        const toName =
          m.to?.data?.[0]?.name || m.to?.data?.[0]?.username || "Unknown";

        // 🧠 Detect direction
        let isOutbound = false;
        if (["facebook", "instagram", "threads"].includes(provider)) {
          if (fromId === accountId || fromId === integration.pageId)
            isOutbound = true;
          if (
            provider !== "facebook" &&
            (fromId.startsWith("1784") ||
              fromName?.toLowerCase() ===
                integration.accountName?.toLowerCase())
          ) {
            isOutbound = true;
          }
        }

        if (provider === "whatsapp") {
          const wabaId = integration.metadata?.waba_id || integration.page_id;
          if (fromId === wabaId || fromId === accountId) isOutbound = true;
        }

        console.log(
          `🧩 Msg ${m.id.slice(0, 10)}... | from: ${fromName} (${fromId}) → to: ${toName} (${toId}) | outbound: ${isOutbound}`,
        );

        const contactName = isOutbound ? toName : fromName;
        const messageTimestamp = new Date(m.created_time);

        // Track latest message for conversation metadata
        const existing = conversationMetadata.get(convo.id);
        if (!existing || messageTimestamp > existing.latestTimestamp) {
          conversationMetadata.set(convo.id, {
            metaConversationId: convo.id,
            latestMessage: text,
            latestTimestamp: messageTimestamp,
            contactName,
          });
        }

        // ✅ Save Meta Conversation ID here (conversationId will be added later)
        messagesToInsert.push({
          userId,
          brandId: integration.brandId,
          integrationId: integration.id,
          platform: provider,
          metaMessageId: m.id,
          metaConversationId: convo.id,
          senderId: fromId,
          recipientId: toId,
          textContent: text,
          direction: isOutbound ? "outbound" : "inbound",
          isRead: isOutbound,
          timestamp: messageTimestamp,
          contactName,
          rawPayload: { message: m, conversation: convo },
        });
      }
    }

    // ✅ Batch create conversations
    console.log(`🔄 Creating ${conversationMetadata.size} conversations...`);
    const conversationMap = new Map<string, string>(); // metaConversationId -> conversationId

    for (const [
      metaConversationId,
      metadata,
    ] of conversationMetadata.entries()) {
      const conversation = await storage.getOrCreateConversation({
        integrationId: integration.id,
        brandId: integration.brandId,
        userId,
        metaConversationId,
        platform: provider,
        contactName: metadata.contactName,
        lastMessage: metadata.latestMessage,
        lastMessageAt: metadata.latestTimestamp,
      });
      conversationMap.set(metaConversationId, conversation.id);
    }

    // ✅ Add conversationId to all messages
    messagesToInsert.forEach((msg) => {
      msg.conversationId = conversationMap.get(msg.metaConversationId);
    });

    console.log(
      `✅ Mapped ${messagesToInsert.length} messages to conversations`,
    );

    // ✅ Save messages
    if (messagesToInsert.length > 0) {
      console.log(
        `💾 Saving ${messagesToInsert.length} messages to database...`,
      );
      await storage.bulkInsertMessages(messagesToInsert);
      console.log(`✅ Initial sync complete for ${provider}`);
    } else {
      console.log(
        `📭 No new messages found for ${provider}, marking as synced anyway`,
      );
    }

    // ✅ Mark integration as fetched
    await storage.markIntegrationAsFetched(integration.id);
    integration.hasFetchedHistory = true;
    console.log(
      `🏁 [${provider.toUpperCase()}] Marked as fetched in DB and memory`,
    );
  } catch (err) {
    console.error(`❌ Initial sync failed for ${provider}:`, err);
  }
}

/**
 * Merge local and remote messages, removing duplicates by metaMessageId
 */
function mergeLocalAndRemote(
  remoteMessages: NormalizedMessage[],
  localMessages: NormalizedMessage[],
): NormalizedMessage[] {
  const messageMap = new Map<string, NormalizedMessage>();

  // Add remote messages first
  for (const msg of remoteMessages) {
    messageMap.set(msg.id, msg);
  }

  // Add local messages (won't overwrite if ID already exists)
  for (const msg of localMessages) {
    if (!messageMap.has(msg.id)) {
      messageMap.set(msg.id, msg);
    }
  }

  return Array.from(messageMap.values());
}

// ==================================================================================

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
  app.get("/api/brands-mock", async (req: any, res) => {
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

  // Brand memberships endpoint
  app.get("/api/brand-memberships", isAuthenticated, async (req: any, res) => {
    try {
      console.log("─────────────────────────────────────────────");
      console.log("🔥 [BRAND-MEMBERSHIPS] Incoming request");

      // Log del req.user COMPLETO
      console.log("👤 req.user:", JSON.stringify(req.user, null, 2));

      const claimsSub = (req.user as any)?.claims?.sub;
      const userIdField = (req.user as any)?.id;
      const fallback = "demo-user";

      console.log("🔍 Extracted IDs:");
      console.log("   • claims.sub:", claimsSub);
      console.log("   • user.id:", userIdField);

      const userId = claimsSub || userIdField || fallback;

      console.log("👉 Final userId used for membership lookup:", userId);

      console.log("📡 Querying getBrandMemberships(userId)…");

      const memberships = await storage.getBrandMemberships(userId);

      console.log("📦 Result from getBrandMemberships:");
      console.log(JSON.stringify(memberships, null, 2));

      if (memberships.length === 0) {
        console.log(
          "⚠️ No memberships found. This usually means userId mismatched with DB.",
        );
      } else {
        console.log("✅ Memberships found:", memberships.length);
      }

      console.log("─────────────────────────────────────────────");

      res.json(memberships);
    } catch (error) {
      console.error("❌ Error fetching brand memberships:", error);
      res.status(500).json({ message: "Failed to fetch brand memberships" });
    }
  });

  // Create new brand endpoint
  app.post("/api/brands/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        (req.user as any)?.claims?.sub || (req.user as any)?.id || "demo-user";
      const { name, industry, description, brandColor } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Create brand
      const brand = await storage.createBrand({
        userId,
        name,
        industry: industry || null,
        description: description || null,
        primaryColor: brandColor || null,
      });

      // Create brand membership with owner role
      const membership = await storage.createBrandMembership({
        userId,
        brandId: brand.id,
        role: "owner",
        status: "active",
        invitedBy: null,
      });

      res.json({ brand, membership });
    } catch (error) {
      console.error("Error creating brand:", error);
      res.status(500).json({ message: "Failed to create brand" });
    }
  });

  // Accept brand invitation endpoint
  app.post(
    "/api/brand-invitations/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { inviteCode } = req.body;

        if (!inviteCode) {
          return res.status(400).json({ message: "Invite code is required" });
        }

        const membership = await storage.acceptBrandInvitation(
          inviteCode,
          userId,
        );

        res.json({ membership });
      } catch (error: any) {
        console.error("Error accepting brand invitation:", error);
        res
          .status(400)
          .json({ message: error.message || "Failed to accept invitation" });
      }
    },
  );

  // Get brand members (requires brand access)
  app.get(
    "/api/brands/:brandId/members",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const memberships = await storage.getBrandMembershipsByBrand(brandId);
        const userIds = memberships.map((m) => m.userId).filter(Boolean);
        const users = await storage.getUsersByIds(userIds);
        const result = memberships.map((m) => {
          const user = users.find((u) => u.id === m.userId);

          return {
            ...m,
            user: user
              ? {
                  id: user.id,
                  firebaseUid: user.firebaseUid,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  avatarUrl: user.avatarUrl,
                }
              : null,
          };
        });
        console.log("Brand members:", result);
        res.json(result);
      } catch (error) {
        console.error("Error fetching brand members:", error);
        res.status(500).json({ message: "Failed to fetch brand members" });
      }
    },
  );

  // Create brand invitation (requires admin/owner role)
  app.post(
    "/api/brand-invitations",
    isAuthenticated,
    requireBrand,
    requireRole("admin"),
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { brandId } = req.query;
        const { role, email } = req.body;

        if (!role || !["viewer", "editor", "admin"].includes(role)) {
          return res.status(400).json({
            message: "Valid role is required (viewer, editor, or admin)",
          });
        }

        // Generate unique invite code
        const inviteCode = nanoid(10);

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await storage.createBrandInvitation({
          brandId: brandId as string,
          inviteCode,
          role,
          invitedBy: userId,
          email: email || null,
          expiresAt,
          status: "pending",
        });

        res.json(invitation);
      } catch (error) {
        console.error("Error creating brand invitation:", error);
        res.status(500).json({ message: "Failed to create invitation" });
      }
    },
  );

  // Get brand invitations (requires brand access)
  app.get(
    "/api/brand-invitations/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const invitations = await storage.getBrandInvitations(brandId);
        res.json(invitations);
      } catch (error) {
        console.error("Error fetching brand invitations:", error);
        res.status(500).json({ message: "Failed to fetch invitations" });
      }
    },
  );

  // Update brand member role (requires owner role)
  app.patch(
    "/api/brand-memberships/:membershipId/role",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { membershipId } = req.params;
        const { role } = req.body;

        if (!role || !["viewer", "editor", "admin", "owner"].includes(role)) {
          return res.status(400).json({ message: "Valid role is required" });
        }

        // First, get the target membership to verify brandId
        const targetMembership =
          await storage.getBrandMembershipById(membershipId);
        if (!targetMembership) {
          return res.status(404).json({ message: "Membership not found" });
        }

        // Verify the acting user is an owner of this brand
        const actorMembership = await storage.getUserBrandMembership(
          userId,
          targetMembership.brandId,
        );
        if (!actorMembership || actorMembership.role !== "owner") {
          return res
            .status(403)
            .json({ message: "Only brand owners can change member roles" });
        }

        // Prevent demoting the last owner
        if (targetMembership.role === "owner" && role !== "owner") {
          const allMembers = await storage.getBrandMembershipsByBrand(
            targetMembership.brandId,
          );
          const ownerCount = allMembers.filter(
            (m) => m.role === "owner",
          ).length;
          if (ownerCount <= 1) {
            return res
              .status(400)
              .json({ message: "Cannot demote the last owner of the brand" });
          }
        }

        const updatedMembership = await storage.updateBrandMembershipRole(
          membershipId,
          role,
        );
        res.json(updatedMembership);
      } catch (error) {
        console.error("Error updating member role:", error);
        res.status(500).json({ message: "Failed to update member role" });
      }
    },
  );

  // Remove brand member (requires owner/admin role)
  app.delete(
    "/api/brand-memberships/:membershipId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const actorUserId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { membershipId } = req.params;

        // Get the target membership
        const targetMembership =
          await storage.getBrandMembershipById(membershipId);
        if (!targetMembership) {
          return res.status(404).json({ message: "Membership not found" });
        }

        // Verify the acting user is an admin/owner of this brand
        const actorMembership = await storage.getUserBrandMembership(
          actorUserId,
          targetMembership.brandId,
        );
        if (
          !actorMembership ||
          !["admin", "owner"].includes(actorMembership.role)
        ) {
          return res
            .status(403)
            .json({ message: "Only brand admins/owners can remove members" });
        }

        // Prevent removing the last owner
        if (targetMembership.role === "owner") {
          const allMembers = await storage.getBrandMembershipsByBrand(
            targetMembership.brandId,
          );
          const ownerCount = allMembers.filter(
            (m) => m.role === "owner",
          ).length;
          if (ownerCount <= 1) {
            return res
              .status(400)
              .json({ message: "Cannot remove the last owner of the brand" });
          }
        }

        const success = await storage.removeBrandMembership(
          targetMembership.userId,
          targetMembership.brandId,
        );
        res.json({ success });
      } catch (error) {
        console.error("Error removing brand member:", error);
        res.status(500).json({ message: "Failed to remove member" });
      }
    },
  );

  // Expire brand invitation (requires admin/owner role)
  app.post(
    "/api/brand-invitations/:invitationId/expire",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const actorUserId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const { invitationId } = req.params;

        // Get the invitation to verify brandId
        const invitation = await storage.getBrandInvitationById(invitationId);
        if (!invitation) {
          return res.status(404).json({ message: "Invitation not found" });
        }

        // Verify the acting user is an admin/owner of this brand
        const actorMembership = await storage.getUserBrandMembership(
          actorUserId,
          invitation.brandId,
        );
        if (
          !actorMembership ||
          !["admin", "owner"].includes(actorMembership.role)
        ) {
          return res.status(403).json({
            message: "Only brand admins/owners can expire invitations",
          });
        }

        const success = await storage.expireBrandInvitation(invitationId);
        res.json({ success });
      } catch (error) {
        console.error("Error expiring invitation:", error);
        res.status(500).json({ message: "Failed to expire invitation" });
      }
    },
  );

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

  app.get("/api/messages/latest", isAuthenticated, async (req, res) => {
    try {
      // 1. Obtener el límite y el usuario
      const { limit: limitStr = "10" } = req.query;
      const limit = parseInt(limitStr as string, 10);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: "Invalid limit parameter" });
      }
      const userId = req.user.id;

      // 2. Obtener todas las integraciones del usuario
      const integrations = await storage.getIntegrations(userId);
      if (!integrations || integrations.length === 0) {
        return res.json([]);
      }

      // 3. Crear tareas para obtener mensajes de CADA integración
      const fetchTasks = integrations.map(async (integration) => {
        const provider = integration.provider;
        const accountId = integration.accountId;

        try {
          let messages: NormalizedMessage[] = [];

          switch (provider) {
            case "facebook":
            case "instagram":
            case "threads": {
              // Opcional: Ejecutar sincronización inicial si es necesario (como en el otro endpoint)
              if (!integration.hasFetchedHistory) {
                await performInitialSync(userId, integration, provider);
                await storage.markIntegrationAsFetched(integration.id);
              }

              // ✅ Leer mensajes de la base de datos local para Meta (Facebook/Instagram/Threads)
              const dbMessages = await storage.getMessagesByIntegration(
                integration.id,
                limit, // Pasa el límite a tu función de almacenamiento
              );

              messages = dbMessages.map((m) => ({
                id: m.metaMessageId,
                conversationId:
                  m.direction === "inbound" ? m.senderId : m.recipientId,
                metaConversationId: m.metaConversationId,
                text: m.textContent || "",
                from:
                  m.direction === "outbound" ? "You" : m.contactName || "User",
                fromId: m.senderId,
                created_time: m.timestamp.toISOString(),
                provider: provider,
                accountId,
                direction: m.direction,
                // Nota: Tendrás que asegurarte de que tu función getMessagesByIntegration
                // también pueda obtener datos de imágenes (imageUrl) si es necesario.
                // Por ahora, lo dejo como null o necesitarías adaptar la lógica de mapeo si almacenas esa URL.
                imageUrl: null,
              }));

              break;
            }

            case "whatsapp": {
              // Nota: El endpoint 'all' hace una agregación más compleja por conversación
              // Para "latest", simplemente vamos a obtener los últimos mensajes DIRECTOS de la DB
              // y luego aplicaremos el límite y ordenamiento globalmente.

              const allWhatsAppMessages =
                await storage.getMessagesByIntegration(
                  integration.id,
                  limit, // Pasa el límite a tu función de almacenamiento
                );

              messages = allWhatsAppMessages.map((m) => ({
                id: m.metaMessageId,
                conversationId:
                  m.direction === "inbound" ? m.senderId : m.recipientId,
                metaConversationId: m.metaConversationId,
                text: m.textContent || "",
                from:
                  m.direction === "outbound" ? "You" : m.contactName || "User",
                fromId: m.senderId,
                created_time: m.timestamp.toISOString(),
                provider: provider,
                accountId,
                direction: m.direction,
                imageUrl: null,
              }));

              break;
            }

            default:
              console.warn(`Provider desconocido: ${provider}`);
              break;
          }

          return { messages, success: true, provider, accountId };
        } catch (err) {
          console.error(`❌ Error fetching messages for ${provider}:`, err);
          return {
            messages: [],
            success: false,
            provider,
            accountId,
            error: err,
          };
        }
      });

      // 4. Ejecutar las tareas de obtención de mensajes
      const results = await Promise.allSettled(fetchTasks);
      const allMessages: NormalizedMessage[] = [];

      // 5. Unificar los mensajes exitosos
      results.forEach((result) => {
        if (
          result.status === "fulfilled" &&
          result.value.success &&
          result.value.messages.length > 0
        ) {
          // Adjunta el accountId a cada mensaje
          const providerMessages = result.value.messages.map((msg) => ({
            ...msg,
            accountId: result.value.accountId,
          }));
          allMessages.push(...providerMessages);
        }
      });

      // 6. Ordenar todos los mensajes por 'created_time' (el más reciente primero)
      allMessages.sort(
        (a, b) =>
          new Date(b.created_time).getTime() -
          new Date(a.created_time).getTime(),
      );

      // 7. Aplicar el límite y enviar la respuesta
      const latestMessages = allMessages.slice(0, limit);

      res.json(latestMessages);
    } catch (err) {
      console.error("❌ Error fetching latest messages from DB:", err);
      res.status(500).json({ error: "Failed to fetch latest messages" });
    }
  });

  // Importante: Debes actualizar la firma de tu función de almacenamiento si aún no lo has hecho.
  // Por ejemplo: storage.getMessagesByIntegration(integrationId: string, limit?: number)

  // Content plans routes
  app.get(
    "/api/content-plans",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const contentPlans = await storage.getContentPlansByBrandId(brandId);
        res.json(contentPlans);
      } catch (error) {
        console.error("Error fetching content plans:", error);
        res.status(500).json({ message: "Failed to fetch content plans" });
      }
    },
  );

  app.get("/api/content-plans-mock", async (req: any, res) => {
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
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const { month, year, businessData } = req.body;

        const strategy = await generateMonthlyContentStrategy(
          businessData,
          month,
          year,
        );

        const plan = await storage.createContentPlan({
          userId,
          brandId,
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
          brandId,
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

  // Social Posting Frequency routes
  app.post(
    "/api/posting-frequency",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandId;
        const { schedules } = req.body;

        // Explicit validation for brandId
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        if (!schedules || !Array.isArray(schedules)) {
          return res.status(400).json({ message: "Invalid schedules data" });
        }

        // Convert schedules to database format
        const frequencies = schedules.map((schedule: any) => ({
          userId,
          brandId, // Ensure brandId is set for each frequency
          platform: schedule.platform,
          frequencyDays: schedule.postsPerWeek,
          daysWeek: schedule.selectedDays,
          source: "custom",
          status: "accepted",
          confidenceScore: null,
          insightsData: null,
        }));

        // Save to database (with validation inside)
        await storage.saveSocialPostingFrequencies(brandId, frequencies);

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
          action: "save_posting_frequency",
          description: `Saved posting frequency for ${schedules.length} platforms`,
          entityType: "posting_frequency",
          entityId: brandId,
        });

        res.json({
          success: true,
          message: "Posting frequency saved successfully",
        });
      } catch (error) {
        console.error("Error saving posting frequency:", error);
        res.status(500).json({ message: "Failed to save posting frequency" });
      }
    },
  );

  app.get(
    "/api/posting-frequency",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;

        // Explicit validation for brandId
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        const frequencies =
          await storage.getSocialPostingFrequenciesByBrand(brandId);
        res.json(frequencies);
      } catch (error) {
        console.error("Error fetching posting frequency:", error);
        res.status(500).json({ message: "Failed to fetch posting frequency" });
      }
    },
  );

  // Get AI-powered posting frequency suggestions (using Graph API directly)
  app.post(
    "/api/posting-frequency/ai-suggestions",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";

        const integrations = await storage.getIntegrationsByUserId(userId);
        const active = integrations.filter(
          (i: any) =>
            ["facebook", "instagram"].includes(i.provider) && i.isActive,
        );

        if (active.length === 0) {
          return res.status(400).json({
            message: "No active Facebook or Instagram integrations found",
          });
        }

        console.log(
          `[AI Suggestions] Processing ${active.length} integrations`,
        );
        const recommendations = [];

        for (const integration of active) {
          try {
            // 🔹 FACEBOOK
            if (integration.provider === "facebook") {
              const url = `https://graph.facebook.com/v24.0/${integration.accountId}/insights?metric=page_impressions,page_post_engagements,page_posts_impressions_unique&period=day&access_token=${integration.accessToken}`;
              const resFB = await fetch(url);
              const dataFB = await resFB.json();

              const metrics = dataFB.data || [];
              const getMetric = (n: string) =>
                metrics
                  .find((m: any) => m.name === n)
                  ?.values?.map((v: any) => v.value) || [];
              const avg = (a: number[]) =>
                a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

              const avgEng = avg(getMetric("page_post_engagements"));
              const avgReach = avg(getMetric("page_posts_impressions_unique"));
              const avgImpressions = avg(getMetric("page_impressions"));
              const engagementRate = avgEng / (avgReach || 1);

              // 🧠 Dynamic frequency rules
              let frequency = "1 publicación por semana";
              if (engagementRate > 0.05)
                frequency = "3 publicaciones por semana";
              if (engagementRate > 0.08)
                frequency = "5 publicaciones por semana";

              let days = ["wed"];
              if (frequency.includes("3")) days = ["mon", "wed", "fri"];
              if (frequency.includes("5"))
                days = ["mon", "tue", "wed", "thu", "fri"];

              // ⏰ Dynamic hours (randomized around realistic social windows)
              const baseHours = [10, 11, 12, 13, 14, 15];
              const bestHour =
                baseHours[
                  Math.floor((engagementRate * 100) % baseHours.length)
                ];
              const hours = [
                `${String(bestHour).padStart(2, "0")}:00`,
                `${String(bestHour + 2).padStart(2, "0")}:00`,
              ];

              recommendations.push({
                platform: "facebook",
                frequency_days: frequency,
                days_week: days,
                best_hours: hours,
                insights_data: {
                  avg_engagement_rate: engagementRate,
                  avg_reach: avgReach,
                  avg_views: avgImpressions,
                },
              });
            }

            // 🔹 INSTAGRAM
            else if (integration.provider === "instagram") {
              const mediaUrl = `https://graph.facebook.com/v24.0/${integration.accountId}/media?fields=id,timestamp,caption,insights.metric(impressions,reach,likes,comments,saved,total_interactions)&limit=25&access_token=${integration.accessToken}`;
              const resIG = await fetch(mediaUrl);
              const dataIG = await resIG.json();

              const posts = dataIG.data || [];

              const parsed = posts.map((p: any) => {
                const d = p.insights?.data || [];
                const get = (n: string) =>
                  d.find((m: any) => m.name === n)?.values?.[0]?.value || 0;
                const reach = get("reach");
                const total = get("total_interactions");
                const engagementRate = total / (reach || 1);
                const hour = new Date(p.timestamp).getUTCHours();
                return {
                  reach,
                  total,
                  engagementRate,
                  hour,
                  timestamp: p.timestamp,
                };
              });

              if (parsed.length === 0)
                throw new Error("No valid Instagram posts found for insights");

              const avg = (a: number[]) =>
                a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
              const avgReach = avg(parsed.map((p) => p.reach));
              const avgInteractions = avg(parsed.map((p) => p.total));
              const avgER = avg(parsed.map((p) => p.engagementRate));

              // 📅 Identify top 3 days by engagement
              const byDay = parsed.reduce((acc: any, p) => {
                const day = new Date(p.timestamp).getDay(); // 0=Sun
                acc[day] = acc[day] || { er: [] };
                acc[day].er.push(p.engagementRate);
                return acc;
              }, {});
              const avgByDay = Object.entries(byDay).map(([day, val]: any) => ({
                day,
                avg: avg(val.er),
              }));
              const topDays = avgByDay
                .sort((a, b) => b.avg - a.avg)
                .slice(0, 3)
                .map(
                  (d) =>
                    ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][+d.day],
                );

              // ⏰ Dynamic hours based on high-engagement posts
              const topPosts = parsed
                .sort((a, b) => b.engagementRate - a.engagementRate)
                .slice(0, Math.max(3, parsed.length * 0.2));
              const avgHour =
                Math.round(avg(topPosts.map((p) => p.hour))) || 12;
              const hours = [
                `${String(avgHour - 1 < 0 ? 0 : avgHour - 1).padStart(2, "0")}:00`,
                `${String(avgHour + 1 > 23 ? 23 : avgHour + 1).padStart(2, "0")}:00`,
              ];

              // 📊 Determine posting frequency
              let frequency = "1 publicación por semana";
              if (avgER > 0.04) frequency = "3 publicaciones por semana";
              if (avgER > 0.08) frequency = "5 publicaciones por semana";

              recommendations.push({
                platform: "instagram",
                frequency_days: frequency,
                days_week: topDays.length ? topDays : ["wed"],
                best_hours: hours,
                insights_data: {
                  avg_engagement_rate: avgER,
                  avg_reach: avgReach,
                  avg_interactions: avgInteractions,
                },
              });
            }
          } catch (integrationError) {
            console.error(
              `[AI Suggestions] Error processing ${integration.provider}:`,
              integrationError,
            );
          }
        }

        if (!recommendations.length) {
          return res.status(500).json({
            message: "Failed to generate recommendations from any platform",
          });
        }

        const result = [
          {
            user_id: userId,
            recommendations,
          },
        ];

        console.log(
          "[AI Suggestions] ✅ Generated recommendations:",
          JSON.stringify(result, null, 2),
        );

        res.json(result);
      } catch (error) {
        console.error("❌ Error fetching AI suggestions:", error);
        res.status(500).json({
          message: "Failed to fetch AI suggestions",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Conversation History routes
  app.post(
    "/api/conversation-history",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandId;
        const { role, contentType, content, metadata } = req.body;

        // Explicit validation for brandId
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        // Validate required fields
        if (!role || !contentType || !content) {
          return res.status(400).json({
            message: "role, contentType, and content are required",
          });
        }

        // Save conversation history
        const historyEntry = await storage.saveConversationHistory({
          brandId,
          userId,
          role,
          contentType,
          content,
          metadata,
        });

        res.json({
          success: true,
          message: "Conversation history saved successfully",
          data: historyEntry,
        });
      } catch (error) {
        console.error("Error saving conversation history:", error);
        res
          .status(500)
          .json({ message: "Failed to save conversation history" });
      }
    },
  );

  app.get(
    "/api/conversation-history",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : 100;

        // Explicit validation for brandId
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        const history = await storage.getConversationHistoryByBrand(
          brandId,
          limit,
        );
        res.json(history);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch conversation history" });
      }
    },
  );

  app.delete(
    "/api/conversation-history/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandId;

        // Explicit validation for brandId
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        if (!id) {
          return res
            .status(400)
            .json({ message: "Conversation history ID is required" });
        }

        // Delete with brand validation to prevent cross-tenant deletion
        await storage.deleteConversationHistory(id, brandId);
        res.json({
          success: true,
          message: "Conversation history deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting conversation history:", error);
        res
          .status(500)
          .json({ message: "Failed to delete conversation history" });
      }
    },
  );

  // Post Generator - Send brand data to n8n webhook
  app.post(
    "/api/post-generator/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        // requireBrand middleware already validated access - use params.brandId
        const brandId = req.params.brandId;
        
        // req.brandId is also set by requireBrand middleware as backup
        const validatedBrandId = req.brandId || brandId;

        if (!validatedBrandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        // Fetch all necessary data from database
        // Brand access is already validated by requireBrand middleware
        const brand = await storage.getBrandByIdOnly(validatedBrandId);
        if (!brand) {
          return res.status(404).json({ message: "Brand not found" });
        }

        const brandDesign = await storage.getBrandDesignByBrandId(validatedBrandId);
        const brandAssets = await storage.getAssetsByBrandId(validatedBrandId);
        const contentPlans = await storage.getContentPlansByBrandId(validatedBrandId);
        const postingFrequencies =
          await storage.getSocialPostingFrequenciesByBrand(validatedBrandId);

        // Build insights array from contentPlans and posting frequencies
        const insights: any[] = [];

        // Add insights from content plans
        contentPlans.forEach((plan) => {
          if (plan.insights) {
            insights.push({
              source: "content_plan",
              title: plan.title,
              month: plan.month,
              year: plan.year,
              data: plan.insights,
            });
          }
        });

        // Add insights from posting frequencies
        postingFrequencies.forEach((freq) => {
          if (freq.insightsData) {
            insights.push({
              source: "posting_frequency",
              platform: freq.platform,
              frequency_days: freq.frequencyDays,
              days_week: freq.daysWeek,
              confidence_score: freq.confidenceScore,
              data: freq.insightsData,
            });
          }
        });

        // Build brand_assets array
        const brand_assets = brandAssets.map((asset) => ({
          id: asset.id,
          url: asset.url,
          name: asset.name,
          category: asset.category,
          asset_type: asset.assetType,
        }));

        // Build brand_design array (single object in array)
        const brand_design = brandDesign
          ? [
              {
                brand_style: brandDesign.brandStyle,
                color_primary: brandDesign.colorPrimary,
                color_accent1: brandDesign.colorAccent1,
                color_accent2: brandDesign.colorAccent2,
                color_accent3: brandDesign.colorAccent3,
                color_accent4: brandDesign.colorAccent4,
                color_text1: brandDesign.colorText1,
                color_text2: brandDesign.colorText2,
                color_text3: brandDesign.colorText3,
                color_text4: brandDesign.colorText4,
                font_primary: brandDesign.fontPrimary,
                font_secondary: brandDesign.fontSecondary,
                logo_url: brandDesign.logoUrl,
                logo_primary_url: brandDesign.logoPrimaryUrl,
                logo_secondary_url: brandDesign.logoSecondaryUrl,
                logo_icon_url: brandDesign.logoIconUrl,
              },
            ]
          : [];

        // Build the exact JSON structure required by n8n webhook
        const webhookPayload = {
          nombre_brand: brand.name,
          brand_description: brand.description || "",
          Insights: insights,
          Brand_assets: brand_assets,
          Brand_design: brand_design,
        };

        // Get webhook URL from environment variable
        const webhookUrl = process.env.N8N_POST_GENERATOR_WEBHOOK_URL;
        if (!webhookUrl) {
          return res.status(500).json({
            message:
              "Webhook URL not configured. Please set N8N_POST_GENERATOR_WEBHOOK_URL environment variable.",
          });
        }

        console.log(
          `[Post Generator] Sending data to n8n webhook for brand: ${brand.name}`,
        );
        console.log(
          `[Post Generator] Payload:`,
          JSON.stringify(webhookPayload, null, 2),
        );

        // Send POST request to n8n webhook
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error(`[Post Generator] Webhook error:`, errorText);
          return res.status(webhookResponse.status).json({
            message: "Failed to send data to n8n webhook",
            error: errorText,
          });
        }

        const webhookResult = await webhookResponse.json();
        console.log(
          `[Post Generator] Webhook response:`,
          JSON.stringify(webhookResult, null, 2),
        );

        // Return success response with webhook result
        res.json({
          success: true,
          message: "Data sent to n8n webhook successfully",
          webhook_response: webhookResult,
          payload: webhookPayload,
        });
      } catch (error) {
        console.error("[Post Generator] Error:", error);
        res.status(500).json({
          message: "Failed to process post generator request",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Campaigns routes
  app.get(
    "/api/campaigns",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const campaigns = await storage.getCampaignsByBrandId(brandId);
        res.json(campaigns);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
        res.status(500).json({ message: "Failed to fetch campaigns" });
      }
    },
  );

  app.get("/api/campaigns-mock", async (req: any, res) => {
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

  app.post(
    "/api/campaigns",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;

        // Validate client-provided data (without userId/brandId)
        const validatedData = insertCampaignSchema.parse(req.body);

        // Enrich with server-side context
        const campaignData = {
          ...validatedData,
          brandId,
          userId,
        };

        const campaign = await storage.createCampaign(campaignData);

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
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
    },
  );

  app.post(
    "/api/campaigns/generate",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const { prompt, platforms, businessContext } = req.body;

        const generatedContent = await generateCampaignContent(
          prompt,
          platforms,
          businessContext,
        );

        const campaign = await storage.createCampaign({
          userId,
          brandId,
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
          brandId,
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
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const campaignId = req.params.id;

        // Get campaign details (brand-scoped)
        const campaigns = await storage.getCampaignsByBrandId(brandId);
        const campaign = campaigns.find((c) => c.id === campaignId);

        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        // Get brand's social accounts
        const socialAccounts =
          await storage.getSocialAccountsByBrandId(brandId);
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
        await storage.updateCampaignStatus(campaignId, brandId, "published");

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
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

  app.get(
    "/api/integrations/facebook/connect",
    isAuthenticated,
    requireBrand,
    (req: any, res) => {
      const redirectUri = `${process.env.APP_URL}/api/integrations/facebook/callback`;
      const clientId = process.env.FB_APP_ID;

      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_metadata",
        "pages_manage_posts",
        "pages_messaging",
        "instagram_basic",
        "instagram_manage_messages",
        "read_insights",
        "instagram_manage_insights",
        "pages_read_user_content",
      ].join(",");

      console.log("🔐 Facebook OAuth scopes:", scopes);

      // -------------------------------------
      // 🔥 CORRECTO: stringify SOLO UNA VEZ
      // -------------------------------------
      const statePayload = {
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
      };

      const state = Buffer.from(JSON.stringify(statePayload)).toString(
        "base64",
      );

      const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${scopes}&state=${state}`;

      res.redirect(authUrl);
    },
  );

  app.get("/api/integrations/facebook/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");
      if (!state) return res.status(400).send("Missing OAuth state");

      // ------------------------------------------------------------
      // 1️⃣ Decodificar el state correctamente (Base64)
      // ------------------------------------------------------------
      let userId: null;
      let brandId: null;

      try {
        const decoded = Buffer.from(state as string, "base64").toString("utf8");
        const parsed = JSON.parse(decoded); // ahora parsed es { userId, brandId }

        userId = parsed.userId;
        brandId = parsed.brandId;

        console.log("🟢 [STATE OK]", parsed);
      } catch (err) {
        console.error("❌ Error decoding state:", err);
        return res.status(400).send("Invalid OAuth state");
      }

      // ------------------------------------------------------------
      // 2️⃣ Validar userId / brandId (NO usar req.user aquí)
      // ------------------------------------------------------------
      if (!userId) return res.status(400).send("Missing userId in OAuth state");
      if (!brandId)
        return res.status(400).send("Missing brandId in OAuth state");

      const redirect_uri = `${process.env.APP_URL}/api/integrations/facebook/callback`;

      console.log("🔐 [OAuth] Starting Facebook callback...");
      console.log("📦 Received code:", String(code).slice(0, 8) + "...");

      // ------------------------------------------------------------
      // 3️⃣ Intercambiar CODE por USER TOKEN
      // ------------------------------------------------------------
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${
          process.env.FB_APP_ID
        }&redirect_uri=${encodeURIComponent(
          redirect_uri,
        )}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`,
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("❌ Facebook token error:", tokenData.error);
        return res.status(500).json(tokenData.error);
      }

      console.log("🧩 [Step 1] User token obtained:", {
        token_start: tokenData.access_token?.slice(0, 15),
        expires_in: tokenData.expires_in,
      });

      // ------------------------------------------------------------
      // 4️⃣ Validar permisos otorgados (opcional)
      // ------------------------------------------------------------
      const debugUrl = `https://graph.facebook.com/debug_token?input_token=${tokenData.access_token}&access_token=${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
      const debugResponse = await fetch(debugUrl);
      const debugData = await debugResponse.json();

      const grantedScopes = debugData.data?.scopes || [];
      console.log("🔍 [DEBUG] Scopes:", grantedScopes);

      if (!grantedScopes.includes("instagram_manage_messages")) {
        return res
          .status(403)
          .send(
            "El usuario no otorgó 'instagram_manage_messages'. Agrega al usuario como tester.",
          );
      }

      // ------------------------------------------------------------
      // 5️⃣ Obtener las Pages que administra el usuario
      // ------------------------------------------------------------
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${tokenData.access_token}`,
      );
      const pagesData = await pagesResponse.json();

      console.log(
        "🧩 [Step 2] /me/accounts:",
        JSON.stringify(pagesData, null, 2),
      );

      if (!pagesData.data?.length) {
        return res.status(400).send("No Facebook Pages found");
      }

      const page = pagesData.data[0];
      let pageAccessToken = page.access_token;

      const expiresAt = tokenData.expires_in
        ? dayjs().add(tokenData.expires_in, "seconds").toDate()
        : null;

      console.log("✅ [PAGE FOUND]", {
        page_id: page.id,
        page_name: page.name,
      });

      // ------------------------------------------------------------
      // 6️⃣ Refrescar token (recomendado)
      // ------------------------------------------------------------
      try {
        const tokenExchangeUrl = `https://graph.facebook.com/v24.0/${page.id}?fields=access_token&access_token=${pageAccessToken}`;
        const tokenRes = await fetch(tokenExchangeUrl);
        const tokenJson = await tokenRes.json();

        if (tokenJson.access_token) {
          pageAccessToken = tokenJson.access_token;
        }
      } catch (err) {
        console.warn("⚠️ Token refresh failed:", err);
      }

      // ------------------------------------------------------------
      // 7️⃣ Guardar integración de Facebook
      // ------------------------------------------------------------
      await storage.createOrUpdateIntegration({
        userId,
        brandId,
        provider: "facebook",
        category: "social_media",
        storeName: "Facebook",
        storeUrl: `https://facebook.com/${page.id}`,
        pageId: page.id,
        accessToken: pageAccessToken,
        accountName: page.name,
        accountId: page.id,
        settings: {
          fbUserId: page.id,
          fbUserName: page.name,
        },
        expiresAt,
        isActive: true,
        syncEnabled: true,
        metadata: {
          fbPageName: page.name,
          fbCategory: page.category,
          fbPermissions: page.tasks || [],
          source: "facebook_callback",
        },
      });

      console.log(`✅ [FACEBOOK CONNECTED] ${page.name}`);

      // ------------------------------------------------------------
      // 8️⃣ (Opcional) Auto-detectar Instagram + Threads
      // ------------------------------------------------------------
      let connectedType = "facebook";

      try {
        console.log("🔍 Checking IG connection…");

        const igRes = await fetch(
          `https://graph.facebook.com/v24.0/${page.id}?fields=connected_instagram_account,instagram_business_account&access_token=${pageAccessToken}`,
        );
        const igData = await igRes.json();

        const igAccount =
          igData.connected_instagram_account ||
          igData.instagram_business_account;

        if (igAccount?.id) {
          console.log("🟢 IG account found:", igAccount);

          const igDetailsRes = await fetch(
            `https://graph.facebook.com/v24.0/${igAccount.id}?fields=username,name,profile_picture_url&access_token=${pageAccessToken}`,
          );
          const igDetails = await igDetailsRes.json();

          // Guardar integración de Instagram
          await storage.createOrUpdateIntegration({
            userId,
            brandId,
            provider: "instagram",
            category: "social_media",
            storeName: "Instagram",
            storeUrl: `https://instagram.com/${igDetails.username}`,
            accountId: igAccount.id,
            accessToken: pageAccessToken,
            accountName: igDetails.username,
            pageId: page.id,
            metadata: {
              fbPageId: page.id,
              igAccountId: igAccount.id,
              igUsername: igDetails.username,
            },
            isActive: true,
            syncEnabled: true,
          });

          connectedType = "facebook,instagram";

          // Guardar integración de Threads
          await storage.createOrUpdateIntegration({
            userId,
            brandId,
            provider: "threads",
            category: "social_media",
            storeName: "Threads",
            storeUrl: `https://threads.net/@${igDetails.username}`,
            accountName: igDetails.username,
            accountId: igAccount.id,
            accessToken: pageAccessToken,
            pageId: page.id,
            metadata: {
              fbPageId: page.id,
              igAccountId: igAccount.id,
            },
            isActive: true,
            syncEnabled: true,
          });

          connectedType = "facebook,instagram,threads";
        }
      } catch (err) {
        console.warn("⚠️ IG auto-connect failed:", err);
      }

      // ------------------------------------------------------------
      // 9️⃣ Redirigir al usuario
      // ------------------------------------------------------------
      return res.redirect(`/settings?connected=${connectedType}`);
    } catch (err) {
      console.error("❌ Facebook callback error:", err);
      return res.status(500).send("Error in Facebook callback");
    }
  });

  app.get(
    "/api/integrations/whatsapp/connect",
    isAuthenticated,
    requireBrand,
    (req: any, res) => {
      // ⚠️ NOTA: El 'redirect_uri' debe coincidir con el configurado en su App de Facebook.
      const redirectUri = `${process.env.APP_URL}/api/integrations/whatsapp/callback`;
      const clientId = process.env.FB_APP_ID;

      // **Los scopes necesarios para gestionar WhatsApp Business (WABA)**
      const whatsapp_scopes = [
        "whatsapp_business_management",
        "whatsapp_business_messaging",
        "business_management",
        "pages_show_list",
      ].join(",");

      // Pass brandId in state along with userId
      const state = JSON.stringify({
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
      });

      // URL base del Embedded Signup
      const embeddedSignupUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${whatsapp_scopes}&state=${encodeURIComponent(state)}&response_type=code&config_id=1846416285966221&auth_type=rerequest`;

      // ^^^ El 'config_id' es CRUCIAL.

      console.log("🟢 WhatsApp Embedded Signup URL:", embeddedSignupUrl);
      res.redirect(embeddedSignupUrl);
    },
  );

  app.get("/api/integrations/whatsapp/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");

      // 0️⃣ State: recuperar userId y brandId
      let userId: string | undefined;
      let brandId: string | undefined;

      try {
        const parsedState = JSON.parse(decodeURIComponent(state as string));
        userId = parsedState.userId;
        brandId = parsedState.brandId;
      } catch {
        // Fallback legacy: state era solo userId
        userId = (state as string) || (req as any).user?.id;
      }

      if (!userId) return res.status(401).send("User not authenticated");
      if (!brandId) return res.status(400).send("Missing brand context");

      const redirect_uri = `${process.env.APP_URL}/api/integrations/whatsapp/callback`;

      // 1️⃣ Intercambiar el code por el access_token (token de Embedded Signup)
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${
          process.env.FB_APP_ID
        }&redirect_uri=${encodeURIComponent(
          redirect_uri,
        )}&client_secret=${process.env.FB_APP_SECRET}&code=${code}`,
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error("❌ Error exchanging code:", tokenData.error);
        throw new Error(tokenData.error.message || "Error exchanging code");
      }

      const userAccessToken = tokenData.access_token as string;
      console.log("✅ Token exchange OK");

      // 2️⃣ Usar debug_token para sacar WABA ID (Embedded Signup way)
      const debugRes = await fetch(
        `https://graph.facebook.com/v24.0/debug_token?input_token=${userAccessToken}&access_token=${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`,
      );
      const debugData = await debugRes.json();
      console.log("🔍 Debug token:", JSON.stringify(debugData, null, 2));

      if (debugData.error) {
        console.error("❌ debug_token error:", debugData.error);
        throw new Error(debugData.error.message || "Error in debug_token");
      }

      const granularScopes = debugData.data?.granular_scopes ?? [];

      let wabaId: string | null = null;
      let businessId: string | null = null;

      for (const scopeInfo of granularScopes) {
        const scope = scopeInfo.scope;
        const targets = Array.isArray(scopeInfo.target_ids)
          ? scopeInfo.target_ids
          : [];

        // Según la doc de Embedded Signup, los scopes de WhatsApp traen como target_ids
        // los IDs relevantes (WABA y/o Business). :contentReference[oaicite:1]{index=1}
        if (
          !wabaId &&
          (scope === "whatsapp_business_management" ||
            scope === "whatsapp_business_messaging") &&
          targets.length > 0
        ) {
          wabaId = targets[0]; // primer WABA compartido
        }

        if (
          !businessId &&
          scope === "business_management" &&
          targets.length > 0
        ) {
          businessId = targets[0]; // Business Manager ID asociado
        }
      }

      console.log("📌 Parsed from granular_scopes →", { wabaId, businessId });

      // 3️⃣ Fallback opcional (por si algún día cambian granular_scopes)
      //    Dejé tu intento por /me y /me/businesses como backup, pero ya no es el camino principal.
      if (!wabaId) {
        console.warn(
          "⚠️ WABA ID not found in granular_scopes. Trying legacy fallbacks (/me, /me/businesses)...",
        );

        try {
          const directRes = await fetch(
            `https://graph.facebook.com/v24.0/me?fields=whatsapp_business_account&access_token=${userAccessToken}`,
          );
          const directData = await directRes.json();
          console.log("Legacy /me WABA data:", directData);

          wabaId = directData.whatsapp_business_account?.id || null;
        } catch (e) {
          console.warn("Legacy /me WABA check failed:", e);
        }

        if (!wabaId) {
          try {
            const businessAccountsRes = await fetch(
              `https://graph.facebook.com/v24.0/me/businesses?fields=id,name&access_token=${userAccessToken}`,
            );
            const businessAccountsData = await businessAccountsRes.json();
            console.log("Legacy /me/businesses:", businessAccountsData);

            const businessAccount = businessAccountsData.data?.[0];

            if (businessAccount?.id) {
              const wabaRes = await fetch(
                `https://graph.facebook.com/v24.0/${businessAccount.id}/owned_whatsapp_business_accounts?access_token=${userAccessToken}`,
              );
              const wabaData = await wabaRes.json();
              console.log("Legacy owned_whatsapp_business_accounts:", wabaData);

              wabaId = wabaData.data?.[0]?.id || null;
            }
          } catch (e) {
            console.error("Legacy /me/businesses fallback failed:", e);
          }
        }
      }

      if (!wabaId) {
        console.error(
          "❌ FINAL ERROR: WABA ID could not be found via granular_scopes or fallbacks.",
        );
        return res
          .status(400)
          .send("WhatsApp Business Account not linked or created.");
      }

      console.log(`🟢 Final WABA ID: ${wabaId}`);
      if (businessId) {
        console.log(`🟢 Business ID (from debug_token): ${businessId}`);
      }

      // 4️⃣ Obtener el número de teléfono asociado al WABA
      const phoneNumbersRes = await fetch(
        `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers?access_token=${userAccessToken}`,
      );
      const phoneData = await phoneNumbersRes.json();
      console.log("📞 Phone numbers data:", phoneData);

      const phoneNumber = phoneData.data?.[0] || null;

      // 5️⃣ Guardar la integración en tu storage
      await storage.createOrUpdateIntegration({
        userId,
        brandId,
        provider: "whatsapp",
        category: "messaging",
        storeName: "WhatsApp Business",
        storeUrl: phoneNumber
          ? `https://wa.me/${phoneNumber.display_phone_number.replace(/\D/g, "")}`
          : null,
        accountId: wabaId,
        accessToken: userAccessToken,
        accountName: phoneNumber?.display_phone_number || `WABA ${wabaId}`,
        metadata: {
          wabaId,
          businessId,
          phoneNumberId: phoneNumber?.id,
          phoneNumber: phoneNumber?.display_phone_number,
        },
        isActive: true,
        syncEnabled: true,
      });

      console.log(`✅ WhatsApp connected for brand ${brandId}: ${wabaId}`);
      res.redirect(`/settings?connected=whatsapp`);
    } catch (err: any) {
      console.error("❌ WhatsApp callback error:", err.message || err);
      res
        .status(500)
        .send(`Error in WhatsApp callback: ${err.message || "Unknown error"}`);
    }
  });

  app.get("/api/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const brandId = req.query.brandId;
      const brandIntegrations = await storage.getIntegrationsByBrandId(brandId);
      res.status(200).json(brandIntegrations);
    } catch (error) {
      console.error("❌ Error fetching integrations:", error);
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.get("/api/webhooks/meta", async (req, res) => {
    try {
      const VERIFY_TOKEN =
        process.env.META_VERIFY_TOKEN || "leadboost_meta_webhook";
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verificado correctamente con Meta");
        return res.status(200).send(challenge);
      } else {
        console.warn("❌ Webhook verification failed");
        return res.sendStatus(403);
      }
    } catch (err) {
      console.error("❌ Error en verificación de webhook Meta:", err);
      res.status(500).json({ error: "Meta webhook verification failed" });
    }
  });

  app.post("/api/webhooks/meta", async (req, res) => {
    try {
      console.log("=================================================");
      console.log("✅ REQUEST RECEIVED: POST /api/webhooks/meta");

      const body = req.body;
      console.log("🔴 PAYLOAD RAW (BODY):");
      console.dir(body, { depth: null });
      console.log("=================================================");

      if (
        body.object === "page" ||
        body.object === "instagram" ||
        body.object === "whatsapp_business_account"
      ) {
        console.log("📩 Nuevo evento recibido desde Meta");

        for (const entry of body.entry || []) {
          const events = entry.messaging || entry.changes || [];

          // ======================================================
          // 🔹 WHATSAPP
          // ======================================================
          if (body.object === "whatsapp_business_account") {
            for (const change of entry.changes || []) {
              if (change.field === "messages" && change.value.messages) {
                const metadata = change.value.metadata;
                const phoneNumberId = metadata?.phone_number_id;
                const displayPhoneNumber = metadata?.display_phone_number;
                const contacts = change.value.contacts || [];
                const contactName = contacts[0]?.profile?.name || null;

                let integration = null;
                if (phoneNumberId) {
                  const allIntegrations = await storage.getAllIntegrations();
                  integration = allIntegrations.find((int) => {
                    let meta = int.metadata;
                    if (typeof meta === "string") {
                      try {
                        meta = JSON.parse(
                          meta.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'),
                        );
                      } catch {
                        meta = null;
                      }
                    }
                    return (
                      meta?.phoneNumberId === phoneNumberId ||
                      int.accountId === phoneNumberId
                    );
                  });
                }

                for (const waMessage of change.value.messages) {
                  const messageId = waMessage.id;
                  const senderId = waMessage.from;
                  const timestamp = waMessage.timestamp;
                  const messageType = waMessage.type;
                  const textContent =
                    messageType === "text" && waMessage.text?.body
                      ? waMessage.text.body
                      : null;

                  if (integration) {
                    const metaConversationId = `${phoneNumberId}_${senderId}`;

                    // Get or create conversation
                    const conversation = await storage.getOrCreateConversation({
                      integrationId: integration.id,
                      brandId: integration.brandId,
                      userId: integration.userId,
                      metaConversationId,
                      platform: "whatsapp",
                      contactName,
                      lastMessage: textContent || "",
                      lastMessageAt: new Date(parseInt(timestamp) * 1000),
                    });

                    const messageData = {
                      userId: integration.userId,
                      integrationId: integration.id,
                      conversationId: conversation.id,
                      platform: "whatsapp",
                      metaMessageId: messageId,
                      metaConversationId,
                      senderId,
                      recipientId: phoneNumberId || displayPhoneNumber || "",
                      contactName,
                      textContent,
                      direction: "inbound",
                      isRead: false,
                      timestamp: new Date(parseInt(timestamp) * 1000),
                      rawPayload: body,
                    };

                    const savedMessage =
                      await storage.createMessage(messageData);
                    console.log(
                      `✅ [WhatsApp] Message saved: ${savedMessage.id}`,
                    );

                    // Increment unread count for inbound messages
                    await storage.incrementUnreadCount(conversation.id);

                    const io = app.get("io");
                    io?.emit("new_message", {
                      provider: "whatsapp",
                      conversationId: metaConversationId,
                      metaConversationId,
                      message: savedMessage,
                    });
                  }
                }
              }
            }
          }

          // ======================================================
          // 🔹 INSTAGRAM & MESSENGER
          // ======================================================
          else {
            for (const event of events) {
              if (event.message && event.sender && event.recipient) {
                const senderId = event.sender.id;
                const recipientId = event.recipient.id;
                const messageId = event.message.mid;
                const messageText = event.message.text || "";
                const platform =
                  body.object === "instagram" ? "instagram" : "facebook";

                const integration = await storage.findIntegrationByAccount(
                  recipientId,
                  platform,
                );

                if (integration) {
                  const accessToken = integration.accessToken;
                  const pageId = integration.pageId || recipientId;
                  let metaConversationId = null;

                  try {
                    // ✅ Endpoint unificado para Messenger e Instagram
                    const convoRes = await fetch(
                      `https://graph.facebook.com/v24.0/${pageId}/conversations?platform=${platform === "facebook" ? "messenger" : "instagram"}&user_id=${senderId}&access_token=${accessToken}`,
                    );
                    const convoData = await convoRes.json();

                    if (convoData?.data?.[0]?.id) {
                      metaConversationId = convoData.data[0].id;
                      console.log(
                        `🔗 [${platform}] Found conversation_id: ${metaConversationId}`,
                      );
                    } else {
                      console.warn(
                        `⚠️ [${platform}] No conversation found, fallback.`,
                      );
                      metaConversationId = `${recipientId}_${senderId}`;
                    }
                  } catch (err) {
                    console.error(
                      `❌ [${platform}] Error fetching conversation_id:`,
                      err,
                    );
                    metaConversationId = `${recipientId}_${senderId}`;
                  }

                  // Get or create conversation
                  const conversation = await storage.getOrCreateConversation({
                    integrationId: integration.id,
                    brandId: integration.brandId,
                    userId: integration.userId,
                    metaConversationId: metaConversationId || "",
                    platform,
                    contactName: null,
                    lastMessage: messageText,
                    lastMessageAt: new Date(event.timestamp || Date.now()),
                  });

                  const messageData = {
                    userId: integration.userId,
                    brandId: integration.brandId,
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    platform,
                    metaMessageId: messageId,
                    metaConversationId,
                    senderId,
                    recipientId,
                    textContent: messageText,
                    direction: "inbound",
                    isRead: false,
                    timestamp: new Date(event.timestamp || Date.now()),
                    rawPayload: body,
                  };

                  const savedMessage = await storage.createMessage(messageData);
                  console.log(
                    `✅ [${platform}] Message saved: ${savedMessage.id}`,
                  );

                  // Increment unread count for inbound messages
                  await storage.incrementUnreadCount(conversation.id);

                  const io = app.get("io");
                  io?.emit("new_message", {
                    provider: platform,
                    conversationId: metaConversationId,
                    metaConversationId,
                    message: savedMessage,
                  });
                } else {
                  console.warn(
                    `⚠️ [${platform}] No integration found for recipient: ${recipientId}`,
                  );
                }
              }
            }
          }
        }

        res.status(200).send("EVENT_RECEIVED");
      } else {
        res.sendStatus(404);
      }
    } catch (err) {
      console.error("❌ Error procesando evento Meta:", err);
      res.status(500).json({ error: "Meta webhook processing failed" });
    }
  });

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

  app.get("/api/:provider/conversations", isAuthenticated, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = req.user.id;
      const integrations = await storage.getIntegrations(userId);
      const integration = integrations.find((i) => i.provider === provider);

      if (!integration) {
        return res
          .status(404)
          .json({ error: `No ${provider} integration found` });
      }

      let url = "";

      if (provider === "facebook") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=senders,link,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "instagram") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=id,participants,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "threads") {
        url = `https://graph.facebook.com/v24.0/${integration.accountId}/conversations?fields=id,participants,snippet,updated_time&access_token=${integration.accessToken}`;
      } else if (provider === "whatsapp") {
        // WhatsApp doesn't have a conversations list - you need webhook for incoming messages
        // Here we return empty or fetch from your local database
        const messages = await storage.getMessages(userId);
        const whatsappMessages = messages.filter(
          (m: any) => m.socialAccount?.provider === "whatsapp",
        );
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

  app.get(
    "/api/messages/:provider/:conversationId",
    isAuthenticated,
    async (req, res) => {
      try {
        const { provider, conversationId } = req.params;
        const userId = req.user.id;

        const validProviders = ["facebook", "instagram", "threads", "whatsapp"];
        if (!validProviders.includes(provider)) {
          return res.status(400).json({ error: "Invalid provider" });
        }

        const integrations = await storage.getIntegrations(userId);
        const integration = integrations.find((i) => i.provider === provider);

        if (!integration) {
          return res.status(404).json({
            error: `No ${provider} integration found for user ${userId}`,
          });
        }

        const { id: integrationId, accessToken, accountId } = integration;
        let messages: NormalizedMessage[] = [];

        switch (provider) {
          case "facebook":
            messages = await fetchFacebookMessagesFromDB(
              integrationId,
              conversationId,
              accountId,
            );
            break;
          case "instagram":
            messages = await fetchInstagramMessagesFromDB(
              integrationId,
              conversationId,
              accountId,
            );
            break;
          case "threads":
            messages = await fetchThreadsMessagesFromDB(
              integrationId,
              conversationId,
              accountId,
            );
            break;
          case "whatsapp":
            messages = await fetchWhatsappMessagesFromDB(
              integrationId,
              conversationId,
              accountId,
            );
            break;
        }

        // Orden cronológico
        messages.sort(
          (a, b) =>
            new Date(a.created_time).getTime() -
            new Date(b.created_time).getTime(),
        );

        let metaConversationId = null;

        try {
          const dbMessages =
            await storage.getMessagesByIntegrationAndConversation(
              integrationId,
              conversationId,
            );

          // Obtener el meta_conversation_id del primer mensaje encontrado
          if (dbMessages.length > 0 && dbMessages[0].metaConversationId) {
            metaConversationId = dbMessages[0].metaConversationId;
          } else {
            console.log(
              `⚠️ No meta_conversation_id found in DB for this conversation`,
            );
          }
        } catch (error) {
          console.error(`❌ Error fetching meta_conversation_id:`, error);
        }

        res.json({
          provider,
          accountId,
          messages,
          total: messages.length,
          metaConversationId,
        });
      } catch (err) {
        console.error("❌ Unified messages fetch error:", err);
        res.status(500).json({
          error: "Failed to fetch messages",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  app.post(
    "/api/messages/:provider/:conversationId/mark-read",
    isAuthenticated,
    async (req, res) => {
      try {
        const { provider, conversationId } = req.params;
        const userId = req.user.id;

        const integrations = await storage.getIntegrations(userId);
        const integration = integrations.find((i) => i.provider === provider);

        if (!integration) {
          return res
            .status(404)
            .json({ error: `No ${provider} integration found` });
        }

        await storage.markConversationMessagesAsRead(
          integration.id,
          conversationId,
        );

        console.log(
          `✅ Marked messages as read for ${provider} conversation: ${conversationId}`,
        );
        res.json({ success: true });
      } catch (err) {
        console.error("❌ Error marking messages as read:", err);
        res.status(500).json({ error: "Failed to mark messages as read" });
      }
    },
  );

  // ✅ NEW: Get all conversations for authenticated user
  app.get(
    "/api/conversations",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const userId = req.user.id;
        const limitParam = req.query.limit;

        // Parse and validate limit parameter
        let limit: number | undefined;
        if (limitParam) {
          const parsed = parseInt(limitParam as string, 10);
          if (!isNaN(parsed) && parsed > 0) {
            limit = parsed;
          }
        }

        // Get brand's integrations to check if initial sync is needed
        const integrations = await storage.getIntegrationsByBrandId(brandId);

        // Perform initial sync for integrations that haven't fetched history yet
        for (const integration of integrations) {
          const provider = integration.provider;

          // Only sync for Meta platforms (Facebook, Instagram, Threads)
          if (
            (provider === "facebook" ||
              provider === "instagram" ||
              provider === "threads") &&
            !integration.hasFetchedHistory
          ) {
            console.log(
              `🔄 [Initial Sync] Starting initial sync for ${provider} (${integration.accountName})`,
            );

            try {
              await performInitialSync(userId, integration, provider);
              await storage.markIntegrationAsFetched(integration.id);
              console.log(
                `✅ [Initial Sync] Completed for ${provider} (${integration.accountName})`,
              );
            } catch (syncError) {
              console.error(
                `❌ [Initial Sync] Failed for ${provider}:`,
                syncError,
              );
              // Continue with other integrations even if one fails
            }
          }
        }

        const conversations = await storage.getConversationsByBrandId(
          brandId,
          limit,
        );

        console.log(
          `📋 Retrieved ${conversations.length} conversations for brand ${brandId}${limit ? ` (limit: ${limit})` : ""}`,
        );
        res.json({ conversations });
      } catch (err) {
        console.error("❌ Error fetching conversations:", err);
        res.status(500).json({ error: "Failed to fetch conversations" });
      }
    },
  );

  // ✅ NEW: Get a single conversation by ID
  app.get(
    "/api/conversations/:id",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandMembership.brandId;

        // Verify brand has access to this conversation
        const conversations = await storage.getConversationsByBrandId(brandId);
        const conversation = conversations.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        console.log(`📝 Retrieved conversation ${id} for brand ${brandId}`);
        res.json({ conversation });
      } catch (err) {
        console.error("❌ Error fetching conversation:", err);
        res.status(500).json({ error: "Failed to fetch conversation" });
      }
    },
  );

  // ✅ NEW: Get all messages for a specific conversation
  app.get(
    "/api/conversations/:id/messages",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandMembership.brandId;

        // Verify brand has access to this conversation
        const conversations = await storage.getConversationsByBrandId(brandId);
        const conversation = conversations.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        const messages = await storage.getConversationMessages(id);

        console.log(
          `📨 Retrieved ${messages.length} messages for conversation ${id}`,
        );
        res.json({ messages });
      } catch (err) {
        console.error("❌ Error fetching conversation messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
      }
    },
  );

  // ✅ NEW: Mark conversation as read
  app.patch(
    "/api/conversations/:id/read",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandMembership.brandId;

        // Verify brand has access to this conversation
        const conversations = await storage.getConversationsByBrandId(brandId);
        const conversation = conversations.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        // Reset unread count for the conversation
        await storage.resetUnreadCount(id);

        // Mark all messages in the conversation as read
        await storage.markConversationMessagesAsRead(
          conversation.integrationId,
          conversation.metaConversationId,
        );

        console.log(`✅ Marked conversation ${id} as read`);
        res.json({ success: true });
      } catch (err) {
        console.error("❌ Error marking conversation as read:", err);
        res.status(500).json({ error: "Failed to mark conversation as read" });
      }
    },
  );

  // ✅ NEW: Update conversation flag
  app.patch(
    "/api/conversations/:id/flag",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { flag } = req.body;
        const brandId = req.brandMembership.brandId;

        // Validate flag value
        const validFlags = ["none", "important", "archived"];
        if (!flag || !validFlags.includes(flag)) {
          return res.status(400).json({
            error: "Invalid flag value. Must be: none, important, or archived",
          });
        }

        // Verify brand has access to this conversation
        const conversations = await storage.getConversationsByBrandId(brandId);
        const conversation = conversations.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        // Update the flag
        const updated = await storage.updateConversationMetadata(id, { flag });

        console.log(`🏁 Updated conversation ${id} flag to: ${flag}`);
        res.json({ success: true, conversation: updated });
      } catch (err) {
        console.error("❌ Error updating conversation flag:", err);
        res.status(500).json({ error: "Failed to update conversation flag" });
      }
    },
  );

  // ✅ NEW: Unified aggregation endpoint - Get ALL messages from ALL connected providers
  app.get(
    "/api/conversations/messages/all",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.user.id;
        const integrations = await storage.getIntegrations(userId);
        if (!integrations || integrations.length === 0) {
          return res.json({ messages: [], providers: [], total: 0 });
        }

        const fetchTasks = integrations.map(async (integration) => {
          const provider = integration.provider;
          const accessToken = integration.accessToken;
          const accountId = integration.accountId;
          try {
            let messages: NormalizedMessage[] = [];

            switch (provider) {
              case "facebook":
              case "instagram":
              case "threads": {
                // ✅ Step 1: Perform initial sync if necessary
                if (!integration.hasFetchedHistory) {
                  console.log(
                    `🔄 [${provider.toUpperCase()}] Performing initial sync...`,
                  );
                  await performInitialSync(userId, integration, provider);
                  integration.hasFetchedHistory = true;
                  await storage.markIntegrationAsFetched(integration.id);
                }

                // ✅ Step 2: Always read messages from your local database
                console.log(
                  `💾 [${provider.toUpperCase()}] Fetching messages from local database`,
                );
                const dbMessages = await storage.getMessagesByIntegration(
                  integration.id,
                );

                const localMessages: NormalizedMessage[] = dbMessages.map(
                  (m) => ({
                    id: m.metaMessageId,
                    conversationId:
                      m.direction === "inbound" ? m.senderId : m.recipientId,
                    metaConversationId: m.metaConversationId,
                    text: m.textContent || "",
                    from:
                      m.direction === "outbound"
                        ? "You"
                        : m.contactName || "User",
                    fromId: m.senderId,
                    created_time: m.timestamp.toISOString(),
                    provider: provider,
                    accountId,
                    direction: m.direction,
                  }),
                );

                // 🚫 Skip Meta API calls (Facebook/Instagram)
                console.log(
                  `🧠 [${provider.toUpperCase()}] Skipping remote fetch — using only DB`,
                );
                messages = localMessages;

                break;
              }

              case "whatsapp": {
                const allWhatsAppMessages =
                  await storage.getMessagesByIntegration(integration.id);
                const conversationMap = new Map<string, any[]>();

                for (const msg of allWhatsAppMessages) {
                  const convoId =
                    msg.direction === "inbound"
                      ? msg.senderId
                      : msg.recipientId;

                  if (!conversationMap.has(convoId)) {
                    conversationMap.set(convoId, []);
                  }
                  conversationMap.get(convoId)!.push(msg);
                }

                const whatsappPromises = Array.from(conversationMap.keys()).map(
                  async (convoId) => {
                    return await fetchWhatsappMessagesFromDB(
                      integration.id,
                      convoId,
                      accountId,
                    );
                  },
                );
                const allConvoMessages = await Promise.all(whatsappPromises);
                messages = allConvoMessages.flat();
                break;
              }
            }

            return { provider, accountId, messages, success: true };
          } catch (err) {
            return { provider, messages: [], success: false, error: err };
          }
        });

        const results = await Promise.allSettled(fetchTasks);
        const allMessages: NormalizedMessage[] = [];
        const successfulProviders: string[] = [];

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.success) {
            const provider = result.value.provider;
            const accountId = result.value.accountId;

            // Adjunta el accountId a cada mensaje
            const providerMessages = result.value.messages.map((msg) => ({
              ...msg,
              accountId, // 👈 agregado aquí
            }));

            allMessages.push(...providerMessages);
            successfulProviders.push(provider);
          } else if (result.status === "rejected") {
            console.error("🚫 Task rejected:", result.reason);
          }
        });

        allMessages.sort(
          (a, b) =>
            new Date(b.created_time).getTime() -
            new Date(a.created_time).getTime(),
        );

        // Calculate unread counts per conversation for WhatsApp
        const unreadCounts: Record<string, number> = {};

        for (const integration of integrations) {
          if (integration.provider === "whatsapp") {
            // Get unique conversation IDs from WhatsApp messages
            const whatsappMessages = allMessages.filter(
              (m) => m.provider === "whatsapp",
            );
            const conversationIds = [
              ...new Set(whatsappMessages.map((m) => m.conversationId)),
            ];

            // Get unread count for each conversation
            for (const convoId of conversationIds) {
              const count = await storage.getUnreadCountByConversation(
                integration.id,
                convoId,
              );
              if (count > 0) {
                unreadCounts[`${integration.provider}-${convoId}`] = count;
              }
            }
          }
        }

        res.json({
          messages: allMessages,
          providers: successfulProviders,
          total: allMessages.length,
          unreadCounts, // Add unread counts to response
        });
      } catch (err) {
        console.error("❌ Unified aggregation error:", err);
        res.status(500).json({
          error: "Failed to fetch unified messages",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  // ============================================================
  // ✅ UNIVERSAL SEND MESSAGE ENDPOINT (Facebook / IG / Threads / WhatsApp)
  // ============================================================
  app.post(
    "/api/:provider/conversations/:conversationId/messages",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { provider, conversationId } = req.params;
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;
        const messageConversationId = req.body.conversationId;
        const { content } = req.body;

        console.log("\n=============================");
        console.log("📩 [BACKEND] Incoming message send request");
        console.log("🧠 Provider:", provider);
        console.log("💬 Conversation ID:", conversationId);
        console.log("👤 Authenticated user:", userId);
        console.log("🏢 Brand ID:", brandId);
        console.log("✉️ Message content:", content);
        console.log("=============================\n");

        if (!content?.trim()) {
          return res.status(400).json({ error: "Message content is required" });
        }

        const integrations = await storage.getIntegrationsByBrandId(brandId);
        const integration = integrations.find((i) => i.provider === provider);

        if (!integration) {
          console.warn(
            `⚠️ No ${provider} integration found for brand ${brandId}`,
          );
          return res
            .status(404)
            .json({ error: `No ${provider} integration found for brand` });
        }

        let url, payload, recipientId, metaConversationId;
        let apiResponse;

        // =========================================================
        // 🟦 FACEBOOK
        // =========================================================
        if (provider === "facebook") {
          console.log(`💬 [Facebook] Sending message to ${conversationId}`);

          // 1️⃣ Obtener Page ID desde el token
          const pageInfoRes = await fetch(
            `https://graph.facebook.com/v24.0/me?access_token=${integration.accessToken}`,
          );
          const pageInfo = await pageInfoRes.json();
          const pageId = pageInfo.id;

          if (!pageId)
            throw new Error("No se pudo obtener el Page ID desde el token.");

          console.log(`🆔 Page ID obtenido: ${pageId}`);

          // 2️⃣ Resolver meta_conversation_id
          metaConversationId = conversationId;
          if (!conversationId.startsWith("t_")) {
            console.log(
              "🔄 Conversation ID parece un userId, buscando meta_conversation_id...",
            );

            const localMsg = await storage.findMessageByUserAndRecipient(
              userId,
              integration.id,
              conversationId,
            );

            if (localMsg?.meta_conversation_id) {
              metaConversationId = localMsg.meta_conversation_id;
              console.log(
                `Mapeado a meta_conversation_id: ${metaConversationId}`,
              );
            } else {
              console.warn("⚠️ No se encontró meta_conversation_id asociado.");
            }
          }

          // 3️⃣ Intentar obtener destinatario desde Meta
          let messagesData = {};
          try {
            const res = await fetch(
              `https://graph.facebook.com/v24.0/${metaConversationId}/messages?fields=from,to,created_time&limit=1&access_token=${integration.accessToken}`,
            );
            messagesData = await res.json();
          } catch (e) {
            console.warn("⚠️ Error al intentar obtener mensajes:", e);
          }

          if (messagesData.data?.length) {
            const lastMessage = messagesData.data[0];
            if (
              lastMessage.from?.id === pageId &&
              lastMessage.to?.data?.[0]?.id
            ) {
              recipientId = lastMessage.to.data[0].id;
            } else {
              recipientId = lastMessage.from?.id;
            }
            console.log(`📍 Recipient ID (Meta API): ${recipientId}`);
          }

          // 4️⃣ Fallback local si no se pudo determinar destinatario
          if (!recipientId) {
            const localMessages = await storage.findMessagesByConversation(
              userId,
              integration.id,
              metaConversationId,
            );

            const inboundMsg = localMessages?.find(
              (m) => m.direction === "inbound" && m.sender_id !== pageId,
            );

            if (inboundMsg) {
              recipientId = inboundMsg.sender_id;
              console.log(`📍 Recipient ID (fallback DB): ${recipientId}`);
            } else {
              return res.status(400).json({
                error:
                  "No se pudo determinar el destinatario (sin mensajes en Meta ni en DB)",
              });
            }
          }

          // 5️⃣ Enviar mensaje a Meta API
          url = `https://graph.facebook.com/v24.0/${pageId}/messages`;
          payload = {
            messaging_type: "RESPONSE",
            recipient: { id: recipientId },
            message: { text: content },
          };

          console.log("✅ [Facebook] Payload final:", payload);
        }

        // =========================================================
        // 🟣 INSTAGRAM / THREADS
        // =========================================================
        else if (provider === "instagram" || provider === "threads") {
          console.log(
            `💬 [Instagram/Threads] Sending message to conversation ${conversationId}`,
          );

          const pageId = integration.pageId;
          if (!pageId)
            throw new Error(
              "No se encontró el Page ID vinculado a la cuenta IG.",
            );

          console.log(`🆔 Page ID vinculado: ${pageId}`);

          // El conversationId de IG ya es el meta_conversation_id
          metaConversationId = conversationId;

          // Obtener destinatario
          const convoRes = await fetch(
            `https://graph.facebook.com/v24.0/${conversationId}?fields=participants&access_token=${integration.accessToken}`,
          );
          const convoData = await convoRes.json();

          const participants = convoData.participants?.data || [];
          recipientId = participants.find(
            (p) => !p.id.startsWith("1784") && p.id !== pageId,
          )?.id;

          if (!recipientId)
            return res
              .status(400)
              .json({ error: "No se pudo determinar el destinatario de IG" });

          console.log(`📍 Recipient ID (IG): ${recipientId}`);

          // Construcción del payload
          url = `https://graph.facebook.com/v24.0/${pageId}/messages`;
          payload = {
            recipient: { id: recipientId },
            message: { text: content },
          };

          console.log("✅ [Instagram] Payload final:", payload);
        }

        // =========================================================
        // 🟩 WHATSAPP
        // =========================================================
        else if (provider === "whatsapp") {
          console.log(`💬 [WhatsApp] Sending message to ${conversationId}`);
          const parts = conversationId.split("_");
          let finalRecipientId = conversationId;

          if (parts.length === 2) {
            finalRecipientId = parts[1]; // Ahora finalRecipientId es "5217712409254"
            console.log(
              `📍 Recipient ID extraído del composite ID: ${finalRecipientId}`,
            );
          }

          if (finalRecipientId.startsWith("521")) {
            const originalFinalRecipientId = finalRecipientId;
            // La normalización asume que "521" debe ser "52" + resto (sin el 1)
            finalRecipientId = "52" + finalRecipientId.substring(3);
            console.log(
              `⚙️ Número normalizado: ${originalFinalRecipientId} → ${finalRecipientId}`,
            );
          }

          const phoneNumberId =
            integration.metadata?.phone_number_id || integration.accountId;
          if (!phoneNumberId)
            return res
              .status(400)
              .json({ error: "Missing WhatsApp Phone Number ID" });

          url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;
          payload = {
            messaging_product: "whatsapp",
            // ✅ FIX: Usar solo el número de teléfono extraído/normalizado
            to: finalRecipientId,
            type: "text",
            text: { body: content },
          };

          recipientId = finalRecipientId;
          metaConversationId = conversationId;
          console.log("✅ [WhatsApp] Payload final:", payload);
        }

        // =========================================================
        // 🚨 PROVEEDOR INVÁLIDO
        // =========================================================
        else {
          return res.status(400).json({ error: "Invalid provider" });
        }

        // =========================================================
        // 🚀 ENVÍO A META API
        // =========================================================
        console.log("🚀 Enviando mensaje a Meta API:");
        console.log("🔗 URL:", url);
        console.log("📦 Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(
          `${url}?access_token=${integration.accessToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        apiResponse = await response.json();
        console.log(
          "📥 Meta API Response:",
          JSON.stringify(apiResponse, null, 2),
        );

        if (apiResponse.error) {
          console.error(`${provider} send error:`, apiResponse.error);
          return res.status(400).json({ error: apiResponse.error.message });
        }

        // =========================================================
        // 💾 GUARDAR MENSAJE EN DB
        // =========================================================
        const messageId =
          provider === "whatsapp"
            ? apiResponse.messages?.[0]?.id
            : apiResponse.message_id || apiResponse.id;

        if (!recipientId)
          throw new Error("recipientId is missing before saving to DB");

        if (messageId) {
          await storage.createMessage({
            userId,
            brandId: integration.brandId,
            integrationId: integration.id,
            platform: provider,
            metaMessageId: messageId,
            metaConversationId, // ✅ Guardamos siempre
            senderId: integration.accountId,
            recipientId,
            textContent: content,
            direction: "outbound",
            isRead: true,
            timestamp: new Date(),
            rawPayload: apiResponse,
            conversationId: messageConversationId,
          });

          console.log(
            `💾 [${provider.toUpperCase()}] Message saved: ${messageId}`,
          );
          console.log(`🧩 meta_conversation_id: ${metaConversationId}`);
        }

        console.log(`✅ [${provider.toUpperCase()}] Message sent successfully`);
        res.json({
          success: true,
          provider,
          recipientId,
          metaConversationId,
          content,
          timestamp: new Date().toISOString(),
          apiResponse,
        });
      } catch (err) {
        console.error("❌ Send message error:", err);
        res.status(500).json({
          error: "Failed to send message",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

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
  app.get(
    "/api/analytics",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const analytics = await storage.getAnalyticsByBrandId(brandId);
        res.json(analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({ message: "Failed to fetch analytics" });
      }
    },
  );

  app.get("/api/analytics-mock", isAuthenticated, async (req: any, res) => {
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
  app.get(
    "/api/activity",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const limit = req.query.limit
          ? parseInt(req.query.limit as string)
          : 20;
        const activityLogs = await storage.getActivityLogsByBrandId(
          brandId,
          limit,
        );
        res.json(activityLogs);
      } catch (error) {
        console.error("Error fetching activity logs:", error);
        res.status(500).json({ message: "Failed to fetch activity logs" });
      }
    },
  );

  app.get("/api/activity-mock", async (req: any, res) => {
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
  app.get(
    "/api/customers",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        const customers = await storage.getCustomersByBrandId(brandId);
        res.json(customers);
      } catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ message: "Failed to fetch customers" });
      }
    },
  );

  app.get(
    "/api/customers/by-conversation/:conversationId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const conversationId = req.params.conversationId;
        const customer = await storage.getCustomerByConversationId(
          conversationId,
          brandId,
        );

        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }

        res.json(customer);
      } catch (error) {
        console.error("Error fetching customer by conversation:", error);
        res.status(500).json({ message: "Failed to fetch customer" });
      }
    },
  );

  app.post(
    "/api/customers",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const { name, phone, platform, conversationId } = req.body;

        if (!name) {
          return res.status(400).json({ message: "Customer name is required" });
        }

        // Check if customer already exists (by phone for WhatsApp, by name for others)
        let existingCustomer;
        if (phone && platform === "whatsapp") {
          existingCustomer = await storage.getCustomerByPhone(brandId, phone);
        } else if (phone) {
          existingCustomer = await storage.getCustomerByPhone(brandId, phone);
        } else {
          existingCustomer = await storage.getCustomerByName(brandId, name);
        }

        if (existingCustomer) {
          return res.status(409).json({
            message: "Customer already exists",
            customer: existingCustomer,
          });
        }

        // Validate client-provided data (without userId/brandId/totalInvoiced/status)
        const validatedData = insertCustomerSchema.parse({
          name,
          phone: phone || null,
          email: req.body.email || null,
          company: req.body.company || null,
          address: req.body.address || null,
          notes:
            req.body.notes ||
            (platform ? `Lead created from ${platform} conversation` : null),
          conversationId: conversationId || null,
        });

        // Enrich with server-side context (brandId, userId, totalInvoiced, status)
        const customerData = {
          ...validatedData,
          brandId,
          userId,
          totalInvoiced: 0, // Server-controlled: always start at 0
          status: platform ? "prospect" : "active", // Server-controlled: prospect for platform leads, active otherwise
        };

        const customer = await storage.createCustomer(customerData);

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
          action: "customer_created",
          description: `Created customer: ${customer.name}${phone ? ` (${phone})` : ""}`,
          entityType: "customer",
          entityId: customer.id,
        });

        res.json(customer);
      } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({ message: "Failed to create customer" });
      }
    },
  );

  app.put(
    "/api/customers/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const customerId = req.params.id;
        const updates = req.body;
        const customer = await storage.updateCustomer(
          customerId,
          brandId,
          updates,
        );

        if (!customer) {
          return res.status(404).json({ message: "Customer not found" });
        }

        await storage.createActivityLog({
          userId,
          brandId,
          action: "customer_updated",
          description: `Updated customer: ${customer.name}`,
          entityType: "customer",
          entityId: customer.id,
        });

        res.json(customer);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to update customer", error: error.message });
      }
    },
  );

  app.delete(
    "/api/customers/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const customerId = req.params.id;

        const success = await storage.deleteCustomer(customerId, brandId);
        if (!success) {
          return res.status(404).json({ message: "Customer not found" });
        }

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
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
    },
  );

  // Invoice management routes
  app.get(
    "/api/invoices",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const invoices = await storage.getInvoicesByBrandId(brandId);
        res.json(invoices);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Failed to fetch invoices" });
      }
    },
  );

  app.post(
    "/api/invoices",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;

        // Validate client-provided data (without userId/brandId)
        const validatedData = insertInvoiceSchema.parse(req.body);

        // Enrich with server-side context (brandId for tenancy, userId for audit)
        const invoiceData = {
          ...validatedData,
          brandId,
          userId,
        };

        const invoice = await storage.createInvoice(invoiceData);

        // Update customer total invoiced amount
        if (invoice.customerId) {
          await storage.updateCustomerTotalInvoiced(
            invoice.customerId,
            brandId,
            invoice.amount,
          );
        }

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
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
    },
  );

  app.put(
    "/api/invoices/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
        const brandId = req.brandMembership.brandId;
        const invoiceId = req.params.id;

        // Sanitize client input using partial schema (prevents userId/brandId spoofing)
        const updateInvoiceSchema = insertInvoiceSchema.partial();
        const validatedUpdates = updateInvoiceSchema.parse(req.body);

        // Handle file upload URL processing
        if (validatedUpdates.fileUrl) {
          const objectStorageService = new ObjectStorageService();
          validatedUpdates.fileUrl =
            await objectStorageService.trySetObjectEntityAclPolicy(
              validatedUpdates.fileUrl,
              {
                owner: userId,
                visibility: "private",
              },
            );
        }

        const invoice = await storage.updateInvoice(
          invoiceId,
          brandId,
          validatedUpdates,
        );
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        // Log activity
        await storage.createActivityLog({
          userId,
          brandId,
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
    },
  );

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

  // Message routes - Save messages from webhooks or manual creation
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Validate request body using Zod schema
      const messageData = insertMessageSchema.parse(req.body);

      // Create message in database
      const newMessage = await storage.createMessage(messageData);

      console.log(
        `✅ Message created: ${newMessage.id} from ${newMessage.platform}`,
      );

      res.status(201).json({
        success: true,
        message: newMessage,
      });
    } catch (error) {
      console.error("Error creating message:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message: "Failed to create message",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Brand Design routes
  app.get(
    "/api/brand-design",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);

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
    },
  );

  app.post(
    "/api/brand-design",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const designData = { ...req.body, brandId };
        console.log("REQ BODY DESIGN DATA:", JSON.stringify(req.body, null, 2));

        const existingDesign = await storage.getBrandDesignByBrandId(brandId);

        if (existingDesign) {
          const updated = await storage.updateBrandDesign(
            existingDesign.id,
            brandId,
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
    },
  );

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
    requireBrand,
    async (req: any, res) => {
      const brandId = req.brandId;
      const { type } = req.params; // whiteLogo | blackLogo | whiteFavicon | blackFavicon
      const { brandDesignId } = req.query;

      console.log("[Server] ➡️ DELETE /api/brand-design/logo/:type", {
        brandId,
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

        // Get brand design by brandId to validate ownership
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
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
              eq(brandDesigns.brandId, brandId),
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
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;

        // In a real implementation, this would handle Canva OAuth flow
        // For now, we'll simulate the connection by returning the existing design
        const existingDesign = await storage.getBrandDesignByBrandId(brandId);

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
  app.post(
    "/api/brand-assets",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const { brandDesignId, url, name, category, assetType, publicId } =
          req.body;
        console.log("📥 BODY recibido:", req.body);
        if (!brandDesignId || !url || !name) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        // Verify the brand design belongs to this brand
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
        if (!brandDesign || brandDesign.id !== brandDesignId) {
          return res.status(403).json({ error: "Unauthorized" });
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
    },
  );

  // GET /api/brand-assets?brandDesignId=<uuid>
  app.get(
    "/api/brand-assets",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        console.log("🛣ch�  GET /api/brand-assets");
        console.log("🧭  req.query:", req.query, "req.params:", req.params);
        const { brandDesignId } = req.query;
        if (!brandDesignId) {
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        // Verify the brand design belongs to this brand
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
        if (!brandDesign || brandDesign.id !== brandDesignId) {
          return res.status(403).json({ error: "Unauthorized" });
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
    },
  );

  // DELETE /api/brand-assets/:id
  app.delete(
    "/api/brand-assets/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const assetId = req.params.id;
        const { brandDesignId } = req.query;

        if (!brandDesignId) {
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        // Verify ownership: check if the brandDesign belongs to the current brand
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
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

  // Initialize Socket.IO for real-time messaging
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ Socket.IO client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Socket.IO client disconnected:", socket.id);
    });
  });

  // Make io accessible in routes via app.set
  app.set("io", io);

  return server;
}
