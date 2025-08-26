import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Waterfall Hero Section - THE CENTERPIECE */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          
          {/* Main Waterfall Value Proposition */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl lg:text-6xl font-black text-gray-900 mb-2">LeadBoost</h1>
                <div className="text-2xl font-bold text-brand-600">{(t.landing as any)?.waterfallTitle || "The Waterfall System"}</div>
              </div>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {(t.landing as any)?.heroTitle || "Turn ONE idea into campaigns across 21+ platforms"}
            </h2>
            
            <p className="text-xl lg:text-2xl text-gray-700 mb-12 max-w-5xl mx-auto leading-relaxed">
              {(t.landing as any)?.heroSubtitle || t.landing?.heroSubtitle || "LeadBoost's Waterfall System takes your single campaign idea and instantly creates optimized content for Instagram, TikTok, Facebook, WhatsApp, LinkedIn, YouTube and 16+ more platforms — all in the correct format and size."}
            </p>
            
            {/* The Waterfall Visual Flow */}
            <div className="mb-12">
              <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 border border-gray-100 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  
                  {/* ONE IDEA */}
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Target className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-green-600 mb-2">{(t.landing as any)?.oneIdea || "ONE IDEA"}</h3>
                    <p className="text-gray-600 font-medium">"{isSpanish ? 'Lanzar producto nuevo' : 'Launch new product'}"</p>
                    <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Solo describe tu campaña' : 'Just describe your campaign'}</p>
                  </div>
                  
                  {/* ARROW */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-8 w-8 text-brand-400 hidden lg:block" />
                    <ArrowDown className="h-8 w-8 text-brand-400 lg:hidden" />
                  </div>
                  
                  {/* EVERYWHERE */}
                  <div className="text-center">
                    <div className="grid grid-cols-4 gap-2 mb-4 max-w-48 mx-auto">
                      <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                        <SiInstagram className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                        <SiTiktok className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <SiFacebook className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <SiWhatsapp className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                        <SiLinkedin className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <SiYoutube className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <SiX className="h-6 w-6 text-white" />
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        +14
                      </div>
                    </div>
                    <h3 className="text-3xl font-black text-purple-600 mb-2">{(t.landing as any)?.everywhere || "EVERYWHERE"}</h3>
                    <p className="text-gray-600 font-medium">{(t.landing as any)?.platforms21 || "21+ Platforms"}</p>
                    <p className="text-sm text-gray-500 mt-1">{isSpanish ? 'Formato y tamaño perfecto para cada una' : 'Perfect format & size for each'}</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="text-center">
                    <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full text-white font-bold text-lg shadow-lg">
                      <Zap className="h-5 w-5 mr-2" />
                      {(t.landing as any)?.instantly || "INSTANTLY"}
                    </div>
                    <p className="text-gray-600 font-medium mt-2">{(t.landing as any)?.instantLaunch || "Instant Launch"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-lg font-semibold text-brand-700 mb-4">{(t.landing as any)?.uniqueDifferentiator || "This is what makes LeadBoost unique"}</p>
            </div>
            
            <div className="space-y-6 sm:space-y-0 sm:space-x-6 sm:flex sm:justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-bold shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-waterfall-demo"
              >
                <Sparkles className="mr-3 h-6 w-6" />
                {t.landing?.waterfallDemo || "Try the Waterfall System"}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-12 py-4 text-xl font-bold border-2 border-brand-300 hover:bg-brand-50" 
                data-testid="button-see-how-it-works"
              >
                {t.landing?.learnMore || "See How It Works"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Features - Supporting the Waterfall */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {isSpanish ? "El Sistema Waterfall incluye todo lo necesario" : "The Waterfall System includes everything you need"}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isSpanish ? "Además del sistema central Waterfall, LeadBoost te da herramientas completas para gestionar todo desde un solo lugar." : "Beyond the core Waterfall system, LeudBoost gives you complete tools to manage everything from one place."}
            </p>
          </div>
          
          {/* Language Toggle Button */}
          <div className="flex justify-center mb-12">
            <Button 
              variant="outline" 
              onClick={toggleLanguage}
              className="font-medium"
              data-testid="button-language-toggle"
            >
              {isSpanish ? '🇺🇸 English' : '🇪🇸 Español'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Unified Inbox */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{isSpanish ? "Bandeja Unificada" : "Unified Inbox"}</CardTitle>
                <CardDescription>
                  {isSpanish ? "Gestiona mensajes de Instagram, WhatsApp, Email y TikTok en un solo lugar. Nunca pierdas un lead otra vez." : "Manage messages from Instagram, WhatsApp, Email, and TikTok in one place. Never miss a lead again."}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Content Planner */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>{isSpanish ? "Planificador Mensual IA" : "AI Monthly Planner"}</CardTitle>
                <CardDescription>
                  {isSpanish ? "La IA analiza los datos de tu negocio para crear estrategias completas de contenido mensual con horarios óptimos de publicación." : "AI analyzes your business data to create complete monthly content strategies with optimal posting times."}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Analytics Dashboard */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Track performance across all platforms and see how social media impacts your business revenue.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Team Collaboration */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Assign messages, approve AI-generated content, and collaborate on campaigns with your team.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Automated Posting */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Automated Campaigns</CardTitle>
                <CardDescription>
                  Schedule and auto-publish content across all platforms. AI optimizes timing for maximum engagement.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Enterprise Security */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Secure authentication, team permissions, and data protection for business-grade social media management.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-brand-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your social media management?
          </h2>
          <p className="text-xl text-primary/30 mb-8">
            Join thousands of businesses using AI to grow their social media presence and customer engagement.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta"
          >
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
