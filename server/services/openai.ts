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
    
    Focus on platform-specific optimization across all major platforms:
    - Instagram Posts: Visual content, engaging captions, brand storytelling
    - Instagram Stories: Short visual overlays, interactive elements, behind-the-scenes
    - Instagram Reels: Short-form video content, trending audio, viral hooks
    - Facebook Posts: Community engagement, longer-form content, discussions
    - Facebook Stories: Quick updates, personal moments, casual content
    - LinkedIn Posts: Professional updates, industry insights, networking
    - LinkedIn Newsletter: Thought leadership, comprehensive industry analysis
    - LinkedIn Thread: Professional insights in connected post format
    - Threads: Authentic conversations, relatable content, community building
    - X (Twitter): Real-time updates, trending topics, concise messaging
    - TikTok: Trending content, viral hooks, short-form entertainment
    - YouTube: Video descriptions, SEO optimization, educational content
    - YouTube Shorts: Quick video descriptions, trending keywords
    - Pinterest: Visual inspiration, SEO-rich descriptions, actionable ideas
    - Reddit: Community discussions, authentic conversations, helpful advice
    - Discord: Community updates, event announcements, gaming content
    - Snapchat: Fun, ephemeral content, youth-focused messaging
    - Medium: Long-form articles, thought leadership, professional storytelling
    - Blog Posts: SEO-optimized articles, comprehensive educational content
    - WhatsApp: Personal messaging, customer service, direct engagement
    - Email/Gmail: Professional newsletters, promotions, structured communication
    
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
    💼 LINKEDIN: Professional updates, industry insights, networking focus, 150-300 words, business tone
    📱 THREADS: Casual, conversational, 500 chars max, trending topics, authentic voice, relatable content
    📷 INSTAGRAM STORY: Visual-first, short text overlays, emojis, interactive elements, 15-30 words max
    📸 INSTAGRAM: Visual storytelling, engaging captions, hashtags, 125-150 words, authentic voice
    🎬 INSTAGRAM REELS: Short-form video descriptions, trending audio cues, hooks, 50-100 words, viral elements
    📘 FACEBOOK: Community-focused, longer form content, conversation starters, 150-300 words, inclusive tone
    📱 FACEBOOK STORY: Quick updates, behind-the-scenes, personal touch, 20-40 words max
    🐦 X (TWITTER): Concise, witty, trending hashtags, thread format if needed, 280 chars max per tweet
    🎵 TIKTOK: Trending sounds, hooks in first 3 seconds, casual language, 100-150 words, viral potential
    📺 YOUTUBE: Detailed descriptions, SEO-optimized, timestamps, 200-500 words, informative tone
    ⚡ YOUTUBE SHORTS: Quick hooks, trending keywords, brief descriptions, 50-100 words, attention-grabbing
    📌 PINTEREST: SEO-rich descriptions, keyword-focused, actionable content, 100-200 words, inspiring tone
    🔴 REDDIT: Community-specific language, authentic discussion starters, 100-300 words, conversational
    💬 DISCORD: Community updates, event announcements, casual tone, 50-150 words, engaging
    👻 SNAPCHAT: Fun, casual, ephemeral content, youth-focused language, 20-50 words
    ✍️ MEDIUM: Long-form articles, thought leadership, storytelling, 800-2000 words, professional narrative
    📝 BLOG: SEO-optimized articles, comprehensive content, structured format, 500-1500 words, informative
    💬 WHATSAPP: Personal, conversational, emojis, brief and actionable, friendly tone
    
    Create platform-optimized variations with proper formatting, character limits, and tone for each platform.
    Include platform-specific hashtags and visual suggestions tailored to each platform's requirements.
    
    Return JSON in this exact format:
    {
      "content": "main universal content that works across platforms",
      "variations": {
        "email": "professional email with subject line: [SUBJECT] and structured body",
        "linkedin": "professional business update with industry insights",
        "linkedin_newsletter": "comprehensive newsletter format with sections and professional insights",
        "linkedin_thread": "1/10 Professional insight here... 2/10 Next point... [format as numbered thread]",
        "threads": "casual conversational version under 500 chars",
        "instagram": "engaging caption with storytelling and call-to-action",
        "instagram_story": "short visual-focused text under 30 words",
        "instagram_reels": "short video description with trending elements and hooks",
        "facebook": "community-focused content encouraging discussion and engagement",
        "facebook_story": "quick behind-the-scenes update with personal touch",
        "x": "concise twitter-optimized version under 280 chars",
        "tiktok": "trending casual format with hook in first line",
        "youtube": "detailed video description with SEO keywords and timestamps",
        "youtube_shorts": "quick attention-grabbing description with trending keywords",
        "pinterest": "SEO-rich pin description with actionable keywords",
        "reddit": "authentic community discussion starter with platform etiquette",
        "discord": "community update or announcement in casual tone",
        "snapchat": "fun casual content for younger audience",
        "medium": "long-form article introduction with compelling narrative",
        "blog": "comprehensive blog post with SEO optimization and structure",
        "whatsapp": "personal conversational message with emojis"
      },
      "suggestedHashtags": {
        "email": [],
        "linkedin": ["#Professional", "#Business", "#Industry"],
        "linkedin_newsletter": ["#Leadership", "#Industry", "#Business"],
        "linkedin_thread": ["#Professional", "#Insights", "#Growth"],
        "threads": ["#authentic", "#relatable", "#community"],
        "instagram": ["#business", "#motivation", "#growth"],
        "instagram_story": ["#story", "#behindthescenes", "#daily"],
        "instagram_reels": ["#reels", "#trending", "#viral"],
        "facebook": ["#community", "#discussion", "#engagement"],
        "facebook_story": ["#story", "#update", "#behindthescenes"],
        "x": ["#trending", "#business", "#innovation"],
        "tiktok": ["#fyp", "#trending", "#viral"],
        "youtube": ["#youtube", "#content", "#educational"],
        "youtube_shorts": ["#shorts", "#trending", "#viral"],
        "pinterest": ["#inspiration", "#ideas", "#diy"],
        "reddit": ["#discussion", "#community", "#advice"],
        "discord": ["#community", "#updates", "#gaming"],
        "snapchat": ["#snap", "#fun", "#daily"],
        "medium": ["#writing", "#thoughtleadership", "#insights"],
        "blog": ["#blog", "#content", "#educational"],
        "whatsapp": []
      },
      "visualSuggestions": {
        "email": ["professional header image", "infographic", "brand logo"],
        "linkedin": ["professional headshots", "industry graphics", "company updates"],
        "linkedin_newsletter": ["data visualization", "professional charts", "industry graphics"],
        "linkedin_thread": ["carousel slides", "data charts", "professional graphics"],
        "threads": ["authentic photos", "behind-the-scenes", "candid moments"],
        "instagram": ["high-quality photos", "carousel posts", "brand imagery"],
        "instagram_story": ["vertical video", "interactive polls", "behind-the-scenes"],
        "instagram_reels": ["trending transitions", "quick cuts", "engaging hooks"],
        "facebook": ["community photos", "event images", "discussion starters"],
        "facebook_story": ["casual photos", "quick videos", "personal moments"],
        "x": ["engaging images", "GIFs", "infographics"],
        "tiktok": ["vertical videos", "trending effects", "dynamic visuals"],
        "youtube": ["custom thumbnails", "video previews", "chapter graphics"],
        "youtube_shorts": ["attention-grabbing thumbnails", "quick visuals", "trending formats"],
        "pinterest": ["vertical pins", "lifestyle images", "DIY graphics"],
        "reddit": ["memes", "discussion images", "helpful screenshots"],
        "discord": ["server banners", "community graphics", "event announcements"],
        "snapchat": ["fun filters", "quick videos", "casual photos"],
        "medium": ["article headers", "illustrations", "data visualizations"],
        "blog": ["featured images", "infographics", "step-by-step visuals"],
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
