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
          <Card className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <Zap className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.starter}</h3>
              </div>
              
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900">{t.pricing.free}</span>
                <div className="text-sm text-gray-500 font-medium mt-2">{isSpanish ? 'Perfecto para comenzar' : 'Perfect to get started'}</div>
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
              
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg" data-testid="button-starter-plan">
                {t.pricing.startFree}
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan - Most Popular */}
          <Card className="relative bg-white rounded-lg shadow-md border-2 border-brand-600 hover:shadow-lg transition-shadow duration-200">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-semibold shadow-lg">
                {t.pricing.mostPopular}
              </div>
            </div>
            
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center mr-4">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.professional}</h3>
              </div>
              
              <div className="mb-8">
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold text-gray-900">$79</span>
                  <span className="text-lg text-gray-600 ml-2">{t.pricing.perMonth}</span>
                </div>
                <div className="text-sm text-gray-500 font-medium">{isSpanish ? 'Recomendado para la mayoría' : 'Recommended for most businesses'}</div>
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
              
              <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg" data-testid="button-professional-plan">
                {t.pricing.startFreeTrial}
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.business}</h3>
              </div>
              
              <div className="mb-8">
                <span className="text-3xl font-bold text-gray-900">{t.pricing.businessTiered}</span>
                <div className="text-sm text-gray-500 font-medium mt-2">{isSpanish ? 'Soluciones empresariales' : 'Enterprise solutions'}</div>
              </div>
              
              <p className="text-gray-600 mb-6">{t.pricing.agencyDesc}</p>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4 text-base">{isSpanish ? 'Precios Escalonados' : 'Pricing Tiers'}</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-700">5 Brands</span>
                    <span className="font-semibold text-gray-900">$199/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-700">10 Brands</span>
                    <span className="font-semibold text-gray-900">$349/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100">
                    <span className="font-medium text-gray-700">20 Brands</span>
                    <span className="font-semibold text-gray-900">$599/mo</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg text-white">
                    <span className="font-medium">50+ Brands</span>
                    <span className="font-semibold">$999/mo</span>
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
              
              <Button className="w-full border border-gray-300 text-gray-900 hover:bg-gray-50 font-semibold py-3 rounded-lg" data-testid="button-agency-plan">
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
              className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-lg font-semibold text-lg"
              data-testid="button-free-trial"
            >
              {t.pricing.startYourTrial}
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