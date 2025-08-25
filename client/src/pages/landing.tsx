import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Bot, BarChart3, Users, Zap, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-brand-500 rounded-lg flex items-center justify-center mr-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">SocialHub</h1>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The AI-powered social media management platform that unifies all your customer communications 
              and creates intelligent content strategies from your business data.
            </p>
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                size="lg" 
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                Get Started
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage social media</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect all your social accounts, manage conversations, and let AI create your content strategy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Unified Inbox */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Unified Inbox</CardTitle>
                <CardDescription>
                  Manage messages from Instagram, WhatsApp, Email, and TikTok in one place. Never miss a lead again.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* AI Content Planner */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle>AI Monthly Planner</CardTitle>
                <CardDescription>
                  AI analyzes your business data to create complete monthly content strategies with optimal posting times.
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
