import express from 'express';
import type { IStorage } from './storage';
import { 
  insertSocialAccountSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertCampaignSchema,
  insertFeedPlanSchema,
  insertBusinessDataSchema,
  insertPostSchema
} from '@shared/schema';

export function createRoutes(storage: IStorage) {
  const router = express.Router();

  // Social Accounts
  router.get('/social-accounts', async (req, res) => {
    try {
      const accounts = await storage.getSocialAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch social accounts' });
    }
  });

  router.post('/social-accounts', async (req, res) => {
    try {
      const validatedData = insertSocialAccountSchema.parse(req.body);
      const account = await storage.createSocialAccount(validatedData);
      res.status(201).json(account);
    } catch (error) {
      res.status(400).json({ error: 'Invalid social account data' });
    }
  });

  router.put('/social-accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertSocialAccountSchema.partial().parse(req.body);
      const account = await storage.updateSocialAccount(id, updates);
      if (!account) {
        return res.status(404).json({ error: 'Social account not found' });
      }
      res.json(account);
    } catch (error) {
      res.status(400).json({ error: 'Invalid update data' });
    }
  });

  router.delete('/social-accounts/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSocialAccount(id);
      if (!success) {
        return res.status(404).json({ error: 'Social account not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete social account' });
    }
  });

  // Conversations
  router.get('/conversations', async (req, res) => {
    try {
      const { platform } = req.query;
      let conversations;
      if (platform) {
        conversations = await storage.getConversationsByPlatform(platform as string);
      } else {
        conversations = await storage.getConversations();
      }
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversations' });
    }
  });

  router.post('/conversations', async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      res.status(400).json({ error: 'Invalid conversation data' });
    }
  });

  router.put('/conversations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertConversationSchema.partial().parse(req.body);
      const conversation = await storage.updateConversation(id, updates);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ error: 'Invalid update data' });
    }
  });

  // Messages
  router.get('/conversations/:id/messages', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  router.post('/messages', async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: 'Invalid message data' });
    }
  });

  // Campaigns
  router.get('/campaigns', async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  });

  router.post('/campaigns', async (req, res) => {
    try {
      const validatedData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(validatedData);
      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: 'Invalid campaign data' });
    }
  });

  router.put('/campaigns/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertCampaignSchema.partial().parse(req.body);
      const campaign = await storage.updateCampaign(id, updates);
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.json(campaign);
    } catch (error) {
      res.status(400).json({ error: 'Invalid update data' });
    }
  });

  router.delete('/campaigns/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCampaign(id);
      if (!success) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete campaign' });
    }
  });

  // AI Campaign Generation
  router.post('/campaigns/generate', async (req, res) => {
    try {
      const { title, content, targetPlatforms } = req.body;
      
      // Simulate AI visual design generation
      const visualDesign = {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        fontSize: '24px',
        fontFamily: 'Inter, sans-serif',
        layout: 'centered',
        elements: [
          {
            type: 'heading',
            content: title,
            style: { fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }
          },
          {
            type: 'body',
            content: content,
            style: { fontSize: '18px', lineHeight: '1.6', textAlign: 'center' }
          },
          {
            type: 'branding',
            content: 'Your Brand',
            style: { fontSize: '14px', opacity: 0.8, marginTop: '30px' }
          }
        ],
        animation: 'fadeIn'
      };

      const campaign = await storage.createCampaign({
        title,
        content,
        visualDesign,
        targetPlatforms: targetPlatforms || [],
        status: 'draft',
        aiGenerated: true,
        createdBy: 'AI Assistant'
      });

      res.status(201).json(campaign);
    } catch (error) {
      res.status(400).json({ error: 'Failed to generate campaign' });
    }
  });

  // Feed Plans
  router.get('/feed-plans', async (req, res) => {
    try {
      const feedPlans = await storage.getFeedPlans();
      res.json(feedPlans);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feed plans' });
    }
  });

  router.get('/feed-plans/:month', async (req, res) => {
    try {
      const month = req.params.month;
      const feedPlan = await storage.getFeedPlanByMonth(month);
      if (!feedPlan) {
        return res.status(404).json({ error: 'Feed plan not found' });
      }
      res.json(feedPlan);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch feed plan' });
    }
  });

  // AI Feed Plan Generation
  router.post('/feed-plans/generate', async (req, res) => {
    try {
      const { month, businessType, targetAudience } = req.body;
      
      // Get business data for AI context
      const businessData = await storage.getBusinessData();
      
      // Simulate AI-generated feed plan
      const generatedContent = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        postType: ['product_showcase', 'behind_scenes', 'user_generated', 'educational', 'promotional'][Math.floor(Math.random() * 5)],
        content: generatePostContent(businessType, i + 1),
        suggestedTime: '09:00',
        platforms: ['instagram', 'tiktok'],
        hashtags: generateHashtags(businessType),
        visualStyle: 'modern_minimal'
      }));

      const industryTrends = {
        trending_hashtags: [`#${businessType}2025`, '#SmallBusiness', '#LocalBusiness'],
        popular_content_types: ['reels', 'carousel_posts', 'user_stories'],
        best_posting_times: ['9:00 AM', '1:00 PM', '7:00 PM'],
        seasonal_themes: getSeasonalThemes(month)
      };

      const feedPlan = await storage.createFeedPlan({
        month,
        businessData: { businessType, targetAudience, totalPosts: 30 },
        industryTrends,
        generatedContent,
        aiPrompt: `Generate a monthly content feed for ${businessType} business targeting ${targetAudience}`,
        status: 'draft'
      });

      res.status(201).json(feedPlan);
    } catch (error) {
      res.status(400).json({ error: 'Failed to generate feed plan' });
    }
  });

  // Business Data
  router.get('/business-data', async (req, res) => {
    try {
      const { type } = req.query;
      let data;
      if (type) {
        data = await storage.getBusinessDataByType(type as string);
      } else {
        data = await storage.getBusinessData();
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch business data' });
    }
  });

  router.post('/business-data', async (req, res) => {
    try {
      const validatedData = insertBusinessDataSchema.parse(req.body);
      const data = await storage.createBusinessData(validatedData);
      res.status(201).json(data);
    } catch (error) {
      res.status(400).json({ error: 'Invalid business data' });
    }
  });

  // Posts
  router.get('/posts', async (req, res) => {
    try {
      const { campaignId, feedPlanId } = req.query;
      let posts;
      if (campaignId) {
        posts = await storage.getPostsByCampaign(parseInt(campaignId as string));
      } else if (feedPlanId) {
        posts = await storage.getPostsByFeedPlan(parseInt(feedPlanId as string));
      } else {
        posts = await storage.getPosts();
      }
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  router.post('/posts', async (req, res) => {
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ error: 'Invalid post data' });
    }
  });

  // Crossposting
  router.post('/posts/:id/crosspost', async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const { targetPlatforms } = req.body;
      
      // In a real implementation, this would integrate with social media APIs
      // For now, we'll simulate the crossposting process
      const results = targetPlatforms.map((platform: string) => ({
        platform,
        status: 'success',
        postId: `${platform}_${Date.now()}`,
        url: `https://${platform}.com/post/${Date.now()}`
      }));

      res.json({ results });
    } catch (error) {
      res.status(400).json({ error: 'Failed to crosspost' });
    }
  });

  return router;
}

// Helper functions for AI content generation
function generatePostContent(businessType: string, day: number): string {
  const contentTemplates = {
    restaurant: [
      `Fresh ingredients, amazing flavors! What's your favorite dish? #day${day}`,
      `Behind the scenes in our kitchen today #day${day}`,
      `New seasonal menu items are here! Come try them #day${day}`
    ],
    retail: [
      `New arrivals that you'll love! Check them out #day${day}`,
      `Customer favorites - these are flying off the shelves #day${day}`,
      `Style tip: How to wear our latest collection #day${day}`
    ],
    service: [
      `Happy customers are our priority! Here's what they're saying #day${day}`,
      `Pro tip: How to get the most out of our service #day${day}`,
      `Meet the team behind your great experience #day${day}`
    ]
  };

  const templates = contentTemplates[businessType as keyof typeof contentTemplates] || contentTemplates.service;
  return templates[day % templates.length];
}

function generateHashtags(businessType: string): string[] {
  const hashtagSets = {
    restaurant: ['#restaurant', '#food', '#delicious', '#localfood', '#dining'],
    retail: ['#shopping', '#style', '#fashion', '#newcollection', '#retail'],
    service: ['#service', '#professional', '#quality', '#trusted', '#local']
  };

  return hashtagSets[businessType as keyof typeof hashtagSets] || hashtagSets.service;
}

function getSeasonalThemes(month: string): string[] {
  const monthNum = parseInt(month.split('-')[1]);
  const seasons = {
    'spring': ['growth', 'renewal', 'fresh_starts', 'outdoors'],
    'summer': ['vacation', 'fun', 'bright_colors', 'outdoor_activities'],
    'fall': ['cozy', 'warm_colors', 'back_to_school', 'harvest'],
    'winter': ['holidays', 'family', 'comfort', 'new_year']
  };

  if (monthNum >= 3 && monthNum <= 5) return seasons.spring;
  if (monthNum >= 6 && monthNum <= 8) return seasons.summer;
  if (monthNum >= 9 && monthNum <= 11) return seasons.fall;
  return seasons.winter;
}