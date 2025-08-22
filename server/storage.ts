import type { 
  SocialAccount, InsertSocialAccount,
  Conversation, InsertConversation,
  Message, InsertMessage,
  Campaign, InsertCampaign,
  FeedPlan, InsertFeedPlan,
  BusinessData, InsertBusinessData,
  Post, InsertPost
} from '@shared/schema';

export interface IStorage {
  // Social Accounts
  getSocialAccounts(): Promise<SocialAccount[]>;
  getSocialAccountById(id: number): Promise<SocialAccount | null>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: number, updates: Partial<InsertSocialAccount>): Promise<SocialAccount | null>;
  deleteSocialAccount(id: number): Promise<boolean>;

  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: number): Promise<Conversation | null>;
  getConversationsByPlatform(platform: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | null>;

  // Messages
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<Message[]>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: number): Promise<Campaign | null>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, updates: Partial<InsertCampaign>): Promise<Campaign | null>;
  deleteCampaign(id: number): Promise<boolean>;

  // Feed Plans
  getFeedPlans(): Promise<FeedPlan[]>;
  getFeedPlanById(id: number): Promise<FeedPlan | null>;
  getFeedPlanByMonth(month: string): Promise<FeedPlan | null>;
  createFeedPlan(feedPlan: InsertFeedPlan): Promise<FeedPlan>;
  updateFeedPlan(id: number, updates: Partial<InsertFeedPlan>): Promise<FeedPlan | null>;

  // Business Data
  getBusinessData(): Promise<BusinessData[]>;
  getBusinessDataByType(dataType: string): Promise<BusinessData[]>;
  createBusinessData(data: InsertBusinessData): Promise<BusinessData>;
  updateBusinessData(id: number, updates: Partial<InsertBusinessData>): Promise<BusinessData | null>;

  // Posts
  getPosts(): Promise<Post[]>;
  getPostsByCampaign(campaignId: number): Promise<Post[]>;
  getPostsByFeedPlan(feedPlanId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | null>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private socialAccounts: SocialAccount[] = [];
  private conversations: Conversation[] = [];
  private messages: Message[] = [];
  private campaigns: Campaign[] = [];
  private feedPlans: FeedPlan[] = [];
  private businessData: BusinessData[] = [];
  private posts: Post[] = [];
  
  private nextId = {
    socialAccounts: 1,
    conversations: 1,
    messages: 1,
    campaigns: 1,
    feedPlans: 1,
    businessData: 1,
    posts: 1,
  };

  // Social Accounts
  async getSocialAccounts(): Promise<SocialAccount[]> {
    return this.socialAccounts;
  }

  async getSocialAccountById(id: number): Promise<SocialAccount | null> {
    return this.socialAccounts.find(acc => acc.id === id) || null;
  }

  async createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount> {
    const newAccount: SocialAccount = {
      ...account,
      id: this.nextId.socialAccounts++,
      createdAt: new Date(),
    };
    this.socialAccounts.push(newAccount);
    return newAccount;
  }

  async updateSocialAccount(id: number, updates: Partial<InsertSocialAccount>): Promise<SocialAccount | null> {
    const index = this.socialAccounts.findIndex(acc => acc.id === id);
    if (index === -1) return null;
    
    this.socialAccounts[index] = { ...this.socialAccounts[index], ...updates };
    return this.socialAccounts[index];
  }

  async deleteSocialAccount(id: number): Promise<boolean> {
    const index = this.socialAccounts.findIndex(acc => acc.id === id);
    if (index === -1) return false;
    
    this.socialAccounts.splice(index, 1);
    return true;
  }

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return this.conversations;
  }

  async getConversationById(id: number): Promise<Conversation | null> {
    return this.conversations.find(conv => conv.id === id) || null;
  }

  async getConversationsByPlatform(platform: string): Promise<Conversation[]> {
    return this.conversations.filter(conv => conv.platform === platform);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConversation: Conversation = {
      ...conversation,
      id: this.nextId.conversations++,
      createdAt: new Date(),
    };
    this.conversations.push(newConversation);
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation | null> {
    const index = this.conversations.findIndex(conv => conv.id === id);
    if (index === -1) return null;
    
    this.conversations[index] = { ...this.conversations[index], ...updates };
    return this.conversations[index];
  }

  // Messages
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return this.messages.filter(msg => msg.conversationId === conversationId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: this.nextId.messages++,
      timestamp: new Date(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return this.messages
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.campaigns;
  }

  async getCampaignById(id: number): Promise<Campaign | null> {
    return this.campaigns.find(campaign => campaign.id === id) || null;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const newCampaign: Campaign = {
      ...campaign,
      id: this.nextId.campaigns++,
      createdAt: new Date(),
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }

  async updateCampaign(id: number, updates: Partial<InsertCampaign>): Promise<Campaign | null> {
    const index = this.campaigns.findIndex(campaign => campaign.id === id);
    if (index === -1) return null;
    
    this.campaigns[index] = { ...this.campaigns[index], ...updates };
    return this.campaigns[index];
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const index = this.campaigns.findIndex(campaign => campaign.id === id);
    if (index === -1) return false;
    
    this.campaigns.splice(index, 1);
    return true;
  }

  // Feed Plans
  async getFeedPlans(): Promise<FeedPlan[]> {
    return this.feedPlans;
  }

  async getFeedPlanById(id: number): Promise<FeedPlan | null> {
    return this.feedPlans.find(plan => plan.id === id) || null;
  }

  async getFeedPlanByMonth(month: string): Promise<FeedPlan | null> {
    return this.feedPlans.find(plan => plan.month === month) || null;
  }

  async createFeedPlan(feedPlan: InsertFeedPlan): Promise<FeedPlan> {
    const newFeedPlan: FeedPlan = {
      ...feedPlan,
      id: this.nextId.feedPlans++,
      createdAt: new Date(),
    };
    this.feedPlans.push(newFeedPlan);
    return newFeedPlan;
  }

  async updateFeedPlan(id: number, updates: Partial<InsertFeedPlan>): Promise<FeedPlan | null> {
    const index = this.feedPlans.findIndex(plan => plan.id === id);
    if (index === -1) return null;
    
    this.feedPlans[index] = { ...this.feedPlans[index], ...updates };
    return this.feedPlans[index];
  }

  // Business Data
  async getBusinessData(): Promise<BusinessData[]> {
    return this.businessData;
  }

  async getBusinessDataByType(dataType: string): Promise<BusinessData[]> {
    return this.businessData.filter(data => data.dataType === dataType);
  }

  async createBusinessData(data: InsertBusinessData): Promise<BusinessData> {
    const newData: BusinessData = {
      ...data,
      id: this.nextId.businessData++,
      lastSync: new Date(),
    };
    this.businessData.push(newData);
    return newData;
  }

  async updateBusinessData(id: number, updates: Partial<InsertBusinessData>): Promise<BusinessData | null> {
    const index = this.businessData.findIndex(data => data.id === id);
    if (index === -1) return null;
    
    this.businessData[index] = { ...this.businessData[index], ...updates };
    return this.businessData[index];
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    return this.posts;
  }

  async getPostsByCampaign(campaignId: number): Promise<Post[]> {
    return this.posts.filter(post => post.campaignId === campaignId);
  }

  async getPostsByFeedPlan(feedPlanId: number): Promise<Post[]> {
    return this.posts.filter(post => post.feedPlanId === feedPlanId);
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: this.nextId.posts++,
    };
    this.posts.push(newPost);
    return newPost;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | null> {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) return null;
    
    this.posts[index] = { ...this.posts[index], ...updates };
    return this.posts[index];
  }
}