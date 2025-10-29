import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const LOG_FILE = path.join(process.cwd(), "server_activity.log");

export function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  // Write to console
  console.log(logLine.trim());
  
  // Append to file
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

export function logStartup() {
  const separator = "=".repeat(80);
  
  logToFile(separator);
  logToFile("🚀 SERVER STARTUP DIAGNOSTIC");
  logToFile(separator);
  
  // Absolute file path
  const mainFile = path.join(process.cwd(), "server/index.ts");
  logToFile(`📁 Main File: ${mainFile}`);
  
  // Last modified timestamp
  try {
    const stats = fs.statSync(mainFile);
    logToFile(`🕐 Last Modified: ${stats.mtime.toISOString()}`);
  } catch (err) {
    logToFile(`⚠️  Could not read file stats: ${err}`);
  }
  
  // Process info
  logToFile(`🔢 Process ID: ${process.pid}`);
  logToFile(`📂 Working Directory: ${process.cwd()}`);
  logToFile(`📦 Node Version: ${process.version}`);
  
  logToFile(separator);
  logToFile("✅ FACEBOOK MESSAGES ENDPOINT WITH ATTACHMENTS API - ACTIVE");
  logToFile("   Version: 2.0 - Uses /attachments endpoint for images");
  logToFile("   Features: Empty message detection, debug JSON files, emoji logging");
  logToFile(separator);
  logToFile("");
}

export function logFacebookRequest(conversationId: string, messagesUrl: string) {
  const timestamp = new Date().toISOString();
  
  logToFile("---START FETCH---");
  logToFile(`⏰ Request Time: ${timestamp}`);
  logToFile(`💬 Conversation ID: ${conversationId}`);
  logToFile(`🔗 Facebook Graph API URL: ${messagesUrl}`);
  logToFile(`📎 Attachments: Will fetch via /attachments endpoint for empty messages`);
}

export function logFacebookResponse(messageCount: number) {
  logToFile(`✅ Received ${messageCount} messages`);
  logToFile("---END FETCH---");
  logToFile("");
}

export function logAttachmentFetch(messageId: string, url: string) {
  logToFile(`  🔍 Fetching attachments for: ${messageId}`);
  logToFile(`  🔗 Attachment URL: ${url}`);
}

export function logAttachmentFound(messageId: string, imageUrl: string) {
  logToFile(`  📎 Attachment found for ${messageId} → ${imageUrl}`);
}

export function logAttachmentNotFound(messageId: string) {
  logToFile(`  ❌ No attachment found for ${messageId}`);
}

export function logAttachmentError(messageId: string, error: any) {
  logToFile(`  ⚠️  Attachment fetch failed for ${messageId}: ${error.message || error}`);
}

export function logUnifiedRequest(provider: string, conversationId: string, url: string) {
  const timestamp = new Date().toISOString();
  const providerEmojis: Record<string, string> = {
    facebook: "🟦",
    instagram: "🟪",
    threads: "🧵",
    whatsapp: "🟩"
  };
  
  const emoji = providerEmojis[provider] || "📱";
  
  logToFile("---START UNIFIED FETCH---");
  logToFile(`${emoji} Provider: ${provider.toUpperCase()}`);
  logToFile(`⏰ Request Time: ${timestamp}`);
  logToFile(`💬 Conversation ID: ${conversationId}`);
  logToFile(`🔗 API URL: ${url}`);
}

export function logUnifiedResponse(provider: string, messageCount: number) {
  const providerEmojis: Record<string, string> = {
    facebook: "🟦",
    instagram: "🟪",
    threads: "🧵",
    whatsapp: "🟩"
  };
  
  const emoji = providerEmojis[provider] || "📱";
  logToFile(`✅ ${emoji} ${provider.toUpperCase()}: Received ${messageCount} messages`);
  logToFile("---END UNIFIED FETCH---");
  logToFile("");
}
