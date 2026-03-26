// mappers/brandDesign.ts
import { BrandDesign, InsertBrandDesign } from "@shared/schema";

export function mapToDb(data: any): InsertBrandDesign {
  return {
    brandId: data.brandId,
    brandStyle: data.brandStyle,
    colorPrimary: data.colorPalette?.primary || null,
    colorAccent1: data.colorPalette?.accent1 || null,
    colorAccent2: data.colorPalette?.accent2 || null,
    colorAccent3: data.colorPalette?.accent3 || null,
    colorAccent4: data.colorPalette?.accent4 || null,
    colorText1: data.colorPalette?.text1 || null,
    colorText2: data.colorPalette?.text2 || null,
    colorText3: data.colorPalette?.text3 || null,
    colorText4: data.colorPalette?.text4 || null,
    fontPrimary: data.typography?.primary || null,
    fontSecondary: data.typography?.secondary || null,
    customFonts: data.typography?.customFonts || [],
    logoUrl: data.logoUrl || null,
    whiteLogoUrl: data.whiteLogoUrl || null,
    blackLogoUrl: data.blackLogoUrl || null,
    whiteFaviconUrl: data.whiteFaviconUrl || null,
    blackFaviconUrl: data.blackFaviconUrl || null,
    assets: data.brandKit?.assets || [],
    isDesignStudioEnabled: data.isDesignStudioEnabled ?? false,
    preferredLanguage: data.preferredLanguage || null,
  };
}

export function mapPartialToDb(data: any): Partial<InsertBrandDesign> {
  const m: Partial<InsertBrandDesign> = {};
  if (data.brandId !== undefined) m.brandId = data.brandId;
  if (data.brandStyle !== undefined) m.brandStyle = data.brandStyle;

  if (data.colorPalette?.primary !== undefined)
    m.colorPrimary = data.colorPalette.primary;
  if (data.colorPalette?.accent1 !== undefined)
    m.colorAccent1 = data.colorPalette.accent1;
  if (data.colorPalette?.accent2 !== undefined)
    m.colorAccent2 = data.colorPalette.accent2;
  if (data.colorPalette?.accent3 !== undefined)
    m.colorAccent3 = data.colorPalette.accent3;
  if (data.colorPalette?.accent4 !== undefined)
    m.colorAccent4 = data.colorPalette.accent4;
  if (data.colorPalette?.text1 !== undefined)
    m.colorText1 = data.colorPalette.text1;
  if (data.colorPalette?.text2 !== undefined)
    m.colorText2 = data.colorPalette.text2;
  if (data.colorPalette?.text3 !== undefined)
    m.colorText3 = data.colorPalette.text3;
  if (data.colorPalette?.text4 !== undefined)
    m.colorText4 = data.colorPalette.text4;

  if (data.typography?.primary !== undefined)
    m.fontPrimary = data.typography.primary;
  if (data.typography?.secondary !== undefined)
    m.fontSecondary = data.typography.secondary;
  if (data.typography?.customFonts !== undefined)
    m.customFonts = data.typography.customFonts;

  if (data.logoUrl !== undefined) m.logoUrl = data.logoUrl;
  if (data.whiteLogoUrl !== undefined) m.whiteLogoUrl = data.whiteLogoUrl;
  if (data.blackLogoUrl !== undefined) m.blackLogoUrl = data.blackLogoUrl;
  if (data.whiteFaviconUrl !== undefined)
    m.whiteFaviconUrl = data.whiteFaviconUrl;
  if (data.blackFaviconUrl !== undefined)
    m.blackFaviconUrl = data.blackFaviconUrl;

  if (data.brandKit?.assets !== undefined) m.assets = data.brandKit.assets;
  if (data.isDesignStudioEnabled !== undefined)
    m.isDesignStudioEnabled = data.isDesignStudioEnabled;
  if (data.preferredLanguage !== undefined)
    m.preferredLanguage = data.preferredLanguage;

  return m;
}

export function mapFromDb(row: BrandDesign): BrandDesign & {
  colorPalette: Record<string, string | null>;
  typography: { primary: string | null; secondary: string | null; customFonts: any[] };
  brandKit: { assets: any[] };
} {
  return {
    ...row,
    colorPalette: {
      primary: row.colorPrimary,
      accent1: row.colorAccent1,
      accent2: row.colorAccent2,
      accent3: row.colorAccent3,
      accent4: row.colorAccent4,
      text1: row.colorText1,
      text2: row.colorText2,
      text3: row.colorText3,
      text4: row.colorText4,
    },
    typography: {
      primary: row.fontPrimary,
      secondary: row.fontSecondary,
      customFonts: (row.customFonts as any[]) || [],
    },
    brandKit: {
      assets: (row.assets as any[]) || [],
    },
  };
}
