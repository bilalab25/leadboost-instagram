import { db } from "../db";
import {
  customizationRequests,
  brandSettings,
  captionTemplates,
  hashtagSets,
  approvalPipelines,
} from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * AI Customization Engine
 *
 * Interprets natural language requests from users and generates
 * structured proposals that can be approved and applied.
 *
 * Scoped to Instagram features only.
 */

interface Proposal {
  type: string; // 'feature_flags' | 'caption_template' | 'hashtag_set' | 'approval_pipeline' | 'instagram_config'
  description: string;
  changes: any;
}

interface AIProposalResult {
  summary: string;
  proposals: Proposal[];
}

export async function generateProposal(
  brandId: string,
  requestText: string,
): Promise<AIProposalResult> {
  // Fetch current brand state for context
  const [settings] = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.brandId, brandId))
    .limit(1);

  const templates = await db
    .select()
    .from(captionTemplates)
    .where(eq(captionTemplates.brandId, brandId));

  const hashtags = await db
    .select()
    .from(hashtagSets)
    .where(eq(hashtagSets.brandId, brandId));

  const [pipeline] = await db
    .select()
    .from(approvalPipelines)
    .where(eq(approvalPipelines.brandId, brandId))
    .limit(1);

  const currentState = {
    featureFlags: settings?.featureFlags || {},
    instagramConfig: settings?.instagramConfig || {},
    captionTemplates: templates.map((t) => ({ name: t.name, template: t.template })),
    hashtagSets: hashtags.map((h) => ({ name: h.name, hashtags: h.hashtags })),
    approvalPipeline: pipeline?.stages || [],
  };

  // Use Gemini to interpret the request
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
  });

  const systemPrompt = `You are an AI assistant for LeadBoost, an Instagram marketing platform.

Your job is to interpret user requests and generate STRUCTURED PROPOSALS for Instagram-related customizations.

CURRENT BRAND STATE:
${JSON.stringify(currentState, null, 2)}

AVAILABLE CUSTOMIZATION TYPES:
1. "feature_flags" — toggle sidebar modules (calendar, analytics, inbox, brandStudio, integrations, campaigns, customers, team)
2. "caption_template" — create reusable caption templates with {placeholders}. Fields: name, template, category (general/promo/educational/engagement)
3. "hashtag_set" — create saved hashtag groups. Fields: name, hashtags
4. "approval_pipeline" — configure approval stages. Each stage has: id, name, approverRole (editor/admin/owner), order
5. "instagram_config" — Instagram settings. Fields: enabledPostTypes (array of image/carousel/story/reel), defaultPostType, autoHashtags (boolean)

RULES:
- Only propose Instagram-related changes
- Be specific and actionable
- Include a human-readable summary
- Return valid JSON only

RESPONSE FORMAT:
{
  "summary": "Brief description of what will be created/changed",
  "proposals": [
    {
      "type": "caption_template",
      "description": "What this proposal does",
      "changes": { "name": "...", "template": "...", "category": "..." }
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: `User request: "${requestText}"` }] },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || "Proposal generated",
      proposals: parsed.proposals || [],
    };
  } catch {
    return {
      summary: "Could not parse AI response",
      proposals: [],
    };
  }
}

export async function applyProposal(
  brandId: string,
  proposal: Proposal,
): Promise<{ success: boolean; message: string }> {
  try {
    switch (proposal.type) {
      case "feature_flags": {
        const [existing] = await db
          .select()
          .from(brandSettings)
          .where(eq(brandSettings.brandId, brandId))
          .limit(1);

        if (existing) {
          const currentFlags = (existing.featureFlags as Record<string, boolean>) || {};
          await db
            .update(brandSettings)
            .set({
              featureFlags: { ...currentFlags, ...proposal.changes },
              updatedAt: new Date(),
            })
            .where(eq(brandSettings.brandId, brandId));
        } else {
          await db.insert(brandSettings).values({
            brandId,
            featureFlags: proposal.changes,
          });
        }
        return { success: true, message: "Feature flags updated" };
      }

      case "caption_template": {
        await db.insert(captionTemplates).values({
          brandId,
          name: proposal.changes.name,
          template: proposal.changes.template,
          category: proposal.changes.category || "general",
        });
        return { success: true, message: `Caption template "${proposal.changes.name}" created` };
      }

      case "hashtag_set": {
        await db.insert(hashtagSets).values({
          brandId,
          name: proposal.changes.name,
          hashtags: proposal.changes.hashtags,
        });
        return { success: true, message: `Hashtag set "${proposal.changes.name}" created` };
      }

      case "approval_pipeline": {
        const [existing] = await db
          .select()
          .from(approvalPipelines)
          .where(eq(approvalPipelines.brandId, brandId))
          .limit(1);

        const stages = proposal.changes.stages || proposal.changes;
        if (existing) {
          await db
            .update(approvalPipelines)
            .set({ stages, updatedAt: new Date() })
            .where(eq(approvalPipelines.brandId, brandId));
        } else {
          await db.insert(approvalPipelines).values({
            brandId,
            name: proposal.changes.name || "Custom Pipeline",
            stages,
          });
        }
        return { success: true, message: "Approval pipeline updated" };
      }

      case "instagram_config": {
        const [existing] = await db
          .select()
          .from(brandSettings)
          .where(eq(brandSettings.brandId, brandId))
          .limit(1);

        if (existing) {
          const currentConfig = (existing.instagramConfig as Record<string, any>) || {};
          await db
            .update(brandSettings)
            .set({
              instagramConfig: { ...currentConfig, ...proposal.changes },
              updatedAt: new Date(),
            })
            .where(eq(brandSettings.brandId, brandId));
        } else {
          await db.insert(brandSettings).values({
            brandId,
            instagramConfig: proposal.changes,
          });
        }
        return { success: true, message: "Instagram config updated" };
      }

      default:
        return { success: false, message: `Unknown proposal type: ${proposal.type}` };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to apply proposal" };
  }
}
