// mappers/brandDesign.ts
import { BrandDesign, InsertBrandDesign } from "@shared/schema";

export function mapToDb(data: any): InsertBrandDesign {
  return {
    userId: data.userId,
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
}

export function mapFromDb(row: BrandDesign): BrandDesign {
  return row;
}
