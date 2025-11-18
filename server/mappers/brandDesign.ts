// mappers/brandDesign.ts
import { BrandDesign, InsertBrandDesign } from "@shared/schema";

export function mapToDb(data: any): InsertBrandDesign {
  const mapped = {
    brandId: data.brandId,
    brandStyle: data.brandStyle,
    colorPrimary: data.colorPalette?.primary || null,
    colorAccent1: data.colorPalette?.accent1 || null,
    colorAccent2: data.colorPalette?.accent2 || null,
    colorText1: data.colorPalette?.text1 || null,
    colorText2: data.colorPalette?.text2 || null,
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
  };
  console.log("[Mapper] mapToDb input brandId:", data.brandId);
  console.log("[Mapper] mapToDb output:", mapped);
  return mapped;
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
  if (data.colorPalette?.text1 !== undefined)
    m.colorText1 = data.colorPalette.text1;
  if (data.colorPalette?.text2 !== undefined)
    m.colorText2 = data.colorPalette.text2;

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

  console.log("[Mapper] mapPartialToDb", m);
  return m;
}

export function mapFromDb(row: BrandDesign): BrandDesign {
  return row;
}
