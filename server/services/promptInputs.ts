/**
 * promptInputs.ts
 *
 * Audit + normalization layer for the monthly content generation prompt.
 *
 * Responsibilities (no behavior change beyond cleanup):
 *   1. Read every variable the prompt template touches from the live context
 *   2. Flag null / undefined / empty / [object Object] / noisy / duplicated values
 *   3. Normalize: arrays -> readable strings, objects -> clean JSON, omit empties
 *   4. Surface a structured diagnostics object (console + return)
 *   5. Emit preflight critical warnings when load-bearing brand fields are missing
 *
 * The prompt templates consume the returned `NormalizedPromptInputs` in place of
 * raw context field access, so the prompt sees consistently formatted strings
 * regardless of what the DB has stored.
 */

import type { BrandAsset, BrandDesign } from "@shared/schema";
import type { PostGenerationContext } from "./postGenerator";
import { languageInstruction } from "./postGenerator";

export interface VariableDiagnostic {
  name: string;
  status: "ok" | "missing" | "empty" | "malformed" | "not_tracked" | "truncated";
  source: "brands" | "brand_designs" | "brand_essence" | "brand_assets" | "derived" | "context" | "n/a";
  length?: number;
  note?: string;
  preview?: string;
}

export interface PromptDiagnostics {
  brandId: string;
  generatedAt: string;
  variables: VariableDiagnostic[];
  criticalMissing: string[];
  warnings: string[];
  trackedCount: number;
  missingCount: number;
  notTrackedCount: number;
}

export interface NormalizedPromptInputs {
  // Identity
  brandName: string;
  brandDescription: string;
  brandCategory: string;
  brandStyle: string;
  // Visual
  colorPalette: string;
  fontPrimary: string;
  fontSecondary: string;
  logoLine: string;
  hasLogo: boolean;
  // Essence
  tone: string;
  personality: string;
  emotion: string;
  visualKeywords: string;
  promise: string;
  productContext: string;
  // Derived
  visualContext: string;
  productOrLocationGuidance: string;
  hasProducts: boolean;
  hasLocation: boolean;
  // Audience + voice (not currently in schema — resolved to best-effort strings)
  primaryGoal: string;
  secondaryGoal: string;
  targetAgeRange: string;
  targetIncomeLevel: string;
  targetAwarenessLevel: string;
  voiceFormal: string;
  voicePremium: string;
  voiceEmotional: string;
  voicePlayful: string;
  voiceDescription: string;
  contentFocus: string;
  sellingStyle: string;
  instagramCta: string;
  // Asset catalogs
  allAssetDescriptions: string;
  productCatalog: string;
  locationCatalog: string;
  assetCategoriesSummary: string;
  // Dynamic
  batchInstruction: string;
  postingScheduleInstructions: string;
  dateRestriction: string;
  languageLabel: string;
  preferredLanguage: string;
  // Meta
  diagnostics: PromptDiagnostics;
  isPreflightBlocked: boolean;
}

const NOT_PROVIDED = "Not specified";
const NOT_TRACKED = "Not tracked in brand profile yet";

function isBlank(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim() === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  if (typeof v === "object" && Object.keys(v as object).length === 0) return true;
  return false;
}

function toCleanString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join(", ");
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
}

function isObjectObject(s: string): boolean {
  return s.includes("[object Object]");
}

function preview(s: string, max = 60): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

function auditValue(
  name: string,
  raw: unknown,
  source: VariableDiagnostic["source"],
  opts: { isTracked?: boolean; softLimit?: number } = {},
): VariableDiagnostic {
  const tracked = opts.isTracked !== false;
  const clean = toCleanString(raw);

  if (!tracked) {
    return { name, status: "not_tracked", source };
  }
  if (isBlank(raw)) {
    return { name, status: "missing", source, note: "field is null/undefined" };
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return { name, status: "empty", source, note: "empty string" };
  }
  if (Array.isArray(raw) && raw.length === 0) {
    return { name, status: "empty", source, note: "empty array" };
  }
  if (isObjectObject(clean)) {
    return { name, status: "malformed", source, note: "contains [object Object]", preview: preview(clean) };
  }
  if (opts.softLimit && clean.length > opts.softLimit) {
    return {
      name,
      status: "truncated",
      source,
      length: clean.length,
      note: `exceeds soft limit of ${opts.softLimit} chars`,
      preview: preview(clean),
    };
  }
  return { name, status: "ok", source, length: clean.length, preview: preview(clean) };
}

function dedupeAndJoin(items: string[], sep = ", "): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = (raw ?? "").toString().trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out.join(sep);
}

function buildColorPalette(design: BrandDesign | undefined): string {
  if (!design) return "";
  return dedupeAndJoin([
    design.colorPrimary || "",
    design.colorAccent1 || "",
    design.colorAccent2 || "",
    design.colorAccent3 || "",
    design.colorAccent4 || "",
  ]);
}

function buildLogoLine(design: BrandDesign | undefined): { line: string; hasLogo: boolean } {
  const url = design?.whiteLogoUrl || design?.blackLogoUrl || design?.logoUrl;
  if (!url) return { line: "- No brand logo uploaded", hasLogo: false };
  return {
    line: `- Brand Logo URL: ${url}\n- IMPORTANT: Incorporate the brand logo as a subtle, non-distorted element (engraving, small emblem on packaging, watermark) — never alter its shape or invent variants.`,
    hasLogo: true,
  };
}

function buildAssetCatalogs(brandAssets: BrandAsset[]) {
  const productAssets = brandAssets.filter(
    (a) =>
      a.category &&
      ["product_images", "product", "products", "product_assets"].includes(a.category) &&
      a.assetType === "image",
  );
  const locationAssets = brandAssets.filter(
    (a) =>
      a.category &&
      ["location", "location_images", "location_assets", "place"].includes(a.category) &&
      a.assetType === "image",
  );

  const productLines = productAssets
    .map((p) => {
      const desc = ((p as any).description || "").trim();
      return `- PRODUCT: ${p.name}${desc ? `. DETAILS: ${desc.slice(0, 400)}` : ""}`;
    })
    .filter(Boolean);
  const locationLines = locationAssets
    .map((l) => {
      const desc = ((l as any).description || "").trim();
      return `- LOCATION: ${l.name}${desc ? `. Environment: ${desc.slice(0, 400)}` : ""}`;
    })
    .filter(Boolean);

  const allLines = brandAssets
    .filter((a) => a && a.name)
    .map((a) => {
      const cat = a.category || "general";
      const desc = ((a as any).description || "").trim();
      return `- ${a.name} (${cat})${desc ? `: ${desc.slice(0, 200)}` : ""}`;
    });

  const byCategory = brandAssets.reduce<Record<string, string[]>>((acc, a) => {
    const cat = a.category || "general";
    if (!acc[cat]) acc[cat] = [];
    if (a.name) acc[cat].push(a.name);
    return acc;
  }, {});
  const categorySummary = Object.entries(byCategory)
    .map(([cat, items]) => `- ${cat}: ${items.join(", ")}`)
    .join("\n");

  return {
    productCatalog: productLines.join("\n") || "No product assets uploaded yet",
    locationCatalog: locationLines.join("\n") || "No location assets uploaded yet",
    allAssetDescriptions: allLines.join("\n") || "No assets uploaded yet",
    assetCategoriesSummary: categorySummary || "No categorized assets",
    hasProducts: productAssets.length > 0,
    hasLocation: locationAssets.length > 0,
  };
}

function buildDateRestriction(month: number, year: number): string {
  const monthName = new Date(year, month - 1).toLocaleString("en-US", { month: "long" });
  const now = new Date();
  const startDay =
    year === now.getFullYear() && month === now.getMonth() + 1 ? now.getDate() : 1;
  const lastDay = new Date(year, month, 0).getDate();
  return startDay > 1
    ? `CRITICAL DATE RESTRICTION: Today is ${monthName} ${now.getDate()}, ${year}. Generate posts ONLY for dates from ${monthName} ${startDay} to ${monthName} ${lastDay}. DO NOT generate any posts for dates before ${monthName} ${startDay}.`
    : `Generate posts for the entire month of ${monthName} (days 1-${lastDay}).`;
}

function buildPostingScheduleInstructions(context: PostGenerationContext): {
  text: string;
  totalPosts: number;
} {
  const { postingSchedule } = context;
  if (!postingSchedule || postingSchedule.length === 0) {
    return {
      text: "POSTING SCHEDULE:\n- Generate posts distributed evenly across the month\n- Aim for 3-4 posts per week per platform",
      totalPosts: 15,
    };
  }
  let total = 0;
  const lines = postingSchedule
    .map((s) => {
      const label =
        s.platform === "instagram"
          ? "Instagram"
          : s.platform === "facebook"
            ? "Facebook"
            : s.platform;
      total += s.postingDates.length;
      return `- ${label}: Generate ${s.postingDates.length} posts on these EXACT dates: ${s.postingDates.join(", ")}`;
    })
    .join("\n");
  return {
    text: `POSTING SCHEDULE (from brand settings - DO NOT deviate from these dates):\n${lines}\n\nTOTAL POSTS TO GENERATE: ${total}\n\nCRITICAL: You MUST generate posts ONLY for the dates listed above for each platform.`,
    totalPosts: total,
  };
}

function buildVisualContext(hasProducts: boolean, hasLocation: boolean): string {
  if (hasProducts)
    return "The brand has real product images available. Feature them naturally — on elegant surfaces, in lifestyle contexts, or being used/worn.";
  if (hasLocation)
    return "The brand has real location images (clinic/restaurant/store/office). Use them as-is — DO NOT alter architecture, furniture, or colors. Adjust only lighting/framing/composition.";
  return "The brand has no product or location images. Create lifestyle or brand-mood visuals from scratch that match the brand essence.";
}

function buildProductOrLocationGuidance(hasProducts: boolean, hasLocation: boolean): string {
  if (hasProducts)
    return "Focus visuals on product hero shots and contextual lifestyle scenes featuring the actual catalog items.";
  if (hasLocation)
    return "Focus visuals on the real physical space. Preserve the location faithfully — no alterations.";
  return "Focus on aspirational lifestyle imagery that expresses the brand essence, not hypothetical products.";
}

function buildBatchInstruction(totalPosts: number, platforms: string[]): string {
  const platformList = platforms.length > 0 ? platforms.join(" + ") : "Instagram";
  return `Produce ${totalPosts} total posts across ${platformList}, each distinct in angle and visual direction. No two posts should share the same hook, image concept, or CTA phrasing.`;
}

/**
 * Read a field from brands.settings JSONB (where optional profiling lives if
 * the client has added those inputs client-side). Falls back to undefined.
 */
function readFromSettings(settings: unknown, ...keys: string[]): unknown {
  if (!settings || typeof settings !== "object") return undefined;
  for (const key of keys) {
    const v = (settings as any)[key];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

export function buildNormalizedPromptInputs(
  context: PostGenerationContext,
  brandSettings?: unknown,
): NormalizedPromptInputs {
  const {
    brandId,
    brandName,
    brandDescription,
    brandDesign,
    brandAssets,
    brandEssence,
    month,
    year,
    connectedPlatforms,
  } = context;

  const preferredLanguage =
    context.preferredLanguage || (brandDesign?.preferredLanguage as string) || "en";
  const languageLabel = languageInstruction(preferredLanguage);

  const colorPalette = buildColorPalette(brandDesign);
  const logoInfo = buildLogoLine(brandDesign);
  const assetCatalogs = buildAssetCatalogs(brandAssets);
  const schedule = buildPostingScheduleInstructions(context);
  const dateRestriction = buildDateRestriction(month, year);
  const visualContext = buildVisualContext(assetCatalogs.hasProducts, assetCatalogs.hasLocation);
  const productOrLocationGuidance = buildProductOrLocationGuidance(
    assetCatalogs.hasProducts,
    assetCatalogs.hasLocation,
  );
  const platforms = (connectedPlatforms && connectedPlatforms.length > 0
    ? connectedPlatforms
    : ["instagram"]) as string[];
  const batchInstruction = buildBatchInstruction(schedule.totalPosts, platforms);

  // Raw audit inputs
  const rawBrandCategory = readFromSettings(brandSettings, "brandCategory");
  const rawPrimaryGoal = readFromSettings(brandSettings, "primaryGoal");
  const rawSecondaryGoal = readFromSettings(brandSettings, "secondaryGoal");
  const rawTargetAgeRange = readFromSettings(brandSettings, "targetAgeRange");
  const rawTargetIncomeLevel = readFromSettings(brandSettings, "targetIncomeLevel");
  const rawTargetAwarenessLevel = readFromSettings(brandSettings, "targetAwarenessLevel");
  const rawVoiceFormal = readFromSettings(brandSettings, "voiceFormal");
  const rawVoicePremium = readFromSettings(brandSettings, "voicePremium");
  const rawVoiceEmotional = readFromSettings(brandSettings, "voiceEmotional");
  const rawVoicePlayful = readFromSettings(brandSettings, "voicePlayful");
  const rawVoiceDescription = readFromSettings(brandSettings, "voiceDescription");
  const rawContentFocus = readFromSettings(brandSettings, "contentFocus");
  const rawSellingStyle = readFromSettings(brandSettings, "sellingStyle");
  const rawInstagramCta = readFromSettings(brandSettings, "instagramCta", "defaultCta");

  const productContext = assetCatalogs.hasProducts
    ? "The brand has product images available. Focus on showcasing products, benefits, and real use cases."
    : "The brand has no product images yet. Focus on brand awareness, lifestyle, and engagement content.";

  // ─── Diagnostics ────────────────────────────────────────────────────────
  const diag: VariableDiagnostic[] = [];

  diag.push(auditValue("brandName", brandName, "brands"));
  diag.push(auditValue("brandDescription", brandDescription, "brands", { softLimit: 2000 }));
  diag.push(auditValue("brandCategory", rawBrandCategory, "brands", { isTracked: rawBrandCategory !== undefined }));
  diag.push(auditValue("brandStyle", brandDesign?.brandStyle, "brand_designs"));
  diag.push(auditValue("colorPalette", colorPalette, "derived"));
  diag.push(auditValue("fontPrimary", brandDesign?.fontPrimary, "brand_designs"));
  diag.push(auditValue("fontSecondary", brandDesign?.fontSecondary, "brand_designs"));
  diag.push(auditValue("tone", brandEssence?.tone, "brand_essence"));
  diag.push(auditValue("personality", brandEssence?.personality, "brand_essence"));
  diag.push(auditValue("emotion", brandEssence?.emotion, "brand_essence"));
  diag.push(auditValue("visualKeywords", brandEssence?.visualKeywords, "brand_essence"));
  diag.push(auditValue("promise", brandEssence?.promise, "brand_essence"));
  diag.push(auditValue("productContext", productContext, "derived"));
  diag.push(auditValue("primaryGoal", rawPrimaryGoal, "brands", { isTracked: rawPrimaryGoal !== undefined }));
  diag.push(auditValue("secondaryGoal", rawSecondaryGoal, "brands", { isTracked: rawSecondaryGoal !== undefined }));
  diag.push(auditValue("targetAgeRange", rawTargetAgeRange, "brands", { isTracked: rawTargetAgeRange !== undefined }));
  diag.push(auditValue("targetIncomeLevel", rawTargetIncomeLevel, "brands", { isTracked: rawTargetIncomeLevel !== undefined }));
  diag.push(auditValue("targetAwarenessLevel", rawTargetAwarenessLevel, "brands", { isTracked: rawTargetAwarenessLevel !== undefined }));
  diag.push(auditValue("voiceFormal", rawVoiceFormal, "brands", { isTracked: rawVoiceFormal !== undefined }));
  diag.push(auditValue("voicePremium", rawVoicePremium, "brands", { isTracked: rawVoicePremium !== undefined }));
  diag.push(auditValue("voiceEmotional", rawVoiceEmotional, "brands", { isTracked: rawVoiceEmotional !== undefined }));
  diag.push(auditValue("voicePlayful", rawVoicePlayful, "brands", { isTracked: rawVoicePlayful !== undefined }));
  diag.push(auditValue("voiceDescription", rawVoiceDescription, "brands", { isTracked: rawVoiceDescription !== undefined }));
  diag.push(auditValue("contentFocus", rawContentFocus, "brands", { isTracked: rawContentFocus !== undefined }));
  diag.push(auditValue("sellingStyle", rawSellingStyle, "brands", { isTracked: rawSellingStyle !== undefined }));
  diag.push(auditValue("allAssetDescriptions", assetCatalogs.allAssetDescriptions, "derived", { softLimit: 8000 }));
  diag.push(auditValue("productCatalog", assetCatalogs.productCatalog, "derived", { softLimit: 6000 }));
  diag.push(auditValue("locationCatalog", assetCatalogs.locationCatalog, "derived", { softLimit: 6000 }));
  diag.push(auditValue("assetCategoriesSummary", assetCatalogs.assetCategoriesSummary, "derived"));
  diag.push(auditValue("visualContext", visualContext, "derived"));
  diag.push(auditValue("productOrLocationGuidance", productOrLocationGuidance, "derived"));
  diag.push(auditValue("batchInstruction", batchInstruction, "derived"));
  diag.push(auditValue("postingScheduleInstructions", schedule.text, "derived"));
  diag.push(auditValue("dateRestriction", dateRestriction, "derived"));
  diag.push(auditValue("instagramCta", rawInstagramCta, "brands", { isTracked: rawInstagramCta !== undefined }));
  diag.push(auditValue("languageLabel", languageLabel, "derived"));

  // ─── Preflight validation ───────────────────────────────────────────────
  // Critical = without these the output CANNOT be on-brand. Warning but not block.
  const CRITICAL = ["brandName", "brandDescription", "colorPalette", "tone"];
  const criticalMissing = CRITICAL.filter((k) => {
    const v = diag.find((d) => d.name === k);
    return v && (v.status === "missing" || v.status === "empty");
  });

  const warnings: string[] = [];
  if (criticalMissing.length > 0) {
    warnings.push(
      `Critical brand fields missing: ${criticalMissing.join(", ")}. Content will default to generic language.`,
    );
  }
  const malformed = diag.filter((d) => d.status === "malformed");
  if (malformed.length > 0) {
    warnings.push(`Malformed values: ${malformed.map((m) => m.name).join(", ")}`);
  }

  const diagnostics: PromptDiagnostics = {
    brandId,
    generatedAt: new Date().toISOString(),
    variables: diag,
    criticalMissing,
    warnings,
    trackedCount: diag.filter((d) => d.status !== "not_tracked").length,
    missingCount: diag.filter((d) => d.status === "missing" || d.status === "empty").length,
    notTrackedCount: diag.filter((d) => d.status === "not_tracked").length,
  };

  const tracked = (d?: VariableDiagnostic): boolean =>
    !!d && d.status !== "not_tracked" && d.status !== "missing" && d.status !== "empty";
  const getOr = (name: string, fallback: string): string => {
    const entry = diag.find((d) => d.name === name);
    if (!tracked(entry)) return fallback;
    if (entry?.status === "not_tracked") return fallback;
    // return clean string
    const raw =
      name === "brandName" ? brandName
      : name === "brandDescription" ? brandDescription
      : name === "brandCategory" ? rawBrandCategory
      : name === "brandStyle" ? brandDesign?.brandStyle
      : name === "colorPalette" ? colorPalette
      : name === "fontPrimary" ? brandDesign?.fontPrimary
      : name === "fontSecondary" ? brandDesign?.fontSecondary
      : name === "tone" ? brandEssence?.tone
      : name === "personality" ? brandEssence?.personality
      : name === "emotion" ? brandEssence?.emotion
      : name === "visualKeywords" ? brandEssence?.visualKeywords
      : name === "promise" ? brandEssence?.promise
      : name === "primaryGoal" ? rawPrimaryGoal
      : name === "secondaryGoal" ? rawSecondaryGoal
      : name === "targetAgeRange" ? rawTargetAgeRange
      : name === "targetIncomeLevel" ? rawTargetIncomeLevel
      : name === "targetAwarenessLevel" ? rawTargetAwarenessLevel
      : name === "voiceFormal" ? rawVoiceFormal
      : name === "voicePremium" ? rawVoicePremium
      : name === "voiceEmotional" ? rawVoiceEmotional
      : name === "voicePlayful" ? rawVoicePlayful
      : name === "voiceDescription" ? rawVoiceDescription
      : name === "contentFocus" ? rawContentFocus
      : name === "sellingStyle" ? rawSellingStyle
      : name === "instagramCta" ? rawInstagramCta
      : undefined;
    const s = toCleanString(raw);
    return s || fallback;
  };

  return {
    brandName: getOr("brandName", "Unnamed Brand"),
    brandDescription: getOr("brandDescription", NOT_PROVIDED),
    brandCategory: getOr("brandCategory", NOT_TRACKED),
    brandStyle: getOr("brandStyle", "modern"),
    colorPalette: colorPalette || NOT_PROVIDED,
    fontPrimary: getOr("fontPrimary", NOT_PROVIDED),
    fontSecondary: getOr("fontSecondary", NOT_PROVIDED),
    logoLine: logoInfo.line,
    hasLogo: logoInfo.hasLogo,
    tone: getOr("tone", NOT_PROVIDED),
    personality: getOr("personality", NOT_PROVIDED),
    emotion: getOr("emotion", NOT_PROVIDED),
    visualKeywords: getOr("visualKeywords", NOT_PROVIDED),
    promise: getOr("promise", NOT_PROVIDED),
    productContext,
    visualContext,
    productOrLocationGuidance,
    hasProducts: assetCatalogs.hasProducts,
    hasLocation: assetCatalogs.hasLocation,
    primaryGoal: getOr("primaryGoal", NOT_TRACKED),
    secondaryGoal: getOr("secondaryGoal", NOT_TRACKED),
    targetAgeRange: getOr("targetAgeRange", NOT_TRACKED),
    targetIncomeLevel: getOr("targetIncomeLevel", NOT_TRACKED),
    targetAwarenessLevel: getOr("targetAwarenessLevel", NOT_TRACKED),
    voiceFormal: getOr("voiceFormal", NOT_TRACKED),
    voicePremium: getOr("voicePremium", NOT_TRACKED),
    voiceEmotional: getOr("voiceEmotional", NOT_TRACKED),
    voicePlayful: getOr("voicePlayful", NOT_TRACKED),
    voiceDescription: getOr("voiceDescription", NOT_TRACKED),
    contentFocus: getOr("contentFocus", NOT_TRACKED),
    sellingStyle: getOr("sellingStyle", NOT_TRACKED),
    instagramCta: getOr("instagramCta", "Learn more"),
    allAssetDescriptions: assetCatalogs.allAssetDescriptions,
    productCatalog: assetCatalogs.productCatalog,
    locationCatalog: assetCatalogs.locationCatalog,
    assetCategoriesSummary: assetCatalogs.assetCategoriesSummary,
    batchInstruction,
    postingScheduleInstructions: schedule.text,
    dateRestriction,
    languageLabel,
    preferredLanguage,
    diagnostics,
    isPreflightBlocked: false, // preflight warns, does NOT block (keep behavior unchanged)
  };
}

/**
 * Logs the fully rendered prompt and diagnostics object to stdout.
 * Gated behind LEADBOOST_PROMPT_DEBUG=1 so production logs stay clean.
 * When enabled, also returns a structured object the caller can attach to a job.
 */
export function logPromptDebug(
  label: string,
  renderedPrompt: string,
  normalized: NormalizedPromptInputs,
): void {
  if (process.env.LEADBOOST_PROMPT_DEBUG !== "1") return;
  const d = normalized.diagnostics;
  console.log("\n" + "═".repeat(72));
  console.log(`[PromptDebug:${label}] brandId=${d.brandId}  at=${d.generatedAt}`);
  console.log("─".repeat(72));
  console.log("[PromptDebug] Variable audit:");
  for (const v of d.variables) {
    const tag =
      v.status === "ok" ? "OK "
      : v.status === "missing" ? "!! "
      : v.status === "empty" ? "-- "
      : v.status === "malformed" ? "XX "
      : v.status === "truncated" ? "TR "
      : "nt ";
    console.log(`  ${tag}${v.name.padEnd(30)} [${v.source}]${v.length ? ` len=${v.length}` : ""}${v.preview ? ` :: ${v.preview}` : ""}${v.note ? ` (${v.note})` : ""}`);
  }
  if (d.criticalMissing.length > 0) {
    console.log("─".repeat(72));
    console.log(`[PromptDebug] PREFLIGHT WARNING — critical missing: ${d.criticalMissing.join(", ")}`);
  }
  if (d.warnings.length > 0) {
    console.log("─".repeat(72));
    console.log("[PromptDebug] Warnings:");
    for (const w of d.warnings) console.log(`  - ${w}`);
  }
  console.log("─".repeat(72));
  console.log("[PromptDebug] Rendered prompt:");
  console.log(renderedPrompt);
  console.log("═".repeat(72) + "\n");
}

/**
 * Always-on structured preflight warning to server log (even without debug flag).
 * Helps surface silent brand-data gaps in production without flooding logs.
 */
export function logPreflightWarnings(label: string, normalized: NormalizedPromptInputs): void {
  const d = normalized.diagnostics;
  if (d.criticalMissing.length > 0) {
    console.warn(
      `[PromptPreflight:${label}] brandId=${d.brandId} missing critical fields: ${d.criticalMissing.join(", ")} — content may be generic`,
    );
  }
  const malformed = d.variables.filter((v) => v.status === "malformed");
  if (malformed.length > 0) {
    console.warn(
      `[PromptPreflight:${label}] brandId=${d.brandId} malformed fields: ${malformed.map((m) => m.name).join(", ")}`,
    );
  }
}
