import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";

interface WhatsAppSession {
  socket: WASocket | null;
  qrCode: string | null;
  status: "disconnected" | "connecting" | "connected" | "qr_ready";
  phoneNumber: string | null;
  lastActivity: Date;
  userId: string;
  brandId: string;
}

interface IncomingMessage {
  id: string;
  from: string;
  fromName: string;
  text: string;
  timestamp: Date;
  type: "text" | "image" | "video" | "audio" | "document";
  mediaUrl?: string;
}

class WhatsAppBaileysService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private authBasePath = "./whatsapp-sessions";

  constructor() {
    super();
    if (!fs.existsSync(this.authBasePath)) {
      fs.mkdirSync(this.authBasePath, { recursive: true });
    }
  }

  private getSessionKey(userId: string, brandId: string): string {
    return `${userId}_${brandId}`;
  }

  private getAuthPath(sessionKey: string): string {
    return path.join(this.authBasePath, sessionKey);
  }

  async initSession(userId: string, brandId: string): Promise<{ qrCode: string | null; status: string }> {
    const sessionKey = this.getSessionKey(userId, brandId);
    
    const existingSession = this.sessions.get(sessionKey);
    if (existingSession?.status === "connected") {
      return { qrCode: null, status: "already_connected" };
    }

    if (existingSession?.status === "connecting" || existingSession?.status === "qr_ready") {
      return { qrCode: existingSession.qrCode, status: existingSession.status };
    }

    const session: WhatsAppSession = {
      socket: null,
      qrCode: null,
      status: "connecting",
      phoneNumber: null,
      lastActivity: new Date(),
      userId,
      brandId,
    };
    this.sessions.set(sessionKey, session);

    try {
      const authPath = this.getAuthPath(sessionKey);
      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["CampAIgner", "Chrome", "1.0.0"],
        syncFullHistory: false,
      });

      session.socket = socket;

      socket.ev.on("creds.update", saveCreds);

      socket.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
            });
            session.qrCode = qrDataUrl;
            session.status = "qr_ready";
            this.emit("qr", { sessionKey, qrCode: qrDataUrl });
            console.log(`📱 [WhatsApp Baileys] QR code generated for session: ${sessionKey}`);
          } catch (err) {
            console.error("❌ Error generating QR code:", err);
          }
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          console.log(`🔴 [WhatsApp Baileys] Connection closed for ${sessionKey}. Reconnect: ${shouldReconnect}`);

          if (shouldReconnect) {
            session.status = "connecting";
            setTimeout(() => this.initSession(userId, brandId), 5000);
          } else {
            session.status = "disconnected";
            session.socket = null;
            session.qrCode = null;
            this.emit("disconnected", { sessionKey });
          }
        } else if (connection === "open") {
          session.status = "connected";
          session.qrCode = null;
          session.lastActivity = new Date();

          const phoneNumber = socket.user?.id?.split(":")[0] || socket.user?.id;
          session.phoneNumber = phoneNumber || null;

          console.log(`🟢 [WhatsApp Baileys] Connected! Phone: ${session.phoneNumber}`);
          this.emit("connected", { sessionKey, phoneNumber: session.phoneNumber });
        }
      });

      socket.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        for (const msg of messages) {
          if (msg.key.fromMe) continue;

          const from = msg.key.remoteJid || "";
          const fromName = msg.pushName || from.split("@")[0];

          let text = "";
          let msgType: "text" | "image" | "video" | "audio" | "document" = "text";
          let mediaUrl: string | undefined;

          if (msg.message?.conversation) {
            text = msg.message.conversation;
          } else if (msg.message?.extendedTextMessage?.text) {
            text = msg.message.extendedTextMessage.text;
          } else if (msg.message?.imageMessage) {
            text = msg.message.imageMessage.caption || "[Image]";
            msgType = "image";
          } else if (msg.message?.videoMessage) {
            text = msg.message.videoMessage.caption || "[Video]";
            msgType = "video";
          } else if (msg.message?.audioMessage) {
            text = "[Audio message]";
            msgType = "audio";
          } else if (msg.message?.documentMessage) {
            text = msg.message.documentMessage.fileName || "[Document]";
            msgType = "document";
          }

          const incomingMessage: IncomingMessage = {
            id: msg.key.id || `${Date.now()}`,
            from,
            fromName,
            text,
            timestamp: new Date((msg.messageTimestamp as number) * 1000),
            type: msgType,
            mediaUrl,
          };

          console.log(`📩 [WhatsApp Baileys] New message from ${fromName}: ${text.substring(0, 50)}...`);
          this.emit("message", { sessionKey, message: incomingMessage });
        }
      });

      return { qrCode: session.qrCode, status: session.status };
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error initializing session: ${error}`);
      session.status = "disconnected";
      throw error;
    }
  }

  async getSessionStatus(userId: string, brandId: string): Promise<{
    status: string;
    qrCode: string | null;
    phoneNumber: string | null;
  }> {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);

    if (!session) {
      return { status: "disconnected", qrCode: null, phoneNumber: null };
    }

    return {
      status: session.status,
      qrCode: session.qrCode,
      phoneNumber: session.phoneNumber,
    };
  }

  async sendMessage(
    userId: string,
    brandId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);

    if (!session || session.status !== "connected" || !session.socket) {
      return { success: false, error: "WhatsApp not connected" };
    }

    try {
      let jid = to;
      if (!jid.includes("@")) {
        jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
      }

      const result = await session.socket.sendMessage(jid, { text: message });

      console.log(`📤 [WhatsApp Baileys] Message sent to ${to}`);
      return { success: true, messageId: result?.key?.id };
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error sending message:`, error);
      return { success: false, error: String(error) };
    }
  }

  async sendMedia(
    userId: string,
    brandId: string,
    to: string,
    mediaUrl: string,
    caption?: string,
    mediaType: "image" | "video" | "document" = "image"
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);

    if (!session || session.status !== "connected" || !session.socket) {
      return { success: false, error: "WhatsApp not connected" };
    }

    try {
      let jid = to;
      if (!jid.includes("@")) {
        jid = `${to.replace(/\D/g, "")}@s.whatsapp.net`;
      }

      let messageContent: any;
      if (mediaType === "image") {
        messageContent = { image: { url: mediaUrl }, caption };
      } else if (mediaType === "video") {
        messageContent = { video: { url: mediaUrl }, caption };
      } else {
        messageContent = { document: { url: mediaUrl }, caption };
      }

      const result = await session.socket.sendMessage(jid, messageContent);

      console.log(`📤 [WhatsApp Baileys] Media sent to ${to}`);
      return { success: true, messageId: result?.key?.id };
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error sending media:`, error);
      return { success: false, error: String(error) };
    }
  }

  async disconnect(userId: string, brandId: string): Promise<boolean> {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);

    if (!session || !session.socket) {
      return false;
    }

    try {
      await session.socket.logout();
      session.socket = null;
      session.status = "disconnected";
      session.qrCode = null;
      session.phoneNumber = null;

      const authPath = this.getAuthPath(sessionKey);
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
      }

      this.sessions.delete(sessionKey);
      console.log(`🔴 [WhatsApp Baileys] Session disconnected: ${sessionKey}`);
      return true;
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error disconnecting:`, error);
      return false;
    }
  }

  async restoreExistingSessions(): Promise<void> {
    console.log("🔄 [WhatsApp Baileys] Checking for existing sessions to restore...");
    
    if (!fs.existsSync(this.authBasePath)) {
      return;
    }

    const sessionDirs = fs.readdirSync(this.authBasePath);
    for (const dir of sessionDirs) {
      const parts = dir.split("_");
      if (parts.length >= 2) {
        const userId = parts[0];
        const brandId = parts.slice(1).join("_");
        console.log(`🔄 [WhatsApp Baileys] Restoring session for user ${userId}, brand ${brandId}`);
        try {
          await this.initSession(userId, brandId);
        } catch (error) {
          console.error(`❌ [WhatsApp Baileys] Failed to restore session:`, error);
        }
      }
    }
  }

  isConnected(userId: string, brandId: string): boolean {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);
    return session?.status === "connected";
  }

  getAllSessions(): Map<string, WhatsAppSession> {
    return this.sessions;
  }
}

export const whatsappBaileysService = new WhatsAppBaileysService();
export type { IncomingMessage, WhatsAppSession };
