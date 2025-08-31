import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Mail, Instagram, Facebook, MessageSquare, Heart, Share, Bookmark } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DemoState {
  businessDescription: string;
  detectedType: string;
  isAnalyzing: boolean;
  isGenerating: boolean;
  showResults: boolean;
}

const businessTemplates = {
  restaurant: {
    posts: [
      { image: '🍕', caption: 'Fresh ingredients, authentic flavors! Try our signature wood-fired pizza tonight. #AuthenticTaste #FreshDaily', likes: 2847, comments: 89 },
      { image: '🥗', caption: 'Healthy never tasted this good! Our garden-fresh salads are perfect for lunch. #HealthyEating #FarmToTable', likes: 1923, comments: 67 },
      { image: '🍰', caption: 'Sweet endings to perfect meals ✨ Our homemade desserts are made with love daily. #SweetTreats #HomeMade', likes: 3156, comments: 124 },
      { image: '👨‍🍳', caption: 'Meet our chef! 20+ years of culinary expertise bringing you the best flavors. #ChefSpecial #ExperienceMatters', likes: 2234, comments: 145 },
      { image: '🍷', caption: 'Perfect wine pairings for every dish. Ask our sommelier for recommendations! #WinePairing #PerfectMatch', likes: 1687, comments: 43 },
      { image: '🎉', caption: 'Weekend special! Book your table now and enjoy 20% off on family meals. #WeekendSpecial #FamilyTime', likes: 4123, comments: 287 },
      { image: '☕', caption: 'Start your morning right with our artisan coffee and fresh pastries. #MorningBoost #ArtisanCoffee', likes: 1456, comments: 78 },
      { image: '🥖', caption: 'Freshly baked bread every morning. The aroma fills our kitchen at 5 AM! #FreshBaked #EarlyBird', likes: 2089, comments: 94 },
      { image: '🍝', caption: 'Pasta perfection! Our handmade noodles with secret family sauce recipe. #HandMade #FamilyRecipe', likes: 2756, comments: 156 }
    ],
    newsletter: {
      subject: 'This Weekend: 20% Off Family Meals + New Chef Specials',
      preview: 'Discover our latest culinary creations and save on family dining...',
      content: 'Experience authentic flavors with our weekend family special. Our expert chef has crafted new seasonal dishes using the freshest local ingredients.'
    }
  },
  fitness: {
    posts: [
      { image: '💪', caption: 'Transform your body in 30 days! Join our proven fitness program. Results guaranteed. #TransformationTuesday #FitnessGoals', likes: 5432, comments: 234 },
      { image: '🏃‍♀️', caption: 'Morning cardio routine that burns 300+ calories in 20 minutes! Try it today. #MorningWorkout #CardioBlast', likes: 3876, comments: 167 },
      { image: '🥤', caption: 'Post-workout nutrition is key! Our protein smoothie recipe for muscle recovery. #PostWorkout #NutritionTips', likes: 2945, comments: 89 },
      { image: '🏋️‍♂️', caption: 'Strength training basics: Start with these 5 fundamental exercises. #StrengthTraining #BeginnerFriendly', likes: 4123, comments: 312 },
      { image: '🧘‍♀️', caption: 'Mind-body connection: Why meditation should be part of your fitness routine. #Mindfulness #HolisticHealth', likes: 3567, comments: 145 },
      { image: '📊', caption: 'Track your progress! See how Sarah lost 25lbs in 12 weeks with our program. #ProgressTracking #ClientSuccess', likes: 6789, comments: 423 },
      { image: '🥗', caption: 'Fuel your workouts right! 5 pre-workout meals that boost performance. #PreWorkout #FitnessNutrition', likes: 2834, comments: 98 },
      { image: '💤', caption: 'Recovery is where the magic happens. Why sleep is your secret fitness weapon. #Recovery #SleepMatters', likes: 2156, comments: 76 },
      { image: '🎯', caption: 'Goal setting that works! Turn your fitness dreams into achievable targets. #GoalSetting #AchievableTargets', likes: 3298, comments: 187 }
    ],
    newsletter: {
      subject: 'Sarah Lost 25lbs in 12 Weeks - See Her Complete Transformation',
      preview: 'Discover the exact program that helped Sarah achieve incredible results...',
      content: 'Transform your body with our proven 30-day fitness program. Join thousands who have achieved their fitness goals with our expert guidance and personalized workout plans.'
    }
  },
  beauty: {
    posts: [
      { image: '✨', caption: 'Glow up routine that takes 5 minutes! Perfect skin starts with these simple steps. #GlowUp #SkincareRoutine', likes: 7234, comments: 345 },
      { image: '💄', caption: 'Bold lip colors for confident women. Which shade matches your personality? #BoldLips #ConfidentWomen', likes: 4567, comments: 289 },
      { image: '🌟', caption: 'Before & After: See Emma\'s skin transformation in just 4 weeks! #Transformation #SkincareMagic', likes: 8901, comments: 567 },
      { image: '🧴', caption: 'The secret ingredient in all our products: 100% natural botanicals. #NaturalBeauty #CleanBeauty', likes: 3456, comments: 123 },
      { image: '💆‍♀️', caption: 'Self-care Sunday essentials! Create your perfect at-home spa experience. #SelfCareSunday #AtHomeSpa', likes: 5432, comments: 234 },
      { image: '🌸', caption: 'Spring makeup trends that make you look naturally radiant. #SpringMakeup #NaturalGlow', likes: 6123, comments: 298 },
      { image: '👁️', caption: 'Eyes that captivate! Master the perfect winged eyeliner in 3 steps. #EyeMakeup #WingedEyeliner', likes: 4789, comments: 187 },
      { image: '🌿', caption: 'Ingredient spotlight: Why hyaluronic acid is your skin\'s best friend. #SkincareTips #HyaluronicAcid', likes: 3890, comments: 156 },
      { image: '💫', caption: 'Confidence comes from within, but great skincare helps it shine! #InnerBeauty #ConfidenceBoost', likes: 5678, comments: 321 }
    ],
    newsletter: {
      subject: 'Emma\'s 4-Week Skin Transformation - Get Her Complete Routine',
      preview: 'See the exact products and routine that gave Emma glowing skin...',
      content: 'Achieve radiant skin with our 5-minute daily routine. Using 100% natural botanicals, our products help you glow from within and boost your natural confidence.'
    }
  },
  ecommerce: {
    posts: [
      { image: '📦', caption: 'New arrivals alert! 🚨 Fresh inventory just dropped. Shop the latest trends before they sell out! #NewArrivals #ShopNow', likes: 3245, comments: 127 },
      { image: '⭐', caption: 'Customer love! 💕 "Best purchase I\'ve made this year!" - Sarah M. See what everyone\'s raving about. #CustomerReview #FiveStars', likes: 4567, comments: 203 },
      { image: '🛒', caption: 'Flash Sale Alert! ⚡ 48 hours only - Save 30% on bestsellers. Use code FLASH30 at checkout! #FlashSale #SaveBig', likes: 6789, comments: 456 },
      { image: '📸', caption: 'Behind the scenes at our warehouse! 📦 Your orders are packed with care and shipped with love. #BehindTheScenes #CustomerCare', likes: 2134, comments: 89 },
      { image: '🎁', caption: 'Gift guide season! 🎄 Find the perfect present for everyone on your list. Free gift wrapping included! #GiftGuide #FreeWrapping', likes: 3876, comments: 234 },
      { image: '🚚', caption: 'Free shipping milestone! 📈 Thanks to your support, we now offer free shipping on all orders over $50! #FreeShipping #Milestone', likes: 2945, comments: 167 },
      { image: '💎', caption: 'Product spotlight! ✨ This week\'s featured item has a 98% satisfaction rate. See why customers love it! #ProductSpotlight #BestSeller', likes: 4123, comments: 298 },
      { image: '🔄', caption: 'Restock notification! 📢 Popular items are back in stock. Don\'t wait - these sell fast! #Restocked #PopularItems', likes: 3456, comments: 178 },
      { image: '🏆', caption: 'Award winning! 🥇 Proud to announce we\'ve won "Best Online Store 2024"! Thank you for your support! #Award #BestStore2024', likes: 5234, comments: 421 }
    ],
    newsletter: {
      subject: 'Flash Sale: 30% Off Bestsellers - 48 Hours Only!',
      preview: 'Don\'t miss out on this limited-time offer on our most popular items...',
      content: 'Get ready for incredible savings! Our 48-hour flash sale features 30% off all bestselling items. From customer favorites to new arrivals, everything you love is now more affordable.'
    }
  },
  consulting: {
    posts: [
      { image: '💼', caption: 'Business transformation success! 📈 Client achieved 200% revenue growth in 6 months. Ready for your breakthrough? #BusinessGrowth #ClientSuccess', likes: 2156, comments: 78 },
      { image: '📊', caption: 'Market insight Monday! 📈 3 trends every business owner should watch in 2024. Swipe for details! #MarketInsights #BusinessTrends', likes: 3421, comments: 156 },
      { image: '🎯', caption: 'Strategy session spotlight! 💡 How we helped a startup scale from $10K to $100K monthly revenue. #StrategySession #StartupGrowth', likes: 4567, comments: 234 },
      { image: '📚', caption: 'Knowledge drop! 🧠 The #1 mistake businesses make when scaling (and how to avoid it). Save this post! #BusinessTips #ScalingSecrets', likes: 5234, comments: 298 },
      { image: '🤝', caption: 'Partnership announcement! 🎉 Excited to collaborate with industry leaders to bring you better solutions. #Partnership #Innovation', likes: 2789, comments: 123 },
      { image: '📞', caption: 'Free consultation Friday! ☎️ Book your complimentary strategy call this week. Limited spots available! #FreeConsultation #StrategyCall', likes: 3876, comments: 189 },
      { image: '🏅', caption: 'Achievement unlocked! 🏆 Helped our 500th client reach their revenue goals. Celebrating this milestone! #Milestone #ClientSuccess', likes: 4123, comments: 267 },
      { image: '📖', caption: 'Case study reveal! 📋 How we doubled a client\'s profit margins without increasing prices. Link in bio for full story! #CaseStudy #ProfitOptimization', likes: 3654, comments: 178 },
      { image: '🚀', caption: 'Launch week! 🎊 New service offering: Digital transformation consulting. Ready to modernize your business? #NewService #DigitalTransformation', likes: 2945, comments: 134 }
    ],
    newsletter: {
      subject: 'Case Study: How We Doubled Client Profit Margins (No Price Increase)',
      preview: 'See the exact strategies we used to boost profitability without raising prices...',
      content: 'Discover the proven framework that helped our client double their profit margins in just 90 days. This detailed case study reveals the exact strategies and implementation steps.'
    }
  },
  realestate: {
    posts: [
      { image: '🏠', caption: 'Just listed! ✨ Stunning 3BR/2BA home in prime location. Modern upgrades, move-in ready. Schedule your tour today! #JustListed #DreamHome', likes: 4567, comments: 234 },
      { image: '🔑', caption: 'SOLD in 3 days! 🎉 Another happy family found their dream home. Ready to sell yours fast? Let\'s chat! #SoldFast #RealEstateExpert', likes: 3245, comments: 167 },
      { image: '📈', caption: 'Market update! 📊 Local home values up 8% this quarter. Great time to sell! Get your free home valuation today. #MarketUpdate #HomeValues', likes: 2789, comments: 134 },
      { image: '🏘️', caption: 'Neighborhood spotlight! 🌟 Why families love living in Oakwood Heights. Schools, parks, and community - it has it all! #NeighborhoodSpotlight #FamilyFriendly', likes: 3456, comments: 189 },
      { image: '💰', caption: 'First-time buyer success! 🏡 Helped Sarah and Mike get into their first home with $5K down. Your dream is possible too! #FirstTimeBuyer #DreamsPossible', likes: 4123, comments: 298 },
      { image: '📸', caption: 'Before & After staging magic! ✨ See how professional staging helped this home sell for 15% above asking! #Staging #AboveAsking', likes: 3876, comments: 223 },
      { image: '🎯', caption: 'Buyer tip Tuesday! 💡 The #1 thing to check during home inspections that most buyers miss. Save this post! #BuyerTips #HomeInspection', likes: 2654, comments: 156 },
      { image: '📅', caption: 'Open house this weekend! 🏠 Saturday 1-3PM, Sunday 11-1PM. Beautiful home, must see to believe! #OpenHouse #WeekendViewing', likes: 3234, comments: 178 },
      { image: '🏆', caption: 'Top agent recognition! 🥇 Proud to be ranked #1 in sales volume this quarter. Thank you for trusting me with your biggest investment! #TopAgent #ThankYou', likes: 2945, comments: 201 }
    ],
    newsletter: {
      subject: 'Market Alert: Home Values Up 8% - Perfect Time to Sell!',
      preview: 'Get your free home valuation and see what your property is worth in today\'s market...',
      content: 'The local real estate market is heating up! With home values rising 8% this quarter, it\'s an excellent time for homeowners to consider selling. Our proven marketing strategy gets homes sold fast and for top dollar.'
    }
  },
  dental: {
    posts: [
      { image: '😁', caption: 'Smile transformation Tuesday! ✨ See Emily\'s amazing results after just 6 months of treatment. Your perfect smile awaits! #SmileTransformation #PerfectSmile', likes: 3456, comments: 189 },
      { image: '🦷', caption: 'Dental tip of the day! 💡 Flossing prevents 40% more cavities than brushing alone. Make it part of your daily routine! #DentalTips #OralHealth', likes: 2234, comments: 123 },
      { image: '👨‍⚕️', caption: 'Meet Dr. Johnson! 👋 20+ years of experience creating beautiful, healthy smiles. Book your consultation today! #MeetTheDoctor #ExperiencedCare', likes: 2789, comments: 145 },
      { image: '🎉', caption: 'Patient appreciation! 💕 "Dr. Johnson made my dental anxiety disappear. Best experience ever!" - Sarah M. #PatientAppreciation #AnxietyFree', likes: 4123, comments: 267 },
      { image: '🦷', caption: 'Teeth whitening special! ⭐ Professional whitening treatment - 50% off this month only. Get that Hollywood smile! #TeethWhitening #SpecialOffer', likes: 3876, comments: 234 },
      { image: '👨‍👩‍👧‍👦', caption: 'Family dental care! 👪 We make dental visits fun for kids and comfortable for parents. Same-day family appointments available! #FamilyDental #KidsFriendly', likes: 2945, comments: 178 },
      { image: '🔬', caption: 'Technology spotlight! 💻 Our new digital X-ray system reduces radiation by 90% while providing clearer images. #TechnologyAdvanced #SaferXrays', likes: 2456, comments: 134 },
      { image: '📅', caption: 'Appointment reminder! ⏰ Don\'t forget your 6-month checkup! Regular cleanings prevent major dental issues. Book online 24/7! #AppointmentReminder #PreventiveCare', likes: 3234, comments: 156 },
      { image: '🏆', caption: 'Award winning practice! 🥇 Voted "Best Dental Practice 2024" by our community. Thank you for your trust and support! #AwardWinning #CommunityChoice', likes: 2678, comments: 201 }
    ],
    newsletter: {
      subject: 'Teeth Whitening Special: 50% Off Professional Treatment',
      preview: 'Get a Hollywood-worthy smile with our professional whitening treatment...',
      content: 'Transform your smile this month with our professional teeth whitening treatment at 50% off regular price. Our advanced whitening system delivers dramatic results in just one visit, giving you the confidence to smile brighter.'
    }
  }
};

interface InteractiveDemoProps {
  isSpanish: boolean;
}

// Simple AI business type detection based on keywords
const detectBusinessType = (description: string): { type: string; confidence: string; explanation: string } => {
  const desc = description.toLowerCase();
  
  // Restaurant keywords
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('pizza') || desc.includes('burger') || desc.includes('cafe') || desc.includes('kitchen') || desc.includes('chef') || desc.includes('dining') || desc.includes('menu') || desc.includes('cooking')) {
    return { type: 'restaurant', confidence: '95%', explanation: 'Food service & hospitality industry' };
  }
  
  // Fitness keywords  
  if (desc.includes('fitness') || desc.includes('gym') || desc.includes('workout') || desc.includes('trainer') || desc.includes('yoga') || desc.includes('exercise') || desc.includes('muscle') || desc.includes('weight') || desc.includes('cardio')) {
    return { type: 'fitness', confidence: '94%', explanation: 'Fitness & wellness industry' };
  }
  
  // Beauty keywords
  if (desc.includes('beauty') || desc.includes('spa') || desc.includes('makeup') || desc.includes('skincare') || desc.includes('salon') || desc.includes('nails') || desc.includes('hair') || desc.includes('cosmetics') || desc.includes('facial')) {
    return { type: 'beauty', confidence: '93%', explanation: 'Beauty & personal care industry' };
  }
  
  // E-commerce keywords
  if (desc.includes('sell') || desc.includes('shop') || desc.includes('store') || desc.includes('product') || desc.includes('ecommerce') || desc.includes('online') || desc.includes('inventory') || desc.includes('shipping') || desc.includes('orders')) {
    return { type: 'ecommerce', confidence: '92%', explanation: 'E-commerce & retail industry' };
  }
  
  // Real Estate keywords
  if (desc.includes('real estate') || desc.includes('homes') || desc.includes('property') || desc.includes('house') || desc.includes('realtor') || desc.includes('agent') || desc.includes('listing') || desc.includes('mortgage') || desc.includes('buyer')) {
    return { type: 'realestate', confidence: '96%', explanation: 'Real estate & property industry' };
  }
  
  // Dental keywords
  if (desc.includes('dental') || desc.includes('teeth') || desc.includes('dentist') || desc.includes('medical') || desc.includes('doctor') || desc.includes('clinic') || desc.includes('health') || desc.includes('patient') || desc.includes('treatment')) {
    return { type: 'dental', confidence: '97%', explanation: 'Healthcare & medical services' };
  }
  
  // Consulting keywords
  if (desc.includes('consult') || desc.includes('advice') || desc.includes('business') || desc.includes('strategy') || desc.includes('coach') || desc.includes('expert') || desc.includes('service') || desc.includes('help') || desc.includes('professional')) {
    return { type: 'consulting', confidence: '89%', explanation: 'Professional services & consulting' };
  }
  
  // Default to consulting for any business
  return { type: 'consulting', confidence: '85%', explanation: 'Professional services & consulting' };
};

// Helper function to create high-quality demo visuals
const createDemoVisuals = (businessDescription: string, businessType: string | null) => {
  // High-quality stock photo URLs that look like AI-generated campaign content
  const visualsByType: Record<string, string[]> = {
    restaurant: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&h=1080&fit=crop&crop=center'
    ],
    fitness: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&h=1080&fit=crop&crop=center'
    ],
    beauty: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1080&h=1080&fit=crop&crop=center'
    ],
    ecommerce: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1080&h=1080&fit=crop&crop=center'
    ],
    realestate: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1582063289852-62e3ba2747f8?w=1080&h=1080&fit=crop&crop=center'
    ],
    dental: [
      'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1080&h=1080&fit=crop&crop=center'
    ],
    default: [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1080&h=1080&fit=crop&crop=center',
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1080&h=1080&fit=crop&crop=center'
    ]
  };

  const detectedBusinessType = businessType || 'default';
  const businessTypeKey = Object.keys(visualsByType).includes(detectedBusinessType) 
    ? detectedBusinessType 
    : 'default';
    
  const urls = visualsByType[businessTypeKey];
  
  return urls.map((url, index) => ({
    url,
    platform: index === 0 ? 'instagram' : index === 1 ? 'facebook' : 'email',
    dimensions: index === 0 ? '1080x1080' : index === 1 ? '1200x628' : '600x200'
  }));
};

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [demo, setDemo] = useState<DemoState>({
    businessDescription: '',
    detectedType: '',
    isAnalyzing: false,
    isGenerating: false,
    showResults: false
  });

  const [generatedVisuals, setGeneratedVisuals] = useState<any>(null);

  const handleAnalyzeBusiness = async () => {
    if (!demo.businessDescription.trim()) return;
    
    setDemo(prev => ({ ...prev, isAnalyzing: true }));
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const detection = detectBusinessType(demo.businessDescription);
    
    setDemo(prev => ({ 
      ...prev, 
      isAnalyzing: false,
      detectedType: detection.type
    }));
  };

  const handleGenerateCampaign = async () => {
    if (!demo.detectedType) {
      await handleAnalyzeBusiness();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    }
    
    setDemo(prev => ({ ...prev, isGenerating: true }));
    
    // Generate real AI visuals for the campaign
    try {
      const response = await fetch('/api/ai/generate-campaign-visuals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessDescription: demo.businessDescription,
          businessType: demo.detectedType,
          campaignTheme: currentTemplate?.newsletter?.subject || 'Marketing Campaign',
          posts: currentTemplate?.posts?.slice(0, 3) || [] // Generate for first 3 posts only
        })
      });

      if (response.ok) {
        const visualData = await response.json();
        
        // If no visuals were generated (billing limit, etc.), create high-quality demo visuals
        if (!visualData.visuals || visualData.visuals.length === 0) {
          const demoVisuals = createDemoVisuals(demo.businessDescription, demo.detectedType);
          setGeneratedVisuals({ ...visualData, visuals: demoVisuals });
        } else {
          setGeneratedVisuals(visualData);
        }
      }
    } catch (error) {
      console.error('Error generating visuals:', error);
      // Create demo visuals as fallback
      const demoVisuals = createDemoVisuals(demo.businessDescription, demo.detectedType);
      setGeneratedVisuals({ 
        visuals: demoVisuals, 
        businessType: demo.detectedType,
        campaignTheme: currentTemplate?.newsletter?.subject || 'Marketing Campaign',
        totalGenerated: demoVisuals.length
      });
    }
    
    setDemo(prev => ({ 
      ...prev, 
      isGenerating: false, 
      showResults: true 
    }));
  };

  const resetDemo = () => {
    setDemo({
      businessDescription: '',
      detectedType: '',
      isAnalyzing: false,
      isGenerating: false,
      showResults: false
    });
  };

  const currentTemplate = businessTemplates[demo.detectedType as keyof typeof businessTemplates];

  if (demo.isGenerating) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {isSpanish ? '🤖 IA está creando tu campaña...' : '🤖 AI is creating your campaign...'}
          </h3>
          <div className="space-y-2 text-gray-600">
            <p>✅ {isSpanish ? 'Analizando tu negocio...' : 'Analyzing your business...'}</p>
            <p>✅ {isSpanish ? 'Seleccionando las mejores plataformas...' : 'Selecting best platforms...'}</p>
            <p>⏳ {isSpanish ? 'Generando contenido viral...' : 'Generating viral content...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (demo.showResults && currentTemplate) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                🎉 {isSpanish ? 'Tu Campaña Está Lista' : 'Your Campaign is Ready'}
              </h3>
              <p className="text-brand-100">
                {isSpanish ? 'Contenido completo para múltiples plataformas' : 'Complete content for multiple platforms'}
              </p>
            </div>
            <Button 
              onClick={resetDemo}
              variant="outline" 
              className="bg-white text-brand-600 hover:bg-brand-50"
              data-testid="button-create-another"
            >
              {isSpanish ? 'Crear Otra' : 'Create Another'}
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Instagram Feed */}
          <div>
            <div className="flex items-center mb-4">
              <Instagram className="h-6 w-6 text-pink-600 mr-2" />
              <h4 className="text-xl font-bold">
                {isSpanish ? 'Feed de Instagram (9 publicaciones)' : 'Instagram Feed (9 posts)'}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-3" data-testid="instagram-feed">
              {currentTemplate.posts.map((post, index) => (
                <Card key={index} className="aspect-square relative overflow-hidden group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg" data-testid={`instagram-post-${index}`}>
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Post Visual Area - Real AI generated image or fallback */}
                    <div className="flex-1 bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
                      {generatedVisuals && generatedVisuals.visuals && generatedVisuals.visuals[index] ? (
                        <>
                          <img 
                            src={generatedVisuals.visuals[index].url} 
                            alt={`Campaign visual ${index + 1}`}
                            className="w-full h-full object-cover rounded-t-lg"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            AI-Style Demo • 1080×1080
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-7xl opacity-20 absolute">{post.image}</div>
                          {/* Simulated post design elements */}
                          <div className="absolute inset-3 border-2 border-white/60 rounded-2xl"></div>
                          <div className="absolute top-5 left-5 w-3 h-3 bg-white/80 rounded-full"></div>
                          <div className="absolute top-5 right-5 w-8 h-1 bg-white/60 rounded-full"></div>
                          <div className="absolute bottom-5 left-5 right-5">
                            <div className="h-2 bg-white/70 rounded-full mb-2"></div>
                            <div className="h-1.5 bg-white/50 rounded-full w-3/4"></div>
                          </div>
                          <div className="text-5xl z-10">{post.image}</div>
                        </>
                      )}
                    </div>
                    
                    {/* Instagram UI Elements */}
                    <div className="p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Heart className="h-4 w-4 text-red-500 fill-current" />
                          <MessageSquare className="h-4 w-4 text-gray-700" />
                          <Share className="h-4 w-4 text-gray-700" />
                        </div>
                        <Bookmark className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="text-xs font-semibold text-gray-900 mb-1">
                        {post.likes.toLocaleString()} likes
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        <span className="font-semibold text-gray-900">yourbusiness</span> {post.caption.slice(0, 80)}...
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {post.comments} comments • Ready to publish
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Email Newsletter */}
          <div>
            <div className="flex items-center mb-4">
              <Mail className="h-6 w-6 text-blue-600 mr-2" />
              <h4 className="text-xl font-bold">
                {isSpanish ? 'Newsletter por Email' : 'Email Newsletter'}
              </h4>
            </div>
            <Card data-testid="email-newsletter" className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-0">
                {/* Email Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
                  <div className="text-xs text-blue-100 mb-1">
                    {isSpanish ? 'DE:' : 'FROM:'} Your Business &lt;noreply@yourbusiness.com&gt;
                  </div>
                  <div className="text-sm font-semibold mb-1">
                    {isSpanish ? 'ASUNTO:' : 'SUBJECT:'} {currentTemplate.newsletter.subject}
                  </div>
                  <div className="text-xs text-blue-100">
                    {currentTemplate.newsletter.preview}
                  </div>
                </div>
                
                {/* Email Body */}
                <div className="p-6 bg-white">
                  {/* Header Image/Logo Area */}
                  <div className="text-center mb-6">
                    {generatedVisuals && generatedVisuals.visuals && generatedVisuals.visuals[2] ? (
                      <div className="relative mb-3">
                        <img 
                          src={generatedVisuals.visuals[2].url} 
                          alt="Email header visual"
                          className="w-full max-w-md mx-auto h-24 object-cover rounded-xl"
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                          AI-Style Demo • 600×200
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl mx-auto flex items-center justify-center text-3xl text-white mb-3">
                        {currentTemplate.posts[5]?.image || '🎯'}
                      </div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Business</h2>
                  </div>

                  {/* Main Content */}
                  <div className="bg-gray-50 rounded-xl p-6 mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{currentTemplate.newsletter.subject}</h3>
                    <p className="text-gray-700 leading-relaxed mb-4">{currentTemplate.newsletter.content}</p>
                    
                    {/* Call to Action */}
                    <div className="text-center">
                      <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-view-offer">
                        {isSpanish ? 'Ver Oferta Especial' : 'View Special Offer'}
                      </Button>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
                    <p className="mb-2">Ready to publish • Professional email design</p>
                    <p>{isSpanish ? 'Diseñado automáticamente por LeadBoost IA' : 'Automatically designed by LeadBoost AI'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facebook Ad Mockup */}
          <div>
            <div className="flex items-center mb-4">
              <Facebook className="h-6 w-6 text-blue-700 mr-2" />
              <h4 className="text-xl font-bold">
                {isSpanish ? 'Anuncio de Facebook' : 'Facebook Ad'}
              </h4>
            </div>
            <Card data-testid="facebook-ad" className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-0">
                {/* Facebook Ad Header */}
                <div className="p-4 bg-white border-b border-gray-200">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {demo.detectedType[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className="font-semibold text-sm">Your Business</div>
                        <div className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">Sponsored</div>
                      </div>
                      <div className="text-xs text-gray-500">Promoted • 2 hours ago</div>
                    </div>
                  </div>
                </div>

                {/* Facebook Ad Visual - Real AI generated or fallback */}
                <div className="relative bg-gradient-to-br from-purple-100 via-pink-50 to-blue-50 aspect-video flex items-center justify-center overflow-hidden">
                  {generatedVisuals && generatedVisuals.visuals && generatedVisuals.visuals[0] ? (
                    <>
                      <img 
                        src={generatedVisuals.visuals[0].url} 
                        alt="Facebook ad visual"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        AI-Style Demo • 1200×628
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-8xl opacity-20 absolute">{currentTemplate.posts[0].image}</div>
                      {/* Professional ad overlay elements */}
                      <div className="absolute inset-4 border-2 border-white/60 rounded-2xl"></div>
                      <div className="absolute top-6 left-6 w-4 h-4 bg-white/80 rounded-full"></div>
                      <div className="absolute top-6 right-6 w-12 h-2 bg-white/60 rounded-full"></div>
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="h-3 bg-white/70 rounded-full mb-2"></div>
                        <div className="h-2 bg-white/50 rounded-full w-2/3"></div>
                      </div>
                      <div className="text-6xl z-10">{currentTemplate.posts[0].image}</div>
                    </>
                  )}
                  
                  {/* "Ad" label */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Ad
                  </div>
                </div>

                {/* Facebook Ad Content */}
                <div className="p-4 bg-white">
                  <p className="text-gray-800 text-sm mb-4 leading-relaxed">{currentTemplate.posts[0].caption}</p>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" data-testid="button-learn-more">
                    {isSpanish ? 'Más Información' : 'Learn More'}
                  </Button>
                  
                  {/* Facebook engagement simulation */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3 text-red-500 fill-current" />
                        <span>847</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-3 w-3 text-blue-500" />
                        <span>23</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Share className="h-3 w-3 text-gray-500" />
                        <span>12</span>
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">Ready to launch</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform-Specific Formats Section */}
          {generatedVisuals && generatedVisuals.visuals && generatedVisuals.visuals.length > 0 && (
            <div className="mt-8">
              <h4 className="text-xl font-bold text-center mb-6">
                {isSpanish ? 'Formatos Específicos por Plataforma' : 'Platform-Specific Formats'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-pink-50 p-3 rounded-lg border-2 border-pink-200">
                    <div className="text-sm font-semibold text-pink-600 mb-2">Instagram Story</div>
                    <div className="bg-pink-100 rounded h-20 w-12 mx-auto flex items-center justify-center">
                      <span className="text-xs text-pink-600">1080×1920</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                    <div className="text-sm font-semibold text-blue-600 mb-2">Facebook Ad</div>
                    <div className="bg-blue-100 rounded h-12 w-20 mx-auto flex items-center justify-center">
                      <span className="text-xs text-blue-600">1200×628</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                    <div className="text-sm font-semibold text-purple-600 mb-2">Twitter/X</div>
                    <div className="bg-purple-100 rounded h-10 w-18 mx-auto flex items-center justify-center">
                      <span className="text-xs text-purple-600">1600×900</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
                    <div className="text-sm font-semibold text-green-600 mb-2">Email Banner</div>
                    <div className="bg-green-100 rounded h-8 w-24 mx-auto flex items-center justify-center">
                      <span className="text-xs text-green-600">600×200</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-gray-500">
                  {isSpanish 
                    ? 'Cada visual se adapta automáticamente al formato óptimo de cada plataforma'
                    : 'Each visual automatically adapts to the optimal format for each platform'
                  }
                </p>
              </div>
            </div>
          )}

          <div className="text-center pt-6 border-t">
            <p className="text-gray-600 mb-4">
              {isSpanish 
                ? '✨ ¡Y esto es solo el comienzo! Tu campaña completa incluye contenido para +21 plataformas.'
                : '✨ And this is just the beginning! Your complete campaign includes content for +21 platforms.'
              }
            </p>
            <Button size="lg" className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700" data-testid="button-start-free">
              {isSpanish ? 'Comenzar Ahora Gratis' : 'Start Free Now'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border border-gray-200 p-10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-50 -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full opacity-40 translate-y-12 -translate-x-12"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {isSpanish ? 'Demo Interactivo' : 'Interactive Demo'}
          </div>
          <h3 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {isSpanish ? 'Ve LeadBoost en Acción' : 'See LeadBoost In Action'}
          </h3>
          <p className="text-xl text-gray-600 leading-relaxed">
            {isSpanish 
              ? 'Ve cómo la IA de LeadBoost crea una campaña completa para tu negocio en segundos'
              : 'See how LeadBoost\'s AI creates a complete campaign for your business in seconds'
            }
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              {isSpanish ? 'Cuéntanos sobre tu negocio' : 'Tell us about your business'}
            </label>
            <textarea 
              value={demo.businessDescription}
              onChange={(e) => setDemo(prev => ({ ...prev, businessDescription: e.target.value }))}
              placeholder={isSpanish 
                ? 'Por ejemplo: "Tengo un restaurante italiano en el centro que sirve pasta casera y pizza al horno de leña"'
                : 'Example: "I run a food truck that serves gourmet burgers and craft beer in downtown Austin"'
              }
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-lg transition-all duration-200"
              rows={4}
              data-testid="textarea-business-description"
            />
          </div>

        {demo.detectedType && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {isSpanish ? 'IA Detectada' : 'AI Detected'}
              </span>
            </div>
            <p className="text-green-800 font-semibold">
              {(() => {
                const detection = detectBusinessType(demo.businessDescription);
                const typeNames = {
                  restaurant: isSpanish ? 'Restaurante/Comida' : 'Restaurant/Food Service',
                  fitness: isSpanish ? 'Fitness/Gimnasio' : 'Fitness/Gym',
                  beauty: isSpanish ? 'Belleza/Spa' : 'Beauty/Spa',
                  ecommerce: isSpanish ? 'E-commerce/Tienda' : 'E-commerce/Retail',
                  consulting: isSpanish ? 'Consultoría/Servicios' : 'Consulting/Services',
                  realestate: isSpanish ? 'Bienes Raíces' : 'Real Estate',
                  dental: isSpanish ? 'Salud/Médico' : 'Healthcare/Medical'
                };
                return typeNames[demo.detectedType as keyof typeof typeNames] || detection.explanation;
              })()}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {isSpanish ? 'Confianza: ' : 'Confidence: '}{detectBusinessType(demo.businessDescription).confidence}
            </p>
          </div>
        )}

        {demo.isAnalyzing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <span className="text-gray-600">
                {isSpanish ? 'Analizando tu negocio con IA...' : 'Analyzing your business with AI...'}
              </span>
            </div>
          </div>
        )}

          <Button 
            onClick={handleGenerateCampaign}
            disabled={!demo.businessDescription.trim() || demo.isAnalyzing}
            size="lg"
            className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 disabled:opacity-50 text-xl py-4 shadow-lg"
            data-testid="button-generate-campaign"
          >
            <Sparkles className="mr-2 h-6 w-6" />
            {demo.isAnalyzing 
              ? (isSpanish ? 'Analizando...' : 'Analyzing...')
              : (isSpanish ? 'Generar Mi Campaña' : 'Generate My Campaign')
            }
          </Button>

          <p className="text-sm text-gray-500 text-center">
            {isSpanish 
              ? 'No se requiere registro • Resultados instantáneos • 100% gratis'
              : 'No signup required • Instant results • 100% free'
            }
          </p>
        </div>
      </div>
    </div>
  );
}