import { GoogleGenAI } from "@google/genai";
import { storage } from "../storage";
import cloudinary from "../cloudinary";
import crypto from "crypto";

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
  prompt: string;
  variant: number;
  hash: string;
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

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function pickVisualAssets(
  assets: BrandAssetForImage[],
  count: number,
): BrandAssetForImage[] {
  const imageAssets = assets.filter(
    (a) => !a.assetType || a.assetType === "image"
  );

  const inspirationCategories = [
    "location", "location_images", "location_assets", "place",
    "inspiration_templates", "inspiration",
  ];
  const productCategories = [
    "products", "product", "product_images",
  ];

  const inspirationAssets = imageAssets.filter(
    (a) => a.category && inspirationCategories.includes(a.category.toLowerCase())
  );
  const productAssets = imageAssets.filter(
    (a) => a.category && productCategories.includes(a.category.toLowerCase())
  );
  const otherAssets = imageAssets.filter(
    (a) => !inspirationCategories.includes(a.category?.toLowerCase() || "") &&
           !productCategories.includes(a.category?.toLowerCase() || "")
  );

  const selected: BrandAssetForImage[] = [];

  if (inspirationAssets.length > 0) {
    selected.push(...pickRandom(inspirationAssets, Math.min(2, count)));
  }
  if (productAssets.length > 0 && selected.length < count) {
    selected.push(...pickRandom(productAssets, Math.min(1, count - selected.length)));
  }
  if (selected.length < count && otherAssets.length > 0) {
    selected.push(...pickRandom(otherAssets, count - selected.length));
  }

  return selected.slice(0, count);
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    en: "English", es: "Spanish", pt: "Portuguese", fr: "French",
    de: "German", it: "Italian", zh: "Chinese", ja: "Japanese",
    ko: "Korean", ar: "Arabic", hi: "Hindi",
  };
  return map[lang] || "English";
}

function buildVariationHint(variant: number, total: number): string {
  const hints = [
    "Focus on a close-up, intimate composition with warm lighting and shallow depth of field.",
    "Use a wider shot with environmental context, showing the brand's lifestyle and atmosphere.",
    "Create an overhead or flat-lay perspective with carefully arranged elements and clean negative space.",
    "Use dramatic side lighting with strong shadows for a bold editorial mood.",
    "Create a lifestyle moment in action - candid, dynamic, with natural movement.",
    "Minimalist composition with lots of breathing room, centered subject, soft background.",
  ];
  return hints[variant % hints.length];
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

  const brandAssets = await storage.getAssetsByBrandId(brandId);
  const imageAssets = (brandAssets || []).filter(
    (a: any) => !a.assetType || a.assetType === "image"
  );

  const preferredLanguage = (brandDesign as any).preferredLanguage || brand.preferredLanguage || "en";
  const languageLabel = getLanguageLabel(preferredLanguage);

  const primaryColor = brandDesign.colorPrimary || "#000000";
  const accent1 = brandDesign.colorAccent1 || "";
  const accent2 = brandDesign.colorAccent2 || "";

  const fontPrimary = brandDesign.fontPrimary || "";

  const brandStyle = brandDesign.brandStyle || "minimalist";

  let logoBase64: { data: string; mimeType: string } | null = null;
  if (brandDesign.logoUrl) {
    logoBase64 = await fetchImageAsBase64(brandDesign.logoUrl);
    if (logoBase64) {
      console.log(`[BrandImageGen] Logo loaded successfully`);
    }
  }

  const systemInstruction = `You are an expert in digital marketing, creative direction, and visual production for social media.
Your role is to generate detailed advertising images optimized for Instagram, Facebook, and TikTok.
The images you generate must be professional, at the level of a luxury brand.

Key principles:
- Every image must feel cohesive and on-brand
- Use the brand's color palette subtly and elegantly
- Maintain consistent lighting and mood across variations
- Avoid stock-photo feeling - aim for editorial, authentic quality
- If the brand logo is provided, incorporate it naturally (corner placement, subtle watermark style)
- Do NOT add large text overlays unless specifically requested
- Create images that would stop a user mid-scroll on social media`;

  const results: GeneratedImageResult[] = [];
  const errors: string[] = [];
  const seenHashes = new Set<string>();

  for (let v = 0; v < count; v++) {
    try {
      const referenceAssets = pickVisualAssets(imageAssets as BrandAssetForImage[], 3);

      const contentParts: any[] = [];

      if (logoBase64) {
        contentParts.push({
          inlineData: {
            data: logoBase64.data,
            mimeType: logoBase64.mimeType,
          },
        });
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
        }
      }

      const variationHint = buildVariationHint(v, count);

      const userPrompt = `Generate an Instagram-ready social media image for this brand:

Brand: ${brand.name}
Description: ${brand.description || ""}
Industry: ${brand.industry || ""}
Style: ${brandStyle}
Color palette: Primary ${primaryColor}, Accent ${accent1}, Secondary ${accent2}
${fontPrimary ? `Typography: ${fontPrimary}` : ""}

${logoBase64 ? "The FIRST image above is the brand's official logo. Include it subtly in the lower-right corner. Do NOT redraw, simplify, or reinterpret the logo — reproduce it exactly as shown." : ""}
${referenceAssets.length > 0 ? "The remaining images above are brand visual references. Use them for inspiration on lighting, textures, color mood, and composition. Do NOT copy them literally." : ""}

Variation direction: ${variationHint}

ALL visible text in the image MUST be in ${languageLabel}.

Create a professional, scroll-stopping social media image that is cohesive with the brand identity.`;

      console.log(`[BrandImageGen] Generating variation ${v + 1}/${count}...`);

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

            const uploadRes = await cloudinary.uploader.upload(dataUri, {
              folder,
              public_id: `gen_v${v + 1}_${hash.slice(0, 8)}`,
              overwrite: false,
            });

            results.push({
              id: `${brandId}_v${v + 1}_${hash.slice(0, 8)}`,
              imageUrl: uploadRes.secure_url,
              prompt: userPrompt.slice(0, 200),
              variant: v + 1,
              hash,
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
