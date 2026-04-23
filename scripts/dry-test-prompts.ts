/**
 * Dry-test the monthly content generation prompt assembly.
 *
 * Renders buildTextPrompt, buildPostsSkeletonPrompt, and buildTextFromImageVisionPrompt
 * against a fake PostGenerationContext that mimics the prodtest brand,
 * then prints the full rendered prompt + structured audit.
 *
 * Run with:  LEADBOOST_PROMPT_DEBUG=1 npx tsx scripts/dry-test-prompts.ts
 * (No DB / no network — pure prompt assembly dry-run.)
 */

import type { PostGenerationContext } from "../server/services/postGenerator";

// Side-effect import so buildTextPrompt sees the same module state as production.
import {
  buildTextPrompt,
  buildPostsSkeletonPrompt,
  buildTextFromImageVisionPrompt,
} from "../server/services/postGenerator";
import { buildNormalizedPromptInputs } from "../server/services/promptInputs";

process.env.LEADBOOST_PROMPT_DEBUG = "1";

const fakeContext: PostGenerationContext = {
  brandId: "e172cec4-bb92-4eb4-b203-7322d2387be1",
  brandName: "LeadBoost Demo",
  brandDescription:
    "An Instagram-first growth platform that helps service businesses turn followers into booked clients through AI-generated content.",
  preferredLanguage: "en",
  brandDesign: {
    id: "design-1",
    brandId: "e172cec4-bb92-4eb4-b203-7322d2387be1",
    brandStyle: "modern minimalist",
    colorPrimary: "#0A0A23",
    colorAccent1: "#3B82F6",
    colorAccent2: "#F59E0B",
    colorAccent3: null,
    colorAccent4: null,
    colorText1: "#FFFFFF",
    colorText2: null,
    colorText3: null,
    colorText4: null,
    fontPrimary: "Open Sans Bold",
    fontSecondary: "Open Sans Regular",
    customFonts: null,
    logoUrl: null,
    whiteLogoUrl: "https://example.com/logo-white.png",
    blackLogoUrl: null,
    whiteFaviconUrl: null,
    blackFaviconUrl: null,
    assets: null,
    isDesignStudioEnabled: true,
    preferredLanguage: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any,
  brandAssets: [
    {
      id: "a1",
      brandDesignId: "design-1",
      url: "https://example.com/assets/clinic-entrance.jpg",
      name: "clinic-entrance",
      category: "location",
      assetType: "image",
      publicId: "pid1",
      createdAt: new Date(),
      description:
        "Bright modern clinic entrance with large glass doors and warm lighting.",
      caption: null,
    } as any,
    {
      id: "a2",
      brandDesignId: "design-1",
      url: "https://example.com/assets/serum.jpg",
      name: "signature-serum",
      category: "product_images",
      assetType: "image",
      publicId: "pid2",
      createdAt: new Date(),
      description:
        "### SECTION A:\n1. **Color**: translucent amber\n2. **Size**: 30ml glass dropper\n### SECTION B:\nMarketing copy.",
      caption: null,
    } as any,
  ],
  month: 5,
  year: 2026,
  connectedPlatforms: ["instagram"],
  postingSchedule: [
    {
      platform: "instagram",
      frequencyDays: 3,
      daysWeek: ["mon", "wed", "fri"],
      postingDates: ["2026-05-04", "2026-05-06", "2026-05-08", "2026-05-11"],
    },
  ],
  brandEssence: {
    tone: "warm, confident, evidence-based",
    personality: "knowledgeable guide who doesn't preach",
    emotion: "calm reassurance + subtle excitement",
    visualKeywords: "clean, editorial, off-white backgrounds, natural light",
    promise: "Results you can feel within 14 days or your money back",
  },
  contentLearning: undefined,
  brandSettings: {
    primaryGoal: "book more consultations",
    targetAgeRange: "28-45",
    targetAwarenessLevel: "problem-aware",
    voiceDescription: "expert friend, not a salesperson",
    contentFocus: "education > promotion (70/30 split)",
    sellingStyle: "soft pull, not hard push",
    instagramCta: "Tap to book a free consult",
  },
};

function section(label: string) {
  const bar = "═".repeat(72);
  console.log(`\n${bar}\n${label}\n${bar}`);
}

async function main() {
  section("DRY-TEST 1 — buildNormalizedPromptInputs audit");
  const N = buildNormalizedPromptInputs(fakeContext, fakeContext.brandSettings);
  console.log(`brandId: ${N.diagnostics.brandId}`);
  console.log(`tracked: ${N.diagnostics.trackedCount}  missing: ${N.diagnostics.missingCount}  not_tracked: ${N.diagnostics.notTrackedCount}`);
  console.log(`criticalMissing: ${JSON.stringify(N.diagnostics.criticalMissing)}`);
  console.log(`warnings:`);
  for (const w of N.diagnostics.warnings) console.log(`  - ${w}`);
  console.log(`\nVariable audit:`);
  for (const v of N.diagnostics.variables) {
    const tag =
      v.status === "ok" ? "OK "
      : v.status === "missing" ? "!! "
      : v.status === "empty" ? "-- "
      : v.status === "malformed" ? "XX "
      : v.status === "truncated" ? "TR "
      : "nt ";
    const preview = v.preview ? ` :: ${v.preview}` : "";
    const len = v.length ? ` len=${v.length}` : "";
    console.log(`  ${tag}${v.name.padEnd(30)} [${v.source}]${len}${preview}`);
  }

  section("DRY-TEST 2 — buildTextPrompt (FULL mode) rendered output");
  const fullPrompt = buildTextPrompt(fakeContext);
  console.log(fullPrompt);

  section("DRY-TEST 3 — buildPostsSkeletonPrompt rendered output");
  const skeletonPrompt = buildPostsSkeletonPrompt(fakeContext);
  console.log(skeletonPrompt);

  section("DRY-TEST 4 — buildTextFromImageVisionPrompt rendered output");
  const visionPrompt = buildTextFromImageVisionPrompt(fakeContext);
  console.log(visionPrompt);

  section("DRY-TEST 5 — summary");
  console.log(`Total prompt variables tracked: ${N.diagnostics.trackedCount}`);
  console.log(`Missing/empty: ${N.diagnostics.missingCount}`);
  console.log(`Not tracked in schema: ${N.diagnostics.notTrackedCount}`);
  console.log(`Preflight blocked: ${N.isPreflightBlocked ? "YES" : "no"}`);
  console.log(`Critical missing count: ${N.diagnostics.criticalMissing.length}`);
  console.log("\nDONE.");
}

main().catch((e) => {
  console.error("Dry-test failed:", e);
  process.exit(1);
});
