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
  } | null;
  assets: {
    totalCount: number;
    categories: string[];
  };
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
          }
        : null,
      assets: {
        totalCount: assets.length,
        categories: assetCategories,
      },
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

  private async generateImage(
    imagePrompt: string,
    context: BrandContext,
  ): Promise<string | null> {
    try {
      const primaryColor = context.design?.colors?.primary || "#4F46E5";
      const accentColor = context.design?.colors?.accent1 || "#7C3AED";
      const brandStyle =
        context.design?.brandStyle || "modern and professional";
      const brandName = context.brand?.name || "Brand";
      const industry = context.brand?.industry || "";

      // Prompt principal para generar la imagen
      const enhancedPrompt = `
  Generate a professional, high-quality marketing image for the brand "${brandName}" 
  in the ${industry || "general"} industry. 

  Use the brand's visual style: ${brandStyle}.
  Primary color: ${primaryColor}, Accent color: ${accentColor}.
  Use up to 3 reference images provided (brand assets) to inspire the composition. 
  Focus on clean composition, vibrant colors, and a modern, professional look. 
  Do NOT include any text on the image. 
  Ensure consistency with the brand's mood, products, and colors.
  `;

      const contentParts: any[] = [];

      // Seleccionar hasta 3 assets para usar como referencia visual
      if (
        context.assets &&
        Array.isArray(context.assets) &&
        context.assets.length > 0
      ) {
        const assetsToUse = context.assets.slice(0, 3);

        for (const asset of assetsToUse) {
          const imageData = await this.fetchImageAsBase64(asset.url);
          if (imageData) {
            contentParts.push({
              role: "input",
              parts: [
                {
                  inlineData: {
                    data: imageData.data,
                    mimeType: imageData.mimeType,
                  },
                },
                {
                  text: `Use this asset as visual inspiration to generate a new marketing image that matches the brand style, colors, and aesthetic.`,
                },
              ],
            });
          }
        }
      }

      // Agregar el prompt principal
      contentParts.push({
        role: "input",
        parts: [{ text: enhancedPrompt }],
      });

      // Llamada a Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: contentParts,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      // Buscar la imagen en la respuesta
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const base64Image = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || "image/png";
            const dataUrl = `data:${mimeType};base64,${base64Image}`;
            console.log("[Boosty] Image generated successfully");
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
  ): Promise<{ imagePrompt: string; caption: string; hashtags: string }> {
    const prompt =
      language === "es"
        ? `Eres un experto en marketing visual. Basándote en esta solicitud del usuario: "${userMessage}"
         Y el contexto de la marca: ${context.brand.name} (${context.brand.industry || "general"})
         
         Genera un JSON con:
         1. "imagePrompt": Una descripción detallada en inglés para generar una imagen de marketing (máximo 100 palabras). Describe la escena, colores, estilo, composición. NO incluyas texto en la imagen.
         2. "caption": Un caption atractivo en español para acompañar la imagen en redes sociales (máximo 150 caracteres).
         3. "hashtags": 5-7 hashtags relevantes en español.
         
         Responde SOLO con el JSON, sin explicaciones adicionales.`
        : `You are a visual marketing expert. Based on this user request: "${userMessage}"
         And the brand context: ${context.brand.name} (${context.brand.industry || "general"})
         
         Generate a JSON with:
         1. "imagePrompt": A detailed description in English to generate a marketing image (max 100 words). Describe the scene, colors, style, composition. Do NOT include text in the image.
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
      );
      const generatedImage = await this.generateImage(imagePrompt, context);

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
