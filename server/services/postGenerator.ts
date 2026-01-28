import { GoogleGenAI, Modality, Type } from "@google/genai";
import { storage } from "../storage";
import type { BrandDesign, BrandAsset, Integration } from "@shared/schema";
import sharp from "sharp";
import OpenAI from "openai";
import cloudinary from "../cloudinary";

function enforceLanguage(
  posts: GeneratedPost[],
  lang: string,
): GeneratedPost[] {
  if (lang === "en") return posts;

  const forbiddenEnglish =
    /\b(the|and|with|for|your|you|new|best|now|shop|sale)\b/i;

  const filtered = posts.filter((p) => {
    const combined = `${p.titulo} ${p.content} ${p.hashtags}`.toLowerCase();
    return !forbiddenEnglish.test(combined);
  });
  if (filtered.length === 0) {
    console.warn(
      `[PostGenerator] Language enforcement removed all posts. Returning original posts.`,
    );
    return posts;
  }

  return filtered;
}

export function languageInstruction(lang: string): string {
  switch (lang) {
    case "en":
      return "English (US)";
    case "es":
      return "Spanish (neutral Latin American Spanish)";
    case "pt":
      return "Portuguese (Brazil)";
    case "fr":
      return "French";
    case "de":
      return "German";
    case "it":
      return "Italian";
    case "zh":
      return "Simplified Chinese (Mandarin)";
    case "ja":
      return "Japanese";
    case "ko":
      return "Korean";
    case "ar":
      return "Modern Standard Arabic";
    case "hi":
      return "Hindi";
    default:
      return "English (US)";
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Using your own Gemini API key from Google AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export interface MetaInsights {
  reach?: number;
  impressions?: number;
  engagement?: number;
  onlineFollowers?: { [hour: string]: number };
  topContentTypes?: string[];
  bestPostingTimes?: string[];
  audienceCity?: string[];
  audienceAgeGender?: any;
}

export interface SalesInsights {
  totalSales: number;
  totalTransactions: number;
  averageOrderValue: number;
  totalCustomers: number;
  topProducts?: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentSalesTrend?: "growing" | "stable" | "declining";
  topCustomers?: Array<{
    name: string;
    totalSpent: number;
  }>;
}

export interface GeneratedPost {
  platform: string;
  titulo: string;
  content: string;
  hashtags: string;
  dia: string;
  optimalTime: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface PlatformPostingSchedule {
  platform: string;
  frequencyDays: number; // posts per week
  daysWeek: string[]; // ["mon", "tue", "thu"]
  postingDates: string[]; // Calculated dates in YYYY-MM-DD format
}

export interface PostGenerationContext {
  generationMode?: "full" | "skeleton" | "vision";
  brandId: string;
  brandName: string;
  brandDescription?: string;
  preferredLanguage?: string; // Language from brand table (primary source)
  brandDesign: BrandDesign;
  brandAssets: BrandAsset[];
  metaInsights?: MetaInsights;
  salesInsights?: SalesInsights; // POS sales data from Lightspeed
  month: number;
  year: number;
  postsToGenerate?: number;
  connectedPlatforms?: string[]; // Platforms to generate posts for (e.g., ['instagram', 'facebook'])
  postingSchedule?: PlatformPostingSchedule[]; // Schedule per platform from social_posting_frequency
  brandEssence?: {
    tone: string | null;
    personality: string | null;
    emotion: string | null;
    visualKeywords: string | null;
    promise: string | null;
  };
  imageDataUrl?: string;
}

function fullPostsSchema(languageLabel: string) {
  return {
    type: Type.OBJECT,
    properties: {
      posts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            titulo: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.STRING },
            dia: { type: Type.STRING },
            optimalTime: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
          },
          required: [
            "platform",
            "titulo",
            "content",
            "hashtags",
            "dia",
            "optimalTime",
            "imagePrompt",
          ],
        },
      },
    },
    required: ["posts"],
  };
}
function skeletonPostsSchema() {
  return {
    type: Type.OBJECT,
    properties: {
      posts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platform: { type: Type.STRING },
            titulo: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.STRING },
            dia: { type: Type.STRING },
            optimalTime: { type: Type.STRING },
          },
          required: [
            "platform",
            "titulo",
            "content",
            "hashtags",
            "dia",
            "optimalTime",
          ],
        },
      },
    },
    required: ["posts"],
  };
}
function visionTextSchema(languageLabel: string) {
  return {
    type: Type.OBJECT,
    properties: {
      titulo: { type: Type.STRING },
      content: { type: Type.STRING },
      hashtags: { type: Type.STRING },
    },
    required: ["titulo", "content", "hashtags"],
  };
}

type VisualMode = 
  | "campaign_template"    // Products + Templates
  | "lifestyle"            // Products + Location
  | "product_showcase"     // Products only
  | "venue_showcase"       // Location only
  | "inspiration_based"    // Templates only
  | "brand_only";          // No assets, use brand design

const PRODUCT_CATEGORIES = ["product_images", "products", "product", "product_assets"];
const LOCATION_CATEGORIES = ["location", "location_images", "location_assets", "place", "venue"];
const TEMPLATE_CATEGORIES = ["inspiration_templates", "templates", "inspiration"];

function selectVisualMode(assets: BrandAssetForImage[]): VisualMode {
  const hasProduct = assets.some(
    (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase())
  );
  const hasTemplate = assets.some(
    (a) => a.category && TEMPLATE_CATEGORIES.includes(a.category.toLowerCase())
  );
  const hasLocation = assets.some(
    (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase())
  );

  // Priority: Combined modes first, then single-asset modes, then fallback
  if (hasProduct && hasTemplate) return "campaign_template";
  if (hasProduct && hasLocation) return "lifestyle";
  if (hasProduct) return "product_showcase";
  if (hasLocation) return "venue_showcase";
  if (hasTemplate) return "inspiration_based";
  
  // No assets at all - generate based on brand design only
  return "brand_only";
}

async function fetchMetaInsights(
  integration: Integration,
): Promise<MetaInsights | null> {
  try {
    const accessToken = integration.accessToken;
    const accountId = integration.accountId;

    if (!accessToken || !accountId) {
      console.log("[PostGenerator] No access token or account ID for insights");
      return null;
    }

    const insights: MetaInsights = {};

    if (
      integration.provider === "instagram_direct" ||
      integration.provider === "instagram"
    ) {
      const metricsUrl = `https://graph.instagram.com/v24.0/${accountId}/insights?metric=reach,impressions&period=day&access_token=${accessToken}`;

      try {
        const metricsRes = await fetch(metricsUrl);
        const metricsData = await metricsRes.json();

        if (metricsData?.data) {
          metricsData.data.forEach((metric: any) => {
            if (metric.name === "reach") {
              insights.reach = metric.values?.[0]?.value || 0;
            }
            if (metric.name === "impressions") {
              insights.impressions = metric.values?.[0]?.value || 0;
            }
          });
        }
      } catch (err) {
        console.log("[PostGenerator] Could not fetch Instagram metrics:", err);
      }

      try {
        const followersUrl = `https://graph.instagram.com/v24.0/${accountId}/insights?metric=online_followers&period=lifetime&access_token=${accessToken}`;
        const followersRes = await fetch(followersUrl);
        const followersData = await followersRes.json();

        if (followersData?.data?.[0]?.values?.[0]?.value) {
          insights.onlineFollowers = followersData.data[0].values[0].value;

          const hourlyData = insights.onlineFollowers;
          if (hourlyData) {
            const sortedHours = Object.entries(hourlyData)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([hour]) => {
                const h = parseInt(hour);
                return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
              });
            insights.bestPostingTimes = sortedHours;
          }
        }
      } catch (err) {
        console.log("[PostGenerator] Could not fetch online_followers:", err);
      }
    }

    if (integration.provider === "facebook") {
      const pageId = integration.pageId || accountId;

      try {
        const insightsUrl = `https://graph.facebook.com/v24.0/${pageId}/insights?metric=page_impressions,page_engaged_users,page_post_engagements&period=day&access_token=${accessToken}`;
        const insightsRes = await fetch(insightsUrl);
        const insightsData = await insightsRes.json();

        if (insightsData?.data) {
          insightsData.data.forEach((metric: any) => {
            if (metric.name === "page_impressions") {
              insights.impressions = metric.values?.[0]?.value || 0;
            }
            if (metric.name === "page_engaged_users") {
              insights.engagement = metric.values?.[0]?.value || 0;
            }
          });
        }
      } catch (err) {
        console.log("[PostGenerator] Could not fetch Facebook insights:", err);
      }
    }

    if (!insights.bestPostingTimes || insights.bestPostingTimes.length === 0) {
      insights.bestPostingTimes = ["9:00 AM", "12:00 PM", "6:00 PM", "8:00 PM"];
    }

    return insights;
  } catch (error) {
    console.error("[PostGenerator] Error fetching Meta insights:", error);
    return null;
  }
}

// Day name mapping from short form to day number (0 = Sunday, 6 = Saturday)
const dayNameToNumber: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

// Calculate posting dates for a given month based on posting frequency settings
export function calculatePostingDates(
  month: number,
  year: number,
  daysWeek: string[],
  startFromToday: boolean = false,
): string[] {
  const dates: string[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert day names to day numbers
  const targetDays = daysWeek
    .map((d) => dayNameToNumber[d.toLowerCase()])
    .filter((d) => d !== undefined);

  if (targetDays.length === 0) {
    console.warn("[PostGenerator] No valid days found in daysWeek:", daysWeek);
    return dates;
  }

  // Iterate through all days of the month
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();

    // Check if this day is one of the target posting days
    if (targetDays.includes(dayOfWeek)) {
      // Skip past dates if startFromToday is true
      if (startFromToday && d < today) {
        continue;
      }

      // Format date as YYYY-MM-DD
      const dateStr = d.toISOString().split("T")[0];
      dates.push(dateStr);
    }
  }

  return dates;
}

function buildTextPrompt(context: PostGenerationContext): string {
  const {
    brandName,
    brandDescription,
    brandDesign,
    brandAssets,
    metaInsights,
    salesInsights,
    month,
    year,
    postingSchedule,
    connectedPlatforms,
  } = context;
  const productAssets = brandAssets.filter(
    (a) => a.category && ["product_images", "product", "products", "product_assets"].includes(a.category),
  );
  const locationAssets = brandAssets.filter(
    (a) => a.category && ["location", "location_images", "location_assets", "place"].includes(a.category),
  );
  const inspirationAssets = brandAssets.filter(
    (a) => a.category === "inspiration_templates",
  );

  // Detect if brand has product images available
  const hasProducts = productAssets.length > 0;
  
  // Detect if brand has location images available
  const hasLocation = locationAssets.length > 0;

  // Visual context for content strategy based on available assets
  const visualContext = hasProducts
    ? "The brand has real product images available. These should be featured naturally in the posts - on elegant surfaces, in lifestyle contexts, or being used/worn."
    : hasLocation
    ? "The brand has real location images (e.g. clinic, restaurant, store, office). These represent a real physical space and MUST NOT be altered. Use them as-is and build marketing content around them."
    : "The brand has no real product or location images available. Create lifestyle or brand-focused visuals from scratch that represent the brand's essence.";

  // Product context for content strategy (legacy compatibility)
  const productContext = hasProducts
    ? "The brand has product images available. Focus on showcasing products, benefits, and use cases."
    : "The brand has no product images yet. Focus on brand awareness, lifestyle, and engagement content.";

  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
  });

  // Calculate the start day for content generation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // If generating for current month, start from today. Otherwise start from day 1
  const startDay =
    year === currentYear && month === currentMonth ? currentDay : 1;

  // Get last day of target month
  const lastDayOfMonth = new Date(year, month, 0).getDate();

  const dateRestriction =
    startDay > 1
      ? `CRITICAL DATE RESTRICTION: Today is ${monthName} ${currentDay}, ${year}. Generate posts ONLY for dates from ${monthName} ${startDay} to ${monthName} ${lastDayOfMonth}. DO NOT generate any posts for dates before ${monthName} ${startDay}.`
      : `Generate posts for the entire month of ${monthName} (days 1-${lastDayOfMonth}).`;

  // Determine which platforms to generate for (only connected ones)
  const availablePlatforms =
    connectedPlatforms && connectedPlatforms.length > 0
      ? connectedPlatforms
      : ["instagram", "facebook"]; // Default fallback

  // Format platforms for prompt with variations
  const platformInstructions = availablePlatforms
    .map((p) => {
      if (p === "instagram" || p === "instagram_direct") {
        return "Instagram (including feed posts, reels, and stories)";
      }
      if (p === "facebook") {
        return "Facebook (page posts)";
      }
      return p;
    })
    .join(", ");
  // Use preferredLanguage from brand (context) first, then fallback to brandDesign
  const preferredLanguage =
    context.preferredLanguage || context.brandDesign.preferredLanguage || "en";

  const languageLabel = languageInstruction(preferredLanguage);

  const colorPalette = [
    brandDesign.colorPrimary,
    brandDesign.colorAccent1,
    brandDesign.colorAccent2,
    brandDesign.colorAccent3,
    brandDesign.colorAccent4,
  ]
    .filter(Boolean)
    .join(", ");

  // Build detailed asset list with URLs for context
  const assetDetails = brandAssets
    .map((asset) => {
      const desc = (asset as any).description
        ? ` - DESCRIPTION: ${(asset as any).description}`
        : "";
      return `  - ${asset.name} (${asset.category || "general"})${desc}: ${asset.url}`;
    })
    .join("\n");

  // Group assets by category for quick reference
  const assetsByCategory = brandAssets.reduce(
    (acc, asset) => {
      const cat = asset.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(asset.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );
  const extractSectionA = (description: string) => {
    // Regex para buscar el inicio de la Sección A y el inicio de la Sección B
    const matchA = description.match(
      /### SECTION A:([\s\S]*?)(?=### SECTION B:|$)/i,
    );
    if (matchA && matchA[1]) {
      // Limpiamos los encabezados de los subpuntos (1, 2, 3) para obtener solo el texto puro.
      return matchA[1].replace(/(\d\.\s*\*\*.*?\*\*)/g, "").trim();
    }
    return description; // Fallback si no encuentra la estructura
  };
  const bestTimes =
    metaInsights?.bestPostingTimes?.join(", ") || "9:00 AM, 12:00 PM, 6:00 PM";

  // Logo information - use whiteLogoUrl, blackLogoUrl, or deprecated logoUrl
  const logoUrl =
    brandDesign.whiteLogoUrl || brandDesign.blackLogoUrl || brandDesign.logoUrl;
  const logoInfo = logoUrl
    ? `- Brand Logo URL: ${logoUrl}\n- IMPORTANT: The brand has a logo that should be conceptually referenced in image prompts. Describe elements that complement the logo style.`
    : "- No logo uploaded";

  const allAssetDescriptions = brandAssets
    .map((asset) => {
      const desc = (asset as any).description
        ? ` - DESCRIPTION: ${(asset as any).description}`
        : "";
      return `  - ${asset.name} (${asset.category || "general"})${desc}`;
    })
    .join("\n");

  // Reemplaza o modifica la sección graphicStyleSummary:
  let graphicStyleSummary = "";

  const relevantDescriptions = [...locationAssets, ...inspirationAssets] // Solo Lugar e Inspiración definen el estilo visual
    .map((asset) => {
      const desc =
        (asset as any).description || "No detailed description provided.";
      return `ASSET: ${asset.name} (Category: ${asset.category})\n  - VISUAL IDENTITY: ${desc}`;
    })
    .join("\n\n");

  if (relevantDescriptions) {
    graphicStyleSummary = `
  CRITICAL VISUAL STYLE SYNTHESIS INSTRUCTIONS:
  The following descriptions detail the unique look, feel, colors, and composition of the brand's key visual assets (Location and Inspiration). You MUST synthesize the *dominant* visual identity (specific color schemes, composition style, lighting, and mood) from these examples to generate a cohesive new image that fits the brand's overall aesthetic:

  ${relevantDescriptions}
  `;
  }
  // Build the posting schedule instructions based on social_posting_frequency table
  let postingScheduleInstructions = "";
  let totalPosts = 0;

  if (postingSchedule && postingSchedule.length > 0) {
    const scheduleDetails = postingSchedule
      .map((schedule) => {
        const platformName =
          schedule.platform === "instagram"
            ? "Instagram"
            : schedule.platform === "facebook"
              ? "Facebook"
              : schedule.platform;
        totalPosts += schedule.postingDates.length;
        return `- ${platformName}: Generate ${schedule.postingDates.length} posts on these EXACT dates: ${schedule.postingDates.join(", ")}`;
      })
      .join("\n");

    postingScheduleInstructions = `
POSTING SCHEDULE (from brand settings - DO NOT deviate from these dates):
${scheduleDetails}

TOTAL POSTS TO GENERATE: ${totalPosts}

CRITICAL: You MUST generate posts ONLY for the dates listed above for each platform. These dates are based on the brand's posting frequency settings. Do NOT generate posts for any other dates.`;
  } else {
    // Fallback to default behavior if no schedule is provided
    postingScheduleInstructions = `
POSTING SCHEDULE:
- Generate posts distributed evenly across the month
- Aim for 3-4 posts per week per platform`;
    totalPosts = 15; // Fallback default
  }

  return `You are an expert social media strategist and content creator. Generate a comprehensive content calendar for ${monthName} ${year}.

BRAND IDENTITY:
- Brand Name: ${brandName}
- Description: ${brandDescription || "Not specified"}
- Brand Style: ${brandDesign.brandStyle || "modern"}
- Color Palette: ${colorPalette}
- Primary Font: ${brandDesign.fontPrimary || "Not specified"}
- Secondary Font: ${brandDesign.fontSecondary || "Not specified"}
${logoInfo}

BRAND ESSENCE (use this to define all copywriting, tone, emotional feel, and conceptual direction):
- Tone of Voice: ${context.brandEssence?.tone ?? "Not specified"}
- Personality: ${context.brandEssence?.personality ?? "Not specified"}
- Emotional Feel: ${context.brandEssence?.emotion ?? "Not specified"}
- Visual Keywords: ${context.brandEssence?.visualKeywords ?? "Not specified"}
- Brand Promise: ${context.brandEssence?.promise ?? "Not specified"}

PRODUCT AWARENESS:
${productContext}

PLATFORM-SPECIFIC WRITING RULES (follow these for each platform):
- Instagram: Visual-first, emotional or aspirational tone, short to medium caption (2-4 sentences), engaging hooks, relevant hashtags
- Facebook: More informative and conversational, encourages discussion and comments, can be longer form, community-focused
- WhatsApp: Direct and promotional, clear call-to-action, no hashtags, concise message suitable for broadcast

LANGUAGE REQUIREMENTS (ABSOLUTE – NO EXCEPTIONS):
- ALL generated text MUST be written exclusively in ${languageLabel}.
- This includes:
  • Titles (titulo)
  • Captions/content
  • Hashtags
  • Calls to action
- DO NOT mix languages.
- DO NOT include English words unless the language is English.
- Hashtags MUST also be written in ${languageLabel}.

IMPORTANT:
All written content MUST follow the tone of voice and emotional feel described here.
All image prompts MUST reflect the visual keywords and emotional feel.
SPECIAL LANGUAGE RULES:
- If the language is Chinese, Japanese, Korean, Arabic or Hindi:
  • DO NOT use English hashtags
  • Use native script ONLY
  • Emojis are allowed
  • Do NOT transliterate unless explicitly required

BRAND VISUAL ASSETS:
The brand has uploaded the following assets. Use this list for factual and conceptual reference:

${allAssetDescriptions || "No assets uploaded yet."} 

---
FACTUAL PRODUCT CATALOG (CRITICAL: Reference these products by name and details in the imagePrompt):
${productAssets.map((p) => `- PRODUCT: ${p.name}. DETAILS: ${extractSectionA((p as any).description || "")}`).join("\n") || "No product assets uploaded yet"}
LOCATION ASSETS (CRITICAL: Use this environment as the setting for all relevant posts):
${locationAssets.map((l) => `- LOCATION: ${l.name}. Environment: ${(l as any).description || "No detailed description."}`).join("\n") || "No location assets uploaded yet"}

ASSET CATEGORIES SUMMARY:
${
  Object.entries(assetsByCategory)
    .map(([cat, items]) => `- ${cat}: ${items.join(", ")}`)
    .join("\n") || "No categorized assets"
}
${postingScheduleInstructions}

REQUIREMENTS:
1. ${dateRestriction}
2. IMPORTANT: Only generate posts for the platforms and dates specified in the POSTING SCHEDULE above.
3. For each post, YOU suggest the optimal posting time based on audience insights (e.g., "9:00 AM", "6:00 PM"). The dates are fixed but you choose the best time.
4. Each post must include:
   - A catchy title/hook (titulo)
   - Full post caption/content with emojis
   - Relevant hashtags (5-10 per post)
   - Optimal posting time based on insights (optimalTime field)
   * **CRITICAL LOGO INTEGRATION (MANDATORY):** The image MUST incorporate a **physical, non-distorted representation of the brand's logo or unique primary symbol** (e.g., if the logo is a stylized 'T', it must appear as a subtle 'T' element). It should be integrated **naturally and subtly** into the scene, appearing as **engraving, debossing, or as a small, polished metal emblem** on one of the products, packaging, or an element of the staging (e.g., a jewelry box, a marble surface, a coffee cup). **DO NOT alter the logo's original shape or add extra letters.**
   - A detailed imagePrompt field (REQUIRED for every post) following IMAGE-FIRST THINKING:
    * **THINK IMAGE FIRST:** Before writing the caption, visualize what image would best represent this post. The imagePrompt drives the content.
    * **CRITICAL:** The prompt MUST describe a **professional, photorealistic marketing image** suitable for social media.
    * **BRAND ALIGNMENT:** Use brand colors (${colorPalette}) and ${brandDesign.brandStyle || "modern"} style as visual foundation.
    * **VISUAL CONTEXT:** ${visualContext}
    * ${hasProducts ? "**WITH PRODUCTS:** Feature brand products naturally in the scene - on elegant surfaces, in lifestyle contexts, or being used/worn. Products may be creatively integrated into different settings." : hasLocation ? "**WITH LOCATION IMAGES:** The provided location images represent a REAL PHYSICAL SPACE (clinic, restaurant, store, office). These MUST NOT be modified, redesigned, or altered. Do NOT change architecture, furniture, layout, walls, or colors. Focus ONLY on lighting, framing, atmosphere, and composition. Do NOT hallucinate environments when real photos are provided." : "**WITHOUT REAL IMAGES:** Focus on lifestyle imagery, brand mood, atmosphere, and aspirational scenes that represent the brand's essence."}
    * **CRÍTICO: FIDELIDAD FÁCTICA DEL PRODUCTO:** When generating the imagePrompt, you MUST describe the product (e.g., the bracelet, the ring, the necklace) with **absolute fidelity** to the material, color, and shape provided in the 'FACTUAL PRODUCT CATALOG'. **DO NOT add details, change colors (e.g., Gold must remain Gold), or modify the object's geometry.** The creative freedom is restricted ONLY to the background and staging elements.
    * **TEXT IN IMAGES:** Avoid large blocks of text in images. If text is needed, limit to 1-3 subtle words only (brand name or short tagline).
    * **COMPOSITION:** Use professional composition suitable for social media - clean backgrounds, good lighting, visually appealing arrangement.
    * References specific products or assets from the brand when relevant (PRODUCT NAME from catalog).
    * ${hasLocation ? "**LOCATION PRESERVATION:** If location images are referenced, describe them as-is without modifications to the physical space." : ""}
5. Posts should be varied: product showcases, tips, behind-the-scenes, user engagement, trending content
6. Ensure posts follow the brand style: ${brandDesign.brandStyle || "modern and professional"}
7. **CRÍTICO:** When creating the imagePrompt, you MUST reference the **specific names** of the top-selling products or relevant visual assets from the BRAND VISUAL ASSETS and TOP SELLING PRODUCTS lists (e.g., "The image must feature the 'Classic Chronos' watch in a leather band, matching the visual style of the reference images provided."). This ensures the final image features the brand's actual catalog.
8. **LANGUAGE ENFORCEMENT (CRITICAL):**
 - All textual content (titulo, content, hashtags) MUST be written in ${languageLabel}.
 - Emojis are allowed.
 - No bilingual output.

9. PLATFORM MAPPING: Use these exact platform values in the JSON:
   - For Instagram posts: "instagram"
   - For Instagram Stories: "instagram_story"
   - For Instagram Reels: "instagram_reel"
   - For Facebook: "facebook"

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "posts": [
    {
      "platform": "instagram",
      "titulo": "Eye-catching hook or title",
      "content": "Full caption with emojis and call to action...",
      "hashtags": "#brand #hashtag1 #hashtag2",
      "dia": "${year}-${String(month).padStart(2, "0")}-01",
      "optimalTime": "6:00 PM",
      "imagePrompt": "Detailed description for image generation: [describe scene with brand colors ${colorPalette}, ${brandDesign.brandStyle || "modern"} style, referencing specific brand products/assets]..."
    }
  ]
}`;
}

export function buildPostsSkeletonPrompt(
  context: PostGenerationContext,
): string {
  const {
    brandName,
    brandDescription,
    brandDesign,
    metaInsights,
    month,
    year,
    postingSchedule,
    connectedPlatforms,
  } = context;

  const preferredLanguage =
    context.preferredLanguage || context.brandDesign.preferredLanguage || "en";

  const languageLabel = languageInstruction(preferredLanguage);

  const monthName = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
  });

  // Fecha actual
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const startDay =
    year === currentYear && month === currentMonth ? currentDay : 1;

  const lastDayOfMonth = new Date(year, month, 0).getDate();

  const dateRestriction =
    startDay > 1
      ? `Generate posts ONLY from ${monthName} ${startDay} to ${monthName} ${lastDayOfMonth}.`
      : `Generate posts for the entire month of ${monthName}.`;

  const availablePlatforms =
    connectedPlatforms && connectedPlatforms.length > 0
      ? connectedPlatforms
      : ["instagram", "facebook"];

  let postingScheduleInstructions = "";
  let totalPosts = 0;

  if (postingSchedule && postingSchedule.length > 0) {
    postingScheduleInstructions = postingSchedule
      .map((schedule) => {
        totalPosts += schedule.postingDates.length;
        return `- ${schedule.platform}: ${schedule.postingDates.join(", ")}`;
      })
      .join("\n");
  } else {
    totalPosts = 15;
  }

  const bestTimes =
    metaInsights?.bestPostingTimes?.join(", ") || "9:00 AM, 12:00 PM, 6:00 PM";

  return `
You are an expert social media planner.

Your ONLY task is to generate a POSTS SKELETON for ${monthName} ${year}.

LANGUAGE (ABSOLUTE):
- ALL output MUST be in ${languageLabel}.
- Do NOT generate any copy text.
- Do NOT include captions, titles, or hashtags.

BRAND:
- Name: ${brandName}
- Description: ${brandDescription || "Not specified"}
- Style: ${brandDesign.brandStyle || "modern"}

DATE RULES:
${dateRestriction}

POSTING SCHEDULE:
${postingScheduleInstructions}

TOTAL POSTS: ${totalPosts}

FOR EACH POST:
- platform (exact value)
- dia (YYYY-MM-DD)
- optimalTime (choose from: ${bestTimes})

TEXT FIELDS MUST BE EMPTY STRINGS:
- titulo: ""
- content: ""
- hashtags: ""

IMPORTANT:
- DO NOT generate imagePrompt
- DO NOT generate any text content
- DO NOT invent extra fields

Return ONLY valid JSON in this format:

{
  "posts": [
    {
      "platform": "instagram",
      "titulo": "",
      "content": "",
      "hashtags": "",
      "dia": "${year}-${String(month).padStart(2, "0")}-01",
      "optimalTime": "6:00 PM"
    }
  ]
}
`;
}
export function buildTextFromImageVisionPrompt(
  context: PostGenerationContext,
): string {
  const preferredLanguage =
    context.preferredLanguage || context.brandDesign.preferredLanguage || "en";

  const languageLabel = languageInstruction(preferredLanguage);

  return `
You are an expert social media copywriter.

You are provided with an IMAGE.

BRAND ESSENCE (MANDATORY):
- Tone of Voice: ${context.brandEssence?.tone ?? "Not specified"}
- Personality: ${context.brandEssence?.personality ?? "Not specified"}
- Emotional Feel: ${context.brandEssence?.emotion ?? "Not specified"}
- Brand Promise: ${context.brandEssence?.promise ?? "Not specified"}

LANGUAGE RULES (ABSOLUTE – NO EXCEPTIONS):
- ALL generated text MUST be written exclusively in ${languageLabel}
- This includes title, caption, hashtags
- DO NOT mix languages
- DO NOT use English words unless the language is English
- Hashtags MUST be written in ${languageLabel}

TASK:
Based ONLY on the visual content of the image and the brand essence:
1. Generate a catchy title (titulo)
2. Generate a full caption with emojis (content)
3. Generate 5–10 relevant hashtags (hashtags)

IMPORTANT:
- Do NOT describe the image explicitly
- Do NOT mention AI
- Do NOT mention image generation
- Emojis are allowed
- The text must feel native and natural in ${languageLabel}

Return ONLY valid JSON:

{
  "titulo": "…",
  "content": "…",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3"
}
`;
}

// Helper function to clean and parse JSON from LLM response
function cleanAndParseJson(text: string): any {
  console.log("[PostGenerator] Raw response length:", text?.length || 0);

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("[PostGenerator] Direct parse failed, attempting cleanup");
  }

  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // Try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Fix common JSON issues
  cleaned = cleaned
    .replace(/,\s*}/g, "}") // Remove trailing commas in objects
    .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
    .replace(/[\x00-\x1F\x7F]/g, " ") // Remove control characters
    .replace(/\n/g, " ") // Replace newlines with spaces
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\t/g, " ") // Replace tabs with spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log("[PostGenerator] JSON cleanup failed, trying array extraction");
    console.log(
      "[PostGenerator] Cleaned text sample:",
      cleaned.substring(0, 500),
    );

    // Try to extract just the posts array with greedy matching
    const arrayMatch = cleaned.match(/"posts"\s*:\s*\[([\s\S]*)\]/);
    if (arrayMatch) {
      try {
        // Try to balance brackets properly
        let arrayContent = arrayMatch[1];
        const posts = JSON.parse(`[${arrayContent}]`);
        return { posts };
      } catch (e2) {
        console.log(
          "[PostGenerator] Array extraction failed, trying individual posts",
        );
      }
    }

    // Last resort: try to extract individual post objects using a more flexible regex
    const posts: any[] = [];

    // Match objects that have required fields (platform, titulo, content)
    const objectRegex = /\{\s*"[^"]+"\s*:\s*[^{}]+(?:\{[^{}]*\})*[^{}]*\}/g;
    let match;
    while ((match = objectRegex.exec(cleaned)) !== null) {
      try {
        const obj = JSON.parse(match[0]);
        // Validate it's a post object
        if (obj.platform && obj.titulo && obj.content) {
          posts.push(obj);
        }
      } catch (e3) {
        // Skip malformed objects
      }
    }

    if (posts.length > 0) {
      console.log(
        `[PostGenerator] Recovered ${posts.length} posts from fragmented response`,
      );
      return { posts };
    }

    // Very last resort: try splitting by platform field and reconstructing
    const platformSplits = cleaned.split(/"platform"\s*:/);
    if (platformSplits.length > 1) {
      for (let i = 1; i < platformSplits.length; i++) {
        try {
          // Find the next complete object
          const segment = '{"platform":' + platformSplits[i];
          const endBrace = findMatchingBrace(segment, 0);
          if (endBrace > 0) {
            const objStr = segment.substring(0, endBrace + 1);
            const obj = JSON.parse(objStr);
            if (obj.platform && obj.titulo && obj.content) {
              posts.push(obj);
            }
          }
        } catch (e4) {
          // Skip malformed segments
        }
      }

      if (posts.length > 0) {
        console.log(
          `[PostGenerator] Recovered ${posts.length} posts from split response`,
        );
        return { posts };
      }
    }

    console.error("[PostGenerator] All parsing attempts failed");
    throw new Error(
      "Could not parse JSON from Gemini response after cleanup attempts",
    );
  }
}

// Helper to find matching closing brace
function findMatchingBrace(str: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < str.length; i++) {
    const char = str[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
  }

  return -1;
}

export async function generatePostsWithGemini(
  context: PostGenerationContext,
): Promise<any> {
  console.log(
    `[PostGenerator] Gemini generation mode: ${context.generationMode ?? "full"}`,
  );

  const preferredLanguage =
    context.preferredLanguage || context.brandDesign.preferredLanguage || "en";

  const languageLabel = languageInstruction(preferredLanguage);

  const generationMode = context.generationMode ?? "full";

  try {
    // ─────────────────────────────────────────────
    // MODE: FULL (LEGACY – NO TOCAR)
    // ─────────────────────────────────────────────
    if (generationMode === "full") {
      const prompt = buildTextPrompt(context);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: fullPostsSchema(languageLabel),
        },
      });

      const parsed = cleanAndParseJson(response.text || "");
      return enforceLanguage(parsed.posts || [], preferredLanguage);
    }

    // ─────────────────────────────────────────────
    // MODE: SKELETON (estructura vacía)
    // ─────────────────────────────────────────────
    if (generationMode === "skeleton") {
      const prompt = buildPostsSkeletonPrompt(context);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: skeletonPostsSchema(),
        },
      });

      const parsed = cleanAndParseJson(response.text || "");
      return parsed.posts || [];
    }

    // ─────────────────────────────────────────────
    // MODE: VISION (imagen → texto)
    // ─────────────────────────────────────────────
    if (generationMode === "vision") {
      if (!context.imageDataUrl) {
        throw new Error("Vision mode requires imageDataUrl in context");
      }

      const prompt = buildTextFromImageVisionPrompt(context);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: context.imageDataUrl,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: visionTextSchema(languageLabel),
        },
      });

      const parsed = cleanAndParseJson(response.text || "");

      return enforceLanguage(
        [
          {
            titulo: parsed.titulo,
            content: parsed.content,
            hashtags: parsed.hashtags,
            platform: "",
            dia: "",
            optimalTime: "",
            imagePrompt: "",
          },
        ],
        preferredLanguage,
      )[0];
    }

    throw new Error(`Unknown generationMode: ${generationMode}`);
  } catch (error) {
    console.error("[PostGenerator] Gemini generation failed:", error);
    throw error;
  }
}

// Helper function to fetch an image from URL and convert to base64
async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `[PostGenerator] Failed to fetch image from ${url}: ${response.status}`,
      );
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // Determine mime type from URL or response
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();

    return { data: base64, mimeType };
  } catch (error) {
    console.error(`[PostGenerator] Error fetching image from ${url}:`, error);
    return null;
  }
}

// Interface for brand asset
interface BrandAssetForImage {
  url: string;
  name: string;
  category?: string;
  description?: string;
}

function pickAssetsForMode(mode: VisualMode, assets: BrandAssetForImage[]) {
  const allProducts = assets.filter(
    (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase())
  );

  const allTemplates = assets.filter(
    (a) => a.category && TEMPLATE_CATEGORIES.includes(a.category.toLowerCase())
  );

  const allLocations = assets.filter(
    (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase())
  );

  const logos = assets.filter((a) => a.category === "logos");

  // Random selection helpers
  const randomItem = <T>(arr: T[]): T | null => 
    arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

  return {
    product: randomItem(allProducts),
    template: (mode === "campaign_template" || mode === "inspiration_based") 
      ? randomItem(allTemplates) 
      : null,
    location: (mode === "lifestyle" || mode === "venue_showcase") 
      ? randomItem(allLocations) 
      : null,
    logo: logos[0] ?? null,
    mode,
  };
}
function pickVisualReferenceAssets(
  assets: BrandAssetForImage[],
  count = 3,
): BrandAssetForImage[] {
  if (!assets || assets.length === 0) return [];

  // Filtra SOLO las categorías que definen el estilo y el lugar/ambiente
  // Incluye todas las variantes de categorías de ubicación
  const locationCategories = ["location", "location_images", "location_assets", "place"];
  const visualAssets = assets.filter(
    (a) =>
      a.category && (
        locationCategories.includes(a.category) ||
        a.category === "inspiration_templates"
      ),
  );

  // Si no hay assets visuales específicos, no envía nada o usa un fallback
  if (visualAssets.length === 0) {
    console.warn(
      "[PostGenerator] No specific location or inspiration assets found for image reference.",
    );
    return [];
  }

  // Lógica de shuffle y slice
  for (let i = visualAssets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [visualAssets[i], visualAssets[j]] = [visualAssets[j], visualAssets[i]];
  }

  return visualAssets.slice(0, count);
}

export async function generateImageWithGeminiNanoBanana({
  imagePrompt,
  brandDesign,
  brandAssets,
  brandEssence,
}: {
  imagePrompt: string;
  brandDesign: BrandDesign;
  brandAssets: BrandAssetForImage[];
  brandEssence?: {
    tone?: string | null;
    personality?: string | null;
    emotion?: string | null;
    visualKeywords?: string | null;
    promise?: string | null;
  };
}): Promise<string | null> {
  try {
    console.log("🚀 [NanoBanana] Iniciando generación...");
    console.log("📦 [Assets recibidos]:", brandAssets.length);

    const mode = selectVisualMode(brandAssets);
    const modeAssets = pickAssetsForMode(mode, brandAssets);

    // 🔍 LOG: Debug de Lógica de Selección
    console.log("🛠️ [Modo Seleccionado]:", mode);
    console.log("🖼️ [Mode Assets]:", {
      hasProduct: !!modeAssets.product,
      hasTemplate: !!modeAssets.template,
      hasLocation: !!modeAssets.location,
      productUrl: modeAssets.product?.url || "N/A",
      templateUrl: modeAssets.template?.url || "N/A",
      locationUrl: modeAssets.location?.url || "N/A",
    });

    const contentParts: any[] = [];

    // 1️⃣ TEMPLATE (for campaign_template or inspiration_based modes)
    if ((mode === "campaign_template" || mode === "inspiration_based") && modeAssets.template) {
      console.log("🎨 [Cargando Template]:", modeAssets.template.url);
      const templateImg = await fetchImageAsBase64(modeAssets.template.url);
      if (templateImg) {
        contentParts.push({
          inlineData: {
            data: templateImg.data,
            mimeType: templateImg.mimeType,
          },
        });
      }
    }
    
    // 2️⃣ LOCATION (for lifestyle or venue_showcase modes)
    if ((mode === "lifestyle" || mode === "venue_showcase") && modeAssets.location) {
      console.log("🏠 [Cargando Location]:", modeAssets.location.url);
      const locationImg = await fetchImageAsBase64(modeAssets.location.url);
      if (locationImg) {
        contentParts.push({
          inlineData: {
            data: locationImg.data,
            mimeType: locationImg.mimeType,
          },
        });
      }
    }

    // 3️⃣ PRODUCTO (if available - for product_showcase, campaign_template, lifestyle modes)
    if (modeAssets.product) {
      console.log("🍎 [Cargando Producto]:", modeAssets.product.url);
      const productImg = await fetchImageAsBase64(modeAssets.product.url);
      if (productImg) {
        contentParts.push({
          inlineData: { data: productImg.data, mimeType: productImg.mimeType },
        });
      }
    }

    // 3️⃣ LOGO (Branding)
    if (brandDesign.logoUrl) {
      console.log("🏷️ [Cargando Logo]:", brandDesign.logoUrl);
      const logoImg = await fetchImageAsBase64(brandDesign.logoUrl);
      if (logoImg) {
        contentParts.push({
          inlineData: { data: logoImg.data, mimeType: logoImg.mimeType },
        });
      }
    }

    // Build color palette string for the prompt
    const colorPalette = [
      brandDesign.colorPrimary,
      brandDesign.colorAccent1,
      brandDesign.colorAccent2,
      brandDesign.colorAccent3,
      brandDesign.colorAccent4,
    ].filter(Boolean).join(", ");

    // Mode-specific instructions
    const getModeInstructions = (visualMode: VisualMode): string => {
      switch (visualMode) {
        case "campaign_template":
          return `MODO: CAMPAIGN_TEMPLATE (Producto + Template de Inspiración)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGEN 1 – TEMPLATE: Referencia de composición y estilo. NO copiar literalmente.
IMAGEN 2 – PRODUCTO: Elemento principal que debe presentarse con fidelidad absoluta.

INSTRUCCIONES:
- Inspirarte en la composición, balance y estilo del template
- Reconstruir una NUEVA escena usando el producto proporcionado
- El template guía la estructura visual, pero el producto es el protagonista
- NO reutilizar objetos del template, crear escena nueva`;

        case "lifestyle":
          return `MODO: LIFESTYLE (Producto en Ubicación Real)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGEN 1 – UBICACIÓN: Espacio físico real que NO debe ser alterado.
IMAGEN 2 – PRODUCTO: Debe integrarse naturalmente en el espacio.

INSTRUCCIONES:
- PRESERVAR la ubicación exactamente como fue fotografiada
- NO modificar arquitectura, muebles, paredes, colores, layout
- SOLO ajustar: iluminación, encuadre, atmósfera
- Integrar el producto de forma natural en el espacio existente
- El producto debe verse físicamente presente, con sombras de contacto`;

        case "product_showcase":
          return `MODO: PRODUCT_SHOWCASE (Solo Producto)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGEN 1 – PRODUCTO: Único elemento visual proporcionado.

INSTRUCCIONES:
- Crear un fondo y contexto atractivo basado en la identidad de marca
- Usar los colores de marca para el entorno
- El producto debe ser el protagonista absoluto
- Crear una escena de estilo de vida o fondo minimalista según el estilo de marca
- Añadir props complementarios sutiles si es apropiado para la industria`;

        case "venue_showcase":
          return `MODO: VENUE_SHOWCASE (Solo Ubicación/Venue)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGEN 1 – UBICACIÓN: Espacio físico real que es el protagonista.

REGLAS CRÍTICAS:
- PRESERVAR la ubicación EXACTAMENTE como fue fotografiada
- NO modificar arquitectura, muebles, paredes, colores, elementos estructurales
- NO inventar ni agregar elementos que no existan en la ubicación real

ÚNICOS AJUSTES PERMITIDOS:
- Iluminación profesional (cálida, acogedora, dramática según marca)
- Encuadre y composición
- Atmósfera y mood (sin alterar elementos físicos)
- Aplicar sutilmente los colores de marca en la iluminación/tonalidad`;

        case "inspiration_based":
          return `MODO: INSPIRATION_BASED (Solo Templates de Inspiración)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMAGEN(ES) – TEMPLATES: Referencias de estilo y composición.

INSTRUCCIONES:
- Analizar el estilo, composición y mood de los templates
- Crear una imagen NUEVA inspirada en ese estilo visual
- Usar los colores y estilo de la marca
- Generar contenido visual que capture la esencia de los templates
- NO copiar elementos específicos, solo inspirarse en el estilo general`;

        case "brand_only":
          return `MODO: BRAND_ONLY (Sin Assets - Solo Identidad de Marca)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No hay imágenes de referencia proporcionadas.

INSTRUCCIONES:
- Crear una imagen basada ÚNICAMENTE en la identidad de marca
- Usar prominentemente los colores de marca
- Seguir el estilo visual de la marca
- Generar contenido visual abstracto o de estilo de vida que represente la marca
- Evitar elementos genéricos, crear algo distintivo para esta marca`;
      }
    };

    const modeInstructions = getModeInstructions(mode);

    const finalPrompt = `Eres un generador de imágenes AI experto en crear imágenes PROFESIONALES DE MARKETING para redes sociales que reflejan fielmente la identidad de la marca.

Tu objetivo es crear UNA NUEVA IMAGEN LISTA PARA PUBLICAR según el modo de generación indicado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTIDAD DE MARCA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Estilo: ${brandDesign.brandStyle || "moderno y profesional"}
- Colores: ${colorPalette || "usar colores profesionales"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${modeInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO: IMAGEN PUBLISH-READY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La imagen final debe ser:
- Profesional y fotorealista, apta para marketing digital
- Alineada con los colores de marca
- Estilo visual coherente con la marca
- Lista para publicar en redes sociales sin edición adicional

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA DE TEXTO EN IMÁGENES (CRÍTICA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- EVITAR bloques grandes de texto en la imagen
- Si se necesita texto, LIMITAR a 1-3 palabras sutiles únicamente
- El texto debe ser discreto y bien integrado, NO dominante
- Preferir imágenes limpias y visuales

${mode === "campaign_template" || mode === "lifestyle" || mode === "product_showcase" ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS DE PRODUCTO (SI APLICA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Si hay un producto en las imágenes proporcionadas:
- No modificar forma, color, proporciones ni materiales
- No rediseñar, estilizar ni reinterpretar el producto
- El producto debe coincidir exactamente con la imagen proporcionada
- El producto debe verse FÍSICAMENTE PRESENTE, no insertado digitalmente
- Deben existir sombras de contacto suaves y naturales
` : ""}

${mode === "lifestyle" || mode === "venue_showcase" ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLAS DE UBICACIÓN (CRÍTICAS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
La ubicación representa un ESPACIO FÍSICO REAL:
- PRESERVAR exactamente como fue fotografiado
- NO modificar: arquitectura, muebles, paredes, colores, layout
- NO inventar ni agregar elementos que no existan
- SOLO permitido: iluminación, encuadre, atmósfera
` : ""}

DETALLE ESPECÍFICO PARA JOYERÍA (SI APLICA):
- Las piezas no deben ser perfectamente paralelas.
- Puede haber una mínima variación de profundidad entre piezas.
- Las reflexiones deben variar sutilmente entre elementos.
- Evitar simetría perfecta tipo catálogo CGI.

───────────────────────────────
IMAGEN 3 – LOGO (IDENTIDAD DE MARCA)
────────────────────────────────
La tercera imagen es el logo oficial de la marca.

Debes integrar el logo de forma:
- sutil
- realista
- física
y coherente con la escena.

Ejemplos de integración permitida:
- grabado
- relieve
- emblema metálico
- etiqueta o placa discreta
- detalle sobre empaque o superficie cercana al producto

REGLAS ESTRICTAS DEL LOGO:
- No alterar la forma original del logo
- No simplificarlo ni reemplazarlo por letras o símbolos
- No añadir texto adicional
- No estilizar, reinterpretar ni deformar el logo

────────────────────────────────
CONDICIONES FINALES (OBLIGATORIAS)
────────────────────────────────
- El producto debe ser el protagonista absoluto de la imagen
- El template define la composición y estética, pero NO los objetos
- El producto debe integrarse físicamente en la escena con realismo
- El logo debe estar presente de forma física y claramente reconocible
- La escena debe sentirse coherente, natural y visualmente integrada
- Cualquier imagen que modifique el producto, copie objetos del template o altere el logo es inválida

`;

    // 🔍 LOG: Verificar orden de imágenes y prompt
    console.log("📝 [Total Content Parts]:", contentParts.length);
    console.log("📝 [Prompt Final]:", finalPrompt);

    contentParts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: contentParts,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1", imageSize: "2K" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        console.log("✅ [NanoBanana] Imagen generada con éxito");
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }

    console.warn(
      "⚠️ [NanoBanana] El modelo no devolvió ninguna imagen en los parts",
    );
    return null;
  } catch (error) {
    console.error("🔥 [NanoBanana] Error crítico:", error);
    return null;
  }
}

// 🔹 FUNCIÓN PRINCIPAL (con los 2 cambios que necesitas)
export async function generateImageWithNanoBanana(
  imagePrompt: string,
  brandDesign: BrandDesign,
  brandAssets?: BrandAssetForImage[],
  brandEssence?: {
    tone: string | null;
    personality: string | null;
    emotion: string | null;
    visualKeywords: string | null;
    promise: string | null;
  },
): Promise<string | null> {
  try {
    const preferredLanguage = brandDesign.preferredLanguage || "en";

    const languageLabel = languageInstruction(preferredLanguage);
    const visualResetBlock = `
    IMPORTANT BRAND ISOLATION RULE (ABSOLUTE):
    - This image generation belongs ONLY to the current brand.
    - Ignore any visual identity, color palette, logo style, typography, or aesthetics
      from any previous generations, brands, or examples.
    - Do NOT reuse styles, colors, or moods from earlier prompts.
    - Use ONLY the information, assets, and palette explicitly provided below.
    `;

    let styleSynthesisBlock = "";

    const styleAssets =
      brandAssets?.filter(
        (a) =>
          a.category === "inspiration_templates" &&
          a.description &&
          a.description.length > 30,
      ) ?? [];

    if (styleAssets.length > 0) {
      styleSynthesisBlock = `
    ### VISUAL STYLE REFERENCE (STRICT BUT BRAND-SPECIFIC):
    Synthesize the visual style ONLY from the following brand-owned inspiration assets.
    DO NOT reuse styles from other brands.
    If a color is NOT explicitly present here, DO NOT introduce it.

    Brand Color Palette (SOURCE OF TRUTH):
    - Primary: ${brandDesign.colorPrimary}
    - Accents: ${brandDesign.colorAccent1}, ${brandDesign.colorAccent2}, ${brandDesign.colorAccent3}

    ${styleAssets.map((a) => `• ${a.name}: ${a.description}`).join("\n")}
    `;
    }
    const logoPlacementBlock = `
    LOGO PLACEMENT (MANDATORY – NO EXCEPTIONS):
    - The brand logo MUST be physically present in the scene as a real object.
    - Choose ONE of the following placements (must be visible and realistic):
      • engraved on the product surface
      • embossed on product packaging
      • printed on a fabric label
      • engraved on a metal plate attached to the product
      • debossed on a box, case, or container
    - The logo MUST be clearly visible (not hidden, not cropped, not out of frame).
    - The logo MUST NOT float, glow, or appear as UI text.
    - The logo MUST NOT be optional.
    `;

    // ==========================================================================================
    // ✔ Prompt final con resúmenes incluidos (no cambia tu estructura original)
    // ==========================================================================================
    
    // Classify brand assets into product and location categories
    const hasProducts = brandAssets?.some(
      (a) => a.category && ["product_images", "product", "products", "product_assets"].includes(a.category)
    ) ?? false;
    
    const hasLocation = brandAssets?.some(
      (a) => a.category && ["location", "location_images", "location_assets", "place"].includes(a.category)
    ) ?? false;
    
    // Visual context for image strategy based on available assets
    const productImageContext = hasProducts
      ? "The brand has real product images. Feature products naturally in the scene - on elegant surfaces, in lifestyle contexts, or being used/worn. Products may be creatively integrated."
      : hasLocation
      ? "The brand has real location images (e.g. clinic, restaurant, store, office). These represent a REAL PHYSICAL SPACE and MUST NOT be altered. Use them as-is and build marketing content around them."
      : "The brand has no real product or location images. Focus on lifestyle imagery, brand mood, atmosphere, and aspirational scenes that represent the brand's essence.";
    
    // Location-specific constraints
    const locationConstraints = hasLocation
      ? `
LOCATION IMAGE CONSTRAINTS (CRITICAL):
- The provided location images represent a REAL physical space - DO NOT alter, redesign, or modify them.
- Do NOT change architecture, furniture, layout, walls, colors, or any structural elements.
- Focus ONLY on: lighting enhancements, framing, atmosphere, and composition.
- Do NOT hallucinate or add elements that don't exist in the real location.
- Preserve the authentic look of the space exactly as photographed.`
      : "";
    
    const enhancedPrompt = `${visualResetBlock}${imagePrompt}. 

────────────────────────────────
OBJETIVO: IMAGEN PROFESIONAL PUBLISH-READY
────────────────────────────────
La imagen final debe ser:
- Profesional y fotorealista, apta para marketing digital en redes sociales
- Lista para publicar sin edición adicional
- Composición limpia con buena iluminación y fondo profesional

VISUAL CONTEXT:
${productImageContext}
${locationConstraints}

TEXT IN IMAGES (CRITICAL RULE):
- AVOID large blocks of text in the image
- If text is needed, LIMIT to 1-3 subtle words only (brand name or short tagline)
- Text must be discreet and well-integrated, NOT dominant
- Prefer clean images where the visual subject is the protagonist

    **CRITICAL SCENE DESCRIPTION (The core idea and FACTUAL SUBJECT):** ${imagePrompt}
    **FIDELITY MANDATE (DO NOT ALTER THE SUBJECT):** The product subject described above MUST be rendered with 100% fidelity to its material, shape, and color (e.g., if it is rose-gold, it must be rose-gold; if it is oval, it must be oval). **The product is fixed.**
   
LANGUAGE CONSTRAINT FOR IMAGE TEXT (MANDATORY):
- Any visible text inside the image (signs, labels, packaging text, menus, cards, UI elements, posters, captions, etc.)
  MUST be written exclusively in ${languageLabel}.
- DO NOT include English text unless the language is English.

LOGO REQUIREMENT (ABSOLUTE):
The brand logo MUST appear in the image.
${logoPlacementBlock}

    BRAND ESSENCE INSTRUCTIONS:
    - Tone: ${brandEssence?.tone || "professional and engaging"}
    - Personality: ${brandEssence?.personality || "modern and approachable"}
    - Emotional Feel: ${brandEssence?.emotion || "inspiring and trustworthy"}
    - Visual Keywords: ${brandEssence?.visualKeywords || "clean, vibrant, professional"}
    - Brand Promise: ${brandEssence?.promise || "quality and reliability"}

    These MUST influence the image atmosphere, lighting, colors, textures, and composition.
    
    Brand Style: ${brandDesign.brandStyle || "modern and professional"} 
    Color Scheme: Primary ${brandDesign.colorPrimary}, Accents ${brandDesign.colorAccent1}, ${brandDesign.colorAccent2}
    
    REQUIREMENTS:
    - Follow the brand essence strictly
    - Match the real visual identity from the uploaded brand assets
    - Produce a professional social media image ready for publishing
    
    ${styleSynthesisBlock}
    `;

    console.log("[PostGenerator] Generating image with Nano Banana...");
    const contentParts: any[] = [];

    if (brandDesign.logoUrl) {
      const logoImage = await fetchImageAsBase64(brandDesign.logoUrl);
      if (logoImage) {
        contentParts.push({
          inlineData: {
            data: logoImage.data,
            mimeType: logoImage.mimeType,
          },
        });
        console.log(
          "[PostGenerator] Added brand logo as visual source of truth",
        );
      }
    }

    if (brandAssets && brandAssets.length > 0) {
      // ✔ NUEVO: Usa 3 assets din �micos, no siempre los mismos
      const assetsToUse = pickVisualReferenceAssets(brandAssets, 3);

      console.log(
        `[PostGenerator] Using rotating brand assets:`,
        assetsToUse.map((a) => a.name),
      );

      for (const asset of assetsToUse) {
        const imageData = await fetchImageAsBase64(asset.url);
        if (imageData) {
          contentParts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType,
            },
          });
          console.log(
            `[PostGenerator] Added asset "${asset.name}" as reference`,
          );
        }
      }

      contentParts.push({
        text: `
      🚨 VISUAL REFERENCE INSTRUCTIONS (CRITICAL):
      - The FIRST image provided above is the OFFICIAL brand logo.
      - This logo is a FIXED graphic mark and MUST be reproduced EXACTLY as shown.
      - Do NOT simplify it into a letter, monogram, or symbol.
      - Do NOT translate, reinterpret, redraw, stylize, abstract, or distort it.
      - Preserve ALL characters, spacing, and typography exactly.
      - Treat the logo as a graphic image, NOT as translatable text.

      - The remaining images above are brand visual references (locations / inspiration).
      - Use them ONLY for lighting, textures, color mood, and composition.
      - Do NOT copy their content literally.

      LANGUAGE CONSTRAINT (MANDATORY):
      - ALL visible text in the generated image (signage, labels, packaging text, UI elements, cards, etc.)
        MUST be written exclusively in ${languageLabel}.
      - This rule DOES NOT apply to the brand logo shown above.

      Now create this image:
      ${enhancedPrompt}
        `,
      });
    } else {
      contentParts.push({ text: enhancedPrompt });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contentParts,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const base64Image = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || "image/png";
          const dataUrl = `data:${mimeType};base64,${base64Image}`;
          console.log("[PostGenerator] Image generated successfully");
          return dataUrl;
        }
      }
    }

    console.log("[PostGenerator] No image in response");
    return null;
  } catch (error) {
    console.error("[PostGenerator] Error generating image:", error);
    return null;
  }
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Watermark] Failed to download image: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("[Watermark] Error downloading image:", error);
    return null;
  }
}

export async function addWatermarkToImage(
  imageDataUrl: string,
  logoUrl: string | null | undefined,
  options: {
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    opacity?: number;
    scale?: number;
    padding?: number;
  } = {},
): Promise<string> {
  const {
    position = "bottom-right",
    opacity = 0.7,
    scale = 0.15,
    padding = 20,
  } = options;

  if (!logoUrl) {
    console.log("[Watermark] No logo URL provided, returning original image");
    return imageDataUrl;
  }

  try {
    const base64Match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      console.error("[Watermark] Invalid data URL format");
      return imageDataUrl;
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const imageBuffer = Buffer.from(base64Data, "base64");

    const logoBuffer = await downloadImage(logoUrl);
    if (!logoBuffer) {
      console.log(
        "[Watermark] Could not download logo, returning original image",
      );
      return imageDataUrl;
    }

    const imageMetadata = await sharp(imageBuffer).metadata();
    const imageWidth = imageMetadata.width || 1024;
    const imageHeight = imageMetadata.height || 1024;

    const logoSize = Math.round(Math.min(imageWidth, imageHeight) * scale);

    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .modulate({
        saturation: 1,
        brightness: 1,
      })
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
          raw: {
            width: 1,
            height: 1,
            channels: 4,
          },
          tile: true,
          blend: "dest-in",
        },
      ])
      .toBuffer();

    const logoMeta = await sharp(resizedLogo).metadata();
    const logoWidth = logoMeta.width || logoSize;
    const logoHeight = logoMeta.height || logoSize;

    let left: number, top: number;
    switch (position) {
      case "top-left":
        left = padding;
        top = padding;
        break;
      case "top-right":
        left = imageWidth - logoWidth - padding;
        top = padding;
        break;
      case "bottom-left":
        left = padding;
        top = imageHeight - logoHeight - padding;
        break;
      case "bottom-right":
      default:
        left = imageWidth - logoWidth - padding;
        top = imageHeight - logoHeight - padding;
        break;
    }

    const watermarkedBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: resizedLogo,
          left: Math.max(0, left),
          top: Math.max(0, top),
        },
      ])
      .toBuffer();

    const watermarkedBase64 = watermarkedBuffer.toString("base64");
    console.log("[Watermark] Successfully added watermark to image");
    return `data:${mimeType};base64,${watermarkedBase64}`;
  } catch (error) {
    console.error("[Watermark] Error adding watermark:", error);
    return imageDataUrl;
  }
}
function containsForbiddenEnglish(text: string): boolean {
  // Palabras comunes que delatan salida en inglés
  const forbidden =
    /\b(the|and|with|for|your|you|new|best|now|shop|sale|discover|explore|crafted|timeless)\b/i;
  return forbidden.test(text);
}

async function forceTranslateToLanguage(
  content: { titulo: string; content: string; hashtags: string },
  languageLabel: string,
): Promise<{ titulo: string; content: string; hashtags: string }> {
  const prompt = `
Translate the following JSON content to ${languageLabel}.

RULES:
- Preserve tone, emotion, and emojis
- Preserve meaning of hashtags
- Do NOT add new content
- Output MUST be valid JSON
- Output MUST be written ONLY in ${languageLabel}

CONTENT:
${JSON.stringify(content)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titulo: {
            type: Type.STRING,
            description: `Must be written in ${languageLabel}`,
          },
          content: {
            type: Type.STRING,
            description: `Must be written in ${languageLabel}`,
          },
          hashtags: {
            type: Type.STRING,
            description: `Must be written in ${languageLabel}`,
          },
        },
        required: ["titulo", "content", "hashtags"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function refinePostWithGeminiUsingImage({
  imageDataUrl,
  brandName,
  brandEssence,
  preferredLanguage,
}: {
  imageDataUrl: string;
  brandName: string;
  brandEssence?: {
    tone?: string | null;
    emotion?: string | null;
    visualKeywords?: string | null;
  };
  preferredLanguage: string;
}): Promise<{
  titulo: string;
  content: string;
  hashtags: string;
}> {
  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("[RefineCopy] Invalid image data URL");
  }

  const [, mimeType, base64] = match;
  const languageLabel = languageInstruction(preferredLanguage);

  const basePrompt = `
You are an expert social media copywriter.

You are given a FINAL GENERATED IMAGE.
Write social media copy that matches THIS image.

LANGUAGE CONSTRAINT (ABSOLUTE — NO EXCEPTIONS):
- ALL output MUST be written exclusively in ${languageLabel}
- ANY word in another language is FORBIDDEN
- If you violate this, the output is INVALID

STYLE RULES:
- Do NOT describe the image literally
- Write aspirational, premium, emotional copy
- Adapt tone to the visual mood of the image

BRAND NAME: ${brandName}

BRAND ESSENCE:
- Tone: ${brandEssence?.tone ?? "professional"}
- Emotion: ${brandEssence?.emotion ?? "aspirational"}
- Visual keywords: ${brandEssence?.visualKeywords ?? "clean, premium"}

RETURN VALID JSON WITH:
- titulo
- content
- hashtags (5–10)
`;

  // 🔁 Hasta 2 intentos “naturales”
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
        { text: basePrompt },
      ],
      config: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            content: { type: Type.STRING },
            hashtags: { type: Type.STRING },
          },
          required: ["titulo", "content", "hashtags"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    const combined = `${result.titulo} ${result.content} ${result.hashtags}`;

    if (!containsForbiddenEnglish(combined)) {
      return result; // ✅ Idioma correcto
    }

    console.warn(
      `[RefineCopy] Language violation detected (attempt ${attempt}). Retrying...`,
    );
  }

  // 🔥 FALLBACK DURO: traducir sí o sí
  console.warn(
    "[RefineCopy] Forcing translation to target language as fallback",
  );

  const fallback = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
      {
        text: `
Generate the copy FIRST in ANY language you prefer.
Then TRANSLATE it to ${languageLabel}.

FINAL OUTPUT MUST be ONLY in ${languageLabel}.
Return valid JSON with titulo, content, hashtags.
`,
      },
    ],
  });

  const fallbackParsed = JSON.parse(fallback.text || "{}");

  return forceTranslateToLanguage(fallbackParsed, languageLabel);
}

export async function processPostGeneration(
  brandId: string,
  jobId: string,
  month: number,
  year: number,
): Promise<void> {
  const { updatePostGeneratorJob } = await import(
    "../storage/postGeneratorJobs"
  );
  const { createAiGeneratedPost } = await import("../storage/aiGeneratedPosts");

  try {
    console.log(`[PostGenerator] Processing job ${jobId} for brand ${brandId}`);

    await updatePostGeneratorJob(jobId, { status: "processing" });

    const brand = await storage.getBrandByIdOnly(brandId);
    if (!brand) {
      throw new Error("Brand not found");
    }

    const brandDesign = await storage.getBrandDesignByBrandId(brandId);
    if (!brandDesign) {
      throw new Error(
        "Brand design not found. Please create your brand design first.",
      );
    }

    const brandAssets = await storage.getAssetsByBrandId(brandId);

    // Load brand essence from separate table
    const brandEssence = await storage.getBrandEssence(brandId);

    const integrations = await storage.getIntegrationsByBrandId(brandId);

    // Get only connected Meta platforms (Instagram and Facebook)
    const connectedPlatforms = integrations
      .filter(
        (int) =>
          int.provider === "instagram_direct" ||
          int.provider === "instagram" ||
          int.provider === "facebook",
      )
      .map((int) =>
        int.provider === "instagram_direct" ? "instagram" : int.provider,
      );

    // Remove duplicates using Array.from for TypeScript compatibility
    const uniquePlatforms = Array.from(new Set(connectedPlatforms));

    if (uniquePlatforms.length === 0) {
      throw new Error(
        "No Instagram or Facebook integration found. Please connect your social accounts first.",
      );
    }

    console.log(
      `[PostGenerator] Connected platforms for brand ${brandId}:`,
      uniquePlatforms,
    );

    // Get the first available integration for insights
    const metaIntegration = integrations.find(
      (int) =>
        int.provider === "instagram_direct" ||
        int.provider === "instagram" ||
        int.provider === "facebook",
    );

    const metaInsights = metaIntegration
      ? await fetchMetaInsights(metaIntegration)
      : null;

    // Fetch posting frequency settings from social_posting_frequency table
    // THIS IS THE SOURCE OF TRUTH - only platforms in this table will get posts generated
    const postingFrequencies =
      await storage.getSocialPostingFrequenciesByBrand(brandId);
    console.log(
      `[PostGenerator] Found ${postingFrequencies.length} posting frequency settings for brand ${brandId}`,
    );

    if (postingFrequencies.length === 0) {
      throw new Error(
        "No posting frequency settings found. Please configure your posting schedule first in Settings > Posting Frequency.",
      );
    }

    // Determine if we're generating for current month (need to skip past dates)
    const now = new Date();
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth() + 1;

    // Build posting schedule ONLY for platforms that are in social_posting_frequency AND have active integrations
    const postingSchedule: PlatformPostingSchedule[] = [];

    // Start from social_posting_frequency (source of truth), then validate against integrations
    for (const frequency of postingFrequencies) {
      const rawFrequencyPlatform = frequency.platform.toLowerCase();
      // Normalize instagram_direct to instagram for matching
      const frequencyPlatform =
        rawFrequencyPlatform === "instagram_direct"
          ? "instagram"
          : rawFrequencyPlatform;

      // Check if this platform has an active integration
      const hasIntegration = uniquePlatforms.some((p) => {
        const normalizedIntegration =
          p === "instagram_direct" ? "instagram" : p.toLowerCase();
        return normalizedIntegration === frequencyPlatform;
      });

      if (!hasIntegration) {
        console.log(
          `[PostGenerator] Platform "${frequencyPlatform}" is in posting frequency but has no active integration - skipping`,
        );
        continue;
      }

      if (!frequency.daysWeek || frequency.daysWeek.length === 0) {
        console.log(
          `[PostGenerator] Platform "${frequencyPlatform}" has no posting days configured - skipping`,
        );
        continue;
      }

      // Calculate posting dates based on frequency settings
      const postingDates = calculatePostingDates(
        month,
        year,
        frequency.daysWeek,
        isCurrentMonth, // Skip past dates if generating for current month
      );

      if (postingDates.length > 0) {
        postingSchedule.push({
          platform: frequencyPlatform,
          frequencyDays: frequency.frequencyDays,
          daysWeek: frequency.daysWeek,
          postingDates,
        });

        console.log(
          `[PostGenerator] Platform ${frequencyPlatform}: ${postingDates.length} posts scheduled on days ${frequency.daysWeek.join(", ")}`,
        );
      } else {
        console.log(
          `[PostGenerator] Platform ${frequencyPlatform}: No valid posting dates found (all may be in the past)`,
        );
      }
    }

    // Calculate total posts
    const totalPosts = postingSchedule.reduce(
      (sum, s) => sum + s.postingDates.length,
      0,
    );
    console.log(
      `[PostGenerator] Total posts to generate: ${totalPosts} across ${postingSchedule.length} platforms`,
    );

    if (postingSchedule.length === 0 || totalPosts === 0) {
      throw new Error(
        "No valid posting schedule found. Please ensure you have configured posting frequency for platforms that are connected, or try a future month if all dates are in the past.",
      );
    }

    // Get platforms from the schedule (source of truth)
    const scheduledPlatforms = postingSchedule.map((s) => s.platform);

    // Skip Lightspeed data - not used in post generation
    const salesInsights: SalesInsights | undefined = undefined;
    console.log(`[PostGenerator] Skipping Lightspeed sales data (disabled)`);

    const context: PostGenerationContext = {
      brandId,
      brandName: brand.name,
      brandDescription: brand.description || undefined,
      preferredLanguage: brand.preferredLanguage || undefined, // From brand table (primary source)
      brandDesign,
      brandAssets,
      metaInsights: metaInsights || undefined,
      salesInsights,
      month,
      year,
      connectedPlatforms: scheduledPlatforms,
      postingSchedule,
      brandEssence: brandEssence
        ? {
            tone: brandEssence.toneOfVoice ?? null,
            personality: brandEssence.personality ?? null,
            emotion: brandEssence.emotionalFeel ?? null,
            visualKeywords: brandEssence.visualKeywords ?? null,
            promise: brandEssence.brandPromise ?? null,
          }
        : undefined,
    };

    const allPosts = await generatePostsWithGemini({
      ...context,
      generationMode: "skeleton",
    });

    // Server-side filtering: Only keep posts for platforms in the posting schedule
    // Build a map of allowed platform -> allowed dates
    const allowedSchedule = new Map<string, Set<string>>();
    for (const schedule of postingSchedule) {
      const dates = new Set(schedule.postingDates);
      // Add the base platform
      allowedSchedule.set(schedule.platform, dates);
      // Include Instagram variants if Instagram is in the schedule
      if (schedule.platform === "instagram") {
        allowedSchedule.set("instagram_story", dates);
        allowedSchedule.set("instagram_reel", dates);
      }
    }

    // Get today's date for filtering past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const posts = allPosts.filter((post: GeneratedPost) => {
      // Check platform is in the posting schedule
      const allowedDates = allowedSchedule.get(post.platform);
      if (!allowedDates) {
        console.log(
          `[PostGenerator] Filtering out post for platform "${post.platform}" - not in posting schedule`,
        );
        return false;
      }

      // Check date is in the allowed dates for this platform
      if (post.dia) {
        const postDate = new Date(post.dia);
        postDate.setHours(0, 0, 0, 0);

        // Check date is not in the past
        if (postDate < today) {
          console.log(
            `[PostGenerator] Filtering out post for date "${post.dia}" - date is in the past`,
          );
          return false;
        }

        // Check date is in the allowed dates for this platform
        if (!allowedDates.has(post.dia)) {
          console.log(
            `[PostGenerator] Filtering out post for platform "${post.platform}" on date "${post.dia}" - not a scheduled posting day`,
          );
          return false;
        }
      }

      return true;
    });

    if (posts.length === 0) {
      console.warn(
        `[PostGenerator] All generated posts were filtered out. Original: ${allPosts.length}, Filtered: 0`,
      );
      throw new Error(
        "No posts could be generated for your connected platforms. Please try again.",
      );
    }

    console.log(
      `[PostGenerator] Saving ${posts.length} posts to database (filtered from ${allPosts.length} generated)`,
    );

    // Prepare brand assets for image generation (up to 3 relevant ones)
    const assetsForImageGen = brandAssets.map((a) => ({
      url: a.url,
      name: a.name,
      category: a.category || "general",
      description: (a as any).description || "",
    }));

    for (const post of posts) {
      let finalUrl = "";
      let cloudinaryPublicId = null;
      try {
        const generatedImage = await generateImageWithGeminiNanoBanana({
          imagePrompt: post.imagePrompt,
          brandDesign,
          brandAssets: assetsForImageGen,
          brandEssence,
        });

        let finalTitulo = post.titulo;
        let finalContent = post.content;
        let finalHashtags = post.hashtags;
        if (generatedImage) {
          try {
            const imageBase64 = await fetchImageAsBase64(generatedImage);
            const dataUri = imageBase64
              ? `data:${imageBase64.mimeType};base64,${imageBase64.data}`
              : null;
            if (!dataUri)
              throw new Error("Failed to convert image to data URI");

            const refinedText = await generatePostsWithGemini({
              ...context,
              generationMode: "vision",
              imageDataUrl: imageBase64?.data,
            });

            finalTitulo = refinedText.titulo;
            finalContent = refinedText.content;
            finalHashtags = refinedText.hashtags;

            const upload = await cloudinary.uploader.upload(dataUri, {
              folder: `brands/posts/${brand.id}`,
              public_id: `${jobId}_${post.platform}_${post.dia}`,
              resource_type: "image",
            });

            finalUrl = upload.secure_url;
            cloudinaryPublicId = upload.public_id;
          } catch (err) {
            console.warn(
              "[PostGenerator] Refinement failed, using original copy",
            );
          }
        }

        await createAiGeneratedPost({
          jobId,
          brandId,
          platform: post.platform,
          titulo: finalTitulo,
          content: finalContent,
          hashtags: finalHashtags,
          imageUrl: finalUrl,
          cloudinaryPublicId,
          dia: post.dia,
          status: "pending",
          isSample: false,
        });
      } catch (postError) {
        console.error(
          `[PostGenerator] Failed to generate post for ${post.platform}:`,
          postError,
        );
      }
    }

    await updatePostGeneratorJob(jobId, {
      status: "completed",
      result: { postsGenerated: posts.length },
    });

    console.log(`[PostGenerator] Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`[PostGenerator] Job ${jobId} failed:`, error);

    await updatePostGeneratorJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function validatePostGenerationRequirements(
  brandId: string,
): Promise<{ valid: boolean; message?: string }> {
  const brandDesign = await storage.getBrandDesignByBrandId(brandId);
  if (!brandDesign) {
    return {
      valid: false,
      message:
        "Please create your brand design in Brand Studio before generating posts.",
    };
  }

  const integrations = await storage.getIntegrationsByBrandId(brandId);
  const hasMetaIntegration = integrations.some(
    (int) =>
      int.provider === "instagram_direct" ||
      int.provider === "instagram" ||
      int.provider === "facebook",
  );

  if (!hasMetaIntegration) {
    return {
      valid: false,
      message:
        "Please connect your Instagram or Facebook account before generating posts.",
    };
  }

  return { valid: true };
}
