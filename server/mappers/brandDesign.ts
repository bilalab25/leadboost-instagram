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
    assets: data.brandKit?.assets || [],
    isDesignStudioEnabled: data.isDesignStudioEnabled ?? false,
  };
}

export function mapFromDb(row: BrandDesign) {
  return {
    brandStyle: row.brandStyle,
    colorPalette: {
      primary: row.colorPrimary,
      accent1: row.colorAccent1,
      accent2: row.colorAccent2,
      text1: row.colorText1,
      text2: row.colorText2,
    },
    typography: {
      primary: row.fontPrimary,
      secondary: row.fontSecondary,
      customFonts: row.customFonts || [],
    },
    logoUrl: row.logoUrl,
    brandKit: {
      assets: row.assets || [],
    },
    isDesignStudioEnabled: row.isDesignStudioEnabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
