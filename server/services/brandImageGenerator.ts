import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import cloudinary from "../cloudinary";
import crypto from "crypto";
import sharp from "sharp";
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
      console.log(
        `[BrandImageGen] Failed to fetch image from ${url}: ${response.status}`,
      );
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

async function overlayLogoOnImage(
  imageBuffer: Buffer,
  logoUrl: string,
  options: {
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    opacity?: number;
    scale?: number;
    padding?: number;
  } = {},
): Promise<Buffer> {
  const {
    position = "bottom-right",
    opacity = 0.85,
    scale = 0.18,
    padding = 25,
  } = options;

  try {
    const logoResponse = await fetch(logoUrl);
    if (!logoResponse.ok) {
      console.log(
        `[BrandImageGen] Logo overlay: failed to fetch logo (${logoResponse.status})`,
      );
      return imageBuffer;
    }
    const logoArrayBuffer = await logoResponse.arrayBuffer();
    const logoBuffer = Buffer.from(logoArrayBuffer);

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
      .composite([
        {
          input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
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

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: resizedLogo,
          left: Math.max(0, left),
          top: Math.max(0, top),
        },
      ])
      .toBuffer();

    console.log(
      `[BrandImageGen] ✅ Logo watermark applied (${position}, ${logoSize}px, ${Math.round(opacity * 100)}% opacity)`,
    );
    return result;
  } catch (error) {
    console.error(`[BrandImageGen] Logo overlay error:`, error);
    return imageBuffer;
  }
}

const assetUsageCache = new Map<string, Record<string, number>>();
const categoryUsageCache = new Map<string, Record<string, number>>();

function pickVisualAssetsBalanced(
  assets: BrandAssetForImage[],
  maxCount: number,
  brandId: string,
): BrandAssetForImage[] {
  const imageAssets = assets.filter(
    (a) => !a.assetType || a.assetType === "image",
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

  const allEligible = [
    ...Object.values(categoryGroups).flat(),
    ...uncategorized,
  ];
  allEligible.forEach((a) => {
    if (!(a.url in usageTracker)) usageTracker[a.url] = 0;
  });

  const selected: BrandAssetForImage[] = [];
  const selectionLog: Record<string, number> = {};

  const socialMediaPosts = categoryGroups["social_media_posts"] || [];
  const hasSocialMedia = socialMediaPosts.length > 0;

  if (hasSocialMedia) {
    const socialSlots = Math.min(
      Math.ceil(maxCount * 0.6),
      socialMediaPosts.length,
    );
    const sorted = [...socialMediaPosts].sort(
      (a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0),
    );
    for (let i = 0; i < socialSlots; i++) {
      selected.push(sorted[i]);
      usageTracker[sorted[i].url] = (usageTracker[sorted[i].url] || 0) + 1;
    }
    selectionLog["social_media_posts"] = socialSlots;
    catTracker["social_media_posts"] = (catTracker["social_media_posts"] || 0) + 1;
  }

  const otherCategories = Object.keys(categoryGroups)
    .filter((cat) => cat !== "social_media_posts")
    .sort((a, b) => {
      const prioOrder = [
        "products", "product", "product_images",
        "location", "location_images", "location_assets", "place",
        "inspiration_templates", "inspiration",
      ];
      const prioA = prioOrder.indexOf(a);
      const prioB = prioOrder.indexOf(b);
      const effectiveA = prioA === -1 ? 100 : prioA;
      const effectiveB = prioB === -1 ? 100 : prioB;
      if (effectiveA !== effectiveB) return effectiveA - effectiveB;
      return (catTracker[a] || 0) - (catTracker[b] || 0);
    });

  const remainingSlots = maxCount - selected.length;
  if (remainingSlots > 0 && otherCategories.length > 0) {
    const slotsPerCat = Math.max(1, Math.ceil(remainingSlots / otherCategories.length));
    for (const cat of otherCategories) {
      if (selected.length >= maxCount) break;
      const catAssets = categoryGroups[cat];
      const sorted = catAssets
        .filter((a) => !selected.includes(a))
        .sort((a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0));
      const toTake = Math.min(slotsPerCat, sorted.length, maxCount - selected.length);
      for (let i = 0; i < toTake; i++) {
        selected.push(sorted[i]);
        usageTracker[sorted[i].url] = (usageTracker[sorted[i].url] || 0) + 1;
      }
      if (toTake > 0) {
        selectionLog[cat] = toTake;
        catTracker[cat] = (catTracker[cat] || 0) + 1;
      }
    }
  }

  if (selected.length < maxCount && uncategorized.length > 0) {
    const remaining = uncategorized
      .filter((a) => !selected.includes(a))
      .sort((a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0));
    const toTake = Math.min(remaining.length, maxCount - selected.length);
    for (let i = 0; i < toTake; i++) {
      selected.push(remaining[i]);
    }
    if (toTake > 0) selectionLog["uncategorized"] = toTake;
  }

  const breakdown = Object.entries(selectionLog)
    .map(([cat, count]) => `${cat}=${count}`)
    .join(", ");
  console.log(
    `[BrandImageGen] Selected ${selected.length}/${maxCount} reference assets — breakdown: { ${breakdown} } (${imageAssets.length} total available across ${Object.keys(categoryGroups).length} categories)`,
  );

  return selected.slice(0, maxCount);
}

function getCategoryContext(category: string): string {
  switch (category) {
    case "social_media_posts":
      return "📱 REAL SOCIAL MEDIA POST from this brand — This is an actual post published by the brand. Study its EXACT visual style: composition, color grading, typography style, layout, mood, and overall aesthetic. Your generated image must feel like it was created by the same designer/brand";
    case "product_images":
    case "products":
    case "product":
      return "🛍️ BRAND PRODUCT PHOTO — Study the specific product, its packaging, textures, and how it's presented. Use this product's visual identity in your generation";
    case "location_images":
    case "location":
    case "location_assets":
    case "place":
      return "📍 BRAND LOCATION PHOTO — Study the physical space, its ambiance, lighting, and decor style. Use this environment's feel in your generation";
    case "inspiration_templates":
    case "inspiration":
      return "🎨 BRAND INSPIRATION/TEMPLATE — Study the design style, layout patterns, color usage, and typography choices. Use these design principles in your generation";
    default:
      return "📸 BRAND REFERENCE IMAGE — Study its visual style and use it as inspiration";
  }
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    en: "English",
    es: "Spanish",
    pt: "Portuguese",
    fr: "French",
    de: "German",
    it: "Italian",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
    hi: "Hindi",
  };
  return map[lang] || "English";
}

interface VariationHint {
  direction: string;
  includeText: boolean;
}

function buildVariationHints(count: number): VariationHint[] {
  const hints: VariationHint[] = [
    {
      direction:
        "Close-up product hero shot with cinematic lighting, shallow depth of field, and a luxurious surface texture. Shot at golden hour warmth.",
      includeText: true,
    },
    {
      direction:
        "Wide environmental lifestyle shot showing the brand in context — real setting, natural light, aspirational atmosphere. Think editorial spread.",
      includeText: false,
    },
    {
      direction:
        "Overhead flat-lay with meticulous arrangement, clean negative space, and complementary props that reinforce the brand story.",
      includeText: true,
    },
    {
      direction:
        "Bold side-lit composition with dramatic shadows, high contrast, and a moody editorial feel. Magazine cover energy.",
      includeText: false,
    },
    {
      direction:
        "Candid lifestyle moment — authentic action, natural movement, human connection. Documentary-style but polished.",
      includeText: false,
    },
    {
      direction:
        "Ultra-minimalist centered composition with generous whitespace, single focal point, and soft diffused lighting. Apple-level clean.",
      includeText: true,
    },
    {
      direction:
        "Rich textural close-up — fabric, material, ingredient detail. Macro-style with beautiful bokeh and tactile quality.",
      includeText: false,
    },
    {
      direction:
        "Dynamic diagonal composition with leading lines, layered depth, and energetic visual flow. Modern and bold.",
      includeText: true,
    },
  ];

  const selected: VariationHint[] = [];
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
    if (!design)
      return {
        approvedDescriptions: [],
        rejectedDescriptions: [],
        approvedCount: 0,
        rejectedCount: 0,
      };

    const allGenerated = await db
      .select()
      .from(brandAssets)
      .where(
        and(
          eq(brandAssets.brandDesignId, design.id),
          eq(brandAssets.assetType, "image"),
        ),
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

    console.log(
      `[BrandImageGen] History: ${approved.length} approved, ${rejected.length} rejected`,
    );

    return {
      approvedDescriptions,
      rejectedDescriptions,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
    };
  } catch (error) {
    console.error(`[BrandImageGen] Error fetching approval history:`, error);
    return {
      approvedDescriptions: [],
      rejectedDescriptions: [],
      approvedCount: 0,
      rejectedCount: 0,
    };
  }
}

function buildHistoryContext(
  history: Awaited<ReturnType<typeof getApprovalHistory>>,
): string {
  const lines: string[] = [];

  if (history.approvedCount > 0) {
    lines.push(
      `\n## LEARNING FROM PAST APPROVALS (${history.approvedCount} images approved by user)`,
    );
    lines.push(
      "The user has previously APPROVED images with these characteristics — create more like these:",
    );
    history.approvedDescriptions.forEach((d, i) => {
      lines.push(`  ${i + 1}. ${d}`);
    });
  }

  if (history.rejectedCount > 0) {
    lines.push(
      `\n## AVOID THESE PATTERNS (${history.rejectedCount} images rejected by user)`,
    );
    lines.push(
      "The user has previously REJECTED images with these characteristics — do NOT repeat these styles:",
    );
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
  console.log(
    `[BrandImageGen] Starting generation of ${count} images for brand ${brandId}`,
  );

  const brand = await storage.getBrandByIdOnly(brandId);
  if (!brand) throw new Error("Brand not found");

  const brandDesign = await storage.getBrandDesignByBrandId(brandId);
  if (!brandDesign)
    throw new Error(
      "Brand design not found. Please set up your brand design first.",
    );

  const allAssets = await storage.getAssetsByBrandId(brandId);
  const imageAssets = (allAssets || []).filter(
    (a: any) => !a.assetType || a.assetType === "image",
  );

  const history = await getApprovalHistory(brandId);
  const historyContext = buildHistoryContext(history);

  const preferredLanguage =
    (brandDesign as any).preferredLanguage || brand.preferredLanguage || "en";
  const languageLabel = getLanguageLabel(preferredLanguage);

  const primaryColor = brandDesign.colorPrimary || "#000000";
  const accent1 = brandDesign.colorAccent1 || "";
  const accent2 = brandDesign.colorAccent2 || "";
  const fontPrimary = brandDesign.fontPrimary || "";
  const brandStyle = brandDesign.brandStyle || "minimalist";
  const brandDescription =
    (brandDesign as any).brandDescription || brand.description || "";

  console.log(
    `[BrandImageGen] Logo fields — logoUrl: ${brandDesign.logoUrl || "null"}, whiteLogoUrl: ${brandDesign.whiteLogoUrl || "null"}, blackLogoUrl: ${brandDesign.blackLogoUrl || "null"}`,
  );
  const logoUrl =
    brandDesign.whiteLogoUrl || brandDesign.blackLogoUrl || brandDesign.logoUrl;
  let logoBase64: { data: string; mimeType: string } | null = null;
  if (logoUrl) {
    console.log(`[BrandImageGen] Fetching logo from: ${logoUrl}`);
    logoBase64 = await fetchImageAsBase64(logoUrl);
    if (logoBase64) {
      console.log(
        `[BrandImageGen] ✅ Logo loaded successfully (${logoBase64.mimeType}, ${Math.round(logoBase64.data.length / 1024)}KB base64)`,
      );
    } else {
      console.log(
        `[BrandImageGen] ❌ WARNING: Failed to download logo from ${logoUrl}`,
      );
    }
  } else {
    console.log(
      `[BrandImageGen] ⚠️ No logo URL found in any field for brand ${brandId}`,
    );
  }

  const hasLogo = !!logoBase64;

  const logoSystemBlock = hasLogo
    ? `## MANDATORY LOGO INTEGRATION
- The FIRST image provided is the official brand LOGO. It is a FIXED graphic mark.
- The logo MUST appear in EVERY generated image — this is NON-NEGOTIABLE.
- Reproduce the logo EXACTLY as shown — do NOT alter its shape, proportions, colors, or design.
- The logo must be clearly VISIBLE and LEGIBLE at social media sizes.
- Integrate the logo PHYSICALLY into the scene as a real object: engraved on a surface, embossed on packaging, printed on a product, as signage, as a metal emblem, or as a sticker/label.
- DO NOT make the logo float, glow, or appear as a digital overlay.
- DO NOT simplify, redraw, or reinterpret the logo — copy it EXACTLY from the reference image.
- If the logo contains text, that text must remain perfectly spelled and legible.
- Acceptable placements: on products, packaging, shopping bags, business cards, storefronts, marble surfaces, fabric tags, or any surface that makes sense for the brand.`
    : "";

  const systemInstruction = `You are a brand visual identity replicator. Your #1 job is to CLONE the exact visual style from the reference images provided — especially any real social media posts from the brand.

## YOUR PRIMARY DIRECTIVE
You are NOT creating "inspired by" imagery. You are creating images that could be SEAMLESSLY inserted into the brand's existing Instagram feed and nobody would notice the difference. The visual DNA must be IDENTICAL.

## STYLE REPLICATION RULES (HIGHEST PRIORITY)
When social media post references are provided:
1. REPLICATE the exact same background colors/tones — if they use dark burgundy/mocha backgrounds, YOU use dark burgundy/mocha backgrounds
2. REPLICATE the exact same color grading — if they use warm golden skin tones, YOU use warm golden skin tones
3. REPLICATE the exact same composition style — if they use dramatic close-ups, YOU use dramatic close-ups
4. REPLICATE the exact same text layout style — if they use bold sans-serif over dark backgrounds, YOU do the same
5. REPLICATE the exact same mood and atmosphere — if the vibe is clinical elegance, match it exactly
6. REPLICATE the lighting approach — if they use studio rim lighting, YOU use studio rim lighting
7. The generated image should look like the NEXT POST in their feed, not something from a different brand

## WHAT YOU MUST NEVER DO
- NEVER default to generic light/white/beige backgrounds unless the reference posts specifically use them
- NEVER create generic luxury spa stock photography — match the SPECIFIC brand aesthetic
- NEVER ignore the color palette shown in the references in favor of your own aesthetic preferences
- NEVER produce images that look "AI-generated" or "stock photo"
- NEVER deviate from the visual language established by the social media post references
- NEVER substitute the brand's dark/moody aesthetic with a bright/clean one (or vice versa)

${logoSystemBlock}

## BRAND COPY & TEXT GUIDELINES
Some images should include brand-related text/copy, but NOT all of them:
- When text IS included:
  - Include the BRAND NAME prominently and legibly
  - Add a short, catchy tagline or promotional phrase relevant to the brand
  - Text must be CLEAR, READABLE, and properly spelled — no garbled or distorted letters
  - Match the typography style from the reference posts (font weight, placement, size ratios)
  - Use the brand's color palette for text and ensure sufficient contrast
- When text is NOT included:
  - Focus entirely on stunning visuals that match the reference post style
  - The logo MUST still appear even when there is no text copy
${hasLogo ? "- IMPORTANT: 'No text' means no promotional copy/taglines — the LOGO must STILL be physically present in every image regardless" : ""}

## SOCIAL MEDIA OPTIMIZATION
- Images must command attention in a fast-scrolling feed
- Clean enough to work at small mobile sizes
- Must feel like a natural continuation of the brand's existing content`;

  const results: GeneratedImageResult[] = [];
  const errors: string[] = [];
  const seenHashes = new Set<string>();
  const variationHints = buildVariationHints(count);

  const maxRefAssets = Math.min(5, imageAssets.length);

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
        assetLabels.push(
          `Image ${imageIndex}: 🏷️ OFFICIAL BRAND LOGO — This is a FIXED graphic mark. Reproduce it EXACTLY as shown in every image. Integrate it physically into the scene (engraved, embossed, printed on product/packaging/signage). DO NOT alter its shape, proportions, or colors. DO NOT simplify or reinterpret. It MUST be clearly visible and legible.`,
        );
        imageIndex++;
      }

      let hasSocialMediaPosts = false;
      for (const asset of referenceAssets) {
        const imageData = await fetchImageAsBase64(asset.url);
        if (imageData) {
          contentParts.push({
            inlineData: {
              data: imageData.data,
              mimeType: imageData.mimeType,
            },
          });
          const cat = (asset.category || "").toLowerCase();
          if (cat === "social_media_posts") hasSocialMediaPosts = true;
          const categoryContext = getCategoryContext(cat);
          const descLabel = asset.description
            ? ` — ${asset.description.slice(0, 80)}`
            : "";
          assetLabels.push(
            `Image ${imageIndex}: ${categoryContext}${descLabel}`,
          );
          imageIndex++;
        }
      }

      const variation = variationHints[v];

      const logoPromptBlock = hasLogo
        ? `\n## LOGO (MANDATORY)
The first reference image above is the brand's official logo. It MUST appear in this image:
- Reproduce the logo EXACTLY — same shape, proportions, and colors
- Integrate it physically: engraved, embossed, printed on product/packaging, as signage, on a shopping bag, etc.
- It must be clearly visible and legible — not tiny, not hidden, not cropped
- DO NOT float, glow, or digitally overlay the logo\n`
        : "";

      const textSection = variation.includeText
        ? `## COPY/TEXT TO INCLUDE IN THE IMAGE (REQUIRED FOR THIS VARIATION)
The image MUST contain these text elements:
1. The brand name "${brand.name}" — large, clear, and prominent
2. A short compelling tagline or promotional phrase related to the brand (create one that fits the industry and brand description)
3. Optional: a call-to-action phrase or additional detail
Make the text beautiful — use elegant typography, ensure perfect spelling, and integrate it naturally into the composition. Text should use the brand's color palette and be fully readable at mobile sizes.
${logoPromptBlock}`
        : `## NO PROMOTIONAL TEXT FOR THIS VARIATION
This image should have NO promotional copy, taglines, or calls to action.
Focus entirely on stunning visuals, lighting, textures, mood, and composition.
${hasLogo ? `HOWEVER — the brand LOGO must STILL appear physically in the scene. "No text" means no promotional copy — the logo is a graphic mark and must always be present.` : "Let the imagery speak for itself."}
${logoPromptBlock}`;

      const socialMediaBlock = hasSocialMediaPosts
        ? `## ⚠️ CRITICAL — STYLE CLONING FROM REAL SOCIAL MEDIA POSTS
The images marked as "📱 REAL SOCIAL MEDIA POST" above are ACTUAL PUBLISHED POSTS from this brand's Instagram/social media.
These are your PRIMARY style reference — they override any other aesthetic instinct you may have.

ANALYZE each social media post and extract:
1. BACKGROUND: What colors/tones do they use? (dark, light, gradient, solid, textured?)
2. COLOR GRADING: What is the overall color temperature? (warm, cool, moody, bright?)
3. COMPOSITION: How are subjects framed? (close-up, full body, product flat-lay, centered?)
4. TYPOGRAPHY: What font style, size, placement, and colors are used for text?
5. MOOD: What feeling do these posts convey? (clinical, luxurious, warm, minimal, bold?)
6. SUBJECTS: What is typically shown? (faces, products, treatments, lifestyle scenes?)

Now CLONE these exact characteristics into your generated image. Your output must look like it was designed by the same person who made these posts. If someone scrolled past your image in their feed alongside the reference posts, they should NOT be able to tell which one is AI-generated.

FORBIDDEN: Do NOT override the reference style with your own preferred aesthetic. If the posts use dark backgrounds, USE dark backgrounds. If they use close-up faces, USE close-up faces. REPLICATE, don't reinterpret.`
        : "";

      const userPrompt = `Create a social media image that REPLICATES this brand's visual style:

## BRAND IDENTITY
- Name: "${brand.name}"
- Description: ${brandDescription}
- Industry: ${brand.industry || "lifestyle"}
- Visual Style: ${brandStyle}
- Color Palette: Primary ${primaryColor}${accent1 ? `, Accent ${accent1}` : ""}${accent2 ? `, Secondary ${accent2}` : ""}
${fontPrimary ? `- Typography: ${fontPrimary}` : ""}

## REFERENCE IMAGES PROVIDED (${contentParts.length} images above)
${assetLabels.join("\n")}

${socialMediaBlock}

## STYLE REPLICATION CHECKLIST
Before generating, answer these questions from the references:
- What BACKGROUND style do they use? → Use the SAME backgrounds
- What COLOR GRADING do they use? → Apply the SAME color grading
- What COMPOSITION patterns do they use? → Follow the SAME composition
- What LIGHTING setup do they use? → Replicate the SAME lighting
- What MOOD/ATMOSPHERE do they convey? → Create the SAME mood
Your image MUST match ALL of these. Do NOT substitute your own aesthetic preferences.

${textSection}

## THIS VARIATION'S DIRECTION
${variation.direction}
${historyContext}

## LANGUAGE REQUIREMENT
ALL visible text/copy in the image (if any) MUST be in ${languageLabel}.

Generate a single image that looks like the NEXT POST in this brand's Instagram feed.`;

      console.log(
        `[BrandImageGen] Generating variation ${v + 1}/${count} — ${contentParts.length} reference images, logo=${hasLogo ? "YES" : "NO"}, text=${variation.includeText ? "YES" : "NO"}, socialMediaPosts=${hasSocialMediaPosts ? "YES" : "NO"}`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          {
            role: "user",
            parts: [...contentParts, { text: userPrompt }],
          },
        ],
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
            let imageBuffer = Buffer.from(part.inlineData.data, "base64");
            const hash = sha256(imageBuffer);

            if (seenHashes.has(hash)) {
              console.log(
                `[BrandImageGen] Skipping duplicate image (hash: ${hash.slice(0, 8)})`,
              );
              continue;
            }
            seenHashes.add(hash);

            if (logoUrl) {
              imageBuffer = await overlayLogoOnImage(imageBuffer, logoUrl);
            }

            const finalBase64 = imageBuffer.toString("base64");
            const mimeType = part.inlineData.mimeType || "image/png";
            const dataUri = `data:${mimeType};base64,${finalBase64}`;
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
              prompt: variation.direction,
              variant: v + 1,
              hash,
              variationHint: variation.direction,
            });

            imageFound = true;
            console.log(
              `[BrandImageGen] Variation ${v + 1} generated and uploaded successfully`,
            );
            break;
          }
        }
        if (imageFound) break;
      }

      if (!imageFound) {
        const textResponse = candidates[0]?.content?.parts?.find(
          (p: any) => p.text,
        )?.text;
        errors.push(
          `Variation ${v + 1}: No image generated. ${textResponse ? `Model said: ${textResponse.slice(0, 100)}` : ""}`,
        );
        console.log(
          `[BrandImageGen] Variation ${v + 1} did not produce an image`,
        );
      }

      if (v < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    } catch (error: any) {
      console.error(
        `[BrandImageGen] Error generating variation ${v + 1}:`,
        error,
      );
      errors.push(`Variation ${v + 1}: ${error.message || "Unknown error"}`);
    }
  }

  console.log(
    `[BrandImageGen] Complete. Generated ${results.length}/${count} images. Errors: ${errors.length}`,
  );
  return { images: results, errors };
}
