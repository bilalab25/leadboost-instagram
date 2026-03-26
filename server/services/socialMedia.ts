/**
 * Social Media Platform Integration Service
 * Provides credential validation and cross-platform posting via real APIs
 */

export interface PlatformMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  platform: 'instagram' | 'whatsapp' | 'email' | 'tiktok';
  messageType: 'text' | 'image' | 'video' | 'audio';
}

export interface PostContent {
  text: string;
  images?: string[];
  scheduledTime?: Date;
}

export class SocialMediaService {
  /**
   * Post content to multiple platforms using their respective APIs
   */
  async postToMultiplePlatforms(
    platforms: string[],
    content: PostContent,
    accessTokens: { [platform: string]: string }
  ): Promise<{ [platform: string]: { success: boolean; postId?: string; error?: string } }> {
    const results: { [platform: string]: { success: boolean; postId?: string; error?: string } } = {};

    for (const platform of platforms) {
      const token = accessTokens[platform];
      if (!token) {
        results[platform] = { success: false, error: 'No access token available' };
        continue;
      }

      try {
        switch (platform) {
          case 'facebook':
            results[platform] = await this.postToFacebook(content, token);
            break;
          case 'instagram':
            results[platform] = await this.postToInstagram(content, token);
            break;
          default:
            results[platform] = { success: false, error: `Platform "${platform}" posting is not yet supported` };
        }
      } catch (error) {
        results[platform] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }

  /**
   * Post to Facebook Page via Graph API
   */
  private async postToFacebook(
    content: PostContent,
    pageAccessToken: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    // Get the page ID from the token first
    const meRes = await fetch(`https://graph.facebook.com/v24.0/me?access_token=${pageAccessToken}`);
    const meData = await meRes.json();
    if (meData.error) return { success: false, error: meData.error.message };

    const pageId = meData.id;

    // Post to the page feed
    const postRes = await fetch(`https://graph.facebook.com/v24.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: content.text,
        access_token: pageAccessToken,
      }),
    });

    const postData = await postRes.json();
    if (postData.error) return { success: false, error: postData.error.message };

    return { success: true, postId: postData.id };
  }

  /**
   * Post to Instagram via Content Publishing API (requires Facebook Page token)
   */
  private async postToInstagram(
    content: PostContent,
    pageAccessToken: string
  ): Promise<{ success: boolean; postId?: string; error?: string }> {
    if (!content.images?.length) {
      return { success: false, error: 'Instagram requires at least one image to post' };
    }

    // Get the Instagram Business Account ID via the page
    const pagesRes = await fetch(`https://graph.facebook.com/v24.0/me/accounts?access_token=${pageAccessToken}`);
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page) return { success: false, error: 'No Facebook Page found' };

    const igRes = await fetch(
      `https://graph.facebook.com/v24.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    );
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id;
    if (!igAccountId) return { success: false, error: 'No Instagram Business Account linked to this page' };

    // Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v24.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: content.images[0],
        caption: content.text,
        access_token: page.access_token,
      }),
    });

    const containerData = await containerRes.json();
    if (containerData.error) return { success: false, error: containerData.error.message };

    // Publish the container
    const publishRes = await fetch(`https://graph.facebook.com/v24.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: page.access_token,
      }),
    });

    const publishData = await publishRes.json();
    if (publishData.error) return { success: false, error: publishData.error.message };

    return { success: true, postId: publishData.id };
  }

  /**
   * Validate platform credentials by making a test API call
   */
  async validatePlatformCredentials(platform: string, accessToken: string): Promise<{
    valid: boolean;
    accountInfo?: {
      id: string;
      name: string;
      profilePicture?: string;
    };
    error?: string;
  }> {
    if (!accessToken) {
      return { valid: false, error: 'Access token is required' };
    }

    try {
      switch (platform) {
        case 'facebook': {
          const res = await fetch(`https://graph.facebook.com/v24.0/me?fields=id,name,picture&access_token=${accessToken}`);
          const data = await res.json();
          if (data.error) return { valid: false, error: data.error.message };
          return {
            valid: true,
            accountInfo: {
              id: data.id,
              name: data.name,
              profilePicture: data.picture?.data?.url,
            },
          };
        }
        case 'instagram':
        case 'instagram_direct': {
          const res = await fetch(`https://graph.instagram.com/v24.0/me?fields=user_id,username&access_token=${accessToken}`);
          const data = await res.json();
          if (data.error) return { valid: false, error: data.error.message };
          return {
            valid: true,
            accountInfo: {
              id: data.user_id || data.id,
              name: data.username || 'Instagram User',
            },
          };
        }
        default:
          return { valid: false, error: `Validation for platform "${platform}" is not yet supported` };
      }
    } catch (error) {
      return { valid: false, error: 'Failed to connect to platform API' };
    }
  }
}

export const socialMediaService = new SocialMediaService();
