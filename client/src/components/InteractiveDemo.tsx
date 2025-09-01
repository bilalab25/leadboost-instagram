import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Instagram, Facebook, Linkedin, Twitter, Mail, Hash, ArrowRight, Play, Volume2, X } from 'lucide-react';

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
const generatePlatformPosts = (businessDescription: string, brandStyle: string = 'professional'): PlatformPost[] => {
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
    caption: generatePlatformCaption(campaignIdea, businessType, platform.tone, businessDescription, brandStyle),
    dimensions: platform.dimensions,
    aspectRatio: platform.aspectRatio,
    imageUrl: getSmartVisual(businessDescription, businessType, platform.aspectRatio, platform.platform),
    icon: platform.icon,
    brandStyle: brandStyle
  }));
};

// Generate platform-optimized captions
const generatePlatformCaption = (campaignIdea: string, businessType: string, tone: string, businessDescription: string = '', brandStyle: string = 'professional'): string => {
  const desc = businessDescription.toLowerCase();
  
  // Art History Teacher - Educational and cultural
  if (desc.includes('art history') && desc.includes('teacher')) {
    if (tone === 'professional') return `Transform your understanding of art history with ${campaignIdea}. From Renaissance masters to contemporary movements, explore the stories that shaped our visual culture. Join art enthusiasts who value deep, scholarly insight.`;
    if (tone === 'casual-engaging') return `🎨 ${campaignIdea} From Monet's water lilies to Picasso's revolutionary cubism - art history has never been this engaging! Who else loves discovering the stories behind masterpieces? #ArtHistory #Monet #Picasso`;
    if (tone === 'friendly-detailed') return `Hello art lovers! 🏛️ I'm excited to offer ${campaignIdea} to fellow enthusiasts of visual culture! Whether you're fascinated by the mysteries of ancient Egyptian art or the bold innovations of modern expressionism, let's explore art history together. Each lesson brings masterpieces to life with context, meaning, and cultural significance!`;
    return `${campaignIdea} - Discover the secrets of the masters! 🎨 Art history comes alive ✨`;
  }
  
  // Therapist/Counselor - Healing and supportive  
  if (desc.includes('therapist') || desc.includes('counseling') || desc.includes('therapy')) {
    if (tone === 'professional') return `Experience compassionate, evidence-based therapy with ${campaignIdea}. In a safe, confidential environment, we work together toward healing, growth, and emotional wellness. Join individuals who prioritize their mental health journey.`;
    if (tone === 'friendly-detailed') return `Dear friends seeking wellness 💚 I'm honored to offer ${campaignIdea} to support your journey toward emotional health and personal growth. Therapy is a brave step, and you don't have to walk this path alone. Together, we'll work at your pace in a judgment-free space where healing begins.`;
    if (tone === 'conversational') return `Taking care of your mental health is one of the bravest things you can do. ${campaignIdea} offers a safe space to process, heal, and grow. Anyone else believe therapy should be accessible and stigma-free? 💚`;
    return `${campaignIdea} - Your mental health matters. Start your healing journey 🌱`;
  }
  
  // Wedding Photographer - Romantic and memorable
  if (desc.includes('photographer') && desc.includes('wedding')) {
    if (tone === 'professional') return `Preserve your most precious moments with ${campaignIdea}. Specializing in timeless wedding photography that captures the authentic emotions, intimate details, and pure joy of your celebration. Trusted by couples who value artistry and excellence.`;
    if (tone === 'friendly-detailed') return `Beautiful couples! 💕 I'm thrilled to announce ${campaignIdea} for engagements and weddings! Your love story deserves to be told through stunning imagery that captures every laugh, every tear, and every magical moment. From getting-ready shots to your first dance, let's create heirloom images you'll treasure forever!`;
    if (tone === 'casual-engaging') return `💕 ${campaignIdea} Because your love story deserves to be captured beautifully! From the nervous excitement of getting ready to that perfect kiss at the altar - every moment is precious ✨ Tag your person! #WeddingPhotography #LoveStory`;
    return `${campaignIdea} - Capture your forever moments 💕 Timeless wedding photography ✨`;
  }
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

// Platform dimensions for pixel-perfect assets
const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'LinkedIn Post': { width: 1200, height: 628 },
  'Threads Post': { width: 1080, height: 1080 },
  'Email Banner': { width: 600, height: 200 },
  'Twitter/X Post': { width: 1600, height: 900 },
  'Facebook Post': { width: 1200, height: 628 },
  'TikTok Cover': { width: 1080, height: 1920 }
};

// Generate pixel-perfect images with exact platform dimensions
const getSmartVisual = (businessDescription: string, businessType: string, aspectRatio: string, platform: string): string => {
  const desc = businessDescription.toLowerCase();
  
  // Get exact dimensions for the platform
  const dimensions = PLATFORM_DIMENSIONS[platform] || { width: 1200, height: 628 };
  
  // Comprehensive business-specific visual database with contextually relevant imagery
  const getBusinessContextualImage = (): string => {
  // MEDICAL AESTHETICS & BEAUTY - Botox & Cosmetic Treatments
  if (desc.includes('botox') || desc.includes('dermal') || desc.includes('filler') || desc.includes('aesthetic') || desc.includes('cosmetic')) {
    // Professional woman with smooth, youthful skin - premium medical aesthetics
    return `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('clinic') && (desc.includes('beauty') || desc.includes('skin') || desc.includes('face') || desc.includes('botox') || desc.includes('aesthetic') || desc.includes('cosmetic'))) {
    // Elegant medical spa clinic interior - clean, modern, professional
    return `https://images.unsplash.com/photo-1570303345338-e1f0eddf4946?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // SPA & WELLNESS - Facial Treatments & Skincare
  if (desc.includes('spa') || desc.includes('facial') || desc.includes('skincare')) {
    // Luxury spa treatment with smooth skin focus
    return `https://images.unsplash.com/photo-1562887284-5c6e2e3bb1e4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // DENTAL
  if (desc.includes('dental') || desc.includes('dentist') || desc.includes('teeth') || desc.includes('orthodontic')) {
    // Modern dental office
    return `https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FOOD & RESTAURANTS
  if (desc.includes('restaurant') || desc.includes('bistro') || desc.includes('cafe')) {
    if (desc.includes('italian') || desc.includes('pasta')) {
      return `https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
    }
    // Elegant restaurant interior
    return `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('bakery') || desc.includes('bread') || desc.includes('pastry')) {
    // Artisan bakery with fresh bread
    return `https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FITNESS & WELLNESS
  if (desc.includes('gym') || desc.includes('fitness') || desc.includes('personal training')) {
    // Modern gym equipment
    return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('yoga') || desc.includes('meditation') || desc.includes('mindfulness')) {
    // Peaceful yoga studio
    return `https://images.unsplash.com/photo-1518611012118-696072aa579a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // EDUCATION
  if (desc.includes('teacher') || desc.includes('tutor') || desc.includes('education')) {
    if (desc.includes('art') || desc.includes('art history')) {
      return `https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
    }
    if (desc.includes('math') || desc.includes('science')) {
      return `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
    }
    // General education/classroom
    return `https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // CREATIVE SERVICES
  if (desc.includes('photographer') || desc.includes('photography')) {
    if (desc.includes('wedding')) {
      return `https://images.unsplash.com/photo-1519741497674-611481863552?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
    }
    // Professional photography studio
    return `https://images.unsplash.com/photo-1542038784456-1ea8e732b2b9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('designer') || desc.includes('graphic design') || desc.includes('creative')) {
    return `https://images.unsplash.com/photo-1561070791-2526d30994b5?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // LEGAL SERVICES
  if (desc.includes('lawyer') || desc.includes('attorney') || desc.includes('legal') || desc.includes('law firm')) {
    return `https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // RETAIL & SHOPPING
  if (desc.includes('boutique') || desc.includes('clothing') || desc.includes('fashion')) {
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // DEFAULT PROFESSIONAL
  return `https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
};

  return getBusinessContextualImage();
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
  if (desc.includes('beauty') || desc.includes('spa') || desc.includes('salon') || desc.includes('skincare') || desc.includes('cosmetic') || desc.includes('botox') || desc.includes('aesthetic') || desc.includes('dermal') || desc.includes('med spa')) {
    return 'beauty';
  }
  if (desc.includes('retail') || desc.includes('store') || desc.includes('shop') || desc.includes('boutique') || desc.includes('clothing')) {
    return 'retail';
  }
  
  return 'default';
};

// Intelligent campaign generation based on specific business description
const generateCampaignIdea = (description: string, businessType: string): string => {
  const desc = description.toLowerCase();
  
  // Education sector
  if (desc.includes('teacher') || desc.includes('education') || desc.includes('tutor')) {
    if (desc.includes('art history') || desc.includes('art')) {
      return 'Master Art History: Private Lessons with Museum-Quality Resources';
    }
    if (desc.includes('math') || desc.includes('calculus') || desc.includes('algebra')) {
      return 'Unlock Math Success: Personalized Tutoring That Gets Results';
    }
    if (desc.includes('language') || desc.includes('spanish') || desc.includes('french')) {
      return 'Speak Like a Native: Immersive Language Learning Experience';
    }
    return 'Transform Your Learning: Expert Tutoring Tailored to You';
  }
  
  // Medical & Aesthetic Services
  if (desc.includes('botox') || desc.includes('aesthetic') || desc.includes('med spa') || desc.includes('cosmetic')) {
    if (desc.includes('botox') || desc.includes('dermal')) {
      return 'Transform Your Look: Professional Botox & Dermal Filler Treatments';
    }
    return 'Reveal Your Best Self: Advanced Medical Aesthetic Treatments';
  }
  
  // Creative professionals
  if (desc.includes('photographer') || desc.includes('photography')) {
    if (desc.includes('wedding')) {
      return 'Capture Forever: Timeless Wedding Photography Collection';
    }
    if (desc.includes('portrait') || desc.includes('headshot')) {
      return 'Professional Portraits That Make You Stand Out';
    }
    return 'Preserve Your Precious Moments: Professional Photography';
  }
  
  if (desc.includes('designer') || desc.includes('graphic design')) {
    return 'Bring Your Vision to Life: Custom Design Solutions';
  }
  
  // Health & wellness
  if (desc.includes('therapist') || desc.includes('counseling') || desc.includes('therapy')) {
    return 'Find Your Path to Wellness: Compassionate Therapy Sessions';
  }
  
  if (desc.includes('massage') || desc.includes('spa')) {
    return 'Relax & Rejuvenate: Therapeutic Massage Experience';
  }
  
  // Professional services
  if (desc.includes('lawyer') || desc.includes('attorney') || desc.includes('legal')) {
    if (desc.includes('family') || desc.includes('divorce')) {
      return 'Protect Your Family: Experienced Legal Representation';
    }
    return 'Expert Legal Counsel When You Need It Most';
  }
  
  if (desc.includes('accountant') || desc.includes('tax') || desc.includes('bookkeeping')) {
    return 'Maximize Your Returns: Professional Tax & Accounting Services';
  }
  
  // Restaurant specifics
  if (desc.includes('italian') && (desc.includes('pasta') || desc.includes('restaurant'))) {
    return 'Authentic Italian Family Recipes - Experience True Italy';
  }
  
  if (desc.includes('bakery') && desc.includes('bread')) {
    return 'Fresh Daily: Artisan Breads & Pastries Made with Love';
  }
  
  if (desc.includes('coffee') || desc.includes('cafe')) {
    return 'Your Daily Escape: Premium Coffee & Cozy Atmosphere';
  }
  
  // Fitness specifics
  if (desc.includes('yoga') || desc.includes('meditation')) {
    return 'Find Your Inner Peace: Transformative Yoga Journey';
  }
  
  if (desc.includes('personal trainer') || desc.includes('fitness')) {
    return 'Achieve Your Best Self: Personalized Fitness Transformation';
  }
  
  // Generic business goals
  if (desc.includes('consulting') || desc.includes('consultant')) {
    return 'Unlock Your Business Potential: Expert Strategy Consulting';
  }
  
  // Default
  return 'Discover Excellence: Premium Services Tailored for You';
};

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  // Platform-specific branded styling functions
  const getPlatformHeaderStyle = (platform: string): string => {
    return 'py-4 px-4';
  };

  const getPlatformGradient = (platform: string): string => {
    switch (platform) {
      case 'Instagram Post':
      case 'Instagram Story':
        return 'from-brand-600 to-brand-700'; // Instagram gradient
      case 'LinkedIn Post':
        return 'from-blue-600 to-blue-700'; // LinkedIn blue
      case 'Twitter/X Post':
        return 'from-gray-800 to-black'; // X (Twitter) black
      case 'Facebook Post':
        return 'from-blue-500 to-blue-600'; // Facebook blue
      case 'Threads Post':
        return 'from-gray-700 to-gray-900'; // Threads dark
      case 'TikTok Cover':
        return 'from-red-500 to-pink-500'; // TikTok gradient
      case 'Email Banner':
        return 'from-green-500 to-green-600'; // Email green
      default:
        return 'from-gray-600 to-gray-700'; // Default gradient
    }
  };

  const [demo, setDemo] = useState<DemoState>({
    businessDescription: '',
    isGenerating: false,
    showResults: false
  });

  const [platformPosts, setPlatformPosts] = useState<PlatformPost[]>([]);
  const [generatedCampaign, setGeneratedCampaign] = useState<string>('');
  const [selectedBrandStyle, setSelectedBrandStyle] = useState<string>('professional');
  const [selectedPost, setSelectedPost] = useState<PlatformPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateCampaign = async () => {
    if (!demo.businessDescription.trim()) return;
    
    setDemo(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate campaign generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const posts = generatePlatformPosts(demo.businessDescription, selectedBrandStyle);
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

  const handleCardClick = (post: PlatformPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  if (!demo.showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 border-brand-200">
          <CardContent className="p-8 space-y-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">🚀</div>
              <h3 className="text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                {isSpanish ? '¡Haz Tu Propio Demo!' : 'Do Your Own Demo!'}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-bold">
                {isSpanish 
                  ? 'Demo Rápido - Ve cómo funciona con cualquier idea de negocio'
                  : 'Quick Demo - See how it works with any business idea'
                }
              </p>
            </div>
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
                  ? 'La IA detectará tu industria y generará una campaña de demostración automáticamente'
                  : 'AI will detect your industry and generate a demo campaign automatically'
                }
              </p>
            </div>

            {/* Brand Style Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {isSpanish ? '🎨 Elige tu Estilo de Marca' : '🎨 Choose Your Brand Style'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    id: 'professional',
                    name: isSpanish ? 'Profesional' : 'Professional',
                    desc: isSpanish ? 'Elegante y confiable' : 'Elegant & trustworthy',
                    icon: '💼',
                    gradient: 'from-blue-500 to-indigo-600'
                  },
                  {
                    id: 'creative',
                    name: isSpanish ? 'Creativo' : 'Creative',
                    desc: isSpanish ? 'Artístico y vibrante' : 'Artistic & vibrant',
                    icon: '🎨',
                    gradient: 'from-brand-500 to-brand-600'
                  },
                  {
                    id: 'playful',
                    name: isSpanish ? 'Divertido' : 'Playful',
                    desc: isSpanish ? 'Alegre y accesible' : 'Fun & approachable',
                    icon: '🌈',
                    gradient: 'from-yellow-500 to-orange-600'
                  },
                  {
                    id: 'luxury',
                    name: isSpanish ? 'Lujo' : 'Luxury',
                    desc: isSpanish ? 'Exclusivo y premium' : 'Exclusive & premium',
                    icon: '✨',
                    gradient: 'from-gray-700 to-black'
                  }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedBrandStyle(style.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedBrandStyle === style.id
                        ? 'border-brand-500 bg-brand-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    data-testid={`brand-style-${style.id}`}
                  >
                    <div className="text-center">
                      <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-r ${style.gradient} flex items-center justify-center text-2xl`}>
                        {style.icon}
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-1">
                        {style.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {style.desc}
                      </p>
                    </div>
                    {selectedBrandStyle === style.id && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {isSpanish 
                  ? 'Tu estilo de marca influirá en los colores, tipografías y tono de tu campaña'
                  : 'Your brand style will influence the colors, fonts, and tone of your campaign'
                }
              </p>
            </div>

            <Button 
              onClick={handleGenerateCampaign}
              disabled={demo.isGenerating || !demo.businessDescription.trim()}
              className="w-full h-14 text-lg bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800"
              data-testid="button-generate-campaign"
            >
              {demo.isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {isSpanish ? 'IA creando tu campaña...' : 'AI creating your campaign...'}
                  </span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {isSpanish ? 'Crear Campaña con IA' : 'Create AI Campaign'}
                  </span>
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
          <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm cursor-pointer" data-testid={`platform-card-${index}`} onClick={() => handleCardClick(post)}>
            <CardHeader className={`pb-3 relative ${getPlatformHeaderStyle(post.platform)}`}>
              <div className={`absolute inset-0 bg-gradient-to-r opacity-90 ${getPlatformGradient(post.platform)}`}></div>
              <CardTitle className="relative text-sm flex items-center gap-2 text-white font-semibold">
                <span className="text-lg drop-shadow-sm">{post.icon}</span>
                <span className="font-bold tracking-wide">{post.platform}</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm font-medium">
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
                
                {/* Dynamic brand style overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                
                {/* High-Impact Text Design */}
                <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                  {post.platform.includes('Story') ? (
                    // Story format - bold vertical design
                    <div className="space-y-3">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
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
                      <div className="bg-gradient-to-r from-brand-600/70 to-brand-700/70 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                        <h3 className="text-lg font-black text-white drop-shadow-2xl">
                          {generatedCampaign}
                        </h3>
                      </div>
                    </div>
                  ) : (
                    // Standard posts - premium card design
                    <div className="space-y-2 max-w-full">
                      <div className="bg-white/8 backdrop-blur-sm rounded-xl p-3 border border-white/20 shadow-lg">
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
                <div className="absolute top-3 right-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-white/20">
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
              <div className="relative bg-gradient-to-r from-gray-50 to-brand-50/50 p-4 rounded-xl border border-gray-200 shadow-sm">
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
        <div className="bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 p-1 rounded-2xl shadow-2xl max-w-md mx-auto">
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
        <div className="bg-gradient-to-r from-brand-50 to-brand-100 rounded-xl p-6 mb-6">
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
            <Button size="lg" className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800" data-testid="button-upgrade-enterprise">
              {isSpanish ? 'Ver Enterprise' : 'View Enterprise'}
            </Button>
          </div>
        </div>

        {/* Enterprise Demo Video Section */}
        <div className="mt-12 text-center">
          <h4 className="text-xl font-bold text-gray-900 mb-4">
            {isSpanish ? '🎥 Ve CampAIgner Enterprise en Acción' : '🎥 See CampAIgner Enterprise in Action'}
          </h4>
          <p className="text-gray-600 text-sm mb-6 max-w-2xl mx-auto">
            {isSpanish 
              ? 'Mira cómo un cliente real usa datos de su POS para crear campañas personalizadas con imágenes generadas por DALL-E'
              : 'Watch how a real customer uses their POS data to create personalized campaigns with DALL-E generated images'
            }
          </p>
          
          <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl">
            <div className="aspect-video relative bg-gray-900 flex items-center justify-center">
              {/* Video Thumbnail */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-brand-700/20"></div>
              <div className="relative z-10 text-center text-white">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-white/30 transition-all duration-300 cursor-pointer group">
                  <Play className="w-8 h-8 text-white ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <h5 className="text-xl font-bold mb-2">
                  {isSpanish ? 'Demo Enterprise: Restaurant Tony\'s' : 'Enterprise Demo: Tony\'s Restaurant'}
                </h5>
                <p className="text-white/80 text-sm">
                  {isSpanish ? '3:24 min • Ver cómo genera 21 campañas desde datos POS' : '3:24 min • Watch how it generates 21 campaigns from POS data'}
                </p>
              </div>
              
              {/* Premium badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isSpanish ? 'ENTERPRISE' : 'ENTERPRISE'}
              </div>
            </div>
            
            {/* Video Description */}
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Tony Martinez</p>
                    <p className="text-sm text-gray-500">
                      {isSpanish ? 'Propietario, Tony\'s Italian Kitchen' : 'Owner, Tony\'s Italian Kitchen'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpanish ? '15K visualizaciones' : '15K views'}</span>
                </div>
              </div>
              <p className="text-gray-700 text-sm mt-4 leading-relaxed">
                {isSpanish 
                  ? '"Con Enterprise, mis datos de ventas se convierten automáticamente en campañas personalizadas. Las imágenes generadas por IA son exactamente como mis platos reales. En 30 segundos tengo contenido para todo el mes."'
                  : '"With Enterprise, my sales data automatically becomes personalized campaigns. The AI-generated images look exactly like my real dishes. In 30 seconds I have content for the entire month."'
                }
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-brand-600 border-brand-300 hover:bg-brand-50"
            >
              {isSpanish ? 'Ver Más Casos de Éxito →' : 'View More Success Stories →'}
            </Button>
          </div>
        </div>
      </div>

      {/* Platform Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPost?.icon}
              {selectedPost?.platform} Preview
              <span className="text-sm text-gray-500 font-normal ml-auto">
                {selectedPost?.dimensions}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            {selectedPost && (
              <div className="space-y-6">
                {/* Platform Mockup */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Instagram Story Mockup */}
                    {selectedPost.platform === 'Instagram Story' && (
                      <div className="w-[280px] h-[497px] bg-black rounded-[24px] p-1 shadow-2xl">
                        <div className="w-full h-full rounded-[20px] overflow-hidden relative">
                          <img 
                            src={selectedPost.imageUrl} 
                            alt={selectedPost.platform}
                            className="w-full h-full object-cover"
                          />
                          {/* Instagram Story UI overlay */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full border-2 border-white"></div>
                              <span className="text-white text-sm font-semibold drop-shadow-lg">Your Business</span>
                            </div>
                            <div className="text-white text-sm drop-shadow-lg">now</div>
                          </div>
                          
                          {/* Dynamic brand style overlay - same as main cards */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          
                          {/* Campaign text overlay - exactly like main cards */}
                          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                            <div className="space-y-3">
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                <h3 className="text-xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                  {generatedCampaign.split(' ').slice(0, 3).join(' ')}
                                </h3>
                                <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mt-2 rounded-full"></div>
                                <p className="text-sm font-bold text-white/90 drop-shadow-xl mt-2">
                                  {generatedCampaign.split(' ').slice(3).join(' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Premium platform badge */}
                          <div className="absolute top-12 right-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg border border-white/20">
                            {selectedPost.dimensions}
                          </div>
                          
                        </div>
                      </div>
                    )}

                    {/* Instagram Post Mockup */}
                    {selectedPost.platform === 'Instagram Post' && (
                      <div className="w-[320px] bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-3 flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"></div>
                          <div>
                            <p className="text-sm font-semibold">yourbusiness</p>
                            <p className="text-xs text-gray-500">Sponsored</p>
                          </div>
                        </div>
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm">{selectedPost.caption}</p>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn Post Mockup */}
                    {selectedPost.platform === 'LinkedIn Post' && (
                      <div className="w-[500px] bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-4 flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">YB</span>
                          </div>
                          <div>
                            <p className="font-semibold">Your Business</p>
                            <p className="text-sm text-gray-500">Sponsored</p>
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <p className="text-sm mb-3">{selectedPost.caption}</p>
                        </div>
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full aspect-[1200/628] object-cover"
                        />
                      </div>
                    )}

                    {/* Email Banner Mockup */}
                    {selectedPost.platform === 'Email Banner' && (
                      <div className="w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                        <div className="bg-gray-100 p-2 text-center text-xs text-gray-600 border-b">
                          📧 Your Business Newsletter
                        </div>
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full h-[200px] object-cover"
                        />
                        <div className="p-4">
                          <p className="text-sm text-gray-700">{selectedPost.caption}</p>
                        </div>
                      </div>
                    )}

                    {/* TikTok Cover Mockup */}
                    {selectedPost.platform === 'TikTok Cover' && (
                      <div className="w-[280px] h-[497px] bg-black rounded-[12px] overflow-hidden shadow-2xl">
                        <div className="w-full h-full relative">
                          <img 
                            src={selectedPost.imageUrl} 
                            alt={selectedPost.platform}
                            className="w-full h-full object-cover"
                          />
                          {/* TikTok UI overlay */}
                          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-xs">YB</span>
                              </div>
                              <span className="text-white text-sm font-semibold drop-shadow-lg">@yourbusiness</span>
                            </div>
                            <div className="text-white text-sm drop-shadow-lg">•••</div>
                          </div>
                          
                          {/* Campaign text overlay - same style as Stories */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                          <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-center">
                            <div className="space-y-3">
                              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                                <h3 className="text-xl font-black text-white leading-tight drop-shadow-2xl tracking-tight">
                                  {generatedCampaign.split(' ').slice(0, 3).join(' ')}
                                </h3>
                                <div className="w-12 h-1 bg-gradient-to-r from-red-400 to-pink-500 mx-auto mt-2 rounded-full"></div>
                                <p className="text-sm font-bold text-white/90 drop-shadow-xl mt-2">
                                  {generatedCampaign.split(' ').slice(3).join(' ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Twitter/X Post Mockup */}
                    {selectedPost.platform === 'Twitter/X Post' && (
                      <div className="w-[500px] bg-white border border-gray-200 rounded-xl shadow-xl">
                        <div className="p-4 flex items-center space-x-3">
                          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">YB</span>
                          </div>
                          <div>
                            <p className="font-semibold">Your Business</p>
                            <p className="text-sm text-gray-500">@yourbusiness • Promoted</p>
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <p className="text-sm mb-3">{selectedPost.caption}</p>
                        </div>
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full aspect-[16/9] object-cover"
                        />
                      </div>
                    )}

                    {/* Facebook Post Mockup */}
                    {selectedPost.platform === 'Facebook Post' && (
                      <div className="w-[500px] bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-4 flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">YB</span>
                          </div>
                          <div>
                            <p className="font-semibold">Your Business</p>
                            <p className="text-sm text-gray-500">Sponsored</p>
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <p className="text-sm mb-3">{selectedPost.caption}</p>
                        </div>
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full aspect-[1200/628] object-cover"
                        />
                      </div>
                    )}

                    {/* Default mockup for remaining platforms */}
                    {!['Instagram Story', 'Instagram Post', 'LinkedIn Post', 'Email Banner', 'TikTok Cover', 'Twitter/X Post', 'Facebook Post'].includes(selectedPost.platform) && (
                      <div className="max-w-md bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                        <img 
                          src={selectedPost.imageUrl} 
                          alt={selectedPost.platform}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-4">
                          <p className="text-sm text-gray-700">{selectedPost.caption}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Caption */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Caption:</h4>
                  <p className="text-gray-700">{selectedPost.caption}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}