import { GoogleGenAI, Modality, Type } from "@google/genai";
import { storage } from "../storage";
import type { BrandDesign, BrandAsset, Integration } from "@shared/schema";

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

export interface PostGenerationContext {
  brandId: string;
  brandName: string;
  brandDescription?: string;
  brandDesign: BrandDesign;
  brandAssets: BrandAsset[];
  metaInsights?: MetaInsights;
  month: number;
  year: number;
  postsToGenerate?: number;
}

async function fetchMetaInsights(
  integration: Integration
): Promise<MetaInsights | null> {
  try {
    const accessToken = integration.accessToken;
    const accountId = integration.accountId;

    if (!accessToken || !accountId) {
      console.log("[PostGenerator] No access token or account ID for insights");
      return null;
    }

    const insights: MetaInsights = {};

    if (integration.provider === "instagram_direct" || integration.provider === "instagram") {
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

function buildTextPrompt(context: PostGenerationContext): string {
  const { brandName, brandDescription, brandDesign, brandAssets, metaInsights, month, year, postsToGenerate = 15 } = context;

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
  
  const colorPalette = [
    brandDesign.colorPrimary,
    brandDesign.colorAccent1,
    brandDesign.colorAccent2,
    brandDesign.colorAccent3,
    brandDesign.colorAccent4,
  ].filter(Boolean).join(", ");

  const assetCategories = brandAssets.reduce((acc, asset) => {
    const cat = asset.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(asset.name);
    return acc;
  }, {} as Record<string, string[]>);

  const bestTimes = metaInsights?.bestPostingTimes?.join(", ") || "9:00 AM, 12:00 PM, 6:00 PM";

  return `You are an expert social media strategist and content creator. Generate a comprehensive content calendar for ${monthName} ${year}.

BRAND CONTEXT:
- Brand Name: ${brandName}
- Description: ${brandDescription || "Not specified"}
- Brand Style: ${brandDesign.brandStyle || "modern"}
- Color Palette: ${colorPalette}
- Primary Font: ${brandDesign.fontPrimary || "Not specified"}
- Secondary Font: ${brandDesign.fontSecondary || "Not specified"}

BRAND ASSETS AVAILABLE:
${Object.entries(assetCategories).map(([cat, items]) => `- ${cat}: ${items.join(", ")}`).join("\n")}

AUDIENCE INSIGHTS:
- Best Posting Times: ${bestTimes}
- Reach: ${metaInsights?.reach || "Not available"}
- Impressions: ${metaInsights?.impressions || "Not available"}
- Engagement: ${metaInsights?.engagement || "Not available"}

REQUIREMENTS:
1. Generate exactly ${postsToGenerate} posts for ${monthName} ${year}
2. Distribute posts across: Instagram (posts, reels, stories), Facebook, TikTok
3. Each post must include:
   - A catchy title/hook (titulo)
   - Full post caption/content with emojis
   - Relevant hashtags (5-10 per post)
   - Optimal posting time based on insights
   - A detailed image prompt for AI image generation that incorporates the brand colors and style
4. Posts should be varied: product showcases, tips, behind-the-scenes, user engagement, trending content
5. Ensure posts follow the brand style: ${brandDesign.brandStyle || "modern and professional"}

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "posts": [
    {
      "platform": "instagram",
      "titulo": "Eye-catching hook or title",
      "content": "Full caption with emojis and call to action...",
      "hashtags": "#brand #hashtag1 #hashtag2",
      "dia": "${year}-${String(month).padStart(2, '0')}-01",
      "optimalTime": "6:00 PM",
      "imagePrompt": "Detailed description for image generation incorporating brand colors ${colorPalette} and ${brandDesign.brandStyle || 'modern'} style..."
    }
  ]
}`;
}

// Helper function to clean and parse JSON from LLM response
function cleanAndParseJson(text: string): any {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Continue to cleanup
  }

  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  // Fix common JSON issues
  cleaned = cleaned
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
    .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
    .replace(/\n/g, ' ')  // Replace newlines with spaces
    .replace(/\r/g, '')  // Remove carriage returns
    .replace(/\t/g, ' '); // Replace tabs with spaces
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[PostGenerator] JSON cleanup failed, trying array extraction");
    
    // Try to extract just the posts array
    const arrayMatch = cleaned.match(/"posts"\s*:\s*\[([\s\S]*?)\]/);
    if (arrayMatch) {
      try {
        const posts = JSON.parse(`[${arrayMatch[1]}]`);
        return { posts };
      } catch (e2) {
        // Last resort: try to extract individual post objects
        const postRegex = /\{[^{}]*"platform"[^{}]*"titulo"[^{}]*\}/g;
        const posts = [];
        let match;
        while ((match = postRegex.exec(cleaned)) !== null) {
          try {
            posts.push(JSON.parse(match[0]));
          } catch (e3) {
            // Skip malformed posts
          }
        }
        if (posts.length > 0) {
          return { posts };
        }
      }
    }
    
    throw new Error("Could not parse JSON from Gemini response after cleanup attempts");
  }
}

export async function generatePostsWithGemini(
  context: PostGenerationContext
): Promise<GeneratedPost[]> {
  console.log(`[PostGenerator] Starting post generation for brand: ${context.brandName}`);
  
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
                required: ["platform", "titulo", "content", "hashtags", "dia", "optimalTime", "imagePrompt"],
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

export async function generateImageWithNanoBanana(
  imagePrompt: string,
  brandDesign: BrandDesign
): Promise<string | null> {
  try {
    const enhancedPrompt = `${imagePrompt}. 
Style: ${brandDesign.brandStyle || 'modern and professional'}. 
Color scheme: Use these brand colors - Primary: ${brandDesign.colorPrimary || '#4F46E5'}, 
Accent: ${brandDesign.colorAccent1 || '#7C3AED'}. 
High quality, professional social media post image, clean composition, vibrant colors.`;

    console.log("[PostGenerator] Generating image with Nano Banana...");
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: enhancedPrompt,
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

export async function processPostGeneration(
  brandId: string,
  jobId: string,
  month: number,
  year: number
): Promise<void> {
  const { updatePostGeneratorJob } = await import("../storage/postGeneratorJobs");
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
      throw new Error("Brand design not found. Please create your brand design first.");
    }

    const brandAssets = await storage.getAssetsByBrandId(brandId);

    const integrations = await storage.getIntegrationsByBrandId(brandId);
    const metaIntegration = integrations.find(
      (int) => 
        int.provider === "instagram_direct" || 
        int.provider === "instagram" || 
        int.provider === "facebook"
    );

    if (!metaIntegration) {
      throw new Error("No Instagram or Facebook integration found. Please connect your social accounts first.");
    }

    const metaInsights = await fetchMetaInsights(metaIntegration);

    const context: PostGenerationContext = {
      brandId,
      brandName: brand.name,
      brandDescription: brand.description || undefined,
      brandDesign,
      brandAssets,
      metaInsights: metaInsights || undefined,
      month,
      year,
      postsToGenerate: 15,
    };

    const posts = await generatePostsWithGemini(context);

    console.log(`[PostGenerator] Saving ${posts.length} posts to database`);
    
    for (const post of posts) {
      let imageUrl: string | null = null;
      
      try {
        imageUrl = await generateImageWithNanoBanana(post.imagePrompt, brandDesign);
      } catch (imgError) {
        console.warn(`[PostGenerator] Could not generate image for post: ${post.titulo}`, imgError);
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
  brandId: string
): Promise<{ valid: boolean; message?: string }> {
  const brandDesign = await storage.getBrandDesignByBrandId(brandId);
  if (!brandDesign) {
    return {
      valid: false,
      message: "Please create your brand design in Brand Studio before generating posts.",
    };
  }

  const integrations = await storage.getIntegrationsByBrandId(brandId);
  const hasMetaIntegration = integrations.some(
    (int) =>
      int.provider === "instagram_direct" ||
      int.provider === "instagram" ||
      int.provider === "facebook"
  );

  if (!hasMetaIntegration) {
    return {
      valid: false,
      message: "Please connect your Instagram or Facebook account before generating posts.",
    };
  }

  return { valid: true };
}
