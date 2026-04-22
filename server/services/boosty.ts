import { GoogleGenAI, Modality, Type } from "@google/genai";
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
    /\b(flyer|poster|cartel|volante|panfleto|banner|afiche|story|stories|ad|anuncio|promo|promotion|campaign|campa[nñ]a)\b/i,
    /\b(text\s*overlay|texto\s*sobre|letras\s*grandes|bold\s*text|texto\s*promocional)\b/i,
    /\b(include\s*text|incluir\s*texto|con\s*texto|texto\s*llamativo)\b/i,
    /\b(graphic|infographic|gráfico|infografía)\b/i,
  ];

  if (flyerPatterns.some((p) => p.test(lowerMsg))) {
    return false;
  }

  // Any concrete promotional brief (offer, dates, discount) → NOT editorial.
  // The user wants ad creative with text, dates, CTA — not a moody photo.
  const promoSignals = [
    /\b\d{1,2}\s*%\s*(?:off|de\s*descuento|descuento|menos)\b/i,
    /\b(2x1|3x2|combo|bundle|free\s+\w+|gratis\s+\w+)\b/i,
    /\b(oferta|promoci[oó]n|descuento|sale|deal|discount)\b/i,
    /\b(v[aá]lido|valid|del?\s*\d{1,2}\s*(?:al|to|hasta)\s*\d{1,2})\b/i,
    /\b(book|agenda|reserva|sign\s*up|reg[ií]strate|swipe up)\b/i,
  ];
  if (promoSignals.some((p) => p.test(userMessage))) {
    return false;
  }

  // Editorial mode only for premium brand styles or explicit editorial keywords
  const editorialTriggers = [
    /\b(editorial|magazine|brand\s*photo|lifestyle\s*photo|photoshoot|sesi[oó]n\s*de\s*fotos)\b/i,
    /\b(clean\s*image|imagen\s*limpia|just\s*a\s*photo|s[oó]lo\s*una\s*foto)\b/i,
  ];

  const styleEditorial = false; // brand style alone shouldn't force editorial — too many beauty brands

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

// ========================================
// CAMPAIGN BRIEF DETECTION
// ========================================
// Looks at the user's request + recent chat history to figure out if they've
// given enough specifics to produce real ad creative, or if Boosty should
// ask clarifying questions first.
interface CampaignBrief {
  hasOffer: boolean;       // % off / promo / discount / sale / free / 2x1
  hasDates: boolean;       // month names, date ranges, "this week", etc.
  hasService: boolean;     // specific product or treatment named
  hasCTA: boolean;         // book / agenda / DM / sign up / etc.
  hasTheme: boolean;       // FIFA / Black Friday / Christmas / Valentine's
  completeness: number;    // 0..1
  extracted: {
    offer?: string;
    service?: string;
    cta?: string;
    dates?: string;
    theme?: string;
  };
}

function detectCampaignBrief(message: string, history: ChatMessage[] = []): CampaignBrief {
  // Combine current message with recent assistant→user exchanges so multi-turn
  // briefs also count (e.g., user said "create story", we asked for offer, they
  // said "20% off armonización facial").
  const recent = history.slice(-6).map((m) => m.content).join(" ");
  const text = `${message} ${recent}`;
  const lower = text.toLowerCase();

  const offerMatch = text.match(/\b(\d{1,2}\s*%\s*(?:off|de\s*descuento|descuento|menos)|2x1|3x2|free\s+\w+(?:\s+\w+)?|gratis\s+\w+(?:\s+\w+)?|combo|bundle)\b/i);
  const hasOffer = !!offerMatch || /\b(oferta|promoci[oó]n|descuento|sale|deal|discount|promo|special)\b/i.test(lower);

  // Capture month-with-day-range like "valid June 1-30" or "del 1 al 30 de junio"
  const dateMatch = text.match(/\b(?:v[aá]lid[oa]?\s*(?:from|del|until|hasta)?\s*)?((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*\d{0,2}\s*[-—–]?\s*\d{0,2}(?:\s*,?\s*\d{4})?)/i);
  const hasDates = !!dateMatch || /\b(\d{1,2}\s*[-—]\s*\d{1,2}|today|tomorrow|this week|next week|this month|next month|hoy|ma[nñ]ana|esta semana|pr[oó]xima semana|este mes|pr[oó]ximo mes|del?\s*\d{1,2}\s*(?:al|to|hasta)\s*\d{1,2})\b/i.test(lower);

  // Capture multi-word service names like "armonización facial", "botox lifting"
  const serviceMatch = text.match(/\b(armonizaci[oó]n\s+facial|tratamiento\s+\w+|botox|filler|relleno|consulta(?:ci[oó]n)?|peeling|lifting|massage|masaje|skincare|cuidado\s*de\s*piel|hidrataci[oó]n|microblading|l[aá]ser|facial|tratamiento|product[oa]?)\b/i);
  const hasService = !!serviceMatch;

  // Capture full CTAs like "agenda tu cita", "book your appointment", "DM us to reserve"
  const ctaMatch = text.match(/\b(agenda\s+(?:tu\s+)?(?:cita|consulta)|reserva\s+(?:tu\s+)?(?:cita|lugar|consulta)?(?:\s+ahora|\s+ya)?|book\s+(?:your\s+|an?\s+)?(?:appointment|consultation|spot|now)?|dm\s+(?:us\s+|me\s+)?(?:to\s+\w+)?|escr[ií]benos(?:\s+por\s+dm)?|message\s+us|contact\s+us|sched(?:ule)?\s+(?:your\s+|an?\s+)?(?:appointment|call)?|sign\s*up\s+(?:now|today)?|reg[ií]strate(?:\s+ahora)?|swipe\s+up|click\s+(?:link|here|now)?|buy\s+now|compra\s+ahora|llama|call\s+us)\b/i);
  const hasCTA = !!ctaMatch;

  // Capture themed events with year/qualifier like "FIFA World Cup 2026"
  const themeMatch = text.match(/\b(fifa\s+world\s+cup(?:\s+\d{4})?|world\s+cup(?:\s+\d{4})?|black\s+friday|cyber\s+monday|christmas|navidad|valentine'?s?(?:\s+day)?|san\s+valent[ií]n|halloween|new\s+year|a[nñ]o\s+nuevo|mother'?s\s+day|d[ií]a\s+de\s+las?\s+madres?|father'?s\s+day|d[ií]a\s+del\s+padre|easter|pascua|summer\s+sale|verano|winter\s+sale|invierno|spring\s+sale|primavera|fall\s+sale|oto[nñ]o|fifa)\b/i);
  const hasTheme = !!themeMatch;

  const flags = [hasOffer, hasDates, hasService, hasCTA, hasTheme];
  const completeness = flags.filter(Boolean).length / flags.length;

  return {
    hasOffer,
    hasDates,
    hasService,
    hasCTA,
    hasTheme,
    completeness,
    extracted: {
      offer: offerMatch?.[0],
      service: serviceMatch?.[0],
      cta: ctaMatch?.[0],
      dates: dateMatch?.[0],
      theme: themeMatch?.[0],
    },
  };
}

// Returns the bullet list of the questions Boosty should still ask. Empty
// array means we have enough to generate.
function missingBriefQuestions(
  brief: CampaignBrief,
  language: "es" | "en",
  brandName: string,
): string[] {
  const isSpanish = language === "es";
  const questions: string[] = [];
  if (!brief.hasOffer && !brief.hasTheme) {
    questions.push(
      isSpanish
        ? `¿Qué es lo que estamos promocionando? Una oferta (ej. *20% off*), un combo (ej. *2x1*), un evento (ej. *Mundial 2026*), o el servicio en sí?`
        : `What are we promoting? An offer (e.g. *20% off*), a bundle (e.g. *2-for-1*), an event (e.g. *FIFA 2026*), or just the service itself?`,
    );
  }
  if (!brief.hasService) {
    questions.push(
      isSpanish
        ? `¿Qué servicio o producto específico de **${brandName}** queremos destacar? (ej. armonización facial, botox, consulta, etc.)`
        : `Which specific service or product of **${brandName}** are we featuring? (e.g. facial harmonization, botox, consultation, etc.)`,
    );
  }
  if (!brief.hasDates) {
    questions.push(
      isSpanish
        ? `¿Hay fechas específicas? (ej. *válido del 1 al 30 de junio*, *este fin de semana*, *todo diciembre*)`
        : `Any specific dates? (e.g. *valid June 1-30*, *this weekend*, *all December*)`,
    );
  }
  if (!brief.hasCTA) {
    questions.push(
      isSpanish
        ? `¿Cuál es el call-to-action? (ej. *Agenda tu cita*, *Escríbenos por DM*, *Reserva ahora*)`
        : `What's the call-to-action? (e.g. *Book your appointment*, *DM us*, *Reserve now*)`,
    );
  }
  return questions;
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
      ? `Eres Boosty, el director creativo y estratega de marketing de Instagram para Lead Boost. Tu trabajo NO es generar contenido genérico — es entregar creativos publicitarios reales, listos para publicar, que un brand manager humano firmaría sin tocar. Siempre respondes en español.

CÓMO TRABAJAS:
- Cuando el usuario pide una imagen o post sin detalles ("crea una imagen", "haz un story"), NO generas algo genérico. Pides 2-3 detalles clave: oferta o ángulo, servicio específico, fechas, call-to-action.
- Cuando ya tienes un brief claro, produces creativos del nivel de Sephora / Apple / Nike: titular grande, sub-texto, CTA, logo, colores de marca.
- Caption y hashtags siempre específicos al brief — nunca "Innovation. Simplified." ni hashtags genéricos como #love #beauty.
- Hablas como un creativo senior, no como un chatbot. Directo, con opinión.`
      : `You are Boosty, the creative director and Instagram marketing strategist for Lead Boost. Your job is NOT to crank out generic content — it's to deliver real, ready-to-post ad creative that a human brand manager would publish unchanged. Always respond in English.

HOW YOU WORK:
- When the user asks for an image or post WITHOUT details ("create an image", "make a story"), do NOT generate anything generic. Ask for 2-3 specifics: offer or angle, specific service, dates, call-to-action.
- When you have a clear brief, you produce creative at the level of Sephora / Apple / Nike: oversized headline, sub-text, CTA, logo, brand colors.
- Captions and hashtags are always specific to the brief — never "Innovation. Simplified." or generic hashtags like #love #beauty.
- Talk like a senior creative, not a chatbot. Direct, with a point of view.`;

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
🎨 INSTAGRAM AD CREATIVE FOR "${brandName.toUpperCase()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${sanitizedPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ BRAND CONTEXT:
- Brand: ${brandName}
- Industry: ${industry || "general"}
- Brand colors (use prominently): ${colorPalette}

📐 OUTPUT REQUIREMENTS:
- Instagram 4:5 vertical composition (1080×1350)
- Premium polished AD CREATIVE — like a Sephora / Apple / Nike Instagram Story
- Sharp, modern typography hierarchy: oversized HEADLINE, smaller SUB, clear CTA button
- Render ALL the text from the prompt above directly INTO the image as legible typography (no separate overlay needed)
- The supplied reference image IS the brand logo — place it cleanly in a corner
- Use the brand color as the dominant background or as a bold accent panel
- High contrast, easy to read on a phone at thumb-scroll speed
- Professional commercial photography for the hero subject (not stock-looking)

✅ MUST INCLUDE: bold headline text, sub-text, CTA button, brand logo, brand color
⛔ AVOID: generic stock-photo composition, busy collage layouts, repeated promo banners, fake QR codes, no-text editorial moodiness
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

    // Pull a structured campaign brief out of the user's message + recent
    // history so the image generator can compose an actual ad, not a guess.
    const brief = detectCampaignBrief(userMessage, conversationHistory);
    const promotionDetails = brief.extracted.offer?.toUpperCase() ?? "";
    const themeName = brief.extracted.theme ?? "";
    const serviceName = brief.extracted.service ?? "";
    const ctaText = brief.extracted.cta ?? "";
    const datesText = brief.extracted.dates ?? "";

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
${themeName ? `THEME: ${themeName}` : ""}
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
      : `You are a senior creative director designing an Instagram Story / Post AD for "${context.brand.name}" (${context.brand.industry || "general business"}).

USER REQUEST: "${userMessage}"
${conversationContext ? `\nCONVERSATION CONTEXT:\n${conversationContext}\n` : ""}
BRAND:
- Style: ${context.design?.brandStyle || "modern and professional"}
- Primary color: ${context.design?.colors?.primary || "n/a"}
- Accent color: ${context.design?.colors?.accent1 || "n/a"}
- Headline font: ${context.design?.fonts?.primary || "modern sans-serif"}
- Logo available: ${context.design?.hasLogo ? "yes (will be supplied as a reference image)" : "no"}

CAMPAIGN BRIEF (extract from the request — do NOT invent missing fields):
- Offer / promo: ${promotionDetails || "(none specified — emphasize the service itself)"}
- Theme / event: ${themeName || "(none)"}
- Service / product featured: ${serviceName || "(general brand)"}
- Date range: ${datesText || "(unspecified)"}
- Call to action: ${ctaText || "(suggest one fitting the offer)"}

Your job is to produce a JSON object with:

1. "imagePrompt": A specific, vivid English description (max 220 words) for an actual Instagram Story-style ad creative. The description MUST instruct the image model to render:
   - A high-quality hero photo (a relevant model / scene / product detail — pick what fits the brief)
   - The brand primary color as the dominant background or accent panel
   - A BIG bold HEADLINE in ${context.design?.fonts?.primary || "a modern sans-serif"} that says the offer or service in 2-4 words${promotionDetails ? ` — feature "${promotionDetails}" in oversized type` : ""}
   - A sub-headline with the service name${serviceName ? ` ("${serviceName}")` : ""}${datesText ? ` and the date range ("${datesText}")` : ""}
   - A clean CTA button at the bottom that says "${ctaText || "Book now"}"
   - The brand logo clearly placed in the top corner (use the supplied logo reference image)
   - Professional ad layout, NOT a moody editorial shot — closer to a polished Apple/Nike/Sephora ad
   - 4:5 vertical composition, instagram-ready, sharp typography hierarchy

2. "caption": A persuasive caption in ${language === "es" ? "Spanish" : "English"} (max 220 chars).
   - Lead with a hook tied to the offer or theme
   - Mention the service, the offer (if any), and the date range (if any) by name
   - End with the CTA "${ctaText || "DM us to book"}"
   - Use 1-2 emojis max, never generic ones

3. "hashtags": 7-12 hashtags that are SPECIFIC: brand name, service, city/region (if any), event/theme${themeName ? ` ("${themeName}")` : ""}. No generic #love #beauty.

Respond ONLY with valid JSON.`;

    // Schema-locked JSON output. With responseSchema the model is guaranteed
    // to return parseable JSON with these exact fields populated — no need
    // for regex extraction or generic fallbacks.
    const briefSchema = editorialMode
      ? {
          type: Type.OBJECT,
          properties: {
            basePhotoPrompt: { type: Type.STRING },
            layoutPlan: {
              type: Type.OBJECT,
              properties: {
                aspectRatio: { type: Type.STRING },
                headline: { type: Type.STRING },
                subhead: { type: Type.STRING },
                cta: { type: Type.STRING },
                alignment: { type: Type.STRING },
                theme: { type: Type.STRING },
              },
              required: ["aspectRatio", "headline", "subhead", "alignment", "theme"],
            },
            caption: { type: Type.STRING },
            hashtags: { type: Type.STRING },
          },
          required: ["basePhotoPrompt", "layoutPlan", "caption", "hashtags"],
        }
      : {
          type: Type.OBJECT,
          properties: {
            imagePrompt: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.STRING },
          },
          required: ["imagePrompt", "caption", "hashtags"],
        };

    const response = await generateContentWithRetry(getAI(), {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.85,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: briefSchema as any,
      },
    });

    const text =
      response.text ||
      response.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join("") ||
      "";
    const parsed = JSON.parse(text);

    if (editorialMode) {
      const basePhotoPrompt = sanitizePrompt(parsed.basePhotoPrompt);
      const layoutPlan = sanitizeLayoutPlan(parsed.layoutPlan);
      return {
        basePhotoPrompt,
        layoutPlan,
        caption: parsed.caption,
        hashtags: parsed.hashtags,
        editorialMode: true,
      };
    }

    return {
      basePhotoPrompt: parsed.imagePrompt,
      layoutPlan: {
        aspectRatio: "4:5",
        safeAreaPercent: { top: 0, right: 0, bottom: 0, left: 0 },
        headline: "",
        subhead: "",
        alignment: "center" as const,
        theme: "light" as const,
      },
      caption: parsed.caption,
      hashtags: parsed.hashtags,
      editorialMode: false,
    };
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
      // Before generating, check if the user gave us a real campaign brief.
      // If not, ask clarifying questions instead of producing generic creative.
      const brief = detectCampaignBrief(message, conversationHistory);
      const questions = missingBriefQuestions(
        brief,
        language,
        context.brand.name,
      );
      // Need at least 2 of {offer/theme, service, dates, CTA} present to proceed.
      // (Theme alone counts as offer-like.)
      const hasMinimum =
        brief.completeness >= 0.4 &&
        (brief.hasOffer || brief.hasTheme) &&
        brief.hasService;

      if (!hasMinimum && questions.length > 0) {
        const intro =
          language === "es"
            ? `¡Genial! Para crear algo que valga la pena publicar y no se vea genérico, necesito un par de detalles. 🎯`
            : `Awesome! To create something actually worth posting (not generic), I just need a couple of details. 🎯`;
        const closing =
          language === "es"
            ? `\n\nResponde con los detalles y armo el creativo (imagen + caption + hashtags) listo para publicar.`
            : `\n\nReply with those details and I'll build the creative (image + caption + hashtags) ready to publish.`;
        return {
          text: `${intro}\n\n${questions.map((q) => `• ${q}`).join("\n")}${closing}`,
        };
      }

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
