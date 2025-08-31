import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Mail, Instagram, Facebook, MessageSquare, Heart, Share, Bookmark } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DemoState {
  businessType: string;
  productService: string;
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
  }
};

interface InteractiveDemoProps {
  isSpanish: boolean;
}

export function InteractiveDemo({ isSpanish }: InteractiveDemoProps) {
  const [demo, setDemo] = useState<DemoState>({
    businessType: '',
    productService: '',
    isGenerating: false,
    showResults: false
  });

  const handleGenerateCampaign = async () => {
    if (!demo.businessType) return;
    
    setDemo(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate AI thinking process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setDemo(prev => ({ 
      ...prev, 
      isGenerating: false, 
      showResults: true 
    }));
  };

  const resetDemo = () => {
    setDemo({
      businessType: '',
      productService: '',
      isGenerating: false,
      showResults: false
    });
  };

  const currentTemplate = businessTemplates[demo.businessType as keyof typeof businessTemplates];

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
                      {demo.businessType[0]?.toUpperCase()}
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
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          {isSpanish ? '🚀 Prueba CampAIgner Gratis' : '🚀 Try CampAIgner Free'}
        </h3>
        <p className="text-gray-600">
          {isSpanish 
            ? 'Ve cómo la IA crea una campaña completa para tu negocio en segundos'
            : 'See how AI creates a complete campaign for your business in seconds'
          }
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isSpanish ? 'Tipo de negocio' : 'Business type'}
          </label>
          <Select 
            value={demo.businessType} 
            onValueChange={(value) => setDemo(prev => ({ ...prev, businessType: value }))}
          >
            <SelectTrigger data-testid="select-business-type">
              <SelectValue placeholder={isSpanish ? "Selecciona tu tipo de negocio" : "Select your business type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant" data-testid="option-restaurant">🍕 {isSpanish ? 'Restaurante' : 'Restaurant'}</SelectItem>
              <SelectItem value="fitness" data-testid="option-fitness">💪 {isSpanish ? 'Fitness/Gym' : 'Fitness/Gym'}</SelectItem>
              <SelectItem value="beauty" data-testid="option-beauty">✨ {isSpanish ? 'Belleza/Spa' : 'Beauty/Spa'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleGenerateCampaign}
          disabled={!demo.businessType}
          size="lg"
          className="w-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 disabled:opacity-50"
          data-testid="button-generate-campaign"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isSpanish ? 'Generar Mi Campaña' : 'Generate My Campaign'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          {isSpanish 
            ? 'No se requiere registro • Resultados instantáneos • 100% gratis'
            : 'No signup required • Instant results • 100% free'
          }
        </p>
      </div>
    </div>
  );
}