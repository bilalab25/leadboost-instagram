import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface ContentStrategy {
  insights: string[];
  recommendations: string[];
  posts: {
    date: string;
    platform: string;
    contentType: string;
    title: string;
    description: string;
    hashtags: string[];
    optimalTime: string;
  }[];
}

export interface BusinessData {
  industry?: string;
  topProducts?: string[];
  salesData?: any;
  customerInsights?: any;
  seasonality?: string;
}

export async function generateMonthlyContentStrategy(
  businessData: BusinessData,
  month: number,
  year: number
): Promise<ContentStrategy> {
  try {
    const prompt = `
    You are a professional social media strategist. Create a comprehensive monthly content strategy based on the following business data:
    
    Industry: ${businessData.industry || 'General Business'}
    Top Products: ${businessData.topProducts?.join(', ') || 'Not specified'}
    Month: ${month}/${year}
    
    Create a strategic content plan that includes:
    1. Key insights about optimal posting times and content types
    2. Specific recommendations based on industry trends
    3. 15-20 specific post ideas with dates, platforms, and details
    
    Focus on:
    - Instagram: Visual content, stories, reels
    - WhatsApp: Customer service, direct engagement
    - TikTok: Trending content, behind-the-scenes
    - Email: Newsletters, promotions
    
    Return the response in JSON format with the following structure:
    {
      "insights": ["insight1", "insight2", ...],
      "recommendations": ["rec1", "rec2", ...],
      "posts": [
        {
          "date": "2024-01-15",
          "platform": "instagram",
          "contentType": "product_showcase",
          "title": "Post Title",
          "description": "Post description",
          "hashtags": ["#hashtag1", "#hashtag2"],
          "optimalTime": "6:00 PM"
        }
      ]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media strategist with deep knowledge of content marketing, audience engagement, and platform optimization."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as ContentStrategy;
  } catch (error) {
    console.error("Error generating content strategy:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error("Failed to generate content strategy: " + message);
  }
}

export async function generateCampaignContent(
  prompt: string,
  platforms: string[],
  businessContext?: string
): Promise<{
  content: string;
  variations: { [platform: string]: string };
  suggestedHashtags: string[];
  visualSuggestions: string[];
}> {
  try {
    const systemPrompt = `
    You are a creative social media content creator. Generate engaging campaign content based on the user's request.
    
    Business Context: ${businessContext || 'General business'}
    Target Platforms: ${platforms.join(', ')}
    
    Create platform-optimized variations and include:
    - Main content that works across platforms
    - Platform-specific variations (Instagram vs TikTok vs WhatsApp style)
    - Relevant hashtags
    - Visual content suggestions
    
    Return JSON in this format:
    {
      "content": "main content",
      "variations": {
        "instagram": "instagram optimized version",
        "tiktok": "tiktok optimized version",
        "whatsapp": "whatsapp friendly version",
        "email": "email newsletter version"
      },
      "suggestedHashtags": ["#tag1", "#tag2"],
      "visualSuggestions": ["suggestion1", "suggestion2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error generating campaign content:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error("Failed to generate campaign content: " + message);
  }
}

export async function analyzeMessageSentiment(message: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  suggestedResponse?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a customer service analysis expert. Analyze the sentiment and priority of customer messages.
          
          Return JSON with:
          - sentiment: positive/neutral/negative
          - priority: low/normal/high/urgent (urgent for complaints, time-sensitive requests)
          - suggestedResponse: brief professional response suggestion (optional)
          
          Format: {"sentiment": "positive", "priority": "normal", "suggestedResponse": "response text"}`
        },
        {
          role: "user",
          content: message,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing message sentiment:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error("Failed to analyze message sentiment: " + message);
  }
}

export async function generateVisualContent(description: string): Promise<{ url: string }> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional, engaging social media visual: ${description}. 
               Make it modern, clean, and suitable for business social media marketing.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0]?.url || '' };
  } catch (error) {
    console.error("Error generating visual content:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error("Failed to generate visual content: " + message);
  }
}
