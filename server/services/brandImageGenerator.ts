import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import cloudinary from "../cloudinary";
import crypto from "crypto";
import sharp from "sharp";
import { db } from "../db";
import { brandAssets } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { generateContentWithRetry } from "./aiRetry";

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

    return result;
  } catch (error) {
    // If logo overlay fails, return original image without overlay
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
    catTracker["social_media_posts"] =
      (catTracker["social_media_posts"] || 0) + 1;
  }

  const otherCategories = Object.keys(categoryGroups)
    .filter((cat) => cat !== "social_media_posts")
    .sort((a, b) => {
      const prioOrder = [
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
      const prioA = prioOrder.indexOf(a);
      const prioB = prioOrder.indexOf(b);
      const effectiveA = prioA === -1 ? 100 : prioA;
      const effectiveB = prioB === -1 ? 100 : prioB;
      if (effectiveA !== effectiveB) return effectiveA - effectiveB;
      return (catTracker[a] || 0) - (catTracker[b] || 0);
    });

  const remainingSlots = maxCount - selected.length;
  if (remainingSlots > 0 && otherCategories.length > 0) {
    const slotsPerCat = Math.max(
      1,
      Math.ceil(remainingSlots / otherCategories.length),
    );
    for (const cat of otherCategories) {
      if (selected.length >= maxCount) break;
      const catAssets = categoryGroups[cat];
      const sorted = catAssets
        .filter((a) => !selected.includes(a))
        .sort(
          (a, b) => (usageTracker[a.url] || 0) - (usageTracker[b.url] || 0),
        );
      const toTake = Math.min(
        slotsPerCat,
        sorted.length,
        maxCount - selected.length,
      );
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
      return "📱 REAL Instagram post from this brand — match this visual style";
    case "product_images":
    case "products":
    case "product":
      return "🛍️ Brand product photo";
    case "location_images":
    case "location":
    case "location_assets":
    case "place":
      return "📍 Brand location photo";
    case "inspiration_templates":
    case "inspiration":
      return "🎨 Brand design inspiration";
    default:
      return "📸 Brand reference image";
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

  const systemInstruction = `You are a world-class creative director and visual artist specializing in luxury brand imagery for social media.

YOUR MANDATE: Create images that look like they belong in a high-end advertising campaign — NOT stock photos, NOT amateur content, NOT AI-generated looking.

## PROFESSIONAL QUALITY STANDARDS
- Photorealistic quality with cinematic lighting (golden hour, Rembrandt, split lighting)
- Rich color grading that matches the brand palette without being garish
- Professional composition following rule of thirds, leading lines, or centered symmetry
- Depth of field that creates visual hierarchy — sharp subject, soft background
- Natural textures and materials that feel tactile and premium
- NO watermarks, NO stock photo overlays, NO generic template layouts

${logoSystemBlock}

## BRAND COPY & TEXT GUIDELINES
Some images should include brand-related text/copy, but NOT all of them. Mix it up:
- About HALF of the images in a set should include text (brand name, taglines, calls to action, promotional phrases)
- The other half should be purely visual — beautiful product/lifestyle imagery with NO text overlay, letting the visuals speak for themselves
- When text IS included:
  - Include the BRAND NAME prominently and legibly
  - Add a short, catchy tagline or promotional phrase relevant to the brand
  - Text must be CLEAR, READABLE, and properly spelled — no garbled or distorted letters
  - Use elegant, modern typography that matches the brand style
  - Use the brand's color palette for text and ensure sufficient contrast for readability
  - Integrate text naturally into the composition
- When text is NOT included:
  - Focus entirely on stunning visuals, lighting, textures, and mood
  - Let the product/scene be the hero
  - The logo MUST still appear even when there is no text copy
${hasLogo ? "- IMPORTANT: 'No text' means no promotional copy/taglines — the LOGO must STILL be physically present in every image regardless" : ""}

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
        ? `## STYLE REFERENCE
Some of the images above are REAL Instagram posts from this brand. These are the most important references. Create a new post that matches the same visual style — same colors, same backgrounds, same mood, same type of compositions. It should look like it was made by the same designer.`
        : "";

      const userPrompt = `Create a premium social media image for this brand:

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

Study these reference images carefully. Match their:
- Visual style, composition patterns, and design language
- Color grading, color temperature, and palette usage
- Typography style, text placement, and layout decisions
- Material textures, surface finishes, and lighting approach
- Overall mood, atmosphere, and brand personality
Create something NEW that feels like it was created by the SAME brand and the SAME designer.

${textSection}

## THIS VARIATION'S DIRECTION
${variation.direction}
${historyContext}

## LANGUAGE REQUIREMENT
ALL visible text/copy in the image (if any) MUST be in ${languageLabel}.

Generate a single, stunning, scroll-stopping social media image.`;

      const simpleCount = Math.round(count * 0.7);
      const useSimplePrompt = hasSocialMediaPosts && v < simpleCount;
      const promptMode = useSimplePrompt ? "social-style" : "full-creative";

      console.log(
        `[BrandImageGen] Generating variation ${v + 1}/${count} — mode=${promptMode}, ${contentParts.length} reference images, logo=${hasLogo ? "YES" : "NO"}, text=${variation.includeText ? "YES" : "NO"}, socialMediaPosts=${hasSocialMediaPosts ? "YES" : "NO"}`,
      );

      const response = useSimplePrompt
        ? await generateContentWithRetry(ai, {
            model: "gemini-2.5-flash-image",
            contents: [
              {
                role: "user",
                parts: [
                  ...contentParts,
                  {
                    text: "Estas imágenes corresponden a publicaciones actuales de mi marca en Instagram. A partir de ellas, crea una nueva imagen profesional lista para publicar. La imagen generada debe ser coherente con el estilo y contenido de las referencias. Si alguna de las imágenes incluye texto, analízalo para asegurarte de que el nuevo diseño mantenga congruencia en mensaje, tono y estética.",
                  },
                ],
              },
            ],
            config: {
              responseModalities: ["IMAGE", "TEXT"],
              systemInstruction: [
                {
                  text: "Eres un experto en marketing digital, dirección creativa y producción visual para redes sociales. Tu función es generar imagenes detallados publicitarias optimizada para Instagram, Facebook y TikTok. Las imagenes que generes deben ser profesionales, del nivel de una marca de lujo.",
                },
              ],
              imageConfig: {
                aspectRatio: "4:5",
              },
            },
          })
        : await generateContentWithRetry(ai, {
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
                aspectRatio: "4:5",
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
