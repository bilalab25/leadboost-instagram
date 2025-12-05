import { GoogleGenAI } from "@google/genai";
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
  conversations
} from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
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

export class BoostyService {
  async getBrandContext(brandId: string, userId: string): Promise<BrandContext> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      brand,
      design,
      assets,
      platformIntegrations,
      posIntegration,
      activePlans,
      activeCampaigns,
      recentConversations
    ] = await Promise.all([
      db.query.brands.findFirst({
        where: eq(brands.id, brandId),
      }),
      db.query.brandDesigns.findFirst({
        where: eq(brandDesigns.brandId, brandId),
      }),
      db.query.brandAssets.findMany({
        where: eq(brandAssets.brandDesignId, brandId),
      }),
      db.query.integrations.findMany({
        where: and(
          eq(integrations.brandId, brandId),
          eq(integrations.isActive, true)
        ),
      }),
      db.query.posIntegrations.findFirst({
        where: and(
          eq(posIntegrations.brandId, brandId),
          eq(posIntegrations.isActive, true)
        ),
      }),
      db.query.contentPlans.findMany({
        where: and(
          eq(contentPlans.brandId, brandId),
          eq(contentPlans.status, "active")
        ),
      }),
      db.query.campaigns.findMany({
        where: and(
          eq(campaigns.brandId, brandId),
          eq(campaigns.status, "active")
        ),
      }),
      db.query.conversations.findMany({
        where: eq(conversations.brandId, brandId),
        orderBy: [desc(conversations.lastMessageAt)],
        limit: 50
      }),
    ]);

    let salesData: typeof salesTransactions.$inferSelect[] = [];
    let customers: typeof posCustomers.$inferSelect[] = [];
    
    if (posIntegration) {
      [salesData, customers] = await Promise.all([
        db.query.salesTransactions.findMany({
          where: and(
            eq(salesTransactions.posIntegrationId, posIntegration.id),
            gte(salesTransactions.transactionDate, thirtyDaysAgo)
          ),
          orderBy: [desc(salesTransactions.totalAmount)],
          limit: 100
        }),
        db.query.posCustomers.findMany({
          where: eq(posCustomers.posIntegrationId, posIntegration.id),
        }),
      ]);
    }

    const assetCategories = Array.from(new Set(assets.map(a => a.category).filter(Boolean))) as string[];
    const connectedPlatforms = platformIntegrations.map(i => i.provider);
    
    const totalRevenue = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0) / 100;
    const topProducts: string[] = [];
    
    if (salesData.length > 0) {
      const productCounts = new Map<string, number>();
      for (const sale of salesData) {
        const items = sale.items as any[] || [];
        for (const item of items) {
          const name = item.name || item.product_id || "Unknown";
          productCounts.set(name, (productCounts.get(name) || 0) + (item.quantity || 1));
        }
      }
      const sorted = Array.from(productCounts.entries()).sort((a, b) => b[1] - a[1]);
      topProducts.push(...sorted.slice(0, 5).map(([name]) => name));
    }

    const unreadCount = recentConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const recentPlatforms = Array.from(new Set(recentConversations.map(c => c.platform)));

    return {
      brand: {
        name: brand?.name || "Mi Marca",
        industry: brand?.industry || undefined,
        description: brand?.description || undefined,
      },
      design: design ? {
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
        hasLogo: !!(design.whiteLogoUrl || design.blackLogoUrl || design.logoUrl),
      } : null,
      assets: {
        totalCount: assets.length,
        categories: assetCategories,
      },
      integrations: {
        connected: connectedPlatforms,
      },
      sales: posIntegration ? {
        last30Days: {
          totalRevenue,
          transactionCount: salesData.length,
          topProducts,
        },
        customerCount: customers.length,
      } : null,
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

  private buildSystemPrompt(context: BrandContext, language: "es" | "en"): string {
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
${context.integrations.connected.length > 0 ? context.integrations.connected.map(p => `- ${p}`).join("\n") : "- Ninguna integración conectada"}
`
      : `
CONNECTED INTEGRATIONS:
${context.integrations.connected.length > 0 ? context.integrations.connected.map(p => `- ${p}`).join("\n") : "- No integrations connected"}
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

  async chat(
    brandId: string,
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    language: "es" | "en" = "es"
  ): Promise<string> {
    const context = await this.getBrandContext(brandId, userId);
    const systemPrompt = this.buildSystemPrompt(context, language);

    const messages = [
      { role: "user" as const, parts: [{ text: systemPrompt }] },
      { role: "model" as const, parts: [{ text: language === "es" 
        ? "¡Hola! Soy Boosty, tu asistente de marketing. 🚀 Conozco todo sobre tu marca y estoy listo para ayudarte. ¿En qué puedo asistirte hoy?"
        : "Hello! I'm Boosty, your marketing assistant. 🚀 I know everything about your brand and I'm ready to help. How can I assist you today?"
      }] },
    ];

    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === "user" ? "user" as const : "model" as const,
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

      return response.text || (language === "es" 
        ? "Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?"
        : "Sorry, I couldn't process your message. Could you try again?");
    } catch (error) {
      console.error("[Boosty] Error generating response:", error);
      throw error;
    }
  }

  async getQuickSuggestions(brandId: string, userId: string, language: "es" | "en" = "es"): Promise<string[]> {
    const context = await this.getBrandContext(brandId, userId);
    
    const suggestions = language === "es" ? [
      "¿Cuáles son mis productos más vendidos?",
      "Sugiere ideas de contenido para esta semana",
      "¿Cómo están mis ventas este mes?",
      "Ayúdame a escribir un post para Instagram",
    ] : [
      "What are my best-selling products?",
      "Suggest content ideas for this week",
      "How are my sales this month?",
      "Help me write an Instagram post",
    ];

    if (context.sales && context.sales.last30Days.transactionCount > 0) {
      suggestions.push(language === "es" 
        ? "Analiza las tendencias de ventas recientes"
        : "Analyze recent sales trends"
      );
    }

    if (context.conversations.unreadCount > 0) {
      suggestions.push(language === "es"
        ? `Tengo ${context.conversations.unreadCount} mensajes sin leer, ¿qué debo priorizar?`
        : `I have ${context.conversations.unreadCount} unread messages, what should I prioritize?`
      );
    }

    return suggestions.slice(0, 6);
  }
}

export const boostyService = new BoostyService();
