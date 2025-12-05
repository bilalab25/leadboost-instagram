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
  reconnectTimer: NodeJS.Timeout | null;
  isReconnecting: boolean;
  reconnectAttempts: number;
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
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 3000;

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

  private cleanupSession(sessionKey: string, options: { removeCredentials?: boolean; removeFromMap?: boolean } = {}): void {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    console.log(`🧹 [WhatsApp Baileys] Cleaning up session: ${sessionKey}`);

    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    if (session.socket) {
      try {
        session.socket.ev.removeAllListeners("connection.update");
        session.socket.ev.removeAllListeners("creds.update");
        session.socket.ev.removeAllListeners("messages.upsert");
        session.socket.end(new Error("Session cleanup"));
      } catch (e) {
        console.log(`⚠️ [WhatsApp Baileys] Error ending socket: ${e}`);
      }
      session.socket = null;
    }

    session.qrCode = null;
    session.isReconnecting = false;

    if (options.removeCredentials) {
      const authPath = this.getAuthPath(sessionKey);
      if (fs.existsSync(authPath)) {
        try {
          // Use fs.rmSync with recursive and force options
          // - recursive: true handles nested directories (fixes ENOTEMPTY)
          // - force: true ignores errors if path doesn't exist
          // - maxRetries/retryDelay handle transient file locks from Baileys
          fs.rmSync(authPath, { 
            recursive: true, 
            force: true, 
            maxRetries: 10, 
            retryDelay: 200 
          });
          console.log(`🗑️ [WhatsApp Baileys] Removed credentials for: ${sessionKey}`);
        } catch (e) {
          // Log but don't throw - credentials removal is best-effort
          console.error(`❌ [WhatsApp Baileys] Error removing credentials: ${e}`);
        }
      }
    }

    if (options.removeFromMap) {
      this.sessions.delete(sessionKey);
    }
  }

  private scheduleReconnect(userId: string, brandId: string, sessionKey: string): void {
    const session = this.sessions.get(sessionKey);
    if (!session) return;

    if (session.isReconnecting) {
      console.log(`⏳ [WhatsApp Baileys] Reconnect already scheduled for: ${sessionKey}`);
      return;
    }

    if (session.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`❌ [WhatsApp Baileys] Max reconnect attempts reached for: ${sessionKey}`);
      session.status = "disconnected";
      this.emit("max_reconnect_reached", { sessionKey });
      return;
    }

    session.isReconnecting = true;
    const delay = this.baseReconnectDelay * Math.pow(1.5, session.reconnectAttempts);
    
    console.log(`🔄 [WhatsApp Baileys] Scheduling reconnect in ${delay}ms (attempt ${session.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    session.reconnectTimer = setTimeout(async () => {
      session.isReconnecting = false;
      session.reconnectAttempts++;
      
      this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
      
      session.status = "disconnected";
      
      try {
        // Pass forceInit: true because this is a legitimate reconnection attempt
        // (not an auto-init that could steal production sessions)
        await this.initSession(userId, brandId, true);
      } catch (error) {
        console.error(`❌ [WhatsApp Baileys] Reconnect failed: ${error}`);
      }
    }, delay);
  }

  private isDevelopmentEnvironment(): boolean {
    // Check if we're in Replit development environment
    const devDomain = process.env.REPLIT_DEV_DOMAIN;
    const replitDomains = process.env.REPLIT_DOMAINS;
    
    // If REPLIT_DEV_DOMAIN is set, we're in development
    if (devDomain) {
      return true;
    }
    
    // If only production domains exist, we're in production
    if (replitDomains && !devDomain) {
      return false;
    }
    
    return false;
  }

  async initSession(userId: string, brandId: string, forceInit: boolean = false): Promise<{ qrCode: string | null; status: string }> {
    const sessionKey = this.getSessionKey(userId, brandId);
    
    // Prevent development environment from stealing production sessions
    // unless explicitly forced (e.g., user clicking connect button)
    if (this.isDevelopmentEnvironment() && !forceInit) {
      console.log(`⚠️ [WhatsApp Baileys] Skipping auto-init in development environment for: ${sessionKey}`);
      return { qrCode: null, status: "dev_skipped" };
    }
    
    const existingSession = this.sessions.get(sessionKey);
    if (existingSession?.status === "connected") {
      return { qrCode: null, status: "already_connected" };
    }

    if (existingSession?.isReconnecting) {
      console.log(`⏳ [WhatsApp Baileys] Session is reconnecting, waiting...`);
      return { qrCode: existingSession.qrCode, status: "reconnecting" };
    }

    if (existingSession?.status === "qr_ready" && existingSession.qrCode) {
      return { qrCode: existingSession.qrCode, status: existingSession.status };
    }

    if (existingSession?.socket) {
      this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
    }

    const session: WhatsAppSession = {
      socket: null,
      qrCode: null,
      status: "connecting",
      phoneNumber: null,
      lastActivity: new Date(),
      userId,
      brandId,
      reconnectTimer: null,
      isReconnecting: false,
      reconnectAttempts: existingSession?.reconnectAttempts || 0,
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
        markOnlineOnConnect: false,
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
            session.reconnectAttempts = 0;
            this.emit("qr", { sessionKey, qrCode: qrDataUrl });
            console.log(`📱 [WhatsApp Baileys] QR code generated for session: ${sessionKey}`);
          } catch (err) {
            console.error("❌ Error generating QR code:", err);
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const errorMessage = (lastDisconnect?.error as Boom)?.message || "Unknown error";
          
          console.log(`🔴 [WhatsApp Baileys] Connection closed for ${sessionKey}. Status: ${statusCode}, Error: ${errorMessage}`);

          if (statusCode === DisconnectReason.loggedOut) {
            console.log(`🚪 [WhatsApp Baileys] User logged out, clearing credentials`);
            this.cleanupSession(sessionKey, { removeCredentials: true, removeFromMap: false });
            session.status = "disconnected";
            session.reconnectAttempts = 0;
            this.emit("logged_out", { sessionKey });
          } else if (statusCode === 440) {
            // Conflict error - another instance is already connected
            console.log(`⚠️ [WhatsApp Baileys] Conflict detected (440) - another instance is active. NOT reconnecting.`);
            this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
            session.status = "disconnected";
            this.emit("conflict", { sessionKey, reason: "Another instance is already connected" });
          } else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
            console.log(`🔄 [WhatsApp Baileys] Stream error 515 / restart required, reconnecting...`);
            this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
            session.status = "connecting";
            this.scheduleReconnect(userId, brandId, sessionKey);
          } else if (statusCode === DisconnectReason.connectionClosed || 
                     statusCode === DisconnectReason.connectionLost ||
                     statusCode === DisconnectReason.timedOut) {
            console.log(`🔄 [WhatsApp Baileys] Connection issue, reconnecting...`);
            this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
            session.status = "connecting";
            this.scheduleReconnect(userId, brandId, sessionKey);
          } else {
            console.log(`⚠️ [WhatsApp Baileys] Unknown disconnect reason: ${statusCode}`);
            this.cleanupSession(sessionKey, { removeCredentials: false, removeFromMap: false });
            session.status = "disconnected";
            this.emit("disconnected", { sessionKey, reason: errorMessage });
          }
        } else if (connection === "open") {
          session.status = "connected";
          session.qrCode = null;
          session.lastActivity = new Date();
          session.reconnectAttempts = 0;

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
      status: session.isReconnecting ? "reconnecting" : session.status,
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
      return { success: true, messageId: result?.key?.id || undefined };
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
      return { success: true, messageId: result?.key?.id || undefined };
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error sending media:`, error);
      return { success: false, error: String(error) };
    }
  }

  async disconnect(userId: string, brandId: string): Promise<boolean> {
    const sessionKey = this.getSessionKey(userId, brandId);
    const session = this.sessions.get(sessionKey);

    if (!session) {
      return false;
    }

    try {
      if (session.socket) {
        try {
          await session.socket.logout();
        } catch (e) {
          console.log(`⚠️ [WhatsApp Baileys] Logout error (expected): ${e}`);
        }
      }

      this.cleanupSession(sessionKey, { removeCredentials: true, removeFromMap: true });

      console.log(`🔴 [WhatsApp Baileys] Session disconnected: ${sessionKey}`);
      return true;
    } catch (error) {
      console.error(`❌ [WhatsApp Baileys] Error disconnecting:`, error);
      return false;
    }
  }

  async restoreExistingSessions(): Promise<void> {
    // Don't auto-restore sessions in development to avoid stealing production sessions
    if (this.isDevelopmentEnvironment()) {
      console.log("⚠️ [WhatsApp Baileys] Skipping session restoration in development environment");
      console.log("   (Production should handle WhatsApp connections)");
      return;
    }
    
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
          // forceInit=true for restoration since we want to reconnect in production
          await this.initSession(userId, brandId, true);
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
