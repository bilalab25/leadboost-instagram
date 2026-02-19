import { GoogleGenAI, Modality, Type } from "@google/genai";
import cloudinary from "../cloudinary";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(
        `[PostGenerator] Failed to fetch image from ${url}: ${response.status}`,
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
    console.error(`[PostGenerator] Error fetching image from ${url}:`, error);
    return null;
  }
}

export async function generateImageWithNanoBanana = () => {
  const prompt = [{text:"Generate an image of a cat"}]
  const aspectRatio = '1:1';
  const resolution = '2K';
  
  const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: prompt,
  config: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
  },
}});
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const base64Image = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        console.log("[PostGenerator] Image generated successfully");
        return dataUrl;
      }
    }
  }
  return null;
}

export const saveAndCreateImage = () => {
  const imageUrl = generateImageWithNanoBanana();
  const imageBase64 = await fetchImageAsBase64(imageUrl);
  const dataUri = imageBase64
    ? `data:${imageBase64.mimeType};base64,${imageBase64.data}`
    : null;
  if (!dataUri)
    throw new Error("Failed to convert image to data URI");
   await cloudinary.uploader.upload(dataUri, {
    folder: `test/posts`,
    resource_type: "image",
  });

}