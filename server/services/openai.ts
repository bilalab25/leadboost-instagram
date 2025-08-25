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
    
    Focus on platform-specific optimization:
    - Instagram: Visual content, stories, reels, engaging captions
    - Instagram Story: Short visual overlays, interactive elements
    - WhatsApp: Customer service, direct engagement, personal messages
    - TikTok: Trending content, viral hooks, behind-the-scenes
    - Email/Gmail: Newsletters, promotions, professional communication
    - LinkedIn Newsletter: Thought leadership, industry insights
    - LinkedIn Thread: Professional networking, business insights
    - Threads: Authentic conversations, community building
    - X (Twitter): Real-time updates, trending topics, concise messaging
    
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
        },
        {
          "date": "2024-01-16",
          "platform": "linkedin_newsletter",
          "contentType": "thought_leadership",
          "title": "Industry Insights",
          "description": "Professional insights",
          "hashtags": ["#Leadership", "#Industry"],
          "optimalTime": "9:00 AM"
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
  suggestedHashtags: { [platform: string]: string[] };
  visualSuggestions: { [platform: string]: string[] };
}> {
  try {
    const systemPrompt = `
    You are an expert social media content creator and digital marketing strategist. Generate engaging campaign content optimized for multiple platforms with specific formatting requirements.
    
    Business Context: ${businessContext || 'General business'}
    Target Platforms: ${platforms.join(', ')}
    
    PLATFORM OPTIMIZATION RULES:
    
    📧 EMAIL/GMAIL: Professional tone, compelling subject line, structured paragraphs, clear CTA, 300-500 words
    📰 LINKEDIN NEWSLETTER: Thought leadership, industry insights, bullet points, 800-1200 words, professional tone
    🧵 LINKEDIN THREAD: Professional insights broken into 5-10 connected posts, each 150 chars max, numbered format
    📱 THREADS: Casual, conversational, 500 chars max, trending topics, authentic voice, relatable content
    📷 INSTAGRAM STORY: Visual-first, short text overlays, emojis, interactive elements, 15-30 words max
    📸 INSTAGRAM: Visual storytelling, engaging captions, hashtags, 125-150 words, authentic voice
    🐦 X (TWITTER): Concise, witty, trending hashtags, thread format if needed, 280 chars max per tweet
    🎵 TIKTOK: Trending sounds, hooks in first 3 seconds, casual language, 100-150 words, viral potential
    💬 WHATSAPP: Personal, conversational, emojis, brief and actionable, friendly tone
    
    Create platform-optimized variations with proper formatting, character limits, and tone for each platform.
    Include platform-specific hashtags and visual suggestions tailored to each platform's requirements.
    
    Return JSON in this exact format:
    {
      "content": "main universal content that works across platforms",
      "variations": {
        "email": "professional email with subject line: [SUBJECT] and structured body",
        "linkedin_newsletter": "comprehensive newsletter format with sections and professional insights",
        "linkedin_thread": "1/10 Professional insight here... 2/10 Next point... [format as numbered thread]",
        "threads": "casual conversational version under 500 chars",
        "instagram_story": "short visual-focused text under 30 words",
        "instagram": "engaging caption with storytelling and call-to-action",
        "x": "concise twitter-optimized version under 280 chars",
        "tiktok": "trending casual format with hook in first line",
        "whatsapp": "personal conversational message with emojis"
      },
      "suggestedHashtags": {
        "email": [],
        "linkedin_newsletter": ["#Leadership", "#Industry", "#Business"],
        "linkedin_thread": ["#Professional", "#Insights", "#Growth"],
        "threads": ["#authentic", "#relatable", "#community"],
        "instagram_story": ["#story", "#behindthescenes", "#daily"],
        "instagram": ["#business", "#motivation", "#growth"],
        "x": ["#trending", "#business", "#innovation"],
        "tiktok": ["#fyp", "#trending", "#business"],
        "whatsapp": []
      },
      "visualSuggestions": {
        "email": ["professional header image", "infographic", "brand logo"],
        "linkedin_newsletter": ["data visualization", "professional charts", "industry graphics"],
        "linkedin_thread": ["carousel slides", "data charts", "professional graphics"],
        "threads": ["authentic photos", "behind-the-scenes", "candid moments"],
        "instagram_story": ["vertical video", "interactive polls", "behind-the-scenes"],
        "instagram": ["high-quality photos", "carousel posts", "brand imagery"],
        "x": ["engaging images", "GIFs", "infographics"],
        "tiktok": ["vertical videos", "trending effects", "dynamic visuals"],
        "whatsapp": ["simple graphics", "screenshots", "personal photos"]
      }
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
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
