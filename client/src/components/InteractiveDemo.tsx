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

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [demo, setDemo] = useState<DemoState>({
    businessDescription: '',
    detectedType: '',
    isAnalyzing: false,
    isGenerating: false,
    showResults: false
  });

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
    
    // Simulate AI campaign generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
            <div className="grid grid-cols-3 gap-2" data-testid="instagram-feed">
              {currentTemplate.posts.map((post, index) => (
                <Card key={index} className="aspect-square" data-testid={`instagram-post-${index}`}>
                  <CardContent className="p-4 h-full flex flex-col justify-between">
                    <div className="text-4xl text-center mb-2">{post.image}</div>
                    <div className="text-xs text-gray-600 line-clamp-3 mb-2">{post.caption}</div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Heart className="h-3 w-3" />
                        <span>{post.likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.comments}</span>
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
            <Card data-testid="email-newsletter">
              <CardContent className="p-6">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-500 mb-2">
                    {isSpanish ? 'Asunto:' : 'Subject:'} {currentTemplate.newsletter.subject}
                  </div>
                  <div className="text-xs text-gray-400 mb-4">
                    {currentTemplate.newsletter.preview}
                  </div>
                  <div className="bg-white p-4 rounded border">
                    <div className="text-2xl mb-2">{currentTemplate.posts[5].image}</div>
                    <h5 className="font-bold text-lg mb-2">{currentTemplate.newsletter.subject}</h5>
                    <p className="text-gray-700 mb-4">{currentTemplate.newsletter.content}</p>
                    <Button className="bg-brand-600 hover:bg-brand-700" data-testid="button-view-offer">
                      {isSpanish ? 'Ver Oferta' : 'View Offer'}
                    </Button>
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
            <Card data-testid="facebook-ad">
              <CardContent className="p-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {demo.detectedType[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Your Business</div>
                      <div className="text-xs text-gray-500">Sponsored</div>
                    </div>
                  </div>
                  <div className="text-4xl text-center py-8 bg-gray-100 rounded mb-3">
                    {currentTemplate.posts[0].image}
                  </div>
                  <p className="text-sm mb-3">{currentTemplate.posts[0].caption}</p>
                  <Button className="w-full bg-brand-600 hover:bg-brand-700" data-testid="button-learn-more">
                    {isSpanish ? 'Más Información' : 'Learn More'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

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