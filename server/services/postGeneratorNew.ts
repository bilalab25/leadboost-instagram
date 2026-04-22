import { GoogleGenAI } from "@google/genai";
import cloudinary from "../cloudinary";
import { generateContentWithRetry } from "./aiRetry";

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

// Brand context passed as parameter — no hardcoded brand data
interface BrandInput {
  name: string;
  colors: string[];
  description: string;
  logoUrl?: string;
  inspirationImageUrl?: string;
  employeeImageUrl?: string;
}

const CREATIVE_DIRECTOR_SYSTEM = `
You are a senior Creative Director (premium/editorial campaigns for social media).
Your task is to transform a short brief + visual references into a detailed CINEMATIC PROMPT for an image generator.

RULES:
- Extract the "aesthetic DNA" from the inspiration image (mood, composition, contrast, texture, light). Do NOT copy it.
- Integrate the logo naturally as part of the scene (plaque, emboss, label, print on object). It should be visible but subtle.
- No flat backgrounds or "stock" look.
- Use brand colors elegantly (not saturated).
- Leave negative space for copy.

OUTPUT:
Return ONLY a text block called IMAGE_PROMPT (no markdown, no extra bullets, no explanations).
`;

const IMAGE_RENDER_SYSTEM = `
You are a premium image generator for social media campaigns.
Follow the IMAGE_PROMPT exactly.
Rules: no flat background, no stock look, high editorial quality, commercial lighting, depth and texture.
Integrate the provided logo naturally and visibly (without distorting it).
Return ONLY the final image.
`;

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    return { data: base64, mimeType };
  } catch {
    return null;
  }
}

function asInlinePart(img: { data: string; mimeType: string }) {
  return { inlineData: { mimeType: img.mimeType, data: img.data } };
}

async function buildImagePromptFromBrand(brand: BrandInput): Promise<string> {
  const parts: any[] = [
    {
      text: `
Brand: ${brand.name}
Description: ${brand.description}
Brand colors: ${brand.colors.join(", ")}

Task:
Generate a cinematic IMAGE_PROMPT for an Instagram 1:1 visual.
Interpret the brand's niche and define a premium/editorial scene with:
- realistic environment (no flat background)
- minimal composition
- commercial lighting
- textures and depth
- elegant use of the brand palette
- add copy related to the brand in the negative space.
`,
    },
  ];

  try {
    const resp = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: CREATIVE_DIRECTOR_SYSTEM }],
        },
        temperature: 0.7,
      },
    });

    const text =
      resp.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("\n") || "";

    return text.trim() || `Ultra realistic luxury editorial scene for ${brand.name}`;
  } catch (error) {
    console.error("[PostGeneratorNew] Error building image prompt:", error);
    return `Ultra realistic luxury editorial scene for ${brand.name}, brand colors: ${brand.colors.join(", ")}`;
  }
}

export async function generateImageBrandOnly(brand: BrandInput): Promise<string | null> {
  try {
    const imagePrompt = await buildImagePromptFromBrand(brand);

    const response = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [{ text: `IMAGE_PROMPT:\n${imagePrompt}` }],
        },
      ],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: IMAGE_RENDER_SYSTEM }],
        },
        temperature: 0.8,
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) return null;

    for (const part of responseParts as any[]) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("[PostGeneratorNew] Error generating brand-only image:", error);
    return null;
  }
}

export async function generateImageBrandOnlyWithLogo(brand: BrandInput): Promise<string | null> {
  try {
    if (!brand.logoUrl) return generateImageBrandOnly(brand);

    const logoImage = await fetchImageAsBase64(brand.logoUrl);
    const imagePrompt = await buildImagePromptFromBrand(brand);

    const renderParts: any[] = [];
    if (logoImage) renderParts.push(asInlinePart(logoImage));

    renderParts.push({
      text: `IMAGE_PROMPT:\n${imagePrompt}\nLogo must be integrated naturally and remain unchanged.`,
    });

    const response = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: renderParts }],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: IMAGE_RENDER_SYSTEM }],
        },
        temperature: 0.8,
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const p of parts as any[]) {
      if (p.inlineData?.data) {
        return `data:${p.inlineData.mimeType || "image/png"};base64,${p.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("[PostGeneratorNew] Error generating image with logo:", error);
    return null;
  }
}

async function buildImagePrompt(brand: BrandInput, {
  inspirationImage,
  employeeImage,
  logoImage,
}: {
  inspirationImage: { data: string; mimeType: string } | null;
  employeeImage: { data: string; mimeType: string } | null;
  logoImage: { data: string; mimeType: string } | null;
}): Promise<string> {
  const parts: any[] = [];

  if (inspirationImage) parts.push(asInlinePart(inspirationImage));
  if (employeeImage) parts.push(asInlinePart(employeeImage));
  if (logoImage) parts.push(asInlinePart(logoImage));

  parts.push({
    text: `
Brand: ${brand.name}
Description: ${brand.description}
Brand colors: ${brand.colors.join(", ")}

Instructions:
- Image 1: feed/style inspiration
- Image 2: employee/protagonist
- Image 3: logo to integrate

Generate a cinematic IMAGE_PROMPT for an Instagram 1:1 visual.
Must describe: realistic scene/environment, composition, lighting, textures, palette, depth of field, and how to naturally integrate the logo.
No flat background. No stock look.
Add copy related to the brand in the negative space.
`,
  });

  try {
    const resp = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: CREATIVE_DIRECTOR_SYSTEM }],
        },
        temperature: 0.6,
      },
    });

    const text =
      resp.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("\n") || "";

    return text.trim() || `Ultra realistic luxury editorial scene for ${brand.name}`;
  } catch (error) {
    console.error("[PostGeneratorNew] Error building composite prompt:", error);
    return `Ultra realistic luxury editorial scene for ${brand.name}`;
  }
}

export async function generateImageWithReferences(brand: BrandInput): Promise<string | null> {
  try {
    // Fetch all reference images in parallel
    const [inspirationImage, employeeImage, logoImage] = await Promise.all([
      brand.inspirationImageUrl ? fetchImageAsBase64(brand.inspirationImageUrl) : null,
      brand.employeeImageUrl ? fetchImageAsBase64(brand.employeeImageUrl) : null,
      brand.logoUrl ? fetchImageAsBase64(brand.logoUrl) : null,
    ]);

    const imagePrompt = await buildImagePrompt(brand, {
      inspirationImage,
      employeeImage,
      logoImage,
    });

    const renderParts: any[] = [];
    if (employeeImage) renderParts.push(asInlinePart(employeeImage));
    if (logoImage) renderParts.push(asInlinePart(logoImage));

    renderParts.push({
      text: `IMAGE_PROMPT:\n${imagePrompt}\n\nOutput: Instagram-ready 1:1 image.`,
    });

    const response = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: renderParts }],
      config: {
        systemInstruction: {
          role: "system",
          parts: [{ text: IMAGE_RENDER_SYSTEM }],
        },
        temperature: 1.0,
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts) return null;

    for (const part of responseParts as any[]) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("[PostGeneratorNew] Error generating image with references:", error);
    return null;
  }
}

export const saveAndCreateImage = async (brand: BrandInput, folder?: string): Promise<string> => {
  const dataUri = await generateImageWithReferences(brand);
  if (!dataUri) throw new Error("Failed to generate image");

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folder || "brands/posts/generated",
    resource_type: "image",
  });

  return result.secure_url;
};
