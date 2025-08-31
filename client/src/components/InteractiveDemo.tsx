import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Instagram, Facebook, Linkedin, Twitter, Mail, Hash, ArrowRight } from 'lucide-react';

interface DemoState {
  businessDescription: string;
  isGenerating: boolean;
  showResults: boolean;
}

interface PlatformPost {
  platform: string;
  caption: string;
  dimensions: string;
  aspectRatio: string;
  imageUrl: string;
  icon: React.ReactNode;
}

interface InteractiveDemoProps {
  isSpanish: boolean;
}

// Generate platform-specific posts from business description
const generatePlatformPosts = (businessDescription: string): PlatformPost[] => {
  // Auto-detect business type and generate a campaign idea
  const businessType = detectBusinessType(businessDescription);
  const campaignIdea = generateCampaignIdea(businessDescription, businessType);
  const platforms = [
    {
      platform: 'Instagram Post',
      dimensions: '1080×1080',
      aspectRatio: 'square',
      icon: <Instagram className="w-4 h-4" />,
      tone: 'casual-engaging'
    },
    {
      platform: 'Instagram Story',
      dimensions: '1080×1920', 
      aspectRatio: 'story',
      icon: <Instagram className="w-4 h-4" />,
      tone: 'urgent-visual'
    },
    {
      platform: 'LinkedIn Post',
      dimensions: '1200×628',
      aspectRatio: 'landscape',
      icon: <Linkedin className="w-4 h-4" />,
      tone: 'professional'
    },
    {
      platform: 'Threads Post', 
      dimensions: '1080×1080',
      aspectRatio: 'square',
      icon: <Hash className="w-4 h-4" />,
      tone: 'conversational'
    },
    {
      platform: 'Email Newsletter',
      dimensions: '600×200',
      aspectRatio: 'banner',
      icon: <Mail className="w-4 h-4" />,
      tone: 'direct-value'
    },
    {
      platform: 'Twitter/X Post',
      dimensions: '1600×900',
      aspectRatio: 'landscape',
      icon: <Twitter className="w-4 h-4" />,
      tone: 'witty-concise'
    },
    {
      platform: 'Facebook Post',
      dimensions: '1200×628', 
      aspectRatio: 'landscape',
      icon: <Facebook className="w-4 h-4" />,
      tone: 'friendly-detailed'
    },
    {
      platform: 'TikTok Cover',
      dimensions: '1080×1920',
      aspectRatio: 'story',
      icon: <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center text-white text-xs font-bold">T</div>,
      tone: 'trendy-bold'
    }
  ];

  return platforms.map(platform => ({
    platform: platform.platform,
    caption: generatePlatformCaption(campaignIdea, businessType, platform.tone),
    dimensions: platform.dimensions,
    aspectRatio: platform.aspectRatio,
    imageUrl: getSmartVisual(campaignIdea, businessType, platform.aspectRatio),
    icon: platform.icon
  }));
};

// Generate platform-optimized captions
const generatePlatformCaption = (campaignIdea: string, businessType: string, tone: string): string => {
  const captions: Record<string, Record<string, string>> = {
    'casual-engaging': {
      'restaurant': `🍽️ ${campaignIdea} Don't miss out on amazing flavors! Tag a friend who loves good food 👯‍♀️ #FoodieLife #GreatDeals`,
      'fitness': `💪 ${campaignIdea} Transform your fitness journey TODAY! Who's ready to crush their goals? 🔥 #FitnessMotivation #NoExcuses`,
      'beauty': `✨ ${campaignIdea} Glow up time! Your skin deserves this amazing deal 💫 Drop a 🙋‍♀️ if you're ready! #GlowUp #SkincareTips`,
      'default': `🎉 ${campaignIdea} This is the moment you've been waiting for! Don't let this opportunity slip away ⏰ #LimitedTime #DontMiss`
    },
    'urgent-visual': {
      'restaurant': `${campaignIdea}! 🔥\nTASTE THE DIFFERENCE\nToday Only! ⏰`,
      'fitness': `${campaignIdea}! 💪\nSTART TODAY\nLimited Time ⚡`,
      'beauty': `${campaignIdea}! ✨\nGLOW TIME\nAct Fast! 💨`,
      'default': `${campaignIdea}! 🚀\nACT NOW\nLimited Time ⏰`
    },
    'professional': {
      'restaurant': `Elevate your dining experience with ${campaignIdea}. Join industry professionals who choose quality and value. Limited time offer for discerning customers.`,
      'fitness': `Achieve your professional wellness goals with ${campaignIdea}. Invest in your health and productivity. Join successful professionals who prioritize fitness.`,
      'beauty': `Professional-grade skincare with ${campaignIdea}. Enhance your professional image with premium products trusted by industry leaders.`,
      'default': `Take advantage of ${campaignIdea} and join forward-thinking professionals who recognize exceptional value. Limited time opportunity for growth-minded individuals.`
    },
    'conversational': {
      'restaurant': `Just heard about ${campaignIdea} and had to share! Anyone else excited about trying this? The reviews are incredible 👀`,
      'fitness': `So ${campaignIdea} is happening and I'm honestly tempted... Who's tried this before? Looking for honest opinions!`,
      'beauty': `Okay but ${campaignIdea} sounds pretty amazing? Has anyone used their products before? Thinking about giving it a try ✨`,
      'default': `Wait, ${campaignIdea} is actually happening? This seems too good to be true... anyone else seeing this? 🤔`
    },
    'direct-value': {
      'restaurant': `${campaignIdea} - Exclusive Email Subscriber Benefit! Reserve your table now and save big on premium dining.`,
      'fitness': `${campaignIdea} - Subscriber Exclusive! Join thousands who've transformed their health. Start your journey today.`,
      'beauty': `${campaignIdea} - VIP Access for Email Subscribers! Premium skincare at unbeatable prices. Shop before it's gone.`,
      'default': `${campaignIdea} - Exclusive Subscriber Offer! Take advantage of this limited-time opportunity designed just for you.`
    },
    'witty-concise': {
      'restaurant': `Plot twist: ${campaignIdea} and your taste buds are about to be very happy 🍽️ You're welcome in advance.`,
      'fitness': `Breaking: ${campaignIdea} Your future self is already thanking you 💪 Time to make it official.`,
      'beauty': `PSA: ${campaignIdea} Your skin called, it wants this ASAP ✨ Don't keep it waiting.`,
      'default': `This just in: ${campaignIdea} Your wallet and your happiness both approve of this message 🎉`
    },
    'friendly-detailed': {
      'restaurant': `Hey food lovers! 🍽️ We're thrilled to announce ${campaignIdea}! This is our way of saying thank you to our amazing community. Whether you're planning a date night, family dinner, or catching up with friends, this is the perfect opportunity to experience our signature dishes at incredible value. Book your table now!`,
      'fitness': `Hello fitness family! 💪 We're excited to share ${campaignIdea} with our incredible community! This special offer includes access to all our classes, equipment, and personal training sessions. Whether you're just starting your fitness journey or looking to reach new goals, we're here to support you every step of the way!`,
      'beauty': `Beautiful souls! ✨ We're delighted to offer ${campaignIdea} to our wonderful community! This exclusive deal includes our best-selling products that have helped thousands achieve their skincare goals. Treat yourself to the glow-up you deserve - your skin will thank you later!`,
      'default': `Dear valued customers! 🎉 We're excited to present ${campaignIdea} as our special thank you to the amazing community that supports us. This limited-time offer represents our commitment to providing exceptional value while maintaining the quality you've come to expect. Don't miss this opportunity!`
    },
    'trendy-bold': {
      'restaurant': `${campaignIdea} is SENDING me 🤤\nFood that hits DIFFERENT ✨`,
      'fitness': `${campaignIdea} = Main character energy 💅\nWe're leveling UP! 🔥`,
      'beauty': `${campaignIdea} has me GLOWING ✨\nSkin looking EXPENSIVE 💎`,
      'default': `${campaignIdea} is the MOMENT 🔥\nThis is IT chief! ✨`
    }
  };

  const businessKey = ['restaurant', 'fitness', 'beauty'].includes(businessType) ? businessType : 'default';
  return captions[tone]?.[businessKey] || `${campaignIdea} - Limited time offer!`;
};

// Smart visual selection based on campaign and business type
const getSmartVisual = (campaignIdea: string, businessType: string, aspectRatio: string): string => {
  const visualsByType: Record<string, Record<string, string>> = {
    restaurant: {
      square: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=200&fit=crop&crop=center'
    },
    fitness: {
      square: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=200&fit=crop&crop=center'
    },
    beauty: {
      square: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=200&fit=crop&crop=center'
    },
    default: {
      square: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&h=200&fit=crop&crop=center'
    }
  };

  const businessKey = ['restaurant', 'fitness', 'beauty'].includes(businessType) ? businessType : 'default';
  return visualsByType[businessKey][aspectRatio] || visualsByType.default[aspectRatio];
};

// Detect business type from description
const detectBusinessType = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe') || desc.includes('pizza') || desc.includes('dining')) {
    return 'restaurant';
  }
  if (desc.includes('gym') || desc.includes('fitness') || desc.includes('workout') || desc.includes('yoga') || desc.includes('training')) {
    return 'fitness';
  }
  if (desc.includes('beauty') || desc.includes('spa') || desc.includes('salon') || desc.includes('skincare') || desc.includes('cosmetic')) {
    return 'beauty';
  }
  if (desc.includes('retail') || desc.includes('store') || desc.includes('shop') || desc.includes('boutique') || desc.includes('clothing')) {
    return 'retail';
  }
  
  return 'default';
};

// Generate a campaign idea based on business description
const generateCampaignIdea = (description: string, businessType: string): string => {
  const campaignIdeas: Record<string, string[]> = {
    restaurant: [
      '25% off Weekend Special',
      'Happy Hour Buy One Get One Free',
      'New Menu Launch - Try 3 Dishes for $30',
      'Family Dinner Deal - Kids Eat Free'
    ],
    fitness: [
      'New Year Fitness Challenge - 50% Off First Month',
      'Summer Body Bootcamp - Join Today',
      'Free Personal Training Session This Week',
      'Unlimited Classes for 30 Days - Special Price'
    ],
    beauty: [
      'Glow Up Package - 30% Off All Treatments',
      'Mother\'s Day Spa Special - Book Now',
      'New Product Launch - Free Consultation',
      'Bridal Package - Complete Wedding Look'
    ],
    retail: [
      'Spring Sale - Up to 50% Off Everything',
      'Buy 2 Get 1 Free Weekend Only',
      'New Collection Launch - Early Access',
      'Customer Appreciation - 20% Off + Free Shipping'
    ],
    default: [
      'Limited Time Offer - 30% Off All Services',
      'New Client Special - Book Your Consultation',
      'Weekend Flash Sale - Save Big Today',
      'Exclusive Deal - Premium Package Discount'
    ]
  };
  
  const ideas = campaignIdeas[businessType] || campaignIdeas.default;
  return ideas[Math.floor(Math.random() * ideas.length)];
};

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [demo, setDemo] = useState<DemoState>({
    businessDescription: '',
    isGenerating: false,
    showResults: false
  });

  const [platformPosts, setPlatformPosts] = useState<PlatformPost[]>([]);
  const [generatedCampaign, setGeneratedCampaign] = useState<string>('');

  const handleGenerateCampaign = async () => {
    if (!demo.businessDescription.trim()) return;
    
    setDemo(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate campaign generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const posts = generatePlatformPosts(demo.businessDescription);
    const businessType = detectBusinessType(demo.businessDescription);
    const campaignIdea = generateCampaignIdea(demo.businessDescription, businessType);
    
    setPlatformPosts(posts);
    setGeneratedCampaign(campaignIdea);
    
    setDemo(prev => ({ 
      ...prev, 
      isGenerating: false, 
      showResults: true 
    }));
  };

  const resetDemo = () => {
    setDemo({
      businessDescription: '',
      isGenerating: false,
      showResults: false
    });
    setPlatformPosts([]);
    setGeneratedCampaign('');
  };

  if (!demo.showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-brand-600" />
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            {isSpanish ? '🚀 Demo de CampAIgner' : '🚀 CampAIgner Demo'}
          </h3>
          <p className="text-gray-600 text-lg">
            {isSpanish 
              ? 'Describe tu negocio y mira cómo la IA de LeadBoost crea una campaña optimizada para 8+ plataformas'
              : 'Describe your business and watch LeadBoost\'s AI create a campaign optimized for 8+ platforms'
            }
          </p>
        </div>

        <Card className="border-2 border-purple-100">
          <CardContent className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isSpanish ? '🏢 Describe tu Negocio' : '🏢 Describe Your Business'}
              </label>
              <textarea
                placeholder={isSpanish ? 'Describe tu negocio aquí...' : 'Describe your business here...'}
                value={demo.businessDescription}
                onChange={(e) => setDemo(prev => ({ ...prev, businessDescription: e.target.value }))}
                className="w-full p-4 text-lg border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                rows={3}
                data-testid="input-business-description"
              />
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  {isSpanish ? 'Ejemplos:' : 'Examples:'}
                </p>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm text-gray-600">
                  <p>• "Boutique fitness studio specializing in yoga and meditation classes for busy professionals in Manhattan"</p>
                  <p>• "Local bakery famous for artisan sourdough bread and custom wedding cakes, looking to increase weekend foot traffic"</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {isSpanish 
                  ? 'La IA detectará tu industria y generará una campaña perfecta automáticamente'
                  : 'AI will detect your industry and generate a perfect campaign automatically'
                }
              </p>
            </div>

            <Button 
              onClick={handleGenerateCampaign}
              disabled={demo.isGenerating || !demo.businessDescription.trim()}
              className="w-full h-14 text-lg bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700"
              data-testid="button-generate-campaign"
            >
              {demo.isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  {isSpanish ? 'IA creando tu campaña...' : 'AI creating your campaign...'}
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  {isSpanish ? 'Crear Campaña con IA' : 'Create AI Campaign'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4">
          {isSpanish ? '🎉 Tu Campaña Multiplataforma' : '🎉 Your Multi-Platform Campaign'}
        </h3>
        <p className="text-gray-600 text-lg mb-4">
          <strong>"{generatedCampaign}"</strong> {isSpanish ? 'optimizada para 8 plataformas' : 'optimized for 8 platforms'}
        </p>
        <Button variant="outline" onClick={resetDemo} data-testid="button-try-another">
          {isSpanish ? 'Probar Otra Campaña' : 'Try Another Campaign'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {platformPosts.map((post, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`platform-card-${index}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {post.icon}
                {post.platform}
                <span className="ml-auto text-xs text-gray-500 font-normal">
                  {post.dimensions}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Visual */}
              <div className={`relative mb-4 bg-gray-100 rounded-lg overflow-hidden ${
                post.aspectRatio === 'story' ? 'aspect-[9/16] max-h-32' :
                post.aspectRatio === 'banner' ? 'aspect-[3/1]' :
                post.aspectRatio === 'landscape' ? 'aspect-[16/9]' :
                'aspect-square'
              }`}>
                <img 
                  src={post.imageUrl}
                  alt={`${post.platform} visual`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Smart Demo
                </div>
              </div>
              
              {/* Caption */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {post.caption.length > 100 ? (
                  <>
                    {post.caption.substring(0, 100)}...
                    <button className="text-blue-600 ml-1 font-medium">
                      {isSpanish ? 'ver más' : 'see more'}
                    </button>
                  </>
                ) : (
                  post.caption
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12 pt-8 border-t">
        <p className="text-gray-600 mb-6 text-lg">
          {isSpanish 
            ? '✨ Una sola idea de campaña → 8 posts listos para publicar en diferentes plataformas'
            : '✨ One campaign idea → 8 ready-to-publish posts across different platforms'
          }
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-bold text-gray-900 mb-2">
            {isSpanish ? '🚀 ¿Quieres VERDADERO contenido IA personalizado?' : '🚀 Want REAL AI-personalized content?'}
          </h4>
          <p className="text-gray-600 text-sm mb-4">
            {isSpanish 
              ? 'Actualiza a Enterprise para imágenes generadas con DALL-E específicas para tu negocio, creadas al instante según tu descripción exacta.'
              : 'Upgrade to Enterprise for DALL-E generated images specific to your business, created instantly from your exact description.'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="lg" data-testid="button-start-free">
              {isSpanish ? 'Comenzar Gratis' : 'Start Free'}
            </Button>
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700" data-testid="button-upgrade-enterprise">
              {isSpanish ? 'Ver Enterprise' : 'View Enterprise'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}