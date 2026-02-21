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
      return "REAL Instagram post from this brand";
    case "product_images":
    case "products":
    case "product":
      return "Brand product photo";
    case "location_images":
    case "location":
    case "location_assets":
    case "place":
      return "Brand location photo";
    case "inspiration_templates":
    case "inspiration":
      return "Brand design inspiration";
    default:
      return "Brand reference image";
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

  const systemInstruction = `You generate social media posts for brands. You will receive real Instagram posts from the brand as reference images. Your job is simple: create a NEW post that looks like it belongs in the same Instagram feed.

Copy the same visual style — same colors, same backgrounds, same mood, same type of compositions, same vibe. The new image should be indistinguishable in style from the reference posts.

${logoSystemBlock}

${hasLogo ? "The brand logo must appear naturally in every image. Reproduce it exactly as provided." : ""}

All text must be clear, readable, and properly spelled. No garbled letters.`;

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
          `Image ${imageIndex}: Brand logo — reproduce it exactly as shown, place it naturally in the scene`,
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

      const textSection = variation.includeText
        ? `Include the brand name "${brand.name}" and a short catchy tagline in the image. Match the typography style from the reference posts.`
        : `No promotional text in this image.${hasLogo ? ` The logo should still appear.` : ""}`;

      const userPrompt = `Here are real Instagram posts from the brand "${brand.name}" (${brand.industry || "lifestyle"}).
Brand colors: ${primaryColor}${accent1 ? `, ${accent1}` : ""}${accent2 ? `, ${accent2}` : ""}

${assetLabels.join("\n")}

Create a NEW Instagram post for this brand that matches the SAME visual style as the reference posts above. Same backgrounds, same color tones, same compositions, same mood — it should look like it was made by the same designer.

${textSection}

Direction for this post: ${variation.direction}
${historyContext}

${languageLabel !== "English" ? `All text must be in ${languageLabel}.` : ""}

Do not create generic stock photography. Match the specific style of the references.`;

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
