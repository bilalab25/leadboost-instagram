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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-brand-50">
      
      {/* Header */}
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            {t.pricing.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t.pricing.subtitle}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter Plan */}
          <Card className="relative p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-blue-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.starter}</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-black text-black">{t.pricing.free}</span>
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
              
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid="button-starter-plan">
                {t.pricing.startFree}
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan - Most Popular */}
          <Card className="relative p-8 border-2 border-brand-500 hover:shadow-lg transition-shadow duration-300 bg-white">
            {/* Most Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                {t.pricing.mostPopular}
              </span>
            </div>
            
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Crown className="h-8 w-8 text-brand-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.professional}</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-gray-500">{t.pricing.perMonth}</span>
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
              
              <Button className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white" data-testid="button-professional-plan">
                {t.pricing.startFreeTrial}
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="relative p-8 border border-gray-200 hover:shadow-lg transition-shadow duration-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-indigo-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">{t.pricing.agency}</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-2xl font-bold text-gray-900">{t.pricing.agencyTiered}</span>
              </div>
              
              <p className="text-gray-600 mb-6">{t.pricing.agencyDesc}</p>
              
              {/* Tiered Pricing */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Pricing Tiers:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>5 Brands</span>
                    <span className="font-semibold text-gray-900">$199/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>10 Brands</span>
                    <span className="font-semibold text-gray-900">$349/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>20 Brands</span>
                    <span className="font-semibold text-gray-900">$599/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>50+ Brands</span>
                    <span className="font-semibold text-gray-900">$999/mo</span>
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
              
              <Button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white" data-testid="button-agency-plan">
                {t.pricing.startTrial}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Free Trial CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t.pricing.freeTrialTitle}
            </h3>
            <p className="text-gray-600 mb-6">
              {t.pricing.freeTrialDesc}
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white px-8 py-3"
              data-testid="button-free-trial"
            >
              {t.pricing.startYourTrial}
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t.pricing.faqTitle}
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.pricing.faqQuestion1}
              </h3>
              <p className="text-gray-600">
                {t.pricing.faqAnswer1}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.pricing.faqQuestion3}
              </h3>
              <p className="text-gray-600">
                {t.pricing.faqAnswer3}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.pricing.faqQuestion2}
              </h3>
              <p className="text-gray-600">
                {t.pricing.faqAnswer2}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t.pricing.faqQuestion4}
              </h3>
              <p className="text-gray-600">
                {t.pricing.faqAnswer4}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}