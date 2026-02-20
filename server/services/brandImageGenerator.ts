import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import cloudinary from "../cloudinary";
import crypto from "crypto";
import { db } from "../db";
import { brandAssets } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface BrandAssetForImage {
  url: string;
  name: string;
  category?: string;
  description?: string;
  assetType?: string;
}

export interface GeneratedImageResult {
  id: string;
  imageUrl: string;
  cloudinaryUrl: string;
  publicId: string;
  prompt: string;
  variant: number;
  hash: string;
  variationHint: string;
}

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`[BrandImageGen] Failed to fetch image from ${url}: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    return { data: base64, mimeType };
  } catch (error) {
    console.error(`[BrandImageGen] Error fetching image from ${url}:`, error);
    return null;
  }
}

function sha256(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

const assetUsageCache = new Map<string, Record<string, number>>();
const categoryUsageCache = new Map<string, Record<string, number>>();

function pickVisualAssetsBalanced(
  assets: BrandAssetForImage[],
  maxCount: number,
  brandId: string,
): BrandAssetForImage[] {
  const imageAssets = assets.filter(
    (a) => !a.assetType || a.assetType === "image"
  );
  if (imageAssets.length === 0) return [];

  const categoryGroups: Record<string, BrandAssetForImage[]> = {};
  const uncategorized: BrandAssetForImage[] = [];

  for (const asset of imageAssets) {
    const cat = (asset.category || "").toLowerCase();
    if (cat === "ai-generated" || cat === "ai-rejected") continue;
    if (!cat) {
      uncategorized.push(asset);
      continue;
    }
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(asset);
  }

  if (!assetUsageCache.has(brandId)) assetUsageCache.set(brandId, {});
  if (!categoryUsageCache.has(brandId)) categoryUsageCache.set(brandId, {});
  const usageTracker = assetUsageCache.get(brandId)!;
  const catTracker = categoryUsageCache.get(brandId)!;

  const allEligible = [...Object.values(categoryGroups).flat(), ...uncategorized];
  allEligible.forEach((a) => {
    if (!(a.url in usageTracker)) usageTracker[a.url] = 0;
  });

  const priorityOrder = [
    "products", "product", "product_images",
    "location", "location_images", "location_assets", "place",
    "inspiration_templates", "inspiration",
  ];

  const selected: BrandAssetForImage[] = [];
  const categories = Object.keys(categoryGroups);

  const sortedCategories = categories.sort((a, b) => {
    const prioA = priorityOrder.indexOf(a);
    const prioB = priorityOrder.indexOf(b);
    const effectiveA = prioA === -1 ? 100 : prioA;
    const effectiveB = prioB === -1 ? 100 : prioB;
    if (effectiveA !== effectiveB) return effectiveA - effectiveB;
    return (catTracker[a] || 0) - (catTracker[b] || 0);
  });

  for (const cat of sortedCategories) {
    if (selected.length >= maxCount) break;
    const catAssets = categoryGroups[cat];
    const sorted = catAssets
      .filter((a) => !selected.includes(a))
      .sort((a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0));

    const toTake = Math.min(
      Math.ceil(maxCount / Math.max(sortedCategories.length, 1)),
      sorted.length,
      maxCount - selected.length,
    );

    for (let i = 0; i < toTake; i++) {
      selected.push(sorted[i]);
      usageTracker[sorted[i].url] = (usageTracker[sorted[i].url] || 0) + 1;
    }
    catTracker[cat] = (catTracker[cat] || 0) + 1;
  }

  if (selected.length < maxCount && uncategorized.length > 0) {
    const remaining = uncategorized
      .filter((a) => !selected.includes(a))
      .sort((a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0));
    const toTake = Math.min(remaining.length, maxCount - selected.length);
    for (let i = 0; i < toTake; i++) {
      selected.push(remaining[i]);
    }
  }

  console.log(`[BrandImageGen] Selected ${selected.length} reference assets from ${categories.length} categories (${imageAssets.length} total available)`);
  return selected.slice(0, maxCount);
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    en: "English", es: "Spanish", pt: "Portuguese", fr: "French",
    de: "German", it: "Italian", zh: "Chinese", ja: "Japanese",
    ko: "Korean", ar: "Arabic", hi: "Hindi",
  };
  return map[lang] || "English";
}

function buildVariationHints(count: number): string[] {
  const hints = [
    "Close-up product hero shot with cinematic lighting, shallow depth of field, and a luxurious surface texture. Shot at golden hour warmth.",
    "Wide environmental lifestyle shot showing the brand in context — real setting, natural light, aspirational atmosphere. Think editorial spread.",
    "Overhead flat-lay with meticulous arrangement, clean negative space, and complementary props that reinforce the brand story.",
    "Bold side-lit composition with dramatic shadows, high contrast, and a moody editorial feel. Magazine cover energy.",
    "Candid lifestyle moment — authentic action, natural movement, human connection. Documentary-style but polished.",
    "Ultra-minimalist centered composition with generous whitespace, single focal point, and soft diffused lighting. Apple-level clean.",
    "Rich textural close-up — fabric, material, ingredient detail. Macro-style with beautiful bokeh and tactile quality.",
    "Dynamic diagonal composition with leading lines, layered depth, and energetic visual flow. Modern and bold.",
  ];

  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    selected.push(hints[i % hints.length]);
  }
  return selected;
}

async function getApprovalHistory(brandId: string): Promise<{
  approvedDescriptions: string[];
  rejectedDescriptions: string[];
  approvedCount: number;
  rejectedCount: number;
}> {
  try {
    const design = await storage.getBrandDesignByBrandId(brandId);
    if (!design) return { approvedDescriptions: [], rejectedDescriptions: [], approvedCount: 0, rejectedCount: 0 };

    const allGenerated = await db
      .select()
      .from(brandAssets)
      .where(
        and(
          eq(brandAssets.brandDesignId, design.id),
          eq(brandAssets.assetType, "image"),
        )
      )
      .orderBy(desc(brandAssets.createdAt));

    const approved = allGenerated.filter((a) => a.category === "ai-generated");
    const rejected = allGenerated.filter((a) => a.category === "ai-rejected");

    const approvedDescriptions = approved
      .slice(0, 8)
      .map((a) => a.description || a.name)
      .filter(Boolean);

    const rejectedDescriptions = rejected
      .slice(0, 5)
      .map((a) => a.description || a.name)
      .filter(Boolean);

    console.log(`[BrandImageGen] History: ${approved.length} approved, ${rejected.length} rejected`);

    return {
      approvedDescriptions,
      rejectedDescriptions,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
    };
  } catch (error) {
    console.error(`[BrandImageGen] Error fetching approval history:`, error);
    return { approvedDescriptions: [], rejectedDescriptions: [], approvedCount: 0, rejectedCount: 0 };
  }
}

function buildHistoryContext(history: Awaited<ReturnType<typeof getApprovalHistory>>): string {
  const lines: string[] = [];

  if (history.approvedCount > 0) {
    lines.push(`\n## LEARNING FROM PAST APPROVALS (${history.approvedCount} images approved by user)`);
    lines.push("The user has previously APPROVED images with these characteristics — create more like these:");
    history.approvedDescriptions.forEach((d, i) => {
      lines.push(`  ${i + 1}. ${d}`);
    });
  }

  if (history.rejectedCount > 0) {
    lines.push(`\n## AVOID THESE PATTERNS (${history.rejectedCount} images rejected by user)`);
    lines.push("The user has previously REJECTED images with these characteristics — do NOT repeat these styles:");
    history.rejectedDescriptions.forEach((d, i) => {
      lines.push(`  ${i + 1}. ${d}`);
    });
  }

  return lines.join("\n");
}

export async function generateBrandImages(
  brandId: string,
  count: number = 6,
): Promise<{ images: GeneratedImageResult[]; errors: string[] }> {
  console.log(`[BrandImageGen] Starting generation of ${count} images for brand ${brandId}`);

  const brand = await storage.getBrandByIdOnly(brandId);
  if (!brand) throw new Error("Brand not found");

  const brandDesign = await storage.getBrandDesignByBrandId(brandId);
  if (!brandDesign) throw new Error("Brand design not found. Please set up your brand design first.");

  const allAssets = await storage.getAssetsByBrandId(brandId);
  const imageAssets = (allAssets || []).filter(
    (a: any) => !a.assetType || a.assetType === "image"
  );

  const history = await getApprovalHistory(brandId);
  const historyContext = buildHistoryContext(history);

  const preferredLanguage = (brandDesign as any).preferredLanguage || brand.preferredLanguage || "en";
  const languageLabel = getLanguageLabel(preferredLanguage);

  const primaryColor = brandDesign.colorPrimary || "#000000";
  const accent1 = brandDesign.colorAccent1 || "";
  const accent2 = brandDesign.colorAccent2 || "";
  const fontPrimary = brandDesign.fontPrimary || "";
  const brandStyle = brandDesign.brandStyle || "minimalist";
  const brandDescription = (brandDesign as any).brandDescription || brand.description || "";

  let logoBase64: { data: string; mimeType: string } | null = null;
  if (brandDesign.logoUrl) {
    logoBase64 = await fetchImageAsBase64(brandDesign.logoUrl);
    if (logoBase64) {
      console.log(`[BrandImageGen] Logo loaded successfully`);
    }
  }

  const systemInstruction = `You are a world-class creative director and visual artist specializing in luxury brand imagery for social media.

YOUR MANDATE: Create images that look like they belong in a high-end advertising campaign — NOT stock photos, NOT amateur content, NOT AI-generated looking. Every image MUST include brand-related copy/text that enhances the message.

## PROFESSIONAL QUALITY STANDARDS
- Photorealistic quality with cinematic lighting (golden hour, Rembrandt, split lighting)
- Rich color grading that matches the brand palette without being garish
- Professional composition following rule of thirds, leading lines, or centered symmetry
- Depth of field that creates visual hierarchy — sharp subject, soft background
- Natural textures and materials that feel tactile and premium
- NO watermarks, NO stock photo overlays, NO generic template layouts
- If a logo is provided, reproduce it clearly and legibly in the image

## BRAND COPY & TEXT REQUIREMENTS (CRITICAL)
Every generated image MUST include brand-related text/copy embedded beautifully into the design:
- Include the BRAND NAME prominently and legibly in every image
- Add a short, catchy tagline, slogan, or promotional phrase relevant to the brand's industry and offerings
- Text ideas: special offers ("20% OFF"), calls to action ("Shop Now", "Book Today"), value propositions ("Premium Quality"), seasonal messages, motivational quotes related to the industry
- Text must be CLEAR, READABLE, and properly spelled — no garbled or distorted letters
- Use elegant, modern typography that matches the brand style
- Text should be integrated into the composition — overlaid on clean areas, inside design elements, or as part of the visual hierarchy
- Use the brand's color palette for text — primary color for headlines, accent colors for secondary text
- Ensure sufficient contrast between text and background for readability
- Text placement should follow professional graphic design principles — balanced, aligned, purposeful

## BRAND COHESION
- Every image must feel like it belongs to the same visual campaign
- Maintain consistent color temperature and mood
- The brand's color palette should influence the environment, props, lighting, AND text styling
- Think "brand world" — create a universe the brand lives in, with consistent messaging

## SOCIAL MEDIA OPTIMIZATION
- Images must command attention in a fast-scrolling feed
- The copy/text should enhance the scroll-stopping power of the image
- Strong visual hooks in the first glance — the text should contribute to this
- Clean enough to work at small mobile sizes — text must be large enough to read on mobile
- Aspirational but authentic — real-world plausibility with professional messaging`;

  const results: GeneratedImageResult[] = [];
  const errors: string[] = [];
  const seenHashes = new Set<string>();
  const variationHints = buildVariationHints(count);

  const maxRefAssets = Math.min(6, imageAssets.length);

  assetUsageCache.delete(brandId);
  categoryUsageCache.delete(brandId);

  for (let v = 0; v < count; v++) {
    try {
      const referenceAssets = pickVisualAssetsBalanced(
        imageAssets as BrandAssetForImage[],
        maxRefAssets,
        brandId,
      );

      const contentParts: any[] = [];
      const assetLabels: string[] = [];
      let imageIndex = 1;

      if (logoBase64) {
        contentParts.push({
          inlineData: {
            data: logoBase64.data,
            mimeType: logoBase64.mimeType,
          },
        });
        assetLabels.push(`Image ${imageIndex}: Brand logo — reproduce it clearly and legibly in the design, placed naturally within the composition`);
        imageIndex++;
      }

      for (const asset of referenceAssets) {
        const imageData = await fetchImageAsBase64(asset.url);
        if (imageData) {
          contentParts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType,
            },
          });
          const categoryLabel = asset.category ? ` [${asset.category}]` : "";
          const descLabel = asset.description ? `: ${asset.description.slice(0, 60)}` : "";
          assetLabels.push(`Image ${imageIndex}: ${asset.name}${categoryLabel}${descLabel}`);
          imageIndex++;
        }
      }

      const variationHint = variationHints[v];

      const userPrompt = `Create a premium social media image for this brand:

## BRAND IDENTITY
- Name: "${brand.name}" (MUST appear prominently in the image)
- Description: ${brandDescription}
- Industry: ${brand.industry || "lifestyle"}
- Visual Style: ${brandStyle}
- Color Palette: Primary ${primaryColor}${accent1 ? `, Accent ${accent1}` : ""}${accent2 ? `, Secondary ${accent2}` : ""}
${fontPrimary ? `- Typography: ${fontPrimary}` : ""}

## REFERENCE IMAGES PROVIDED (${contentParts.length} images above)
${assetLabels.join("\n")}

Study these reference images carefully. Match their:
- Lighting quality and color temperature
- Material textures and surface finishes
- Overall mood and atmosphere
- Level of sophistication and production value
Create something NEW that feels like it belongs in the SAME visual world.

## COPY/TEXT TO INCLUDE IN THE IMAGE (REQUIRED)
The image MUST contain these text elements:
1. The brand name "${brand.name}" — large, clear, and prominent
2. A short compelling tagline or promotional phrase related to the brand (create one that fits the industry and brand description)
3. Optional: a call-to-action phrase or additional detail
Make the text beautiful — use elegant typography, ensure perfect spelling, and integrate it naturally into the composition. Text should use the brand's color palette and be fully readable at mobile sizes.

## THIS VARIATION'S DIRECTION
${variationHint}
${historyContext}

## LANGUAGE REQUIREMENT
ALL visible text/copy in the image MUST be in ${languageLabel}.

Generate a single, stunning, scroll-stopping social media image with clear, professional brand copy.`;

      console.log(`[BrandImageGen] Generating variation ${v + 1}/${count} with ${contentParts.length} reference images...`);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{
          role: "user",
          parts: [...contentParts, { text: userPrompt }],
        }],
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          systemInstruction: [{ text: systemInstruction }],
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      const candidates = response.candidates || [];
      let imageFound = false;

      for (const candidate of candidates) {
        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const imageBuffer = Buffer.from(part.inlineData.data, "base64");
            const hash = sha256(imageBuffer);

            if (seenHashes.has(hash)) {
              console.log(`[BrandImageGen] Skipping duplicate image (hash: ${hash.slice(0, 8)})`);
              continue;
            }
            seenHashes.add(hash);

            const dataUri = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
            const folder = `brands/${brandId}/generated/${new Date().toISOString().slice(0, 10)}`;
            const publicIdValue = `gen_v${v + 1}_${hash.slice(0, 8)}`;

            const uploadRes = await cloudinary.uploader.upload(dataUri, {
              folder,
              public_id: publicIdValue,
              overwrite: false,
            });

            results.push({
              id: `${brandId}_v${v + 1}_${hash.slice(0, 8)}`,
              imageUrl: uploadRes.secure_url,
              cloudinaryUrl: uploadRes.secure_url,
              publicId: uploadRes.public_id,
              prompt: variationHint,
              variant: v + 1,
              hash,
              variationHint,
            });

            imageFound = true;
            console.log(`[BrandImageGen] Variation ${v + 1} generated and uploaded successfully`);
            break;
          }
        }
        if (imageFound) break;
      }

      if (!imageFound) {
        const textResponse = candidates[0]?.content?.parts?.find((p: any) => p.text)?.text;
        errors.push(`Variation ${v + 1}: No image generated. ${textResponse ? `Model said: ${textResponse.slice(0, 100)}` : ""}`);
        console.log(`[BrandImageGen] Variation ${v + 1} did not produce an image`);
      }

      if (v < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (error: any) {
      console.error(`[BrandImageGen] Error generating variation ${v + 1}:`, error);
      errors.push(`Variation ${v + 1}: ${error.message || "Unknown error"}`);
    }
  }

  console.log(`[BrandImageGen] Complete. Generated ${results.length}/${count} images. Errors: ${errors.length}`);
  return { images: results, errors };
}
