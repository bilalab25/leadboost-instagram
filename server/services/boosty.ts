import { GoogleGenAI, Modality } from "@google/genai";
import { db } from "../db";
import {
  brands,
  brandDesigns,
  brandAssets,
  integrations,
  posIntegrations,
  posCustomers,
  salesTransactions,
  contentPlans,
  campaigns,
  conversations,
} from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Asset interface for image generation (same pattern as postGenerator.ts)
interface BrandAssetForImage {
  url: string;
  name: string;
  category?: string;
  assetType?: string;
}

interface BrandContext {
  brand: {
    name: string;
    industry?: string;
    description?: string;
  };
  design: {
    brandStyle?: string;
    colors: {
      primary?: string;
      accent1?: string;
      accent2?: string;
      text1?: string;
    };
    fonts: {
      primary?: string;
      secondary?: string;
    };
    hasLogo: boolean;
    logoUrl?: string;
    whiteLogoUrl?: string;
    blackLogoUrl?: string;
  } | null;
  assets: {
    totalCount: number;
    categories: string[];
  };
  // Full asset data for image generation (images only, no videos)
  imageAssets: BrandAssetForImage[];
  integrations: {
    connected: string[];
  };
  sales: {
    last30Days: {
      totalRevenue: number;
      transactionCount: number;
      topProducts: string[];
    };
    customerCount: number;
  } | null;
  contentPlans: {
    activeCount: number;
  };
  campaigns: {
    activeCount: number;
  };
  conversations: {
    unreadCount: number;
    recentPlatforms: string[];
  };
}

// Asset category constants (same as postGenerator.ts)
const PRODUCT_CATEGORIES = ["product_images", "products", "product", "product_assets"];
const LOCATION_CATEGORIES = ["location", "location_images", "location_assets", "place", "venue"];
const TEMPLATE_CATEGORIES = ["inspiration_templates", "templates", "inspiration"];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  text: string;
  image?: string;
  imagePrompt?: string;
}

const IMAGE_REQUEST_PATTERNS = {
  es: [
    /genera(r)?\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n|contenido visual|dise[ñn]o|gr[aá]fica|banner|story|stories|reel)/i,
    /crea(r)?\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n|contenido visual|dise[ñn]o|gr[aá]fica|banner|story|stories|reel)/i,
    /haz(me)?\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n|contenido visual|dise[ñn]o|gr[aá]fica|banner|story|stories|reel)/i,
    /quiero\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n|contenido visual)/i,
    /necesito\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n|contenido visual)/i,
    /dise[ñn]a(me)?\s*(la|el|una?|esa?)?\s*(imagen|foto|post|publicaci[oó]n)/i,
    /genera(r)?\s*(eso|esto)/i,
  ],
  en: [
    /generate\s*(the|an?|that|this)?\s*(image|photo|post|visual|design|graphic|banner|story|stories|reel)/i,
    /create\s*(the|an?|that|this)?\s*(image|photo|post|visual|design|graphic|banner|story|stories|reel)/i,
    /make\s*(me\s*)?(the|an?|that|this)?\s*(image|photo|post|visual|design|graphic|banner|story|stories|reel)/i,
    /i\s*(want|need)\s*(the|an?|that|this)?\s*(image|photo|post|visual)/i,
    /design\s*(me\s*)?(the|an?|that|this)?\s*(image|photo|post|visual)/i,
    /please\s+generate/i,
    /can\s+you\s+generate/i,
    /generate\s+(it|that|this)/i,
  ],
};

export class BoostyService {
  async getBrandContext(
    brandId: string,
    userId: string,
  ): Promise<BrandContext> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      brand,
      design,
      platformIntegrations,
      posIntegration,
      activePlans,
      activeCampaigns,
      recentConversations,
    ] = await Promise.all([
      db.query.brands.findFirst({
        where: eq(brands.id, brandId),
      }),
      db.query.brandDesigns.findFirst({
        where: eq(brandDesigns.brandId, brandId),
      }),
      db.query.integrations.findMany({
        where: and(
          eq(integrations.brandId, brandId),
          eq(integrations.isActive, true),
        ),
      }),
      db.query.posIntegrations.findFirst({
        where: and(
          eq(posIntegrations.brandId, brandId),
          eq(posIntegrations.isActive, true),
        ),
      }),
      db.query.contentPlans.findMany({
        where: and(
          eq(contentPlans.brandId, brandId),
          eq(contentPlans.status, "active"),
        ),
      }),
      db.query.campaigns.findMany({
        where: and(
          eq(campaigns.brandId, brandId),
          eq(campaigns.status, "active"),
        ),
      }),
      db.query.conversations.findMany({
        where: eq(conversations.brandId, brandId),
        orderBy: [desc(conversations.lastMessageAt)],
        limit: 50,
      }),
    ]);

    const assets = design
      ? await db.query.brandAssets.findMany({
          where: eq(brandAssets.brandDesignId, design.id),
        })
      : [];

    let salesData: (typeof salesTransactions.$inferSelect)[] = [];
    let customers: (typeof posCustomers.$inferSelect)[] = [];

    if (posIntegration) {
      [salesData, customers] = await Promise.all([
        db.query.salesTransactions.findMany({
          where: and(
            eq(salesTransactions.posIntegrationId, posIntegration.id),
            gte(salesTransactions.transactionDate, thirtyDaysAgo),
          ),
          orderBy: [desc(salesTransactions.totalAmount)],
          limit: 100,
        }),
        db.query.posCustomers.findMany({
          where: eq(posCustomers.posIntegrationId, posIntegration.id),
        }),
      ]);
    }

    const assetCategories = Array.from(
      new Set(assets.map((a) => a.category).filter(Boolean)),
    ) as string[];
    const connectedPlatforms = platformIntegrations.map((i) => i.provider);

    const totalRevenue =
      salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / 100;
    const topProducts: string[] = [];

    if (salesData.length > 0) {
      const productCounts = new Map<string, number>();
      for (const sale of salesData) {
        const items = (sale.items as any[]) || [];
        for (const item of items) {
          const name = item.name || item.product_id || "Unknown";
          productCounts.set(
            name,
            (productCounts.get(name) || 0) + (item.quantity || 1),
          );
        }
      }
      const sorted = Array.from(productCounts.entries()).sort(
        (a, b) => b[1] - a[1],
      );
      topProducts.push(...sorted.slice(0, 5).map(([name]) => name));
    }

    const unreadCount = recentConversations.reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0,
    );
    const recentPlatforms = Array.from(
      new Set(recentConversations.map((c) => c.platform)),
    );

    // Filter assets to only include images (not videos or documents) for image generation
    const imageOnlyAssets: BrandAssetForImage[] = assets
      .filter((a) => a.assetType === "image")
      .map((a) => ({
        url: a.url,
        name: a.name,
        category: a.category || undefined,
        assetType: a.assetType || undefined,
      }));

    return {
      brand: {
        name: brand?.name || "Mi Marca",
        industry: brand?.industry || undefined,
        description: brand?.description || undefined,
      },
      design: design
        ? {
            brandStyle: design.brandStyle || undefined,
            colors: {
              primary: design.colorPrimary || undefined,
              accent1: design.colorAccent1 || undefined,
              accent2: design.colorAccent2 || undefined,
              text1: design.colorText1 || undefined,
            },
            fonts: {
              primary: design.fontPrimary || undefined,
              secondary: design.fontSecondary || undefined,
            },
            hasLogo: !!(
              design.whiteLogoUrl ||
              design.blackLogoUrl ||
              design.logoUrl
            ),
            logoUrl: design.logoUrl || undefined,
            whiteLogoUrl: design.whiteLogoUrl || undefined,
            blackLogoUrl: design.blackLogoUrl || undefined,
          }
        : null,
      assets: {
        totalCount: assets.length,
        categories: assetCategories,
      },
      // Full image assets for AI image generation
      imageAssets: imageOnlyAssets,
      integrations: {
        connected: connectedPlatforms,
      },
      sales: posIntegration
        ? {
            last30Days: {
              totalRevenue,
              transactionCount: salesData.length,
              topProducts,
            },
            customerCount: customers.length,
          }
        : null,
      contentPlans: {
        activeCount: activePlans.length,
      },
      campaigns: {
        activeCount: activeCampaigns.length,
      },
      conversations: {
        unreadCount,
        recentPlatforms,
      },
    };
  }

  private buildSystemPrompt(
    context: BrandContext,
    language: "es" | "en",
  ): string {
    const isSpanish = language === "es";

    const intro = isSpanish
      ? `Eres Boosty, el asistente de IA amigable y experto en marketing de Lead Boost. Tu personalidad es entusiasta, útil y creativa. Siempre respondes en español.`
      : `You are Boosty, the friendly and expert marketing AI assistant for Lead Boost. Your personality is enthusiastic, helpful, and creative. Always respond in English.`;

    const brandInfo = isSpanish
      ? `
INFORMACIÓN DE LA MARCA "${context.brand.name}":
- Industria: ${context.brand.industry || "No especificada"}
- Descripción: ${context.brand.description || "Sin descripción"}
`
      : `
BRAND INFORMATION FOR "${context.brand.name}":
- Industry: ${context.brand.industry || "Not specified"}
- Description: ${context.brand.description || "No description"}
`;

    let designInfo = "";
    if (context.design) {
      designInfo = isSpanish
        ? `
DISEÑO DE MARCA:
- Estilo: ${context.design.brandStyle || "Moderno"}
- Color principal: ${context.design.colors.primary || "No definido"}
- Colores de acento: ${context.design.colors.accent1 || "N/A"}, ${context.design.colors.accent2 || "N/A"}
- Fuente principal: ${context.design.fonts.primary || "No definida"}
- Tiene logo: ${context.design.hasLogo ? "Sí" : "No"}
`
        : `
BRAND DESIGN:
- Style: ${context.design.brandStyle || "Modern"}
- Primary color: ${context.design.colors.primary || "Not defined"}
- Accent colors: ${context.design.colors.accent1 || "N/A"}, ${context.design.colors.accent2 || "N/A"}
- Primary font: ${context.design.fonts.primary || "Not defined"}
- Has logo: ${context.design.hasLogo ? "Yes" : "No"}
`;
    }

    const assetsInfo = isSpanish
      ? `
ASSETS DE MARCA:
- Total de assets: ${context.assets.totalCount}
- Categorías: ${context.assets.categories.length > 0 ? context.assets.categories.join(", ") : "Sin categorías"}
`
      : `
BRAND ASSETS:
- Total assets: ${context.assets.totalCount}
- Categories: ${context.assets.categories.length > 0 ? context.assets.categories.join(", ") : "No categories"}
`;

    const integrationsInfo = isSpanish
      ? `
INTEGRACIONES CONECTADAS:
${context.integrations.connected.length > 0 ? context.integrations.connected.map((p) => `- ${p}`).join("\n") : "- Ninguna integración conectada"}
`
      : `
CONNECTED INTEGRATIONS:
${context.integrations.connected.length > 0 ? context.integrations.connected.map((p) => `- ${p}`).join("\n") : "- No integrations connected"}
`;

    let salesInfo = "";
    if (context.sales) {
      salesInfo = isSpanish
        ? `
DATOS DE VENTAS (últimos 30 días):
- Ingresos totales: $${context.sales.last30Days.totalRevenue.toLocaleString()}
- Número de transacciones: ${context.sales.last30Days.transactionCount}
- Productos más vendidos: ${context.sales.last30Days.topProducts.length > 0 ? context.sales.last30Days.topProducts.join(", ") : "Sin datos"}
- Total de clientes registrados: ${context.sales.customerCount}
`
        : `
SALES DATA (last 30 days):
- Total revenue: $${context.sales.last30Days.totalRevenue.toLocaleString()}
- Number of transactions: ${context.sales.last30Days.transactionCount}
- Top selling products: ${context.sales.last30Days.topProducts.length > 0 ? context.sales.last30Days.topProducts.join(", ") : "No data"}
- Total registered customers: ${context.sales.customerCount}
`;
    }

    const activityInfo = isSpanish
      ? `
ACTIVIDAD ACTUAL:
- Planes de contenido activos: ${context.contentPlans.activeCount}
- Campañas activas: ${context.campaigns.activeCount}
- Mensajes sin leer: ${context.conversations.unreadCount}
- Plataformas con conversaciones: ${context.conversations.recentPlatforms.length > 0 ? context.conversations.recentPlatforms.join(", ") : "Ninguna"}
`
      : `
CURRENT ACTIVITY:
- Active content plans: ${context.contentPlans.activeCount}
- Active campaigns: ${context.campaigns.activeCount}
- Unread messages: ${context.conversations.unreadCount}
- Platforms with conversations: ${context.conversations.recentPlatforms.length > 0 ? context.conversations.recentPlatforms.join(", ") : "None"}
`;

    const capabilities = isSpanish
      ? `
PUEDES AYUDAR CON:
1. Responder preguntas sobre la marca, ventas y rendimiento
2. Sugerir ideas de contenido para redes sociales
3. Analizar tendencias de ventas y productos populares
4. Recomendar estrategias de marketing basadas en los datos
5. Ayudar a redactar posts, captions y hashtags
6. Explicar métricas y dar insights sobre el negocio
7. Dar consejos sobre cómo mejorar la presencia en redes sociales

INSTRUCCIONES:
- Sé conciso pero informativo
- Usa emojis ocasionalmente para ser más amigable
- Basa tus respuestas en los datos reales de la marca
- Si no tienes información suficiente, sugiere cómo obtenerla
- Mantén un tono positivo y motivador
`
      : `
YOU CAN HELP WITH:
1. Answering questions about the brand, sales, and performance
2. Suggesting content ideas for social media
3. Analyzing sales trends and popular products
4. Recommending marketing strategies based on data
5. Helping draft posts, captions, and hashtags
6. Explaining metrics and providing business insights
7. Giving tips on how to improve social media presence

INSTRUCTIONS:
- Be concise but informative
- Use emojis occasionally to be friendlier
- Base your answers on real brand data
- If you don't have enough information, suggest how to get it
- Maintain a positive and motivating tone
`;

    return `${intro}
${brandInfo}
${designInfo}
${assetsInfo}
${integrationsInfo}
${salesInfo}
${activityInfo}
${capabilities}`;
  }

  private isImageRequest(message: string, language: "es" | "en"): boolean {
    const patterns = IMAGE_REQUEST_PATTERNS[language];
    return patterns.some((pattern) => pattern.test(message));
  }

  // Helper function to fetch an image from URL and convert to base64
  private async fetchImageAsBase64(
    url: string,
  ): Promise<{ data: string; mimeType: string } | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(
          `[Boosty] Failed to fetch image from ${url}: ${response.status}`,
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
      console.error(`[Boosty] Error fetching image from ${url}:`, error);
      return null;
    }
  }

  // Helper to select visual reference assets (same pattern as postGenerator.ts)
  private pickVisualReferenceAssets(
    assets: BrandAssetForImage[],
    count = 3,
  ): BrandAssetForImage[] {
    if (!assets || assets.length === 0) return [];

    // Filter for location and inspiration assets (best for visual style reference)
    const visualAssets = assets.filter(
      (a) =>
        a.category &&
        (LOCATION_CATEGORIES.includes(a.category.toLowerCase()) ||
          TEMPLATE_CATEGORIES.includes(a.category.toLowerCase())),
    );

    // If no specific visual assets, use product images as fallback
    const assetsToUse = visualAssets.length > 0 ? visualAssets : assets;

    // Shuffle and return up to count
    const shuffled = [...assetsToUse].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private async generateImage(
    imagePrompt: string,
    context: BrandContext,
    userRequest: string = "",
  ): Promise<string | null> {
    try {
      const primaryColor = context.design?.colors?.primary || "#4F46E5";
      const accentColor = context.design?.colors?.accent1 || "#7C3AED";
      const accent2Color = context.design?.colors?.accent2 || "";
      const brandStyle = context.design?.brandStyle || "modern and professional";
      const brandName = context.brand?.name || "Brand";
      const industry = context.brand?.industry || "";

      // Build color palette string
      const colorPalette = [primaryColor, accentColor, accent2Color]
        .filter(Boolean)
        .join(", ");

      // Get logo URL (prefer white/black versions)
      const logoUrl =
        context.design?.whiteLogoUrl ||
        context.design?.blackLogoUrl ||
        context.design?.logoUrl;

      // Select assets by category (following postGenerator.ts pattern)
      const productAssets = context.imageAssets.filter(
        (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase()),
      );
      const locationAssets = context.imageAssets.filter(
        (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase()),
      );

      const hasProducts = productAssets.length > 0;
      const hasLocation = locationAssets.length > 0;

      // Build content parts array for multimodal request
      const contentParts: any[] = [];

      // 1. Add logo as primary visual reference
      if (logoUrl) {
        console.log("[Boosty] Adding brand logo as reference:", logoUrl);
        const logoImage = await this.fetchImageAsBase64(logoUrl);
        if (logoImage) {
          contentParts.push({
            inlineData: {
              data: logoImage.data,
              mimeType: logoImage.mimeType,
            },
          });
        }
      }

      // 2. Add brand assets as visual references (up to 3)
      if (context.imageAssets && context.imageAssets.length > 0) {
        const assetsToUse = this.pickVisualReferenceAssets(context.imageAssets, 3);
        console.log(
          `[Boosty] Using ${assetsToUse.length} brand assets as references:`,
          assetsToUse.map((a) => a.name),
        );

        for (const asset of assetsToUse) {
          const imageData = await this.fetchImageAsBase64(asset.url);
          if (imageData) {
            contentParts.push({
              inlineData: {
                data: imageData.data,
                mimeType: imageData.mimeType,
              },
            });
          }
        }
      }

      // 3. Build enhanced prompt (following postGenerator.ts pattern)
      const enhancedPrompt = `
🎨 IMAGE GENERATION REQUEST FOR "${brandName.toUpperCase()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER REQUEST: ${userRequest || imagePrompt}

BRAND CONTEXT:
- Brand: ${brandName}
- Industry: ${industry || "general"}
- Visual Style: ${brandStyle}
- Color Palette: ${colorPalette}
${hasProducts ? "- Has real product images to reference" : ""}
${hasLocation ? "- Has location/venue images to reference" : ""}

DETAILED IMAGE PROMPT:
${imagePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 CRITICAL VISUAL INSTRUCTIONS:
1. If a logo image was provided above, reproduce it EXACTLY as shown - do NOT simplify, redraw, or reinterpret it.
2. Use the reference images for lighting, textures, color mood, and composition inspiration.
3. Maintain the brand's color palette (${colorPalette}) throughout the image.
4. Create a professional, high-quality marketing image suitable for social media.
5. The image should look like REAL SOCIAL MEDIA CONTENT, not a generic advertisement.
${hasProducts ? "6. If product images were provided, feature products authentically in the scene." : ""}

⛔ DO NOT:
- Add any text, watermarks, or overlays to the image
- Create generic stock photo looks
- Deviate from the brand's visual identity
- Simplify or alter the logo if one was provided

Generate a visually stunning, brand-consistent image that fulfills the user's request.
`;

      contentParts.push({ text: enhancedPrompt });

      console.log("[Boosty] Generating image with Gemini...");
      console.log("[Boosty] Assets used:", context.imageAssets.length);
      console.log("[Boosty] Logo provided:", !!logoUrl);

      // Call Gemini with multimodal content
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: contentParts,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Extract image from response
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const base64Image = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || "image/png";
            const dataUrl = `data:${mimeType};base64,${base64Image}`;
            console.log("[Boosty] Image generated successfully!");
            return dataUrl;
          }
        }
      }

      console.log("[Boosty] No image in response");
      return null;
    } catch (error) {
      console.error("[Boosty] Error generating image:", error);
      return null;
    }
  }

  private async generateImagePrompt(
    userMessage: string,
    context: BrandContext,
    language: "es" | "en",
    conversationHistory: ChatMessage[] = [],
  ): Promise<{ imagePrompt: string; caption: string; hashtags: string }> {
    // Build conversation context for memory
    const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
    const conversationContext = recentHistory.length > 0
      ? recentHistory.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
      : "";

    // Detect promotional content in user message or conversation
    const allContext = `${userMessage} ${conversationContext}`.toLowerCase();
    const promotionPatterns = [
      /\b(promoci[oó]n|promo|oferta|descuento|2x1|2\s*x\s*1|3x2|50%|20%|sale|discount|deal|special\s*offer|buy\s*one|gratis|free)\b/i,
    ];
    const isPromotion = promotionPatterns.some((pattern) => pattern.test(allContext));

    // Extract promotion details from context
    let promotionDetails = "";
    if (isPromotion) {
      const promoMatch = allContext.match(/(\d+x\d+|\d+\s*x\s*\d+|\d+%\s*off|\d+%\s*descuento|buy\s*\d+\s*get\s*\d+|gratis|free|2x1|3x2)/gi);
      if (promoMatch) {
        promotionDetails = promoMatch.join(", ").toUpperCase();
      }
    }

    // Build asset context
    const hasProducts = context.imageAssets.some(
      (a) => a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase()),
    );
    const hasLocations = context.imageAssets.some(
      (a) => a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase()),
    );
    const assetContext = `
Available visual assets:
- Total images: ${context.imageAssets.length}
- Has product images: ${hasProducts ? "Yes" : "No"}
- Has location/venue images: ${hasLocations ? "Yes" : "No"}
- Has logo: ${context.design?.hasLogo ? "Yes" : "No"}
`;

    const colorPalette = [
      context.design?.colors?.primary,
      context.design?.colors?.accent1,
      context.design?.colors?.accent2,
    ].filter(Boolean).join(", ");

    // Build text overlay instructions based on whether it's a promotion
    const textInstructionsEs = isPromotion
      ? `- IMPORTANTE: Esta es una promoción. DEBES incluir texto promocional en la imagen:
     * Texto principal grande y llamativo: "${promotionDetails || "PROMOCIÓN"}"
     * El texto debe ser legible, con buen contraste sobre el fondo
     * Usa los colores de la marca para el texto: ${colorPalette}
     * Coloca el texto de manera prominente (centro o parte inferior de la imagen)
     * Usa tipografía: ${context.design?.fonts?.primary || "sans-serif moderna y bold"}`
      : `- NO incluyas texto en la imagen`;

    const textInstructionsEn = isPromotion
      ? `- IMPORTANT: This is a promotion. You MUST include promotional text in the image:
     * Large, eye-catching main text: "${promotionDetails || "SPECIAL OFFER"}"
     * Text must be readable with good contrast against the background
     * Use brand colors for text: ${colorPalette}
     * Place text prominently (center or bottom of image)
     * Use typography: ${context.design?.fonts?.primary || "modern bold sans-serif"}`
      : `- Do NOT include text in the image`;

    const prompt =
      language === "es"
        ? `Eres un experto en marketing visual para la marca "${context.brand.name}" (${context.brand.industry || "general"}).

CONTEXTO DE LA MARCA:
- Estilo visual: ${context.design?.brandStyle || "moderno y profesional"}
- Paleta de colores: ${colorPalette || "colores de marca"}
- Tipografía principal: ${context.design?.fonts?.primary || "Roboto"}
${assetContext}
${conversationContext ? `\nCONVERSACIÓN PREVIA:\n${conversationContext}\n` : ""}
SOLICITUD ACTUAL DEL USUARIO: "${userMessage}"
${isPromotion ? `\n🎯 DETECTADO: Imagen PROMOCIONAL - Incluir texto: "${promotionDetails || "PROMOCIÓN"}"\n` : ""}

Genera un JSON con:
1. "imagePrompt": Una descripción MUY DETALLADA en inglés para generar una imagen de marketing (máximo 200 palabras). 
   - Describe la escena, iluminación, composición, ángulo de cámara
   - Especifica los colores de la marca: ${colorPalette}
   - Si el usuario menciona productos, describe cómo mostrarlos
   ${textInstructionsEs}
   - Usa el contexto de la conversación para entender mejor lo que quiere

2. "caption": Un caption atractivo en español para acompañar la imagen en redes sociales (máximo 150 caracteres).

3. "hashtags": 5-7 hashtags relevantes en español.

Responde SOLO con el JSON, sin explicaciones adicionales.`
        : `You are a visual marketing expert for the brand "${context.brand.name}" (${context.brand.industry || "general"}).

BRAND CONTEXT:
- Visual style: ${context.design?.brandStyle || "modern and professional"}
- Color palette: ${colorPalette || "brand colors"}
- Primary font: ${context.design?.fonts?.primary || "Roboto"}
${assetContext}
${conversationContext ? `\nPREVIOUS CONVERSATION:\n${conversationContext}\n` : ""}
CURRENT USER REQUEST: "${userMessage}"
${isPromotion ? `\n🎯 DETECTED: PROMOTIONAL image - Include text: "${promotionDetails || "SPECIAL OFFER"}"\n` : ""}

Generate a JSON with:
1. "imagePrompt": A VERY DETAILED description in English to generate a marketing image (max 200 words).
   - Describe the scene, lighting, composition, camera angle
   - Specify brand colors: ${colorPalette}
   - If user mentions products, describe how to showcase them
   ${textInstructionsEn}
   - Use conversation context to better understand the request

2. "caption": An engaging caption in English to accompany the image on social media (max 150 characters).

3. "hashtags": 5-7 relevant hashtags in English.

Respond ONLY with the JSON, no additional explanations.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          imagePrompt: parsed.imagePrompt || "Professional marketing image",
          caption: parsed.caption || "",
          hashtags: parsed.hashtags || "",
        };
      }
    } catch (error) {
      console.error("[Boosty] Error generating image prompt:", error);
    }

    return {
      imagePrompt:
        "Professional marketing image for social media, modern and clean design",
      caption: "",
      hashtags: "",
    };
  }

  async chat(
    brandId: string,
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    language: "es" | "en" = "es",
  ): Promise<ChatResponse> {
    const context = await this.getBrandContext(brandId, userId);
    const systemPrompt = this.buildSystemPrompt(context, language);
    const wantsImage = this.isImageRequest(message, language);

    if (wantsImage) {
      console.log("[Boosty] Image request detected, generating image...");

      const { imagePrompt, caption, hashtags } = await this.generateImagePrompt(
        message,
        context,
        language,
        conversationHistory,
      );
      const generatedImage = await this.generateImage(imagePrompt, context, message);

      if (generatedImage) {
        const textResponse =
          language === "es"
            ? `¡Aquí está tu imagen! 🎨\n\n**Caption sugerido:**\n${caption}\n\n**Hashtags:**\n${hashtags}\n\n¿Te gustaría que haga algún ajuste o genere otra versión?`
            : `Here's your image! 🎨\n\n**Suggested caption:**\n${caption}\n\n**Hashtags:**\n${hashtags}\n\nWould you like me to make any adjustments or generate another version?`;

        return {
          text: textResponse,
          image: generatedImage,
          imagePrompt,
        };
      } else {
        const errorResponse =
          language === "es"
            ? "Lo siento, no pude generar la imagen en este momento. ¿Podrías intentarlo de nuevo o ser más específico con lo que necesitas?"
            : "Sorry, I couldn't generate the image right now. Could you try again or be more specific about what you need?";

        return { text: errorResponse };
      }
    }

    const messages = [
      { role: "user" as const, parts: [{ text: systemPrompt }] },
      {
        role: "model" as const,
        parts: [
          {
            text:
              language === "es"
                ? "¡Hola! Soy Boosty, tu asistente de marketing. 🚀 Conozco todo sobre tu marca y estoy listo para ayudarte. ¿En qué puedo asistirte hoy?"
                : "Hello! I'm Boosty, your marketing assistant. 🚀 I know everything about your brand and I'm ready to help. How can I assist you today?",
          },
        ],
      },
    ];

    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      });
    }

    messages.push({
      role: "user" as const,
      parts: [{ text: message }],
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      });

      return {
        text:
          response.text ||
          (language === "es"
            ? "Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?"
            : "Sorry, I couldn't process your message. Could you try again?"),
      };
    } catch (error) {
      console.error("[Boosty] Error generating response:", error);
      throw error;
    }
  }

  async getQuickSuggestions(
    brandId: string,
    userId: string,
    language: "es" | "en" = "es",
  ): Promise<string[]> {
    const context = await this.getBrandContext(brandId, userId);

    const suggestions =
      language === "es"
        ? [
            "¿Cuáles son mis productos más vendidos?",
            "Sugiere ideas de contenido para esta semana",
            "¿Cómo están mis ventas este mes?",
            "Ayúdame a escribir un post para Instagram",
          ]
        : [
            "What are my best-selling products?",
            "Suggest content ideas for this week",
            "How are my sales this month?",
            "Help me write an Instagram post",
          ];

    if (context.sales && context.sales.last30Days.transactionCount > 0) {
      suggestions.push(
        language === "es"
          ? "Analiza las tendencias de ventas recientes"
          : "Analyze recent sales trends",
      );
    }

    if (context.conversations.unreadCount > 0) {
      suggestions.push(
        language === "es"
          ? `Tengo ${context.conversations.unreadCount} mensajes sin leer, ¿qué debo priorizar?`
          : `I have ${context.conversations.unreadCount} unread messages, what should I prioritize?`,
      );
    }

    return suggestions.slice(0, 6);
  }
}

export const boostyService = new BoostyService();
