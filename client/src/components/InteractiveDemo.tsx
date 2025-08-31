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
    imageUrl: getSmartVisual(businessDescription, businessType, platform.aspectRatio),
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

// Smart visual selection based on specific business description
const getSmartVisual = (businessDescription: string, businessType: string, aspectRatio: string): string => {
  const desc = businessDescription.toLowerCase();
  
  // More specific visual selection based on actual description
  const getSpecificVisual = () => {
    // Italian restaurant specific
    if (desc.includes('italian') && desc.includes('pasta')) {
      return {
        square: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=1080&h=1080&fit=crop&crop=center',
        landscape: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1200&h=628&fit=crop&crop=center',
        story: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=1080&h=1920&fit=crop&crop=center',
        banner: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=600&h=200&fit=crop&crop=center'
      };
    }
    
    // Bakery specific
    if (desc.includes('bakery') && desc.includes('bread')) {
      return {
        square: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1080&h=1080&fit=crop&crop=center',
        landscape: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&h=628&fit=crop&crop=center',
        story: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1080&h=1920&fit=crop&crop=center',
        banner: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&h=200&fit=crop&crop=center'
      };
    }
    
    // Yoga/meditation specific
    if (desc.includes('yoga') && desc.includes('meditation')) {
      return {
        square: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&h=1080&fit=crop&crop=center',
        landscape: 'https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?w=1200&h=628&fit=crop&crop=center',
        story: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1080&h=1920&fit=crop&crop=center',
        banner: 'https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?w=600&h=200&fit=crop&crop=center'
      };
    }
    
    return null;
  };
  
  const specificVisuals = getSpecificVisual();
  if (specificVisuals) {
    return specificVisuals[aspectRatio as keyof typeof specificVisuals];
  }
  
  // Fallback to business type visuals
  const visualsByType: Record<string, Record<string, string>> = {
    restaurant: {
      square: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=200&fit=crop&crop=center'
    },
    fitness: {
      square: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=200&fit=crop&crop=center'
    },
    beauty: {
      square: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=200&fit=crop&crop=center'
    },
    default: {
      square: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&h=1080&fit=crop&crop=center',
      landscape: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&h=628&fit=crop&crop=center',
      story: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&h=1920&fit=crop&crop=center',
      banner: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=200&fit=crop&crop=center'
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

// Generate a smart campaign idea based on business description
const generateCampaignIdea = (description: string, businessType: string): string => {
  const desc = description.toLowerCase();
  
  // Analyze business description for specific details
  if (businessType === 'restaurant') {
    if (desc.includes('italian') || desc.includes('pasta') || desc.includes('pizza')) {
      if (desc.includes('family') || desc.includes('downtown')) {
        return 'Authentic Italian Family Night - 20% Off for Groups of 4+';
      }
      return 'Wood-Fired Pizza Weekend Special - Buy 2 Get 1 Free';
    }
    if (desc.includes('bakery') || desc.includes('bread') || desc.includes('cake')) {
      if (desc.includes('weekend') || desc.includes('foot traffic')) {
        return 'Saturday Morning Fresh Bread + Coffee Combo Deal';
      }
      return 'Wedding Cake Consultation - Free Tasting Session';
    }
    if (desc.includes('coffee') || desc.includes('cafe')) {
      return 'Morning Commuter Special - Buy 5 Coffees, Get 2 Free';
    }
    return 'New Customer Special - 25% Off Your First Visit';
  }
  
  if (businessType === 'fitness') {
    if (desc.includes('yoga') || desc.includes('meditation')) {
      if (desc.includes('professional') || desc.includes('busy')) {
        return 'Lunch Break Yoga for Professionals - Free First Class';
      }
      return 'Mind-Body Transformation Package - 30% Off First Month';
    }
    if (desc.includes('crossfit') || desc.includes('strength')) {
      return 'Summer Strength Challenge - Join Today, Pay Later';
    }
    return 'New Year, New You - 50% Off Personal Training';
  }
  
  if (businessType === 'beauty') {
    if (desc.includes('spa') || desc.includes('facial') || desc.includes('treatment')) {
      return 'Stress Relief Spa Day - Book 2 Treatments, Save 30%';
    }
    if (desc.includes('salon') || desc.includes('hair')) {
      return 'New Look Makeover Package - Cut + Color + Style';
    }
    return 'Glow Up Special - Complimentary Consultation + 20% Off';
  }
  
  if (businessType === 'retail') {
    if (desc.includes('boutique') || desc.includes('clothing')) {
      return 'New Season Collection - Early Access + Free Styling';
    }
    if (desc.includes('store') || desc.includes('shop')) {
      return 'Customer Appreciation Week - 25% Off Everything';
    }
    return 'Weekend Flash Sale - Up to 40% Off Selected Items';
  }
  
  // Default based on common business goals
  if (desc.includes('new') || desc.includes('opening')) {
    return 'Grand Opening Special - 30% Off All Services';
  }
  if (desc.includes('consultation') || desc.includes('service')) {
    return 'Free Consultation + 20% Off First Service';
  }
  
  return 'Limited Time Offer - New Customer Special 25% Off';
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
          <h3 className="text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">
            {isSpanish ? '🚀 Demo de CampAIgner' : '🚀 CampAIgner Demo'}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {isSpanish 
              ? 'Describe tu negocio y mira cómo la IA de LeadBoost crea una campaña optimizada para 21+ plataformas'
              : 'Describe your business and watch LeadBoost\'s AI create a campaign optimized for 21+ platforms'
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
                placeholder={isSpanish ? 'ej: "Local bakery famous for artisan sourdough bread and custom wedding cakes, looking to increase weekend foot traffic"' : 'e.g., "Local bakery famous for artisan sourdough bread and custom wedding cakes, looking to increase weekend foot traffic"'}
                value={demo.businessDescription}
                onChange={(e) => setDemo(prev => ({ ...prev, businessDescription: e.target.value }))}
                className="w-full p-4 text-lg border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                rows={3}
                data-testid="input-business-description"
              />
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
              {/* High-Impact Visual with Advanced Design */}
              <div className={`relative mb-4 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                post.aspectRatio === 'story' ? 'aspect-[9/16] max-h-40' :
                post.aspectRatio === 'banner' ? 'aspect-[3/1]' :
                post.aspectRatio === 'landscape' ? 'aspect-[16/9]' :
                'aspect-square'
              }`}>
                <img 
                  src={post.imageUrl}
                  alt={`${post.platform} visual`}
                  className="w-full h-full object-cover"
                />
                
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60"></div>
                
                {/* Animated glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 animate-pulse"></div>
                
                {/* High-Impact Text Design */}
                <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                  {post.platform.includes('Story') ? (
                    // Story format - bold vertical design
                    <div className="space-y-3">
                      <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/30">
                        <h3 className="text-xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                          {generatedCampaign.split(' ').slice(0, 3).join(' ')}
                        </h3>
                        <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mt-2 rounded-full"></div>
                        <p className="text-sm font-bold text-white/90 drop-shadow-xl mt-2">
                          {generatedCampaign.split(' ').slice(3).join(' ')}
                        </p>
                      </div>
                    </div>
                  ) : post.platform.includes('Email') ? (
                    // Email banner - sleek horizontal design
                    <div className="w-full">
                      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <h3 className="text-lg font-black text-white drop-shadow-2xl">
                          {generatedCampaign}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    // Standard posts - premium card design
                    <div className="space-y-2 max-w-full">
                      <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-4 border border-white/30 shadow-2xl">
                        <h3 className="text-lg font-black text-white leading-tight drop-shadow-2xl mb-2">
                          {generatedCampaign.split(' ').slice(0, 4).join(' ')}
                        </h3>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mb-2 rounded-full"></div>
                        <p className="text-sm font-bold text-white/95 drop-shadow-xl">
                          {generatedCampaign.split(' ').slice(4).join(' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Premium platform badge */}
                <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-white/20">
                  {post.dimensions}
                </div>
                
                {/* AI-powered badge */}
                <div className="absolute bottom-3 left-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered
                </div>
                
                {/* Subtle corner decoration */}
                <div className="absolute top-0 left-0 w-8 h-8">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/40 rounded-tl-lg"></div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8">
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/40 rounded-br-lg"></div>
                </div>
              </div>
              
              {/* Premium caption preview */}
              <div className="relative bg-gradient-to-r from-gray-50 to-blue-50/50 p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="absolute top-2 right-2">
                  {post.icon}
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">
                  <span className="inline-flex items-center gap-1 font-bold text-gray-800 mb-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {post.platform} Caption
                  </span>
                  <div className="text-gray-600">
                    {post.caption.length > 85 ? (
                      <>
                        {post.caption.substring(0, 85)}...
                        <button className="text-blue-600 ml-1 font-semibold hover:text-blue-800 transition-colors">
                          {isSpanish ? 'expandir' : 'expand'}
                        </button>
                      </>
                    ) : (
                      post.caption
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Post Everywhere CTA */}
      <div className="text-center mt-8">
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 p-1 rounded-2xl shadow-2xl max-w-md mx-auto">
          <Button 
            size="lg" 
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-black text-lg py-6 rounded-xl shadow-xl transition-all duration-300 hover:scale-105"
            data-testid="button-post-everywhere"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                <Instagram className="w-6 h-6 text-pink-500" />
                <Facebook className="w-6 h-6 text-blue-600" />
                <Linkedin className="w-6 h-6 text-blue-700" />
                <Twitter className="w-6 h-6 text-sky-500" />
                <Mail className="w-6 h-6 text-gray-600" />
              </div>
              <span>{isSpanish ? 'Publicar en Todas Partes' : 'Post Everywhere'}</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </div>
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-3 max-w-lg mx-auto">
          {isSpanish 
            ? '🚀 Un clic para publicar tu campaña en todas las plataformas simultáneamente'
            : '🚀 One click to publish your campaign across all platforms simultaneously'
          }
        </p>
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
              : 'Upgrade to Enterprise for DALL-E generated images specific to your business, created instantly from your business POS data.'
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