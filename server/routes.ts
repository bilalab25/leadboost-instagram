import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, getSession } from "./auth";
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
  type InsertMessage,
} from "@shared/schema";
import { z } from "zod";
import { posIntegrationService } from "./services/posIntegrations";
import { lightspeedService } from "./services/lightspeed";
import { boostyService } from "./services/boosty";
import { generateBrandEssence } from "./services/generateBrandEssence";
import { registerStripeRoutes } from "./stripe/stripeRoutes";
import { billingService } from "./stripe/billingService";
import {
  registerSyncFunctions,
  registerSocketIO,
  triggerSyncForNewIntegration,
} from "./services/inboxSyncService";
import { generateBrandAssetDescription } from "./services/generateBrandAssetDescription";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import cloudinary from "./cloudinary";
import { db } from "./db";
import {
  brandDesigns,
  brandAssets,
  posIntegrations,
  waitlist,
  insertWaitlistSchema,
  socialPostingFrequency,
  aiGeneratedPosts,
  hashtagSets,
  brandSettings,
  captionTemplates,
  approvalPipelines,
  customizationRequests,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { generateAILogo } from "./services/generateLogo";

// OAuth state signing helpers (CSRF protection)
const STATE_SECRET = process.env.SESSION_SECRET || process.env.FB_APP_SECRET || "leadboost-state-secret";

function signOAuthState(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(data).digest("hex");
  return `${data}.${sig}`;
}

function verifyOAuthState(state: string): object | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac("sha256", STATE_SECRET).update(data).digest("hex");
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

interface LogoJob {
  id: string;
  brandId: string;
  userId: string;
  status: "pending" | "processing" | "completed" | "failed";
  logoUri?: { base64?: string; mimeType?: string };
  error?: string;
  createdAt: Date;
}

const logoJobs = new Map<string, LogoJob>();
const LOGO_JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

// Periodically clean up stale logo jobs to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of logoJobs) {
    if (now - job.createdAt.getTime() > LOGO_JOB_TTL_MS) {
      logoJobs.delete(id);
    }
  }
}, 10 * 60 * 1000); // Run cleanup every 10 minutes

async function createLogoJob(
  brandId: string,
  userId: string,
): Promise<LogoJob> {
  const job: LogoJob = {
    id: nanoid(),
    brandId,
    userId,
    status: "pending",
    createdAt: new Date(),
  };
  logoJobs.set(job.id, job);
  return job;
}

async function updateLogoJobResult(
  jobId: string,
  update: {
    status: "completed" | "failed";
    logoUri?: { base64?: string; mimeType?: string };
    error?: string;
  },
): Promise<void> {
  const job = logoJobs.get(jobId);
  if (job) {
    job.status = update.status;
    if (update.logoUri) job.logoUri = update.logoUri;
    if (update.error) job.error = update.error;
  }
}

function getLogoJob(jobId: string): LogoJob | undefined {
  return logoJobs.get(jobId);
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const upload = multer({ dest: "uploads/" });

/**
 * Safely extract the authenticated user's ID from the request.
 * All authenticated endpoints should use this instead of manual extraction with "demo-user" fallback.
 */
function getUserId(req: express.Request): string {
  const user = req.user as any;
  const userId = user?.id || user?.claims?.sub;
  if (!userId) {
    throw new Error("User ID not found in session");
  }
  return userId;
}

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
 console.log(`\n === ${title} ===`);
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

  return dbMessages.map((m: any) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "User",
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

  return dbMessages.map((m: any) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "User",
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

  return dbMessages.map((m: any) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from: m.direction === "outbound" ? "You" : m.senderName || "User",
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

  return dbMessages.map((m: any) => ({
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

async function fetchWhatsappBaileysMessagesFromDB(
  integrationId: string,
  conversationId: string,
  accountId: string,
): Promise<NormalizedMessage[]> {
  const dbMessages = await storage.getMessagesByIntegrationAndConversation(
    integrationId,
    conversationId,
  );

  return dbMessages.map((m: any) => ({
    id: m.metaMessageId,
    conversationId,
    metaConversationId: m.metaConversationId,
    text: m.textContent || "",
    imageUrl: m.imageUrl || null,
    from:
      m.direction === "outbound"
        ? "You"
        : m.contactName || m.senderId || conversationId,
    fromId: m.senderId,
    created_time: m.timestamp.toISOString(),
    provider: "whatsapp_baileys",
    accountId,
    direction: m.direction,
  }));
}

// ==================================================================================
// HYBRID SYNC HELPERS FOR MESSENGER/INSTAGRAM
// ==================================================================================
function getAttachmentType(att: any): {
  type: "image" | "video" | "audio" | "file";
  label: string;
  url: string | null;
} {
  if (att.image_data?.url) {
    return {
      type: "image",
      label: "📷 Image",
      url: att.image_data.url,
    };
  }

  if (att.video_data?.url) {
    return {
      type: "video",
      label: "🎥 Video",
      url: att.video_data.url,
    };
  }

  if (att.audio_data?.url) {
    return {
      type: "audio",
      label: "🎧 Audio",
      url: att.audio_data.url,
    };
  }

  if (att.file_url) {
    return {
      type: "file",
      label: "📎 File",
      url: att.file_url,
    };
  }

  return {
    type: "file",
    label: "📎 Attachment",
    url: null,
  };
}

/**
 * Extract attachment info from webhook format (different from Graph API)
 * Webhook attachments use payload.url or direct url property
 */
function getWebhookAttachmentInfo(att: any): {
  type: "image" | "video" | "audio" | "file";
  label: string;
  url: string | null;
} {
  // Get the URL from either payload.url or direct url property
  const url = att.payload?.url || att.url || null;

  if (!url) {
    return {
      type: "file",
      label: "📎 Attachment",
      url: null,
    };
  }

  // Determine type from attachment type field
  const type = att.type as "image" | "video" | "audio" | "file";

  const labelMap: Record<string, string> = {
    image: "📷 Image",
    video: "🎥 Video",
    audio: "🎤 Audio",
    file: "📎 File",
  };

  return {
    type: type || "file",
    url,
    label: labelMap[type] || "📎 Attachment",
  };
}
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

    // 1. Fetch conversations con participantes
    const convoUrl = `https://graph.facebook.com/v24.0/${accountId}/conversations?fields=id,platform,participants{id,name,picture},updated_time${
      provider !== "facebook" ? `&platform=${provider}` : ""
    }&limit=20&access_token=${accessToken}`;

    const convoRes = await fetch(convoUrl);
    const convoData = await convoRes.json();

    if (convoData.error) {
      console.error(`[ERROR] Initial sync error for ${provider}:`, convoData.error);
      return;
    }

    const conversations = convoData.data || [];
    console.log(
      `📦 Found ${conversations.length} conversations for ${provider}`,
    );

    const messagesToInsert: InsertMessage[] = [];
    const attachmentsTemp: {
      metaMessageId: string;
      type: string;
      url: string;
      mimeType?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
    }[] = [];

    const conversationMetadata = new Map<string, any>();

    // Loop de conversaciones
    for (const convo of conversations) {
      // --- LÓGICA DE FOTO DE PERFIL ---
      let contactProfileImage = null;
      const participants = convo.participants?.data || [];
      const client = participants.find(
        (p: any) => p.id !== accountId && p.id !== integration.pageId,
      );

      if (client) {
        let metaImageUrl = null;
        if (provider === "facebook" && client.name !== "Facebook user") {
          try {
            // Llamada extra solo para Facebook Messenger
            const picRes = await fetch(
              `https://graph.facebook.com/v24.0/${client.id}?fields=profile_pic&access_token=${accessToken}`,
            );
            const picData = await picRes.json();
            metaImageUrl = picData.profile_pic || null;
          } catch (e) {
            console.log(
              `[Meta API] Could not fetch profile picture for PSID: ${client.id}`,
            );
          }
        } else if (provider === "instagram") {
          // Instagram lo suele incluir en el primer fetch
          metaImageUrl = client.picture?.data?.url;
        }

        // Si obtuvimos una URL de Meta, la subimos a Cloudinary
        if (metaImageUrl) {
          try {
            const uploadRes = await cloudinary.uploader.upload(metaImageUrl, {
              folder: "crm/profiles",
              // Opcional: transformar a cuadrado y optimizar
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
                { quality: "auto", fetch_format: "auto" },
              ],
            });
            contactProfileImage = uploadRes.secure_url; // URL persistente de Cloudinary
            console.log(`[OK] Imagen subida a Cloudinary para ${client.name}`);
          } catch (uploadError) {
            console.error("[ERROR] Error subiendo a Cloudinary:", uploadError);
            // Fallback: usar la de Meta si Cloudinary falla
            contactProfileImage = metaImageUrl;
          }
        }
      }

      // 2. Fetch mensajes de la conversación
      const messagesUrl = `https://graph.facebook.com/v24.0/${convo.id}/messages?fields=id,message,text,from,to,created_time,attachments{mime_type,name,size,image_data,video_data,audio_data,file_url}&limit=20&access_token=${accessToken}`;
      const msgRes = await fetch(messagesUrl);
      const msgData = await msgRes.json();

      if (msgData.error) continue;

      const messages = msgData.data || [];

      for (const m of messages) {
        const text = m.message || m.text || "";
        const fromId = m.from?.id || "";
        const fromName = m.from?.name || m.from?.username || "Unknown";
        const toId = m.to?.data?.[0]?.id || "";
        const toName =
          m.to?.data?.[0]?.name || m.to?.data?.[0]?.username || "Unknown";

        // Detectar dirección
        let isOutbound = false;
        if (fromId === accountId || fromId === integration.pageId)
          isOutbound = true;

        // Additional check for Instagram/Threads — match by account name
        if (!isOutbound && provider !== "facebook") {
          if (fromName?.toLowerCase() === integration.accountName?.toLowerCase()) {
            isOutbound = true;
          }
        }

        const contactName = isOutbound ? toName : fromName;
        const messageTimestamp = new Date(m.created_time);

        // Actualizar metadata de la conversación (para el upsert final)
        const existing = conversationMetadata.get(convo.id);
        if (!existing || messageTimestamp > existing.latestTimestamp) {
          let displayText = text;

          if (!displayText && m.attachments?.data?.length) {
            const first = m.attachments.data[0];
            const info = getAttachmentType(first);

            displayText = info.label;

            if (m.attachments.data.length > 1) {
              displayText += ` +${m.attachments.data.length - 1}`;
            }
          }

          if (!displayText && !m.attachments?.data?.length) {
            displayText = "Sticker or voice note";
          }

          conversationMetadata.set(convo.id, {
            metaConversationId: convo.id,
            latestMessage: displayText,
            latestTimestamp: messageTimestamp,
            contactName,
            contactProfilePicture: contactProfileImage, // <--- Tu campo de DB
          });
        }

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

        if (m.attachments?.data?.length) {
 console.log(` Found ${m.attachments.data.length} attachments`);
          for (const att of m.attachments.data) {
            const mimeType: string | null = att.mime_type || null;
            const fileName: string | null = att.name || null;
            const fileSize: number | null =
              typeof att.size === "number" ? att.size : null;

            const info = getAttachmentType(att);

            if (!info.url) continue;

            let finalUrl = info.url;

            try {
              const upload = await cloudinary.uploader.upload(info.url, {
                folder: "crm/messages",
                resource_type: info.type === "video" ? "video" : "image",
              });

              finalUrl = upload.secure_url;
            } catch (err) {
              console.error("[ERROR] Cloudinary upload failed", err);
            }

            attachmentsTemp.push({
              metaMessageId: m.id,
              type: info.type,
              url: finalUrl, // 👈 YA ES PUBLICA
              mimeType: att.mime_type || null,
              fileName: att.name || null,
              fileSize: typeof att.size === "number" ? att.size : null,
            });
          }
        }
      }
    }

    // 3. Crear/Actualizar conversaciones en DB
    console.log(`[SYNC] Creating ${conversationMetadata.size} conversations...`);
    const conversationMap = new Map<string, string>();

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
        contactProfilePicture: metadata.contactProfilePicture, // <--- Guardado en DB
      });
      conversationMap.set(metaConversationId, conversation.id);
    }

    // 4. Mapear IDs y Guardar mensajes
    messagesToInsert.forEach((msg: any) => {
      msg.conversationId = conversationMap.get(msg.metaConversationId);
    });

    if (messagesToInsert.length > 0) {
      await storage.bulkInsertMessages(messagesToInsert);
      const metaMessageIds = messagesToInsert.map((m) => m.metaMessageId);

      const dbMessages = await storage.getMessagesByMetaIds(metaMessageIds);

      const messageIdMap = new Map(
        dbMessages.map((m) => [m.metaMessageId, m.id]),
      );
      const finalAttachments = attachmentsTemp
        .map((att) => ({
          messageId: messageIdMap.get(att.metaMessageId),
          type: att.type,
          url: att.url,
          mimeType: att.mimeType,
          fileName: att.fileName,
          fileSize: att.fileSize,
        }))
        .filter((a): a is typeof a & { messageId: string } => !!a.messageId);

      if (finalAttachments.length) {
        await storage.bulkInsertMessageAttachments(finalAttachments);
 console.log(` Inserted ${finalAttachments.length} attachments`);
      }
      console.log(`[OK] Initial sync complete for ${provider}`);
    }

    await storage.markIntegrationAsFetched(integration.id);
  } catch (err) {
    console.error(`[ERROR] Initial sync failed for ${provider}:`, err);
  }
}
/**
 * Perform initial historical sync for Instagram Direct (via Instagram Login API)
 * Uses Instagram Graph API endpoints instead of Facebook Graph API
 */
async function performInstagramDirectSync(
  userId: string,
  integration: any,
): Promise<void> {
  const attachmentsTemp: {
    metaMessageId: string;
    type: string;
    url: string;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  }[] = [];

  try {
 console.log(`\n [INITIAL SYNC] Starting for INSTAGRAM_DIRECT...`);

    const accessToken = integration.accessToken;
    const igbaId = integration.accountId;

    console.log(`🆔 IGBA ID: ${igbaId}`);

    const convoUrl = `https://graph.instagram.com/v24.0/me/conversations?platform=instagram&access_token=${accessToken}`;
    console.log(
      `📞 Fetching IG Direct conversations from: ${convoUrl.replace(accessToken, "TOKEN")}`,
    );

    const convoRes = await fetch(convoUrl);
    const convoData = await convoRes.json();

    if (convoData.error) {
      console.error(
        `❌ Initial sync error for instagram_direct:`,
        convoData.error,
      );
      return;
    }

    const conversations = convoData.data || [];
    console.log(
      `📦 Found ${conversations.length} conversations for instagram_direct`,
    );

    const messagesToInsert: any[] = [];
    const conversationMetadata = new Map<string, any>();
    const seenMessageIds = new Set<string>();

    for (const convo of conversations) {
      // Fetch messages with full details in a single call using nested fields
      // This avoids the N+1 pattern of fetching each message individually
      const messagesUrl = `https://graph.instagram.com/v24.0/${convo.id}?fields=messages.limit(50){id,created_time,from,to,message,attachments}&access_token=${accessToken}`;
      const msgRes = await fetch(messagesUrl);
      const msgData = await msgRes.json();

      if (msgData.error) {
        console.error(
          `⚠️ Error fetching messages for conversation ${convo.id}:`,
          msgData.error,
        );
        continue;
      }

      const messagesList = msgData.messages?.data || [];
      console.log(
        `  📨 Conversation ${convo.id}: ${messagesList.length} messages fetched (inline)`,
      );

      for (const m of messagesList) {

        if (m.error) {
          console.error(`  Error in message ${m.id || "unknown"}:`, m.error);
          continue;
        }

        if (!m.id) continue;
        if (seenMessageIds.has(m.id)) continue;
        seenMessageIds.add(m.id);

        const text = m.message || "";
        const fromId = m.from?.id || "";
        const fromName = m.from?.username || m.from?.name || "Unknown";
        const toId = m.to?.data?.[0]?.id || "";
        const toName =
          m.to?.data?.[0]?.username || m.to?.data?.[0]?.name || "Unknown";

        const isOutbound = fromId === igbaId;

        const contactName = isOutbound ? toName : fromName;
        const messageTimestamp = new Date(m.created_time);

        const recipientIgsid = isOutbound ? toId : fromId;
        // Standardized format: ig_{contactId}_{accountId} — matches webhook handler format
        const compositeConversationId = `ig_${recipientIgsid}_${igbaId}`;

        const attachments = m.attachments?.data || [];

        // Conversation preview text
        const existing = conversationMetadata.get(compositeConversationId);
        if (!existing || messageTimestamp > existing.latestTimestamp) {
          let preview = text;

          if (!preview && attachments.length) {
            const first = attachments[0];
            const info = getAttachmentType(first);
            preview = info.label || "📎 Attachment";
            if (attachments.length > 1)
              preview += ` +${attachments.length - 1}`;
          }

          if (!preview) preview = "Sticker or voice note";

          conversationMetadata.set(compositeConversationId, {
            metaConversationId: compositeConversationId,
            latestMessage: preview,
            latestTimestamp: messageTimestamp,
            contactName,
            contactId: recipientIgsid, // The non-business contact ID
          });
        }

        // 1) Insert base message
        messagesToInsert.push({
          userId,
          brandId: integration.brandId,
          integrationId: integration.id,
          platform: "instagram_direct",
          metaMessageId: m.id,
          metaConversationId: compositeConversationId,
          senderId: fromId,
          recipientId: toId,
          textContent: text,
          direction: isOutbound ? "outbound" : "inbound",
          isRead: isOutbound,
          timestamp: messageTimestamp,
          contactName,
          rawPayload: { message: m, conversation: convo },
        });

        // 2) Process attachments -> Cloudinary -> staging table
        if (attachments.length) {
 console.log(` IG Direct: ${attachments.length} attachments`);

          for (const att of attachments) {
            const info = getAttachmentType(att);
            if (!info.url) continue;

            let finalUrl = info.url;

            try {
              const resourceType =
                info.type === "video"
                  ? "video"
                  : info.type === "audio" || info.type === "file"
                    ? "raw"
                    : "image";

              const upload = await cloudinary.uploader.upload(info.url, {
                folder: "crm/messages",
                resource_type: resourceType,
              });

              finalUrl = upload.secure_url;
            } catch (err) {
              console.error("[ERROR] Cloudinary upload failed (IG Direct)", err);
            }

            attachmentsTemp.push({
              metaMessageId: m.id,
              type: info.type,
              url: finalUrl,
              mimeType: att.mime_type || null, // IG Direct usually null
              fileName: att.name || null,
              fileSize: typeof att.size === "number" ? att.size : null,
            });
          }
        }
      }
    }

    console.log(`[SYNC] Creating ${conversationMetadata.size} conversations...`);
    const conversationMap = new Map<string, string>();

    for (const [
      metaConversationId,
      metadata,
    ] of conversationMetadata.entries()) {
      // Try to fetch contact profile picture from Instagram
      let contactProfilePicture: string | null = null;
      if (metadata.contactId && metadata.contactId !== igbaId) {
        try {
          const profileRes = await fetch(
            `https://graph.instagram.com/v24.0/${metadata.contactId}?fields=profile_pic&access_token=${accessToken}`,
          );
          const profileData = await profileRes.json();
          if (profileData.profile_pic) {
            contactProfilePicture = profileData.profile_pic;
          }
        } catch {
          // Profile picture fetch is best-effort
        }
      }

      const conversation = await storage.getOrCreateConversation({
        integrationId: integration.id,
        brandId: integration.brandId,
        userId,
        metaConversationId,
        platform: "instagram_direct",
        contactName: metadata.contactName,
        lastMessage: metadata.latestMessage,
        lastMessageAt: metadata.latestTimestamp,
        contactProfilePicture,
      });

      conversationMap.set(metaConversationId, conversation.id);
    }

    messagesToInsert.forEach((msg: any) => {
      msg.conversationId = conversationMap.get(msg.metaConversationId);
    });

    console.log(
      `✅ Mapped ${messagesToInsert.length} messages to conversations`,
    );

    if (messagesToInsert.length > 0) {
      console.log(
        `💾 Saving ${messagesToInsert.length} messages to database...`,
      );
      await storage.bulkInsertMessages(messagesToInsert);

      const metaMessageIds = messagesToInsert.map((m) => m.metaMessageId);
      const dbMessages = await storage.getMessagesByMetaIds(metaMessageIds);

      const messageIdMap = new Map(
        dbMessages.map((m) => [m.metaMessageId, m.id]),
      );

      const finalAttachments = attachmentsTemp
        .map((att) => ({
          messageId: messageIdMap.get(att.metaMessageId),
          type: att.type,
          url: att.url,
          mimeType: att.mimeType,
          fileName: att.fileName,
          fileSize: att.fileSize,
        }))
        .filter((a): a is typeof a & { messageId: string } => !!a.messageId);

      if (finalAttachments.length) {
        await storage.bulkInsertMessageAttachments(finalAttachments);
        console.log(
          `📎 Inserted ${finalAttachments.length} IG Direct attachments`,
        );
      }

      console.log(`[OK] Initial sync complete for instagram_direct`);
    } else {
      console.log(
        `📭 No new messages found for instagram_direct, marking as synced anyway`,
      );
    }

    await storage.markIntegrationAsFetched(integration.id);
    integration.hasFetchedHistory = true;
    console.log(`[DONE] [INSTAGRAM_DIRECT] Marked as fetched in DB and memory`);
  } catch (err) {
    console.error(`[ERROR] Initial sync failed for instagram_direct:`, err);
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
  app.use("/.well-known", express.static(".well-known"));

  // Health check endpoint for deployment
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }
      const [entry] = await db.insert(waitlist).values(parsed.data as any).returning();
      res.status(201).json({ success: true, id: entry.id });
    } catch (err: any) {
      if (err?.code === "23505") {
        return res
          .status(409)
          .json({ error: "This email is already on the waitlist." });
      }
      console.error("Waitlist error:", err);
      res
        .status(500)
        .json({ error: "Something went wrong. Please try again." });
    }
  });

  // Auth middleware
  await setupAuth(app);

  // Register sync functions with the inbox sync service
  // These functions are called from the Stripe webhook when inbox subscription is activated
  registerSyncFunctions(performInitialSync, performInstagramDirectSync);

  // Register Stripe billing routes
  registerStripeRoutes(app, isAuthenticated);

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

  app.put("/api/users/:id", isAuthenticated, async (req: any, res) => {
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

  // Chat routes (requires authentication)
  app.use("/api", isAuthenticated, chatRoutes);

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
  // NOTE: Brand creation is handled by POST /api/brands/create (which also creates owner membership)

  const pdfUpload = multer({
    dest: "uploads/",
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed"));
      }
    },
  });

  app.post(
    "/api/brands/:brandId/pdf-summary",
    isAuthenticated,
    pdfUpload.single("pdf"),
    async (req: any, res) => {
      const fs = await import("fs");
      const filePath = req.file?.path;
      try {
        if (!req.file || !filePath) {
          return res.status(400).json({ message: "No PDF file uploaded" });
        }

        if (req.file.mimetype !== "application/pdf") {
          return res
            .status(400)
            .json({ message: "Only PDF files are allowed" });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        const { GoogleGenAI } = await import("@google/genai");
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Read this PDF document carefully and provide a concise summary paragraph (30-40 sentences) that captures the key information about the brand, its products/services, target audience, and unique value proposition. Write the summary in the same language as the document. Only return the summary paragraph, nothing else.",
                },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });

        const summary = response.text || "";
        res.json({ summary });
      } catch (error) {
        console.error("Error processing PDF summary:", error);
        res.status(500).json({ message: "Failed to process PDF" });
      } finally {
        if (filePath) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      }
    },
  );

  app.get("/api/brands/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
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
        getUserId(req);
      const brandId = req.params.id;
      const { preferredLanguage, brandCategory, ...updates } = req.body;

      // Include brandCategory and preferredLanguage in the updates if provided
      const fullUpdates = {
        ...updates,
        ...(brandCategory !== undefined && { brandCategory }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
      };

      const brand = await storage.updateBrand(brandId, userId, fullUpdates);

      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }

      // Update or create brand design with preferred language if provided
      if (preferredLanguage) {
        const existingDesign = await storage.getBrandDesignByBrandId(brandId);
        if (existingDesign) {
          await storage.updateBrandDesign(existingDesign.id, brandId, {
            preferredLanguage,
          });
        } else {
          await storage.createBrandDesign({ brandId, preferredLanguage });
        }
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
        getUserId(req);
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

  // Toggle auto-post enabled for a brand
  app.patch(
    "/api/brands/:id/auto-post",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);
        const brandId = req.params.id;
        const { enabled } = req.body;

        if (typeof enabled !== "boolean") {
          return res.status(400).json({ message: "enabled must be a boolean" });
        }

        const brand = await storage.updateBrand(brandId, userId, {
          autoPostEnabled: enabled,
        });

        if (!brand) {
          return res.status(404).json({ message: "Brand not found" });
        }

        await storage.createActivityLog({
          userId,
          brandId: brand.id,
          action: enabled ? "enable_auto_post" : "disable_auto_post",
          description: `${enabled ? "Enabled" : "Disabled"} automatic posting for brand: ${brand.name}`,
          entityType: "brand",
          entityId: brand.id,
        });

        res.json({ autoPostEnabled: brand.autoPostEnabled });
      } catch (error) {
        console.error("Error updating auto-post setting:", error);
        res.status(500).json({ message: "Failed to update auto-post setting" });
      }
    },
  );

  // Get user's onboarding progress (returns brand with onboarding info if exists)
  app.get(
    "/api/onboarding/progress",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);

        // Get user's brand memberships to find incomplete onboarding
        const memberships = await storage.getBrandMemberships(userId);

        if (!memberships || memberships.length === 0) {
          // No brands - user needs to start from scratch
          return res.json({
            hasIncompleteBrand: false,
            brand: null,
            onboardingStep: 1,
            onboardingCompleted: false,
          });
        }

        // Find the first brand with incomplete onboarding (owned by this user)
        const ownedMemberships = memberships.filter((m) => m.role === "owner");

        for (const membership of ownedMemberships) {
          const brand = await storage.getBrandById(membership.brandId, userId);
          if (brand && !brand.onboardingCompleted) {
            return res.json({
              hasIncompleteBrand: true,
              brand: brand,
              onboardingStep: brand.onboardingStep || 1,
              onboardingCompleted: false,
            });
          }
        }

        // All brands have completed onboarding
        res.json({
          hasIncompleteBrand: false,
          brand: memberships[0]
            ? await storage.getBrandById(memberships[0].brandId, userId)
            : null,
          onboardingStep: null,
          onboardingCompleted: true,
        });
      } catch (error) {
        console.error("Error fetching onboarding progress:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch onboarding progress" });
      }
    },
  );

  // Update onboarding step for a brand
  app.patch(
    "/api/brands/:id/onboarding",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);
        const brandId = req.params.id;
        const { onboardingStep, onboardingCompleted } = req.body;

        const updates: any = {};
        if (onboardingStep !== undefined) {
          updates.onboardingStep = onboardingStep;
        }
        if (onboardingCompleted !== undefined) {
          updates.onboardingCompleted = onboardingCompleted;
        }

        const brand = await storage.updateBrand(brandId, userId, updates);

        if (!brand) {
          return res.status(404).json({ message: "Brand not found" });
        }

        res.json(brand);
      } catch (error) {
        console.error("Error updating onboarding progress:", error);
        res
          .status(500)
          .json({ message: "Failed to update onboarding progress" });
      }
    },
  );

  // Brand memberships endpoint
  app.get("/api/brand-memberships", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const memberships = await storage.getBrandMemberships(userId);

      res.json(memberships);
    } catch (error) {
      console.error("[ERROR] Error fetching brand memberships:", error);
      res.status(500).json({ message: "Failed to fetch brand memberships" });
    }
  });

  // Create new brand endpoint
  app.post("/api/brands/create", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
      const {
        name,
        industry,
        description,
        brandColor,
        preferredLanguage,
        brandCategory,
        domain,
      } = req.body;

      console.log(
        "[API /api/brands/create] Request body:",
        JSON.stringify(req.body, null, 2),
      );
      console.log(
        "[API /api/brands/create] preferredLanguage received:",
        preferredLanguage,
      );

      if (!name) {
        return res.status(400).json({ message: "Brand name is required" });
      }

      // Create brand with preferredLanguage and brandCategory stored directly on brand
      const brand = await storage.createBrand({
        userId,
        name,
        industry: industry || null,
        description: description || null,
        primaryColor: brandColor || null,
        domain: domain || null,
        preferredLanguage: preferredLanguage || "en",
        brandCategory: brandCategory || null,
      });

      console.log(
        "[API /api/brands/create] Brand created with preferredLanguage:",
        brand.preferredLanguage,
      );

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

  // Generate brand essence using AI
  app.post(
    "/api/brands/:brandId/generate-essence",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;

        const essence = await generateBrandEssence(brandId);

        res.json({ success: true, essence });
      } catch (error: any) {
        console.error("Error generating brand essence:", error);
        res.status(500).json({
          message: "Failed to generate brand essence",
        });
      }
    },
  );

  // Generate description for a brand asset image using AI
  app.post(
    "/api/brand-assets/generate-description",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
          return res.status(400).json({ message: "Image URL is required" });
        }

        // Validate URL format to prevent SSRF
        try {
          const parsed = new URL(imageUrl);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return res.status(400).json({ message: "Only HTTP/HTTPS URLs are allowed" });
          }
        } catch {
          return res.status(400).json({ message: "Invalid URL format" });
        }

        const description = await generateBrandAssetDescription(imageUrl);

        res.json({ success: true, description });
      } catch (error: any) {
        console.error("Error generating asset description:", error);
        res.status(500).json({
          message: "Failed to generate asset description",
        });
      }
    },
  );

  // Accept brand invitation endpoint
  app.post(
    "/api/brand-invitations/accept",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);
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
                  avatarUrl: (user as any).avatarUrl ?? user.profileImageUrl,
                }
              : null,
          };
        });
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
          getUserId(req);
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
          getUserId(req);
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
          getUserId(req);
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
          getUserId(req);
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
          getUserId(req);
        await populateDemoData(userId);
        res.json({ message: "Demo data populated successfully" });
      } catch (error) {
        console.error("Error populating demo data:", error);
        res.status(500).json({ message: "Failed to populate demo data" });
      }
    },
  );

  // Dashboard stats - aggregated from real data (requires brand access)
  app.get("/api/dashboard/stats", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership!.brandId;

      // Get brand integrations for connected platforms
      const integrations = await storage.getIntegrationsByBrandId(brandId);
      const connectedPlatforms = Array.from(
        new Set(integrations.filter((i: any) => i.isActive).map((i: any) => i.provider)),
      );

      // Get conversations for unread count
      const conversations = await storage.getConversationsByBrandId(brandId);
      const unreadMessages = conversations.reduce(
        (sum: number, c: any) => sum + (c.unreadCount || 0),
        0,
      );
      const totalMessages = conversations.length;

      // Get campaigns count
      const campaigns = await storage.getCampaignsByBrandId(brandId);
      const activeCampaigns = campaigns.filter(
        (c: any) => c.status === "scheduled" || c.status === "published",
      ).length;

      // Get AI-generated posts count
      let aiPosts = 0;
      try {
        const { getAiGeneratedPostsByBrand } = await import("./storage/aiGeneratedPosts");
        const posts = await getAiGeneratedPostsByBrand(brandId);
        aiPosts = posts.length;
      } catch (err) {
        console.warn("[Dashboard] Failed to fetch AI posts count:", (err as Error).message);
      }

      // Calculate real response time from conversations (same logic as /api/inbox/stats)
      let responseTimes: number[] = [];
      let realTotalMessages = 0;
      for (const conversation of conversations) {
        const msgs = await storage.getConversationMessages(conversation.id);
        realTotalMessages += msgs.length;
        let lastInboundTime: Date | null = null;
        for (const msg of msgs) {
          const msgTime = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp);
          if (msg.direction === "inbound") {
            lastInboundTime = msgTime;
          } else if (msg.direction === "outbound" && lastInboundTime) {
            const rt = msgTime.getTime() - lastInboundTime.getTime();
            if (rt > 0) responseTimes.push(rt);
            lastInboundTime = null;
          }
        }
      }

      let responseTime = "N/A";
      if (responseTimes.length > 0) {
        const avgMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const avgMinutes = Math.round(avgMs / 60000);
        if (avgMinutes < 60) {
          responseTime = `${avgMinutes}m`;
        } else {
          const hours = Math.floor(avgMinutes / 60);
          const mins = avgMinutes % 60;
          responseTime = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
      }

      // Calculate real revenue from POS sales transactions
      const userId = getUserId(req);
      let revenue = 0;
      try {
        const transactions = await storage.getSalesTransactionsByUserId(userId);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        revenue = transactions
          .filter((t: any) => new Date(t.transactionDate) >= thirtyDaysAgo)
          .reduce((sum: number, t: any) => sum + Number(t.totalAmount || 0), 0);
      } catch (_) {
        // No POS data available
      }

      const stats = {
        totalMessages: realTotalMessages,
        unreadMessages,
        totalCampaigns: campaigns.length,
        activeCampaigns,
        totalSocialAccounts: integrations.length,
        connectedPlatforms,
        aiPosts,
        responseTime,
        revenue,
      };
      res.json(stats);
    } catch (error) {
      console.error("[Dashboard] Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Social accounts routes

  app.post("/api/social-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
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

  app.patch("/api/messages/:id/read", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const messageId = req.params.id;
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.patch("/api/messages/:id/priority", isAuthenticated, requireBrand, async (req, res) => {
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

  app.patch("/api/messages/:id/assign", isAuthenticated, requireBrand, async (req, res) => {
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

  app.get("/api/messages/latest", isAuthenticated, requireBrand, async (req, res) => {
    try {
      // 1. Obtener el límite y el usuario
      const { limit: limitStr = "10" } = req.query;
      const limit = parseInt(limitStr as string, 10);
      if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ error: "Invalid limit parameter" });
      }
      const userId = (req.user as any)?.id;

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
              // Initial sync now only happens when inbox subscription is activated via webhook
              // See: server/stripe/webhookHandlers.ts handleCheckoutCompleted()

              // ✅ Leer mensajes de la base de datos local para Meta (Facebook/Instagram/Threads)
              const dbMessages = await storage.getMessagesByIntegration(
                integration.id,
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
                accountId: accountId ?? undefined,
                imageUrl: null,
              })) as NormalizedMessage[];

              break;
            }

            case "whatsapp": {
              // Nota: El endpoint 'all' hace una agregación más compleja por conversación
              // Para "latest", simplemente vamos a obtener los últimos mensajes DIRECTOS de la DB
              // y luego aplicaremos el límite y ordenamiento globalmente.

              const allWhatsAppMessages =
                await storage.getMessagesByIntegration(
                  integration.id,
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
                accountId: accountId ?? undefined,
                imageUrl: null,
              })) as NormalizedMessage[];

              break;
            }

            default:
              console.warn(`Provider desconocido: ${provider}`);
              break;
          }

          return { messages, success: true, provider, accountId };
        } catch (err) {
          console.error(`[ERROR] Error fetching messages for ${provider}:`, err);
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
            accountId: result.value.accountId ?? undefined,
          }));
          allMessages.push(...(providerMessages as NormalizedMessage[]));
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
      console.error("[ERROR] Error fetching latest messages from DB:", err);
      res.status(500).json({ error: "Failed to fetch latest messages" });
    }
  });

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


  app.post(
    "/api/content-plans/generate",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);
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
        } as any);

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
          getUserId(req);
        const brandId = req.brandId || req.brandMembership?.brandId;
        const { schedules } = req.body;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        if (!schedules || !Array.isArray(schedules)) {
          return res.status(400).json({ message: "Invalid schedules data" });
        }

        const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

        // Validate and convert schedules to database format
        const frequencies = schedules.map((schedule: any) => {
          const postsPerWeek = Number(schedule.postsPerWeek);
          if (!Number.isFinite(postsPerWeek) || postsPerWeek < 0 || postsPerWeek > 21) {
            throw new Error(`Invalid postsPerWeek value: ${schedule.postsPerWeek}`);
          }
          const selectedDays = Array.isArray(schedule.selectedDays)
            ? schedule.selectedDays.filter((d: string) => validDays.includes(d))
            : [];
          return {
            userId,
            brandId,
            platform: schedule.platform,
            frequencyDays: postsPerWeek,
            daysWeek: selectedDays,
            source: "custom",
            status: "accepted",
            confidenceScore: null,
            insightsData: null,
          };
        });

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
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId || req.brandMembership?.brandId;
        const userId = getUserId(req);

        // Scope integrations to the active brand, not all user integrations
        const allIntegrations = await storage.getIntegrationsByBrandId(brandId);
        const active = allIntegrations.filter(
          (i: any) =>
            ["facebook", "instagram", "instagram_direct"].includes(i.provider) && i.isActive,
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

              // Dynamic frequency rules
              let postsPerWeek = 1;
              if (engagementRate > 0.05) postsPerWeek = 3;
              if (engagementRate > 0.08) postsPerWeek = 5;

              let days = ["wed"];
              if (postsPerWeek >= 3) days = ["mon", "wed", "fri"];
              if (postsPerWeek >= 5) days = ["mon", "tue", "wed", "thu", "fri"];

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
                postsPerWeek,
                days_week: days,
                best_hours: hours,
                insights_data: {
                  avg_engagement_rate: engagementRate,
                  avg_reach: avgReach,
                  avg_views: avgImpressions,
                },
              });
            }

            // 🔹 INSTAGRAM (via Facebook or Direct)
            else if (integration.provider === "instagram" || integration.provider === "instagram_direct") {
              const igBaseUrl = integration.provider === "instagram_direct"
                ? "https://graph.instagram.com"
                : "https://graph.facebook.com";
              const mediaUrl = `${igBaseUrl}/v24.0/${integration.accountId}/media?fields=id,timestamp,caption,insights.metric(impressions,reach,likes,comments,saved,total_interactions)&limit=25&access_token=${integration.accessToken}`;
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
              const avgReach = avg(parsed.map((p: any) => p.reach));
              const avgInteractions = avg(parsed.map((p: any) => p.total));
              const avgER = avg(parsed.map((p: any) => p.engagementRate));

              // 📅 Identify top 3 days by engagement
              const byDay = parsed.reduce((acc: any, p: any) => {
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
                .sort((a: any, b: any) => b.engagementRate - a.engagementRate)
                .slice(0, Math.max(3, parsed.length * 0.2));
              const avgHour =
                Math.round(avg(topPosts.map((p: any) => p.hour))) || 12;
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
        console.error("[ERROR] Error fetching AI suggestions:", error);
        res.status(500).json({ message: "Failed to fetch AI suggestions" });
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
          getUserId(req);
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

  // Post Generator - Validate requirements before generating
  app.get(
    "/api/post-generator/validate/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.params.brandId || req.brandId;
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        const { validatePostGenerationRequirements } = await import(
          "./services/postGenerator"
        );

        const validation = await validatePostGenerationRequirements(brandId);
        res.json(validation);
      } catch (error) {
        console.error("[Post Generator] Validation error:", error);
        res.status(500).json({
          valid: false,
          message: error instanceof Error ? error.message : "Validation failed",
        });
      }
    },
  );

  app.post(
    "/api/logo-generator/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.params.brandId || req.brandId;
        const userId = req.user.id;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        // Create a new logo job in storage
        const job = await createLogoJob(brandId, userId);

        // Return immediately to client
        res.json({
          success: true,
          message: "Logo generation job started",
          jobId: job.id,
          status: job.status,
        });

        // Fire-and-forget: generate logo in background
        generateAILogo(brandId, userId)
          .then(async (logoUri) => {
            // Save the generated logo URL or base64 to storage
            await updateLogoJobResult(job.id, {
              status: "completed",
              logoUri,
            });
          })
          .catch(async (error) => {
            console.error("[Logo Generator] Background error:", error);
            await updateLogoJobResult(job.id, {
              status: "failed",
              // error details omitted for security
            });
          });
      } catch (error) {
        console.error("[Logo Generator] Error:", error);
        res.status(500).json({
          message: "Failed to create logo generator job",
          // error details omitted for security
        });
      }
    },
  );

  app.get(
    "/api/logo-generator/status/:jobId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { jobId } = req.params;
        const job = getLogoJob(jobId);

        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }

        res.json({
          id: job.id,
          status: job.status,
          logoUri: job.logoUri,
          error: job.error,
        });
      } catch (error) {
        console.error("[Logo Generator Status] Error:", error);
        res.status(500).json({
          message: "Failed to get job status",
          // error details omitted for security
        });
      }
    },
  );

  // Post Generator - Create async job and process with Gemini AI (fire-and-forget)
  app.post(
    "/api/post-generator/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.params.brandId || req.brandId;
        const { month, year } = req.body;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        // Check billing - can brand generate images?
        const billingCheck = await billingService.canGenerateImages(brandId);
        if (!billingCheck.allowed) {
          return res.status(402).json({
            success: false,
            message:
              "Has agotado tus 10 imágenes gratuitas. Por favor, conecta un método de pago para continuar generando contenido.",
            requiresPayment: true,
            freeRemaining: billingCheck.freeRemaining,
            hasPaymentMethod: billingCheck.hasPaymentMethod,
          });
        }

        // Default to current month/year if not provided
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        // Validate that the target month/year is not in the past
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        if (
          targetYear < currentYear ||
          (targetYear === currentYear && targetMonth < currentMonth)
        ) {
          return res.status(400).json({
            success: false,
            message:
              "No se puede generar contenido de IA para meses pasados. Por favor selecciona el mes actual o un mes futuro.",
          });
        }

        // Validate requirements first
        const { validatePostGenerationRequirements, processPostGeneration } =
          await import("./services/postGenerator");

        const validation = await validatePostGenerationRequirements(brandId);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message,
          });
        }

        // Import job functions
        const { createPostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );

        // Create job record
        const job = await createPostGeneratorJob(brandId);

        // Return immediately to client
        res.json({
          success: true,
          message: "Post generator job started",
          jobId: job.id,
          status: job.status,
          freeRemaining: billingCheck.freeRemaining,
        });

        // Fire-and-forget: Process in background with Gemini AI
        // Billing is now handled per-image inside processPostGeneration loop
        processPostGeneration(brandId, job.id, targetMonth, targetYear)
          .then(async (result) => {
            // Billing already recorded per-image inside the loop
            console.log(
              `[PostGenerator] Background processing complete: ${result.postsGenerated} images generated, paymentRequired=${result.paymentRequired}`,
            );
          })
          .catch((error) => {
            console.error(
              "[Post Generator] Background processing error:",
              error,
            );
          });
      } catch (error) {
        console.error("[Post Generator] Error:", error);
        res.status(500).json({
          message: "Failed to create post generator job",
          // error details omitted for security
        });
      }
    },
  );

  // Post Generator Callback - n8n webhook callback endpoint
  // Secured with a shared secret to prevent unauthorized access
  app.post("/api/post-generator/callback", async (req: any, res) => {
    try {
      // Verify webhook secret to prevent unauthorized callbacks
      const callbackSecret = process.env.POST_GENERATOR_CALLBACK_SECRET;
      if (!callbackSecret) {
        if (process.env.NODE_ENV === "production") {
          console.error("[PostGenerator] POST_GENERATOR_CALLBACK_SECRET not set — rejecting in production");
          return res.status(500).json({ message: "Webhook secret not configured" });
        }
      } else {
        const providedSecret = req.headers["x-callback-secret"] || req.body?.callbackSecret;
        if (providedSecret !== callbackSecret) {
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const { jobId, status, result, error } = req.body;

      if (!jobId || typeof jobId !== "string") {
        return res.status(400).json({ message: "jobId is required" });
      }

      const { getPostGeneratorJob, updatePostGeneratorJob } = await import(
        "./storage/postGeneratorJobs"
      );
      const { createAiGeneratedPost } = await import(
        "./storage/aiGeneratedPosts"
      );

      const job = await getPostGeneratorJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // If result contains posts, save them
      if (result && Array.isArray(result)) {
        for (const platformData of result) {
          const platform = platformData.platform;
          const publicaciones = platformData.publicaciones || [];

          for (const pub of publicaciones) {
            await createAiGeneratedPost({
              jobId,
              brandId: job.brandId,
              platform,
              titulo: pub.titulo,
              content: pub.copy,
              imageUrl: pub.imagen_url,
              cloudinaryPublicId: pub.cloudinary_public_id,
              dia: pub.dia || "monday",
              hashtags: pub.hashtags,
              status: "pending",
              isSample: false,
            });
          }
        }
      }

      await updatePostGeneratorJob(jobId, {
        status: status || "completed",
        result: result || null,
        error: error || null,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Post Generator Callback] Error:", error);
      res.status(500).json({ message: "Failed to process callback" });
    }
  });

  // Update AI Generated Post Status
  app.patch(
    "/api/ai-posts/:postId/status",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { postId } = req.params;
        const { status, scheduledPublishTime, titulo, content, hashtags } =
          req.body;
        const brandId = req.brandId;

        if (!status || !["accepted", "rejected", "pending"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const { updateAiGeneratedPostStatus } = await import(
          "./storage/aiGeneratedPosts"
        );

        const editedFields =
          titulo !== undefined ||
          content !== undefined ||
          hashtags !== undefined
            ? { titulo, content, hashtags }
            : undefined;

        const updated = await updateAiGeneratedPostStatus(
          postId,
          status,
          scheduledPublishTime,
          undefined,
          editedFields,
        );
        if (!updated || updated.brandId !== brandId) {
          return res.status(404).json({ message: "Post not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({
          message: "Failed to update post status",
          // error details omitted for security
        });
      }
    },
  );

  // Bulk Update AI Generated Posts Status
  app.patch(
    "/api/ai-posts/bulk-status",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { postIds, status, scheduleTimes } = req.body;
        const brandId = req.brandId;

        if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
          return res.status(400).json({ message: "postIds array is required" });
        }

        if (!status || !["accepted", "rejected", "pending"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const { bulkUpdateAiGeneratedPostsStatus, getAiGeneratedPostsByBrand } =
          await import("./storage/aiGeneratedPosts");

        // Verify all posts belong to the brand
        const brandPosts = await getAiGeneratedPostsByBrand(brandId);
        const brandPostIds = new Set(brandPosts.map((p) => p.id));
        const validPostIds = postIds.filter((id: string) =>
          brandPostIds.has(id),
        );

        if (validPostIds.length === 0) {
          return res.status(404).json({ message: "No valid posts found" });
        }

        const updatedCount = await bulkUpdateAiGeneratedPostsStatus(
          validPostIds,
          status,
          scheduleTimes,
        );

        res.json({
          success: true,
          updatedCount,
          message: `${updatedCount} post(s) updated to ${status}`,
        });
      } catch (error) {
        console.error("[AI Posts Bulk] Error:", error);
        res.status(500).json({
          message: "Failed to bulk update post status",
          // error details omitted for security
        });
      }
    },
  );

  // Get AI Generated Posts for brand (with optional status filter)
  app.get(
    "/api/ai-posts",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const { status } = req.query;

        const { getAiGeneratedPostsByBrand } = await import(
          "./storage/aiGeneratedPosts"
        );

        const posts = await getAiGeneratedPostsByBrand(brandId, status);
        res.json(posts);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({
          message: "Failed to fetch AI posts",
          // error details omitted for security
        });
      }
    },
  );

  // Get AI Generated Posts by brand ID (alternative endpoint)
  app.get(
    "/api/ai-generated-posts/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId || req.brandMembership?.brandId;
        // Verify the URL param matches the user's brand
        if (req.params.brandId && req.params.brandId !== brandId) {
          return res.status(403).json({ message: "Unauthorized: Brand mismatch" });
        }
        const { status } = req.query;

        const { getAiGeneratedPostsByBrand } = await import(
          "./storage/aiGeneratedPosts"
        );

        const posts = await getAiGeneratedPostsByBrand(brandId, status);
        res.json(posts);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({ message: "Failed to fetch AI posts" });
      }
    },
  );

  // Update AI Generated Post Status (alternative endpoint)
  app.patch(
    "/api/ai-generated-posts/:postId/status",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { postId } = req.params;
        const brandId = req.brandId || req.brandMembership?.brandId;
        const {
          status,
          scheduledPublishTime,
          imageUrl,
          titulo,
          content,
          hashtags,
        } = req.body;

        if (!status || !["accepted", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const { updateAiGeneratedPostStatus } = await import(
          "./storage/aiGeneratedPosts"
        );

        const editedFields =
          titulo !== undefined ||
          content !== undefined ||
          hashtags !== undefined
            ? { titulo, content, hashtags }
            : undefined;

        const updated = await updateAiGeneratedPostStatus(
          postId,
          status,
          scheduledPublishTime,
          imageUrl,
          editedFields,
        );
        if (!updated || updated.brandId !== brandId) {
          return res.status(404).json({ message: "Post not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({ message: "Failed to update post status" });
      }
    },
  );

  // Get Post Generator Job Status
  app.get(
    "/api/post-generator/jobs/:jobId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { jobId } = req.params;
        const brandId = req.brandId || req.brandMembership?.brandId;

        const { getPostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );

        const job = await getPostGeneratorJob(jobId);
        if (!job || job.brandId !== brandId) {
          return res.status(404).json({ message: "Job not found" });
        }

        res.json(job);
      } catch (error) {
        console.error("[Post Generator Status] Error:", error);
        res.status(500).json({ message: "Failed to fetch job status" });
      }
    },
  );

  // Check if there's an active job running for a brand
  app.get(
    "/api/post-generator/active/:brandId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.params.brandId || req.brandId;
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        const { getActiveJobByBrand } = await import(
          "./storage/postGeneratorJobs"
        );

        const activeJob = await getActiveJobByBrand(brandId);

        res.json({
          hasActiveJob: !!activeJob,
          job: activeJob,
        });
      } catch (error) {
        console.error("[Post Generator Active Check] Error:", error);
        res.status(500).json({
          message: "Failed to check active job status",
          // error details omitted for security
        });
      }
    },
  );

  // Generate sample posts for brands that complete onboarding without integrations
  app.post(
    "/api/brands/:brandId/generate-sample-posts",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId || req.brandMembership?.brandId;
        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        if (req.params.brandId && req.params.brandId !== brandId) {
          return res
            .status(403)
            .json({ message: "Unauthorized: Brand mismatch" });
        }

        // Check billing - can brand generate images?
        const billingCheck = await billingService.canGenerateImages(brandId);
        if (!billingCheck.allowed) {
          return res.status(402).json({
            success: false,
            message:
              "Has agotado tus 10 imágenes gratuitas. Por favor, conecta un método de pago para continuar generando contenido.",
            requiresPayment: true,
            freeRemaining: billingCheck.freeRemaining,
            hasPaymentMethod: billingCheck.hasPaymentMethod,
          });
        }

        const { startSamplePostGeneration } = await import(
          "./services/samplePostGenerator"
        );

        const result = await startSamplePostGeneration(brandId);

        if (result) {
          // NOTE: Image usage is recorded asynchronously after generation completes
          // rather than upfront, to avoid charging for failed generations.
          // The billing is tracked inside processSamplePostsAsync via a callback.
          res.json({
            message: "Sample post generation started",
            status: "processing",
            jobId: result.jobId,
            freeRemaining: billingCheck.freeRemaining,
          });
        } else {
          res.json({
            message: "Sample posts already exist or could not start generation",
            status: "skipped",
          });
        }
      } catch (error) {
        console.error("[Sample Posts] Error:", error);
        res.status(500).json({
          message: "Failed to start sample post generation",
          // error details omitted for security
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


  app.post(
    "/api/campaigns",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId =
          getUserId(req);
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
          getUserId(req);
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
        } as any);

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
          getUserId(req);
        const brandId = req.brandMembership.brandId;
        const campaignId = req.params.id;

        // Get campaign details (brand-scoped)
        const campaigns = await storage.getCampaignsByBrandId(brandId);
        const campaign = campaigns.find((c) => c.id === campaignId);

        if (!campaign) {
          return res.status(404).json({ message: "Campaign not found" });
        }

        // Get brand's social accounts (use userId, not brandId)
        const socialAccounts =
          await storage.getSocialAccountsByUserId(userId);
        const accessTokens = socialAccounts.reduce(
          (acc: any, account: any) => {
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
  app.get("/api/chatbot/config/:brandId", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/chatbot/config", isAuthenticated, async (req: any, res) => {
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
      if (!openai) {
        return res.status(503).json({ message: "AI chat is not configured. Please set the OPENAI_API_KEY." });
      }
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

      if (!clientId) {
        return res.status(500).send("Facebook integration not configured");
      }

      const scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_metadata",
        "pages_manage_posts",
        "pages_manage_engagement",
        "pages_messaging",
        "instagram_basic",
        "instagram_manage_messages",
        "instagram_content_publish",
        "instagram_manage_comments",
        "read_insights",
        "instagram_manage_insights",
        "pages_read_user_content",
        "publish_video",
      ].join(",");

      // -------------------------------------
      // 🔥 CORRECTO: stringify SOLO UNA VEZ
      // -------------------------------------
      const origin = req.query.origin as string | undefined;
      const statePayload = {
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
        origin: origin || null,
      };

      const state = signOAuthState(statePayload);

      const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${scopes}&state=${state}`;

      res.redirect(authUrl);
    },
  );

  app.get("/api/integrations/facebook/callback", async (req, res) => {


    try {
      const { code, state, error: oauthError } = req.query;

      // Handle user-denied permissions
      if (oauthError) {
        return res.redirect("/integrations?error=user_denied");
      }

      if (!code) {
        return res.redirect("/integrations?error=missing_code");
      }

      if (!state) {
        return res.redirect("/integrations?error=missing_state");
      }

      // -----------------------------------------
      // 1️⃣ Verify and decode signed state (CSRF protection)
      // -----------------------------------------
      let userId, brandId, origin;

      try {
        const parsed = verifyOAuthState(state as string);

        if (!parsed) {
          return res.redirect("/integrations?error=invalid_state");
        }

        userId = (parsed as any).userId;
        brandId = (parsed as any).brandId;
        origin = (parsed as any).origin || "integrations";

      } catch (err) {
        return res.redirect("/integrations?error=invalid_state");
      }

      const redirect_uri = `${process.env.APP_URL}/api/integrations/facebook/callback`;

      // -----------------------------------------
      // 2️⃣ Exchange CODE → USER TOKEN
      // -----------------------------------------
      const tokenRes = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token` +
          `?client_id=${process.env.FB_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
          `&client_secret=${process.env.FB_APP_SECRET}` +
          `&code=${code}`,
      );

      const tokenJson = await tokenRes.json();

      if (!tokenJson.access_token) {
        return res.redirect("/integrations?error=token_failed");
      }

      let userAccessToken = tokenJson.access_token;

      // -----------------------------------------
      // 2.5️⃣ Exchange for LONG-LIVED user token
      // Page tokens derived from long-lived user tokens are automatically long-lived (no expiry)
      // -----------------------------------------
      try {
        const longLivedRes = await fetch(
          `https://graph.facebook.com/v24.0/oauth/access_token` +
            `?grant_type=fb_exchange_token` +
            `&client_id=${process.env.FB_APP_ID}` +
            `&client_secret=${process.env.FB_APP_SECRET}` +
            `&fb_exchange_token=${userAccessToken}`,
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          userAccessToken = longLivedData.access_token;
          console.log("[Facebook OAuth] Exchanged for long-lived user token");
        }
      } catch (err) {
        console.warn("[Facebook OAuth] Failed to exchange for long-lived token, using short-lived");
      }

      // -----------------------------------------
      // 3️⃣ Get pages user manages
      // -----------------------------------------
      const pagesRes = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`,
      );
      const pagesJson = await pagesRes.json();

      if (!pagesJson.data?.length) {
        return res.redirect("/integrations?error=no_pages");
      }

      // -----------------------------------------
      // 4️⃣ Pick page (prefer one with IG)
      // -----------------------------------------
      let selectedPage = null;
      let igInfo = null;
      for (const p of pagesJson.data) {
        const detailsRes = await fetch(
          `https://graph.facebook.com/v24.0/${p.id}` +
            `?fields=connected_instagram_account,instagram_business_account` +
            `&access_token=${p.access_token}`,
        );
        const details = await detailsRes.json();
        if (
          details.connected_instagram_account ||
          details.instagram_business_account
        ) {
          selectedPage = p;
          igInfo = details;
          break;
        }
      }

      if (!selectedPage) {
        selectedPage = pagesJson.data[0];
      }

      const pageAccessToken = selectedPage.access_token;

      // -----------------------------------------
      // 5️⃣ Save FACEBOOK integration
      // -----------------------------------------
      const savedFbIntegration = await storage.createOrUpdateIntegration({
        userId,
        brandId,
        provider: "facebook",
        category: "social_media",
        storeName: "Facebook",
        storeUrl: `https://facebook.com/${selectedPage.id}`,
        accountId: selectedPage.id,
        accountName: selectedPage.name,
        accessToken: pageAccessToken,
        pageId: selectedPage.id,
        isActive: true,
        syncEnabled: true,
        metadata: {
          fbPageId: selectedPage.id,
          igLinked: !!igInfo,
          source: "facebook_callback",
        },
      });

      // Trigger sync if inbox subscription is already active
      triggerSyncForNewIntegration(savedFbIntegration).catch(() => {});

      // -----------------------------------------
      // 6️⃣ SUBSCRIBE PAGE TO WEBHOOK  ✅ CLAVE
      // -----------------------------------------
      const subscribeRes = await fetch(
        `https://graph.facebook.com/v24.0/${selectedPage.id}/subscribed_apps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscribed_fields: [
              "messages",
              "messaging_postbacks",
              "message_reactions",
              "message_reads",
              "message_deliveries",
            ],
            access_token: pageAccessToken,
          }),
        },
      );

      const subscribeJson = await subscribeRes.json();

      // -----------------------------------------
      // 7️⃣ Save Instagram + Threads (if exists)
      // -----------------------------------------
      if (igInfo) {
        const igAcc =
          igInfo.connected_instagram_account ||
          igInfo.instagram_business_account;

        // Check for duplicate IG account across brands (same check as Instagram Direct flow)
        const duplicateIg = await storage.checkDuplicateIntegration(
          igAcc.id.toString(),
          igAcc.id.toString(),
          "instagram",
          brandId,
        );
        if (duplicateIg) {
          console.warn(`[Facebook OAuth] Instagram account ${igAcc.id} already connected to another brand`);
          // Continue without creating IG integration — Facebook integration is still saved
        }

        const igDetailsRes = await fetch(
          `https://graph.facebook.com/v24.0/${igAcc.id}` +
            `?fields=username,name,profile_picture_url` +
            `&access_token=${pageAccessToken}`,
        );
        const igDetails = await igDetailsRes.json();

        const savedIgIntegration = !duplicateIg ? await storage.createOrUpdateIntegration({
          userId,
          brandId,
          provider: "instagram",
          category: "social_media",
          storeName: "Instagram",
          storeUrl: `https://instagram.com/${igDetails.username}`,
          accountId: igAcc.id,
          accountName: igDetails.username,
          accessToken: pageAccessToken,
          pageId: selectedPage.id,
          isActive: true,
          syncEnabled: true,
          metadata: {
            fbPageId: selectedPage.id,
            igAccountId: igAcc.id,
            igUsername: igDetails.username,
            source: "facebook_callback",
          },
        }) : null;

        // Trigger sync if inbox subscription is already active
        if (savedIgIntegration) {
          triggerSyncForNewIntegration(savedIgIntegration).catch(() => {});
        }

        const savedThreadsIntegration = await storage.createOrUpdateIntegration(
          {
            userId,
            brandId,
            provider: "threads",
            category: "social_media",
            storeName: "Threads",
            storeUrl: `https://threads.net/@${igDetails.username}`,
            accountId: igAcc.id,
            accountName: igDetails.username,
            accessToken: pageAccessToken,
            pageId: selectedPage.id,
            isActive: true,
            syncEnabled: true,
            metadata: {
              fbPageId: selectedPage.id,
              igAccountId: igAcc.id,
              igUsername: igDetails.username,
              source: "facebook_callback",
            },
          },
        );

        // Trigger sync if inbox subscription is already active
        triggerSyncForNewIntegration(savedThreadsIntegration).catch(() => {});
      }

      // -----------------------------------------
      // 8️⃣ Redirect user
      // -----------------------------------------
      const redirectBase =
        origin === "onboarding" ? "/onboarding?step=4" : "/integrations";

      return res.redirect(redirectBase);
    } catch (error) {
      console.error("[ERROR] [FB Callback] Unexpected error");
      return res.redirect("/integrations?error=callback_failed");
    }
  });

  // =========================================================================
  // INSTAGRAM DIRECT OAUTH (Standalone Instagram API - not via Facebook)
  // =========================================================================
  app.get(
    "/api/integrations/instagram/connect",
    isAuthenticated,
    requireBrand,
    (req: any, res) => {
      const redirectUri = `${process.env.APP_URL}/api/integrations/instagram/callback`;
      const clientId = process.env.IG_APP_ID;

      if (!clientId) {
        return res
          .status(500)
          .send("Instagram Direct integration not configured");
      }

      const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_content_publish",
        "instagram_business_manage_insights",
      ].join(",");

      // Get origin from query params (onboarding or integrations)
      const origin = (req.query.origin as string) || "integrations";

      const statePayload = {
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
        origin, // Include origin for redirect after callback
      };

      const state = signOAuthState(statePayload);

      const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      res.redirect(authUrl);
    },
  );

  app.get("/api/integrations/instagram/callback", async (req, res) => {
    try {
      const { code, state, error: oauthError } = req.query;

      // Handle user-denied permissions
      if (oauthError) {
        return res.redirect("/integrations?error=user_denied");
      }
      if (!code) return res.status(400).send("Missing code");
      if (!state) return res.status(400).send("Missing OAuth state");

      // 1️⃣ Decode OAuth state
      let userId: string | null = null;
      let brandId: string | null = null;
      let origin: string = "integrations";

      try {
        const parsed = verifyOAuthState(state as string);
        if (!parsed) {
          return res.redirect("/integrations?error=invalid_state");
        }
        userId = (parsed as any).userId;
        brandId = (parsed as any).brandId;
        origin = (parsed as any).origin || "integrations";
      } catch {
        return res.redirect("/integrations?error=invalid_state");
      }

      if (!userId || !brandId) {
        return res.redirect("/integrations?error=invalid_state");
      }

      const redirect_uri = `${process.env.APP_URL}/api/integrations/instagram/callback`;

      // 2️⃣ Exchange CODE → Short-lived Access Token
      const tokenRes = await fetch(
        "https://api.instagram.com/oauth/access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            client_id: process.env.IG_APP_ID || "",
            client_secret: process.env.IG_APP_SECRET || "",
            grant_type: "authorization_code",
            redirect_uri: redirect_uri,
            code: code as string,
          }),
        },
      );
      const tokenData = await tokenRes.json();

      if (tokenData.error_type || tokenData.error_message) {
        return res
          .status(500)
          .redirect(`/integrations?error=token_failed`);
      }

      const shortLivedToken = tokenData.access_token;
      const igUserId = tokenData.user_id;

      // 3️⃣ Exchange for Long-Lived Token
      let longLivedToken = shortLivedToken;
      let expiresAt: Date | null = null;

      try {
        const longLivedRes = await fetch(
          `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${
            process.env.IG_APP_SECRET
          }&access_token=${shortLivedToken}`,
        );
        const longLivedData = await longLivedRes.json();
        if (longLivedData.access_token) {
          longLivedToken = longLivedData.access_token;
          expiresAt = longLivedData.expires_in
            ? dayjs().add(longLivedData.expires_in, "seconds").toDate()
            : null;
        }
      } catch (err) {
        console.warn("[Instagram Direct OAuth] Failed to exchange for long-lived token, using short-lived (1h expiry)");
        expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour fallback
      }

      // 4️⃣ Get Instagram user profile
      // IMPORTANT: The /me endpoint returns the Instagram Business Account ID (IGBA ID)
      // which is what webhooks use as recipient.id - this is different from token's user_id!
      let igUsername = `ig_user_${igUserId}`;
      let accountType = "BUSINESS";
      let mediaCount = 0;
      let igbaId = igUserId.toString();
      let appScopedId = igUserId.toString();

      try {
        // Try to get profile info - the 'id' field here is the IGBA ID used by webhooks
        const profileRes = await fetch(
          `https://graph.instagram.com/v24.0/me?fields=user_id,username&access_token=${longLivedToken}`,
        );
        const profileData = await profileRes.json();

        if (!profileData.error) {
          if (profileData.username) {
            igUsername = profileData.username;
          }
          // CRITICAL: Use profileData.id as the IGBA ID - this matches webhook recipient.id
          // profileData.user_id is the app-scoped IG user ID, NOT the IGBA ID
          if (profileData.id) {
            igbaId = profileData.id.toString();
            appScopedId = profileData.user_id?.toString() || igUserId.toString();
          }
        } else {
          // Fallback to token's user_id (less reliable for webhook matching)
        }
      } catch (profileErr) {
        // Continue with default values from token response
      }

      // 5️⃣ Check for duplicate integration (same account connected to another brand)
      const existingIntegration = await storage.checkDuplicateIntegration(
        igbaId.toString(),
        appScopedId.toString(),
        "instagram_direct",
        brandId, // Exclude current brand from check
      );

      if (existingIntegration) {
        const errorMsg = encodeURIComponent(
          `Esta cuenta de Instagram (@${igUsername}) ya está conectada a otra marca en la plataforma. Por favor usa una cuenta diferente o desconéctala primero de la otra marca.`,
        );
        if (origin === "onboarding") {
          return res.redirect(
            `/onboarding?step=4&error=duplicate&message=${errorMsg}`,
          );
        }
        return res.redirect(
          `/integrations?error=duplicate&message=${errorMsg}`,
        );
      }

      // 6️⃣ Save Instagram Direct Integration
      // Use IGBA ID for pageId (this is what webhooks use for recipient matching)
      const savedIntegration = await storage.createOrUpdateIntegration({
        userId,
        brandId,
        provider: "instagram_direct",
        category: "social_media",
        storeName: "Instagram Direct",
        storeUrl: `https://instagram.com/${igUsername}`,
        accountId: igbaId.toString(),
        accountName: igUsername,
        pageId: igbaId.toString(),
        accessToken: longLivedToken,
        expiresAt,
        isActive: true,
        syncEnabled: true,
        metadata: {
          igbaId: igbaId.toString(),
          appScopedId: appScopedId.toString(),
          igUsername,
          accountType,
          mediaCount,
          source: "instagram_direct_callback",
        },
      });

      // Trigger sync if inbox subscription is already active (for users who reconnect after paying)
      // This runs in the background (non-blocking)
      triggerSyncForNewIntegration(savedIntegration).catch(() => {});

      // 6️⃣ Redirect based on origin (onboarding or integrations)
      if (origin === "onboarding") {
        return res.redirect(`/onboarding?step=4&connected=instagram_direct`);
      }
      return res.redirect(`/integrations?connected=instagram_direct`);
    } catch (err) {
      console.error("[ERROR] Instagram callback error:", err);
      return res.redirect("/integrations?error=callback_failed");
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
      const whatsAppBusinessId = process.env.WHATSAPP_CONFIG_ID;
      // **Los scopes necesarios para gestionar WhatsApp Business (WABA)**
      const whatsapp_scopes = [
        "whatsapp_business_management",
        "whatsapp_business_messaging",
        "business_management",
        "pages_show_list",
      ].join(",");

      // Get origin from query params (onboarding or integrations)
      const origin = (req.query.origin as string) || "integrations";

      // Pass brandId in state along with userId and origin
      const state = JSON.stringify({
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
        origin, // Include origin for redirect after callback
      });

      // URL base del Embedded Signup
      const embeddedSignupUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&scope=${whatsapp_scopes}&state=${encodeURIComponent(state)}&response_type=code&config_id=${whatsAppBusinessId}`;

      // ^^^ El 'config_id' es CRUCIAL.

      res.redirect(embeddedSignupUrl);
    },
  );

  // =========================================================================
  // WHATSAPP QR CODE / COEXISTENCE FLOW
  // =========================================================================
  app.post(
    "/api/integrations/whatsapp/generate-qr",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { phoneNumber } = req.body;
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;

        if (!phoneNumber) {
          return res.status(400).json({ error: "Phone number is required" });
        }

        // For the QR code method, we need to guide users through the coexistence setup
        // This requires:
        // 1. User has WhatsApp Business App installed on their phone
        // 2. User goes through Embedded Signup to register the phone number with Cloud API
        // 3. During setup, they enable coexistence by scanning QR from their app

        // Since we can't generate a true device-linking QR without Meta's system token,
        // we'll provide a pairing flow that guides users through the process

        // Generate a unique pairing code for this session
        const pairingCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

        // Store the pairing session temporarily (in production, use Redis or DB)
        // For now, we'll return instructions and a pairing code

        // Generate QR code locally (no third-party service dependency)
        const waLink = `https://wa.me/${phoneNumber}`;
        const QRCode = await import("qrcode");
        const qrCodeUrl = await QRCode.toDataURL(waLink, { width: 200, margin: 2 });

        // Return both QR code and instructions
        res.json({
          success: true,
          phoneNumber,
          pairingCode,
          qrCodeUrl,
          instructions: {
            en: [
              "Open WhatsApp Business on your phone",
              "Go to Settings > Linked Devices",
              "Tap 'Link a Device'",
              "Complete the Facebook Business verification to connect",
            ],
            es: [
              "Abre WhatsApp Business en tu teléfono",
              "Ve a Configuración > Dispositivos vinculados",
              "Toca 'Vincular un dispositivo'",
              "Completa la verificación de Facebook Business para conectar",
            ],
          },
          note: "For full Cloud API access with coexistence, please use the Meta Signup option which includes QR code verification during the process.",
        });
      } catch (err) {
        console.error("[ERROR] WhatsApp QR generation error");
        res.status(500).json({
          error: "Failed to generate QR code",
        });
      }
    },
  );

  app.get("/api/integrations/whatsapp/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");

      // 0️⃣ State: recuperar userId, brandId y origin
      let userId: string | undefined;
      let brandId: string | undefined;
      let origin: string = "integrations";

      try {
        const parsedState = JSON.parse(decodeURIComponent(state as string));
        userId = parsedState.userId;
        brandId = parsedState.brandId;
        origin = parsedState.origin || "integrations";
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
        throw new Error(tokenData.error.message || "Error exchanging code");
      }

      const userAccessToken = tokenData.access_token as string;

      // 2️⃣ Usar debug_token para sacar WABA ID (Embedded Signup way)
      const debugRes = await fetch(
        `https://graph.facebook.com/v24.0/debug_token?input_token=${userAccessToken}&access_token=${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`,
      );
      const debugData = await debugRes.json();

      if (debugData.error) {
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

      // 3️⃣ Fallback opcional (por si algún día cambian granular_scopes)
      //    Dejé tu intento por /me y /me/businesses como backup, pero ya no es el camino principal.
      if (!wabaId) {
        try {
          const directRes = await fetch(
            `https://graph.facebook.com/v24.0/me?fields=whatsapp_business_account&access_token=${userAccessToken}`,
          );
          const directData = await directRes.json();

          wabaId = directData.whatsapp_business_account?.id || null;
        } catch (e) {
          // Legacy /me WABA check failed
        }

        if (!wabaId) {
          try {
            const businessAccountsRes = await fetch(
              `https://graph.facebook.com/v24.0/me/businesses?fields=id,name&access_token=${userAccessToken}`,
            );
            const businessAccountsData = await businessAccountsRes.json();

            const businessAccount = businessAccountsData.data?.[0];

            if (businessAccount?.id) {
              const wabaRes = await fetch(
                `https://graph.facebook.com/v24.0/${businessAccount.id}/owned_whatsapp_business_accounts?access_token=${userAccessToken}`,
              );
              const wabaData = await wabaRes.json();

              wabaId = wabaData.data?.[0]?.id || null;
            }
          } catch (e) {
            // Legacy /me/businesses fallback failed
          }
        }
      }

      if (!wabaId) {
        return res
          .status(400)
          .send("WhatsApp Business Account not linked or created.");
      }

      // 4️⃣ Obtener el número de teléfono asociado al WABA
      const phoneNumbersRes = await fetch(
        `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers?access_token=${userAccessToken}`,
      );
      const phoneData = await phoneNumbersRes.json();

      const phoneNumber = phoneData.data?.[0] || null;

      // 5️⃣ Check for duplicate integration (same WhatsApp account connected to another brand)
      const existingIntegration = await storage.checkDuplicateIntegration(
        wabaId,
        wabaId,
        "whatsapp",
        brandId, // Exclude current brand from check
      );

      if (existingIntegration) {
        const errorMsg = encodeURIComponent(
          `Esta cuenta de WhatsApp Business ya está conectada a otra marca en la plataforma. Por favor usa una cuenta diferente o desconéctala primero de la otra marca.`,
        );
        if (origin === "onboarding") {
          return res.redirect(
            `/onboarding?step=4&error=duplicate&message=${errorMsg}`,
          );
        }
        return res.redirect(
          `/integrations?error=duplicate&message=${errorMsg}`,
        );
      }

      // 6️⃣ Guardar la integración en tu storage
      const savedWhatsAppIntegration = await storage.createOrUpdateIntegration({
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

      // Trigger sync if inbox subscription is already active
      triggerSyncForNewIntegration(savedWhatsAppIntegration).catch(() => {});

      // Redirect based on origin (onboarding or integrations)
      if (origin === "onboarding") {
        res.redirect(`/onboarding?step=4&connected=whatsapp`);
      } else {
        res.redirect(`/integrations?connected=whatsapp`);
      }
    } catch (err: any) {
      console.error("[ERROR] WhatsApp callback error");
      res.redirect("/integrations?error=callback_failed");
    }
  });

  // =========================================================================
  // WHATSAPP BAILEYS - QR CODE CONNECTION (EXPERIMENTAL / UNOFFICIAL)
  // =========================================================================
  // ⚠️ WARNING: This uses Baileys library which is NOT an official Meta API.
  // Using unofficial methods may result in account bans.
  // ⚠️ NOTE: Baileys is disabled by default in production (Autoscale) because
  // it maintains persistent WebSocket connections incompatible with stateless instances.
  // Set ENABLE_BAILEYS=true to enable (use Reserved VM, not Autoscale).
  // =========================================================================

  const isProduction = process.env.NODE_ENV === "production";
  const baileysEnabled = process.env.ENABLE_BAILEYS === "true";

  // Import Baileys service dynamically to avoid issues if not installed
  let whatsappBaileysService: any = null;

  // Skip Baileys in production unless explicitly enabled
  if (isProduction && !baileysEnabled) {
    console.log(
      "📱 [Baileys] Skipping WhatsApp Baileys in production (Autoscale compatible mode)",
    );
    console.log(
      "📱 [Baileys] Set ENABLE_BAILEYS=true and use Reserved VM deployment to enable",
    );
  } else {
    try {
      const baileysModule = await import("./services/whatsappBaileys");
      whatsappBaileysService = baileysModule.whatsappBaileysService;
      // WhatsApp Baileys service loaded

      // Set up event listeners for WhatsApp Baileys
      whatsappBaileysService.on(
        "connected",
        async ({
          sessionKey,
          phoneNumber,
        }: {
          sessionKey: string;
          phoneNumber: string | null;
        }) => {
          try {
            const [userId, brandId] = sessionKey.split("_");

            // Check if integration already exists
            const existingIntegrations =
              await storage.getIntegrationsByBrandId(brandId);
            const existingBaileyIntegration = existingIntegrations.find(
              (i: any) =>
                i.provider === "whatsapp_baileys" && i.userId === userId,
            );

            if (existingBaileyIntegration) {
              // Update existing integration
              await storage.updateIntegration(existingBaileyIntegration.id, {
                isActive: true,
                accountName: phoneNumber || "WhatsApp (QR)",
                storeUrl: phoneNumber
                  ? `https://wa.me/${phoneNumber.replace(/\D/g, "")}`
                  : null,
                metadata: {
                  ...((existingBaileyIntegration.metadata as any) || {}),
                  phoneNumber,
                  connectedAt: new Date().toISOString(),
                },
              });
            } else {
              // Create new integration
              const newIntegration = await storage.createIntegration({
                userId,
                brandId,
                provider: "whatsapp_baileys",
                category: "messaging",
                storeName: "WhatsApp (QR)",
                storeUrl: phoneNumber
                  ? `https://wa.me/${phoneNumber.replace(/\D/g, "")}`
                  : null,
                accountId: phoneNumber?.replace(/\D/g, "") || sessionKey,
                accountName: phoneNumber || "WhatsApp (QR)",
                accessToken: sessionKey, // Use session key as token reference
                isActive: true,
                syncEnabled: true,
                metadata: {
                  phoneNumber,
                  connectionType: "baileys_qr",
                  connectedAt: new Date().toISOString(),
                },
              });
            }
          } catch (error) {
            console.error("[Baileys] Error handling connected event");
          }
        },
      );

      whatsappBaileysService.on(
        "message",
        async ({
          sessionKey,
          message,
        }: {
          sessionKey: string;
          message: any;
        }) => {
          try {
            const [userId, brandId] = sessionKey.split("_");

            // Find the WhatsApp Baileys integration for this brand
            const existingIntegrations =
              await storage.getIntegrationsByBrandId(brandId);
            const baileysIntegration = existingIntegrations.find(
              (i: any) =>
                i.provider === "whatsapp_baileys" && i.userId === userId,
            );

            if (!baileysIntegration) {
              return;
            }

            // Create/get conversation for this sender
            const senderJid = message.from;
            const senderId = senderJid
              .replace("@s.whatsapp.net", "")
              .replace("@g.us", "");
            const metaConversationId = `whatsapp_${senderId}`;

            const conversation = await storage.getOrCreateConversation({
              integrationId: baileysIntegration.id,
              brandId,
              userId,
              metaConversationId,
              platform: "whatsapp_baileys",
              contactName: message.fromName || senderId,
              lastMessage: message.text,
              lastMessageAt: message.timestamp,
            });

            // Save the message
            const savedMessage = await storage.createMessage({
              userId,
              integrationId: baileysIntegration.id,
              brandId,
              conversationId: conversation.id,
              platform: "whatsapp_baileys",
              metaMessageId: message.id,
              metaConversationId,
              senderId,
              recipientId: baileysIntegration.accountId || userId,
              contactName: message.fromName || senderId,
              textContent: message.text,
              direction: "inbound",
              timestamp: message.timestamp,
              metadata: {
                messageType: message.type,
                mediaUrl: message.mediaUrl || null,
              },
            } as any);

            // Increment unread count
            await storage.incrementUnreadCount(conversation.id);


            // Emit socket event for real-time updates
            if (io) {
              io.to(`brand:${brandId}`).emit("new_message", {
                conversationId: conversation.id,
                message: {
                  id: savedMessage.id,
                  text: message.text,
                  from: message.fromName || senderId,
                  timestamp: message.timestamp,
                  platform: "whatsapp_baileys",
                },
              });
            }
          } catch (error) {
            console.error("[Baileys] Error handling message event");
          }
        },
      );

      whatsappBaileysService.on(
        "disconnected",
        async ({ sessionKey }: { sessionKey: string }) => {
          try {
            const [userId, brandId] = sessionKey.split("_");

            // Update integration status
            const existingIntegrations =
              await storage.getIntegrationsByBrandId(brandId);
            const baileysIntegration = existingIntegrations.find(
              (i: any) =>
                i.provider === "whatsapp_baileys" && i.userId === userId,
            );

            if (baileysIntegration) {
              await storage.updateIntegration(baileysIntegration.id, {
                isActive: false,
                metadata: {
                  ...((baileysIntegration.metadata as any) || {}),
                  disconnectedAt: new Date().toISOString(),
                },
              });
            }
          } catch (error) {
            console.error("[Baileys] Error handling disconnected event");
          }
        },
      );


      // Restore any existing sessions on startup
      setTimeout(async () => {
        try {
          await whatsappBaileysService.restoreExistingSessions();
        } catch (error) {
          console.error("[Baileys] Error restoring sessions");
        }
      }, 2000); // Small delay to ensure routes are fully registered
    } catch (err) {
      // Baileys service not available
    }
  } // End of else block for Baileys enabled

  // Start WhatsApp QR connection via Baileys
  app.post(
    "/api/whatsapp-baileys/connect",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      if (!whatsappBaileysService) {
        return res.status(503).json({
          error: "WhatsApp QR service not available",
          message: "The Baileys service is not properly configured",
        });
      }

      try {
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;

        console.log(
          `📱 [Baileys] Starting connection for user ${userId}, brand ${brandId}`,
        );

        // Pass forceInit=true since this is a user-initiated action
        const result = await whatsappBaileysService.initSession(
          userId,
          brandId,
          true,
        );

        res.json({
          success: true,
          status: result.status,
          qrCode: result.qrCode,
          message:
            result.status === "already_connected"
              ? "WhatsApp already connected"
              : "Scan the QR code with your WhatsApp",
        });
      } catch (error) {
        console.error("[ERROR] [Baileys] Connection error:", error);
        res.status(500).json({
          error: "Failed to start WhatsApp connection",
        });
      }
    },
  );

  // Get WhatsApp Baileys connection status
  app.get(
    "/api/whatsapp-baileys/status",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      if (!whatsappBaileysService) {
        return res.status(503).json({
          error: "WhatsApp QR service not available",
          status: "unavailable",
        });
      }

      try {
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;

        const status = await whatsappBaileysService.getSessionStatus(
          userId,
          brandId,
        );

        res.json({
          success: true,
          ...status,
        });
      } catch (error) {
        console.error("[ERROR] [Baileys] Status check error:", error);
        res.status(500).json({
          error: "Failed to check WhatsApp status",
          status: "error",
        });
      }
    },
  );

  // Send message via WhatsApp Baileys
  app.post(
    "/api/whatsapp-baileys/send-message",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      if (!whatsappBaileysService) {
        return res.status(503).json({
          error: "WhatsApp QR service not available",
        });
      }

      try {
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;
        const { to, message } = req.body;

        if (!to || !message) {
          return res.status(400).json({
            error: "Missing required fields",
            message: "Both 'to' (phone number) and 'message' are required",
          });
        }

        const result = await whatsappBaileysService.sendMessage(
          userId,
          brandId,
          to,
          message,
        );

        if (result.success) {
          res.json({
            success: true,
            messageId: result.messageId,
            message: "Message sent successfully",
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error || "Failed to send message",
          });
        }
      } catch (error) {
        console.error("[ERROR] [Baileys] Send message error:", error);
        res.status(500).json({
          error: "Failed to send message",
        });
      }
    },
  );

  // Disconnect WhatsApp Baileys session
  app.post(
    "/api/whatsapp-baileys/disconnect",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      if (!whatsappBaileysService) {
        return res.status(503).json({
          error: "WhatsApp QR service not available",
        });
      }

      try {
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;

        const disconnected = await whatsappBaileysService.disconnect(
          userId,
          brandId,
        );

        res.json({
          success: disconnected,
          message: disconnected
            ? "WhatsApp disconnected successfully"
            : "No active session to disconnect",
        });
      } catch (error) {
        console.error("[ERROR] [Baileys] Disconnect error:", error);
        res.status(500).json({
          error: "Failed to disconnect WhatsApp",
        });
      }
    },
  );

  app.get("/api/integrations", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership.brandId;
      const brandIntegrations = await storage.getIntegrationsByBrandId(brandId);
      res.status(200).json(brandIntegrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  // Delete (disconnect) an integration
  app.delete(
    "/api/integrations/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { id } = req.params;
        const userId = req.user.id;
        const brandId = req.brandMembership.brandId;
        const userRole = req.brandMembership.role;

        // Only owners, admins, and editors can delete integrations
        const allowedRoles = ["owner", "admin", "editor"];
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({
            error: "Permission denied",
            message:
              "You need editor permissions or higher to disconnect integrations",
          });
        }

        // Verify the integration exists
        const integration = await storage.getIntegrationById(id);
        if (!integration) {
          return res.status(404).json({ error: "Integration not found" });
        }

        // Verify the integration belongs to the current brand context
        if (integration.brandId !== brandId) {
          return res.status(403).json({
            error: "Access denied",
            message: "This integration does not belong to the current brand",
          });
        }

        // Delete the integration
        const deleted = await storage.deleteIntegration(id, userId);
        if (deleted) {
          console.log(
            `✅ Integration ${id} (${integration.provider}) deleted for brand ${brandId} by user ${userId}`,
          );
          res.status(200).json({
            success: true,
            message: "Integration deleted successfully",
          });
        } else {
          res.status(500).json({ error: "Failed to delete integration" });
        }
      } catch (error) {
        console.error("[ERROR] Error deleting integration:", error);
        res.status(500).json({ error: "Failed to delete integration" });
      }
    },
  );

  // WhatsApp Templates - Fetch from Meta Graph API
  app.get(
    "/api/whatsapp-templates",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        // Get WhatsApp integration for this brand
        const integrations = await storage.getIntegrationsByBrandId(brandId);
        const whatsappIntegration = integrations.find(
          (i) => i.provider === "whatsapp" && i.isActive,
        );

        if (!whatsappIntegration) {
          return res.status(404).json({
            error: "WhatsApp integration not found",
            message: "Please connect your WhatsApp Business account first",
          });
        }

        if (
          !whatsappIntegration.accessToken ||
          !whatsappIntegration.accountId
        ) {
          return res.status(400).json({
            error: "Invalid WhatsApp integration",
            message: "WhatsApp integration is missing required credentials",
          });
        }

        // Fetch templates from Meta Graph API
        const wabaId = whatsappIntegration.accountId;
        const accessToken = whatsappIntegration.accessToken;

        const response = await fetch(
          `https://graph.facebook.com/v22.0/${wabaId}/message_templates?` +
            `fields=language,name,rejected_reason,status,category,sub_category,last_updated_time,components,quality_score&` +
            `limit=50&` +
            `access_token=${accessToken}`,
        );

        const data = await response.json();

        if (data.error) {
          console.error("[ERROR] Meta API error fetching templates:", data.error);
          return res.status(400).json({
            error: "Meta API error",
            message:
              data.error.message || "Failed to fetch templates from Meta",
          });
        }

        // Transform Meta response to match frontend format
        const templates = (data.data || []).map((template: any) => {
          // Extract header, body, footer from components
          const headerComponent = template.components?.find(
            (c: any) => c.type === "HEADER",
          );
          const bodyComponent = template.components?.find(
            (c: any) => c.type === "BODY",
          );
          const footerComponent = template.components?.find(
            (c: any) => c.type === "FOOTER",
          );
          const buttonsComponent = template.components?.find(
            (c: any) => c.type === "BUTTONS",
          );

          return {
            id: template.id,
            name: template.name,
            category: template.category || "UTILITY",
            language: template.language,
            status: template.status,
            rejectedReason: template.rejected_reason,
            headerType: headerComponent?.format,
            headerContent:
              headerComponent?.text ||
              headerComponent?.example?.header_handle?.[0],
            body: bodyComponent?.text || "",
            footer: footerComponent?.text,
            buttons: buttonsComponent?.buttons?.map((b: any) => ({
              type: b.type,
              text: b.text,
              url: b.url,
            })),
            qualityScore: template.quality_score?.score,
            lastUpdatedTime: template.last_updated_time,
            createdAt: template.last_updated_time,
          };
        });

        res.status(200).json({
          templates,
          paging: data.paging,
          total: templates.length,
        });
      } catch (error: any) {
        res.status(500).json({
          error: "Failed to fetch templates",
        });
      }
    },
  );

  // WhatsApp Templates - Send a template message
  app.post(
    "/api/whatsapp-templates/send",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const userId = req.user.id;
        const {
          phoneNumber,
          templateName,
          languageCode,
          components,
          templateBody,
        } = req.body;

        if (!phoneNumber || !templateName) {
          return res.status(400).json({
            error: "Missing required fields",
            message: "Phone number and template name are required",
          });
        }

        // Get WhatsApp integration for this brand
        const integrations = await storage.getIntegrationsByBrandId(brandId);
        const whatsappIntegration = integrations.find(
          (i) => i.provider === "whatsapp" && i.isActive,
        );

        if (!whatsappIntegration) {
          return res.status(404).json({
            error: "WhatsApp integration not found",
            message: "Please connect your WhatsApp Business account first",
          });
        }

        if (!whatsappIntegration.accessToken) {
          return res.status(400).json({
            error: "Invalid WhatsApp integration",
            message: "WhatsApp integration is missing access token",
          });
        }

        // Get phoneNumberId from metadata
        const metadata = whatsappIntegration.metadata as any;
        const phoneNumberId = metadata?.phoneNumberId;
        const displayPhoneNumber =
          metadata?.displayPhoneNumber || phoneNumberId;

        if (!phoneNumberId) {
          return res.status(400).json({
            error: "Missing phone number ID",
            message:
              "WhatsApp integration is missing phone number configuration",
          });
        }

        // Format phone number (remove any non-numeric characters except +)
        const formattedPhone = phoneNumber
          .replace(/[^\d+]/g, "")
          .replace(/^\+/, "");

        // Build template payload
        const templatePayload = {
          name: templateName,
          language: {
            code: languageCode || "en_US",
          },
          components: components || [],
        };

        // Send message via Meta Graph API
        const response = await fetch(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${whatsappIntegration.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: formattedPhone,
              type: "template",
              template: templatePayload,
            }),
          },
        );

        const data = await response.json();

        if (data.error) {
          console.error("[ERROR] Meta API error sending template:", data.error);
          return res.status(400).json({
            error: "Failed to send message",
            message: data.error.message || "Meta API error",
            details: data.error,
          });
        }

        console.log(`[OK] WhatsApp template sent to ${formattedPhone}:`, data);

        // Store message in database after successful send
        const metaMessageId = data.messages?.[0]?.id;
        const metaContactId = data.contacts?.[0]?.wa_id;

        if (metaMessageId) {
          try {
            // Use the resolved template body, or fall back to template name indicator
            const messageContent =
              templateBody && templateBody.trim()
                ? templateBody
                : `[Template: ${templateName}]`;

            // Build a unique conversation identifier using WhatsApp's pattern
            // Format: wa_{phoneNumberId}_{customerPhone} to ensure uniqueness per integration
            const conversationKey = `wa_${formattedPhone}`;

            // Get or create conversation for this phone number
            const conversation = await storage.getOrCreateConversation({
              integrationId: whatsappIntegration.id,
              brandId: brandId,
              userId: userId,
              metaConversationId: `${(whatsappIntegration?.metadata as any)?.phoneNumberId}_${metaContactId}`,
              platform: "whatsapp",
              contactName: formattedPhone, // Phone number as initial contact name
              lastMessage: messageContent,
              lastMessageAt: new Date(),
            });

            // Create the message record
            await storage.createMessage({
              userId: userId,
              integrationId: whatsappIntegration.id,
              brandId: brandId,
              conversationId: conversation.id,
              platform: "whatsapp",
              metaMessageId: metaMessageId,
              metaConversationId: conversationKey,
              senderId: displayPhoneNumber, // Business phone number
              recipientId: formattedPhone, // Customer phone number
              contactName: formattedPhone,
              textContent: messageContent,
              direction: "outbound",
              isRead: true, // Outbound messages are read by default
              timestamp: new Date(),
              rawPayload: {
                type: "template",
                templateName: templateName,
                languageCode: languageCode || "en_US",
                components: components || [],
                templateBody: templateBody, // Store original resolved body
                metaResponse: data,
              },
            });

            console.log(
              `✅ Template message stored in database: ${metaMessageId}`,
            );
          } catch (dbError: any) {
            // Log the error but don't fail the request - message was still sent
            console.error(
              "⚠️ Failed to store message in database:",
              dbError.message,
            );
          }
        }

        res.status(200).json({
          success: true,
          messageId: metaMessageId,
          to: formattedPhone,
        });
      } catch (error: any) {
        res.status(500).json({
          error: "Failed to send template",
        });
      }
    },
  );

  // Meta webhook verification (GET)
  app.get("/api/webhooks/meta", async (req, res) => {
    try {
      const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
      if (!VERIFY_TOKEN) {
        console.error("[Meta Webhook] META_VERIFY_TOKEN env var is not set");
        return res.sendStatus(403);
      }

      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[Meta Webhook] Verification successful");
        return res.status(200).send(challenge);
      } else {
        console.warn("[Meta Webhook] Verification failed - token mismatch");
        return res.sendStatus(403);
      }
    } catch (err) {
      console.error("[Meta Webhook] Verification error:", err);
      res.status(500).json({ error: "Meta webhook verification failed" });
    }
  });

  // Meta webhook event handler (POST) — with signature verification
  app.post("/api/webhooks/meta", async (req, res) => {
    try {
      const body = req.body;

      // Verify webhook signature
      const appSecret = process.env.FB_APP_SECRET;
      if (!appSecret) {
        if (process.env.NODE_ENV === "production") {
          return res.sendStatus(500);
        }
        // Dev only: skipping signature verification
      } else {
        const signature = req.headers["x-hub-signature-256"] as string;
        if (!signature) {
          return res.sendStatus(403);
        }
        const crypto = await import("crypto");
        // Use raw body buffer for accurate signature verification
        // (JSON.stringify may produce different byte output than the original payload)
        const bodyForSignature = (req as any).rawBody || Buffer.from(JSON.stringify(body));
        const expectedSignature = "sha256=" + crypto
          .createHmac("sha256", appSecret)
          .update(bodyForSignature)
          .digest("hex");
        if (signature !== expectedSignature) {
          return res.sendStatus(403);
        }
      }

      if (
        body.object === "page" ||
        body.object === "instagram" ||
        body.object === "whatsapp_business_account"
      ) {
        for (const entry of body.entry || []) {
          const events = entry.messaging || entry.changes || [];

          // ======================================================
          // 🔹 WHATSAPP (Lógica no modificada)
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
                  integration = await storage.findWhatsAppIntegrationByPhoneNumberId(phoneNumberId) || null;
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
                      brandId: integration.brandId,
                    };

                    const savedMessage =
                      await storage.createMessage(messageData);

                    // Increment unread count for inbound messages
                    await storage.incrementUnreadCount(conversation.id);

                    const io = app.get("io");
                    if (io && integration.brandId) {
                      io.to(`brand:${integration.brandId}`).emit(
                        "new_message",
                        {
                          provider: "whatsapp",
                          conversationId: metaConversationId,
                          metaConversationId,
                          dbConversationId: conversation.id,
                          message: savedMessage,
                          brandId: integration.brandId,
                        },
                      );
                    }
                  }
                }
              }
            }
          }

          // ======================================================
          // 🔹 INSTAGRAM DIRECT (via entry.changes with field: "messages")
          // ======================================================
          else if (body.object === "page" || body.object === "instagram") {
            // First, check for Instagram Direct messages via entry.changes structure
            for (const change of entry.changes || []) {
              if (change.field === "messages" && change.value?.message) {
                const value = change.value;
                const senderId = value.sender?.id;
                const recipientId = value.recipient?.id;
                const messageId = value.message?.mid;
                let messageText = value.message?.text || "";
                const timestamp = value.timestamp;

                // Detect story replies (user replied to one of our stories)
                const storyReply = value.message?.reply_to?.story;
                if (storyReply && !messageText) {
                  messageText = "[Story Reply]";
                } else if (storyReply && messageText) {
                  messageText = `[Story Reply] ${messageText}`;
                }

                // Detect story mentions (user mentioned us in their story)
                const storyMention = (value.message?.attachments || []).find(
                  (a: any) => a.type === "story_mention",
                );
                if (storyMention) {
                  messageText = messageText || "[Story Mention]";
                  if (!messageText.includes("[Story Mention]")) {
                    messageText = `[Story Mention] ${messageText}`;
                  }
                }

                // Detect share messages (user shared a post/reel)
                const shareAttachment = (value.message?.attachments || []).find(
                  (a: any) => a.type === "share",
                );
                if (shareAttachment && !messageText) {
                  messageText = "[Shared Post]";
                }

                // Handle attachments
                const attachments = value.message?.attachments || [];

                if (!senderId || !recipientId || !messageId) {
                  continue;
                }

                // PRIORITY 1: Check if there's an existing conversation for this metaConversationId
                const potentialMetaConversationId = `ig_${senderId}_${recipientId}`;
                const existingConversationByMeta =
                  await storage.findConversationByMetaConversationId(
                    potentialMetaConversationId,
                  );

                let integration;
                if (existingConversationByMeta) {
                  integration = await storage.getIntegrationById(
                    existingConversationByMeta.integrationId,
                  );
                }

                // PRIORITY 2: If no existing conversation, search for integration by pageId/accountId
                if (!integration) {
                  integration = await storage.findIntegrationByAccount(recipientId, "instagram") || null;
                }

                if (integration) {
                  const platform = "instagram_direct";
                  const accessToken = integration.accessToken;
                  const isOutbound =
                    senderId === integration.accountId ||
                    senderId === integration.pageId;

                  // For outbound messages, the conversation ID should use the recipientId as the contact
                  // For inbound messages, use senderId as the contact
                  const contactId = isOutbound ? recipientId : senderId;
                  let metaConversationId = `ig_${contactId}_${integration.accountId || integration.pageId}`;
                  // Fallback metaConversationId format for legacy conversations
                  const legacyMetaConversationId = `ig_${senderId}_${recipientId}`;

                  let contactName: string | null = null;
                  let contactProfilePicture: string | null = null;
                  let shouldFetchProfilePicture = !isOutbound; // Only fetch profile for inbound messages

                  // Find existing conversation by contactId (the real contact, not the business account)
                  let existingConversation =
                    await storage.findConversationBySenderId(
                      integration.id,
                      contactId,
                      null,
                    );

                  // Also try legacy format if not found
                  if (!existingConversation) {
                    existingConversation =
                      await storage.findConversationByMetaConversationId(
                        legacyMetaConversationId,
                      );
                  }

                  // Check if profile picture is already cached and recent (less than 7 days old)
                  // BUT still fetch if contactName is missing
                  let shouldFetchContactName =
                    !existingConversation?.contactName;

                  if (
                    existingConversation?.contactProfilePicture &&
                    existingConversation?.contactProfilePictureFetchedAt
                  ) {
                    const fetchedAt = new Date(
                      existingConversation.contactProfilePictureFetchedAt,
                    );
                    const sevenDaysAgo = new Date(
                      Date.now() - 7 * 24 * 60 * 60 * 1000,
                    );

                    if (fetchedAt > sevenDaysAgo) {
                      shouldFetchProfilePicture = false;
                      contactProfilePicture =
                        existingConversation.contactProfilePicture;
                      contactName = existingConversation.contactName;

                      // If we have cached picture but no name, we should still try to fetch the name
                      if (!contactName) {
                        shouldFetchContactName = true;
                      }
                    }
                  }

                  // If outbound (echo), preserve existing contact info - DO NOT fetch profile of the business account
                  if (isOutbound && existingConversation) {
                    contactName = existingConversation.contactName;
                    contactProfilePicture =
                      existingConversation.contactProfilePicture;
                  }

                  // Only fetch profile for INBOUND messages if we don't have recent data OR if name is missing
                  if (
                    (shouldFetchProfilePicture || shouldFetchContactName) &&
                    !isOutbound
                  ) {
                    try {
                      // First, try using conversation participants endpoint (more reliable for IG)
                      const convoParticipantsUrl = `https://graph.facebook.com/v24.0/${integration.accountId || integration.pageId}/conversations?platform=instagram&user_id=${contactId}&fields=participants&access_token=${accessToken}`;
                      const convoParticipantsRes =
                        await fetch(convoParticipantsUrl);
                      const convoParticipantsData =
                        await convoParticipantsRes.json();

                      if (
                        convoParticipantsData?.data?.[0]?.participants?.data
                      ) {
                        const participants =
                          convoParticipantsData.data[0].participants.data;
                        const userParticipant = participants.find(
                          (p: any) => p.id === contactId,
                        );

                        if (
                          userParticipant?.username ||
                          userParticipant?.name
                        ) {
                          contactName =
                            userParticipant.username || userParticipant.name;
                        }
                      }

                      // If still no name, try Instagram Graph API endpoint (graph.instagram.com)
                      if (!contactName) {
                        const igProfileUrl = `https://graph.instagram.com/v24.0/${contactId}?fields=name,profile_pic&access_token=${accessToken}`;
                        const igProfileRes = await fetch(igProfileUrl);
                        const igProfileData = await igProfileRes.json();

                        if (!igProfileData.error) {
                          if (igProfileData.name) {
                            contactName = igProfileData.name;
                          }
                          if (igProfileData.profile_pic) {
                            contactProfilePicture = igProfileData.profile_pic;
                          }
                        } else {
                          // Fallback to Facebook Graph API
                          const fbProfileUrl = `https://graph.facebook.com/v24.0/${contactId}?fields=name,profile_pic&access_token=${accessToken}`;
                          const fbProfileRes = await fetch(fbProfileUrl);
                          const fbProfileData = await fbProfileRes.json();

                          if (!fbProfileData.error) {
                            if (fbProfileData.name) {
                              contactName = fbProfileData.name;
                            }
                            if (fbProfileData.profile_pic) {
                              contactProfilePicture = fbProfileData.profile_pic;
                            }
                          }
                        }
                      }
                    } catch (profileErr) {
                      // Profile fetch failed, continue without profile data
                    }
                  }

                  // Re-find existing conversation by contactId (the real contact, not business account)
                  if (!existingConversation) {
                    existingConversation =
                      await storage.findConversationBySenderId(
                        integration.id,
                        contactId,
                        contactName,
                      );
                  }

                  let conversation;
                  if (existingConversation) {
                    // ✅ For outbound (echo), ONLY update lastMessage - DO NOT touch contactName
                    const updateData: any = {
                      lastMessage: messageText,
                      lastMessageAt: new Date(
                        parseInt(timestamp) * 1000 || Date.now(),
                      ),
                    };

                    // Only update contactName for INBOUND messages (from the customer)
                    if (!isOutbound && contactName) {
                      updateData.contactName = contactName;
                    }

                    // Only update profile picture and timestamp if we fetched a new one (only for inbound)
                    if (
                      !isOutbound &&
                      shouldFetchProfilePicture &&
                      contactProfilePicture
                    ) {
                      updateData.contactProfilePicture = contactProfilePicture;
                      updateData.contactProfilePictureFetchedAt = new Date();
                    }

                    conversation =
                      (await storage.updateConversationMetadata(
                        existingConversation.id,
                        updateData,
                      )) || existingConversation;
                  } else {
                    conversation = await storage.getOrCreateConversation({
                      integrationId: integration.id,
                      brandId: integration.brandId,
                      userId: integration.userId,
                      metaConversationId,
                      platform,
                      contactName: contactName ?? undefined,
                      contactProfilePicture: contactProfilePicture || undefined,
                      contactProfilePictureFetchedAt: contactProfilePicture
                        ? new Date()
                        : undefined,
                      lastMessage: messageText,
                      lastMessageAt: new Date(
                        parseInt(timestamp) * 1000 || Date.now(),
                      ),
                    });
                  }

                  // Check for duplicate message before saving
                  const existingMessage = await storage.findMessageByMetaId(
                    integration.id,
                    messageId,
                  );
                  if (existingMessage) {
                    continue;
                  }

                  // Save the message with correct direction
                  try {
                    // Determine text content
                    let textContent = messageText;
                    if (!textContent && attachments.length > 0) {
                      const firstAtt = attachments[0];
                      const info = getWebhookAttachmentInfo(firstAtt);
                      textContent = info.label;
                      if (attachments.length > 1) {
                        textContent += ` +${attachments.length - 1}`;
                      }
                    }

                    const savedMessage = await storage.createMessage({
                      userId: integration.userId,
                      brandId: integration.brandId,
                      integrationId: integration.id,
                      conversationId: conversation.id,
                      platform,
                      metaMessageId: messageId,
                      metaConversationId,
                      senderId,
                      recipientId,
                      contactName: isOutbound ? null : contactName, // Don't set contactName for outbound
                      textContent: textContent || "",
                      direction: isOutbound ? "outbound" : "inbound",
                      isRead: isOutbound, // Outbound messages are automatically read
                      timestamp: new Date(
                        parseInt(timestamp) * 1000 || Date.now(),
                      ),
                      rawPayload: change.value,
                    });

                    // Process and save attachments
                    if (attachments.length > 0) {
                      const attachmentsToInsert = [];

                      for (const att of attachments) {
                        const info = getWebhookAttachmentInfo(att);
                        if (!info.url) {
                          continue;
                        }

                        let finalUrl = info.url;
                        try {
                          const uploadRes = await cloudinary.uploader.upload(
                            info.url,
                            {
                              folder: "crm/attachments",
                              resource_type: "auto",
                            },
                          );
                          finalUrl = uploadRes.secure_url;
                        } catch (err) {
                          // Cloudinary upload failed, using original URL
                        }

                        attachmentsToInsert.push({
                          messageId: savedMessage.id,
                          type: info.type,
                          url: finalUrl,
                          mimeType: att.mime_type || null,
                          fileName: att.name || null,
                          fileSize:
                            typeof att.size === "number" ? att.size : null,
                        });
                      }

                      if (attachmentsToInsert.length > 0) {
                        await storage.bulkInsertMessageAttachments(
                          attachmentsToInsert,
                        );
                      }
                    }

                    // Only increment unread count for INBOUND messages
                    if (!isOutbound) {
                      await storage.incrementUnreadCount(conversation.id);
                    }

                    // Emit socket event to brand room only
                    const io = app.get("io");
                    const updatedConversation = await storage.getConversation(
                      conversation.id,
                    );
                    if (io && integration.brandId) {
                      io.to(`brand:${integration.brandId}`).emit(
                        "new_message",
                        {
                          provider: platform,
                          conversationId: metaConversationId,
                          metaConversationId,
                          dbConversationId: conversation.id,
                          message: savedMessage,
                          conversation: updatedConversation,
                          brandId: integration.brandId,
                        },
                      );
                    }
                  } catch (msgErr: any) {
                    if (msgErr.code === "23505") {
                      // Duplicate message detected via constraint, skipping
                    } else {
                      throw msgErr;
                    }
                  }
                }
              }
            }

            // Also handle Messenger-style messages via entry.messaging
            for (const event of events) {
              // Skip if this is an Instagram Direct message (already handled above)
              if (!event.message || !event.sender || !event.recipient) continue;

              const senderId = event.sender.id;
              const recipientId = event.recipient.id;
              const messageId = event.message.mid;
              let messageText = event.message.text || "";
              const searchPlatform =
                body.object === "instagram" ? "instagram" : "facebook";

              // Detect story replies
              const storyReply = event.message?.reply_to?.story;
              if (storyReply) {
                messageText = messageText
                  ? `[Story Reply] ${messageText}`
                  : "[Story Reply]";
              }

              // Detect story mentions
              const storyMention = (event.message.attachments || []).find(
                (a: any) => a.type === "story_mention",
              );
              if (storyMention) {
                messageText = messageText
                  ? `[Story Mention] ${messageText}`
                  : "[Story Mention]";
              }

              // Detect shared posts
              const shareAttachment = (event.message.attachments || []).find(
                (a: any) => a.type === "share",
              );
              if (shareAttachment && !messageText) {
                messageText = "[Shared Post]";
              }

              // Handle attachments
              const attachments = event.message.attachments || [];

              // PRIORITY 1: Check if there's an existing conversation for potential metaConversationIds
              const potentialMetaIds = [
                `ig_dm_${senderId}`,
                `ig_${senderId}_${recipientId}`,
                `${senderId}_${recipientId}`,
              ];
              let integration;

              for (const metaId of potentialMetaIds) {
                const existingConvo =
                  await storage.findConversationByMetaConversationId(metaId);
                if (existingConvo) {
                  integration = await storage.getIntegrationById(
                    existingConvo.integrationId,
                  );
                  if (integration) break;
                }
              }

              // PRIORITY 2: If no existing conversation, search for integration by pageId/accountId
              if (!integration) {
                integration = await storage.findIntegrationByAccount(
                  recipientId,
                  searchPlatform,
                );
              }

              if (integration) {
                const platform = integration.provider;
                const accessToken = integration.accessToken;
                const pageId = integration.pageId || recipientId;

                // ... [Resto de la lógica de Messenger-style (entry.messaging) NO modificada] ...
                let metaConversationId: string | null = null;
                let contactName: string | null = null;
                let contactProfilePicture: string | null = null;
                let shouldFetchProfilePicture = true;

                try {
                  const metaPlatformParam =
                    platform === "facebook" ? "messenger" : "instagram";
                  const convoRes = await fetch(
                    `https://graph.facebook.com/v24.0/${pageId}/conversations?platform=${metaPlatformParam}&user_id=${senderId}&access_token=${accessToken}`,
                  );
                  const convoData = await convoRes.json();
                  if (convoData?.data?.[0]?.id) {
                    metaConversationId = convoData.data[0].id;
                  } else {
                    // Standardized fallback format: ig_{contactId}_{accountId}
                    metaConversationId = `ig_${senderId}_${recipientId}`;
                  }
                } catch (err) {
                  metaConversationId = `ig_${senderId}_${recipientId}`;
                }

                // Find existing conversation FIRST to check if we already have profile picture
                let existingConversation =
                  await storage.findConversationBySenderId(
                    integration.id,
                    senderId,
                    null,
                  );

                // Check if profile picture is already cached and recent (less than 7 days old)
                if (
                  existingConversation?.contactProfilePicture &&
                  existingConversation?.contactProfilePictureFetchedAt
                ) {
                  const fetchedAt = new Date(
                    existingConversation.contactProfilePictureFetchedAt,
                  );
                  const sevenDaysAgo = new Date(
                    Date.now() - 7 * 24 * 60 * 60 * 1000,
                  );

                  if (fetchedAt > sevenDaysAgo) {
                    shouldFetchProfilePicture = false;
                    contactProfilePicture =
                      existingConversation.contactProfilePicture;
                    contactName = existingConversation.contactName;
                  }
                }

                // Only fetch profile if we don't have a recent one
                if (shouldFetchProfilePicture) {
                  try {
                    // For Instagram, try using the conversation participants endpoint first
                    if (platform === "instagram_direct") {
                      const convoInfoUrl = `https://graph.instagram.com/v24.0/${senderId}?fields=name,profile_pic&access_token=${accessToken}`;
                      const convoInfoRes = await fetch(convoInfoUrl);
                      const convoInfoData = await convoInfoRes.json();

                      if (!convoInfoData.error) {
                        if (convoInfoData.username || convoInfoData.name) {
                          contactName =
                            convoInfoData.username || convoInfoData.name;
                        }
                        if (convoInfoData.profile_pic) {
                          contactProfilePicture = convoInfoData.profile_pic;
                        }
                      }
                    } else {
                      // For Facebook Messenger, use direct profile endpoint
                      const profileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name,profile_pic&access_token=${accessToken}`;
                      const profileRes = await fetch(profileUrl);
                      const profileData = await profileRes.json();

                      if (!profileData.error) {
                        if (profileData.username || profileData.name) {
                          contactName =
                            profileData.username || profileData.name;
                        }
                        if (profileData.profile_pic) {
                          contactProfilePicture = profileData.profile_pic;
                        }
                      }
                    }
                  } catch (profileErr) {
                    // Profile fetch failed, continue without profile data
                  }
                }

                // Re-find existing conversation with contact name (for legacy compatibility)
                existingConversation = await storage.findConversationBySenderId(
                  integration.id,
                  senderId,
                  contactName,
                );

                let conversation;
                if (existingConversation) {
                  const updateData: any = {
                    metaConversationId:
                      metaConversationId ||
                      existingConversation.metaConversationId,
                    lastMessage: messageText,
                    lastMessageAt: new Date(event.timestamp || Date.now()),
                    contactName:
                      contactName || existingConversation.contactName,
                  };

                  // Only update profile picture and timestamp if we fetched a new one
                  if (shouldFetchProfilePicture && contactProfilePicture) {
                    updateData.contactProfilePicture = contactProfilePicture;
                    updateData.contactProfilePictureFetchedAt = new Date();
                  }

                  conversation =
                    (await storage.updateConversationMetadata(
                      existingConversation.id,
                      updateData,
                    )) || existingConversation;
                } else {
                  conversation = await storage.getOrCreateConversation({
                    integrationId: integration.id,
                    brandId: integration.brandId,
                    userId: integration.userId,
                    metaConversationId: metaConversationId || "",
                    platform,
                    contactName: contactName ?? undefined,
                    contactProfilePicture: contactProfilePicture || undefined,
                    contactProfilePictureFetchedAt: contactProfilePicture
                      ? new Date()
                      : undefined,
                    lastMessage: messageText,
                    lastMessageAt: new Date(event.timestamp || Date.now()),
                  });
                }

                // Check for duplicate message before saving
                const existingMessage = await storage.findMessageByMetaId(
                  integration.id,
                  messageId,
                );
                if (existingMessage) {
                  continue;
                }

                try {
                  // Determine text content
                  let textContent = messageText;
                  if (!textContent && attachments.length > 0) {
                    const firstAtt = attachments[0];
                    const info = getWebhookAttachmentInfo(firstAtt);
                    textContent = info.label;
                    if (attachments.length > 1) {
                      textContent += ` +${attachments.length - 1}`;
                    }
                  }

                  // Detect outbound (echo) messages: sender matches the business page/account
                  const isOutbound =
                    senderId === integration.pageId ||
                    senderId === integration.accountId ||
                    event.message?.is_echo === true;

                  const savedMessage = await storage.createMessage({
                    userId: integration.userId,
                    brandId: integration.brandId,
                    integrationId: integration.id,
                    conversationId: conversation.id,
                    platform,
                    metaMessageId: messageId,
                    metaConversationId,
                    senderId,
                    recipientId,
                    contactName,
                    textContent: textContent || "",
                    direction: isOutbound ? "outbound" : "inbound",
                    isRead: isOutbound ? true : false,
                    timestamp: new Date(event.timestamp || Date.now()),
                    rawPayload: event,
                  });

                  // Process and save attachments
                  if (attachments.length > 0) {
                    const attachmentsToInsert = [];

                    for (const att of attachments) {
                      const info = getWebhookAttachmentInfo(att);
                      if (!info.url) {
                        continue;
                      }

                      let finalUrl = info.url;
                      try {
                        const uploadRes = await cloudinary.uploader.upload(
                          info.url,
                          {
                            folder: "crm/attachments",
                            resource_type: "auto",
                          },
                        );
                        finalUrl = uploadRes.secure_url;
                      } catch (err) {
                        // Cloudinary upload failed, using original URL
                      }

                      attachmentsToInsert.push({
                        messageId: savedMessage.id,
                        type: info.type,
                        url: finalUrl,
                        mimeType: att.mime_type || null,
                        fileName: att.name || null,
                        fileSize:
                          typeof att.size === "number" ? att.size : null,
                      });
                    }

                    if (attachmentsToInsert.length > 0) {
                      await storage.bulkInsertMessageAttachments(
                        attachmentsToInsert,
                      );
                    }
                  }

                  // Only increment unread count for inbound messages
                  if (!isOutbound) {
                    await storage.incrementUnreadCount(conversation.id);
                  }

                  // Emit socket event to brand room only
                  const io = app.get("io");
                  const updatedConversation = await storage.getConversation(
                    conversation.id,
                  );
                  if (io && integration.brandId) {
                    io.to(`brand:${integration.brandId}`).emit("new_message", {
                      provider: platform,
                      conversationId: metaConversationId,
                      metaConversationId,
                      dbConversationId: conversation.id,
                      message: savedMessage,
                      conversation: updatedConversation,
                      brandId: integration.brandId,
                    });
                  }
                } catch (msgErr: any) {
                  if (msgErr.code === "23505") {
                    // Duplicate message detected via constraint, skipping
                  } else {
                    throw msgErr;
                  }
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
      console.error("[ERROR] Error processing Meta webhook event:", err);
      // CRITICAL: Always return 200 to Meta. Returning 500 causes retries (duplicate messages)
      // and repeated 500s will cause Meta to deactivate the webhook subscription.
      res.status(200).send("EVENT_RECEIVED");
    }
  });


  app.get("/api/:provider/conversations", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const { provider } = req.params;
      const userId = (req.user as any)?.id;
      const integrations = await storage.getIntegrations(userId);
      const integration = integrations.find((i: any) => i.provider === provider);

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
      } else if (provider === "instagram_direct") {
        // Instagram Direct conversations come from webhooks/sync, query local DB
        const brandId = req.brandMembership?.brandId;
        const dbConversations = brandId
          ? await storage.getConversationsByBrandId(brandId)
          : [];
        const igDirectConversations = dbConversations.filter(
          (c: any) => c.platform === "instagram_direct" || c.platform === "instagram",
        );
        return res.json({ conversations: igDirectConversations });
      } else if (provider === "whatsapp") {
        // WhatsApp conversations come from webhooks, so we query our local DB
        const brandId = req.brandMembership?.brandId;
        const dbConversations = brandId
          ? await storage.getConversationsByBrandId(brandId)
          : [];
        const whatsappConversations = dbConversations.filter(
          (c: any) => c.platform === "whatsapp",
        );
        return res.json({ conversations: whatsappConversations });
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
    requireBrand,
    async (req, res) => {
      try {
        const { provider, conversationId } = req.params;
        const userId = (req.user as any)?.id;

        const validProviders = [
          "facebook",
          "instagram",
          "instagram_direct",
          "threads",
          "whatsapp",
          "whatsapp_baileys",
        ];
        if (!validProviders.includes(provider)) {
          return res.status(400).json({ error: "Invalid provider" });
        }

        const integrations = await storage.getIntegrations(userId);
        let integration = integrations.find((i) => i.provider === provider);

        // For whatsapp_baileys, find the integration by platform
        if (!integration && provider === "whatsapp_baileys") {
          integration = integrations.find(
            (i) => i.provider === "whatsapp_baileys",
          );
        }

        if (!integration) {
          return res.status(404).json({
            error: `No ${provider} integration found for user ${userId}`,
          });
        }

        const { id: integrationId, accessToken, accountId } = integration;
        let messages: NormalizedMessage[] = [];

        const safeAccountId = accountId || '';
        switch (provider) {
          case "facebook":
            messages = await fetchFacebookMessagesFromDB(
              integrationId,
              conversationId,
              safeAccountId,
            );
            break;
          case "instagram":
          case "instagram_direct":
            messages = await fetchInstagramMessagesFromDB(
              integrationId,
              conversationId,
              safeAccountId,
            );
            break;
          case "threads":
            messages = await fetchThreadsMessagesFromDB(
              integrationId,
              conversationId,
              safeAccountId,
            );
            break;
          case "whatsapp":
            messages = await fetchWhatsappMessagesFromDB(
              integrationId,
              conversationId,
              safeAccountId,
            );
            break;
          case "whatsapp_baileys":
            // Fetch messages from DB for WhatsApp Baileys
            messages = await fetchWhatsappBaileysMessagesFromDB(
              integrationId,
              conversationId,
              safeAccountId,
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
          console.error(`[ERROR] Error fetching meta_conversation_id:`, error);
        }

        res.json({
          provider,
          accountId,
          messages,
          total: messages.length,
          metaConversationId,
        });
      } catch (err) {
        console.error("[ERROR] Unified messages fetch error:", err);
        res.status(500).json({
          error: "Failed to fetch messages",
        });
      }
    },
  );

  app.post(
    "/api/messages/:provider/:conversationId/mark-read",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { provider, conversationId } = req.params;
        const userId = (req.user as any)?.id;

        const integrations = await storage.getIntegrations(userId);
        const integration = integrations.find((i: any) => i.provider === provider);

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
        console.error("[ERROR] Error marking messages as read:", err);
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
        const brandId = req.brandMembership!.brandId;
        const userId = (req.user as any)?.id;
        const limitParam = req.query.limit;

        // Parse and validate limit parameter
        let limit: number | undefined;
        if (limitParam) {
          const parsed = parseInt(limitParam as string, 10);
          if (!isNaN(parsed) && parsed > 0) {
            limit = parsed;
          }
        }

        // Initial sync now only happens when inbox subscription is activated via webhook
        // See: server/stripe/webhookHandlers.ts handleCheckoutCompleted()

        const conversations = await storage.getConversationsByBrandId(
          brandId,
          limit,
        );

        console.log(
          `[Conversations] Retrieved ${conversations.length} for brand ${brandId}${limit ? ` (limit: ${limit})` : ""}`,
        );
        res.json({ conversations });
      } catch (err) {
        console.error("[ERROR] Error fetching conversations:", err);
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
        const brandId = req.brandMembership!.brandId;

        // Verify brand has access to this conversation
        const conversations = await storage.getConversationsByBrandId(brandId);
        const conversation = conversations.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        res.json({ conversation });
      } catch (err) {
        console.error("[ERROR] Error fetching conversation:", err);
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
        const brandId = req.brandMembership!.brandId;

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
        console.error("[ERROR] Error fetching conversation messages:", err);
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
        const brandId = req.brandMembership!.brandId;

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

        console.log(`[OK] Marked conversation ${id} as read`);
        res.json({ success: true });
      } catch (err) {
        console.error("[ERROR] Error marking conversation as read:", err);
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
        const brandId = req.brandMembership!.brandId;

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

        console.log(`[DONE] Updated conversation ${id} flag to: ${flag}`);
        res.json({ success: true, conversation: updated });
      } catch (err) {
        console.error("[ERROR] Error updating conversation flag:", err);
        res.status(500).json({ error: "Failed to update conversation flag" });
      }
    },
  );

  // ✅ NEW: Refresh contact name for a conversation (fetch from platform API)
  app.patch(
    "/api/conversations/:id/refresh-contact",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandMembership!.brandId;

        // Get conversation and verify access
        const conversationsList =
          await storage.getConversationsByBrandId(brandId);
        const conversation = conversationsList.find((c) => c.id === id);

        if (!conversation) {
          return res.status(404).json({ error: "Conversation not found" });
        }

        // Get the integration to access the platform API
        const integration = await storage.getIntegrationById(
          conversation.integrationId,
        );
        if (!integration) {
          return res.status(404).json({ error: "Integration not found" });
        }

        const accessToken = integration.accessToken;
        const platform = conversation.platform;

        // Extract sender ID from meta_conversation_id (format: pageId_senderId or similar)
        const metaConvoId = conversation.metaConversationId;
        let senderId: string | null = null;

        // Try to get sender ID from messages in this conversation
        const conversationMessages = await storage.getConversationMessages(id);
        const inboundMessage = conversationMessages.find(
          (m) => m.direction === "inbound",
        );
        if (inboundMessage) {
          senderId = inboundMessage.senderId;
        }

        if (!senderId) {
          // Fallback: parse from meta_conversation_id
          const parts = metaConvoId.split("_");
          if (parts.length >= 2) {
            senderId = parts[parts.length - 1]; // Last part is usually the sender ID
          }
        }

        if (!senderId) {
          return res
            .status(400)
            .json({ error: "Could not determine sender ID" });
        }

        console.log(
          `🔄 Refreshing contact name for conversation ${id}, sender: ${senderId}, platform: ${platform}`,
        );

        let contactName: string | null = null;

        try {
          if (platform === "instagram_direct" || platform === "instagram") {
            // Try Instagram Graph API first
            const profileUrl = `https://graph.instagram.com/v24.0/${senderId}?fields=name&access_token=${accessToken}`;
            console.log(`[MOBILE] Fetching Instagram profile for: ${senderId}`);

            const profileRes = await fetch(profileUrl);
            const profileData = await profileRes.json();

            if (
              !profileData.error &&
              (profileData.username || profileData.name)
            ) {
              contactName = profileData.username || profileData.name;
              console.log(`[OK] Got Instagram contact name: ${contactName}`);
            } else if (profileData.error) {
              console.warn(
                `⚠️ Instagram API error:`,
                profileData.error.message,
              );

              // Fallback: Try Facebook Graph API
              const fbProfileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name&access_token=${accessToken}`;
              const fbProfileRes = await fetch(fbProfileUrl);
              const fbProfileData = await fbProfileRes.json();

              if (
                !fbProfileData.error &&
                (fbProfileData.name || fbProfileData.username)
              ) {
                contactName = fbProfileData.name || fbProfileData.username;
                console.log(
                  `✅ Got contact name from FB Graph: ${contactName}`,
                );
              }
            }
          } else if (platform === "facebook") {
            // Facebook Messenger - use Facebook Graph API
            const fbProfileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name,first_name,last_name&access_token=${accessToken}`;
            console.log(`[MOBILE] Fetching Facebook profile for: ${senderId}`);

            const fbProfileRes = await fetch(fbProfileUrl);
            const fbProfileData = await fbProfileRes.json();

            if (!fbProfileData.error && fbProfileData.name) {
              contactName = fbProfileData.name;
              console.log(`[OK] Got Facebook contact name: ${contactName}`);
            }
          } else if (platform === "whatsapp") {
            // WhatsApp - contact name usually comes from webhook, can't fetch via API
            // Use phone number as fallback
            contactName = senderId.startsWith("+") ? senderId : `+${senderId}`;
            console.log(`[MOBILE] Using WhatsApp number as contact: ${contactName}`);
          }
        } catch (apiErr) {
 console.warn(` Error fetching profile:`, apiErr);
        }

        if (contactName) {
          // Update the conversation with the new contact name
          const updated = await storage.updateConversationMetadata(id, {
            contactName,
          });
          console.log(
            `✅ Updated contact name for conversation ${id}: ${contactName}`,
          );
          res.json({ success: true, contactName, conversation: updated });
        } else {
          res.json({
            success: false,
            message: "Could not fetch contact name from platform API",
          });
        }
      } catch (err) {
        console.error("[ERROR] Error refreshing contact name:", err);
        res.status(500).json({ error: "Failed to refresh contact name" });
      }
    },
  );

  // ✅ NEW: Bulk refresh contact names for all conversations with missing names
  app.post(
    "/api/conversations/refresh-all-contacts",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const brandId = req.brandMembership!.brandId;

        // Get all conversations for the brand
        const conversationsList =
          await storage.getConversationsByBrandId(brandId);

        // Filter conversations without contact names
        const conversationsToUpdate = conversationsList.filter(
          (c) => !c.contactName || c.contactName === "Contact",
        );

        console.log(
          `🔄 Found ${conversationsToUpdate.length} conversations without contact names`,
        );

        const results: {
          id: string;
          contactName: string | null;
          success: boolean;
        }[] = [];

        for (const conversation of conversationsToUpdate) {
          try {
            const integration = await storage.getIntegrationById(
              conversation.integrationId,
            );
            if (!integration) continue;

            const accessToken = integration.accessToken;
            const platform = conversation.platform;

            // Get sender ID from messages
            const conversationMessages = await storage.getConversationMessages(
              conversation.id,
            );
            const inboundMessage = conversationMessages.find(
              (m) => m.direction === "inbound",
            );
            let senderId = inboundMessage?.senderId;

            if (!senderId) {
              const parts = conversation.metaConversationId.split("_");
              if (parts.length >= 2) {
                senderId = parts[parts.length - 1];
              }
            }

            if (!senderId) {
              results.push({
                id: conversation.id,
                contactName: null,
                success: false,
              });
              continue;
            }

            let contactName: string | null = null;

            if (platform === "instagram_direct" || platform === "instagram") {
              const profileUrl = `https://graph.instagram.com/v24.0/${senderId}?fields=name&access_token=${accessToken}`;
              const profileRes = await fetch(profileUrl);
              const profileData = await profileRes.json();

              if (
                !profileData.error &&
                (profileData.username || profileData.name)
              ) {
                contactName = profileData.username || profileData.name;
              } else if (profileData.error) {
                // Fallback to Facebook Graph API
                const fbProfileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name&access_token=${accessToken}`;
                const fbProfileRes = await fetch(fbProfileUrl);
                const fbProfileData = await fbProfileRes.json();

                if (
                  !fbProfileData.error &&
                  (fbProfileData.name || fbProfileData.username)
                ) {
                  contactName = fbProfileData.name || fbProfileData.username;
                }
              }
            } else if (platform === "facebook") {
              const fbProfileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name,first_name,last_name&access_token=${accessToken}`;
              const fbProfileRes = await fetch(fbProfileUrl);
              const fbProfileData = await fbProfileRes.json();

              if (!fbProfileData.error && fbProfileData.name) {
                contactName = fbProfileData.name;
              }
            }

            if (contactName) {
              await storage.updateConversationMetadata(conversation.id, {
                contactName,
              });
              console.log(`[OK] Updated: ${conversation.id} -> ${contactName}`);
              results.push({ id: conversation.id, contactName, success: true });
            } else {
              results.push({
                id: conversation.id,
                contactName: null,
                success: false,
              });
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (err) {
            console.error(
              `en� Error updating conversation ${conversation.id}:`,
              err,
            );
            results.push({
              id: conversation.id,
              contactName: null,
              success: false,
            });
          }
        }

        const successCount = results.filter((r) => r.success).length;
        console.log(
          `✅ Refreshed ${successCount}/${conversationsToUpdate.length} contact names`,
        );

        res.json({
          success: true,
          total: conversationsToUpdate.length,
          updated: successCount,
          results,
        });
      } catch (err) {
        console.error("[ERROR] Error bulk refreshing contact names:", err);
        res.status(500).json({ error: "Failed to refresh contact names" });
      }
    },
  );

  // Inbox statistics — efficient SQL aggregation (no N+1)
  app.get(
    "/api/inbox/stats",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership!.brandId;
        const { conversations, messages } = await import("@shared/schema");
        const { sql, count, sum } = await import("drizzle-orm");

        // Single query: aggregate conversation stats
        const convoStats = await db
          .select({
            conversationCount: count(),
            totalUnread: sum(conversations.unreadCount),
            urgentCount: sql<number>`count(*) filter (where ${conversations.flag} = 'important')`,
          })
          .from(conversations)
          .where(eq(conversations.brandId, brandId));

        // Single query: count total messages
        const msgStats = await db
          .select({ totalMessages: count() })
          .from(messages)
          .where(eq(messages.brandId, brandId));

        const stats = convoStats[0] || { conversationCount: 0, totalUnread: 0, urgentCount: 0 };
        const totalMessages = msgStats[0]?.totalMessages || 0;

        res.json({
          totalMessages,
          unread: Number(stats.totalUnread) || 0,
          urgent: Number(stats.urgentCount) || 0,
          avgResponseTime: "N/A",
          conversationCount: Number(stats.conversationCount) || 0,
        });
      } catch (err) {
        console.error("[ERROR] Error fetching inbox stats:", err);
        res.status(500).json({ error: "Failed to fetch inbox stats" });
      }
    },
  );

  // ✅ NEW: Unified aggregation endpoint - Get ALL messages from ALL connected providers
  app.get(
    "/api/conversations/messages/all",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const userId = (req.user as any)?.id;
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
                // Initial sync now only happens when inbox subscription is activated via webhook
                // See: server/stripe/webhookHandlers.ts handleCheckoutCompleted()

                // Read messages from your local database
                console.log(
                  `💾 [${provider.toUpperCase()}] Fetching messages from local database`,
                );
                const dbMessages = await storage.getMessagesByIntegration(
                  integration.id,
                );

                const localMessages = dbMessages.map(
                  (m) => ({
                    id: m.metaMessageId,
                    conversationId:
                      m.direction === "inbound" ? m.senderId : m.recipientId,
                    metaConversationId: m.metaConversationId,
                    text: m.textContent || "",
                    imageUrl: null as string | null,
                    from:
                      m.direction === "outbound"
                        ? "You"
                        : m.contactName || "User",
                    fromId: m.senderId,
                    created_time: m.timestamp.toISOString(),
                    provider: provider as string,
                    accountId: accountId ?? undefined,
                  }),
                ) as NormalizedMessage[];

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
                      accountId || '',
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
              accountId: accountId ?? undefined,
            }));

            allMessages.push(...(providerMessages as NormalizedMessage[]));
            successfulProviders.push(provider);
          } else if (result.status === "rejected") {
 console.error(" Task rejected:", result.reason);
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
        console.error("[ERROR] Unified aggregation error:", err);
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
        const userId = (req.user as any)?.id;
        const brandId = req.brandMembership!.brandId;
        const messageConversationId = req.body.conversationId;
        const { content, attachmentUrl, attachmentType } = req.body;

        console.log("\n=============================");
        if (!content?.trim() && !attachmentUrl) {
          return res.status(400).json({ error: "Message content or attachment is required" });
        }

        const integrations = await storage.getIntegrationsByBrandId(brandId);

        // For Instagram, also check instagram_direct provider (conversations may have old platform value)
        let integration = integrations.find((i) => i.provider === provider);

        if (!integration && provider === "instagram") {
          integration = integrations.find((i) => i.provider === "instagram");

          if (integration) {
 console.log(" Using Instagram Business integration");
          } else {
            // If not found, fallback to Facebook integration (they contain IG Business linkage)
            integration = integrations.find((i) => i.provider === "facebook");
            if (integration) {
              console.log(
                "✔️ Using Facebook integration for Instagram messaging",
              );
            }
          }
        }

        if (!integration) {
          console.warn(
            `⚠️ No ${provider} integration found for brand ${brandId}`,
          );
          return res
            .status(404)
            .json({ error: `No ${provider} integration found for brand` });
        }

        // Use the actual provider from the integration for subsequent logic
        const actualProvider = integration.provider;

        let url, payload, recipientId, metaConversationId;
        let apiResponse;

        // =========================================================
        // 🟦 FACEBOOK
        // =========================================================
        if (provider === "facebook") {
          console.log(`[CHAT] [Facebook] Sending message to ${conversationId}`);

          // 1️⃣ Obtener Page ID desde el token
          const pageInfoRes = await fetch(
            `https://graph.facebook.com/v24.0/me?access_token=${integration.accessToken}`,
          );
          const pageInfo = await pageInfoRes.json();
          const pageId = pageInfo.id;

          if (!pageId)
            throw new Error("Could not get Page ID from token.");

          console.log(`[Meta API] Page ID obtained: ${pageId}`);

          // 2️⃣ Resolver meta_conversation_id
          metaConversationId = conversationId;

          // Check if conversationId is a UUID (our internal conversation ID)
          const isUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              conversationId,
            );

          if (isUUID) {
            // Fetch conversation directly from DB to get its metaConversationId
            console.log(
              "🔄 Conversation ID es UUID interno, buscando en DB...",
            );
            const conversation = await storage.getConversation(conversationId);

            if (conversation?.metaConversationId) {
              metaConversationId = conversation.metaConversationId;
              console.log(
                `✅ Mapeado a meta_conversation_id: ${metaConversationId}`,
              );
            } else {
              console.warn(
                "⚠️ No se encontró metaConversationId en la conversación.",
              );
            }
          } else if (!conversationId.startsWith("t_")) {
            // Legacy fallback: try to find via messages
            console.log(
              "🔄 Conversation ID parece un userId, buscando meta_conversation_id...",
            );

            const localMsg = await storage.findMessageByUserAndRecipient(
              userId,
              integration.id,
              conversationId,
            );

            if ((localMsg as any)?.metaConversationId) {
              metaConversationId = (localMsg as any).metaConversationId;
              console.log(
                `Mapeado a meta_conversation_id: ${metaConversationId}`,
              );
            } else {
 console.warn(" No se encontró meta_conversation_id asociado.");
            }
          }

          // 3️⃣ Intentar obtener destinatario desde Meta
          let messagesData: any = {};
          try {
            const res = await fetch(
              `https://graph.facebook.com/v24.0/${metaConversationId}/messages?fields=from,to,created_time&limit=1&access_token=${integration.accessToken}`,
            );
            messagesData = await res.json();
          } catch (e) {
 console.warn("[Messages] Error fetching messages:", e);
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
 console.log(` Recipient ID (Meta API): ${recipientId}`);
          }

          // 4️⃣ Fallback local si no se pudo determinar destinatario
          if (!recipientId) {
            const localMessages = await storage.findMessagesByConversation(
              userId,
              integration.id,
              metaConversationId,
            );

            const inboundMsg = localMessages?.find(
              (m: any) => m.direction === "inbound" && m.senderId !== pageId,
            );

            if (inboundMsg) {
              recipientId = (inboundMsg as any).senderId;
 console.log(` Recipient ID (fallback DB): ${recipientId}`);
            } else {
              return res.status(400).json({
                error:
                  "Could not determine recipient (no messages found in Meta API or local DB)",
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

          console.log("[OK] [Facebook] Payload prepared");
        }

        // =========================================================
        // 🟣 INSTAGRAM / THREADS (via Facebook)
        // =========================================================
        else if (
          actualProvider === "instagram" ||
          actualProvider === "threads"
        ) {
          console.log(
            `💬 [Instagram/Threads] Sending message to conversation ${conversationId}`,
          );

          const pageId = integration.pageId;
          if (!pageId)
            throw new Error(
              "No Page ID found for this Instagram account",
            );

          console.log(`🆔 Page ID vinculado: ${pageId}`);

          // Resolver meta_conversation_id
          metaConversationId = conversationId;

          // Check if conversationId is a UUID (our internal conversation ID)
          const isIgUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              conversationId,
            );

          if (isIgUUID) {
            console.log(
              "🔄 [IG] Conversation ID es UUID interno, buscando en DB...",
            );
            const igConversation =
              await storage.getConversation(conversationId);

            if (igConversation?.metaConversationId) {
              metaConversationId = igConversation.metaConversationId;
              console.log(
                `✅ [IG] Mapeado a meta_conversation_id: ${metaConversationId}`,
              );
            } else {
              console.warn(
                "⚠️ [IG] No se encontró metaConversationId en la conversación.",
              );
            }
          }

          // Obtener destinatario
          const convoRes = await fetch(
            `https://graph.facebook.com/v24.0/${metaConversationId}?fields=participants&access_token=${integration.accessToken}`,
          );
          const convoData = await convoRes.json();

          const participants = convoData.participants?.data || [];
          recipientId = participants.find(
            (p: any) => p.id !== pageId && p.id !== integration.accountId,
          )?.id;

          if (!recipientId)
            return res
              .status(400)
              .json({ error: "Could not determine Instagram recipient" });

 console.log(` Recipient ID (IG): ${recipientId}`);

          // Build payload — supports text or attachment
          url = `https://graph.facebook.com/v24.0/${pageId}/messages`;
          if (attachmentUrl && (attachmentType === "image" || attachmentType === "audio" || attachmentType === "video" || attachmentType === "file")) {
            payload = {
              recipient: { id: recipientId },
              message: {
                attachment: {
                  type: attachmentType === "file" ? "file" : attachmentType,
                  payload: { url: attachmentUrl, is_reusable: true },
                },
              },
            };
          } else {
            payload = {
              recipient: { id: recipientId },
              message: { text: content },
            };
          }

          console.log("[OK] [Instagram] Payload final:", JSON.stringify(payload).substring(0, 200));
        }

        // =========================================================
        // 🟪 INSTAGRAM DIRECT (via Instagram Login API)
        // =========================================================
        else if (actualProvider === "instagram_direct") {
          console.log(
            `💬 [Instagram Direct] Sending message to conversation ${conversationId}`,
          );

          // Instagram Direct uses the IGBA ID (accountId) for messaging
          const igbaId = integration.accountId;
          if (!igbaId)
            throw new Error(
              "No Instagram Business Account ID found",
            );

          console.log(`🆔 IGBA ID: ${igbaId}`);

          // Resolver meta_conversation_id
          metaConversationId = conversationId;

          // Check if conversationId is a UUID (our internal conversation ID)
          const isIgDirectUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              conversationId,
            );

          if (isIgDirectUUID) {
            console.log(
              "🔄 [IG Direct] Conversation ID es UUID interno, buscando en DB...",
            );
            const igDirectConvo = await storage.getConversation(conversationId);

            if (igDirectConvo?.metaConversationId) {
              metaConversationId = igDirectConvo.metaConversationId;
              console.log(
                `✅ [IG Direct] Mapeado a meta_conversation_id: ${metaConversationId}`,
              );
            } else {
              console.warn(
                "⚠️ [IG Direct] No se encontró metaConversationId en la conversación.",
              );
            }
          }

          // Extract recipient ID from metaConversationId
          // Formats can be:
          // - "ig_dm_2041846339885995" (ig_dm_recipientId)
          // - "17841458433478265_2041846339885995" (igbaId_recipientId)
          const parts = metaConversationId.split("_");
          if (parts.length >= 2) {
            // The recipient ID is the LAST part (handles both formats)
            recipientId = parts[parts.length - 1];
            console.log(
              `📍 Recipient ID extracted from conversation ID: ${recipientId}`,
            );
          } else {
            // Fallback: try to get from local messages
            console.log(
              "⚠️ Could not extract recipient from conversation ID, trying local DB...",
            );
            const localMessages = await storage.findMessagesByConversation(
              userId,
              integration.id,
              metaConversationId,
            );

            const inboundMsg = localMessages?.find(
              (m) => m.direction === "inbound" && m.senderId !== igbaId,
            );

            if (inboundMsg?.senderId) {
              recipientId = inboundMsg.senderId;
 console.log(` Recipient ID (fallback DB): ${recipientId}`);
            } else {
              return res.status(400).json({
                error:
                  "Could not determine Instagram Direct recipient",
              });
            }
          }

 console.log(` Recipient ID (IG Direct): ${recipientId}`);

          // Instagram Direct uses /me/messages endpoint with Bearer token
          url = `https://graph.instagram.com/v24.0/me/messages`;

          // Build payload — supports text or attachment
          if (attachmentUrl && attachmentType === "image") {
            payload = {
              recipient: JSON.stringify({ id: recipientId }),
              message: JSON.stringify({
                attachment: {
                  type: "image",
                  payload: { url: attachmentUrl },
                },
              }),
            };
          } else if (attachmentUrl && (attachmentType === "audio" || attachmentType === "video" || attachmentType === "file")) {
            payload = {
              recipient: JSON.stringify({ id: recipientId }),
              message: JSON.stringify({
                attachment: {
                  type: attachmentType === "file" ? "file" : attachmentType,
                  payload: { url: attachmentUrl },
                },
              }),
            };
          } else {
            payload = {
              recipient: JSON.stringify({ id: recipientId }),
              message: JSON.stringify({ text: content }),
            };
          }

          console.log("[OK] [Instagram Direct] Payload prepared");
          console.log(
            "✅ [Instagram Direct] Using Authorization Bearer header",
          );
        }

        // =========================================================
        // 🟩 WHATSAPP
        // =========================================================
        else if (actualProvider === "whatsapp") {
          console.log(`[CHAT] [WhatsApp] Sending message to ${conversationId}`);
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
            (integration.metadata as any)?.phoneNumberId || integration.accountId;
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
          console.log("[OK] [WhatsApp] Payload prepared");
        }

        // =========================================================
        // 📱 WHATSAPP BAILEYS (QR CODE)
        // =========================================================
        else if (actualProvider === "whatsapp_baileys") {
          console.log(
            `💬 [WhatsApp Baileys] Sending message to ${conversationId}`,
          );

          // Extract phone number from conversationId (format: whatsapp_5217712409254)
          const parts = conversationId.split("_");
          let phoneNumber = conversationId;
          if (parts.length >= 2 && parts[0] === "whatsapp") {
            phoneNumber = parts.slice(1).join("_");
          }

          console.log(`[MOBILE] [WhatsApp Baileys] Phone number: ${phoneNumber}`);

          if (!whatsappBaileysService) {
            return res
              .status(503)
              .json({ error: "WhatsApp QR service not available" });
          }

          // Send message using Baileys service
          const sendResult = await whatsappBaileysService.sendMessage(
            userId,
            brandId,
            phoneNumber,
            content,
          );

          if (!sendResult.success) {
            console.error(
              `❌ [WhatsApp Baileys] Send error:`,
              sendResult.error,
            );
            return res
              .status(400)
              .json({ error: sendResult.error || "Failed to send message" });
          }

          console.log(
            `✅ [WhatsApp Baileys] Message sent, ID: ${sendResult.messageId}`,
          );

          // Get or create conversation
          metaConversationId = conversationId.startsWith("whatsapp_")
            ? conversationId
            : `whatsapp_${phoneNumber}`;
          recipientId = phoneNumber;

          // Save message to database
          const conversation = await storage.getOrCreateConversation({
            integrationId: integration.id,
            brandId,
            userId,
            metaConversationId,
            platform: "whatsapp_baileys",
            lastMessage: content,
            lastMessageAt: new Date(),
          });

          await storage.createMessage({
            userId,
            integrationId: integration.id,
            brandId,
            conversationId: conversation.id,
            platform: "whatsapp_baileys",
            metaMessageId: sendResult.messageId || `sent_${Date.now()}`,
            metaConversationId,
            senderId: integration.accountId || userId,
            recipientId: phoneNumber,
            contactName: null,
            textContent: content,
            direction: "outbound",
            timestamp: new Date(),
          });

          // Emit socket event for real-time update
          if (io) {
            io.to(`brand:${brandId}`).emit("new_message", {
              conversationId: conversation.id,
              message: {
                id: sendResult.messageId,
                text: content,
                from: "You",
                timestamp: new Date().toISOString(),
                platform: "whatsapp_baileys",
                direction: "outbound",
              },
            });
          }

          return res.json({
            success: true,
            messageId: sendResult.messageId,
            provider: "whatsapp_baileys",
          });
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
        console.log("[Meta API] Sending message:");
 console.log(" URL:", url);
 console.log(" Payload:", JSON.stringify(payload, null, 2));

        let response;

        // Instagram Direct uses Authorization header instead of access_token param
        if (actualProvider === "instagram_direct") {
          console.log(
            "🔐 Using Authorization Bearer header for Instagram Direct",
          );
          response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${integration.accessToken}`,
            },
            body: JSON.stringify(payload),
          });
        } else {
          // Other providers use access_token query parameter
          response = await fetch(
            `${url}?access_token=${integration.accessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );
        }

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
            platform: actualProvider,
            metaMessageId: messageId,
            metaConversationId,
            senderId: integration.accountId || '',
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
 console.log(` meta_conversation_id: ${metaConversationId}`);

          // =========================================================
          // 📝 UPDATE CONVERSATION lastMessage and lastMessageAt
          // =========================================================
          if (messageConversationId) {
            await storage.updateConversationMetadata(messageConversationId, {
              lastMessage: content,
              lastMessageAt: new Date(),
            });
            console.log(
              `📝 Conversation ${messageConversationId} updated with lastMessage`,
            );
          }
        }

        console.log(`[OK] [${provider.toUpperCase()}] Message sent successfully`);
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
        console.error("[ERROR] Send message error:", err);
        res.status(500).json({
          error: "Failed to send message",
          details: err instanceof Error ? err.message : String(err),
        });
      }
    },
  );

  // Calendar integration routes
  app.get("/api/calendar/integrations/:brandId", isAuthenticated, async (req: any, res) => {
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

  app.post("/api/calendar/integrations", isAuthenticated, async (req: any, res) => {
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

  app.get("/api/appointments/:brandId", isAuthenticated, async (req: any, res) => {
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

  // Video generation endpoint — not yet integrated with a real provider
  app.post("/api/generate-video", isAuthenticated, async (_req, res) => {
    res.status(501).json({ message: "Video generation is not yet available" });
  });

  // Image processing endpoint for pixel-perfect platform assets
  app.post("/api/process-campaign-images", isAuthenticated, async (req: any, res) => {
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
  app.post("/api/ai/generate-campaign-visuals", isAuthenticated, async (req: any, res) => {
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

  const brandImageJobs = new Map<
    string,
    {
      id: string;
      brandId: string;
      status: "processing" | "completed" | "failed";
      progress: number;
      total: number;
      images: any[];
      errors: string[];
      createdAt: number;
    }
  >();

  setInterval(
    () => {
      const oneHour = 60 * 60 * 1000;
      const now = Date.now();
      for (const [id, job] of brandImageJobs) {
        if (now - job.createdAt > oneHour) brandImageJobs.delete(id);
      }
    },
    10 * 60 * 1000,
  );

  // Billing info endpoint — provides real pricing data to the client
  app.get(
    "/api/brands/:brandId/billing-info",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const billingCheck = await billingService.canGenerateImages(brandId);
        res.json({
          freeImagesRemaining: billingCheck.freeRemaining,
          hasPaymentMethod: billingCheck.hasPaymentMethod,
          pricePerImage: 0.12,
          freeImageLimit: 10,
        });
      } catch (error) {
        console.error("[Billing] Error fetching billing info:", error);
        res.status(500).json({ message: "Failed to fetch billing info" });
      }
    },
  );

  app.post(
    "/api/brands/:brandId/generate-images",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const { count = 6 } = req.body;

        const safeCount = Math.min(Math.max(Number(count) || 6, 1), 10);
        const jobId = `bimg_${brandId}_${Date.now()}`;

        brandImageJobs.set(jobId, {
          id: jobId,
          brandId,
          status: "processing",
          progress: 0,
          total: safeCount,
          images: [],
          errors: [],
          createdAt: Date.now(),
        });

        console.log(
          `[API] Brand image job ${jobId} created for brand ${brandId} (${safeCount} images)`,
        );

        res.json({ success: true, jobId });

        (async () => {
          try {
            const { generateBrandImages } = await import(
              "./services/brandImageGenerator"
            );
            const result = await generateBrandImages(brandId, safeCount);
            const job = brandImageJobs.get(jobId);
            if (job) {
              job.status = "completed";
              job.images = result.images;
              job.errors = result.errors;
              job.progress = safeCount;
              console.log(
                `[API] Brand image job ${jobId} completed with ${result.images.length} images`,
              );
            }
          } catch (error) {
            const job = brandImageJobs.get(jobId);
            if (job) {
              job.status = "failed";
              job.errors = [
                error instanceof Error ? error.message : "Unknown error",
              ];
              console.error(`[API] Brand image job ${jobId} failed:`, error);
            }
          }
        })();
      } catch (error) {
        console.error("[API] Generate brand images error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  app.get(
    "/api/brands/:brandId/generate-images/status/:jobId",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId, jobId } = req.params;
        const job = brandImageJobs.get(jobId);
        if (!job || job.brandId !== brandId) {
          return res
            .status(404)
            .json({ success: false, message: "Job not found or expired" });
        }
        res.json({
          success: true,
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          total: job.total,
          images: job.status === "completed" ? job.images : [],
          errors: job.errors,
        });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Failed to check job status" });
      }
    },
  );

  app.post(
    "/api/brands/:brandId/save-generated-images",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const { approved, rejected } = req.body;

        const hasApproved =
          approved && Array.isArray(approved) && approved.length > 0;
        const hasRejected =
          rejected && Array.isArray(rejected) && rejected.length > 0;

        if (!hasApproved && !hasRejected) {
          return res.status(400).json({ message: "No images provided" });
        }

        const design = await db
          .select()
          .from(brandDesigns)
          .where(eq(brandDesigns.brandId, brandId))
          .limit(1);

        if (!design.length) {
          return res.status(404).json({ message: "Brand design not found" });
        }

        let savedApproved = 0;
        let savedRejected = 0;

        if (approved && Array.isArray(approved)) {
          for (const img of approved) {
            if (!img.cloudinaryUrl || !img.publicId) continue;
            await db.insert(brandAssets).values({
              brandDesignId: design[0].id,
              url: img.cloudinaryUrl,
              name: img.variationHint || `AI Generated Image`,
              category: "ai-generated",
              assetType: "image",
              publicId: img.publicId,
              description: img.prompt?.substring(0, 500) || null,
            });
            savedApproved++;
          }
        }

        if (rejected && Array.isArray(rejected)) {
          for (const img of rejected) {
            if (!img.cloudinaryUrl || !img.publicId) continue;
            await db.insert(brandAssets).values({
              brandDesignId: design[0].id,
              url: img.cloudinaryUrl,
              name: img.variationHint || `AI Rejected Image`,
              category: "ai-rejected",
              assetType: "image",
              publicId: img.publicId,
              description: img.prompt?.substring(0, 500) || null,
            });
            savedRejected++;
          }
        }

        res.json({ success: true, savedApproved, savedRejected });
      } catch (error) {
        console.error("[API] Save generated images error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  app.post(
    "/api/brands/:brandId/images-to-posts",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const { images, platform, month, year } = req.body;

        if (!images || !Array.isArray(images) || images.length === 0) {
          return res.status(400).json({ message: "No images provided" });
        }

        const targetPlatform = platform || "instagram";

        const design = await db
          .select()
          .from(brandDesigns)
          .where(eq(brandDesigns.brandId, brandId))
          .limit(1);

        const brand = await storage.getBrandByIdOnly(brandId);

        if (!brand) {
          return res.status(404).json({ message: "Brand not found" });
        }

        const brandName = brand.name || "Brand";
        const brandDescription = brand.description || "";
        const language = design[0]?.preferredLanguage || "es";
        const isSpanish = language === "es";

        const { createPostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );
        const { createAiGeneratedPost } = await import(
          "./storage/aiGeneratedPosts"
        );

        const job = await createPostGeneratorJob(brandId);

        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey:
            process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
        });

        const daysOfWeek = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];

        // Build calendar dates if month/year provided (Month view flow)
        let calendarDates: Date[] = [];
        if (month && year) {
          try {
            const { calculatePostingDates } = await import(
              "./services/postGenerator"
            );
            const freqRows = await db
              .select()
              .from(socialPostingFrequency)
              .where(eq(socialPostingFrequency.brandId, brandId));

            // Collect all unique posting days across platforms
            const allDays = new Set<string>();
            for (const freq of freqRows) {
              const days: string[] = Array.isArray(freq.daysWeek)
                ? freq.daysWeek
                : [];
              days.forEach((d) => allDays.add(d.toLowerCase()));
            }

            if (allDays.size > 0) {
              const dateStrings = calculatePostingDates(
                Number(month),
                Number(year),
                Array.from(allDays),
                true,
              );
              calendarDates = dateStrings.map((ds) => {
                const d = new Date(`${ds}T10:00:00`);
                return d;
              });
            }

            // Fallback: spread every 3 days through the month if no frequency set
            if (calendarDates.length === 0) {
              const today = new Date();
              const startDay =
                Number(month) === today.getMonth() + 1 &&
                Number(year) === today.getFullYear()
                  ? today.getDate()
                  : 1;
              const start = new Date(Number(year), Number(month) - 1, startDay, 10, 0, 0);
              const end = new Date(Number(year), Number(month), 0);
              for (
                let d = new Date(start);
                d <= end && calendarDates.length < images.length;
                d.setDate(d.getDate() + 3)
              ) {
                calendarDates.push(new Date(d));
              }
            }
          } catch (freqErr) {
            console.error(
              "[API] Failed to calculate calendar dates:",
              freqErr,
            );
          }
        }

        const createdPosts: any[] = [];

        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const imageUrl = img.cloudinaryUrl || img.url;
          const publicId = img.publicId || null;

          if (!imageUrl) continue;

          try {
            const captionPrompt = isSpanish
              ? `Eres un experto en marketing digital para redes sociales. Genera contenido para un post de ${targetPlatform} para la marca "${brandName}" (${brandDescription}).

Responde SOLO en JSON con este formato exacto:
{"titulo": "titulo corto atractivo (max 8 palabras)", "content": "caption persuasivo para ${targetPlatform} (2-3 oraciones, incluye emojis)", "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"}

Todo el contenido debe ser en español.`
              : `You are a social media marketing expert. Generate content for a ${targetPlatform} post for the brand "${brandName}" (${brandDescription}).

Respond ONLY in JSON with this exact format:
{"titulo": "short catchy title (max 8 words)", "content": "persuasive ${targetPlatform} caption (2-3 sentences, include emojis)", "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5"}

All content must be in English.`;

            const captionResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: [{ text: captionPrompt }] }],
            });

            let titulo = isSpanish ? "Post de marca" : "Brand Post";
            let content = "";
            let hashtags = "";

            const responseText = captionResponse.text || "";
            const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                titulo = parsed.titulo || titulo;
                content = parsed.content || "";
                hashtags = parsed.hashtags || "";
              } catch (e) {
                console.log(
                  "[API] Failed to parse AI caption JSON, using defaults",
                );
              }
            }

            let dia: string;
            let scheduledPublishTime: Date | undefined;
            if (calendarDates.length > 0) {
              const dateForPost = calendarDates[i % calendarDates.length];
              dia = daysOfWeek[dateForPost.getDay()];
              scheduledPublishTime = dateForPost;
            } else {
              const dayIndex = (new Date().getDay() + i) % 7;
              dia = daysOfWeek[dayIndex];
            }

            const post = await createAiGeneratedPost({
              jobId: job.id,
              brandId,
              platform: targetPlatform,
              titulo,
              content,
              imageUrl,
              cloudinaryPublicId: publicId,
              dia,
              hashtags,
              status: "pending",
              isSample: false,
              ...(scheduledPublishTime && { scheduledPublishTime }),
            });

            createdPosts.push(post);
          } catch (captionError) {
            console.error(
              `[API] Failed to generate caption for image ${i}:`,
              captionError,
            );
            let fallbackDia: string;
            let fallbackScheduledTime: Date | undefined;
            if (calendarDates.length > 0) {
              const dateForPost = calendarDates[i % calendarDates.length];
              fallbackDia = daysOfWeek[dateForPost.getDay()];
              fallbackScheduledTime = dateForPost;
            } else {
              fallbackDia = daysOfWeek[(new Date().getDay() + i) % 7];
            }
            const post = await createAiGeneratedPost({
              jobId: job.id,
              brandId,
              platform: targetPlatform,
              titulo: isSpanish ? `Post de ${brandName}` : `${brandName} Post`,
              content: isSpanish
                ? `Nuevo contenido de ${brandName}`
                : `New content from ${brandName}`,
              imageUrl,
              cloudinaryPublicId: publicId,
              dia: fallbackDia,
              hashtags: "",
              status: "pending",
              isSample: false,
              ...(fallbackScheduledTime && { scheduledPublishTime: fallbackScheduledTime }),
            });
            createdPosts.push(post);
          }
        }

        const { updatePostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );
        await updatePostGeneratorJob(job.id, {
          status: "completed",
          result: { postsGenerated: createdPosts.length },
        });

        res.json({
          success: true,
          postsCreated: createdPosts.length,
          jobId: job.id,
          posts: createdPosts,
        });
      } catch (error) {
        console.error("[API] Images to posts error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  app.post(
    "/api/brands/:brandId/schedule-content",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
        const {
          imageUrl,
          platform,
          titulo,
          content,
          hashtags,
          scheduledPublishTime,
          type,
        } = req.body;

        if (!imageUrl) {
          return res.status(400).json({ message: "Image URL is required" });
        }

        const { createPostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );
        const { createAiGeneratedPost } = await import(
          "./storage/aiGeneratedPosts"
        );

        const job = await createPostGeneratorJob(brandId);

        const scheduledDate = scheduledPublishTime
          ? new Date(scheduledPublishTime)
          : new Date();
        const daysOfWeek = [
          "sunday",
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
        ];
        const dia = daysOfWeek[scheduledDate.getDay()];

        const post = await createAiGeneratedPost({
          jobId: job.id,
          brandId,
          platform: platform || "instagram",
          titulo: titulo || "Scheduled Post",
          content: content || "",
          imageUrl,
          cloudinaryPublicId: null,
          dia,
          hashtags: hashtags || "",
          status: "accepted",
          isSample: false,
          type: type || "image",
          scheduledPublishTime: scheduledPublishTime || null,
        });

        const { updateAiGeneratedPostStatus } = await import(
          "./storage/aiGeneratedPosts"
        );
        if (scheduledPublishTime) {
          await updateAiGeneratedPostStatus(
            post.id,
            "accepted",
            scheduledPublishTime,
          );
        }

        const { updatePostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );
        await updatePostGeneratorJob(job.id, {
          status: "completed",
          result: { postsGenerated: 1 },
        });

        res.json({ success: true, post });
      } catch (error) {
        console.error("[API] Schedule content error:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Test: Generate image and save to Cloudinary
  app.post(
    "/api/test/generate-image",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId || req.brandMembership?.brandId;
        const brand = await storage.getBrandByIdOnly(brandId);
        if (!brand) return res.status(404).json({ message: "Brand not found" });
        const design = await storage.getBrandDesignByBrandId(brandId);

        const { saveAndCreateImage } = await import(
          "./services/postGeneratorNew"
        );
        const result = await saveAndCreateImage({
          name: brand.name || "Brand",
          colors: [design?.colorPrimary || "#4F46E5", design?.colorAccent1 || "#7C3AED"],
          description: brand.description || "",
          logoUrl: design?.logoUrl || undefined,
        });
        res.json({ success: true, result });
      } catch (error) {
        console.error("[Test] Generate image error:", error);
        res.status(500).json({ success: false, message: "Image generation failed" });
      }
    },
  );

  // Upload edited image (from image editor) and update AI post
  app.post(
    "/api/upload-edited-image",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { postId, imageDataUrl } = req.body;

        if (!postId || !imageDataUrl) {
          return res
            .status(400)
            .json({ message: "postId and imageDataUrl are required" });
        }

        // Upload base64 image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageDataUrl, {
          folder: "campaigner/edited-posts",
          resource_type: "image",
        });

        res.json({
          imageUrl: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (error) {
        console.error("Error uploading edited image:", error);
        res.status(500).json({ message: "Failed to upload edited image" });
      }
    },
  );

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
          getUserId(req);
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
          getUserId(req);
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
          .json({ message: "Failed to update customer", error: (error as Error).message });
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
          getUserId(req);
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
          getUserId(req);
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
          getUserId(req);
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
      const userId = getUserId(req);
      const assignedOnly = req.query.assigned === "true";

      const tasks = assignedOnly
        ? await storage.getTasksAssignedToUser(userId)
        : await storage.getTasksByUserId(userId);

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching team tasks:", error);
      res.status(500).json({ message: "Failed to fetch team tasks" });
    }
  });

  app.post("/api/team-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
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
          getUserId(req);
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

  // ==================================================================================
  // LIGHTSPEED RETAIL X-SERIES OAUTH ROUTES
  // ==================================================================================

  // Initiate Lightspeed OAuth flow
  app.get("/api/lightspeed/auth", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const brandId = req.brandMembership.brandId;
      const domainPrefix = req.query.domainPrefix as string | undefined;

      // domainPrefix is optional - Lightspeed returns it in the callback
      // But we include it in state if provided for backwards compatibility

      // Generate state with user info (domainPrefix is optional)
      const state = Buffer.from(
        JSON.stringify({
          userId,
          brandId,
          domainPrefix,
          timestamp: Date.now(),
        }),
      ).toString("base64");

      // Store state in session for verification
      (req.session as any).lightspeedOAuthState = state;

      const authUrl = lightspeedService.generateAuthUrl(state, domainPrefix);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating Lightspeed OAuth");
      res.status(500).json({ message: "Failed to initiate Lightspeed OAuth" });
    }
  });

  // Lightspeed OAuth callback
  app.get("/api/lightspeed/callback", async (req: any, res) => {
    try {
      const { code, state, domain_prefix: queryDomainPrefix } = req.query;

      if (!code || !state) {
        return res.status(400).send(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Connection Failed</h1>
              <p>Missing required parameters from Lightspeed.</p>
              <script>
                setTimeout(() => window.close(), 3000);
              </script>
            </body>
          </html>
        `);
      }

      // Decode state
      let stateData: {
        userId: string;
        brandId: string;
        domainPrefix?: string;
        timestamp: number;
      };
      try {
        stateData = JSON.parse(
          Buffer.from(state as string, "base64").toString(),
        );
      } catch (e) {
        return res.status(400).send("Invalid OAuth state");
      }

      // Get domain_prefix from query params (Lightspeed returns it) or fall back to state
      const domainPrefix =
        (queryDomainPrefix as string) || stateData.domainPrefix;

      if (!domainPrefix) {
        return res
          .status(400)
          .send("Missing domain prefix from Lightspeed callback");
      }

      // Exchange code for tokens using domain from state
      const tokens = await lightspeedService.exchangeCodeForToken(
        code as string,
        domainPrefix,
      );

      // Verify user exists — the userId comes from the OAuth state created during /api/lightspeed/auth
      // which requires isAuthenticated, so the user must already exist
      const existingUser = await storage.getUser(stateData.userId);
      if (!existingUser) {
        return res.status(400).send("Invalid user session. Please log in and try again.");
      }

      // Create the integration
      const integrationId = await lightspeedService.createIntegration(
        stateData.userId,
        stateData.brandId,
        domainPrefix,
        tokens,
      );

      // Initial sync of customers and sales, then register webhooks
      try {
        const integration = await db.query.posIntegrations.findFirst({
          where: eq(posIntegrations.id, integrationId),
        });

        if (integration) {
          const customerCount =
            await lightspeedService.syncCustomers(integration);
          const salesCount = await lightspeedService.syncSales(integration);

          // Register webhooks for real-time updates
          try {
            await lightspeedService.registerWebhooks(integration);
          } catch (webhookError) {
            // Failed to register webhooks (sync still completed)
          }
        }
      } catch (syncError) {
        // Initial sync failed (integration still created)
      }

      // Send success page that closes the popup
      res.send(`
        <html>
          <head>
            <title>Connection Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 40px;
                background: rgba(255,255,255,0.1);
                border-radius: 16px;
                backdrop-filter: blur(10px);
              }
              .checkmark {
                font-size: 64px;
                margin-bottom: 16px;
              }
              h1 { margin: 0 0 8px 0; font-size: 24px; }
              p { margin: 0; opacity: 0.9; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="checkmark">✓</div>
              <h1>Lightspeed Connected!</h1>
              <p>This window will close automatically...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'lightspeed-oauth-success' }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("[ERROR] Lightspeed OAuth callback error");
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Connection Failed</h1>
            <p>An error occurred while connecting to Lightspeed. Please try again.</p>
            <script>
              setTimeout(() => window.close(), 5000);
            </script>
          </body>
        </html>
      `);
    }
  });

  // Get Lightspeed integration status for a brand
  app.get("/api/lightspeed/status", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership.brandId;

      const integration =
        await lightspeedService.getIntegrationByBrand(brandId);

      if (!integration) {
        return res.json({ connected: false });
      }

      const stats = await lightspeedService.getSalesStats(integration.id);

      res.json({
        connected: true,
        integration: {
          id: integration.id,
          storeName: integration.storeName,
          storeUrl: integration.storeUrl,
          lastSyncAt: integration.lastSyncAt,
          isActive: integration.isActive,
        },
        stats,
      });
    } catch (error) {
      console.error("Error fetching Lightspeed status");
      res.status(500).json({ message: "Failed to fetch Lightspeed status" });
    }
  });

  // Sync Lightspeed data manually
  app.post("/api/lightspeed/sync", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership.brandId;

      const integration =
        await lightspeedService.getIntegrationByBrand(brandId);

      if (!integration) {
        return res
          .status(404)
          .json({ message: "Lightspeed integration not found" });
      }

      const customerCount = await lightspeedService.syncCustomers(integration);
      const salesCount = await lightspeedService.syncSales(integration);

      // Also re-link existing sales with customers
      const relinkResult =
        await lightspeedService.relinkSalesWithCustomers(integration);

      res.json({
        success: true,
        synced: {
          customers: customerCount,
          sales: salesCount,
        },
        relinked: relinkResult,
      });
    } catch (error) {
      console.error("Error syncing Lightspeed data");
      res.status(500).json({ message: "Failed to sync Lightspeed data" });
    }
  });

  // Re-link existing sales with customers (fix historical data)
  app.post("/api/lightspeed/relink", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership.brandId;

      const integration =
        await lightspeedService.getIntegrationByBrand(brandId);

      if (!integration) {
        return res
          .status(404)
          .json({ message: "Lightspeed integration not found" });
      }

      const result =
        await lightspeedService.relinkSalesWithCustomers(integration);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error("Error re-linking Lightspeed sales");
      res
        .status(500)
        .json({ message: "Failed to re-link sales with customers" });
    }
  });

  // Force re-sync: Delete all sales and re-fetch from Lightspeed (fixes missing customer_id)
  app.post(
    "/api/lightspeed/force-resync",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;
        const daysBack = parseInt(req.body?.daysBack) || 90;

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        const result = await lightspeedService.forceResyncSales(
          integration,
          daysBack,
        );

        res.json({
          success: true,
          ...result,
        });
      } catch (error) {
        console.error("Error force re-syncing Lightspeed sales");
        res.status(500).json({ message: "Failed to force re-sync sales" });
      }
    },
  );

  // Get Lightspeed customers for a brand
  app.get(
    "/api/lightspeed/customers",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        const customers = await lightspeedService.getCustomers(integration.id);
        res.json(customers);
      } catch (error) {
        console.error("Error fetching Lightspeed customers");
        res.status(500).json({ message: "Failed to fetch customers" });
      }
    },
  );

  // Get Lightspeed sales for a brand
  app.get("/api/lightspeed/sales", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.brandMembership.brandId;
      const limit = parseInt(req.query.limit as string) || 100;

      const integration =
        await lightspeedService.getIntegrationByBrand(brandId);

      if (!integration) {
        return res
          .status(404)
          .json({ message: "Lightspeed integration not found" });
      }

      const sales = await lightspeedService.getSales(integration.id, limit);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching Lightspeed sales");
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Disconnect Lightspeed integration
  app.delete(
    "/api/lightspeed/disconnect",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        await lightspeedService.disconnectIntegration(integration.id);
        res.json({ success: true });
      } catch (error) {
        console.error("Error disconnecting Lightspeed");
        res.status(500).json({ message: "Failed to disconnect Lightspeed" });
      }
    },
  );

  // Lightspeed Webhook endpoint - receives real-time updates for sales and customers
  app.post(
    "/api/lightspeed/webhook",
    express.urlencoded({ extended: true }),
    async (req: any, res) => {
      try {
        const signatureHeader = req.headers["x-signature"] as string;
        const rawBody = JSON.stringify(req.body);

        // Verify webhook signature (optional - some webhooks may not have signatures)
        if (signatureHeader) {
          const isValid = lightspeedService.verifyWebhookSignature(
            rawBody,
            signatureHeader,
          );
          if (!isValid) {
            return res.sendStatus(403);
          }
        }

        // Parse the payload from the form data
        const payloadString = req.body.payload;
        if (!payloadString) {
          return res.status(200).send("OK");
        }

        const payload = JSON.parse(payloadString);
        const eventType = req.body.type || "unknown";

        // Process the webhook event asynchronously
        lightspeedService
          .processWebhookEvent(eventType, payload)
          .catch(() => {});

        // Always respond quickly with 200 OK
        res.status(200).send("OK");
      } catch (error) {
        console.error("Error handling Lightspeed webhook");
        // Still return 200 to prevent Lightspeed from retrying
        res.status(200).send("OK");
      }
    },
  );

  // Register webhooks for a Lightspeed integration
  app.post(
    "/api/lightspeed/webhooks/register",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        const webhooks = await lightspeedService.registerWebhooks(integration);
        res.json({ success: true, webhooks });
      } catch (error) {
        console.error("Error registering Lightspeed webhooks");
        res.status(500).json({ message: "Failed to register webhooks" });
      }
    },
  );

  // List webhooks for a Lightspeed integration
  app.get(
    "/api/lightspeed/webhooks",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        const webhooks = await lightspeedService.listWebhooks(integration);
        res.json(webhooks);
      } catch (error) {
        console.error("Error listing Lightspeed webhooks");
        res.status(500).json({ message: "Failed to list webhooks" });
      }
    },
  );

  // POS Integration routes
  // Get user's POS integrations
  app.get("/api/pos-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const integrations = await storage.getPosIntegrationsByUserId(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching POS integrations");
      res.status(500).json({ message: "Failed to fetch POS integrations" });
    }
  });

  // Create new POS integration
  app.post("/api/pos-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
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
          "Product sync failed but integration created"
        );
      }

      res.status(201).json(integration);
    } catch (error) {
      console.error("Error creating POS integration");
      res.status(500).json({ message: "Failed to create POS integration" });
    }
  });

  // Update POS integration
  app.put(
    "/api/pos-integrations/:id",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = getUserId(req);
        const { id } = req.params;

        // Verify ownership before updating
        const existing = await storage.getPosIntegrationsByUserId(userId);
        const owned = existing.find((i) => i.id === id);
        if (!owned) {
          return res.status(404).json({ message: "Integration not found" });
        }

        const updates = req.body;
        const integration = await storage.updatePosIntegration(id, updates);

        if (!integration) {
          return res.status(404).json({ message: "Integration not found" });
        }

        res.json(integration);
      } catch (error) {
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
          getUserId(req);
        const { id } = req.params;
        const deleted = await storage.deletePosIntegration(id, userId);

        if (!deleted) {
          return res.status(404).json({ message: "Integration not found" });
        }

        res.json({ message: "Integration deleted successfully" });
      } catch (error) {
        console.error("Error deleting POS integration");
        res.status(500).json({ message: "Failed to delete POS integration" });
      }
    },
  );

  // Get sales transactions
  app.get("/api/sales-transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getSalesTransactionsByUserId(
        userId,
        limit,
      );
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching sales transactions");
      res.status(500).json({ message: "Failed to fetch sales transactions" });
    }
  });

  // Get products from POS systems
  app.get("/api/products", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const products = await storage.getProductsByUserId(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products");
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
        const userId = getUserId(req);
        const integration = await storage.getPosIntegrationsByUserId(
          userId,
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
        console.error("Error syncing products");
        res.status(500).json({ message: "Failed to sync products" });
      }
    },
  );

  // Get campaign triggers
  app.get("/api/campaign-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
      const triggers = await storage.getCampaignTriggersByUserId(userId);
      res.json(triggers);
    } catch (error) {
      console.error("Error fetching campaign triggers");
      res.status(500).json({ message: "Failed to fetch campaign triggers" });
    }
  });

  // Create campaign trigger
  app.post("/api/campaign-triggers", isAuthenticated, async (req: any, res) => {
    try {
      const userId =
        getUserId(req);
      const triggerData = insertCampaignTriggerSchema.parse({
        ...req.body,
        userId,
      });
      const trigger = await storage.createCampaignTrigger(triggerData);
      res.status(201).json(trigger);
    } catch (error) {
      console.error("Error creating campaign trigger");
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
          getUserId(req);
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
        console.error("Error updating campaign trigger");
        res.status(500).json({ message: "Failed to update campaign trigger" });
      }
    },
  );

  // Webhook endpoints for POS systems
  app.post("/api/webhooks/square", async (req, res) => {
    try {
      const signature = req.headers["x-square-hmacsha256-signature"] as string;
      if (signature && !posIntegrationService.verifySquareSignature(JSON.stringify(req.body), signature)) {
        return res.sendStatus(403);
      }

      const result = await posIntegrationService.processWebhook("square", req.body, signature);
      res.json({ received: result.processed });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/shopify", async (req, res) => {
    try {
      const signature = req.headers["x-shopify-hmac-sha256"] as string;
      if (signature && !posIntegrationService.verifyShopifySignature(JSON.stringify(req.body), signature)) {
        return res.sendStatus(403);
      }

      const result = await posIntegrationService.processWebhook("shopify", req.body, signature);
      res.json({ received: result.processed });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      if (signature && !posIntegrationService.verifyStripeSignature(JSON.stringify(req.body), signature)) {
        return res.sendStatus(403);
      }

      const result = await posIntegrationService.processWebhook("stripe", req.body, signature);
      res.json({ received: result.processed });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/woocommerce", async (req, res) => {
    try {
      // WooCommerce uses X-WC-Webhook-Signature header with HMAC-SHA256
      const signature = req.headers["x-wc-webhook-signature"] as string;
      const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;
      if (signature && secret) {
        const crypto = await import("crypto");
        const expectedSig = crypto.createHmac("sha256", secret).update(JSON.stringify(req.body)).digest("base64");
        if (signature !== expectedSig) {
          return res.sendStatus(403);
        }
      }

      const result = await posIntegrationService.processWebhook("woocommerce", req.body);
      res.json({ received: result.processed });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Message routes - Save messages from webhooks or manual creation
  app.post("/api/messages", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Validate request body using Zod schema
      const messageData = insertMessageSchema.parse(req.body);

      // Create message in database
      const newMessage = await storage.createMessage(messageData);

      res.status(201).json({
        success: true,
        message: newMessage,
      });
    } catch (error) {
      console.error("Error creating message");

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }

      res.status(500).json({
        message: "Failed to create message",
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
        console.error("Error fetching brand design");
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
        const body = req.body;

        // Validate brand style if provided
        const validStyles = ["minimalist", "luxury", "fun", "corporate", "creative", "bold"];
        if (body.brandStyle && !validStyles.includes(body.brandStyle)) {
          return res.status(400).json({ message: "Invalid brand style" });
        }

        // Validate hex colors if provided
        const hexPattern = /^(#[0-9a-fA-F]{3,8}|rgba?\(.*\)|linear-gradient\(.*\))$/;
        const colorFields = ["colorPrimary", "colorAccent1", "colorAccent2", "colorAccent3", "colorAccent4", "colorText1", "colorText2", "colorText3", "colorText4"];
        for (const field of colorFields) {
          if (body[field] && !hexPattern.test(body[field])) {
            return res.status(400).json({ message: `Invalid color value for ${field}` });
          }
        }

        const designData = { ...body, brandId };

        const existingDesign = await storage.getBrandDesignByBrandId(brandId);

        if (existingDesign) {
          // Preserve existing preferredLanguage if not provided in update
          const updateData = {
            ...designData,
            // Only override preferredLanguage if explicitly provided in request
            preferredLanguage:
              designData.preferredLanguage || existingDesign.preferredLanguage,
          };

          const updated = await storage.updateBrandDesign(
            existingDesign.id,
            brandId,
            updateData,
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

      return publicId || null;
    } catch (e) {
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

      try {
        if (!brandDesignId) {
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        // Get brand design by brandId to validate ownership
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);

        if (!brandDesign || brandDesign.id !== brandDesignId) {
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
          return res.status(400).json({ message: "Invalid logo type" });
        }

        const logoUrl = brandDesign[fieldName];

        if (!logoUrl) {
          return res.status(404).json({ message: "Logo not found" });
        }

        const publicId = extractPublicIdFromUrl(logoUrl as string);

        if (publicId) {
          try {
            const result = await cloudinary.uploader.destroy(publicId, {
              resource_type: "image",
            });
            if (result.result !== "ok" && result.result !== "not found") {
              throw new Error(`Cloudinary deletion failed: ${result.result}`);
            }
          } catch (cloudErr) {
            console.error("Error deleting logo from Cloudinary:", cloudErr);
            return res.status(500).json({
              message: "Failed to delete logo from Cloudinary",
            });
          }
        }

        // ⚠️ Aquí, evita mapToDb para updates parciales o usa mapPartialToDb
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

        return res.json({ message: `${type} deleted successfully` });
      } catch (error) {
        console.error("Error deleting logo:", error);
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
        res.status(501).json({ message: "Canva integration is not yet available" });
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
        const {
          brandDesignId,
          url,
          name,
          category,
          assetType,
          publicId,
          description,
        } = req.body;
        if (!brandDesignId || !url || !name || !assetType || !publicId) {
          return res.status(400).json({ error: "Missing required fields (brandDesignId, url, name, assetType, publicId)" });
        }

        // Validate assetType
        const validAssetTypes = ["image", "video", "document"];
        if (!validAssetTypes.includes(assetType)) {
          return res.status(400).json({ error: "Invalid assetType. Must be: image, video, or document" });
        }

        // Validate URL format
        try {
          const parsed = new URL(url);
          if (!["http:", "https:"].includes(parsed.protocol)) {
            return res.status(400).json({ error: "URL must use HTTP or HTTPS" });
          }
        } catch {
          return res.status(400).json({ error: "Invalid URL format" });
        }

        // Verify the brand design belongs to this brand
        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
        if (!brandDesign || brandDesign.id !== brandDesignId) {
          return res.status(403).json({ error: "Unauthorized" });
        }

        const newAsset = await storage.createBrandAsset({
          brandDesignId,
          url,
          name: String(name).slice(0, 500),
          category: category || null,
          assetType,
          publicId,
          description: description ? String(description).slice(0, 2000) : null,
        });
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

            // Check if Cloudinary deletion was successful
            if (result.result !== "ok" && result.result !== "not found") {
              throw new Error(`Cloudinary deletion failed: ${result.result}`);
            }
          } catch (cloudinaryError) {
            console.error("Error deleting from Cloudinary:", cloudinaryError);
            return res.status(500).json({
              message: "Failed to delete asset from Cloudinary",
            });
          }
        }

        // Delete from database only if Cloudinary deletion succeeded
        const deleted = await storage.deleteBrandAsset(
          assetId,
          String(brandDesignId),
        );

        if (deleted) {
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

  // PATCH /api/brand-assets/:id — update caption
  app.patch(
    "/api/brand-assets/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const assetId = req.params.id;
        const { caption, brandDesignId } = req.body;

        if (!brandDesignId) {
          return res.status(400).json({ message: "brandDesignId is required" });
        }

        const brandDesign = await storage.getBrandDesignByBrandId(brandId);
        if (!brandDesign || brandDesign.id !== brandDesignId) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        const updated = await storage.updateBrandAssetCaption(
          assetId,
          brandDesignId,
          caption ?? "",
        );

        if (!updated) {
          return res.status(404).json({ message: "Asset not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("Error updating asset caption:", error);
        res.status(500).json({ message: "Failed to update caption" });
      }
    },
  );

  // ============================================
  // Brand Products CRUD Routes
  // ============================================

  app.get(
    "/api/brand-products",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const products = await storage.getBrandProducts(brandId);
        res.json(products);
      } catch (error) {
        console.error("Error fetching brand products:", error);
        res.status(500).json({ message: "Failed to fetch brand products" });
      }
    },
  );

  app.post(
    "/api/brand-products",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const { name, description, price, image } = req.body;

        if (!name || !name.trim()) {
          return res.status(400).json({ message: "Product name is required" });
        }

        const product = await storage.createBrandProduct({
          brandId,
          name: String(name).trim().slice(0, 500),
          description: description ? String(description).trim().slice(0, 2000) : null,
          price: price ? String(price).trim() : null,
          image: image ? String(image).trim() : null,
        });
        res.status(201).json(product);
      } catch (error) {
        console.error("Error creating brand product:", error);
        res.status(500).json({ message: "Failed to create brand product" });
      }
    },
  );

  app.delete(
    "/api/brand-products/:id",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const productId = req.params.id;
        const deleted = await storage.deleteBrandProduct(productId, brandId);
        if (!deleted) {
          return res.status(404).json({ message: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
      } catch (error) {
        console.error("Error deleting brand product:", error);
        res.status(500).json({ message: "Failed to delete brand product" });
      }
    },
  );

  // ============================================
  // Boosty AI Assistant Routes
  // ============================================

  app.post(
    "/api/boosty/chat",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const userId = getUserId(req);
        const {
          message,
          conversationHistory,
          language,
          attachmentBase64,
          attachmentMimeType,
        } = req.body;

        if (!message || typeof message !== "string") {
          return res.status(400).json({ error: "Message is required" });
        }

        if (message.length > 5000) {
          return res.status(400).json({ error: "Message too long (max 5000 characters)" });
        }

        const chatResponse = await boostyService.chat(
          brandId,
          userId,
          message.slice(0, 5000),
          conversationHistory || [],
          language || "en",
          attachmentBase64,
          attachmentMimeType,
        );

        res.json({
          response: chatResponse.text,
          image: chatResponse.image,
          imagePrompt: chatResponse.imagePrompt,
        });
      } catch (error) {
        console.error("Error in Boosty chat:", error);
        res.status(500).json({ error: "Failed to process chat message" });
      }
    },
  );

  app.post("/api/boosty/transcribe", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ error: "Transcription service unavailable" });
      }
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64 || typeof audioBase64 !== "string") {
        return res.status(400).json({ error: "audioBase64 is required" });
      }
      // Limit audio to ~10MB base64 (~7.5MB actual file)
      if (audioBase64.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "Audio file too large (max 10MB)" });
      }
      const buffer = Buffer.from(audioBase64, "base64");
      const file = new File([buffer], "voice-note.webm", {
        type: mimeType || "audio/webm",
      });
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });
      res.json({ transcript: transcription.text });
    } catch (error) {
      console.error("Error transcribing voice note:", error);
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  app.get(
    "/api/boosty/suggestions",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const userId = getUserId(req);
        const language = (req.query.language as "es" | "en") === "es" ? "es" : "en";

        const suggestions = await boostyService.getQuickSuggestions(
          brandId,
          userId,
          language as "es" | "en",
        );

        res.json({ suggestions });
      } catch (error) {
        console.error("Error getting Boosty suggestions:", error);
        res.status(500).json({ error: "Failed to get suggestions" });
      }
    },
  );

  app.get(
    "/api/boosty/context",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const userId = getUserId(req);

        const context = await boostyService.getBrandContext(brandId, userId);

        res.json({ context });
      } catch (error) {
        console.error("Error getting brand context:", error);
        res.status(500).json({ error: "Failed to get brand context" });
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
            socialAccounts.find((acc: any) => acc.platform === messageData.platform)
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
        } as any);
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
              "Meet the incredible team behind our success! st��✨ From creative designers to amazing customer service reps, every person brings something special to deliver excellence daily 💙 #TeamSpotlight #BehindTheScenes",
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
        } as any);
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
        } as any);
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
        } as any);
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

    ];

    for (const messageData of demoConversationsData) {
      try {
        if (messageData.socialAccountId) {
          await storage.createMessage(messageData as any);
        }
      } catch (error) {
        console.log(`Message might already exist or social account not found`);
      }
    }

    console.log("Demo data populated successfully for user:", userId);
  }

  const server = createServer(app);

  // Socket.IO CORS: use APP_URL in production, allow all in development
  const socketCorsOrigin = process.env.NODE_ENV === "production"
    ? (process.env.APP_URL || "https://app.leadboostapp.ai")
    : "*";

  const io = new SocketIOServer(server, {
    cors: {
      origin: socketCorsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Share Express session with Socket.IO so we can authenticate socket connections
  const sessionMiddleware = await getSession();
  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    // Handle room joining for brand-specific updates
    socket.on("join_brand", async (brandId: string) => {
      if (!brandId) return;

      // Validate brand membership via session cookie
      const req = socket.request as any;
      const userId = req?.session?.passport?.user?.id || req?.session?.userId;
      if (!userId) {
        socket.emit("error", { message: "Authentication required" });
        return;
      }

      // Verify user has access to this brand
      try {
        const memberships = await storage.getBrandMemberships(userId);
        const hasMembership = memberships.some((m: any) => m.brandId === brandId);
        if (!hasMembership) {
          socket.emit("error", { message: "Not authorized for this brand" });
          return;
        }
        socket.join(`brand:${brandId}`);
      } catch (_) {
        socket.emit("error", { message: "Authorization check failed" });
      }
    });

    // Handle room leaving
    socket.on("leave_brand", (brandId: string) => {
      if (brandId) {
        socket.leave(`brand:${brandId}`);
      }
    });

    socket.on("disconnect", () => {
      // Normal disconnection, no action needed
    });
  });

  // ─── Brand Products ─────────────────────────────────────────────────────────

  // Instagram Post Insights (on-demand fetch for a published post)
  app.get("/api/ai-posts/:postId/insights", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const brandId = req.brandId;

      const { getAiGeneratedPostsByBrand } = await import("./storage/aiGeneratedPosts");
      const posts = await getAiGeneratedPostsByBrand(brandId);
      const post = posts.find(p => p.id === postId);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      if (post.status !== "published" || !post.publishedAt) {
        return res.json({ insights: null, message: "Post not published yet" });
      }

      // Need publishedMediaId to fetch insights
      const dbPost = await db
        .select()
        .from(aiGeneratedPosts)
        .where(eq(aiGeneratedPosts.id, postId))
        .limit(1);

      const mediaId = dbPost[0]?.publishedMediaId;
      if (!mediaId) {
        return res.json({ insights: null, message: "No media ID stored for this post" });
      }

      // Find the Instagram integration for this brand
      const brandIntegrations = await storage.getIntegrationsByBrandId(brandId);
      const igIntegration = brandIntegrations.find(
        (i: any) => (i.provider === "instagram_direct" || i.provider === "instagram") && i.accessToken,
      );

      if (!igIntegration) {
        return res.json({ insights: null, message: "No Instagram integration found" });
      }

      const isDirect = igIntegration.provider === "instagram_direct";
      const baseUrl = isDirect ? "https://graph.instagram.com" : "https://graph.facebook.com";

      const insightsRes = await fetch(
        `${baseUrl}/v24.0/${mediaId}/insights?metric=reach,impressions,likes,comments,saved,shares&access_token=${igIntegration.accessToken}`,
      );
      const insightsData = await insightsRes.json();

      if (insightsData.error) {
        return res.json({ insights: null, message: insightsData.error.message });
      }

      const insights: Record<string, number> = {};
      if (insightsData.data) {
        for (const metric of insightsData.data) {
          insights[metric.name] = metric.values?.[0]?.value || 0;
        }
      }

      res.json({ insights, mediaId, publishedAt: post.publishedAt });
    } catch (err: any) {
      console.error("[API] Post insights error:", err.message);
      res.status(500).json({ error: "Failed to fetch post insights" });
    }
  });

  // Brand Essence (Tone of Voice, Personality, etc.)
  app.get("/api/brands/:brandId/essence", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const essence = await storage.getBrandEssence(brandId);
      res.json(essence || null);
    } catch (err) {
      console.error("GET /api/brands/:brandId/essence error:", err);
      res.status(500).json({ error: "Failed to fetch brand essence" });
    }
  });

  app.put("/api/brands/:brandId/essence", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const { toneOfVoice, personality, emotionalFeel, visualKeywords, brandPromise } = req.body;
      if (!toneOfVoice?.trim()) {
        return res.status(400).json({ error: "Tone of voice is required" });
      }
      const essence = await storage.createOrUpdateBrandEssence(brandId, {
        toneOfVoice: toneOfVoice.trim(),
        personality: personality?.trim() || "",
        emotionalFeel: emotionalFeel?.trim() || "",
        visualKeywords: visualKeywords?.trim() || "",
        brandPromise: brandPromise?.trim() || "",
      });
      res.json(essence);
    } catch (err) {
      console.error("PUT /api/brands/:brandId/essence error:", err);
      res.status(500).json({ error: "Failed to save brand essence" });
    }
  });

  // AI Customization Engine
  app.post("/api/brands/:brandId/ai-customize", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const userId = req.user?.id;
      const { request } = req.body;

      if (!request?.trim()) {
        return res.status(400).json({ error: "Request text is required" });
      }

      const { generateProposal } = await import("./services/aiCustomization");
      const proposal = await generateProposal(brandId, request.trim());

      // Save the request
      const [saved] = await db
        .insert(customizationRequests)
        .values({
          brandId,
          requestedBy: userId,
          requestText: request.trim(),
          aiProposal: proposal,
          status: "pending",
        })
        .returning();

      res.json({ id: saved.id, ...proposal });
    } catch (err: any) {
      console.error("AI customize error:", err);
      res.status(500).json({ error: "Failed to generate proposal" });
    }
  });

  app.post("/api/brands/:brandId/ai-customize/:requestId/apply", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const { brandId, requestId } = req.params;

      const [request] = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.id, requestId))
        .limit(1);

      if (!request || request.brandId !== brandId) {
        return res.status(404).json({ error: "Request not found" });
      }

      if (request.status === "applied") {
        return res.status(400).json({ error: "Already applied" });
      }

      const proposal = request.aiProposal as { proposals: any[] };
      if (!proposal?.proposals?.length) {
        return res.status(400).json({ error: "No proposals to apply" });
      }

      const { applyProposal } = await import("./services/aiCustomization");
      const results = [];

      for (const p of proposal.proposals) {
        const result = await applyProposal(brandId, p);
        results.push(result);
      }

      // Mark as applied
      await db
        .update(customizationRequests)
        .set({ status: "applied", appliedAt: new Date() })
        .where(eq(customizationRequests.id, requestId));

      res.json({ success: true, results });
    } catch (err: any) {
      console.error("Apply customize error:", err);
      res.status(500).json({ error: "Failed to apply proposal" });
    }
  });

  app.post("/api/brands/:brandId/ai-customize/:requestId/reject", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const { requestId, brandId } = req.params;
      await db
        .update(customizationRequests)
        .set({ status: "rejected" })
        .where(and(eq(customizationRequests.id, requestId), eq(customizationRequests.brandId, brandId)));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to reject" });
    }
  });

  // Get customization history
  app.get("/api/brands/:brandId/ai-customize/history", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const history = await db
        .select()
        .from(customizationRequests)
        .where(eq(customizationRequests.brandId, brandId))
        .orderBy(customizationRequests.createdAt)
        .limit(20);
      res.json(history);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // Brand Settings (feature flags, customization layer)
  app.get("/api/brands/:brandId/settings", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const [settings] = await db
        .select()
        .from(brandSettings)
        .where(eq(brandSettings.brandId, brandId))
        .limit(1);
      if (settings) {
        res.json(settings);
      } else {
        // Return defaults if no settings row exists yet
        res.json({
          brandId,
          featureFlags: {
            calendar: true, analytics: true, inbox: true, brandStudio: true,
            integrations: true, campaigns: false, customers: false,
            sales: false, team: false, automations: false,
          },
          uiConfig: {},
          instagramConfig: {
            enabledPostTypes: ["image", "carousel", "story", "reel"],
            defaultPostType: "image", autoHashtags: true, captionTemplatesEnabled: true,
          },
        });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch brand settings" });
    }
  });

  app.put("/api/brands/:brandId/settings", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const { featureFlags, uiConfig, instagramConfig } = req.body;
      const now = new Date();

      // Upsert
      const [existing] = await db
        .select()
        .from(brandSettings)
        .where(eq(brandSettings.brandId, brandId))
        .limit(1);

      if (existing) {
        const updateData: any = { updatedAt: now };
        if (featureFlags !== undefined) updateData.featureFlags = featureFlags;
        if (uiConfig !== undefined) updateData.uiConfig = uiConfig;
        if (instagramConfig !== undefined) updateData.instagramConfig = instagramConfig;
        const [updated] = await db
          .update(brandSettings)
          .set(updateData)
          .where(eq(brandSettings.brandId, brandId))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db
          .insert(brandSettings)
          .values({
            brandId,
            featureFlags: featureFlags || {},
            uiConfig: uiConfig || {},
            instagramConfig: instagramConfig || {},
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        res.json(created);
      }
    } catch (err) {
      console.error("PUT /api/brands/:brandId/settings error:", err);
      res.status(500).json({ error: "Failed to save brand settings" });
    }
  });

  // Caption Templates CRUD
  app.get("/api/brands/:brandId/caption-templates", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const templates = await db
        .select()
        .from(captionTemplates)
        .where(eq(captionTemplates.brandId, brandId))
        .orderBy(captionTemplates.createdAt);
      res.json(templates);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch caption templates" });
    }
  });

  app.post("/api/brands/:brandId/caption-templates", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const { name, template, category } = req.body;
      if (!name?.trim() || !template?.trim()) {
        return res.status(400).json({ error: "Name and template are required" });
      }
      const [created] = await db
        .insert(captionTemplates)
        .values({ brandId, name: name.trim(), template: template.trim(), category: category || "general" })
        .returning();
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: "Failed to create caption template" });
    }
  });

  app.delete("/api/brands/:brandId/caption-templates/:templateId", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      await db.delete(captionTemplates).where(and(eq(captionTemplates.id, templateId), eq(captionTemplates.brandId, req.params.brandId)));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete caption template" });
    }
  });

  // Approval Pipeline CRUD
  app.get("/api/brands/:brandId/approval-pipeline", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const [pipeline] = await db
        .select()
        .from(approvalPipelines)
        .where(eq(approvalPipelines.brandId, brandId))
        .limit(1);
      if (pipeline) {
        res.json(pipeline);
      } else {
        // Return default 2-stage pipeline
        res.json({
          brandId,
          name: "Default",
          stages: [
            { id: "review", name: "Review", approverRole: "editor", order: 1 },
            { id: "approve", name: "Approve", approverRole: "owner", order: 2 },
          ],
          isActive: true,
        });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch approval pipeline" });
    }
  });

  app.put("/api/brands/:brandId/approval-pipeline", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const { name, stages, isActive } = req.body;
      if (!stages || !Array.isArray(stages) || stages.length === 0) {
        return res.status(400).json({ error: "At least one stage is required" });
      }
      const now = new Date();

      const [existing] = await db
        .select()
        .from(approvalPipelines)
        .where(eq(approvalPipelines.brandId, brandId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(approvalPipelines)
          .set({
            name: name || existing.name,
            stages,
            isActive: isActive ?? existing.isActive,
            updatedAt: now,
          })
          .where(eq(approvalPipelines.brandId, brandId))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db
          .insert(approvalPipelines)
          .values({
            brandId,
            name: name || "Default",
            stages,
            isActive: isActive ?? true,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        res.json(created);
      }
    } catch (err) {
      console.error("PUT /api/brands/:brandId/approval-pipeline error:", err);
      res.status(500).json({ error: "Failed to save approval pipeline" });
    }
  });

  // Hashtag Sets CRUD
  app.get("/api/brands/:brandId/hashtag-sets", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const sets = await db
        .select()
        .from(hashtagSets)
        .where(eq(hashtagSets.brandId, brandId))
        .orderBy(hashtagSets.createdAt);
      res.json(sets);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch hashtag sets" });
    }
  });

  app.post("/api/brands/:brandId/hashtag-sets", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const brandId = req.params.brandId;
      const { name, hashtags } = req.body;
      if (!name?.trim() || !hashtags?.trim()) {
        return res.status(400).json({ error: "Name and hashtags are required" });
      }
      const [created] = await db
        .insert(hashtagSets)
        .values({ brandId, name: name.trim(), hashtags: hashtags.trim() })
        .returning();
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: "Failed to create hashtag set" });
    }
  });

  app.delete("/api/brands/:brandId/hashtag-sets/:setId", isAuthenticated, requireBrand, async (req: any, res) => {
    try {
      const { setId } = req.params;
      await db.delete(hashtagSets).where(and(eq(hashtagSets.id, setId), eq(hashtagSets.brandId, req.params.brandId)));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete hashtag set" });
    }
  });

  app.get("/api/brands/:brandId/products", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const brandId = req.params.brandId;
      const products = await storage.getBrandProducts(brandId);
      res.json(products);
    } catch (err) {
      console.error("GET /api/brands/:brandId/products error:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/brands/:brandId/products", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const brandId = req.params.brandId;
      const { name, description, price, image } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
      const product = await storage.createBrandProduct({ brandId, name: name.trim(), description: description || null, price: price || null, image: image || null });
      res.status(201).json(product);
    } catch (err) {
      console.error("POST /api/brands/:brandId/products error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/brands/:brandId/products/:id", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const { id, brandId } = req.params;
      const { name, description, price, image } = req.body;
      const updated = await storage.updateBrandProduct(id, brandId, { name, description, price, image });
      if (!updated) return res.status(404).json({ error: "Product not found" });
      res.json(updated);
    } catch (err) {
      console.error("PATCH /api/brands/:brandId/products/:id error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/brands/:brandId/products/:id", isAuthenticated, requireBrand, async (req, res) => {
    try {
      const { id, brandId } = req.params;
      const deleted = await storage.deleteBrandProduct(id, brandId);
      if (!deleted) return res.status(404).json({ error: "Product not found" });
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/brands/:brandId/products/:id error:", err);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Make io accessible in routes via app.set
  app.set("io", io);

  // Register Socket.IO with inbox sync service for real-time sync notifications
  registerSocketIO(io);

  return server;
}
