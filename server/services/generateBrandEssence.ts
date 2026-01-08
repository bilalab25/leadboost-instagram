import { GoogleGenAI, Type } from "@google/genai";
import { storage } from "../storage";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export interface BrandEssence {
  toneOfVoice: string;
  personality: string;
  emotionalFeel: string;
  visualKeywords: string;
  brandPromise: string;
}

export async function generateBrandEssence(
  brandId: string,
): Promise<BrandEssence> {
  console.log(`[BrandEssence] Generating essence for brand: ${brandId}`);

  const brand = await storage.getBrandByIdOnly(brandId);
  const design = await storage.getBrandDesignByBrandId(brandId);
  const assets = await storage.getAssetsByBrandId(brandId);

  if (!brand) throw new Error("Brand not found");
  if (!design)
    throw new Error("Brand design missing — cannot generate essence");

  const assetDescriptions = assets
    .map(
      (a) =>
        `• ${a.name} (${a.category || "general"}): ${(a as any).description || "No description"}`,
    )
    .join("\n");

  const prompt = `
You are a senior brand strategist and creative director.

Based ONLY on the data below, generate a *Brand Essence* that summarizes the emotional, visual, and verbal identity of this brand.

### BRAND INFORMATION
Name: ${brand.name}
Description: ${brand.description || "No description provided"}

### BRAND DESIGN
Primary Color: ${design.colorPrimary}
Accent Colors: ${design.colorAccent1}, ${design.colorAccent2}, ${design.colorAccent3}, ${design.colorAccent4}
Brand Style: ${design.brandStyle}
Fonts: Primary ${design.fontPrimary}, Secondary ${design.fontSecondary}

### BRAND ASSETS (visual analysis)
${assetDescriptions || "No assets uploaded"}

-----------------------------------------
Return structured JSON in this schema:
{
  "toneOfVoice": "string — how the brand sounds when speaking",
  "personality": "string — the brand's human-like traits",
  "emotionalFeel": "string — the feeling the brand should evoke",
  "visualKeywords": "string — a synthesis of adjectives derived from the asset descriptions (e.g., 'high-contrast', 'cinematic haze', 'polished metallic'), lighting, and textures",
  "brandPromise": "string — what the brand fundamentally promises to deliver"
}
-----------------------------------------
Produce concise but powerful descriptions.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.4,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          toneOfVoice: { type: Type.STRING },
          personality: { type: Type.STRING },
          emotionalFeel: { type: Type.STRING },
          visualKeywords: { type: Type.STRING },
          brandPromise: { type: Type.STRING },
        },
        required: [
          "toneOfVoice",
          "personality",
          "emotionalFeel",
          "visualKeywords",
          "brandPromise",
        ],
      },
    },
  });

  const essence: BrandEssence = JSON.parse(response.text!);

  console.log("[BrandEssence] Generated essence:", essence);
  await storage.upsertBrandEssence(brandId, essence);

  console.log("[BrandEssence] Saved to DB");

  return essence;
}
