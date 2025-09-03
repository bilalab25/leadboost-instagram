import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Instagram, Facebook, Linkedin, Twitter, Mail, Hash, ArrowRight, Play, Volume2, X, Target, Heart, Video, Camera, Palette, Globe, Zap, Briefcase, MessageCircle, FileText, Users, TrendingUp, Star } from 'lucide-react';
import { SiTiktok } from 'react-icons/si';

interface DemoState {
  businessDescription: string;
  isGenerating: boolean;
  showResults: boolean;
  uploadedImages: File[];
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
const generatePlatformPosts = (businessDescription: string, brandStyles: string = 'professional'): PlatformPost[] => {
  const styleArray = brandStyles.split(',').filter(s => s.trim());
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
    caption: generatePlatformCaption(campaignIdea, businessType, platform.tone, businessDescription, styleArray.join(',')),
    dimensions: platform.dimensions,
    aspectRatio: platform.aspectRatio,
    imageUrl: getSmartVisual(businessDescription, businessType, platform.aspectRatio, platform.platform),
    icon: platform.icon,
    brandStyle: styleArray.join(',')
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
  if (desc.includes('botox') || desc.includes('dermal') || desc.includes('filler') || desc.includes('aesthetic') || desc.includes('cosmetic') || (desc.includes('clinic') && (desc.includes('beauty') || desc.includes('skin') || desc.includes('face') || desc.includes('med spa')))) {
    // Luxury beauty spa/aesthetic clinic - clean, relaxing environment with beauty treatments focus
    return `https://images.unsplash.com/photo-1562887284-5c6e2e3bb1e4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // BEAUTY SALONS
  if (desc.includes('beauty salon') || desc.includes('hair salon') || desc.includes('salon')) {
    // Modern beauty salon interior with styling chairs
    return `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // NAIL SALONS
  if (desc.includes('nail salon') || desc.includes('nails') || desc.includes('manicure') || desc.includes('pedicure')) {
    // Nail salon with manicure station and nail art
    return `https://images.unsplash.com/photo-1604654894610-df63bc536371?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // SPA & WELLNESS - Facial Treatments & Skincare
  if (desc.includes('spa') || desc.includes('facial') || desc.includes('skincare')) {
    // Luxury spa treatment with smooth skin focus
    return `https://images.unsplash.com/photo-1562887284-5c6e2e3bb1e4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // MEDICAL & HEALTHCARE
  if (desc.includes('dental') || desc.includes('dentist') || desc.includes('teeth') || desc.includes('orthodontic')) {
    // Modern dental office
    return `https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('doctor') || desc.includes('medical') || desc.includes('hospital') || desc.includes('health') || desc.includes('clinic') || desc.includes('physician')) {
    // Professional medical office
    return `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  if (desc.includes('therapy') || desc.includes('therapist') || desc.includes('counseling') || desc.includes('psychology')) {
    // Calming therapy office
    return `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // COFFEE SHOPS & CAFES
  if (desc.includes('coffee shop') || desc.includes('coffee') || desc.includes('cafe') || desc.includes('coffeehouse') || desc.includes('espresso') || desc.includes('barista')) {
    // Cozy coffee shop with barista, espresso machine, and coffee atmosphere
    return `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // BARS & NIGHTLIFE
  if (desc.includes('bar') || desc.includes('pub') || desc.includes('cocktail') || desc.includes('nightclub') || desc.includes('lounge')) {
    // Modern bar with cocktails and bartender
    return `https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FOOD TRUCKS
  if (desc.includes('food truck') || desc.includes('food cart') || desc.includes('mobile food')) {
    // Colorful food truck serving customers
    return `https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FOOD & RESTAURANTS
  if (desc.includes('restaurant') || desc.includes('bistro') || desc.includes('dining')) {
    if (desc.includes('italian') || desc.includes('pasta')) {
      return `https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
    }
    // Elegant restaurant interior
    return `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // PANADERÍA Y REPOSTERÍA - Bakery & Pastry
  if (desc.includes('bakery') || desc.includes('bread') || desc.includes('pastry') || desc.includes('panadería') || desc.includes('pastelería') || desc.includes('repostería') || desc.includes('pasteles') || desc.includes('postres') || desc.includes('cakes') || desc.includes('cupcakes')) {
    // Artisan bakery with beautiful pastries and cakes
    return `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FITNESS & WELLNESS
  if (desc.includes('gym') || desc.includes('fitness') || desc.includes('personal training')) {
    // Modern gym equipment
    return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // YOGA STUDIOS
  if (desc.includes('yoga') || desc.includes('yoga studio') || desc.includes('meditation') || desc.includes('mindfulness')) {
    // Peaceful yoga studio with mats and natural lighting
    return `https://images.unsplash.com/photo-1518611012118-696072aa579a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // PILATES STUDIOS
  if (desc.includes('pilates') || desc.includes('pilates studio')) {
    // Pilates studio with reformer equipment
    return `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
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
  
  // JOYERÍA - Jewelry Store
  if (desc.includes('jewelry') || desc.includes('jewellery') || desc.includes('joyería') || desc.includes('joyas') || desc.includes('anillos') || desc.includes('rings') || desc.includes('collares') || desc.includes('necklaces') || desc.includes('diamantes') || desc.includes('diamonds')) {
    // Elegant jewelry display with diamonds and luxury pieces
    return `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // CLOTHING BOUTIQUES
  if (desc.includes('boutique') || desc.includes('clothing') || desc.includes('fashion') || desc.includes('clothing boutique')) {
    // Stylish clothing boutique with racks and displays
    return `https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // GIFT SHOPS
  if (desc.includes('gift shop') || desc.includes('gift store') || desc.includes('souvenirs')) {
    // Charming gift shop with various products
    return `https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // TOY STORES
  if (desc.includes('toy store') || desc.includes('toys') || desc.includes('children') || desc.includes('kids store')) {
    // Colorful toy store with shelves of toys
    return `https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // ELECTRONICS STORES
  if (desc.includes('electronics') || desc.includes('electronics store') || desc.includes('tech store') || desc.includes('gadgets')) {
    // Modern electronics store with displays
    return `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FURNITURE STORES
  if (desc.includes('furniture') || desc.includes('furniture store') || desc.includes('home decor')) {
    // Modern furniture showroom
    return `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FLORISTERÍA - Flower Shop
  if (desc.includes('flowers') || desc.includes('florist') || desc.includes('floristería') || desc.includes('flores') || desc.includes('arreglos') || desc.includes('bouquet') || desc.includes('wedding flowers')) {
    // Beautiful flower arrangements and bouquets
    return `https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // BARBERÍA - Barber Shop
  if (desc.includes('barber') || desc.includes('barbershop') || desc.includes('barbería') || desc.includes('peluquería') || desc.includes('hair salon') || desc.includes('cortes')) {
    // Modern barber shop interior
    return `https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // LIBRERÍA - Bookstore
  if (desc.includes('bookstore') || desc.includes('library') || desc.includes('librería') || desc.includes('libros') || desc.includes('books')) {
    // Cozy bookstore with shelves full of books
    return `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // AUTOMÓVILES - Car Dealership/Garage
  if (desc.includes('car') || desc.includes('auto') || desc.includes('automotive') || desc.includes('coche') || desc.includes('automóvil') || desc.includes('garage') || desc.includes('mechanic')) {
    // Professional automotive service or showroom
    return `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // PET SHOPS
  if (desc.includes('pet shop') || desc.includes('pet store') || desc.includes('pets') || desc.includes('mascotas')) {
    // Pet store with animals and supplies
    return `https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // VETERINARY CLINICS
  if (desc.includes('vet') || desc.includes('veterinary') || desc.includes('veterinary clinic') || desc.includes('animal hospital')) {
    // Professional veterinary clinic with doctor and pet
    return `https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // AUTO REPAIR SHOPS
  if (desc.includes('auto repair') || desc.includes('car repair') || desc.includes('mechanic') || desc.includes('automotive repair')) {
    // Professional auto repair shop with mechanic working
    return `https://images.unsplash.com/photo-1632823469850-fcd3b277ec6e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // FINANCIAL SERVICES
  if (desc.includes('finance') || desc.includes('financial') || desc.includes('bank') || desc.includes('investment') || desc.includes('accounting')) {
    return `https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // REAL ESTATE
  if (desc.includes('real estate') || desc.includes('realtor') || desc.includes('property') || desc.includes('homes')) {
    return `https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // DESIGN STUDIOS
  if (desc.includes('interior design') || desc.includes('design studio') || desc.includes('interior designer')) {
    // Modern interior design studio with samples and plans
    return `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // ARCHITECTURE FIRMS
  if (desc.includes('architecture') || desc.includes('architect') || desc.includes('architecture firm')) {
    // Architect working on building plans
    return `https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // CLEANING SERVICES
  if (desc.includes('cleaning') || desc.includes('cleaning service') || desc.includes('housekeeping')) {
    // Professional cleaning service in action
    return `https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // LANDSCAPING
  if (desc.includes('landscaping') || desc.includes('gardening') || desc.includes('lawn care')) {
    // Beautiful landscaped garden
    return `https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // MARKETING AGENCIES
  if (desc.includes('marketing') || desc.includes('marketing agency') || desc.includes('advertising')) {
    // Creative marketing team at work
    return `https://images.unsplash.com/photo-1552664730-d307ca884978?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // TATTOO STUDIOS
  if (desc.includes('tattoo') || desc.includes('tattoo studio') || desc.includes('tattoo parlor')) {
    // Professional tattoo artist at work
    return `https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // CONSULTING FIRMS
  if (desc.includes('consulting') || desc.includes('consultant') || desc.includes('consulting firm')) {
    // Professional business consulting meeting
    return `https://images.unsplash.com/photo-1552664730-d307ca884978?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // TRAVEL AGENCIES
  if (desc.includes('travel') || desc.includes('travel agency') || desc.includes('tourism')) {
    // Travel agency with maps and destinations
    return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // TUTORING & EDUCATION CENTERS
  if (desc.includes('tutoring') || desc.includes('education center') || desc.includes('learning center')) {
    // Tutoring session with teacher and student
    return `https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // TECH STARTUPS & SOFTWARE
  if (desc.includes('tech startup') || desc.includes('software') || desc.includes('tech') || desc.includes('app') || desc.includes('digital') || desc.includes('web')) {
    // Modern tech office with developers
    return `https://images.unsplash.com/photo-1551434678-e076c223a692?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
  }
  
  // DEFAULT PROFESSIONAL
  return `https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`;
};

  return getBusinessContextualImage();
};

// Generate highly specific images for Instagram feed posts based on exact business description
const getIndustryVariedImage = (businessDescription: string, businessType: string, postIndex: number): string => {
  const desc = businessDescription.toLowerCase();
  const dimensions = { width: 400, height: 400 }; // Square format for Instagram
  
  // PRIORITY 1: EXACT FULL PHRASE MATCHING - Match complete business types first
  
  // Botox Clinic / Medical Aesthetics (FULL PHRASE MATCH)
  if (desc.includes('botox clinic') || desc.includes('aesthetic clinic') || desc.includes('cosmetic clinic') || desc.includes('med spa') || desc.includes('medical spa')) {
    console.log('🎯 EXACT BOTOX CLINIC PHRASE MATCH!', desc);
    const botoxClinicImages = [
      `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Clean medical spa interior
      `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional skincare consultation
      `https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Skincare products and serums
      `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional beauty salon
      `https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Medical aesthetic treatment
      `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Professional facial treatment
    ];
    return botoxClinicImages[postIndex % botoxClinicImages.length];
  }
  
  // Wedding Photography (FULL PHRASE MATCH)
  if (desc.includes('wedding photographer') || desc.includes('wedding photography')) {
    console.log('🎯 EXACT WEDDING PHOTOGRAPHY PHRASE MATCH!', desc);
    const weddingPhotographyImages = [
      `https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding couple
      `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding rings
      `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding dress
      `https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding venue
      `https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional camera
      `https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Wedding bouquet
    ];
    return weddingPhotographyImages[postIndex % weddingPhotographyImages.length];
  }
  
  // Coffee Shop (FULL PHRASE MATCH)
  if (desc.includes('coffee shop') || desc.includes('coffee cafe')) {
    console.log('🎯 EXACT COFFEE SHOP PHRASE MATCH!', desc);
    const coffeeShopImages = [
      `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee shop interior
      `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee cup with latte art
      `https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Espresso machine
      `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Barista at work
      `https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee beans
      `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Coffee and pastries
    ];
    return coffeeShopImages[postIndex % coffeeShopImages.length];
  }
  
  // Italian Restaurant (FULL PHRASE MATCH)
  if (desc.includes('italian restaurant') || desc.includes('italian pizzeria') || desc.includes('italian cuisine')) {
    console.log('🎯 EXACT ITALIAN RESTAURANT PHRASE MATCH!', desc);
    const italianRestaurantImages = [
      `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Authentic pizza
      `https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fresh pasta
      `https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Italian ingredients
      `https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Traditional Italian restaurant
      `https://images.unsplash.com/photo-1551218808-94e220e084d2?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wine and food pairing
      `https://images.unsplash.com/photo-1563379091339-03246963d51a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Chef making pasta
    ];
    return italianRestaurantImages[postIndex % italianRestaurantImages.length];
  }
  
  // Personal Trainer (FULL PHRASE MATCH)
  if (desc.includes('personal trainer') || desc.includes('fitness trainer') || desc.includes('fitness coach')) {
    console.log('🎯 EXACT PERSONAL TRAINER PHRASE MATCH!', desc);
    const personalTrainerImages = [
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Training session
      `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Personal training
      `https://images.unsplash.com/photo-1583500178690-f7fd39fae5b5?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Weight training
      `https://images.unsplash.com/photo-1549476464-37392f717541?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fitness transformation
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Gym atmosphere
      `https://images.unsplash.com/photo-1506629905607-84d5bbfc4ed8?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Group training
    ];
    return personalTrainerImages[postIndex % personalTrainerImages.length];
  }
  
  // Artisan Bakery (FULL PHRASE MATCH)
  if (desc.includes('artisan bakery') || desc.includes('sourdough bakery') || desc.includes('local bakery')) {
    console.log('🎯 EXACT ARTISAN BAKERY PHRASE MATCH!', desc);
    const artisanBakeryImages = [
      `https://images.unsplash.com/photo-1509440159596-0249088772ff?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Sourdough loaves
      `https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fresh sourdough cut
      `https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Artisan baker
      `https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding cake display
      `https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Bakery storefront
      `https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Fresh bread display
    ];
    return artisanBakeryImages[postIndex % artisanBakeryImages.length];
  }
  
  // PRIORITY 2: INDIVIDUAL KEYWORD MATCHING (fallback only if no phrase match)
  
  // Individual Botox/Aesthetic keywords (only if no exact phrase match above)
  if (desc.includes('botox') || desc.includes('dermal') || desc.includes('filler') || desc.includes('dermatology') || desc.includes('cosmetic') || desc.includes('injection')) {
    console.log('🔸 INDIVIDUAL BOTOX KEYWORD MATCH (fallback):', desc);
    const medAestheticsImages = [
      `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Clean medical spa interior
      `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional skincare consultation
      `https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Skincare products and serums
      `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional beauty salon
      `https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Medical aesthetic treatment
      `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Professional facial treatment
    ];
    return medAestheticsImages[postIndex % medAestheticsImages.length];
  }
  
  // Photography (Wedding/Portrait specialists)
  if (desc.includes('photographer') || desc.includes('photography')) {
    if (desc.includes('wedding')) {
      const weddingPhotographyImages = [
        `https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding couple
        `https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding rings
        `https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding dress
        `https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding venue
        `https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional camera
        `https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Wedding bouquet
      ];
      return weddingPhotographyImages[postIndex % weddingPhotographyImages.length];
    }
    const photographyImages = [
      `https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional camera
      `https://images.unsplash.com/photo-1554048612-b6a482b224fc?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Portrait session
      `https://images.unsplash.com/photo-1521791136064-7986c2920216?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Professional headshot
      `https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Photography studio
      `https://images.unsplash.com/photo-1503751071777-d2918b21bbd9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Camera equipment
      `https://images.unsplash.com/photo-1552168324-d612d77725e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Professional photographer
    ];
    return photographyImages[postIndex % photographyImages.length];
  }
  
  // Italian Restaurant specific
  if (desc.includes('italian') && (desc.includes('restaurant') || desc.includes('pasta') || desc.includes('pizza'))) {
    const italianRestaurantImages = [
      `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Authentic pizza
      `https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fresh pasta
      `https://images.unsplash.com/photo-1498579397066-22750a3cb424?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Italian ingredients
      `https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Traditional Italian restaurant
      `https://images.unsplash.com/photo-1551218808-94e220e084d2?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wine and food pairing
      `https://images.unsplash.com/photo-1563379091339-03246963d51a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Chef making pasta
    ];
    return italianRestaurantImages[postIndex % italianRestaurantImages.length];
  }
  
  // Personal Trainer / Fitness Coach
  if (desc.includes('personal trainer') || desc.includes('fitness coach') || desc.includes('trainer')) {
    const personalTrainerImages = [
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Training session
      `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Personal training
      `https://images.unsplash.com/photo-1583500178690-f7fd39fae5b5?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Weight training
      `https://images.unsplash.com/photo-1549476464-37392f717541?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fitness transformation
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Gym atmosphere
      `https://images.unsplash.com/photo-1506629905607-84d5bbfc4ed8?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Group training
    ];
    return personalTrainerImages[postIndex % personalTrainerImages.length];
  }
  
  // BROADER CATEGORY MATCHING (fallback)
  
  // Coffee Shop - 6 different coffee-related images
  if (desc.includes('coffee shop') || desc.includes('coffee') || desc.includes('cafe')) {
    const coffeeImages = [
      `https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee shop interior
      `https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee cup with latte art
      `https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Espresso machine
      `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Barista at work
      `https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Coffee beans
      `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Coffee and pastries
    ];
    return coffeeImages[postIndex % coffeeImages.length];
  }
  
  // General Bakery/Pastry
  if (desc.includes('bakery') || desc.includes('pastry') || desc.includes('pastelería') || desc.includes('pasteles')) {
    const bakeryImages = [
      `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Beautiful pastries
      `https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Fresh bread
      `https://images.unsplash.com/photo-1587668178277-295251f900ce?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Cupcakes
      `https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Wedding cake
      `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Croissants
      `https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Bakery display
    ];
    return bakeryImages[postIndex % bakeryImages.length];
  }
  
  // Jewelry Store
  if (desc.includes('jewelry') || desc.includes('joyería') || desc.includes('joyas')) {
    const jewelryImages = [
      `https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Jewelry display
      `https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Diamond rings
      `https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Gold necklaces
      `https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Luxury watch
      `https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Earrings
      `https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Bracelets
    ];
    return jewelryImages[postIndex % jewelryImages.length];
  }
  
  // General Beauty/Salon
  if (desc.includes('beauty') || desc.includes('salon') || desc.includes('aesthetic')) {
    const beautyImages = [
      `https://images.unsplash.com/photo-1560066984-138dadb4c035?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Beauty salon
      `https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Medical clinic
      `https://images.unsplash.com/photo-1562887284-5c6e2e3bb1e4?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Spa treatment
      `https://images.unsplash.com/photo-1604654894610-df63bc536371?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Nail care
      `https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Skincare products
      `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Beauty treatment
    ];
    return beautyImages[postIndex % beautyImages.length];
  }
  
  // General Gym/Fitness
  if (desc.includes('gym') || desc.includes('fitness') || desc.includes('workout')) {
    const fitnessImages = [
      `https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Gym equipment
      `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Person working out
      `https://images.unsplash.com/photo-1583500178690-f7fd39fae5b5?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Dumbbells
      `https://images.unsplash.com/photo-1518611012118-696072aa579a?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Yoga class
      `https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Treadmill
      `https://images.unsplash.com/photo-1506629905607-84d5bbfc4ed8?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Group fitness
    ];
    return fitnessImages[postIndex % fitnessImages.length];
  }
  
  // General Restaurant
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('dining')) {
    const restaurantImages = [
      `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Restaurant interior
      `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Gourmet dish
      `https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Italian pasta
      `https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Pizza
      `https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`, // Chef cooking
      `https://images.unsplash.com/photo-1551218808-94e220e084d2?w=${dimensions.width}&h=${dimensions.height}&fit=crop&crop=smart&auto=format,compress&q=80`  // Wine and dining
    ];
    return restaurantImages[postIndex % restaurantImages.length];
  }
  
  // Default: Use the main image function with slight variation
  console.log('⚠️ NO SPECIFIC MATCH FOUND, using fallback for:', desc);
  return getSmartVisual(businessDescription, businessType, 'square', 'Instagram Post');
};

// Generate relevant overlay text for each post
const getPostOverlayText = (businessDescription: string, businessType: string, postIndex: number, generatedCampaign: string, isSpanish: boolean): string | null => {
  const desc = businessDescription.toLowerCase();
  
  // Show text on posts 0, 1, 3, 4, 5 (5 out of 6 posts)
  const showTextOnPost = [0, 1, 3, 4, 5].includes(postIndex);
  if (!showTextOnPost) return null;
  
  if (desc.includes('coffee shop') || desc.includes('coffee') || desc.includes('cafe')) {
    const coffeeTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Café Fresco Diario' : 'Fresh Daily Coffee',
      isSpanish ? 'Oferta Especial' : 'Special Offer',
      isSpanish ? 'Arte en Latte' : 'Latte Art',
      isSpanish ? 'Granos Premium' : 'Premium Beans'
    ];
    return coffeeTexts[postIndex] || coffeeTexts[0];
  }
  
  if (desc.includes('bakery') || desc.includes('pastry') || desc.includes('pastelería')) {
    const bakeryTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Recién Horneado' : 'Freshly Baked',
      isSpanish ? 'Pasteles Únicos' : 'Unique Cakes',
      isSpanish ? 'Dulces Artesanales' : 'Artisan Sweets',
      isSpanish ? 'Orden Personalizada' : 'Custom Orders'
    ];
    return bakeryTexts[postIndex] || bakeryTexts[0];
  }
  
  if (desc.includes('jewelry') || desc.includes('joyería')) {
    const jewelryTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Diamantes Únicos' : 'Unique Diamonds',
      isSpanish ? 'Joyería Exclusiva' : 'Exclusive Jewelry',
      isSpanish ? 'Diseño Personalizado' : 'Custom Design',
      isSpanish ? 'Lujo Auténtico' : 'Authentic Luxury'
    ];
    return jewelryTexts[postIndex] || jewelryTexts[0];
  }
  
  if (desc.includes('beauty') || desc.includes('salon') || desc.includes('botox')) {
    const beautyTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Belleza Natural' : 'Natural Beauty',
      isSpanish ? 'Tratamiento Premium' : 'Premium Treatment',
      isSpanish ? 'Resultados Visibles' : 'Visible Results',
      isSpanish ? 'Cuidado Profesional' : 'Professional Care'
    ];
    return beautyTexts[postIndex] || beautyTexts[0];
  }
  
  if (desc.includes('gym') || desc.includes('fitness')) {
    const fitnessTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Entrena Fuerte' : 'Train Hard',
      isSpanish ? 'Nuevo Miembro' : 'New Member',
      isSpanish ? 'Rutina Personalizada' : 'Custom Routine',
      isSpanish ? 'Resultados Reales' : 'Real Results'
    ];
    return fitnessTexts[postIndex] || fitnessTexts[0];
  }
  
  if (desc.includes('restaurant') || desc.includes('food')) {
    const restaurantTexts = [
      generatedCampaign.split(' ').slice(0, 3).join(' '),
      isSpanish ? 'Plato del Día' : 'Dish of the Day',
      isSpanish ? 'Sabores Únicos' : 'Unique Flavors',
      isSpanish ? 'Chef Especial' : 'Chef Special',
      isSpanish ? 'Mesa Reservada' : 'Table Reserved'
    ];
    return restaurantTexts[postIndex] || restaurantTexts[0];
  }
  
  // Default business text overlays
  const defaultTexts = [
    generatedCampaign.split(' ').slice(0, 3).join(' '),
    isSpanish ? 'Oferta Especial' : 'Special Offer',
    isSpanish ? 'Nuevo Producto' : 'New Product',
    isSpanish ? 'Calidad Premium' : 'Premium Quality',
    isSpanish ? 'Servicio Profesional' : 'Professional Service'
  ];
  return defaultTexts[postIndex] || defaultTexts[0];
};

// Generate TikTok-specific overlay text
const getTikTokOverlayText = (businessDescription: string, businessType: string, postIndex: number, generatedCampaign: string, isSpanish: boolean): string | null => {
  const desc = businessDescription.toLowerCase();
  
  // Show text on posts 0, 2, 4 (3 out of 6 posts - less text for TikTok)
  const showTextOnPost = [0, 2, 4].includes(postIndex);
  if (!showTextOnPost) return null;
  
  if (desc.includes('coffee shop') || desc.includes('coffee') || desc.includes('cafe')) {
    const tikTokTexts = [
      isSpanish ? '#CaféFresco #Barista' : '#FreshCoffee #Barista',
      isSpanish ? '#LaVidaDelCafé #CafeLocal' : '#CoffeeLife #LocalCafe',
      isSpanish ? '#CafeArtesanal #Espresso' : '#ArtisanCoffee #Espresso'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  if (desc.includes('bakery') || desc.includes('pastry') || desc.includes('pastelería')) {
    const tikTokTexts = [
      isSpanish ? '#PanFresco #Panadería' : '#FreshBread #Bakery',
      isSpanish ? '#PastelesUnicos #Dulces' : '#UniqueCakes #Sweets',
      isSpanish ? '#HechoConAmor #Artesanal' : '#MadeWithLove #Artisan'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  if (desc.includes('jewelry') || desc.includes('joyería')) {
    const tikTokTexts = [
      isSpanish ? '#JoyasUnicas #Diamantes' : '#UniqueJewelry #Diamonds',
      isSpanish ? '#LujoAccesible #Elegancia' : '#AffordableLuxury #Elegance',
      isSpanish ? '#DiseñoPersonalizado #Exclusivo' : '#CustomDesign #Exclusive'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  if (desc.includes('beauty') || desc.includes('salon') || desc.includes('botox')) {
    const tikTokTexts = [
      isSpanish ? '#BellezaNatural #Transformación' : '#NaturalBeauty #Transformation',
      isSpanish ? '#CuidadoProfesional #Spa' : '#ProfessionalCare #Spa',
      isSpanish ? '#ResultadosReales #Belleza' : '#RealResults #Beauty'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  if (desc.includes('gym') || desc.includes('fitness')) {
    const tikTokTexts = [
      isSpanish ? '#FitnessMotivation #Gym' : '#FitnessMotivation #Gym',
      isSpanish ? '#TransformaciónFísica #Fitness' : '#Transformation #Fitness',
      isSpanish ? '#EntrenamientoPersonal #Salud' : '#PersonalTraining #Health'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  if (desc.includes('restaurant') || desc.includes('food')) {
    const tikTokTexts = [
      isSpanish ? '#ComidaDeliciosa #RestauranteLocal' : '#DeliciousFood #LocalRestaurant',
      isSpanish ? '#ChefEspecial #SaboresUnicos' : '#ChefSpecial #UniqueFlavors',
      isSpanish ? '#ExperienciaGastronomica #Foodie' : '#DiningExperience #Foodie'
    ];
    return tikTokTexts[Math.floor(postIndex / 2)] || tikTokTexts[0];
  }
  
  // Default TikTok hashtags
  const defaultTexts = [
    isSpanish ? '#NegocioLocal #Calidad' : '#LocalBusiness #Quality',
    isSpanish ? '#ServicioProfesional #Excelencia' : '#ProfessionalService #Excellence',
    isSpanish ? '#ExperienciaUnica #Premium' : '#UniqueExperience #Premium'
  ];
  return defaultTexts[Math.floor(postIndex / 2)] || defaultTexts[0];
};

// Detect business type from description
const detectBusinessType = (description: string): string => {
  const desc = description.toLowerCase();
  
  // FOOD & RESTAURANTS
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('cafe') || desc.includes('coffee shop') || desc.includes('coffee') || desc.includes('pizza') || desc.includes('dining') || desc.includes('bakery') || desc.includes('pastry') || desc.includes('panadería') || desc.includes('pastelería') || desc.includes('bar') || desc.includes('food truck')) {
    return 'restaurant';
  }
  
  // FITNESS & WELLNESS
  if (desc.includes('gym') || desc.includes('fitness') || desc.includes('workout') || desc.includes('yoga') || desc.includes('training') || desc.includes('pilates')) {
    return 'fitness';
  }
  
  // BEAUTY & MEDICAL AESTHETICS
  if (desc.includes('beauty') || desc.includes('spa') || desc.includes('salon') || desc.includes('skincare') || desc.includes('cosmetic') || desc.includes('botox') || desc.includes('aesthetic') || desc.includes('dermal') || desc.includes('med spa') || desc.includes('nail salon') || desc.includes('hair salon') || (desc.includes('clinic') && (desc.includes('beauty') || desc.includes('skin') || desc.includes('face') || desc.includes('botox') || desc.includes('aesthetic')))) {
    return 'beauty';
  }
  
  // JEWELRY
  if (desc.includes('jewelry') || desc.includes('jewellery') || desc.includes('joyería') || desc.includes('joyas') || desc.includes('anillos') || desc.includes('rings') || desc.includes('diamonds')) {
    return 'jewelry';
  }
  
  // AUTOMOTIVE
  if (desc.includes('car') || desc.includes('auto') || desc.includes('automotive') || desc.includes('coche') || desc.includes('garage') || desc.includes('mechanic') || desc.includes('auto repair')) {
    return 'automotive';
  }
  
  // PETS & VETERINARY
  if (desc.includes('pet') || desc.includes('vet') || desc.includes('veterinary') || desc.includes('mascotas') || desc.includes('perros') || desc.includes('dogs') || desc.includes('pet shop')) {
    return 'pets';
  }
  
  // EDUCATION
  if (desc.includes('teacher') || desc.includes('education') || desc.includes('tutor') || desc.includes('school') || desc.includes('professor') || desc.includes('tutoring') || desc.includes('learning center')) {
    return 'education';
  }
  
  // PROFESSIONAL SERVICES
  if (desc.includes('law') || desc.includes('lawyer') || desc.includes('attorney') || desc.includes('accounting') || desc.includes('consulting') || desc.includes('marketing') || desc.includes('travel agency') || desc.includes('real estate') || desc.includes('finance')) {
    return 'professional';
  }
  
  // CREATIVE SERVICES
  if (desc.includes('photography') || desc.includes('design') || desc.includes('tattoo') || desc.includes('interior design') || desc.includes('architecture')) {
    return 'creative';
  }
  
  // RETAIL & SHOPPING
  if (desc.includes('retail') || desc.includes('store') || desc.includes('shop') || desc.includes('boutique') || desc.includes('clothing') || desc.includes('flowers') || desc.includes('florist') || desc.includes('bookstore') || desc.includes('books') || desc.includes('gift shop') || desc.includes('toy store') || desc.includes('electronics') || desc.includes('furniture')) {
    return 'retail';
  }
  
  // SERVICES
  if (desc.includes('cleaning') || desc.includes('landscaping') || desc.includes('tech startup')) {
    return 'services';
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
        return 'from-pink-500 via-purple-500 to-orange-400'; // Instagram gradient
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
    showResults: false,
    uploadedImages: []
  });

  const [platformPosts, setPlatformPosts] = useState<PlatformPost[]>([]);
  const [generatedCampaign, setGeneratedCampaign] = useState<string>('');
  const [selectedBrandStyles, setSelectedBrandStyles] = useState<string[]>(['professional']);
  const [selectedPost, setSelectedPost] = useState<PlatformPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateCampaign = async () => {
    if (!demo.businessDescription.trim()) return;
    
    setDemo(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate campaign generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const posts = generatePlatformPosts(demo.businessDescription, selectedBrandStyles.join(','));
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
      showResults: false,
      uploadedImages: []
    });
    setPlatformPosts([]);
    setGeneratedCampaign('');
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setDemo(prev => ({ ...prev, uploadedImages: [...prev.uploadedImages, ...files] }));
  };

  const removeUploadedImage = (index: number) => {
    setDemo(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
  };

  const handleCardClick = (post: PlatformPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  if (!demo.showResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white rounded-3xl shadow-lg border border-gray-200 relative overflow-hidden">
          {/* Subtle background elements like the main site */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-100/30 via-brand-50/40 to-brand-200/20" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-300/20 to-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-brand-400/15 to-brand-600/10 rounded-full blur-2xl"></div>
          
          <CardContent className="p-8 lg:p-12 space-y-8 relative z-10">
            <div className="text-center mb-8">
              <div className="text-6xl mb-6 bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">🚀</div>
              <h3 className="text-4xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-4 leading-tight tracking-tight">
                {isSpanish ? '¡Haz Tu Propio Demo!' : 'Do Your Own Demo!'}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-md mx-auto">
                {isSpanish 
                  ? 'Demo Rápido - Hagamos tu campaña en segundos'
                  : 'Free Demo - Lets make your campaign in seconds'
                }
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isSpanish ? '🏢 Selecciona tu Industria' : '🏢 Select Your Industry'}
              </label>
              <select
                value={demo.businessDescription}
                onChange={(e) => setDemo(prev => ({ ...prev, businessDescription: e.target.value }))}
                className="w-full p-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                data-testid="select-industry"
              >
                <option value="">{isSpanish ? 'Selecciona una industria...' : 'Select an industry...'}</option>
                <option value="Restaurant & Food Service">{isSpanish ? 'Restaurante y Comida' : 'Restaurant & Food Service'}</option>
                <option value="Beauty & Wellness">{isSpanish ? 'Belleza y Bienestar' : 'Beauty & Wellness'}</option>
                <option value="Fitness & Health">{isSpanish ? 'Fitness y Salud' : 'Fitness & Health'}</option>
                <option value="Retail & Fashion">{isSpanish ? 'Venta y Moda' : 'Retail & Fashion'}</option>
                <option value="Professional Services">{isSpanish ? 'Servicios Profesionales' : 'Professional Services'}</option>
                <option value="Real Estate">{isSpanish ? 'Bienes Raíces' : 'Real Estate'}</option>
                <option value="Technology & Software">{isSpanish ? 'Tecnología y Software' : 'Technology & Software'}</option>
                <option value="Education & Training">{isSpanish ? 'Educación y Entrenamiento' : 'Education & Training'}</option>
                <option value="Healthcare & Medical">{isSpanish ? 'Salud y Médico' : 'Healthcare & Medical'}</option>
                <option value="Automotive">{isSpanish ? 'Automotriz' : 'Automotive'}</option>
                <option value="Home Services">{isSpanish ? 'Servicios para el Hogar' : 'Home Services'}</option>
                <option value="Entertainment & Events">{isSpanish ? 'Entretenimiento y Eventos' : 'Entertainment & Events'}</option>
                <option value="Travel & Tourism">{isSpanish ? 'Viajes y Turismo' : 'Travel & Tourism'}</option>
                <option value="Non-Profit & Community">{isSpanish ? 'Sin Fines de Lucro y Comunidad' : 'Non-Profit & Community'}</option>
                <option value="Financial Services">{isSpanish ? 'Servicios Financieros' : 'Financial Services'}</option>
                <option value="E-commerce & Online Business">{isSpanish ? 'E-commerce y Negocios Online' : 'E-commerce & Online Business'}</option>
                <option value="Manufacturing & Industrial">{isSpanish ? 'Manufactura e Industrial' : 'Manufacturing & Industrial'}</option>
                <option value="Agriculture & Farming">{isSpanish ? 'Agricultura y Ganadería' : 'Agriculture & Farming'}</option>
                <option value="Arts & Creative Services">{isSpanish ? 'Artes y Servicios Creativos' : 'Arts & Creative Services'}</option>
                <option value="Other">{isSpanish ? 'Otro' : 'Other'}</option>
              </select>
              
              {/* Optional Photo Upload */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {isSpanish ? '📸 Fotos de tu negocio (opcional)' : '📸 Your Business Photos (Optional)'}
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  {isSpanish 
                    ? '¿Tienes fotos de tus productos o servicios? ¡Súbelas! Si no, no te preocupes: generaremos imágenes perfectas para ti.'
                    : 'Have photos of your products or services? Upload them! If not, no worries: we\'ll generate perfect images for you.'
                  }
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photo-upload"
                  data-testid="input-photo-upload"
                />
                
                <label 
                  htmlFor="photo-upload" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  📎 {isSpanish ? 'Seleccionar fotos' : 'Choose photos'}
                </label>
                
                {/* Display uploaded images */}
                {demo.uploadedImages.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      {isSpanish ? `${demo.uploadedImages.length} foto(s) subida(s):` : `${demo.uploadedImages.length} photo(s) uploaded:`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {demo.uploadedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-600 border">
                            📷
                            <br />
                            {file.name.split('.')[0].substring(0, 6)}...
                          </div>
                          <button
                            onClick={() => removeUploadedImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-image-${index}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                    displayText: isSpanish ? 'EJECUTIVO' : 'EXECUTIVE',
                    textStyle: 'font-light text-slate-800 text-lg tracking-[0.15em] uppercase border-b border-slate-300 pb-1'
                  },
                  {
                    id: 'creative',
                    name: isSpanish ? 'Creativo' : 'Creative',
                    desc: isSpanish ? 'Artístico y vibrante' : 'Artistic & vibrant',
                    displayText: isSpanish ? 'Creativo' : 'Creative',
                    textStyle: 'font-bold text-transparent bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-2xl italic transform -rotate-2'
                  },
                  {
                    id: 'playful',
                    name: isSpanish ? 'Divertido' : 'Playful',
                    desc: isSpanish ? 'Alegre y accesible' : 'Fun & approachable',
                    displayText: isSpanish ? 'Divertido!' : 'Playful!',
                    textStyle: 'font-black text-transparent bg-gradient-to-r from-lime-500 to-orange-400 bg-clip-text text-xl transform rotate-1 animate-bounce'
                  },
                  {
                    id: 'luxury',
                    name: isSpanish ? 'Lujo' : 'Luxury',
                    desc: isSpanish ? 'Exclusivo y premium' : 'Exclusive & premium',
                    displayText: isSpanish ? 'LUJO' : 'LUXURY',
                    textStyle: 'font-extralight text-purple-900 text-xl tracking-[0.2em] uppercase'
                  }
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      setSelectedBrandStyles(prev => 
                        prev.includes(style.id)
                          ? prev.filter(s => s !== style.id)
                          : [...prev, style.id]
                      );
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedBrandStyles.includes(style.id)
                        ? 'border-brand-500 bg-brand-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    data-testid={`brand-style-${style.id}`}
                  >
                    <div className="text-center py-4">
                      <div className="mb-3">
                        <span className={style.textStyle}>
                          {style.displayText}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {style.desc}
                      </p>
                    </div>
                    {selectedBrandStyles.includes(style.id) && (
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
                  ? 'Puedes elegir uno o más estilos. Estos influirán en los colores, tipografías y tono de tu campaña'
                  : 'You can choose one or more styles. These will influence the colors, fonts, and tone of your campaign'
                }
              </p>
            </div>

            <div className="relative">
              {/* Glowing effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-700 rounded-full blur-lg opacity-60 animate-pulse"></div>
              <Button 
                onClick={handleGenerateCampaign}
                disabled={demo.isGenerating || !demo.businessDescription.trim()}
                className="relative overflow-hidden bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 hover:from-brand-600 hover:via-brand-700 hover:to-brand-800 text-white font-bold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group border border-brand-400/30 w-full h-14 text-lg"
                data-testid="button-generate-campaign"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping opacity-75"></div>
                  <div className="absolute top-3 left-3 w-0.5 h-0.5 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute bottom-2 right-4 w-0.5 h-0.5 bg-brand-200 rounded-full animate-ping" style={{animationDelay: '500ms'}}></div>
                </div>
                <span className="relative z-10 flex items-center justify-center">
                  {demo.isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {isSpanish ? 'IA creando tu campaña...' : 'AI creating your campaign...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      {isSpanish ? 'Generar Campaña con IA' : 'Generate AI Campaign'}
                    </>
                  )}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold mb-4">
          {isSpanish ? '🎉 Tu Campaña Multiplataforma - Vista Previa' : '🎉 Your Multi-Platform Campaign - Preview'}
        </h3>
        <p className="text-gray-600 text-lg mb-4">
          <strong>"{generatedCampaign}"</strong> {isSpanish ? 'optimizada para 8 plataformas' : 'optimized for 8 platforms'}
        </p>
        <Button variant="outline" onClick={resetDemo} data-testid="button-try-another">
          {isSpanish ? 'Probar Otra Campaña' : 'Try Another Campaign'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
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

      {/* 30-Day Feed Previews */}
      <div className="mt-16 mb-12">
        <div className="text-center mb-8">
          <h4 className="text-2xl font-bold text-gray-900 mb-4">
            {isSpanish ? '📱 Planificador de 30 Días - Vista Previa' : '📱 30-Day Planner - Preview'}
          </h4>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isSpanish 
              ? 'CampAIgner genera automáticamente 30 días de contenido específico para tu industria. Aquí una muestra:'
              : 'CampAIgner automatically generates 30 days of industry-specific content. Here\'s a sample:'
            }
          </p>
        </div>

        {/* Platform Feed Previews */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          
          {/* Instagram Feed Grid */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            {/* Instagram Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {demo.businessDescription.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h5 className="font-bold text-gray-900">
                  {demo.businessDescription.toLowerCase().replace(/\s+/g, '').substring(0, 15)}
                </h5>
                <p className="text-sm text-gray-500">{isSpanish ? '30 días planificados' : '30 days planned'}</p>
              </div>
              <Instagram className="w-6 h-6 text-pink-500 ml-auto" />
            </div>

            {/* Modern Instagram Grid Layout */}
            <div className="grid grid-cols-3 gap-0.5">
              {Array.from({ length: 9 }, (_, index) => {
                const businessType = detectBusinessType(demo.businessDescription);
                
                // Use uploaded photos if available, otherwise use generated images
                let imageUrl: string;
                if (demo.uploadedImages.length > 0 && index < demo.uploadedImages.length) {
                  // Use each uploaded image only once
                  const uploadedImage = demo.uploadedImages[index];
                  imageUrl = URL.createObjectURL(uploadedImage);
                } else {
                  // Use generated industry-specific images
                  imageUrl = getIndustryVariedImage(demo.businessDescription, businessType, index);
                }
                
                const likes = Math.floor(Math.random() * 2000) + 150;
                const comments = Math.floor(Math.random() * 50) + 5;
                
                return (
                  <div key={index} className="aspect-[4/5] relative group cursor-pointer">
                    <img 
                      src={imageUrl}
                      alt={`Post ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Instagram-style hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <div className="flex items-center gap-8 text-white">
                        <div className="flex items-center gap-2">
                          <Heart className="w-7 h-7 fill-white" />
                          <span className="font-semibold text-xl">{likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                            <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" />
                          </svg>
                          <span className="font-semibold text-xl">{comments}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Text overlay on half the posts */}
                    {index % 2 === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-2 border border-white/30">
                          <p className="text-white text-sm font-bold drop-shadow-lg text-center leading-tight">
                            {index === 0 ? (isSpanish ? "Nueva Colección" : "New Collection") :
                             index === 2 ? (isSpanish ? "Detrás Escenas" : "Behind Scenes") :
                             index === 4 ? (isSpanish ? "Cliente Feliz" : "Happy Client") :
                             index === 6 ? (isSpanish ? "Oferta Especial" : "Special Offer") :
                             isSpanish ? "Proceso Único" : "Unique Process"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Embedded text overlay (inside post content) */}
                    {index % 3 === 1 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-gray-200 max-w-[80%]">
                          <p className="text-gray-900 text-lg font-bold text-center leading-tight">
                            {index === 1 ? (isSpanish ? "🔥 ¡NUEVO!" : "🔥 NEW!") :
                             index === 4 ? (isSpanish ? "✨ GRATIS" : "✨ FREE") :
                             index === 7 ? (isSpanish ? "💯 GARANTÍA" : "💯 GUARANTEE") :
                             isSpanish ? "🎯 ESPECIAL" : "🎯 SPECIAL"}
                          </p>
                          <p className="text-gray-700 text-sm mt-1 text-center">
                            {index === 1 ? (isSpanish ? "Disponible ya" : "Available now") :
                             index === 4 ? (isSpanish ? "Solo hoy" : "Today only") :
                             index === 7 ? (isSpanish ? "100% seguro" : "100% secure") :
                             isSpanish ? "No te pierdas" : "Don't miss out"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Multiple photo indicator (Instagram carousel) */}
                    {index % 4 === 1 && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          <path d="M21 1H7c-1.1 0-2 .9-2 2v2h2V3h14v14h-2v2h2c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z"/>
                        </svg>
                      </div>
                    )}
                    
                    {/* Video indicator */}
                    {index % 5 === 2 && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Grid Stats Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{9}</strong> {isSpanish ? 'publicaciones' : 'posts'}
                  </span>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{(Math.random() * 50 + 10).toFixed(1)}K</strong> {isSpanish ? 'seguidores' : 'followers'}
                  </span>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{Math.floor(Math.random() * 500) + 100}</strong> {isSpanish ? 'siguiendo' : 'following'}
                  </span>
                </div>
                <div className="text-brand-600 text-xs font-medium">
                  {isSpanish ? '📈 Crecimiento: +15%' : '📈 Growth: +15%'}
                </div>
              </div>
            </div>
          </div>

          {/* TikTok Feed Grid */}
          <div className="bg-black rounded-2xl shadow-xl p-6 border border-gray-800">
            {/* TikTok Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {demo.businessDescription.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h5 className="font-bold text-white">
                  @{demo.businessDescription.toLowerCase().replace(/\s+/g, '').substring(0, 12)}
                </h5>
                <p className="text-sm text-gray-400">{isSpanish ? '30 días planificados' : '30 days planned'}</p>
              </div>
              <SiTiktok className="w-6 h-6 text-red-500 ml-auto" />
            </div>

            {/* 6-Video Grid (Vertical format) */}
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 6 }, (_, index) => {
                const businessType = detectBusinessType(demo.businessDescription);
                
                // Use uploaded photos if available, otherwise use generated images
                let imageUrl: string;
                if (demo.uploadedImages.length > 0 && index < demo.uploadedImages.length) {
                  // Use each uploaded image only once
                  const uploadedImage = demo.uploadedImages[index];
                  imageUrl = URL.createObjectURL(uploadedImage);
                } else {
                  // Use generated industry-specific images
                  imageUrl = getIndustryVariedImage(demo.businessDescription, businessType, index);
                }
                
                const tikTokText = getTikTokOverlayText(demo.businessDescription, businessType, index, generatedCampaign, isSpanish);
                
                return (
                  <div key={index} className="aspect-[9/16] relative group cursor-pointer bg-gray-900 rounded-lg overflow-hidden">
                    <img 
                      src={imageUrl}
                      alt={`TikTok ${index + 1}`}
                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                    />
                    
                    {/* TikTok UI Elements */}
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">▶️</span>
                      </div>
                    </div>
                    
                    {/* TikTok Title Overlay */}
                    <div className="absolute bottom-8 left-2 right-2">
                      <div className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                        <p className="text-white text-sm font-bold drop-shadow-lg text-center leading-tight">
                          {index === 0 ? (isSpanish ? "Producto Nuevo" : "New Product") :
                           index === 1 ? (isSpanish ? "Tutorial Rápido" : "Quick Tutorial") :
                           index === 2 ? (isSpanish ? "Cliente Satisfecho" : "Happy Customer") :
                           index === 3 ? (isSpanish ? "Oferta Limitada" : "Limited Offer") :
                           index === 4 ? (isSpanish ? "Detrás Cámaras" : "Behind Scenes") :
                           isSpanish ? "Consejos Pro" : "Pro Tips"}
                        </p>
                      </div>
                    </div>

                    {/* Embedded TikTok text overlay (inside video content) */}
                    {index % 2 === 1 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl px-4 py-3 shadow-xl border-2 border-white/30 max-w-[85%] transform rotate-[-2deg]">
                          <p className="text-white text-base font-black text-center leading-tight">
                            {index === 1 ? (isSpanish ? "🚀 VIRAL" : "🚀 VIRAL") :
                             index === 3 ? (isSpanish ? "💥 BOOM" : "💥 BOOM") :
                             index === 5 ? (isSpanish ? "🔥 FIRE" : "🔥 FIRE") :
                             isSpanish ? "✨ WOW" : "✨ WOW"}
                          </p>
                          <p className="text-white/90 text-xs mt-1 text-center font-bold">
                            {index === 1 ? (isSpanish ? "No te lo pierdas" : "Don't miss this") :
                             index === 3 ? (isSpanish ? "Increíble resultado" : "Amazing result") :
                             index === 5 ? (isSpanish ? "Súper trending" : "Super trending") :
                             isSpanish ? "Mira esto" : "Check this out"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* View count */}
                    <div className="absolute bottom-2 right-2">
                      <div className="bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-white text-xs">{Math.floor(Math.random() * 100)}K</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Multi-Platform Preview */}
        <div className="mt-8 relative max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-brand-50 via-white to-brand-50 rounded-2xl p-6 border border-brand-200">
            <h5 className="text-lg font-bold text-center mb-4 text-gray-900">
              {isSpanish ? '🌟 Planificación Completa para Todas las Plataformas' : '🌟 Complete Planning for All Platforms'}
            </h5>
            
            {/* Platform previews with gradient transparency */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Pinterest', icon: '📌', color: 'from-red-500 to-red-600' },
                { name: 'YouTube', icon: '▶️', color: 'from-red-600 to-red-700' },
                { name: 'Twitter/X', icon: '🐦', color: 'from-sky-400 to-sky-500' },
                { name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' }
              ].map((platform, index) => (
                <div key={platform.name} className="relative group">
                  <div className={`bg-gradient-to-br ${platform.color} rounded-xl p-4 text-white text-center transition-all duration-300 group-hover:scale-105`}>
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <p className="text-sm font-bold">{platform.name}</p>
                    <p className="text-xs opacity-80 mt-1">
                      {isSpanish ? '30 días' : '30 days'}
                    </p>
                  </div>
                  
                  {/* Gradient overlay to show "coming soon" effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-white/30 to-transparent rounded-xl flex items-end justify-center pb-2">
                    <span className="text-xs font-bold text-gray-700 bg-white/80 px-2 py-1 rounded-full">
                      {isSpanish ? 'Disponible' : 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-sm text-gray-600 mt-4">
              {isSpanish 
                ? '✨ CampAIgner: Tu planificador inteligente de 30 días para todas las plataformas'
                : '✨ CampAIgner: Your intelligent 30-day planner for all platforms'
              }
            </p>
          </div>
        </div>
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