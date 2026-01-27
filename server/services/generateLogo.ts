import { GoogleGenAI, Modality } from "@google/genai";
import { storage } from "../storage";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const generatePrompt = async (brandId: string, userId: string) => {
  const brand = await storage.getBrandById(brandId, userId);
  if (!brand) throw new Error("Brand not found");

  return `You are an expert logo designer. Create a unique and professional logo for the following brand: 
  Name: ${brand.name}, 
  Description: ${brand.description}, 
  Industry: ${brand.industry}, 
  Category: ${brand.brandCategory}. 
  Provide a clean, modern design suitable for web and social media.`;
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
