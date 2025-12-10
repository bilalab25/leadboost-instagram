import { GoogleGenAI, Modality, Type } from "@google/genai";
import { storage } from "../storage";
import type { BrandDesign, BrandAsset, Integration } from "@shared/schema";
import sharp from "sharp";

// Using Replit's AI Integrations service for Gemini-compatible API access
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "", // Required for Replit AI Integrations
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
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
  brandId: string;
  brandName: string;
  brandDescription?: string;
  brandDesign: BrandDesign;
  brandAssets: BrandAsset[];
  metaInsights?: MetaInsights;
  salesInsights?: SalesInsights; // POS sales data from Lightspeed
  month: number;
  year: number;
  postsToGenerate?: number;
  connectedPlatforms?: string[]; // Platforms to generate posts for (e.g., ['instagram', 'facebook'])
  postingSchedule?: PlatformPostingSchedule[]; // Schedule per platform from social_posting_frequency
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

  const bestTimes =
    metaInsights?.bestPostingTimes?.join(", ") || "9:00 AM, 12:00 PM, 6:00 PM";

  // Logo information - use whiteLogoUrl, blackLogoUrl, or deprecated logoUrl
  const logoUrl =
    brandDesign.whiteLogoUrl || brandDesign.blackLogoUrl || brandDesign.logoUrl;
  const logoInfo = logoUrl
    ? `- Brand Logo URL: ${logoUrl}\n- IMPORTANT: The brand has a logo that should be conceptually referenced in image prompts. Describe elements that complement the logo style.`
    : "- No logo uploaded";

  let graphicStyleSummary = "";

  // Filtramos solo los assets de imagen (Marketing y Producto) que son relevantes para el estilo visual
  const relevantDescriptions = brandAssets
    .filter(
      (asset) =>
        asset.category === "product_images" ||
        asset.category === "marketing_banners",
    )
    .map((asset) => {
      // Usamos la descripción completa del asset, la cual es la clave para la síntesis de estilo.
      const desc =
        (asset as any).description || "No detailed description provided.";
      return `ASSET: ${asset.name} (Category: ${asset.category})\n  - VISUAL IDENTITY: ${desc}`;
    })
    .join("\n\n");

  if (relevantDescriptions) {
    graphicStyleSummary = `
  CRITICAL VISUAL STYLE SYNTHESIS INSTRUCTIONS:
  The following descriptions detail the unique look, feel, colors, and composition of the brand's key advertising assets. You MUST synthesize the *dominant* visual identity (specific color schemes, composition style, lighting, and mood) from these examples to generate a cohesive new image that fits the brand's overall aesthetic:

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
- Tone of Voice: Professional, Luxurious, Efficacious
- Personality: Modern, Clinical, High-End Aesthetic
- Emotional Feel: Aspirational, Trustworthy, Transformative
- Visual Keywords: Extreme Macro Focus, Wet/Glossy Skin Finish, High-Contrast Lighting, Clean Typography, Deep Maroon/Amber Accents, Textured Backgrounds (Skin/Droplets)
- Brand Promise: Delivers Measurable Results and Elevated Self-Care Experience

IMPORTANT:
All written content MUST follow the tone of voice and emotional feel described here.
All image prompts MUST reflect the visual keywords and emotional feel.

BRAND VISUAL ASSETS (use these as inspiration for content):
${assetDetails || "No assets uploaded yet"}
${graphicStyleSummary}

ASSET CATEGORIES SUMMARY:
${
  Object.entries(assetsByCategory)
    .map(([cat, items]) => `- ${cat}: ${items.join(", ")}`)
    .join("\n") || "No categorized assets"
}

AUDIENCE INSIGHTS:
- Best Posting Times (use these to suggest optimal posting times): ${bestTimes}
- Reach: ${metaInsights?.reach || "Not available"}
- Impressions: ${metaInsights?.impressions || "Not available"}
- Engagement: ${metaInsights?.engagement || "Not available"}
${
  salesInsights
    ? `
SALES DATA (use this to create content that promotes top products and drives sales):
- Total Sales: $${(salesInsights.totalSales / 100).toFixed(2)}
- Total Transactions: ${salesInsights.totalTransactions}
- Average Order Value: $${(salesInsights.averageOrderValue / 100).toFixed(2)}
- Total Customers: ${salesInsights.totalCustomers}
${
  salesInsights.topProducts && salesInsights.topProducts.length > 0
    ? `
TOP SELLING PRODUCTS (prioritize content about these):
${salesInsights.topProducts.map((p, i) => `  ${i + 1}. ${p.name} - ${p.quantity} sold, $${(p.revenue / 100).toFixed(2)} revenue`).join("\n")}
`
    : ""
}
${salesInsights.recentSalesTrend ? `- Sales Trend: ${salesInsights.recentSalesTrend}` : ""}
CONTENT STRATEGY BASED ON SALES:
- Create promotional posts featuring the top-selling products
- Highlight bestsellers and customer favorites
- Use sales data to craft compelling offers and calls-to-action
- Consider creating "limited stock" or "popular item" urgency posts for top sellers
`
    : ""
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
   - A detailed image prompt for AI image generation that:
     * Follows the brand style: ${brandDesign.brandStyle || "modern"}
     * Incorporates the brand colors: ${colorPalette}
     * **CRITICAL STYLE ADHERENCE:** Use the specific aesthetic (color composition, mood, and structural layout) synthesized from the BRAND VISUAL ASSETS descriptions provided.
     * **CRITICAL LOGO INTEGRATION:** The prompt MUST explicitly instruct the image generator to **seamlessly integrate the brand's logo or a clear, branded symbol** naturally into the scene to maintain high-quality branding without using a simple watermark overlay. **DO NOT add extra letters or alter the logo's original shape.**
     * **FONT/TEXT INSTRUCTIONS:** Any text or graphical element added to the image must use the style of the primary font: ${brandDesign.fontPrimary || "a modern sans-serif font"}. If text is required, keep it **extremely short (1-3 words) and simple** for readability.
     * Uses professional composition suitable for social media
     * References specific products or assets from the brand when relevant
5. Posts should be varied: product showcases, tips, behind-the-scenes, user engagement, trending content
6. Ensure posts follow the brand style: ${brandDesign.brandStyle || "modern and professional"}
7. **CRÍTICO:** When creating the imagePrompt, you MUST reference the **specific names** of the top-selling products or relevant visual assets from the BRAND VISUAL ASSETS and TOP SELLING PRODUCTS lists (e.g., "The image must feature the 'Classic Chronos' watch in a leather band, matching the visual style of the reference images provided."). This ensures the final image features the brand's actual catalog.
8. PLATFORM MAPPING: Use these exact platform values in the JSON:
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
): Promise<GeneratedPost[]> {
  console.log(
    `[PostGenerator] Starting post generation for brand: ${context.brandName}`,
  );

  const prompt = buildTextPrompt(context);

  try {
    // Use structured output with JSON schema for reliable parsing
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
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
        },
      },
    });

    const text = response.text || "";
    console.log("[PostGenerator] Received response from Gemini");

    const parsed = cleanAndParseJson(text);
    const posts: GeneratedPost[] = parsed.posts || [];

    console.log(`[PostGenerator] Generated ${posts.length} posts`);
    return posts;
  } catch (error) {
    console.error("[PostGenerator] Error generating posts:", error);
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

// 🔹 Helper para elegir 3 assets diferentes cada vez (con prioridad por categoría)
function pickRandomAssets(assets: BrandAssetForImage[], count = 3) {
  if (!assets || assets.length === 0) return [];

  const priority: Record<string, number> = {
    product_images: 1,
    marketing_banners: 2,
    logos: 3,
    general: 4,
    document_templates: 5,
    videos: 5,
  };

  // Ordenar por prioridad
  const sorted = [...assets].sort((a, b) => {
    const pa = priority[a.category?.toLowerCase() || "general"] || 99;
    const pb = priority[b.category?.toLowerCase() || "general"] || 99;
    return pa - pb;
  });

  // Mezclar aleatoriamente
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }

  return sorted.slice(0, count);
}

// 🔹 FUNCIÓN PRINCIPAL (con los 2 cambios que necesitas)
export async function generateImageWithNanoBanana(
  imagePrompt: string,
  brandDesign: BrandDesign,
  brandAssets?: BrandAssetForImage[],
): Promise<string | null> {
  try {
    // ==========================================================================================
    // ✔ Agregar resumen de TODAS las descripciones de assets para mejorar el estilo visual
    // ==========================================================================================
    let assetsDescriptionSummary = "";

    if (brandAssets && brandAssets.length > 0) {
      const summary = brandAssets
        .map(
          (a) =>
            `• ${a.name} (${a.category || "general"}): ${(a as any).description || ""}`,
        )
        .join("\n");

      assetsDescriptionSummary = `

### Additional brand visual context:
Below is a textual description of ALL brand assets. These describe the brand's real aesthetics, textures, lighting, colors, and visual identity. 
Use this information to match the brand's look and feel in the final generated image:

${summary}

`;
    }

    // ==========================================================================================
    // ✔ Prompt final con resúmenes incluidos (no cambia tu estructura original)
    // ==========================================================================================
    const enhancedPrompt = `${imagePrompt}. 
    BRAND ESSENCE INSTRUCTIONS:
    - Emotional feel: Aspirational, Trustworthy, Transformative
    - Visual Keywords: Extreme Macro Focus, Wet/Glossy Skin Finish, High-Contrast Lighting, Clean Typography, Deep Maroon/Amber Accents, Textured Backgrounds (Skin/Droplets)
    - Personality: Modern, Clinical, High-End Aestheti
    - Tone of Voice (interpret visually): Professional, Luxurious, Efficacious
    
    These MUST influence the image atmosphere, lighting, colors, textures, and composition.
    
    Brand Style: ${brandDesign.brandStyle || "modern and professional"} 
    Color Scheme: Primary ${brandDesign.colorPrimary}, Accents ${brandDesign.colorAccent1}, ${brandDesign.colorAccent2}
    
    REQUIREMENTS:
    - Follow the brand essence strictly
    - Match the real visual identity from the uploaded brand assets
    - Produce a professional social media image
    
    ${assetsDescriptionSummary}
    `;

    console.log("[PostGenerator] Generating image with Nano Banana...");

    // ==========================================================================================
    // ✔ Construcción de contenido multimodal (igual que antes)
    // ==========================================================================================
    const contentParts: any[] = [];

    if (brandAssets && brandAssets.length > 0) {
      // ✔ NUEVO: Usa 3 assets dinámicos, no siempre los mismos
      const assetsToUse = pickRandomAssets(brandAssets, 3);

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

      // Texto con instrucciones
      contentParts.push({
        text: `
IMPORTANT: The images above are brand assets showing the real visual identity of this brand. 
Use their lighting, textures, colors and composition hints.

Now create this image: ${enhancedPrompt}
        `,
      });
    } else {
      contentParts.push({ text: enhancedPrompt });
    }

    // ==========================================================================================
    // ✔ Llamada a Gemini EXACTAMENTE como tú la tenías
    // ==========================================================================================
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

    // Fetch sales insights from Lightspeed if connected
    let salesInsights: SalesInsights | undefined;
    try {
      const { lightspeedService } = await import("./lightspeed");
      const lightspeedIntegration =
        await lightspeedService.getIntegrationByBrand(brandId);

      if (lightspeedIntegration) {
        console.log(
          `[PostGenerator] Fetching sales insights from Lightspeed for brand ${brandId}`,
        );
        const stats = await lightspeedService.getSalesStats(
          lightspeedIntegration.id,
        );
        const sales = await lightspeedService.getSales(
          lightspeedIntegration.id,
          100,
        );

        // Calculate top products from sales data
        const productSales = new Map<
          string,
          { quantity: number; revenue: number }
        >();
        for (const sale of sales) {
          const items = sale.items as any[];
          if (items && Array.isArray(items)) {
            for (const item of items) {
              const key = item.name || "Unknown Product";
              const existing = productSales.get(key) || {
                quantity: 0,
                revenue: 0,
              };
              productSales.set(key, {
                quantity: existing.quantity + (item.quantity || 1),
                revenue:
                  existing.revenue +
                  (item.price || 0) * (item.quantity || 1) * 100,
              });
            }
          }
        }

        const topProducts = Array.from(productSales.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        salesInsights = {
          totalSales: stats.totalSales,
          totalTransactions: stats.totalTransactions,
          averageOrderValue: stats.averageOrderValue,
          totalCustomers: stats.totalCustomers,
          topProducts: topProducts.length > 0 ? topProducts : undefined,
        };

        console.log(
          `[PostGenerator] Loaded sales insights: ${stats.totalTransactions} transactions, ${topProducts.length} top products`,
        );
      }
    } catch (error) {
      console.log(
        `[PostGenerator] No Lightspeed integration found or error fetching sales: ${error}`,
      );
    }

    const context: PostGenerationContext = {
      brandId,
      brandName: brand.name,
      brandDescription: brand.description || undefined,
      brandDesign,
      brandAssets,
      metaInsights: metaInsights || undefined,
      salesInsights,
      month,
      year,
      connectedPlatforms: scheduledPlatforms,
      postingSchedule,
    };

    const allPosts = await generatePostsWithGemini(context);

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

    const posts = allPosts.filter((post) => {
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
      let imageUrl: string | null = null;

      try {
        const generatedImage = await generateImageWithNanoBanana(
          post.imagePrompt,
          brandDesign,
          assetsForImageGen,
        );

        if (generatedImage) {
          // Use the generated image directly without watermark
          imageUrl = generatedImage;
        }
      } catch (imgError) {
        console.warn(
          `[PostGenerator] Could not generate image for post: ${post.titulo}`,
          imgError,
        );
      }

      await createAiGeneratedPost({
        jobId,
        brandId,
        platform: post.platform,
        titulo: post.titulo,
        content: post.content,
        imageUrl,
        cloudinaryPublicId: null,
        dia: post.dia,
        hashtags: post.hashtags,
        status: "pending",
      });
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
