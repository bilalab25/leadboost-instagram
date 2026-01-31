import express, { type Express } from "express";
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
import { lightspeedService } from "./services/lightspeed";
import { boostyService } from "./services/boosty";
import { generateBrandEssence } from "./services/generateBrandEssence";
import { registerStripeRoutes } from "./stripe/stripeRoutes";
import { billingService } from "./stripe/billingService";
import { generateBrandAssetDescription } from "./services/generateBrandAssetDescription";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import multer from "multer";
import cloudinary from "./cloudinary";
import { db } from "./db";
import { brandDesigns, posIntegrations } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";
import { nanoid } from "nanoid";
import { generateAILogo } from "./services/generateLogo";

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

async function fetchWhatsappBaileysMessagesFromDB(
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
      console.error(`❌ Initial sync error for ${provider}:`, convoData.error);
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
        (p) => p.id !== accountId && p.id !== integration.pageId,
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
              `⚠️ No se pudo obtener foto para el PSID: ${client.id}`,
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
            console.log(`✅ Imagen subida a Cloudinary para ${client.name}`);
          } catch (uploadError) {
            console.error("❌ Error subiendo a Cloudinary:", uploadError);
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

        // Especial para Instagram/Threads
        if (!isOutbound && provider !== "facebook") {
          if (
            fromId.startsWith("1784") ||
            fromName?.toLowerCase() === integration.accountName?.toLowerCase()
          ) {
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
          console.log(`📎 Found ${m.attachments.data.length} attachments`);
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
              console.error("❌ Cloudinary upload failed", err);
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
    console.log(`🔄 Creating ${conversationMetadata.size} conversations...`);
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
    messagesToInsert.forEach((msg) => {
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
        .filter((a) => a.messageId);

      if (finalAttachments.length) {
        await storage.bulkInsertMessageAttachments(finalAttachments);
        console.log(`📎 Inserted ${finalAttachments.length} attachments`);
      }
      console.log(`✅ Initial sync complete for ${provider}`);
    }

    await storage.markIntegrationAsFetched(integration.id);
  } catch (err) {
    console.error(`❌ Initial sync failed for ${provider}:`, err);
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
    console.log(`\n🔄 [INITIAL SYNC] Starting for INSTAGRAM_DIRECT...`);

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
      const messagesListUrl = `https://graph.instagram.com/v24.0/${convo.id}?fields=messages&access_token=${accessToken}`;
      const msgListRes = await fetch(messagesListUrl);
      const msgListData = await msgListRes.json();

      if (msgListData.error) {
        console.error(
          `⚠️ Error fetching message list for conversation ${convo.id}:`,
          msgListData.error,
        );
        continue;
      }

      const messageIds = msgListData.messages?.data || [];
      console.log(
        `  📨 Conversation ${convo.id}: ${messageIds.length} message IDs`,
      );

      const limitedMessageIds = messageIds.slice(0, 50);

      for (const msgRef of limitedMessageIds) {
        const msgDetailUrl = `https://graph.instagram.com/v24.0/${msgRef.id}?fields=id,created_time,from,to,message,attachments&access_token=${accessToken}`;
        const msgDetailRes = await fetch(msgDetailUrl);
        const m = await msgDetailRes.json();

        if (m.error) {
          console.error(`⚠️ Error fetching message ${msgRef.id}:`, m.error);
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

        const isOutbound = fromId === igbaId || fromId.startsWith("1784");

        const contactName = isOutbound ? toName : fromName;
        const messageTimestamp = new Date(m.created_time);

        const recipientIgsid = isOutbound ? toId : fromId;
        const compositeConversationId = `${igbaId}_${recipientIgsid}`;

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
          console.log(`📎 IG Direct: ${attachments.length} attachments`);

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
              console.error("❌ Cloudinary upload failed (IG Direct)", err);
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

    console.log(`🔄 Creating ${conversationMetadata.size} conversations...`);
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
        platform: "instagram_direct",
        contactName: metadata.contactName,
        lastMessage: metadata.latestMessage,
        lastMessageAt: metadata.latestTimestamp,
      });

      conversationMap.set(metaConversationId, conversation.id);
    }

    messagesToInsert.forEach((msg) => {
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
        .filter((a) => a.messageId);

      if (finalAttachments.length) {
        await storage.bulkInsertMessageAttachments(finalAttachments);
        console.log(
          `📎 Inserted ${finalAttachments.length} IG Direct attachments`,
        );
      }

      console.log(`✅ Initial sync complete for instagram_direct`);
    } else {
      console.log(
        `📭 No new messages found for instagram_direct, marking as synced anyway`,
      );
    }

    await storage.markIntegrationAsFetched(integration.id);
    integration.hasFetchedHistory = true;
    console.log(`🏁 [INSTAGRAM_DIRECT] Marked as fetched in DB and memory`);
  } catch (err) {
    console.error(`❌ Initial sync failed for instagram_direct:`, err);
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

  // Register Stripe billing routes
  registerStripeRoutes(app, isAuthenticated);

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
      const { preferredLanguage, brandCategory, ...updates } = req.body;

      // Include brandCategory in the updates if provided
      const fullUpdates = {
        ...updates,
        ...(brandCategory !== undefined && { brandCategory }),
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

  // Toggle auto-post enabled for a brand
  app.patch(
    "/api/brands/:id/auto-post",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId =
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
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
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";

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
          (req.user as any)?.claims?.sub ||
          (req.user as any)?.id ||
          "demo-user";
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
    async (req: any, res) => {
      try {
        const { brandId } = req.params;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        console.log(`[API] Generating brand essence for brand: ${brandId}`);
        const essence = await generateBrandEssence(brandId);

        res.json({ success: true, essence });
      } catch (error: any) {
        console.error("Error generating brand essence:", error);
        res.status(500).json({
          message: error.message || "Failed to generate brand essence",
        });
      }
    },
  );

  // Generate description for a brand asset image using AI
  app.post(
    "/api/brand-assets/generate-description",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
          return res.status(400).json({ message: "Image URL is required" });
        }

        console.log(`[API] Generating asset description for image`);
        const description = await generateBrandAssetDescription(imageUrl);

        res.json({ success: true, description });
      } catch (error: any) {
        console.error("Error generating asset description:", error);
        res.status(500).json({
          message: error.message || "Failed to generate asset description",
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
              error: error instanceof Error ? error.message : "Unknown error",
            });
          });
      } catch (error) {
        console.error("[Logo Generator] Error:", error);
        res.status(500).json({
          message: "Failed to create logo generator job",
          error: error instanceof Error ? error.message : "Unknown error",
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
          error: error instanceof Error ? error.message : "Unknown error",
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
            message: "Has agotado tus 10 imágenes gratuitas. Por favor, conecta un método de pago para continuar generando contenido.",
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
        // Record image usage after processing completes
        processPostGeneration(brandId, job.id, targetMonth, targetYear)
          .then(async (result: any) => {
            // Record image generation for billing (assuming 1 image per post generated)
            const imageCount = result?.postsCreated || 1;
            await billingService.recordImageGeneration(brandId, '/api/post-generator', imageCount);
            console.log(`[Billing] Recorded ${imageCount} image(s) for brand ${brandId}`);
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
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Post Generator Callback - n8n webhook callback endpoint
  app.post("/api/post-generator/callback", async (req: any, res) => {
    try {
      const { jobId, status, result, error } = req.body;

      if (!jobId) {
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

      console.log(
        `[Post Generator] Job ${jobId} updated to ${status || "completed"}`,
      );
      res.json({ success: true });
    } catch (error) {
      console.error("[Post Generator Callback] Error:", error);
      res.status(500).json({
        message: "Failed to process callback",
        error: error instanceof Error ? error.message : "Unknown error",
      });
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
        const { status, scheduledPublishTime } = req.body;
        const brandId = req.brandId;

        if (!status || !["accepted", "rejected", "pending"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const { updateAiGeneratedPostStatus } = await import(
          "./storage/aiGeneratedPosts"
        );

        const updated = await updateAiGeneratedPostStatus(
          postId,
          status,
          scheduledPublishTime,
        );
        if (!updated || updated.brandId !== brandId) {
          return res.status(404).json({ message: "Post not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({
          message: "Failed to update post status",
          error: error instanceof Error ? error.message : "Unknown error",
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
        const { postIds, status } = req.body;
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
          error: error instanceof Error ? error.message : "Unknown error",
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
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Get AI Generated Posts by brand ID (alternative endpoint)
  app.get(
    "/api/ai-generated-posts/:brandId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { brandId } = req.params;
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
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Update AI Generated Post Status (alternative endpoint)
  app.patch(
    "/api/ai-generated-posts/:postId/status",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { postId } = req.params;
        const { status, scheduledPublishTime, imageUrl } = req.body;

        if (!status || !["accepted", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }

        const { updateAiGeneratedPostStatus } = await import(
          "./storage/aiGeneratedPosts"
        );

        const updated = await updateAiGeneratedPostStatus(
          postId,
          status,
          scheduledPublishTime,
          imageUrl,
        );
        if (!updated) {
          return res.status(404).json({ message: "Post not found" });
        }

        res.json(updated);
      } catch (error) {
        console.error("[AI Posts] Error:", error);
        res.status(500).json({
          message: "Failed to update post status",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Get Post Generator Job Status
  app.get(
    "/api/post-generator/jobs/:jobId",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const { jobId } = req.params;

        const { getPostGeneratorJob } = await import(
          "./storage/postGeneratorJobs"
        );

        const job = await getPostGeneratorJob(jobId);
        if (!job) {
          return res.status(404).json({ message: "Job not found" });
        }

        res.json(job);
      } catch (error) {
        console.error("[Post Generator Status] Error:", error);
        res.status(500).json({
          message: "Failed to fetch job status",
          error: error instanceof Error ? error.message : "Unknown error",
        });
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
          error: error instanceof Error ? error.message : "Unknown error",
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
            message: "Has agotado tus 10 imágenes gratuitas. Por favor, conecta un método de pago para continuar generando contenido.",
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
          // Record image usage for sample posts (3 sample posts = 3 images)
          await billingService.recordImageGeneration(brandId, '/api/generate-sample-posts', 3);
          console.log(`[Billing] Recorded 3 sample post images for brand ${brandId}`);

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
        "instagram_content_publish",
        "read_insights",
        "instagram_manage_insights",
        "pages_read_user_content",
      ].join(",");

      console.log("🔐 Facebook OAuth scopes:", scopes);

      // -------------------------------------
      // 🔥 CORRECTO: stringify SOLO UNA VEZ
      // -------------------------------------
      const origin = req.query.origin as string | undefined;
      const statePayload = {
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
        origin: origin || null,
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
    console.log("\n🔵 [FB Callback] START — Facebook OAuth callback\n");

    try {
      const { code, state } = req.query;

      // -----------------------------------------
      // 0️⃣ Validate query params
      // -----------------------------------------
      if (!code) {
        console.log("❌ Missing ?code in callback");
        return res.redirect("/integrations?error=missing_code");
      }

      if (!state) {
        console.log("❌ Missing ?state in callback");
        return res.redirect("/integrations?error=missing_state");
      }

      // -----------------------------------------
      // 1️⃣ Decode state
      // -----------------------------------------
      console.log("🔵 Decoding state...");
      let userId, brandId, origin;

      try {
        const decoded = Buffer.from(state as string, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);

        userId = parsed.userId;
        brandId = parsed.brandId;
        origin = parsed.origin || "integrations";

        console.log("🟢 State decoded:", parsed);
      } catch (err) {
        console.log("❌ Failed to decode state:", err);
        return res.redirect("/integrations?error=invalid_state");
      }

      const redirect_uri = `${process.env.APP_URL}/api/integrations/facebook/callback`;

      // -----------------------------------------
      // 2️⃣ Exchange CODE → USER TOKEN
      // -----------------------------------------
      console.log("🔵 Exchanging code for access token…");

      const tokenRes = await fetch(
        `https://graph.facebook.com/v24.0/oauth/access_token` +
          `?client_id=${process.env.FB_APP_ID}` +
          `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
          `&client_secret=${process.env.FB_APP_SECRET}` +
          `&code=${code}`,
      );

      const tokenJson = await tokenRes.json();
      console.log("🟢 Token response:", tokenJson);

      if (!tokenJson.access_token) {
        return res.redirect("/integrations?error=token_failed");
      }

      const userAccessToken = tokenJson.access_token;

      // -----------------------------------------
      // 3️⃣ Get pages user manages
      // -----------------------------------------
      console.log("🔵 Fetching Facebook Pages…");

      const pagesRes = await fetch(
        `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`,
      );
      const pagesJson = await pagesRes.json();

      console.log("🟢 Pages found:", pagesJson);

      if (!pagesJson.data?.length) {
        return res.redirect("/integrations?error=no_pages");
      }

      // -----------------------------------------
      // 4️⃣ Pick page (prefer one with IG)
      // -----------------------------------------
      console.log("🔵 Searching for IG-linked Page…");

      let selectedPage = null;
      let igInfo = null;
      console.log(pagesJson.data);
      for (const p of pagesJson.data) {
        const detailsRes = await fetch(
          `https://graph.facebook.com/v24.0/${p.id}` +
            `?fields=connected_instagram_account,instagram_business_account` +
            `&access_token=${p.access_token}`,
        );
        const details = await detailsRes.json();
        console.log(details);
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
        console.log(`⚠️ No IG found. Using first page: ${selectedPage.name}`);
      }

      const pageAccessToken = selectedPage.access_token;

      // -----------------------------------------
      // 5️⃣ Save FACEBOOK integration
      // -----------------------------------------
      console.log("🔵 Saving Facebook integration…");

      await storage.createOrUpdateIntegration({
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

      // -----------------------------------------
      // 6️⃣ SUBSCRIBE PAGE TO WEBHOOK  ✅ CLAVE
      // -----------------------------------------
      console.log("🔵 Subscribing Page to webhook…");

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
      console.log("🟢 Subscription response:", subscribeJson);

      if (!subscribeJson.success) {
        console.warn("⚠️ Page subscription failed (messages may not arrive)");
      }

      // -----------------------------------------
      // 7️⃣ Save Instagram + Threads (if exists)
      // -----------------------------------------
      if (igInfo) {
        const igAcc =
          igInfo.connected_instagram_account ||
          igInfo.instagram_business_account;

        const igDetailsRes = await fetch(
          `https://graph.facebook.com/v24.0/${igAcc.id}` +
            `?fields=username,name,profile_picture_url` +
            `&access_token=${pageAccessToken}`,
        );
        const igDetails = await igDetailsRes.json();

        await storage.createOrUpdateIntegration({
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
        });

        await storage.createOrUpdateIntegration({
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
        });
      }

      // -----------------------------------------
      // 8️⃣ Redirect user
      // -----------------------------------------
      const redirectBase =
        origin === "onboarding" ? "/onboarding?step=4" : "/integrations";

      console.log("🟩 OAuth COMPLETE → redirecting user");

      return res.redirect(redirectBase);
    } catch (error) {
      console.error("❌ [FB Callback] Unexpected error:", error);
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
        console.error("❌ IG_APP_ID not configured");
        return res
          .status(500)
          .send("Instagram Direct integration not configured");
      }

      const scopes = [
        "instagram_business_basic",
        "instagram_business_manage_messages",
        "instagram_business_manage_comments",
        "instagram_business_content_publish",
        "instagram_business_manage_insights",
      ].join(",");

      console.log("🔐 Instagram Direct OAuth scopes:", scopes);

      // Get origin from query params (onboarding or integrations)
      const origin = (req.query.origin as string) || "integrations";

      const statePayload = {
        userId: req.user.id,
        brandId: req.brandMembership.brandId,
        origin, // Include origin for redirect after callback
      };

      const state = Buffer.from(JSON.stringify(statePayload)).toString(
        "base64",
      );

      const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri,
      )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;
      console.log(
        "🔗 Instagram Direct OAuth URL:",
        authUrl.replace(clientId, "CLIENT_ID"),
      );
      res.redirect(authUrl);
    },
  );

  app.get("/api/integrations/instagram/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.status(400).send("Missing code");
      if (!state) return res.status(400).send("Missing OAuth state");

      // 1️⃣ Decode OAuth state
      let userId: string | null = null;
      let brandId: string | null = null;
      let origin: string = "integrations";

      try {
        const decoded = Buffer.from(state as string, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        userId = parsed.userId;
        brandId = parsed.brandId;
        origin = parsed.origin || "integrations";
      } catch {
        return res.status(400).send("Invalid OAuth state");
      }

      if (!userId) return res.status(400).send("Missing userId in state");
      if (!brandId) return res.status(400).send("Missing brandId in state");

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
      console.log("🔑 Instagram token response:", tokenData);

      if (tokenData.error_type || tokenData.error_message) {
        console.error("❌ Instagram token exchange error:", tokenData);
        return res
          .status(500)
          .send(`Error: ${tokenData.error_message || "Token exchange failed"}`);
      }

      const shortLivedToken = tokenData.access_token;
      const igUserId = tokenData.user_id;

      console.log(
        "✅ Instagram short-lived token obtained for user:",
        igUserId,
      );

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
        console.log("🔄 Long-lived token response:", longLivedData);
        if (longLivedData.access_token) {
          longLivedToken = longLivedData.access_token;
          expiresAt = longLivedData.expires_in
            ? dayjs().add(longLivedData.expires_in, "seconds").toDate()
            : null;
          console.log(
            "✅ Long-lived token obtained, expires in:",
            longLivedData.expires_in,
            "seconds",
          );
        }
      } catch (err) {
        console.warn(
          "⚠️ Failed to exchange for long-lived token, using short-lived:",
          err,
        );
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
        console.log(
          "📱 Profile response:",
          JSON.stringify(profileData, null, 2),
        );

        if (!profileData.error) {
          if (profileData.username) {
            igUsername = profileData.username;
          }
          // CRITICAL: Use profileData.id as the IGBA ID - this matches webhook recipient.id
          // The token's user_id is app-scoped and different from the IGBA ID
          if (profileData.user_id) {
            igbaId = profileData.user_id.toString();
            appScopedId = igUserId.toString(); // Keep token's user_id as app-scoped reference
          }
          console.log("✅ Profile fetched successfully:", {
            igUsername,
            igbaId,
            appScopedId,
            note: "igbaId from /me endpoint, appScopedId from token",
          });
        } else {
          console.warn(
            "⚠️ Profile fetch returned error, using token's user_id as fallback:",
            profileData.error,
          );
          // Fallback to token's user_id (less reliable for webhook matching)
        }
      } catch (profileErr) {
        console.warn(
          "⚠️ Profile fetch failed, using token's user_id as fallback:",
          profileErr,
        );
        // Continue with default values from token response
      }

      console.log("📱 Instagram profile:", {
        igUsername,
        accountType,
        mediaCount,
        igbaId,
        appScopedId,
      });

      // 5️⃣ Check for duplicate integration (same account connected to another brand)
      const existingIntegration = await storage.checkDuplicateIntegration(
        igbaId.toString(),
        appScopedId.toString(),
        "instagram_direct",
        brandId, // Exclude current brand from check
      );

      if (existingIntegration) {
        console.warn(
          `⚠️ Instagram account ${igUsername} (${igbaId}) already connected to another brand: ${existingIntegration.brandId}`,
        );
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
      await storage.createOrUpdateIntegration({
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

      console.log("✅ Instagram Direct integration saved successfully");

      // 6️⃣ Perform initial message sync
      // Fetch the saved integration to get its ID
      const brandIntegrations = await storage.getIntegrationsByBrandId(brandId);
      const savedIntegration = brandIntegrations.find(
        (i) => i.provider === "instagram_direct" && i.userId === userId,
      );

      if (savedIntegration && !savedIntegration.hasFetchedHistory) {
        console.log("🔄 Starting initial message sync for Instagram Direct...");
        // Run sync in background (don't await to avoid blocking redirect)
        performInstagramDirectSync(userId, savedIntegration).catch((err) => {
          console.error("❌ Background sync failed:", err);
        });
      }

      // 7️⃣ Redirect based on origin (onboarding or integrations)
      console.log(
        `✅ [Instagram Direct Callback] Successfully connected for brand ${brandId}, origin: ${origin}`,
      );
      if (origin === "onboarding") {
        return res.redirect(`/onboarding?step=4&connected=instagram_direct`);
      }
      return res.redirect(`/integrations?connected=instagram_direct`);
    } catch (err) {
      console.error("❌ Instagram callback error:", err);
      return res.status(500).send("Error in Instagram callback");
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

      console.log("🟢 WhatsApp Embedded Signup URL:", embeddedSignupUrl);
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

        console.log("📱 WhatsApp QR Code request for:", phoneNumber);

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

        // Create a simple QR code URL that points to WhatsApp's wa.me link
        // This helps users verify their phone number is correct
        const waLink = `https://wa.me/${phoneNumber}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(waLink)}`;

        console.log("✅ Generated WhatsApp pairing code:", pairingCode);

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
        console.error("❌ WhatsApp QR generation error:", err);
        res.status(500).json({
          error: "Failed to generate QR code",
          details: err instanceof Error ? err.message : String(err),
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

      // 5️⃣ Check for duplicate integration (same WhatsApp account connected to another brand)
      const existingIntegration = await storage.checkDuplicateIntegration(
        wabaId,
        wabaId,
        "whatsapp",
        brandId, // Exclude current brand from check
      );

      if (existingIntegration) {
        console.warn(
          `⚠️ [WhatsApp Callback] WABA ${wabaId} already connected to another brand: ${existingIntegration.brandId}`,
        );
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

      // Redirect based on origin (onboarding or integrations)
      console.log(
        `✅ WhatsApp connected for brand ${brandId}: ${wabaId}, origin: ${origin}`,
      );
      if (origin === "onboarding") {
        res.redirect(`/onboarding?step=4&connected=whatsapp`);
      } else {
        res.redirect(`/integrations?connected=whatsapp`);
      }
    } catch (err: any) {
      console.error("❌ WhatsApp callback error:", err.message || err);
      res
        .status(500)
        .send(`Error in WhatsApp callback: ${err.message || "Unknown error"}`);
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
      console.log("📱 [Baileys] WhatsApp Baileys service loaded");

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
            console.log(
              `✅ [Baileys] Connected event received for user ${userId}, brand ${brandId}, phone: ${phoneNumber}`,
            );

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
              console.log(
                `📝 [Baileys] Updated existing integration: ${existingBaileyIntegration.id}`,
              );
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
              console.log(
                `✅ [Baileys] Created new integration: ${newIntegration.id}`,
              );
            }
          } catch (error) {
            console.error(
              "❌ [Baileys] Error handling connected event:",
              error,
            );
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
            console.log(
              `📨 [Baileys] Message event received for user ${userId}, brand ${brandId}`,
            );

            // Find the WhatsApp Baileys integration for this brand
            const existingIntegrations =
              await storage.getIntegrationsByBrandId(brandId);
            const baileysIntegration = existingIntegrations.find(
              (i: any) =>
                i.provider === "whatsapp_baileys" && i.userId === userId,
            );

            if (!baileysIntegration) {
              console.warn(
                `⚠️ [Baileys] No integration found for brand ${brandId}, user ${userId}`,
              );
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
              messageType: message.type || "text",
              mediaUrl: message.mediaUrl || null,
              metadata: {
                messageType: message.type,
              },
            });

            // Increment unread count
            await storage.incrementUnreadCount(conversation.id);

            console.log(
              `✅ [Baileys] Saved message ${savedMessage.id} to conversation ${conversation.id}`,
            );

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
            console.error("❌ [Baileys] Error handling message event:", error);
          }
        },
      );

      whatsappBaileysService.on(
        "disconnected",
        async ({ sessionKey }: { sessionKey: string }) => {
          try {
            const [userId, brandId] = sessionKey.split("_");
            console.log(
              `🔴 [Baileys] Disconnected event for user ${userId}, brand ${brandId}`,
            );

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
            console.error(
              "❌ [Baileys] Error handling disconnected event:",
              error,
            );
          }
        },
      );

      console.log("📱 [Baileys] Event listeners configured");

      // Restore any existing sessions on startup
      setTimeout(async () => {
        try {
          await whatsappBaileysService.restoreExistingSessions();
          console.log("📱 [Baileys] Session restoration complete");
        } catch (error) {
          console.error("❌ [Baileys] Error restoring sessions:", error);
        }
      }, 2000); // Small delay to ensure routes are fully registered
    } catch (err) {
      console.warn("⚠️ [Baileys] WhatsApp Baileys service not available:", err);
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
        console.error("❌ [Baileys] Connection error:", error);
        res.status(500).json({
          error: "Failed to start WhatsApp connection",
          details: error instanceof Error ? error.message : String(error),
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
        console.error("❌ [Baileys] Status check error:", error);
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
        console.error("❌ [Baileys] Send message error:", error);
        res.status(500).json({
          error: "Failed to send message",
          details: error instanceof Error ? error.message : String(error),
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
        console.error("❌ [Baileys] Disconnect error:", error);
        res.status(500).json({
          error: "Failed to disconnect WhatsApp",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

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
        console.error("❌ Error deleting integration:", error);
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
          console.error("❌ Meta API error fetching templates:", data.error);
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
        console.error("❌ Error fetching WhatsApp templates:", error);
        res.status(500).json({
          error: "Failed to fetch templates",
          message: error.message || "Unknown error",
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
          console.error("❌ Meta API error sending template:", data.error);
          return res.status(400).json({
            error: "Failed to send message",
            message: data.error.message || "Meta API error",
            details: data.error,
          });
        }

        console.log(`✅ WhatsApp template sent to ${formattedPhone}:`, data);

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
              metaConversationId: `${whatsappIntegration?.metadata?.phoneNumberId}_${metaContactId}`,
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
        console.error("❌ Error sending WhatsApp template:", error);
        res.status(500).json({
          error: "Failed to send template",
          message: error.message || "Unknown error",
        });
      }
    },
  );

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
      console.log(" �� REQUEST RECEIVED: POST /api/webhooks/meta");
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
                      brandId: integration.brandId,
                    };

                    const savedMessage =
                      await storage.createMessage(messageData);
                    console.log(
                      `✅ [WhatsApp] Message saved: ${savedMessage.id}`,
                    );

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
                console.log(
                  `📸 [Instagram Direct] Processing message via entry.changes structure`,
                );
                console.log(`- change.field: ${change.field}`);
                console.log(
                  `- change.value:`,
                  JSON.stringify(change.value, null, 2),
                );

                const value = change.value;
                const senderId = value.sender?.id;
                const recipientId = value.recipient?.id;
                const messageId = value.message?.mid;
                const messageText = value.message?.text || "";
                const timestamp = value.timestamp;

                // Handle attachments
                const attachments = value.message?.attachments || [];

                if (!senderId || !recipientId || !messageId) {
                  console.warn(
                    `⚠️ [Instagram Direct] Missing required fields in change.value`,
                  );
                  continue;
                }

                console.log(`📸 [Instagram Direct] Message details:`);
                console.log(`- senderId: ${senderId}`);
                console.log(`- recipientId: ${recipientId}`);
                console.log(`- messageId: ${messageId}`);
                console.log(`- messageText: ${messageText}`);

                // PRIORITY 1: Check if there's an existing conversation for this metaConversationId
                const potentialMetaConversationId = `ig_${senderId}_${recipientId}`;
                const existingConversationByMeta =
                  await storage.findConversationByMetaConversationId(
                    potentialMetaConversationId,
                  );

                let integration;
                if (existingConversationByMeta) {
                  console.log(
                    `✅ [Instagram Direct] Found existing conversation by metaConversationId, using its integration`,
                  );
                  integration = await storage.getIntegrationById(
                    existingConversationByMeta.integrationId,
                  );
                }

                // PRIORITY 2: If no existing conversation, search for integration by pageId
                if (!integration) {
                  const allIntegrations = await storage.getAllIntegrations();
                  console.log(
                    `📋 All integrations (${allIntegrations.length} total):`,
                  );
                  for (const int of allIntegrations) {
                    console.log(
                      `- ID: ${int.id}, provider: ${int.provider}, accountId: ${int.accountId}, pageId: ${int.pageId}`,
                    );
                  }

                  // Find integration by recipientId matching accountId or pageId
                  integration = allIntegrations.find(
                    (int) =>
                      (int.provider === "instagram_direct" ||
                        int.provider === "instagram") &&
                      (int.accountId === recipientId ||
                        int.pageId === recipientId),
                  );
                }

                if (integration) {
                  const platform = "instagram_direct";
                  const accessToken = integration.accessToken;
                  const isOutbound =
                    senderId === integration.accountId ||
                    senderId === integration.pageId ||
                    senderId.startsWith("1784"); // Instagram business accounts start with 1784

                  // For outbound messages, the conversation ID should use the recipientId as the contact
                  // For inbound messages, use senderId as the contact
                  const contactId = isOutbound ? recipientId : senderId;
                  let metaConversationId = `ig_${contactId}_${integration.accountId || integration.pageId}`;
                  // Fallback metaConversationId format for legacy conversations
                  const legacyMetaConversationId = `ig_${senderId}_${recipientId}`;

                  console.log(`📊 [Instagram Direct] Direction analysis:`);
                  console.log(`- senderId: ${senderId}`);
                  console.log(
                    `- integration.accountId: ${integration.accountId}`,
                  );
                  console.log(`- isOutbound (echo): ${isOutbound}`);
                  console.log(`- contactId: ${contactId}`);
                  console.log(`- metaConversationId: ${metaConversationId}`);

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
                      console.log(
                        `⏭️ [Instagram Direct] Using cached profile data (fetched ${fetchedAt.toISOString()})`,
                      );

                      // If we have cached picture but no name, we should still try to fetch the name
                      if (!contactName) {
                        shouldFetchContactName = true;
                        console.log(
                          `🔄 [Instagram Direct] Cached picture exists but no name - will fetch profile`,
                        );
                      }
                    }
                  }

                  // If outbound (echo), preserve existing contact info - DO NOT fetch profile of the business account
                  if (isOutbound && existingConversation) {
                    contactName = existingConversation.contactName;
                    contactProfilePicture =
                      existingConversation.contactProfilePicture;
                    console.log(
                      `📤 [Instagram Direct] Echo message - preserving existing contactName: ${contactName}`,
                    );
                  }

                  // Only fetch profile for INBOUND messages if we don't have recent data OR if name is missing
                  if (
                    (shouldFetchProfilePicture || shouldFetchContactName) &&
                    !isOutbound
                  ) {
                    try {
                      console.log(
                        `📱 [Instagram Direct] Fetching profile for sender: ${senderId} (fetchPic: ${shouldFetchProfilePicture}, fetchName: ${shouldFetchContactName})`,
                      );

                      // First, try using conversation participants endpoint (more reliable for IG)
                      const convoParticipantsUrl = `https://graph.facebook.com/v24.0/${integration.accountId || integration.pageId}/conversations?platform=instagram&user_id=${contactId}&fields=participants&access_token=${accessToken}`;
                      const convoParticipantsRes =
                        await fetch(convoParticipantsUrl);
                      const convoParticipantsData =
                        await convoParticipantsRes.json();

                      console.log(
                        `📋 [Instagram Direct] Conversation participants response:`,
                        JSON.stringify(convoParticipantsData, null, 2),
                      );

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
                          console.log(
                            `✅ [Instagram Direct] Got contact name from conversation: ${contactName}`,
                          );
                        }
                      }

                      // If still no name, try Instagram Graph API endpoint (graph.instagram.com)
                      if (!contactName) {
                        const igProfileUrl = `https://graph.instagram.com/v24.0/${contactId}?fields=name,profile_pic&access_token=${accessToken}`;
                        console.log(
                          `📱 [Instagram Direct] Trying Instagram Graph API: ${igProfileUrl.replace(accessToken, "TOKEN_HIDDEN")}`,
                        );
                        const igProfileRes = await fetch(igProfileUrl);
                        const igProfileData = await igProfileRes.json();
                        console.log(
                          `📱 [Instagram Direct] Instagram Graph API response:`,
                          JSON.stringify(igProfileData, null, 2),
                        );

                        if (!igProfileData.error) {
                          if (igProfileData.name) {
                            contactName = igProfileData.name;
                            console.log(
                              `✅ [Instagram Direct] Got contact name: ${contactName}`,
                            );
                          }
                          if (igProfileData.profile_pic) {
                            contactProfilePicture = igProfileData.profile_pic;
                            console.log(
                              `✅ [Instagram Direct] Got profile picture`,
                            );
                          }
                        } else {
                          console.warn(
                            `⚠️ [Instagram Direct] Instagram Graph API error:`,
                            igProfileData.error,
                          );

                          // Fallback to Facebook Graph API
                          const fbProfileUrl = `https://graph.facebook.com/v24.0/${contactId}?fields=name,profile_pic&access_token=${accessToken}`;
                          console.log(
                            `📱 [Instagram Direct] Fallback to Facebook Graph API...`,
                          );
                          const fbProfileRes = await fetch(fbProfileUrl);
                          const fbProfileData = await fbProfileRes.json();

                          if (!fbProfileData.error) {
                            if (fbProfileData.name) {
                              contactName = fbProfileData.name;
                              console.log(
                                `✅ [Instagram Direct] Got contact name from FB: ${contactName}`,
                              );
                            }
                            if (fbProfileData.profile_pic) {
                              contactProfilePicture = fbProfileData.profile_pic;
                              console.log(
                                `✅ [Instagram Direct] Got profile picture from FB`,
                              );
                            }
                          }
                        }
                      }
                    } catch (profileErr) {
                      console.warn(
                        `⚠️ [Instagram Direct] Error fetching profile:`,
                        profileErr,
                      );
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
                    console.log(
                      `🔗 [Instagram Direct] Found existing conversation: ${existingConversation.id}`,
                    );

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
                    console.log(
                      `🆕 [Instagram Direct] Creating new conversation`,
                    );
                    conversation = await storage.getOrCreateConversation({
                      integrationId: integration.id,
                      brandId: integration.brandId,
                      userId: integration.userId,
                      metaConversationId,
                      platform,
                      contactName,
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
                    console.log(
                      `⏭️ [Instagram Direct] Message already exists: ${existingMessage.id}, skipping`,
                    );
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
                      console.log(
                        `📎 [Instagram Direct] Processing ${attachments.length} attachments`,
                      );
                      const attachmentsToInsert = [];

                      for (const att of attachments) {
                        const info = getWebhookAttachmentInfo(att);
                        if (!info.url) {
                          console.warn(
                            `⚠️ [Instagram Direct] Attachment has no URL:`,
                            att,
                          );
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
                          console.log(
                            `✅ [Instagram Direct] Uploaded attachment to Cloudinary`,
                          );
                        } catch (err) {
                          console.warn(
                            `⚠️ [Instagram Direct] Cloudinary upload failed, using original URL`,
                          );
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
                        console.log(
                          `✅ [Instagram Direct] Saved ${attachmentsToInsert.length} attachments`,
                        );
                      }
                    }

                    console.log(
                      `✅ [Instagram Direct] Message saved: ${savedMessage.id} (direction: ${isOutbound ? "outbound" : "inbound"})`,
                    );

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
                      console.log(
                        `🔔 [Instagram Direct] Socket event emitted to brand:${integration.brandId}`,
                      );
                    }
                  } catch (msgErr: any) {
                    if (msgErr.code === "23505") {
                      console.log(
                        `⏭️ [Instagram Direct] Duplicate message detected via constraint, skipping`,
                      );
                    } else {
                      throw msgErr;
                    }
                  }
                } else {
                  console.warn(
                    `⚠️ [Instagram Direct] No integration found for recipientId: ${recipientId}`,
                  );
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
              const messageText = event.message.text || "";
              const searchPlatform =
                body.object === "instagram" ? "instagram" : "facebook";

              // Handle attachments
              const attachments = event.message.attachments || [];

              // Debug: Log what we're searching for
              console.log(`🔍 Searching for integration:`);
              console.log(`- recipientId: ${recipientId}`);
              console.log(`- searchPlatform: ${searchPlatform}`);

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
                  console.log(
                    `✅ Found existing conversation by metaConversationId: ${metaId}`,
                  );
                  integration = await storage.getIntegrationById(
                    existingConvo.integrationId,
                  );
                  if (integration) break;
                }
              }

              // PRIORITY 2: If no existing conversation, search for integration by pageId
              if (!integration) {
                // Debug: List all integrations to see what's in DB
                const allIntegrations = await storage.getAllIntegrations();
                console.log(
                  `📋 All integrations in DB (${allIntegrations.length} total):`,
                );
                for (const int of allIntegrations) {
                  console.log(
                    `- ID: ${int.id}, provider: ${int.provider}, accountId: ${int.accountId}, pageId: ${int.pageId}`,
                  );
                }

                integration = await storage.findIntegrationByAccount(
                  recipientId,
                  searchPlatform,
                );

                console.log(
                  `🔎 findIntegrationByAccount result:`,
                  integration ? `Found (${integration.provider})` : "NOT FOUND",
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
                    metaConversationId = `${recipientId}_${senderId}`;
                  }
                } catch (err) {
                  metaConversationId = `${recipientId}_${senderId}`;
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
                    console.log(
                      `⏭️ [${platform}] Using cached profile picture (fetched ${fetchedAt.toISOString()})`,
                    );
                  }
                }

                // Only fetch profile if we don't have a recent one
                if (shouldFetchProfilePicture) {
                  try {
                    // For Instagram, try using the conversation participants endpoint first
                    if (platform === "instagram_direct") {
                      console.log(
                        `📷 [${platform}] Trying to fetch profile via conversation participants...`,
                      );

                      // First, try to get the conversation ID from Meta
                      const convoInfoUrl = `https://graph.instagram.com/v24.0/${senderId}?fields=name,profile_pic&access_token=${accessToken}`;
                      const convoInfoRes = await fetch(convoInfoUrl);
                      const convoInfoData = await convoInfoRes.json();
                      console.log(convoInfoUrl);

                      console.log(
                        `📋 [${platform}] Conversation participants response:`,
                        JSON.stringify(convoInfoData, null, 2),
                      );

                      if (!convoInfoData.error) {
                        if (convoInfoData.username || convoInfoData.name) {
                          contactName =
                            convoInfoData.username || convoInfoData.name;
                          console.log(
                            `✅ [${platform}] Got contact name: ${contactName}`,
                          );
                        }
                        if (convoInfoData.profile_pic) {
                          contactProfilePicture = convoInfoData.profile_pic;
                          console.log(`✅ [${platform}] Got profile picture`);
                        }
                      } else {
                        console.warn(
                          `⚠️ [${platform}] Profile API error:`,
                          profileData.error,
                        );
                      }
                    } else {
                      // For Facebook Messenger, use direct profile endpoint
                      const profileUrl = `https://graph.facebook.com/v24.0/${senderId}?fields=name,profile_pic&access_token=${accessToken}`;
                      console.log(
                        `📷 [${platform}] Fetching profile for sender: ${senderId}`,
                      );
                      const profileRes = await fetch(profileUrl);
                      const profileData = await profileRes.json();

                      if (!profileData.error) {
                        if (profileData.username || profileData.name) {
                          contactName =
                            profileData.username || profileData.name;
                          console.log(
                            `✅ [${platform}] Got contact name: ${contactName}`,
                          );
                        }
                        if (profileData.profile_pic) {
                          contactProfilePicture = profileData.profile_pic;
                          console.log(`✅ [${platform}] Got profile picture`);
                        }
                      } else {
                        console.warn(
                          `⚠️ [${platform}] Profile API error:`,
                          profileData.error,
                        );
                      }
                    }
                  } catch (profileErr) {
                    console.warn(
                      `⚠️ [${platform}] Error fetching profile:`,
                      profileErr,
                    );
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
                    contactName,
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
                  console.log(
                    `⏭️ [${platform}] Message already exists: ${existingMessage.id}, skipping`,
                  );
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
                    direction: "inbound",
                    isRead: false,
                    timestamp: new Date(event.timestamp || Date.now()),
                    rawPayload: body,
                  });

                  // Process and save attachments
                  if (attachments.length > 0) {
                    console.log(
                      `📎 [${platform}] Processing ${attachments.length} attachments`,
                    );
                    const attachmentsToInsert = [];

                    for (const att of attachments) {
                      const info = getWebhookAttachmentInfo(att);
                      if (!info.url) {
                        console.warn(
                          `⚠️ [${platform}] Attachment has no URL:`,
                          att,
                        );
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
                        console.log(
                          `✅ [${platform}] Uploaded attachment to Cloudinary`,
                        );
                      } catch (err) {
                        console.warn(
                          `⚠️ [${platform}] Cloudinary upload failed, using original URL`,
                        );
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
                      console.log(
                        `✅ [${platform}] Saved ${attachmentsToInsert.length} attachments`,
                      );
                    }
                  }

                  console.log(
                    `✅ [${platform}] Message saved: ${savedMessage.id}`,
                  );

                  await storage.incrementUnreadCount(conversation.id);

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
                    console.log(
                      `🔔 [${platform}] Socket event emitted to brand:${integration.brandId}`,
                    );
                  }
                } catch (msgErr: any) {
                  if (msgErr.code === "23505") {
                    console.log(
                      `⏭️ [${platform}] Duplicate message detected via constraint, skipping`,
                    );
                  } else {
                    throw msgErr;
                  }
                }
              } else {
                console.warn(
                  `⚠️ [${searchPlatform}] No integration found for recipient: ${recipientId}`,
                );
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

        const validProviders = [
          "facebook",
          "instagram",
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
          case "whatsapp_baileys":
            // Fetch messages from DB for WhatsApp Baileys
            messages = await fetchWhatsappBaileysMessagesFromDB(
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

          // Sync for Meta platforms via Facebook API (Facebook, Instagram, Threads)
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

          // Sync for Instagram Direct (via Instagram Login API)
          if (
            provider === "instagram_direct" &&
            !integration.hasFetchedHistory
          ) {
            console.log(
              `🔄 [Initial Sync] Starting initial sync for instagram_direct (${integration.accountName})`,
            );

            try {
              await performInstagramDirectSync(userId, integration);
              console.log(
                `✅ [Initial Sync] Completed for instagram_direct (${integration.accountName})`,
              );
            } catch (syncError) {
              console.error(
                `❌ [Initial Sync] Failed for instagram_direct:`,
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

  // ✅ NEW: Refresh contact name for a conversation (fetch from platform API)
  app.patch(
    "/api/conversations/:id/refresh-contact",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const { id } = req.params;
        const brandId = req.brandMembership.brandId;

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
            console.log(`📱 Fetching Instagram profile for: ${senderId}`);

            const profileRes = await fetch(profileUrl);
            const profileData = await profileRes.json();

            if (
              !profileData.error &&
              (profileData.username || profileData.name)
            ) {
              contactName = profileData.username || profileData.name;
              console.log(`✅ Got Instagram contact name: ${contactName}`);
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
            console.log(`📱 Fetching Facebook profile for: ${senderId}`);

            const fbProfileRes = await fetch(fbProfileUrl);
            const fbProfileData = await fbProfileRes.json();

            if (!fbProfileData.error && fbProfileData.name) {
              contactName = fbProfileData.name;
              console.log(`✅ Got Facebook contact name: ${contactName}`);
            }
          } else if (platform === "whatsapp") {
            // WhatsApp - contact name usually comes from webhook, can't fetch via API
            // Use phone number as fallback
            contactName = senderId.startsWith("+") ? senderId : `+${senderId}`;
            console.log(`📱 Using WhatsApp number as contact: ${contactName}`);
          }
        } catch (apiErr) {
          console.warn(`⚠️ Error fetching profile:`, apiErr);
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
        console.error("❌ Error refreshing contact name:", err);
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
        const brandId = req.brandMembership.brandId;

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
              console.log(`✅ Updated: ${conversation.id} -> ${contactName}`);
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
        console.error("❌ Error bulk refreshing contact names:", err);
        res.status(500).json({ error: "Failed to refresh contact names" });
      }
    },
  );

  // ✅ NEW: Get inbox statistics (total messages, unread, urgent, avg response time)
  // ✅ NEW: Get inbox statistics (total messages, unread, urgent, avg response time)
  app.get(
    "/api/inbox/stats",
    isAuthenticated,
    requireBrand,
    async (req, res) => {
      try {
        const brandId = req.brandMembership.brandId;

        // Get all conversations for the brand
        const conversationsList =
          await storage.getConversationsByBrandId(brandId);

        // Calculate statistics
        let totalMessages = 0;
        let totalUnread = 0;
        let urgentCount = 0;
        let responseTimes: number[] = [];

        for (const conversation of conversationsList) {
          // Count unread
          totalUnread += conversation.unreadCount || 0;

          // Count urgent
          if (conversation.flag === "important") {
            urgentCount++;
          }

          // Get messages
          const conversationMessages = await storage.getConversationMessages(
            conversation.id,
          );

          totalMessages += conversationMessages.length;

          // Calculate response times
          let lastInboundTime: Date | null = null;

          for (const msg of conversationMessages) {
            // 🔑 NORMALIZAR TIMESTAMP (CLAVE DEL FIX)
            const msgTime =
              msg.timestamp instanceof Date
                ? msg.timestamp
                : new Date(msg.timestamp);

            if (msg.direction === "inbound") {
              lastInboundTime = msgTime;
            } else if (msg.direction === "outbound" && lastInboundTime) {
              const responseTime =
                msgTime.getTime() - lastInboundTime.getTime();

              if (responseTime > 0) {
                responseTimes.push(responseTime);
              }

              lastInboundTime = null; // Reset after pairing
            }
          }
        }

        // Calculate average response time
        let avgResponseTime = "N/A";

        if (responseTimes.length > 0) {
          const avgMs =
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

          const avgMinutes = Math.round(avgMs / 60000);

          if (avgMinutes < 60) {
            avgResponseTime = `${avgMinutes}m`;
          } else {
            const hours = Math.floor(avgMinutes / 60);
            const mins = avgMinutes % 60;
            avgResponseTime = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
          }
        }

        console.log(
          `📊 Inbox stats for brand ${brandId}: ${totalMessages} messages, ${totalUnread} unread, ${urgentCount} urgent`,
        );

        res.json({
          totalMessages,
          unread: totalUnread,
          urgent: urgentCount,
          avgResponseTime,
          conversationCount: conversationsList.length,
        });
      } catch (err) {
        console.error("❌ Error fetching inbox stats:", err);
        res.status(500).json({ error: "Failed to fetch inbox stats" });
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

                // a�� Step 2: Always read messages from your local database
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

        // For Instagram, also check instagram_direct provider (conversations may have old platform value)
        let integration = integrations.find((i) => i.provider === provider);

        if (!integration && provider === "instagram") {
          integration = integrations.find((i) => i.provider === "instagram");

          if (integration) {
            console.log("✔️ Using Instagram Business integration");
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
              "No se encontró el Page ID vinculado a la cuenta IG.",
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
              "No se encontró el IGBA ID de la cuenta Instagram.",
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
              console.log(`📍 Recipient ID (fallback DB): ${recipientId}`);
            } else {
              return res.status(400).json({
                error:
                  "No se pudo determinar el destinatario de Instagram Direct",
              });
            }
          }

          console.log(`📍 Recipient ID (IG Direct): ${recipientId}`);

          // Instagram Direct uses /me/messages endpoint with Bearer token
          // Per Meta's API docs, uses Authorization header instead of access_token param
          url = `https://graph.instagram.com/v21.0/me/messages`;

          // Build payload - Instagram Direct API expects stringified JSON for message and recipient
          payload = {
            recipient: JSON.stringify({ id: recipientId }),
            message: JSON.stringify({ text: content }),
          };

          console.log("✅ [Instagram Direct] Payload final:", payload);
          console.log(
            "✅ [Instagram Direct] Using Authorization Bearer header",
          );
        }

        // =========================================================
        // 🟩 WHATSAPP
        // =========================================================
        else if (actualProvider === "whatsapp") {
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
            integration.metadata?.phoneNumberId || integration.accountId;
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

          console.log(`📱 [WhatsApp Baileys] Phone number: ${phoneNumber}`);

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
            messageType: "text",
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
        console.log("🚀 Enviando mensaje a Meta API:");
        console.log("🔗 URL:", url);
        console.log("📦 Payload:", JSON.stringify(payload, null, 2));

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

  // ==================================================================================
  // LIGHTSPEED RETAIL X-SERIES OAUTH ROUTES
  // ==================================================================================

  // Initiate Lightspeed OAuth flow
  app.get("/api/lightspeed/auth", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
      const brandId = req.query.brandId as string;
      const domainPrefix = req.query.domainPrefix as string | undefined;

      if (!brandId) {
        return res.status(400).json({ message: "Brand ID is required" });
      }

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
      console.log(
        "🔗 Lightspeed OAuth URL generated for brand:",
        brandId,
        domainPrefix ? `domain: ${domainPrefix}` : "(domain from callback)",
      );

      res.json({ authUrl });
    } catch (error) {
      console.error("Error initiating Lightspeed OAuth:", error);
      res.status(500).json({ message: "Failed to initiate Lightspeed OAuth" });
    }
  });

  // Lightspeed OAuth callback
  app.get("/api/lightspeed/callback", async (req: any, res) => {
    try {
      const { code, state, domain_prefix: queryDomainPrefix } = req.query;

      console.log("📥 Lightspeed OAuth callback received:", {
        hasCode: !!code,
        hasState: !!state,
        hasDomainPrefix: !!queryDomainPrefix,
      });

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

      console.log(
        "📥 Using domain prefix:",
        domainPrefix,
        queryDomainPrefix ? "(from callback)" : "(from state)",
      );

      // Exchange code for tokens using domain from state
      const tokens = await lightspeedService.exchangeCodeForToken(
        code as string,
        domainPrefix,
      );

      console.log("✅ Lightspeed tokens received:", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });

      // Ensure user exists in the database before creating integration
      const existingUser = await storage.getUser(stateData.userId);
      if (!existingUser) {
        console.log(
          "📝 Creating user for Lightspeed integration:",
          stateData.userId,
        );
        await storage.createUser({
          id: stateData.userId,
          email: `user-${stateData.userId.substring(0, 8)}@lightspeed.temp`,
          firstName: "Lightspeed",
          lastName: "User",
        });
      }

      // Create the integration
      const integrationId = await lightspeedService.createIntegration(
        stateData.userId,
        stateData.brandId,
        domainPrefix,
        tokens,
      );

      console.log("✅ Lightspeed integration created:", integrationId);

      // Initial sync of customers and sales, then register webhooks
      try {
        const integration = await db.query.posIntegrations.findFirst({
          where: eq(posIntegrations.id, integrationId),
        });

        if (integration) {
          const customerCount =
            await lightspeedService.syncCustomers(integration);
          const salesCount = await lightspeedService.syncSales(integration);
          console.log(
            `✅ Initial sync completed: ${customerCount} customers, ${salesCount} sales`,
          );

          // Register webhooks for real-time updates
          try {
            const webhooks =
              await lightspeedService.registerWebhooks(integration);
            console.log(`✅ Webhooks registered:`, webhooks);
          } catch (webhookError) {
            console.error(
              "Failed to register webhooks (sync still completed):",
              webhookError,
            );
          }
        }
      } catch (syncError) {
        console.error(
          "Initial sync failed (integration still created):",
          syncError,
        );
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
      console.error("❌ Lightspeed OAuth callback error:", error);
      res.status(500).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Connection Failed</h1>
            <p>${error instanceof Error ? error.message : "Unknown error occurred"}</p>
            <script>
              setTimeout(() => window.close(), 5000);
            </script>
          </body>
        </html>
      `);
    }
  });

  // Get Lightspeed integration status for a brand
  app.get("/api/lightspeed/status", isAuthenticated, async (req: any, res) => {
    try {
      const brandId = req.query.brandId as string;

      if (!brandId) {
        return res.status(400).json({ message: "Brand ID is required" });
      }

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
      console.error("Error fetching Lightspeed status:", error);
      res.status(500).json({ message: "Failed to fetch Lightspeed status" });
    }
  });

  // Sync Lightspeed data manually
  app.post("/api/lightspeed/sync", isAuthenticated, async (req: any, res) => {
    try {
      console.log("Lightspeed sync - req.body:", JSON.stringify(req.body));
      const brandId = req.body?.brandId as string;

      if (!brandId) {
        console.log("Brand ID missing from body");
        return res.status(400).json({ message: "Brand ID is required" });
      }

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
      console.error("Error syncing Lightspeed data:", error);
      res.status(500).json({ message: "Failed to sync Lightspeed data" });
    }
  });

  // Re-link existing sales with customers (fix historical data)
  app.post("/api/lightspeed/relink", isAuthenticated, async (req: any, res) => {
    try {
      const brandId = req.body?.brandId as string;

      if (!brandId) {
        return res.status(400).json({ message: "Brand ID is required" });
      }

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
      console.error("Error re-linking Lightspeed sales:", error);
      res
        .status(500)
        .json({ message: "Failed to re-link sales with customers" });
    }
  });

  // Force re-sync: Delete all sales and re-fetch from Lightspeed (fixes missing customer_id)
  app.post(
    "/api/lightspeed/force-resync",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const brandId = req.body?.brandId as string;
        const daysBack = parseInt(req.body?.daysBack) || 90;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

        const integration =
          await lightspeedService.getIntegrationByBrand(brandId);

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Lightspeed integration not found" });
        }

        console.log(
          `Force re-sync requested for brand ${brandId}, daysBack: ${daysBack}`,
        );
        const result = await lightspeedService.forceResyncSales(
          integration,
          daysBack,
        );

        res.json({
          success: true,
          ...result,
        });
      } catch (error) {
        console.error("Error force re-syncing Lightspeed sales:", error);
        res.status(500).json({ message: "Failed to force re-sync sales" });
      }
    },
  );

  // Get Lightspeed customers for a brand
  app.get(
    "/api/lightspeed/customers",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const brandId = req.query.brandId as string;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

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
        console.error("Error fetching Lightspeed customers:", error);
        res.status(500).json({ message: "Failed to fetch customers" });
      }
    },
  );

  // Get Lightspeed sales for a brand
  app.get("/api/lightspeed/sales", isAuthenticated, async (req: any, res) => {
    try {
      const brandId = req.query.brandId as string;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!brandId) {
        return res.status(400).json({ message: "Brand ID is required" });
      }

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
      console.error("Error fetching Lightspeed sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  // Disconnect Lightspeed integration
  app.delete(
    "/api/lightspeed/disconnect",
    isAuthenticated,
    async (req: any, res) => {
      try {
        // Accept brandId from query params (for DELETE) or body
        const brandId = (req.query.brandId || req.body.brandId) as string;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

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
        console.error("Error disconnecting Lightspeed:", error);
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
            console.warn("⚠️ Lightspeed webhook signature verification failed");
            // Continue processing anyway for now, as signature verification can be tricky
          }
        }

        // Parse the payload from the form data
        const payloadString = req.body.payload;
        if (!payloadString) {
          console.log("📥 Lightspeed webhook received (no payload):", req.body);
          return res.status(200).send("OK");
        }

        const payload = JSON.parse(payloadString);
        const eventType = req.body.type || "unknown";

        console.log(`📥 Lightspeed webhook received: ${eventType}`);

        // Process the webhook event asynchronously
        lightspeedService
          .processWebhookEvent(eventType, payload)
          .catch((err) => console.error("Error processing webhook:", err));

        // Always respond quickly with 200 OK
        res.status(200).send("OK");
      } catch (error) {
        console.error("Error handling Lightspeed webhook:", error);
        // Still return 200 to prevent Lightspeed from retrying
        res.status(200).send("OK");
      }
    },
  );

  // Register webhooks for a Lightspeed integration
  app.post(
    "/api/lightspeed/webhooks/register",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const brandId = req.body.brandId as string;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

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
        console.error("Error registering Lightspeed webhooks:", error);
        res.status(500).json({ message: "Failed to register webhooks" });
      }
    },
  );

  // List webhooks for a Lightspeed integration
  app.get(
    "/api/lightspeed/webhooks",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const brandId = req.query.brandId as string;

        if (!brandId) {
          return res.status(400).json({ message: "Brand ID is required" });
        }

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
        console.error("Error listing Lightspeed webhooks:", error);
        res.status(500).json({ message: "Failed to list webhooks" });
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
          // Preserve existing preferredLanguage if not provided in update
          const updateData = {
            ...designData,
            // Only override preferredLanguage if explicitly provided in request
            preferredLanguage:
              designData.preferredLanguage || existingDesign.preferredLanguage,
          };
          console.log(
            "[API /api/brand-design] Preserving preferredLanguage:",
            updateData.preferredLanguage,
          );

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
        const {
          brandDesignId,
          url,
          name,
          category,
          assetType,
          publicId,
          description,
        } = req.body;
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
          description,
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
        const userId = req.user.id;
        const { message, conversationHistory, language } = req.body;

        if (!message || typeof message !== "string") {
          return res.status(400).json({ error: "Message is required" });
        }

        const chatResponse = await boostyService.chat(
          brandId,
          userId,
          message,
          conversationHistory || [],
          language || "es",
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

  app.get(
    "/api/boosty/suggestions",
    isAuthenticated,
    requireBrand,
    async (req: any, res) => {
      try {
        const brandId = req.brandId;
        const userId = req.user.id;
        const language = (req.query.language as string) || "es";

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
        const userId = req.user.id;

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

    // Handle room joining for brand-specific updates
    socket.on("join_brand", (brandId: string) => {
      if (brandId) {
        const room = `brand:${brandId}`;
        socket.join(room);
        console.log(`📢 Socket ${socket.id} joined room: ${room}`);
      }
    });

    // Handle room leaving
    socket.on("leave_brand", (brandId: string) => {
      if (brandId) {
        const room = `brand:${brandId}`;
        socket.leave(room);
        console.log(`🚪 Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.IO client disconnected:", socket.id);
    });
  });

  // Make io accessible in routes via app.set
  app.set("io", io);

  return server;
}
