import { GoogleGenAI, Modality } from "@google/genai";
import { storage } from "../storage";
import { generateContentWithRetry } from "./aiRetry";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Industry-specific design suggestions
const getIndustryGuidelines = (industry: string | null | undefined): string => {
  const industryLower = (industry || "").toLowerCase();
  
  const industryMap: Record<string, string> = {
    "healthcare": "Use clean, trustworthy symbols like shields, hearts, or abstract medical icons. Convey professionalism and care.",
    "health": "Use clean, trustworthy symbols like shields, hearts, or abstract medical icons. Convey professionalism and care.",
    "medical": "Use clean, trustworthy symbols like shields, hearts, or abstract medical icons. Convey professionalism and care.",
    "clinic": "Use clean, trustworthy symbols like shields, hearts, or abstract medical icons. Convey professionalism and care.",
    "dental": "Use clean, tooth-inspired or smile-related symbols. Convey hygiene, trust, and modern care.",
    "restaurant": "Use culinary-inspired symbols like utensils, plates, or abstract food shapes. Convey warmth and appetite appeal.",
    "food": "Use culinary-inspired symbols like utensils, plates, or abstract food shapes. Convey warmth and appetite appeal.",
    "cafe": "Use coffee-inspired or cozy symbols. Convey warmth, comfort, and artisanal quality.",
    "coffee": "Use coffee-inspired or cozy symbols. Convey warmth, comfort, and artisanal quality.",
    "tech": "Use geometric, modern, and innovative symbols. Convey innovation and forward-thinking.",
    "technology": "Use geometric, modern, and innovative symbols. Convey innovation and forward-thinking.",
    "software": "Use geometric, modern, and innovative symbols. Convey innovation and forward-thinking.",
    "fashion": "Use elegant, stylized typography or abstract fashion symbols. Convey sophistication and style.",
    "beauty": "Use elegant, flowing lines or abstract beauty symbols. Convey elegance and refinement.",
    "salon": "Use elegant, flowing lines or abstract beauty symbols. Convey elegance and refinement.",
    "spa": "Use calming, organic shapes. Convey relaxation and wellness.",
    "fitness": "Use dynamic, energetic shapes or abstract movement symbols. Convey strength and vitality.",
    "gym": "Use dynamic, energetic shapes or abstract movement symbols. Convey strength and vitality.",
    "real estate": "Use architectural, building, or home-inspired symbols. Convey stability and trust.",
    "construction": "Use strong, structural shapes or building-inspired symbols. Convey reliability and strength.",
    "legal": "Use balanced, authoritative symbols like scales or pillars. Convey trust and professionalism.",
    "law": "Use balanced, authoritative symbols like scales or pillars. Convey trust and professionalism.",
    "finance": "Use stable, growth-oriented symbols. Convey trust and prosperity.",
    "banking": "Use stable, growth-oriented symbols. Convey trust and prosperity.",
    "education": "Use knowledge-inspired symbols like books or abstract learning icons. Convey wisdom and growth.",
    "retail": "Use approachable, customer-focused symbols. Convey accessibility and quality.",
    "ecommerce": "Use modern, digital-forward symbols. Convey convenience and innovation.",
    "jewelry": "Use elegant, precious-inspired symbols or refined typography. Convey luxury and craftsmanship.",
    "automotive": "Use dynamic, movement-inspired symbols. Convey speed, reliability, and innovation.",
  };

  for (const [key, value] of Object.entries(industryMap)) {
    if (industryLower.includes(key)) {
      return value;
    }
  }

  return "Create a versatile, memorable symbol that captures the brand's unique essence.";
};

// Logo style options
export type LogoStyle = "minimalist" | "modern" | "classic" | "bold" | "elegant";

const getStyleGuidelines = (style: LogoStyle): string => {
  const styleMap: Record<LogoStyle, string> = {
    minimalist: `
- Extreme simplicity with maximum impact
- Single geometric shape or letterform
- Abundant negative space
- Think: Apple, Nike, Mercedes-Benz`,
    modern: `
- Contemporary design with clean lines
- Geometric shapes with subtle curves
- Bold typography with unique character
- Think: Spotify, Airbnb, Uber`,
    classic: `
- Timeless elegance with refined details
- Serif or traditional typography
- Balanced, symmetrical composition
- Think: Rolex, Cartier, Bentley`,
    bold: `
- Strong visual impact with confident shapes
- Heavy typography with presence
- High contrast and visual weight
- Think: FedEx, CNN, Netflix`,
    elegant: `
- Sophisticated and refined aesthetic
- Delicate lines and graceful curves
- Premium, luxurious feel
- Think: Chanel, Dior, Tiffany`,
  };

  return styleMap[style] || styleMap.minimalist;
};

interface GenerateLogoOptions {
  style?: LogoStyle;
  useColors?: boolean;
  includeIcon?: boolean;
  includeText?: boolean;
}

const generatePrompt = async (
  brandId: string, 
  userId: string,
  options: GenerateLogoOptions = {}
) => {
  const brand = await storage.getBrandById(brandId, userId);
  if (!brand) throw new Error("Brand not found");

  // Try to get brand design for colors and style context
  let brandDesign = null;
  try {
    brandDesign = await storage.getBrandDesignByBrandId(brandId);
  } catch (e) {
    // Brand design may not exist yet
  }

  const {
    style = "minimalist",
    useColors = false,
    includeIcon = true,
    includeText = true,
  } = options;

  const industryGuidelines = getIndustryGuidelines(brand.industry);
  const styleGuidelines = getStyleGuidelines(style);

  // Build color instructions
  let colorInstructions: string;
  if (useColors && brandDesign?.colorPrimary) {
    const colors = [
      brandDesign.colorPrimary,
      brandDesign.colorAccent1,
      brandDesign.colorAccent2,
    ].filter(Boolean);
    colorInstructions = `
- COLOR PALETTE: Use these brand colors: ${colors.join(", ")}
- Apply colors strategically for visual hierarchy
- Ensure sufficient contrast for legibility`;
  } else {
    colorInstructions = `
- COLOR: Use ONLY absolute black (#000000) or absolute white (#FFFFFF)
- NO colors, no gradients, no shading, no grey tones
- BACKGROUND: Solid black or solid white (high contrast)`;
  }

  // Build composition instructions
  let compositionInstructions: string;
  if (includeIcon && includeText) {
    compositionInstructions = "Create a COMBINATION MARK: icon/symbol + brand name text, perfectly balanced.";
  } else if (includeIcon) {
    compositionInstructions = "Create a SYMBOL/ICON only: a standalone graphic mark without text.";
  } else {
    compositionInstructions = "Create a WORDMARK: stylized typography of the brand name only, no icon.";
  }

  return `You are an expert brand identity designer with 20+ years of experience creating logos for Fortune 500 companies and luxury brands.

────────────────────────────────
BRAND INFORMATION
────────────────────────────────
Brand Name: ${brand.name}
Description: ${brand.description || "Premium brand seeking professional identity"}
Industry: ${brand.industry || "Business"}
${brandDesign?.brandStyle ? `Brand Style: ${brandDesign.brandStyle}` : ""}

────────────────────────────────
INDUSTRY-SPECIFIC GUIDANCE
────────────────────────────────
${industryGuidelines}

────────────────────────────────
DESIGN STYLE: ${style.toUpperCase()}
────────────────────────────────
${styleGuidelines}

────────────────────────────────
STRICT VISUAL RULES
────────────────────────────────
${colorInstructions}

COMPOSITION:
- ${compositionInstructions}
- Perfectly balanced proportions
- Clean geometric shapes
- Professional kerning and spacing

TECHNICAL REQUIREMENTS:
- STYLE: Flat, 2D vector-like design
- NO 3D effects, shadows, gradients, or textures
- Clean, crisp edges suitable for any size
- Legible from favicon (16px) to billboard scale
- Centered composition with balanced whitespace

────────────────────────────────
QUALITY STANDARDS
────────────────────────────────
- This logo will represent a real business
- It must look professional and premium
- Think of iconic logos: Apple, Nike, Chanel, Mercedes-Benz
- "Less is more" - every element must have purpose
- The logo should be instantly memorable and unique

────────────────────────────────
OUTPUT
────────────────────────────────
Generate ONE high-resolution, professional logo that perfectly represents "${brand.name}".
The logo must be ready for immediate use in business materials, websites, and marketing.`;
};

// Retry logic with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateAILogo = async (
  brandId: string, 
  userId: string,
  options: GenerateLogoOptions = {},
  maxRetries: number = 3
) => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GenerateLogo] Attempt ${attempt}/${maxRetries} for brand ${brandId}`);
      
      const prompt = await generatePrompt(brandId, userId, options);

      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No image generated - empty candidates");
      }

      const parts = candidates[0].content?.parts;
      const imagePart = parts?.find((p: any) => p.inlineData);

      if (!imagePart || !imagePart.inlineData) {
        throw new Error("No image data in response");
      }

      console.log(`[GenerateLogo] Successfully generated logo for brand ${brandId}`);

      return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
        style: options.style || "minimalist",
      };
    } catch (error) {
      lastError = error as Error;
      console.error(`[GenerateLogo] Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`[GenerateLogo] Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  console.error(`[GenerateLogo] All ${maxRetries} attempts failed for brand ${brandId}`);
  throw lastError || new Error("Failed to generate logo after multiple attempts");
};

// Generate multiple logo variations
export const generateLogoVariations = async (
  brandId: string,
  userId: string,
  count: number = 3
): Promise<Array<{ base64: string; mimeType: string; style: LogoStyle }>> => {
  const styles: LogoStyle[] = ["minimalist", "modern", "elegant", "bold", "classic"];
  const selectedStyles = styles.slice(0, Math.min(count, styles.length));

  console.log(`[GenerateLogo] Generating ${selectedStyles.length} logo variations for brand ${brandId}`);

  const results = await Promise.allSettled(
    selectedStyles.map(style => 
      generateAILogo(brandId, userId, { style }, 2)
    )
  );

  const successfulLogos = results
    .filter((r): r is PromiseFulfilledResult<{ base64: string; mimeType: string; style: LogoStyle }> => 
      r.status === "fulfilled"
    )
    .map(r => r.value);

  if (successfulLogos.length === 0) {
    throw new Error("Failed to generate any logo variations");
  }

  console.log(`[GenerateLogo] Successfully generated ${successfulLogos.length}/${selectedStyles.length} variations`);

  return successfulLogos;
};
