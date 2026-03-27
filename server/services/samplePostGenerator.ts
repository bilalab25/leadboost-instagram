import { GoogleGenAI, Type } from "@google/genai";
import { storage } from "../storage";
import type { BrandDesign, Brand, BrandAsset } from "@shared/schema";
import cloudinary from "../cloudinary";
import { languageInstruction } from "./postGenerator";
import {
  createPostGeneratorJob,
  updatePostGeneratorJob,
} from "../storage/postGeneratorJobs";
import {
  createAiGeneratedPost,
  getSamplePostsByBrand,
} from "../storage/aiGeneratedPosts";
import { BillingService } from "../stripe/billingService";

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

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE INTENT SYSTEM - AI-based semantic classification
// ═══════════════════════════════════════════════════════════════════════════

type ImageIntent =
  | "food_focused" // Restaurants, cafes, bakeries → show dishes/food
  | "product_in_use" // Brands with products → show products being used
  | "venue_atmosphere" // Locations/venues → show the space/ambiance
  | "pet_service" // Pet-related businesses → show pets/animals
  | "lifestyle_scene" // Service brands → lifestyle/people/moments
  | "brand_aesthetic"; // Fallback → abstract/aesthetic brand imagery

// Valid intents for classification (used for validation)
const VALID_INTENTS: ImageIntent[] = [
  "food_focused",
  "product_in_use",
  "venue_atmosphere",
  "pet_service",
  "lifestyle_scene",
  "brand_aesthetic",
];

// Asset category detection
const PRODUCT_CATEGORIES = [
  "product_images",
  "product",
  "products",
  "product_assets",
];
const LOCATION_CATEGORIES = [
  "location",
  "location_images",
  "location_assets",
  "place",
  "venue",
];

/**
 * Check if brand has any usable visual assets (products, locations, or usable logos)
 * Note: Only counts images, not videos or documents (Gemini doesn't accept videos for image generation)
 */
function hasVisualAssets(
  brandAssets: BrandAsset[],
  brandDesign: BrandDesign,
): boolean {
  const hasProducts = brandAssets.some(
    (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase()) && a.assetType === "image",
  );
  const hasLocations = brandAssets.some(
    (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase()) && a.assetType === "image",
  );
  const hasUsableLogo = !!(brandDesign.whiteLogoUrl || brandDesign.blackLogoUrl);

  return hasProducts || hasLocations || hasUsableLogo;
}

// AI-based semantic intent classification
async function classifyImageIntentWithAI(
  industry: string | null,
  brandCategory: string | null,
  description: string | null,
): Promise<{ intent: ImageIntent; reasoning: string }> {
  const inputText = [
    industry && `Industry (sector empresarial): ${industry}`,
    brandCategory &&
      `Brand Category (producto/servicio que vende): ${brandCategory}`,
    description && `Description: ${description}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (!inputText.trim()) {
    return {
      intent: "lifestyle_scene",
      reasoning:
        "No brand information provided. Defaulting to lifestyle imagery.",
    };
  }

  const prompt = `You are a visual content strategist. Classify this brand into ONE visual intent for social media images.

═══════════════════════════════════════════════════════════════════════════
BRAND INFORMATION
═══════════════════════════════════════════════════════════════════════════
${inputText}

IMPORTANT: 
- "Industry" = The business sector (e.g., "Food & Beverage", "Retail", "Technology")
- "Brand Category" = What the company actually sells (e.g., "pizzas", "jewelry", "consulting services")
- PRIORITIZE "Brand Category" when deciding what to show visually, as it defines the actual product/service
- Use "Industry" to understand the broader context

═══════════════════════════════════════════════════════════════════════════
VISUAL INTENTS (choose exactly ONE)
═══════════════════════════════════════════════════════════════════════════
1. food_focused: 
   - When: Brand sells FOOD or DRINKS (restaurants, cafes, bakeries, bars, catering, food trucks)
   - Visual: Appetizing dishes, drinks, ingredients, food preparation
   - Examples: "pizzeria", "café", "comida casera", "postres", "sushi"

2. product_in_use: 
   - When: Brand sells PHYSICAL PRODUCTS (retail, ecommerce, fashion, jewelry, cosmetics, electronics)
   - Visual: Products being used in real-life lifestyle contexts
   - Examples: "tienda de ropa", "joyería", "muebles", "cosméticos", "accesorios"

3. venue_atmosphere: 
   - When: Brand's main offering IS the PHYSICAL SPACE (hotels, spas, gyms, salons, event venues)
   - Visual: Interior/exterior spaces with inviting atmosphere
   - Examples: "hotel", "spa", "gimnasio", "salón de belleza", "coworking"

4. pet_service: 
   - When: Brand works with ANIMALS (veterinarians, pet stores, groomers, pet hotels)
   - Visual: Happy pets, animals being cared for
   - Examples: "veterinaria", "grooming", "tienda de mascotas", "guardería canina"

5. lifestyle_scene: 
   - When: Brand sells SERVICES or EXPERIENCES (consulting, coaching, education, healthcare, tech)
   - Visual: People, moments, aspirational lifestyle scenes
   - Examples: "consultoría", "coaching", "agencia de marketing", "educación"

6. brand_aesthetic: 
   - When: NONE of the above clearly apply (LAST RESORT)
   - Visual: Abstract, artistic brand imagery with brand colors
   - Use sparingly - prefer lifestyle_scene when uncertain

═══════════════════════════════════════════════════════════════════════════
CLASSIFICATION RULES
═══════════════════════════════════════════════════════════════════════════
1. Brand Category > Industry when deciding visuals
2. Be flexible with language (Spanish, English, informal text all valid)
3. When uncertain, prefer lifestyle_scene over brand_aesthetic
4. brand_aesthetic is the ABSOLUTE last resort

Return JSON: { intent: string, reasoning: string }`;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: {
              type: Type.STRING,
              description:
                "One of: food_focused, product_in_use, venue_atmosphere, pet_service, lifestyle_scene, brand_aesthetic",
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of classification",
            },
          },
          required: ["intent", "reasoning"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      console.warn("[IntentClassifier] No response from AI, using fallback");
      return {
        intent: "lifestyle_scene",
        reasoning: "AI classification unavailable. Using safe fallback.",
      };
    }

    const parsed = JSON.parse(text);
    const classifiedIntent = parsed.intent?.toLowerCase() as ImageIntent;

    // Validate the intent is in our allowed list
    if (!VALID_INTENTS.includes(classifiedIntent)) {
      console.warn(
        `[IntentClassifier] Invalid intent "${classifiedIntent}", using fallback`,
      );
      return {
        intent: "lifestyle_scene",
        reasoning: `AI returned invalid intent. Using lifestyle fallback. Original: ${parsed.reasoning || "unknown"}`,
      };
    }

    return {
      intent: classifiedIntent,
      reasoning: parsed.reasoning || `Classified as ${classifiedIntent}`,
    };
  } catch (error) {
    console.error("[IntentClassifier] AI classification error:", error);
    return {
      intent: "lifestyle_scene",
      reasoning: "Classification error. Using safe lifestyle fallback.",
    };
  }
}

// Main intent detection function (combines AI + asset detection)
async function detectImageIntent(
  brand: Brand,
  brandAssets: BrandAsset[],
): Promise<{ intent: ImageIntent; reasoning: string }> {
  // Check what assets the brand has (this can override AI classification)
  // Only count images, not videos or documents
  const hasProductAssets = brandAssets.some(
    (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase()) && a.assetType === "image",
  );
  const hasLocationAssets = brandAssets.some(
    (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase()) && a.assetType === "image",
  );

  // Step 1: Get AI classification based on brand info
  const aiClassification = await classifyImageIntentWithAI(
    brand.industry || null,
    brand.brandCategory || null,
    brand.description || null,
  );

  // Step 2: Override with asset-based logic if applicable
  // If brand has product assets, ensure we use product_in_use regardless of AI classification
  if (hasProductAssets && aiClassification.intent !== "product_in_use") {
    return {
      intent: "product_in_use",
      reasoning: `Brand has product assets uploaded. Overriding AI classification (${aiClassification.intent}) to show products.`,
    };
  }

  // If brand has location assets and AI didn't pick venue, consider overriding
  if (
    hasLocationAssets &&
    aiClassification.intent !== "venue_atmosphere" &&
    aiClassification.intent !== "food_focused"
  ) {
    return {
      intent: "venue_atmosphere",
      reasoning: `Brand has venue/location assets. Overriding to showcase the space.`,
    };
  }

  // Return AI classification
  return aiClassification;
}

function getIntentPromptGuidance(intent: ImageIntent, brand: Brand): string {
  const brandName = brand.name || "the brand";
  const category = brand.brandCategory || brand.industry || "business";

  switch (intent) {
    case "food_focused":
      return `
VISUAL FOCUS: FOOD & CULINARY CONTENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a mouth-watering food photography image that looks like real restaurant/food brand social media content.

MUST INCLUDE:
- A beautifully styled dish, drink, or food item as the MAIN SUBJECT
- Professional food photography lighting (soft, appetizing)
- Natural setting: table, counter, or styled food flat-lay
- Fresh ingredients, garnishes, or food textures visible

STYLE REFERENCE:
- Think: Instagram food influencers, Bon Appétit, restaurant social feeds
- Warm, inviting colors that make food look delicious
- Close-up or medium shots that show food detail

DO NOT:
- Make the logo the main subject
- Create generic brand posters
- Use text overlays or promotional graphics`;

    case "product_in_use":
      return `
VISUAL FOCUS: PRODUCT IN NATURAL USE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create an image showing a product being used or displayed in a real-life context.

MUST INCLUDE:
- A product (relevant to ${category}) as the MAIN SUBJECT
- Natural, lifestyle setting showing the product in use
- Human element if appropriate (hands, person using product)
- Context that tells a story (morning routine, workspace, outdoor adventure)

STYLE REFERENCE:
- Think: lifestyle product photography, brand lookbooks
- Natural lighting, authentic moments
- The product should be the star, but in a natural scene

DO NOT:
- Create logo-centric brand posters
- Use white backgrounds like catalog shots
- Make it look like an advertisement`;

    case "venue_atmosphere":
      return `
VISUAL FOCUS: SPACE & ATMOSPHERE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create an inviting image of a space/venue that captures its atmosphere and vibe.

MUST INCLUDE:
- An interior or exterior space as the MAIN SUBJECT
- Atmospheric lighting (warm, moody, or bright depending on brand)
- Details that show the venue's character (decor, furniture, ambiance)
- A sense of "I want to be there" feeling

STYLE REFERENCE:
- Think: hotel Instagram, spa marketing, gym interiors
- Architectural photography with lifestyle feel
- Show the experience of being in the space

DO NOT:
- Make it about the logo
- Create flat, generic room shots
- Add text or promotional elements`;

    case "pet_service":
      return `
VISUAL FOCUS: PETS & ANIMALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create an adorable, heartwarming image featuring pets that looks like real pet-focused social media content.

MUST INCLUDE:
- A cute, happy pet (dog, cat, or relevant animal) as the MAIN SUBJECT
- Natural, candid pet moments (playing, relaxing, being groomed, etc.)
- Clean, well-lit environment (home, outdoors, or professional setting)
- Warm, inviting atmosphere that pet owners love

STYLE REFERENCE:
- Think: @dogsofinstagram, pet influencer accounts, veterinary clinic social
- Authentic pet photography with personality
- Focus on the animal's expression and character

DO NOT:
- Make the logo the main subject
- Use clinical or sterile imagery
- Create generic stock-like pet photos`;

    case "lifestyle_scene":
      return `
VISUAL FOCUS: LIFESTYLE & PEOPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create an aspirational lifestyle image that represents ${brandName}'s target audience.

MUST INCLUDE:
- People or lifestyle moments as the MAIN SUBJECT
- Emotions and authentic moments (working, relaxing, achieving, connecting)
- Environment that matches the brand's vibe (modern office, outdoor, home)
- Professional but candid photography style

STYLE REFERENCE:
- Think: stock photography that doesn't look like stock
- Brand campaign lifestyle shots
- Authentic, diverse, relatable moments

DO NOT:
- Make it logo-centric
- Create corporate or sterile imagery
- Use obvious posed/fake expressions`;

    case "brand_aesthetic":
    default:
      return `
VISUAL FOCUS: BRAND AESTHETIC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create a visually striking image that captures ${brandName}'s brand aesthetic.

MUST INCLUDE:
- Abstract or artistic visual as the MAIN SUBJECT
- Brand colors incorporated naturally (not as overlays)
- Textures, patterns, or gradients that feel premium
- A mood/atmosphere that matches the brand personality

STYLE REFERENCE:
- Think: Apple's product photography backgrounds
- Artistic gradients, light play, abstract shapes
- Premium, sophisticated visual language

DO NOT:
- Put the logo front and center
- Create a "brand poster" with logo and tagline
- Use cheap or generic stock imagery style`;
  }
}

function getLogoPlacementGuidance(intent: ImageIntent): string {
  // Logo should NEVER be the protagonist
  const baseRule = `
LOGO PLACEMENT RULES (CRITICAL):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- The logo is NOT the main subject of this image
- If the logo appears, it must be SUBTLE and SECONDARY
- Maximum 5% of the image area for logo
- Placement: corner, on a product label, embossed on surface, or not at all
- The image should work perfectly WITHOUT the logo visible

ACCEPTABLE logo integrations:
- Small watermark in corner (10% opacity)
- On product packaging/label naturally
- Embossed/engraved on a physical surface
- On a tag, label, or business card in the scene
- NOT visible at all (this is often the best choice)

FORBIDDEN:
- Logo as the center/focal point
- Logo floating over the image
- Logo taking more than 5% of the frame
- Logo with glowing effects or emphasis
`;

  return baseRule;
}

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

async function fetchImageAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.error("[SamplePostGenerator] Error fetching image:", error);
    return null;
  }
}

async function generateSamplePostContent(
  brand: Brand,
  brandDesign: BrandDesign,
  preferredLanguage: string,
  brandAssets: BrandAsset[],
): Promise<SamplePostContent[]> {
  const languageLabel = languageInstruction(preferredLanguage);

  const hasProducts = brandAssets.some(
    (a) =>
      a.category &&
      ["product_images", "product", "products"].includes(a.category),
  );

  const productContext = hasProducts
    ? "The brand has uploaded product images that should be featured in the posts."
    : "The brand doesn't have product images yet, so focus on brand awareness and engagement content.";

  const prompt = `You are a social media expert creating sample posts for a new brand.
  
Brand Information:
- Name: ${brand.name}
- Industry/Category: ${brand.brandCategory || brand.industry || "general business"}
- Description: ${brand.description || "A modern brand connecting with customers"}
- Style: ${brandDesign.brandStyle || "modern and professional"}
- Colors: Primary ${brandDesign.colorPrimary || "#4F46E5"}, Accent ${brandDesign.colorAccent1 || "#7C3AED"}

${productContext}

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
- imagePrompt: A detailed description for generating a professional marketing image that matches this post. ${hasProducts ? "Include the brand products in the scene." : "Focus on brand lifestyle and atmosphere."}`;

  try {
    const response = await getAI().models.generateContent({
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
                required: [
                  "platform",
                  "titulo",
                  "content",
                  "hashtags",
                  "imagePrompt",
                ],
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
  brandAssets: BrandAsset[],
  brand: Brand,
  imageIntent: { intent: ImageIntent; reasoning: string },
): Promise<string | null> {
  try {
    const aspectRatios: Record<string, string> = {
      instagram: "1:1 (square, 1080x1080px)",
      facebook: "16:9 (landscape, 1200x628px)",
      whatsapp: "1:1 (square, 1080x1080px)",
    };

    // Only use product assets if brand has them (images only, not videos)
    const productAssets = brandAssets
      .filter(
        (a) =>
          a.category && 
          PRODUCT_CATEGORIES.includes(a.category.toLowerCase()) &&
          (!a.assetType || a.assetType === "image"), // Filter out videos and documents
      )
      .slice(0, 2);

    // Only use location assets if brand has them (images only, not videos)
    const locationAssets = brandAssets
      .filter(
        (a) =>
          a.category && 
          LOCATION_CATEGORIES.includes(a.category.toLowerCase()) &&
          (!a.assetType || a.assetType === "image"), // Filter out videos and documents
      )
      .slice(0, 1);

    const logoUrl =
      brandDesign.whiteLogoUrl ||
      brandDesign.blackLogoUrl ||
      brandDesign.logoUrl;

    // Get intent-specific prompt guidance
    const intentGuidance = getIntentPromptGuidance(imageIntent.intent, brand);
    const logoGuidance = getLogoPlacementGuidance(imageIntent.intent);

    const enhancedPrompt = `You are creating a social media image for ${brand.name || "a brand"}.
This image should look like REAL SOCIAL MEDIA CONTENT, not a brand poster or advertisement.

═══════════════════════════════════════════════════════════════════════════
IMAGE SPECIFICATIONS
═══════════════════════════════════════════════════════════════════════════
- Platform: ${platform.toUpperCase()}
- Aspect ratio: ${aspectRatios[platform] || "1:1 (square)"}
- Style: ${brandDesign.brandStyle || "modern and professional"}
- Color palette: Primary ${brandDesign.colorPrimary || "#4F46E5"}, Accent ${brandDesign.colorAccent1 || "#7C3AED"}

═══════════════════════════════════════════════════════════════════════════
${intentGuidance}
═══════════════════════════════════════════════════════════════════════════

ORIGINAL SCENE IDEA (use as inspiration):
${imagePrompt}

═══════════════════════════════════════════════════════════════════════════
${logoGuidance}
═══════════════════════════════════════════════════════════════════════════

CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. The image MUST look like organic social media content
2. The MAIN SUBJECT must match the intent (${imageIntent.intent.replace(/_/g, " ")})
3. NO text, words, or typography in the image
4. NO promotional graphics or poster-style layouts
5. Professional photography quality with natural lighting
6. The logo is SECONDARY or ABSENT - never the focal point
${productAssets.length > 0 ? "7. If product assets are provided, feature them naturally in the scene" : ""}
${locationAssets.length > 0 ? "7. If location assets are provided, use them as the setting/backdrop" : ""}

REMEMBER: This should look like content a brand would actually post on social media,
NOT like an advertisement or brand poster. Think Instagram feed, not billboard.`;

    const contentParts: any[] = [];

    // Add product assets ONLY if brand has them
    if (productAssets.length > 0) {
      console.log(
        `[SampleImage] Loading ${productAssets.length} product assets`,
      );
      for (const asset of productAssets) {
        if (asset.url) {
          const imageData = await fetchImageAsBase64(asset.url);
          if (imageData) {
            contentParts.push({
              inlineData: {
                data: imageData.data,
                mimeType: imageData.mimeType,
              },
            });
            contentParts.push({
              text: `PRODUCT IMAGE: This is the brand's actual product. Feature it as the main subject in a natural, lifestyle context. Do NOT modify the product's appearance.`,
            });
          }
        }
      }
    }

    // Add location assets ONLY if brand has them
    if (locationAssets.length > 0) {
      console.log(
        `[SampleImage] Loading ${locationAssets.length} location assets`,
      );
      for (const asset of locationAssets) {
        if (asset.url) {
          const imageData = await fetchImageAsBase64(asset.url);
          if (imageData) {
            contentParts.push({
              inlineData: {
                data: imageData.data,
                mimeType: imageData.mimeType,
              },
            });
            contentParts.push({
              text: `LOCATION IMAGE: This is the brand's actual venue/space. Use it as the setting, maintaining its character but enhancing atmosphere and lighting.`,
            });
          }
        }
      }
    }

    // Add logo ONLY for subtle integration (not as main subject)
    if (logoUrl && imageIntent.intent !== "food_focused") {
      // For food images, often better without logo
      const logoData = await fetchImageAsBase64(logoUrl);
      if (logoData) {
        contentParts.push({
          inlineData: {
            data: logoData.data,
            mimeType: logoData.mimeType,
          },
        });
        contentParts.push({
          text: `BRAND LOGO: You MAY subtly incorporate this logo (corner watermark, product label, embossed on surface). It is OPTIONAL and must never be the main subject. If unsure, leave it out entirely.`,
        });
      }
    }

    contentParts.push({ text: enhancedPrompt });

    // Retry logic with exponential backoff
    const MAX_RETRIES = 3;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await getAI().models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: contentParts,
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: platform === "facebook" ? "16:9" : "1:1", imageSize: "2K" },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const base64Data = part.inlineData.data;
              const dataUrl = `data:image/png;base64,${base64Data}`;
              return dataUrl;
            }
          }
        }

        console.warn(
          `[SampleImage] No image in response for attempt ${attempt}`,
        );
      } catch (retryError: any) {
        console.error(
          `[SampleImage] Error on attempt ${attempt}:`,
          retryError?.message || retryError,
        );

        // Only retry on 500 errors
        if (retryError?.status !== 500 || attempt === MAX_RETRIES) {
          if (attempt === MAX_RETRIES) {
            console.error("[SampleImage] All retries failed");
          }
          break;
        }
      }

      // Exponential backoff: 2s, 4s, 8s
      const backoffMs = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
      await delay(backoffMs);
    }

    return null;
  } catch (error) {
    console.error("[SamplePostGenerator] Error generating image:", error);
    return null;
  }
}

/**
 * SIMPLIFIED IMAGE GENERATION FOR BRANDS WITH NO VISUAL ASSETS
 * When a brand has no products, locations, or usable logos,
 * skip all advanced logic and generate organic lifestyle imagery.
 */
async function generateSimpleOrganicImage(
  imagePrompt: string,
  brandDesign: BrandDesign,
  platform: string,
  brand: Brand,
): Promise<string | null> {
  try {
    const aspectRatios: Record<string, string> = {
      instagram: "1:1 (square, 1080x1080px)",
      facebook: "16:9 (landscape, 1200x628px)",
      whatsapp: "1:1 (square, 1080x1080px)",
    };

    const industryContext =
      brand.brandCategory || brand.industry || "general business";
    const brandDescription = brand.description || "";

    const simplePrompt = `Create a beautiful, natural social media photo for a ${industryContext} business.

SCENE CONTEXT:
${brandDescription ? `Business description: ${brandDescription}` : ""}
Original idea: ${imagePrompt}

IMAGE REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Platform: ${platform.toUpperCase()}
- Aspect ratio: ${aspectRatios[platform] || "1:1 (square)"}
- Style: Natural, authentic, lifestyle photography
- Color mood: Warm and inviting, subtle use of ${brandDesign.colorPrimary || "brand colors"}

MUST FOLLOW:
1. Create an ORGANIC, REALISTIC scene that represents this type of business
2. Show a moment that feels natural and unstaged
3. Professional photography quality with beautiful natural lighting
4. People, environments, or objects that feel authentic to the industry

ABSOLUTELY DO NOT:
1. Include ANY logos, brand names, or text
2. Create promotional graphics or poster-style layouts
3. Use artificial or stock-photo-like compositions
4. Add watermarks, badges, or brand elements
5. Make it look like an advertisement

Think: What would a ${industryContext} business authentically share on their Instagram?
Create THAT kind of image - organic, engaging, real.`;

    const MAX_RETRIES = 3;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await getAI().models.generateContent({
          model: "gemini-3-pro-image-preview",
          contents: [{ text: simplePrompt }],
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: platform === "facebook" ? "16:9" : "1:1", imageSize: "2K" },
          },
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              const base64Data = part.inlineData.data;
              const dataUrl = `data:image/png;base64,${base64Data}`;
              return dataUrl;
            }
          }
        }

        console.warn(
          `[SimpleOrganic] No image in response for attempt ${attempt}`,
        );
      } catch (retryError: any) {
        console.error(
          `[SimpleOrganic] Error on attempt ${attempt}:`,
          retryError?.message || retryError,
        );

        if (retryError?.status !== 500 || attempt === MAX_RETRIES) {
          if (attempt === MAX_RETRIES) {
            console.error("[SimpleOrganic] All retries failed");
          }
          break;
        }
      }

      const backoffMs = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
      await delay(backoffMs);
    }

    return null;
  } catch (error) {
    console.error("[SimpleOrganic] Error generating image:", error);
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
  console.log(
    `[SamplePostGenerator] Starting sample post generation for brand ${brandId}`,
  );

  const brand = await storage.getBrandByIdOnly(brandId);
  if (!brand) {
    console.error(`[SamplePostGenerator] Brand ${brandId} not found`);
    return [];
  }

  const brandDesign = await storage.getBrandDesignByBrandId(brandId);
  if (!brandDesign) {
    console.error(
      `[SamplePostGenerator] Brand design not found for ${brandId}`,
    );
    return [];
  }

  let brandAssets: BrandAsset[] = [];
  try {
    brandAssets = await storage.getAssetsByBrandId(brandId);
  } catch (_e) {
    // No assets found for brand - continue with empty array
  }

  const preferredLanguage = brandDesign.preferredLanguage || "en";

  // Check if brand has any visual assets
  const brandHasVisualAssets = hasVisualAssets(brandAssets, brandDesign);
  // Only run intent detection if brand has visual assets
  let imageIntent: { intent: ImageIntent; reasoning: string } | null = null;

  if (brandHasVisualAssets) {
    // Full intent detection path for brands WITH assets
    imageIntent = await detectImageIntent(brand, brandAssets);
  } else {
    // Simplified path for brands WITHOUT assets
    console.log(
      `[SamplePostGenerator] No visual assets - using simplified organic path`,
    );
  }

  const postContents = await generateSamplePostContent(
    brand,
    brandDesign,
    preferredLanguage,
    brandAssets,
  );
  if (postContents.length === 0) {
    console.error(`[SamplePostGenerator] No post content generated`);
    return [];
  }

  const generatedPosts: GeneratedSamplePost[] = [];

  for (const post of postContents) {
    let imageDataUrl: string | null = null;

    if (brandHasVisualAssets && imageIntent) {
      // Full path with intent-based generation
      imageDataUrl = await generateSampleImage(
        post.imagePrompt,
        brandDesign,
        post.platform,
        brandAssets,
        brand,
        imageIntent,
      );
    } else {
      // Simplified path: organic lifestyle imagery, no branding
      imageDataUrl = await generateSimpleOrganicImage(
        post.imagePrompt,
        brandDesign,
        post.platform,
        brand,
      );
    }

    if (!imageDataUrl) {
      console.warn(
        `[SamplePostGenerator] Could not generate image for ${post.platform}`,
      );
      continue;
    }

    const cloudinaryResult = await uploadToCloudinary(
      imageDataUrl,
      brandId,
      post.platform,
    );

    if (!cloudinaryResult) {
      console.warn(
        `[SamplePostGenerator] Could not upload image for ${post.platform}`,
      );
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
  }

  return generatedPosts;
}

// Track in-flight generation to prevent duplicate concurrent requests
const inFlightGenerations = new Set<string>();

export async function startSamplePostGeneration(
  brandId: string,
): Promise<{ jobId: string } | null> {
  try {
    // Prevent concurrent duplicate generation for the same brand
    if (inFlightGenerations.has(brandId)) {
      return null;
    }

    const existingSamples = await getSamplePostsByBrand(brandId);
    if (existingSamples && existingSamples.length > 0) {
      return null;
    }

    inFlightGenerations.add(brandId);

    const job = await createPostGeneratorJob(brandId);
    if (!job) {
      inFlightGenerations.delete(brandId);
      console.error(
        `[SamplePostGenerator] Could not create job for brand ${brandId}`,
      );
      return null;
    }

    processSamplePostsAsync(brandId, job.id)
      .catch((err) => {
        console.error(`[SamplePostGenerator] Unhandled error for brand ${brandId}:`, err);
      })
      .finally(() => {
        inFlightGenerations.delete(brandId);
      });

    return { jobId: job.id };
  } catch (error) {
    console.error(
      `[SamplePostGenerator] Error starting sample post generation:`,
      error,
    );
    return null;
  }
}

async function processSamplePostsAsync(
  brandId: string,
  jobId: string,
): Promise<void> {
  try {
    const generatedPosts = await generateSamplePosts(brandId);

    if (generatedPosts.length === 0) {
      console.error(
        `[SamplePostGenerator] No posts were generated for brand ${brandId}`,
      );
      await updatePostGeneratorJob(jobId, {
        status: "failed",
        error: "No posts generated",
      });
      return;
    }

    const days = ["monday", "tuesday", "wednesday"];

    for (let i = 0; i < generatedPosts.length; i++) {
      const post = generatedPosts[i];
      await createAiGeneratedPost({
        jobId: jobId,
        brandId,
        platform: post.platform,
        titulo: post.titulo,
        content: post.content,
        imageUrl: post.imageUrl,
        cloudinaryPublicId: post.cloudinaryPublicId || null,
        dia: days[i] || "monday",
        hashtags: post.hashtags,
        status: "pending",
        isSample: true,
      });
    }

    await updatePostGeneratorJob(jobId, { status: "completed" });

    // Record billing AFTER successful generation (Bug 20: avoid charging for failures)
    if (generatedPosts.length > 0) {
      try {
        const billingService = new BillingService();
        await billingService.recordImageGeneration(
          brandId,
          "/api/generate-sample-posts",
          generatedPosts.length,
        );
      } catch (billingError) {
        console.error("[SamplePostGenerator] Billing recording failed:", billingError);
      }
    }

    console.log(
      `[SamplePostGenerator] Successfully created ${generatedPosts.length} sample posts for brand ${brandId}`,
    );
  } catch (error) {
    console.error(
      `[SamplePostGenerator] Error processing sample posts:`,
      error,
    );
    await updatePostGeneratorJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function createAndStoreSamplePosts(
  brandId: string,
): Promise<boolean> {
  const result = await startSamplePostGeneration(brandId);
  return result !== null;
}
