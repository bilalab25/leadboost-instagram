// Comprehensive list of ad formats for each social media platform

export interface AdFormat {
  id: string;
  name: string;
  description: string;
  dimensions?: string;
  maxDuration?: string;
  fileTypes?: string[];
  maxFileSize?: string;
  isPaid?: boolean;
  isOrganic?: boolean;
}

export interface PlatformAdFormats {
  platform: string;
  icon: string;
  color: string;
  formats: AdFormat[];
}

export const platformAdFormats: PlatformAdFormats[] = [
  {
    platform: "instagram",
    icon: "📸",
    color: "#E4405F",
    formats: [
      {
        id: "ig_feed_photo",
        name: "Feed Photo",
        description: "Single photo post in the main feed",
        dimensions: "1080x1080 (Square) or 1080x1350 (Portrait)",
        fileTypes: ["jpg", "png"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "ig_feed_carousel",
        name: "Feed Carousel",
        description: "Multiple photos/videos in one post",
        dimensions: "1080x1080 (Square)",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "30MB per item",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "ig_story",
        name: "Stories",
        description: "24-hour temporary content",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "60 seconds",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "ig_reels",
        name: "Reels",
        description: "Short-form vertical videos",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "90 seconds",
        fileTypes: ["mp4"],
        maxFileSize: "4GB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "ig_collection_ads",
        name: "Collection Ads",
        description: "Showcase multiple products",
        dimensions: "1200x628 (Cover) + Product images",
        fileTypes: ["jpg", "png"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "facebook",
    icon: "👥",
    color: "#1877F2",
    formats: [
      {
        id: "fb_feed_photo",
        name: "Feed Photo",
        description: "Image post in news feed",
        dimensions: "1200x630 (Landscape) or 1080x1080 (Square)",
        fileTypes: ["jpg", "png"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "fb_feed_video",
        name: "Feed Video",
        description: "Video post in news feed",
        dimensions: "1280x720 (16:9) or 1080x1080 (1:1)",
        maxDuration: "240 minutes",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "4GB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "fb_story",
        name: "Stories",
        description: "24-hour temporary content",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "60 seconds",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "fb_carousel",
        name: "Carousel Ads",
        description: "Multiple images/videos in one ad",
        dimensions: "1080x1080 (Square)",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "30MB per item",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "fb_instant_experience",
        name: "Instant Experience",
        description: "Full-screen mobile ad experience",
        dimensions: "1080x1920 (Mobile optimized)",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "30MB",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "tiktok",
    icon: "🎵",
    color: "#000000",
    formats: [
      {
        id: "tiktok_video",
        name: "In-Feed Video",
        description: "Native video content in TikTok feed",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "10 minutes",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "500MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "tiktok_spark_ads",
        name: "Spark Ads",
        description: "Boost organic TikTok posts as ads",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "60 seconds",
        fileTypes: ["mp4"],
        maxFileSize: "500MB",
        isPaid: true,
        isOrganic: false
      },
      {
        id: "tiktok_collection_ads",
        name: "Collection Ads",
        description: "Showcase product catalog",
        dimensions: "1080x1920 (Video) + Product images",
        maxDuration: "60 seconds",
        fileTypes: ["mp4", "jpg", "png"],
        maxFileSize: "500MB",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "youtube",
    icon: "▶️",
    color: "#FF0000",
    formats: [
      {
        id: "youtube_video",
        name: "Regular Video",
        description: "Standard YouTube video upload",
        dimensions: "1920x1080 (16:9) recommended",
        maxDuration: "12 hours (verified accounts)",
        fileTypes: ["mp4", "mov", "avi", "wmv"],
        maxFileSize: "256GB",
        isPaid: false,
        isOrganic: true
      },
      {
        id: "youtube_shorts",
        name: "YouTube Shorts",
        description: "Vertical short-form videos",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "60 seconds",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "256GB",
        isPaid: false,
        isOrganic: true
      },
      {
        id: "youtube_skippable_ads",
        name: "Skippable Video Ads",
        description: "Video ads that can be skipped after 5 seconds",
        dimensions: "1920x1080 (16:9)",
        maxDuration: "No limit (recommended 15-60 seconds)",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "1GB",
        isPaid: true,
        isOrganic: false
      },
      {
        id: "youtube_bumper_ads",
        name: "Bumper Ads",
        description: "Non-skippable 6-second video ads",
        dimensions: "1920x1080 (16:9)",
        maxDuration: "6 seconds",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "1GB",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "linkedin",
    icon: "💼",
    color: "#0A66C2",
    formats: [
      {
        id: "linkedin_single_image",
        name: "Single Image Ad",
        description: "Professional image post",
        dimensions: "1200x627 (1.91:1)",
        fileTypes: ["jpg", "png"],
        maxFileSize: "5MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "linkedin_video",
        name: "Video Ad",
        description: "Professional video content",
        dimensions: "1920x1080 (16:9) or 1080x1080 (1:1)",
        maxDuration: "30 minutes",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "200MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "linkedin_carousel",
        name: "Carousel Ad",
        description: "Multiple images with individual links",
        dimensions: "1080x1080 (1:1)",
        fileTypes: ["jpg", "png"],
        maxFileSize: "5MB per card",
        isPaid: true,
        isOrganic: false
      },
      {
        id: "linkedin_document",
        name: "Document Ad",
        description: "Share PDFs, presentations, infographics",
        dimensions: "Various (PDF format)",
        fileTypes: ["pdf"],
        maxFileSize: "100MB",
        isPaid: false,
        isOrganic: true
      }
    ]
  },
  {
    platform: "twitter",
    icon: "🐦",
    color: "#1DA1F2",
    formats: [
      {
        id: "twitter_image",
        name: "Image Tweet",
        description: "Tweet with single or multiple images",
        dimensions: "1200x675 (16:9) or 1080x1080 (1:1)",
        fileTypes: ["jpg", "png", "gif"],
        maxFileSize: "5MB per image",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "twitter_video",
        name: "Video Tweet",
        description: "Native video content",
        dimensions: "1280x720 (16:9) minimum",
        maxDuration: "2 minutes 20 seconds",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "512MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "twitter_promoted",
        name: "Promoted Tweet",
        description: "Boosted tweet for wider reach",
        dimensions: "Same as organic formats",
        fileTypes: ["jpg", "png", "gif", "mp4"],
        maxFileSize: "5MB (images), 512MB (video)",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "pinterest",
    icon: "📌",
    color: "#E60023",
    formats: [
      {
        id: "pinterest_standard",
        name: "Standard Pin",
        description: "Vertical image pin",
        dimensions: "1000x1500 (2:3) recommended",
        fileTypes: ["jpg", "png"],
        maxFileSize: "20MB",
        isPaid: true,
        isOrganic: true
      },
      {
        id: "pinterest_idea",
        name: "Idea Pin",
        description: "Multi-page, immersive content",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "60 seconds per page",
        fileTypes: ["jpg", "png", "mp4"],
        maxFileSize: "20MB",
        isPaid: false,
        isOrganic: true
      },
      {
        id: "pinterest_shopping",
        name: "Shopping Ads",
        description: "Product-focused pins with pricing",
        dimensions: "1000x1500 (2:3)",
        fileTypes: ["jpg", "png"],
        maxFileSize: "20MB",
        isPaid: true,
        isOrganic: false
      }
    ]
  },
  {
    platform: "snapchat",
    icon: "👻",
    color: "#FFFC00",
    formats: [
      {
        id: "snapchat_snap_ads",
        name: "Snap Ads",
        description: "Full-screen vertical video ads",
        dimensions: "1080x1920 (9:16)",
        maxDuration: "3-180 seconds",
        fileTypes: ["mp4", "mov"],
        maxFileSize: "1GB",
        isPaid: true,
        isOrganic: false
      },
      {
        id: "snapchat_collection",
        name: "Collection Ads",
        description: "Product showcase format",
        dimensions: "1080x1920 (Video) + Product images",
        maxDuration: "3-180 seconds",
        fileTypes: ["mp4", "jpg", "png"],
        maxFileSize: "1GB",
        isPaid: true,
        isOrganic: false
      }
    ]
  }
];

// Helper functions
export const getPlatformFormats = (platformName: string): AdFormat[] => {
  const platform = platformAdFormats.find(p => p.platform === platformName);
  return platform?.formats || [];
};

export const getOrganicFormats = (platformName: string): AdFormat[] => {
  return getPlatformFormats(platformName).filter(format => format.isOrganic);
};

export const getPaidFormats = (platformName: string): AdFormat[] => {
  return getPlatformFormats(platformName).filter(format => format.isPaid);
};

export const getAllPlatforms = (): string[] => {
  return platformAdFormats.map(p => p.platform);
};