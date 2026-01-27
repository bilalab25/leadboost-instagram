import { GoogleGenAI, Modality } from "@google/genai";
import { storage } from "../storage";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const generatePrompt = async (brandId: string, userId: string) => {
  const brand = await storage.getBrandById(brandId, userId);
  if (!brand) throw new Error("Brand not found");

  return `You are a professional logo designer specializing in premium, modern, and minimalistic logos 
for brands that want a high-end and memorable visual identity. Create a unique logo for the following brand:

Brand Name: ${brand.name}
Brand Description: ${brand.description}
Industry: ${brand.industry}
Category: ${brand.brandCategory}

Requirements:
- Style: Clean, modern, premium, minimalistic
- Color scheme: Suitable for the brand’s industry, visually appealing, can work on light and dark backgrounds
- Typography: Modern, legible, professional
- Iconography: If relevant, include a simple, memorable icon or symbol
- Usage: Suitable for websites, social media, business cards, and marketing materials

Instructions: 
Generate a professional, high-quality logo that looks like it could come from a premium brand platform like Wix, Canva, or Adobe Express. Focus on elegance, balance, and brand memorability. Return the image as a PNG with a transparent background.`;
};

export const generateAILogo = async (brandId: string, userId: string) => {
  try {
    const prompt = await generatePrompt(brandId, userId);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No image generated");
    }

    const parts = candidates[0].content?.parts;
    const imagePart = parts?.find((p: any) => p.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in response");
    }

    return {
      base64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType,
    };
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};
