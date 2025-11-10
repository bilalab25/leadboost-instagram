import { db } from "./db";
import { messages, conversations } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Migration script to create conversation records from existing messages
 * 
 * This script:
 * 1. Queries all existing messages grouped by conversation
 * 2. Creates conversation records with metadata (latest message, unread count, etc.)
 * 3. Updates messages to link them to their conversations
 */

async function migrateConversations() {
  console.log("🔄 Starting conversation migration...\n");

  try {
    // Step 1: Get all unique conversations from messages
    console.log("📊 Step 1: Analyzing existing messages...");
    
    const conversationGroups = await db.execute(sql`
      SELECT 
        integration_id,
        meta_conversation_id,
        platform,
        MAX(contact_name) as contact_name,
        MAX(timestamp) as last_message_at,
        COUNT(*) as total_messages,
        SUM(CASE WHEN is_read = false AND direction = 'inbound' THEN 1 ELSE 0 END) as unread_count
      FROM messages
      WHERE meta_conversation_id IS NOT NULL
      GROUP BY integration_id, meta_conversation_id, platform
      ORDER BY MAX(timestamp) DESC
    `);

    console.log(`   Found ${conversationGroups.rows.length} unique conversations\n`);

    if (conversationGroups.rows.length === 0) {
      console.log("✅ No messages found. Nothing to migrate.");
      return;
    }

    // Step 2: Get user_id for each integration
    console.log("📊 Step 2: Mapping integrations to users...");
    const integrationUserMap = new Map<string, string>();
    
    const integrations = await db.execute(sql`
      SELECT id, user_id FROM integrations
    `);
    
    for (const integration of integrations.rows) {
      integrationUserMap.set(integration.id as string, integration.user_id as string);
    }
    
    console.log(`   Mapped ${integrationUserMap.size} integrations\n`);

    // Step 3: Create conversations
    console.log("💾 Step 3: Creating conversation records...");
    let createdCount = 0;
    let skippedCount = 0;

    for (const group of conversationGroups.rows) {
      const integrationId = group.integration_id as string;
      const metaConversationId = group.meta_conversation_id as string;
      const userId = integrationUserMap.get(integrationId);

      if (!userId) {
        console.log(`   ⚠️  Skipping conversation (no user found for integration ${integrationId})`);
        skippedCount++;
        continue;
      }

      try {
        // Check if conversation already exists
        const existing = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.integrationId, integrationId),
              eq(conversations.metaConversationId, metaConversationId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(`   ⏭️  Conversation already exists: ${metaConversationId}`);
          skippedCount++;
          continue;
        }

        // Get the latest message text for this conversation with proper tie-breaking
        const latestMessage = await db
          .select({ textContent: messages.textContent })
          .from(messages)
          .where(
            and(
              eq(messages.integrationId, integrationId),
              eq(messages.metaConversationId, metaConversationId)
            )
          )
          .orderBy(sql`${messages.timestamp} DESC, ${messages.id} DESC`)
          .limit(1);

        // Create new conversation wrapped in transaction
        await db.transaction(async (tx) => {
          await tx.insert(conversations).values({
            integrationId,
            userId,
            metaConversationId,
            platform: group.platform as string,
            contactName: group.contact_name as string | null,
            lastMessage: latestMessage[0]?.textContent || null,
            lastMessageAt: new Date(group.last_message_at as string),
            unreadCount: Number(group.unread_count) || 0,
          });
        });

        createdCount++;
        console.log(`   ✅ Created: ${metaConversationId} (${group.total_messages} messages, ${group.unread_count} unread)`);
      } catch (error) {
        console.error(`   ❌ Error creating conversation ${metaConversationId}:`, error);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} conversations`);
    console.log(`   ⏭️  Skipped: ${skippedCount} conversations`);

    // Step 4: Link messages to conversations with transaction integrity
    console.log("\n🔗 Step 4: Linking messages to conversations...");
    
    const allConversations = await db.select().from(conversations);
    let totalMessagesLinkedThisRun = 0;
    let conversationsProcessed = 0;

    await db.transaction(async (tx) => {
      for (const conversation of allConversations) {
        const result = await tx
          .update(messages)
          .set({ conversationId: conversation.id })
          .where(
            and(
              eq(messages.integrationId, conversation.integrationId),
              eq(messages.metaConversationId, conversation.metaConversationId)
            )
          );

        // Accumulate rows affected in this specific update
        const rowsAffected = result.rowCount || 0;
        totalMessagesLinkedThisRun += rowsAffected;
        conversationsProcessed++;
        console.log(`   🔗 Linked ${rowsAffected} messages for: ${conversation.metaConversationId}`);
      }
    });

    // Optional: Verify total messages with conversation_id
    const allLinkedMessages = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.conversationId} IS NOT NULL`);
    
    const totalLinkedOverall = Number(allLinkedMessages[0]?.count || 0);

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   📊 ${createdCount} conversations created`);
    console.log(`   🔗 ${conversationsProcessed} conversations processed`);
    console.log(`   📨 ${totalMessagesLinkedThisRun} messages linked in this run`);
    console.log(`   ✅ ${totalLinkedOverall} total messages with conversations (verification)\n`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateConversations()
  .then(() => {
    console.log("🎉 Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration error:", error);
    process.exit(1);
  });
