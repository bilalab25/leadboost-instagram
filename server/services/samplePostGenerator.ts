import { GoogleGenAI, Modality, Type } from "@google/genai";
import { storage } from "../storage";
import type { BrandDesign, Brand } from "@shared/schema";
import cloudinary from "../cloudinary";
import { languageInstruction } from "./postGenerator";
import { createPostGeneratorJob, updatePostGeneratorJob } from "../storage/postGeneratorJobs";
import { createAiGeneratedPost, getAiGeneratedPostsByBrand } from "../storage/aiGeneratedPosts";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

interface SamplePostContent {
  platform: string;
  titulo: string;
  content: string;
  hashtags: string;
  imagePrompt: string;
}

interface GeneratedSamplePost {
  platform: string;
  titulo: string;
  content: string;
  hashtags: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
}

async function generateSamplePostContent(
  brand: Brand,
  brandDesign: BrandDesign,
  preferredLanguage: string,
): Promise<SamplePostContent[]> {
  const languageLabel = languageInstruction(preferredLanguage);
  
  const prompt = `You are a social media expert creating sample posts for a new brand.
  
Brand Information:
- Name: ${brand.name}
- Industry/Category: ${brand.brandCategory || brand.industry || "general business"}
- Description: ${brand.description || "A modern brand connecting with customers"}
- Website: ${brand.website || ""}
- Style: ${brandDesign.brandStyle || "modern and professional"}
- Colors: Primary ${brandDesign.colorPrimary || "#4F46E5"}, Accent ${brandDesign.colorAccent1 || "#7C3AED"}

Create 3 sample posts (one for Instagram, one for Facebook, one for WhatsApp) that showcase what kind of content this brand could share. These are DEMO posts to show the user how the platform works.

LANGUAGE REQUIREMENT (MANDATORY):
- All post content, titles, and hashtags MUST be written in ${languageLabel}.
- Do NOT use English unless the specified language is English.

For Instagram: Create a visually-focused post with engaging caption and relevant hashtags
For Facebook: Create an informative post that encourages engagement and discussion  
For WhatsApp: Create a promotional message suitable for broadcast to customers

Return a JSON object with posts array containing objects with these fields:
- platform: "instagram" | "facebook" | "whatsapp"
- titulo: Short engaging title for the post
- content: The main post content/caption
- hashtags: Relevant hashtags (for Instagram/Facebook only, leave empty for WhatsApp)
- imagePrompt: A detailed description for generating a professional marketing image that matches this post`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            posts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING },
                  titulo: { type: Type.STRING },
                  content: { type: Type.STRING },
                  hashtags: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                },
                required: ["platform", "titulo", "content", "hashtags", "imagePrompt"],
              },
            },
          },
          required: ["posts"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      console.error("[SamplePostGenerator] No text response from Gemini");
      return [];
    }

    const parsed = JSON.parse(text);
    return parsed.posts || [];
  } catch (error) {
    console.error("[SamplePostGenerator] Error generating content:", error);
    return [];
  }
}

async function generateSampleImage(
  imagePrompt: string,
  brandDesign: BrandDesign,
  platform: string,
): Promise<string | null> {
  try {
    const aspectRatios: Record<string, string> = {
      instagram: "1:1 (square, 1080x1080px)",
      facebook: "16:9 (landscape, 1200x628px)",
      whatsapp: "1:1 (square, 1080x1080px)",
    };

    const enhancedPrompt = `Create a professional marketing image for social media.

VISUAL REQUIREMENTS:
- Aspect ratio: ${aspectRatios[platform] || "1:1 (square)"}
- Style: ${brandDesign.brandStyle || "modern and professional"}
- Color palette: Primary ${brandDesign.colorPrimary || "#4F46E5"}, Accent ${brandDesign.colorAccent1 || "#7C3AED"}

SCENE DESCRIPTION:
${imagePrompt}

CRITICAL RULES:
- Create a clean, professional marketing image
- DO NOT include any text, words, or typography in the image
- Focus on vibrant colors, professional lighting, and appealing composition
- The image should feel premium and brand-appropriate
- No logos or watermarks
- Photorealistic style with professional photography quality`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      console.error("[SamplePostGenerator] No image in response");
      return null;
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const base64Data = part.inlineData.data;
        const dataUrl = `data:image/png;base64,${base64Data}`;
        return dataUrl;
      }
    }

    return null;
  } catch (error) {
    console.error("[SamplePostGenerator] Error generating image:", error);
    return null;
  }
}

async function uploadToCloudinary(
  base64DataUrl: string,
  brandId: string,
  platform: string,
): Promise<{ url: string; publicId: string } | null> {
  try {
    const result = await cloudinary.uploader.upload(base64DataUrl, {
      folder: `brands/${brandId}/sample_posts`,
      public_id: `sample_${platform}_${Date.now()}`,
      resource_type: "image",
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("[SamplePostGenerator] Cloudinary upload error:", error);
    return null;
  }
}

export async function generateSamplePosts(
  brandId: string,
): Promise<GeneratedSamplePost[]> {
  console.log(`[SamplePostGenerator] Starting sample post generation for brand ${brandId}`);

  const brand = await storage.getBrandById(brandId);
  if (!brand) {
    console.error(`[SamplePostGenerator] Brand ${brandId} not found`);
    return [];
  }

  const brandDesign = await storage.getBrandDesign(brandId);
  if (!brandDesign) {
    console.error(`[SamplePostGenerator] Brand design not found for ${brandId}`);
    return [];
  }

  const preferredLanguage = brandDesign.preferredLanguage || "en";
  
  const postContents = await generateSamplePostContent(brand, brandDesign, preferredLanguage);
  if (postContents.length === 0) {
    console.error(`[SamplePostGenerator] No post content generated`);
    return [];
  }

  const generatedPosts: GeneratedSamplePost[] = [];

  for (const post of postContents) {
    console.log(`[SamplePostGenerator] Generating image for ${post.platform}...`);
    
    const imageDataUrl = await generateSampleImage(post.imagePrompt, brandDesign, post.platform);
    
    if (!imageDataUrl) {
      console.warn(`[SamplePostGenerator] Could not generate image for ${post.platform}`);
      continue;
    }

    const cloudinaryResult = await uploadToCloudinary(imageDataUrl, brandId, post.platform);
    
    if (!cloudinaryResult) {
      console.warn(`[SamplePostGenerator] Could not upload image for ${post.platform}`);
      continue;
    }

    generatedPosts.push({
      platform: post.platform,
      titulo: post.titulo,
      content: post.content,
      hashtags: post.hashtags,
      imageUrl: cloudinaryResult.url,
      cloudinaryPublicId: cloudinaryResult.publicId,
    });

    console.log(`[SamplePostGenerator] Generated sample post for ${post.platform}`);
  }

  return generatedPosts;
}

export async function createAndStoreSamplePosts(brandId: string): Promise<boolean> {
  try {
    const existingSamples = await storage.getSamplePostsForBrand(brandId);
    if (existingSamples && existingSamples.length > 0) {
      console.log(`[SamplePostGenerator] Brand ${brandId} already has sample posts, skipping`);
      return true;
    }

    const generatedPosts = await generateSamplePosts(brandId);
    
    if (generatedPosts.length === 0) {
      console.error(`[SamplePostGenerator] No posts were generated for brand ${brandId}`);
      return false;
    }

    const job = await storage.createPostGeneratorJob(brandId);
    if (!job) {
      console.error(`[SamplePostGenerator] Could not create job for brand ${brandId}`);
      return false;
    }

    const days = ["monday", "tuesday", "wednesday"];
    
    for (let i = 0; i < generatedPosts.length; i++) {
      const post = generatedPosts[i];
      await storage.createAiGeneratedPost({
        jobId: job.id,
        brandId,
        platform: post.platform,
        titulo: post.titulo,
        content: post.content,
        imageUrl: post.imageUrl,
        cloudinaryPublicId: post.cloudinaryPublicId,
        dia: days[i] || "monday",
        hashtags: post.hashtags,
        status: "pending",
        isSample: true,
      });
    }

    await storage.updatePostGeneratorJob(job.id, { status: "completed" });
    
    console.log(`[SamplePostGenerator] Successfully created ${generatedPosts.length} sample posts for brand ${brandId}`);
    return true;
  } catch (error) {
    console.error(`[SamplePostGenerator] Error creating sample posts:`, error);
    return false;
  }
}
