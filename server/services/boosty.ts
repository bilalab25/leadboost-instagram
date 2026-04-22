import { GoogleGenAI, Modality } from "@google/genai";
import { generateContentWithRetry } from "./aiRetry";
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

// ========================================
// EDITORIAL MODE - Types and Interfaces
// ========================================

interface EditorialPreset {
  mood: "luxury_minimal" | "warm_romantic" | "modern_clinical";
  subject: "close_up" | "abstract" | "couple_detail" | "product_hero";
  background: "cream" | "burgundy" | "neutral_gradient" | "soft_white";
}

interface LayoutPlan {
  aspectRatio: "4:5";
  safeAreaPercent: { top: number; right: number; bottom: number; left: number };
  headline: string;
  subhead: string;
  cta?: string;
  alignment: "left" | "center" | "right";
  theme: "light" | "dark";
  disclaimer?: string;
}

interface ImagePromptResult {
  basePhotoPrompt: string;
  layoutPlan: LayoutPlan;
  caption: string;
  hashtags: string;
  editorialMode: boolean;
}

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
const PRODUCT_CATEGORIES = [
  "product_images",
  "products",
  "product",
  "product_assets",
];
const LOCATION_CATEGORIES = [
  "location",
  "location_images",
  "location_assets",
  "place",
  "venue",
];
const TEMPLATE_CATEGORIES = [
  "inspiration_templates",
  "templates",
  "inspiration",
];

// ========================================
// EDITORIAL MODE - Helper Functions
// ========================================

function detectEditorialMode(
  userMessage: string,
  brandStyle: string = "",
): boolean {
  const lowerMsg = userMessage.toLowerCase();
  const lowerStyle = brandStyle.toLowerCase();

  // Explicit flyer/poster/text-heavy request = NOT editorial
  const flyerPatterns = [
    /\b(flyer|poster|cartel|volante|panfleto|banner|afiche)\b/i,
    /\b(text\s*overlay|texto\s*sobre|letras\s*grandes|bold\s*text|texto\s*promocional)\b/i,
    /\b(include\s*text|incluir\s*texto|con\s*texto|texto\s*llamativo)\b/i,
    /\b(graphic|infographic|gráfico|infografía)\b/i,
  ];

  if (flyerPatterns.some((p) => p.test(lowerMsg))) {
    return false;
  }

  // Editorial mode only for premium brand styles or explicit editorial keywords
  const editorialTriggers = [
    /\b(editorial|luxury|premium|high.?end|elegant|minimal|magazine|elegante|lujoso|sofisticado)\b/i,
    /\b(clinic|spa|beauty|aesthetic|cosmetic|skincare|clínica|estética)\b/i,
    /\b(clean\s*image|imagen\s*limpia|photo|fotografía|professional\s*photo)\b/i,
  ];

  const styleEditorial =
    /\b(minimal|elegant|luxury|premium|sofisticado|elegante|lujoso|high.?end)\b/i.test(
      lowerStyle,
    );

  // Promotions alone do NOT trigger editorial mode - must have explicit triggers
  return editorialTriggers.some((p) => p.test(lowerMsg)) || styleEditorial;
}

function getEditorialPreset(
  context: BrandContext,
  userMessage: string,
): EditorialPreset {
  const lowerMsg = userMessage.toLowerCase();
  const industry = context.brand?.industry?.toLowerCase() || "";
  const brandStyle = context.design?.brandStyle?.toLowerCase() || "";

  // Valentine/couples/romantic context
  if (
    /\b(valentine|amor|pareja|couples?|romantic|san\s*valent[ií]n)\b/i.test(
      lowerMsg,
    )
  ) {
    return {
      mood: "warm_romantic",
      subject: "couple_detail",
      background: "burgundy",
    };
  }

  // Medical/clinic context
  if (
    /\b(clinic|medical|aesthetic|botox|filler|tratamiento|cl[ií]nica|m[eé]dico)\b/i.test(
      lowerMsg,
    ) ||
    /\b(health|wellness|beauty|spa|aesthetic)\b/i.test(industry)
  ) {
    return {
      mood: "modern_clinical",
      subject: "close_up",
      background: "soft_white",
    };
  }

  // Minimal/elegant brand style
  if (/\b(minimal|elegant|luxury|premium)\b/i.test(brandStyle)) {
    return {
      mood: "luxury_minimal",
      subject: "product_hero",
      background: "cream",
    };
  }

  // Default preset
  return {
    mood: "luxury_minimal",
    subject: "abstract",
    background: "neutral_gradient",
  };
}

function sanitizePrompt(prompt: string): string {
  // Remove terms that lead to flyer-style outputs
  const forbiddenTerms = [
    /text\s*overlay/gi,
    /percent\s*off/gi,
    /\bFREE\b/gi,
    /(2x1|3x2),?\s*(2x1|3x2),?\s*(2x1|3x2)/gi, // repeated promos
    /\bposter\b/gi,
    /\bflyer\b/gi,
    /\bbold\s*discount\b/gi,
    /\bdiagonal\s*text\b/gi,
    /promotional\s*text/gi,
    /include.*text/gi,
  ];

  let sanitized = prompt;
  for (const term of forbiddenTerms) {
    sanitized = sanitized.replace(term, "");
  }

  return sanitized.trim();
}

function sanitizeLayoutPlan(plan: LayoutPlan): LayoutPlan {
  // Enforce word limits
  const limitWords = (text: string, max: number): string => {
    const words = text.split(/\s+/).filter(Boolean);
    return words.slice(0, max).join(" ");
  };

  // Remove repeated tokens (e.g., "2x1, 2x1, 2x1")
  const removeRepeats = (text: string): string => {
    const words = text.split(/[\s,]+/).filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(w);
      }
    }
    return unique.join(" ");
  };

  return {
    ...plan,
    headline: removeRepeats(limitWords(plan.headline || "", 4)),
    subhead: removeRepeats(limitWords(plan.subhead || "", 6)),
    cta: plan.cta ? limitWords(plan.cta, 3) : undefined,
  };
}

function buildEditorialBasePrompt(
  preset: EditorialPreset,
  context: BrandContext,
  userMessage: string,
): string {
  const primaryColor = context.design?.colors?.primary || "#4F46E5";
  const accentColor = context.design?.colors?.accent1 || "#7C3AED";
  const industry = context.brand?.industry || "premium lifestyle";

  const moodDescriptions: Record<string, string> = {
    luxury_minimal:
      "ultra-minimal luxury aesthetic, clean lines, sophisticated simplicity",
    warm_romantic:
      "warm romantic atmosphere, soft candlelight, intimate and tender mood",
    modern_clinical:
      "pristine clinical elegance, spotless white surfaces, professional medical spa aesthetic",
  };

  const subjectDescriptions: Record<string, string> = {
    close_up: "extreme close-up detail shot, macro beauty photography",
    abstract: "abstract artistic composition, soft focus gradient background",
    couple_detail:
      "intimate couple detail shot, hands touching or close faces, romantic",
    product_hero: "hero product shot, centered with dramatic lighting",
  };

  const backgroundDescriptions: Record<string, string> = {
    cream: "cream and ivory toned background with subtle texture",
    burgundy: `deep ${primaryColor || "burgundy"} and wine tones, moody shadows`,
    neutral_gradient: "soft neutral gradient background, subtle cream to beige",
    soft_white: "pure white background with soft shadows, clinical precision",
  };

  return `Luxury editorial photography for ${industry} brand.

STYLE: ${moodDescriptions[preset.mood]}
SUBJECT: ${subjectDescriptions[preset.subject]}
BACKGROUND: ${backgroundDescriptions[preset.background]}

COMPOSITION:
- Instagram 4:5 vertical format
- Generous negative space (top 15%, bottom 15% clear for text overlay in post-production)
- Rule of thirds composition
- Shallow depth of field, creamy bokeh
- Soft diffused studio lighting
- Color grading: subtle tint toward brand palette (${primaryColor}, ${accentColor})

MANDATORY NEGATIVES - DO NOT INCLUDE:
- NO text, NO letters, NO typography, NO logos, NO watermarks
- NO icons, NO syringe icons, NO medical symbols
- NO collage layouts, NO flyer aesthetics, NO poster designs
- NO diagonal text, NO repeated patterns of words or numbers
- NO discount percentages, NO promotional text overlays
- NO generic stock photo look

QUALITY:
- High-end fashion magazine editorial quality
- Professional retouching, skin texture preserved
- Sharp focus on subject with artistic blur falloff
- Elegant color harmony

This image should look like a luxury skincare or fashion editorial, NOT a promotional flyer.`.trim();
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  text: string;
  image?: string;
  imagePrompt?: string;
  layoutPlan?: LayoutPlan;
  editorialMode?: boolean;
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
      // Bug 34: Add 15-second timeout to prevent hanging on slow URLs
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const mimeType = contentType.split(";")[0].trim();

      return { data: base64, mimeType };
    } catch (error) {
      console.error(`[Boosty] Error fetching image:`, error instanceof Error ? error.message : "Unknown");
      return null;
    }
  }

  // Helper to select visual reference assets for editorial mode
  // Editorial mode limits to 0-2 images, preferring location/inspiration over products
  private pickVisualReferenceAssets(
    assets: BrandAssetForImage[],
    count = 2, // Default to 2 for editorial mode
    editorialMode = true,
  ): BrandAssetForImage[] {
    if (!assets || assets.length === 0) return [];

    // In editorial mode, limit to max 2 reference images
    const maxCount = editorialMode ? Math.min(count, 2) : count;

    // Filter for location and inspiration assets (best for visual style reference)
    const locationAssets = assets.filter(
      (a) =>
        a.category && LOCATION_CATEGORIES.includes(a.category.toLowerCase()),
    );
    const templateAssets = assets.filter(
      (a) =>
        a.category && TEMPLATE_CATEGORIES.includes(a.category.toLowerCase()),
    );
    const productAssets = assets.filter(
      (a) =>
        a.category && PRODUCT_CATEGORIES.includes(a.category.toLowerCase()),
    );

    // Priority: location/inspiration > products (for editorial, products last)
    const prioritized: BrandAssetForImage[] = [];

    if (editorialMode) {
      // Prefer location and templates for editorial aesthetic
      prioritized.push(...locationAssets.slice(0, 1));
      prioritized.push(...templateAssets.slice(0, 1));
      // Only add product if we have room and no other assets
      if (prioritized.length === 0 && productAssets.length > 0) {
        prioritized.push(productAssets[0]);
      }
    } else {
      // Non-editorial: mix all
      prioritized.push(...locationAssets, ...templateAssets, ...productAssets);
    }

    // Shuffle and return up to maxCount
    const shuffled = [...prioritized].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, maxCount);
  }

  private async generateImage(
    basePhotoPrompt: string,
    context: BrandContext,
    editorialMode: boolean = true,
  ): Promise<string | null> {
    try {
      const primaryColor = context.design?.colors?.primary || "#4F46E5";
      const accentColor = context.design?.colors?.accent1 || "#7C3AED";
      const brandName = context.brand?.name || "Brand";
      const industry = context.brand?.industry || "";

      // Build color palette string
      const colorPalette = [primaryColor, accentColor]
        .filter(Boolean)
        .join(", ");

      // Build content parts array for multimodal request
      const contentParts: any[] = [];

      // In EDITORIAL MODE: Do NOT attach logo (degrades aesthetics)
      // Only attach 0-2 reference images for lighting/color/texture inspiration
      if (editorialMode) {
        // Select limited reference images (0-2) for inspiration only
        if (context.imageAssets && context.imageAssets.length > 0) {
          const assetsToUse = this.pickVisualReferenceAssets(
            context.imageAssets,
            2,
            true,
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
      } else {
        // Non-editorial mode: include logo and more assets
        const logoUrl =
          context.design?.whiteLogoUrl ||
          context.design?.blackLogoUrl ||
          context.design?.logoUrl;

        if (logoUrl) {
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

        if (context.imageAssets && context.imageAssets.length > 0) {
          const assetsToUse = this.pickVisualReferenceAssets(
            context.imageAssets,
            3,
            false,
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
      }

      // Build the final prompt - sanitized for editorial mode
      const sanitizedPrompt = editorialMode
        ? sanitizePrompt(basePhotoPrompt)
        : basePhotoPrompt;

      const enhancedPrompt = editorialMode
        ? `
🎨 EDITORIAL PHOTOGRAPHY REQUEST FOR "${brandName.toUpperCase()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sanitizedPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📸 EDITORIAL QUALITY REQUIREMENTS:
- Luxury editorial photography, high-end magazine quality
- Soft diffused studio lighting with subtle shadows
- Shallow depth of field, creamy bokeh background
- Instagram 4:5 vertical composition
- Color grading: subtle warmth with brand palette hints (${colorPalette})
- Generous negative space (15% margins) for clean composition

🔇 REFERENCE IMAGE USAGE:
${contentParts.length > 1 ? "Use provided reference images ONLY for lighting, color mood, and texture inspiration. Do NOT copy subjects directly." : "No reference images provided - use the prompt description."}

⛔ ABSOLUTELY FORBIDDEN - DO NOT INCLUDE:
- NO text, NO letters, NO typography of any kind
- NO logos, NO watermarks, NO brand marks
- NO icons (especially syringe, medical symbols)
- NO collage layouts, NO poster aesthetics, NO flyer designs
- NO diagonal elements, NO repeated patterns
- NO discount percentages, NO promotional overlays
- NO generic stock photo look

This must look like a luxury fashion/beauty editorial, NOT a promotional flyer.
Generate ONLY the clean base photograph.
`
        : `
🎨 IMAGE GENERATION REQUEST FOR "${brandName.toUpperCase()}"

${sanitizedPrompt}

BRAND CONTEXT:
- Industry: ${industry || "general"}
- Color Palette: ${colorPalette}

Create a professional marketing image suitable for social media.
`;

      contentParts.push({ text: enhancedPrompt });

      // Call Gemini with multimodal content
      const response = await generateContentWithRetry(getAI(), {
        model: "gemini-3-pro-image-preview",
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
            return dataUrl;
          }
        }
      }

      return null;
    } catch (error) {
      console.error("[Boosty] Error generating image:", error);
      return null;
    }
  }

  // Build fallback editorial prompt when Gemini fails to generate JSON
  private buildEditorialFallback(
    userMessage: string,
    context: BrandContext,
    preset: EditorialPreset,
  ): ImagePromptResult {
    const basePhotoPrompt = buildEditorialBasePrompt(
      preset,
      context,
      userMessage,
    );

    // Extract promo details only if explicitly mentioned
    const promoMatch = userMessage.match(/(\d+x\d+|2x1|3x2)/gi);
    const promo = promoMatch ? promoMatch[0].toUpperCase() : "";

    const themeMatch = userMessage.match(
      /\b(valentine|amor|pareja|san\s*valent[ií]n|couples?)\b/i,
    );
    const theme = themeMatch ? "Valentine's Day" : "";

    // Only use promo as headline if explicitly present, otherwise use brand name
    // Never insert generic "Special Offer" - keep it clean
    const headline = promo || (theme ? theme : "");
    const subhead = promo && theme ? theme : context.brand.name;

    return {
      basePhotoPrompt: sanitizePrompt(basePhotoPrompt),
      layoutPlan: sanitizeLayoutPlan({
        aspectRatio: "4:5",
        safeAreaPercent: { top: 8, right: 8, bottom: 10, left: 8 },
        headline: headline,
        subhead: subhead,
        alignment: "center",
        theme:
          preset.background === "burgundy" || preset.mood === "warm_romantic"
            ? "dark"
            : "light",
      }),
      caption: "",
      hashtags: "",
      editorialMode: true,
    };
  }

  private async generateImagePrompt(
    userMessage: string,
    context: BrandContext,
    language: "es" | "en",
    conversationHistory: ChatMessage[] = [],
  ): Promise<ImagePromptResult> {
    // Build conversation context for memory
    const recentHistory = conversationHistory.slice(-6);
    const conversationContext =
      recentHistory.length > 0
        ? recentHistory
            .map(
              (msg) =>
                `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
            )
            .join("\n")
        : "";

    const allContext = `${userMessage} ${conversationContext}`;

    // Detect editorial mode
    const editorialMode = detectEditorialMode(
      allContext,
      context.design?.brandStyle || "",
    );
    const preset = getEditorialPreset(context, allContext);

    // Extract promotion details
    const promoMatch = allContext.match(/(\d+x\d+|2x1|3x2)/gi);
    const promotionDetails = promoMatch ? promoMatch[0].toUpperCase() : "";

    // Detect theme keywords
    const valentineMatch =
      /\b(valentine|san\s*valent[ií]n|amor|pareja|couples?|romantic)\b/i.test(
        allContext,
      );
    const serviceMatch = allContext.match(
      /\b(botox|filler|tratamiento|rellenos?|faciales?|lifting)\b/i,
    );
    const serviceName = serviceMatch ? serviceMatch[0] : "";

    const colorPalette = [
      context.design?.colors?.primary,
      context.design?.colors?.accent1,
    ]
      .filter(Boolean)
      .join(", ");

    // Different prompts for editorial vs non-editorial mode
    const prompt = editorialMode
      ? `You are a luxury editorial photography director for "${context.brand.name}" (${context.brand.industry || "premium lifestyle"}).

USER REQUEST: "${userMessage}"
${conversationContext ? `\nCONVERSATION CONTEXT:\n${conversationContext}\n` : ""}
BRAND:
- Style: ${context.design?.brandStyle || "modern and professional"}
- Colors: ${colorPalette || "elegant neutral tones"}
- Industry: ${context.brand.industry || "lifestyle"}

EDITORIAL PRESET:
- Mood: ${preset.mood}
- Subject: ${preset.subject}
- Background: ${preset.background}

${promotionDetails ? `PROMOTION DETECTED: ${promotionDetails}` : ""}
${valentineMatch ? "THEME: Valentine's Day / Couples / Romance" : ""}
${serviceName ? `SERVICE: ${serviceName}` : ""}

Generate a JSON with:

1. "basePhotoPrompt": A detailed editorial photography description in English (max 120 words). MUST be a CLEAN BASE PHOTO with:
   - Luxury editorial photography style
   - Soft studio lighting, shallow depth of field
   - Instagram 4:5 vertical composition
   - Negative space for text overlay (15% margins)
   - Color grading matching brand palette
   
   MANDATORY NEGATIVES - Include in prompt:
   "no text, no letters, no typography, no logos, no watermarks, no icons, no syringe icon, no collage, no flyer, no poster layout, no diagonal text, no repeated patterns"

2. "layoutPlan": JSON object for frontend text overlay:
   {
     "aspectRatio": "4:5",
     "safeAreaPercent": { "top": 8, "right": 8, "bottom": 10, "left": 8 },
     "headline": "${promotionDetails || "Special"}" (max 4 words, NO repetition),
     "subhead": "short tagline" (max 6 words),
     "cta": "optional call to action" (max 3 words),
     "alignment": "center" | "left" | "right",
     "theme": "light" | "dark"
   }

3. "caption": Short premium caption in ${language === "es" ? "Spanish" : "English"} (max 100 chars, elegant tone)

4. "hashtags": 5-7 relevant hashtags in ${language === "es" ? "Spanish" : "English"}

RULES:
- ONE message only (no multiple discounts)
- NO repeated text patterns
- Premium, minimal aesthetic
- Image must look like luxury editorial, NOT a flyer

Respond ONLY with valid JSON.`
      : `You are a marketing visual expert for "${context.brand.name}" (${context.brand.industry || "general business"}).

USER REQUEST: "${userMessage}"
${conversationContext ? `\nCONVERSATION CONTEXT:\n${conversationContext}\n` : ""}
BRAND:
- Style: ${context.design?.brandStyle || "modern and professional"}
- Colors: ${colorPalette || "brand colors"}
- Font: ${context.design?.fonts?.primary || "Roboto"}

${promotionDetails ? `PROMOTION: ${promotionDetails}` : ""}
${valentineMatch ? "THEME: Valentine's Day" : ""}

Generate a JSON with:

1. "imagePrompt": A detailed description in English (max 200 words) for a marketing image.
   ${promotionDetails ? `- IMPORTANT: Include promotional text "${promotionDetails}" prominently in the image with bold typography and brand colors.` : "- Do NOT include text in the image."}

2. "caption": An engaging caption in ${language === "es" ? "Spanish" : "English"} (max 150 chars).

3. "hashtags": 5-7 relevant hashtags.

Respond ONLY with valid JSON.`;

    try {
      const response = await generateContentWithRetry(getAI(), {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (editorialMode) {
          // Sanitize editorial outputs
          const basePhotoPrompt = sanitizePrompt(
            parsed.basePhotoPrompt ||
              buildEditorialBasePrompt(preset, context, userMessage),
          );
          const layoutPlan = sanitizeLayoutPlan(
            parsed.layoutPlan || {
              aspectRatio: "4:5",
              safeAreaPercent: { top: 8, right: 8, bottom: 10, left: 8 },
              headline: promotionDetails || context.brand.name,
              subhead: context.design?.brandStyle || "",
              alignment: "center",
              theme: "light",
            },
          );

          return {
            basePhotoPrompt,
            layoutPlan,
            caption: parsed.caption || "",
            hashtags: parsed.hashtags || "",
            editorialMode: true,
          };
        } else {
          // Non-editorial: return imagePrompt directly, no layoutPlan needed
          return {
            basePhotoPrompt:
              parsed.imagePrompt ||
              "Professional marketing image for " + context.brand.name,
            layoutPlan: {
              aspectRatio: "4:5",
              safeAreaPercent: { top: 0, right: 0, bottom: 0, left: 0 },
              headline: "",
              subhead: "",
              alignment: "center" as const,
              theme: "light" as const,
            },
            caption: parsed.caption || "",
            hashtags: parsed.hashtags || "",
            editorialMode: false,
          };
        }
      }
    } catch (error) {
      console.error("[Boosty] Error generating image prompt:", error);
    }

    // Fallback based on mode
    if (editorialMode) {
      return this.buildEditorialFallback(userMessage, context, preset);
    } else {
      return {
        basePhotoPrompt: `Professional marketing image for ${context.brand.name}. ${userMessage}. Style: ${context.design?.brandStyle || "modern"}. Colors: ${colorPalette}.`,
        layoutPlan: {
          aspectRatio: "4:5",
          safeAreaPercent: { top: 0, right: 0, bottom: 0, left: 0 },
          headline: "",
          subhead: "",
          alignment: "center" as const,
          theme: "light" as const,
        },
        caption: "",
        hashtags: "",
        editorialMode: false,
      };
    }
  }

  async chat(
    brandId: string,
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    language: "es" | "en" = "en",
    attachmentBase64?: string,
    attachmentMimeType?: string,
  ): Promise<ChatResponse> {
    const context = await this.getBrandContext(brandId, userId);
    const systemPrompt = this.buildSystemPrompt(context, language);
    const wantsImage = this.isImageRequest(message, language);

    if (wantsImage) {
      const promptResult = await this.generateImagePrompt(
        message,
        context,
        language,
        conversationHistory,
      );

      const { basePhotoPrompt, layoutPlan, caption, hashtags, editorialMode } =
        promptResult;

      const generatedImage = await this.generateImage(
        basePhotoPrompt,
        context,
        editorialMode,
      );

      if (generatedImage) {
        // Include layout plan info in text for editorial mode
        const layoutInfo = editorialMode
          ? `\n\n**Layout Plan** (for text overlay):\n- Headline: ${layoutPlan.headline}\n- Subhead: ${layoutPlan.subhead}${layoutPlan.cta ? `\n- CTA: ${layoutPlan.cta}` : ""}`
          : "";

        const textResponse =
          language === "es"
            ? `¡Aquí está tu imagen${editorialMode ? " editorial" : ""}! 🎨${layoutInfo}\n\n**Caption sugerido:**\n${caption}\n\n**Hashtags:**\n${hashtags}\n\n¿Te gustaría que haga algún ajuste o genere otra versión?`
            : `Here's your${editorialMode ? " editorial" : ""} image! 🎨${layoutInfo}\n\n**Suggested caption:**\n${caption}\n\n**Hashtags:**\n${hashtags}\n\nWould you like me to make any adjustments or generate another version?`;

        return {
          text: textResponse,
          image: generatedImage,
          imagePrompt: basePhotoPrompt, // Keep compatibility with existing API
          layoutPlan: editorialMode ? layoutPlan : undefined, // Structured layoutPlan for frontend
          editorialMode,
        };
      } else {
        const errorResponse =
          language === "es"
            ? "Lo siento, no pude generar la imagen en este momento. ¿Podrías intentarlo de nuevo o ser más específico con lo que necesitas?"
            : "Sorry, I couldn't generate the image right now. Could you try again or be more specific about what you need?";

        return { text: errorResponse };
      }
    }

    // Build conversation history (limit to last 20 messages to avoid context overflow — Bug 30)
    const trimmedHistory = conversationHistory.slice(-20);
    const messages: any[] = [];

    for (const msg of trimmedHistory) {
      messages.push({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      });
    }

    const userParts: any[] = [{ text: message }];
    if (attachmentBase64 && attachmentMimeType) {
      userParts.push({
        inlineData: {
          mimeType: attachmentMimeType,
          data: attachmentBase64,
        },
      });
    }
    messages.push({
      role: "user" as const,
      parts: userParts,
    });

    let response: any;
    try {
      response = await generateContentWithRetry(getAI(), {
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          // Bug 19: Use systemInstruction instead of injecting as user message
          systemInstruction: systemPrompt,
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }, { label: "Boosty" });
    } catch (err) {
      console.error("[Boosty] Error generating response:", err);
      throw err;
    }

    return {
      text:
        response.text ||
        (language === "es"
          ? "Lo siento, no pude procesar tu mensaje. ¿Podrías intentar de nuevo?"
          : "Sorry, I couldn't process your message. Could you try again?"),
    };
  }

  async getQuickSuggestions(
    brandId: string,
    userId: string,
    language: "es" | "en" = "en",
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
