import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield, ArrowDown, ArrowRight, Sparkles, Target, Globe, TrendingUp, Play, Volume2, Settings, Maximize, Palette, Video, Mail, ChevronDown, Calendar, Compass, Rocket, HelpCircle, X, Send, FileQuestion, Crown, Star, CheckCircle, Heart, Share2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiFacebook, SiWhatsapp, SiLinkedin, SiYoutube, SiX, SiGmail, SiWix, SiShopify, SiZapier, SiQuickbooks, SiSquare, SiStripe } from "react-icons/si";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/translations";
import { AIChatbot } from "@/components/AIChatbot";
import { CountdownTimer } from "@/components/CountdownTimer";
import { FAQ } from "@/components/FAQ";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { ReferralProgram } from "@/components/ReferralProgram";
import { OnboardingProgress } from "@/components/OnboardingProgress";
import leadBoostLogo from "@assets/Lead Boost (500 x 200 px) (500 x 160 px)_1756873932398.png";

export default function Landing() {
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100 relative overflow-hidden">
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center">
              <img 
                src={leadBoostLogo} 
                alt="LeadBoost Logo" 
                className="h-12 w-auto object-contain brightness-110" 
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100/30 px-2 py-1 transition-all duration-200 rounded-md border border-gray-200/50 hover:border-brand-300/70"
              data-testid="button-language-toggle"
            >
              {isSpanish ? 'EN' : 'ES'}
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Generador de Campañas IA' : 'AI Campaign Generator'}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {isSpanish 
                ? 'Crea campañas para 21+ plataformas en un clic con nuestra IA.'
                : 'Create campaigns for 21+ platforms in one click with our AI.'
              }
            </p>
            
            <div className="mt-8">
              <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3">
                <Crown className="h-5 w-5 mr-2" />
                {isSpanish ? 'Empezar Ahora' : 'Get Started'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <FAQ isSpanish={isSpanish} />
    </div>
  );
}