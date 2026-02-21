import sharp from 'sharp';

export interface PlatformDimensions {
  width: number;
  height: number;
  name: string;
}

// Exact platform dimensions as specified
export const PLATFORM_DIMENSIONS: Record<string, PlatformDimensions> = {
  'Instagram Post': { width: 1080, height: 1080, name: 'Instagram Post' },
  'Instagram Story': { width: 1080, height: 1920, name: 'Instagram Story' },
  'LinkedIn Post': { width: 1200, height: 628, name: 'LinkedIn Post' },
  'Threads Post': { width: 1080, height: 1080, name: 'Threads Post' },
  'Email Banner': { width: 600, height: 200, name: 'Email Banner' },
  'Twitter/X Post': { width: 1600, height: 900, name: 'Twitter/X Post' },
  'Facebook Post': { width: 1200, height: 628, name: 'Facebook Post' },
  'TikTok Cover': { width: 1080, height: 1920, name: 'TikTok Cover' }
};

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

export interface ProcessImageOptions {
  sourceImageUrl: string;
  platform: string;
  textOverlays?: TextOverlay[];
  brandStyle?: 'professional' | 'creative' | 'playful' | 'luxury';
  backgroundColor?: string;
}

export class ImageProcessor {
  
  /**
   * Processes an image to exact platform dimensions without stretching
   * Uses smart center-crop + background fill method
   */
  async processImageForPlatform(options: ProcessImageOptions): Promise<Buffer> {
    const { sourceImageUrl, platform, textOverlays = [], brandStyle = 'professional', backgroundColor } = options;
    
    const dimensions = PLATFORM_DIMENSIONS[platform];
    if (!dimensions) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Download source image
    const response = await fetch(sourceImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    const sourceImage = sharp(imageBuffer);
    const metadata = await sourceImage.metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to get image dimensions');
    }

    // Calculate smart crop/resize strategy
    const targetAspectRatio = dimensions.width / dimensions.height;
    const sourceAspectRatio = metadata.width / metadata.height;
    
    let processedImage: sharp.Sharp;
    
    if (Math.abs(targetAspectRatio - sourceAspectRatio) < 0.01) {
      // Aspect ratios match - simple resize
      processedImage = sourceImage.resize(dimensions.width, dimensions.height, {
        fit: 'fill'
      });
    } else if (sourceAspectRatio > targetAspectRatio) {
      // Source is wider - crop width, maintain height proportion
      const cropWidth = Math.round(metadata.height * targetAspectRatio);
      const cropX = Math.round((metadata.width - cropWidth) / 2);
      
      processedImage = sourceImage
        .extract({
          left: cropX,
          top: 0,
          width: cropWidth,
          height: metadata.height
        })
        .resize(dimensions.width, dimensions.height, { fit: 'fill' });
    } else {
      // Source is taller - crop height, maintain width proportion  
      const cropHeight = Math.round(metadata.width / targetAspectRatio);
      const cropY = Math.round((metadata.height - cropHeight) / 2);
      
      processedImage = sourceImage
        .extract({
          left: 0,
          top: cropY,
          width: metadata.width,
          height: cropHeight
        })
        .resize(dimensions.width, dimensions.height, { fit: 'fill' });
    }

    // Apply brand style overlay
    const overlayColor = this.getBrandStyleOverlay(brandStyle);
    if (overlayColor) {
      const overlayBuffer = await sharp({
        create: {
          width: dimensions.width,
          height: dimensions.height,
          channels: 4,
          background: overlayColor
        }
      })
      .png()
      .toBuffer();

      processedImage = processedImage.composite([{
        input: overlayBuffer,
        blend: 'multiply'
      }]);
    }

    // Add text overlays if specified
    if (textOverlays.length > 0) {
      processedImage = await this.addTextOverlays(processedImage, textOverlays, dimensions);
    }

    // Return processed image as buffer
    return processedImage
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  /**
   * Get brand style overlay configuration
   */
  private  (brandStyle: string): { r: number; g: number; b: number; alpha: number } | null {
    switch (brandStyle) {
      case 'luxury':
        return { r: 0, g: 0, b: 0, alpha: 0.1 };
      case 'creative':
        return { r: 147, g: 51, b: 234, alpha: 0.05 };
      case 'playful':
        return { r: 251, g: 191, b: 36, alpha: 0.05 };
      case 'professional':
        return { r: 59, g: 130, b: 246, alpha: 0.03 };
      default:
        return null;
    }
  }

  /**
   * Add text overlays with dynamic positioning based on platform dimensions
   */
  private async addTextOverlays(
    image: sharp.Sharp, 
    overlays: TextOverlay[], 
    dimensions: PlatformDimensions
  ): Promise<sharp.Sharp> {
    
    // For now, we'll skip SVG text overlays and focus on the image processing
    // In a full implementation, you'd generate SVG text elements and composite them
    // This requires more complex text rendering which could be added later
    
    return image;
  }

  /**
   * Generate optimized images for all platforms from a single source
   */  
  async generateAllPlatformImages(options: {
    sourceImageUrl: string;
    campaignText: string;
    brandStyle?: string;
  }): Promise<Record<string, Buffer>> {
    const { sourceImageUrl, campaignText, brandStyle } = options;
    const results: Record<string, Buffer> = {};

    // Generate images for all platforms in parallel
    const platformPromises = Object.keys(PLATFORM_DIMENSIONS).map(async (platform) => {
      try {
        const imageBuffer = await this.processImageForPlatform({
          sourceImageUrl,
          platform,
          brandStyle: brandStyle as any,
          textOverlays: [{
            text: campaignText,
            x: 50,
            y: 50,
            fontSize: 24,
            color: '#ffffff',
            fontWeight: 'bold'
          }]
        });
        
        return { platform, imageBuffer };
      } catch (error) {
        console.error(`Failed to process ${platform}:`, error);
        return { platform, imageBuffer: null };
      }
    });

    const platformResults = await Promise.all(platformPromises);
    
    platformResults.forEach(({ platform, imageBuffer }) => {
      if (imageBuffer) {
        results[platform] = imageBuffer;
      }
    });

    return results;
  }
}

export const imageProcessor = new ImageProcessor();