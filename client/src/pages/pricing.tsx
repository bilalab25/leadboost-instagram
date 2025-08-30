import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Zap, Crown, Rocket } from "lucide-react";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-brand-50">
      
      {/* Header */}
      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-brand-600 to-gray-900 mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business. All plans include our revolutionary CampAIgner tool.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter Plan */}
          <Card className="relative p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Zap className="h-8 w-8 text-blue-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-black text-green-600">FREE</span>
                <span className="text-gray-500">forever</span>
              </div>
              
              <p className="text-gray-600 mb-6">Perfect for small businesses and solo entrepreneurs</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Free CampAIgner tool</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>5 social platforms</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>2 campaigns per month</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Basic analytics</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Email support</span>
                </li>
              </ul>
              
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white" data-testid="button-starter-plan">
                Start Free
              </Button>
            </CardContent>
          </Card>

          {/* Professional Plan - Most Popular */}
          <Card className="relative p-8 border-2 border-brand-500 hover:shadow-2xl transition-all duration-300 scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                MOST POPULAR
              </span>
            </div>
            
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Crown className="h-8 w-8 text-brand-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Professional</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900">$79</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <p className="text-gray-600 mb-6">Ideal for growing businesses and marketing teams</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Everything in Starter</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Monthly Planner (AI strategy tool)</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unified Inbox (message management)</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>15+ social platforms</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Unlimited campaigns</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Advanced analytics & reports</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Brand Studio access</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Priority support</span>
                </li>
              </ul>
              
              <Button className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white" data-testid="button-professional-plan">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>

          {/* Agency Plan */}
          <Card className="relative p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center mb-4">
                <Rocket className="h-8 w-8 text-purple-500 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Agency</h3>
              </div>
              
              <div className="mb-6">
                <span className="text-4xl font-black text-gray-900">$149</span>
                <span className="text-gray-500">/month</span>
              </div>
              
              <p className="text-gray-600 mb-6">Built for agencies and large marketing teams</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Advanced Monthly Planner</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Premium Unified Inbox</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>21+ social platforms</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>White-label reports</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Team collaboration</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
              
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" data-testid="button-agency-plan">
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Free Trial CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 max-w-2xl mx-auto shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Try Any Plan Free for 30 Days
            </h3>
            <p className="text-gray-600 mb-6">
              No credit card required. Cancel anytime. Experience the full power of our platform.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white px-8 py-3"
              data-testid="button-free-trial"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What's included in the free trial?
              </h3>
              <p className="text-gray-600">
                Full access to all features for 30 days. No credit card required, no hidden fees.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What platforms does CampAIgner support?
              </h3>
              <p className="text-gray-600">
                Instagram, TikTok, Facebook, WhatsApp, LinkedIn, YouTube, Twitter, Pinterest, and 13+ more platforms with perfect formatting for each.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600">
                No setup fees, no hidden costs. Just simple monthly pricing with everything included.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}