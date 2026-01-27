import { GoogleGenAI, Modality } from "@google/genai";
import { storage } from "../storage";

// Using your own Gemini API key from Google AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});
const generatePrompt = async (brandId: string, userId: string) => {
  const brand = await storage.getBrandById(brandId, userId);
  if (!brand) {
    throw new Error("Brand not found");
  }
  const brandDetails = `Brand Name: ${brand.name}, Brand Description: ${brand.description}, Brand Industry: ${brand.industry}, Brand Category: ${brand.brandCategory}`;
  const prompt = `You are an expert logo designer. You will create a logo for a brand based on the following details: ${brandDetails}.`;
  return prompt;
};

export const generateAILogo = async (brandId: string, userId: string) => {
  try {
    const prompt = await generatePrompt(brandId, userId);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } catch (error) {
    console.error("Error generating logo:", error);
  }
};
