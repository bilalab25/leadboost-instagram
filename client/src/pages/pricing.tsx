import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { useLanguage } from '@/hooks/useLanguage';
import { translations } from '@/lib/translations';

export default function Pricing() {
  const { language } = useLanguage();
  const isSpanish = language === 'es';
  const t = translations[language as keyof typeof translations];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-25 to-brand-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-brand-300/20 to-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-40 left-10 w-64 h-64 bg-gradient-to-br from-brand-400/15 to-brand-600/10 rounded-full blur-2xl"></div>
      
      {/* Header */}
      <div className="relative pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-6 leading-[0.88] tracking-tight">
            {t.pricing.title}
          </h1>
          <div className="text-2xl lg:text-3xl font-semibold text-brand-600 mb-8 tracking-wide">
            {isSpanish ? 'Elige Tu Plan Perfecto' : 'Choose Your Perfect Plan'}
          </div>
          <p className="text-lg lg:text-xl text-gray-600 max-w-4xl mx-auto mb-16 leading-relaxed font-normal">
            {t.pricing.subtitle}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Starter Plan */}
          <Card className="relative bg-white rounded-3xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8 lg:p-10">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900">{t.pricing.starter}</h3>
              </div>
              
              <div className="mb-8">
                <span className="text-6xl font-black text-emerald-600">{t.pricing.free}</span>
                <div className="text-lg text-gray-600 font-medium mt-2">{isSpanish ? 'Para empezar' : 'To get started'}</div>
              </div>
              
              <p className="text-gray-600 mb-6">{t.pricing.starterDesc}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.freeTool}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.platforms5}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.campaigns2}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.basicAnalytics}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.emailSupport}</span>
                </li>
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-200" data-testid="button-starter-plan">
                {t.pricing.startFree}
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan - Most Popular */}
          <Card className="relative bg-gradient-to-br from-white to-brand-25 rounded-3xl shadow-2xl border-2 border-brand-600 hover:shadow-3xl transition-all duration-300 transform scale-105 hover:scale-110">
            {/* Most Popular Badge */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 text-white px-8 py-3 rounded-2xl text-base font-black shadow-2xl">
                ⭐ {t.pricing.mostPopular}
              </div>
            </div>
            
            <CardContent className="p-8 lg:p-10">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center mr-4 shadow-2xl">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900">{t.pricing.professional}</h3>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline mb-2">
                  <span className="text-6xl font-black text-brand-600">$79</span>
                  <span className="text-xl text-gray-600 ml-2">{t.pricing.perMonth}</span>
                </div>
                <div className="text-lg text-brand-600 font-bold">{isSpanish ? 'Más Popular - Mejor Valor' : 'Most Popular - Best Value'}</div>
              </div>
              
              <p className="text-gray-600 mb-6">{t.pricing.professionalDesc}</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.everythingStarter}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.monthlyPlanner}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.unifiedInbox}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.platforms15}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.campaigns30}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.advancedAnalytics}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.brandStudio}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.prioritySupport}</span>
                </li>
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 text-white font-black py-4 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transition-all duration-200 transform hover:scale-105" data-testid="button-professional-plan">
                ⚡ {t.pricing.startFreeTrial}
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="relative bg-gradient-to-br from-white to-indigo-25 rounded-3xl shadow-lg border border-indigo-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-8 lg:p-10">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900">{t.pricing.agency}</h3>
              </div>
              
              <div className="mb-8">
                <span className="text-3xl font-black text-indigo-600">{t.pricing.agencyTiered}</span>
                <div className="text-lg text-gray-600 font-medium mt-2">{isSpanish ? 'Escala tu agencia' : 'Scale your agency'}</div>
              </div>
              
              <p className="text-gray-600 mb-6">{t.pricing.agencyDesc}</p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl mb-8 border border-indigo-100">
                <h4 className="font-black text-gray-900 mb-6 text-lg">{isSpanish ? 'Precios Escalonados' : 'Scaling Tiers'}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="font-semibold text-gray-700">5 Brands</span>
                    <span className="font-black text-indigo-600 text-lg">$199/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="font-semibold text-gray-700">10 Brands</span>
                    <span className="font-black text-indigo-600 text-lg">$349/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
                    <span className="font-semibold text-gray-700">20 Brands</span>
                    <span className="font-black text-indigo-600 text-lg">$599/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
                    <span className="font-bold">50+ Brands</span>
                    <span className="font-black text-xl">$999/mo</span>
                  </div>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.everythingProfessional}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.unlimitedTeamMembers}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.whitelabelDashboard}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.agencyReporting}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.clientAccessPortals}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.customBranding}</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>{t.pricing.dedicatedSupport}</span>
                </li>
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black py-4 rounded-2xl text-lg shadow-lg hover:shadow-xl transition-all duration-200" data-testid="button-agency-plan">
                {t.pricing.startTrial}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Social Proof + CTA Section */}
        <div className="text-center mt-20">
          {/* Statistics */}
          <div className="mb-16">
            <h3 className="text-3xl lg:text-4xl font-black text-gray-900 mb-12">
              {isSpanish ? 'Resultados que Hablan por Sí Solos' : 'Results That Speak for Themselves'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-brand-600 mb-2">10,000+</div>
                <p className="text-gray-600 font-medium">{isSpanish ? 'Empresas Activas' : 'Active Businesses'}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-emerald-600 mb-2">250M+</div>
                <p className="text-gray-600 font-medium">{isSpanish ? 'Citas Programadas' : 'Appointments Booked'}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-purple-600 mb-2">40%</div>
                <p className="text-gray-600 font-medium">{isSpanish ? 'Aumento en Conversión' : 'Increase in Conversions'}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-orange-600 mb-2">24/7</div>
                <p className="text-gray-600 font-medium">{isSpanish ? 'IA Trabajando' : 'AI Working'}</p>
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="bg-gradient-to-br from-white to-brand-25 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl border border-brand-100">
            <h3 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-8">
              {t.pricing.freeTrialTitle}
            </h3>
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t.pricing.freeTrialDesc}
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 hover:from-brand-700 hover:via-brand-800 hover:to-brand-900 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              data-testid="button-free-trial"
            >
              ⚡ {t.pricing.startYourTrial}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-32">
          <h2 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 text-center mb-20">
            {t.pricing.faqTitle}
          </h2>
          
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-white to-brand-25 rounded-2xl p-10 shadow-lg border border-brand-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                {t.pricing.faqQuestion1}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.pricing.faqAnswer1}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-brand-25 rounded-2xl p-10 shadow-lg border border-brand-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                {t.pricing.faqQuestion3}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.pricing.faqAnswer3}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-brand-25 rounded-2xl p-10 shadow-lg border border-brand-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                {t.pricing.faqQuestion2}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.pricing.faqAnswer2}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-brand-25 rounded-2xl p-10 shadow-lg border border-brand-100 hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-black text-gray-900 mb-4">
                {t.pricing.faqQuestion4}
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                {t.pricing.faqAnswer4}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}