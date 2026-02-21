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

  const priorityOrder = [
    "products",
    "product",
    "product_images",
    "location",
    "location_images",
    "location_assets",
    "place",
    "inspiration_templates",
    "inspiration",
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

  console.log(
    `[BrandImageGen] Selected ${selected.length} reference assets from ${categories.length} categories (${imageAssets.length} total available)`,
  );
  return selected.slice(0, maxCount);
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

  const systemInstruction = `You are a world-class creative director and visual artist specializing in brand imagery for social media.

YOUR MANDATE: Create images that VISUALLY MATCH the brand's existing content style. The reference images provided are your PRIMARY guide — study them deeply and generate new content that feels like it was shot in the SAME session, by the SAME photographer, for the SAME campaign.

## CRITICAL: REFERENCE IMAGE STYLE MATCHING
This is the MOST IMPORTANT instruction. You MUST:
1. **Analyze the SPECIFIC products/services** shown in the reference images — what exactly is being featured? (treatments, products, equipment, ingredients, etc.)
2. **Match the visual aesthetic** — if the references show clinical/medical aesthetics, generate clinical aesthetics. If they show warm lifestyle, generate warm lifestyle. Do NOT default to generic luxury.
3. **Replicate the color grading** — study the exact tones, warmth/coolness, contrast levels, and saturation in the references. Your generated image should have the SAME color feel.
4. **Match the composition style** — if references use close-ups of products on marble, generate similar compositions. If they show treatment demonstrations, show treatments. Mirror the framing approach.
5. **Use the SAME types of subjects** — if reference images show skincare products, serums, facial treatments, generate content about those SPECIFIC things. Do NOT substitute with unrelated luxury items.
6. **Match the production level** — if references look like professional product photography, match that. If they look editorial, match that. Do NOT upgrade to a completely different visual language.

## WHAT NOT TO DO
- Do NOT generate generic "luxury spa" or "luxury lifestyle" imagery that ignores the specific content in the references
- Do NOT substitute the brand's actual products with generic bottles, jars, or props
- Do NOT change the visual genre — if the brand references show clinical aesthetics, don't generate cozy-home imagery
- Do NOT ignore the reference images and default to your own idea of what looks good

## PROFESSIONAL QUALITY STANDARDS
- Photorealistic quality with lighting that matches the reference images
- Color grading consistent with the brand's existing visual palette
- Professional composition that mirrors the style of the references
- Natural textures and materials that feel tactile and premium
- NO watermarks, NO stock photo overlays, NO generic template layouts

${logoSystemBlock}

## BRAND COPY & TEXT GUIDELINES
Some images should include brand-related text/copy, but NOT all of them. Mix it up:
- About HALF of the images in a set should include text (brand name, taglines, calls to action)
- The other half should be purely visual — letting the visuals speak for themselves
- When text IS included:
  - Include the BRAND NAME prominently and legibly
  - Add a short compelling tagline relevant to the brand's actual services/products
  - Text must be CLEAR, READABLE, and properly spelled
  - Use elegant typography that matches the brand style
  - Use the brand's color palette for text with sufficient contrast
- When text is NOT included:
  - Focus entirely on stunning visuals that match the reference style
  - Let the product/scene be the hero
  - The logo MUST still appear even when there is no text copy
${hasLogo ? "- IMPORTANT: 'No text' means no promotional copy/taglines — the LOGO must STILL be physically present in every image regardless" : ""}

## BRAND COHESION
- Every image must feel like it belongs to the SAME visual world as the reference images
- Maintain the SAME color temperature, mood, and production style as the references
- The brand's color palette should influence the environment, props, and lighting
- Think "same campaign" — your image should be indistinguishable in style from the references

## SOCIAL MEDIA OPTIMIZATION
- Images must command attention in a fast-scrolling feed
- Strong visual hooks in the first glance
- Clean enough to work at small mobile sizes
- Aspirational but authentic — real-world plausibility`;

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
        assetLabels.push(
          `Image ${imageIndex}: 🏷️ OFFICIAL BRAND LOGO — This is a FIXED graphic mark. Reproduce it EXACTLY as shown in every image. Integrate it physically into the scene (engraved, embossed, printed on product/packaging/signage). DO NOT alter its shape, proportions, or colors. DO NOT simplify or reinterpret. It MUST be clearly visible and legible.`,
        );
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
          const catMap: Record<string, string> = {
            product_images:
              "BRAND PRODUCT PHOTO — This shows the brand's actual product/service. Study the product type, packaging, textures, and presentation style closely. Your generated image should feature SIMILAR products/services.",
            products:
              "BRAND PRODUCT PHOTO — This shows the brand's actual product/service. Study the product type, packaging, textures, and presentation style closely. Your generated image should feature SIMILAR products/services.",
            product:
              "BRAND PRODUCT PHOTO — This shows the brand's actual product/service. Study the product type, packaging, textures, and presentation style closely. Your generated image should feature SIMILAR products/services.",
            location_images:
              "BRAND LOCATION/SPACE — This shows the brand's physical space or environment. Match the interior design style, lighting ambiance, and spatial feel in your generated images.",
            location:
              "BRAND LOCATION/SPACE — This shows the brand's physical space or environment. Match the interior design style, lighting ambiance, and spatial feel in your generated images.",
            location_assets:
              "BRAND LOCATION/SPACE — This shows the brand's physical space or environment. Match the interior design style, lighting ambiance, and spatial feel in your generated images.",
            place:
              "BRAND LOCATION/SPACE — This shows the brand's physical space or environment. Match the interior design style, lighting ambiance, and spatial feel in your generated images.",
            inspiration_templates:
              "BRAND STYLE REFERENCE — This shows the brand's preferred visual style, layout, and design language. Study the typography, color usage, composition patterns, and overall aesthetic. Your generated image should match this style.",
            inspiration:
              "BRAND STYLE REFERENCE — This shows the brand's preferred visual style, layout, and design language. Study the typography, color usage, composition patterns, and overall aesthetic. Your generated image should match this style.",
          };
          const cat = (asset.category || "").toLowerCase();
          const categoryContext =
            catMap[cat] ||
            "BRAND VISUAL REFERENCE — Study this image's style, subject matter, colors, and composition. Generate content that matches this visual language.";
          const descLabel = asset.description
            ? ` (${asset.description.slice(0, 80)})`
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

      const userPrompt = `Create a social media image for this brand that MATCHES the style of the reference images provided:

## BRAND IDENTITY
- Name: "${brand.name}"
- Description: ${brandDescription}
- Industry: ${brand.industry || "lifestyle"}
- Visual Style: ${brandStyle}
- Color Palette: Primary ${primaryColor}${accent1 ? `, Accent ${accent1}` : ""}${accent2 ? `, Secondary ${accent2}` : ""}
${fontPrimary ? `- Typography: ${fontPrimary}` : ""}

## REFERENCE IMAGES PROVIDED (${contentParts.length} images above)
${assetLabels.join("\n")}

## STYLE MATCHING INSTRUCTIONS (CRITICAL)
Before generating, you MUST analyze the reference images above and answer these questions internally:
1. What SPECIFIC products, services, or treatments are shown? → Feature the SAME type of products/services
2. What is the color palette and color grading? → Match it EXACTLY (warm/cool tones, saturation, contrast)
3. What type of compositions are used? → Use SIMILAR framing and composition approaches
4. What is the overall aesthetic? (clinical, editorial, cozy, minimalist, bold, etc.) → Match it precisely
5. What props and backgrounds appear? → Use SIMILAR props and settings
6. What is the production style? (studio, natural light, lifestyle, etc.) → Replicate it

Generate a NEW image that someone would believe was part of the SAME photo shoot or campaign as the references.
Do NOT default to generic luxury imagery. Stay TRUE to what the references actually show.

${textSection}

## THIS VARIATION'S DIRECTION
${variation.direction}
Apply this direction WHILE MAINTAINING the visual style of the reference images. The variation direction is secondary to style matching.
${historyContext}

## LANGUAGE REQUIREMENT
ALL visible text/copy in the image (if any) MUST be in ${languageLabel}.

Generate a single image that looks like it belongs in the same visual world as the reference images.`;

      console.log(
        `[BrandImageGen] Generating variation ${v + 1}/${count} — ${contentParts.length} reference images, logo=${hasLogo ? "YES" : "NO"}, text=${variation.includeText ? "YES" : "NO"}`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
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
            imageSize: "2K",
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
