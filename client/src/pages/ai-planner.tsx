import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { translations, industriesSpanish, seasonsSpanish, getTranslation } from "@/lib/translations";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Bot, Calendar, Lightbulb, RefreshCw, Sparkles, TrendingUp, Users, Video, BarChart3, Instagram, Brain, Zap, Target, Wand2, Star, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPlan {
  id: string;
  title: string;
  month: number;
  year: number;
  strategy: string;
  insights: {
    insights: string[];
    recommendations: string[];
    posts: Array<{
      date: string;
      platform: string;
      contentType: string;
      title: string;
      description: string;
      hashtags: string[];
      optimalTime: string;
    }>;
  };
  status: "draft" | "approved" | "published";
  createdAt: string;
}

interface BusinessData {
  industry: string;
  topProducts: string[];
  salesData?: any;
  customerInsights?: any;
  seasonality: string;
}

const platformColors = {
  instagram: "bg-pink-100 text-pink-800",
  whatsapp: "bg-green-100 text-green-800",
  tiktok: "bg-purple-100 text-purple-800",
  email: "bg-blue-100 text-blue-800",
  multi: "bg-red-100 text-red-800",
};

const industries = [
  "Retail & E-commerce",
  "Food & Beverage",
  "Beauty & Cosmetics",
  "Fashion & Apparel",
  "Health & Fitness",
  "Technology",
  "Professional Services",
  "Real Estate",
  "Travel & Tourism",
  "Education",
  "Other"
];

const seasons = [
  "Q1 - New Year & Spring",
  "Q2 - Spring & Summer",
  "Q3 - Summer & Back to School", 
  "Q4 - Fall & Holiday Season"
];

export default function AIPlanner() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const queryClient = useQueryClient();
  const t = translations[language];
  
  const [businessData, setBusinessData] = useState<BusinessData>({
    industry: "",
    topProducts: [],
    seasonality: "",
  });
  const [newProduct, setNewProduct] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized", 
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: contentPlans, isLoading: plansLoading } = useQuery<ContentPlan[]>({
    queryKey: ["/api/content-plans"],
    retry: false,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/content-plans/generate", {
        month: selectedMonth,
        year: selectedYear,
        businessData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-plans"] });
      toast({
        title: "Success",
        description: "AI content plan generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addProduct = () => {
    if (newProduct.trim() && !businessData.topProducts.includes(newProduct.trim())) {
      setBusinessData(prev => ({
        ...prev,
        topProducts: [...prev.topProducts, newProduct.trim()]
      }));
      setNewProduct("");
    }
  };

  const removeProduct = (product: string) => {
    setBusinessData(prev => ({
      ...prev,
      topProducts: prev.topProducts.filter(p => p !== product)
    }));
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const currentPlan = contentPlans?.find(plan => 
    plan.month === selectedMonth && plan.year === selectedYear
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="flex-1 flex items-center">
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-ai-planner-title">{t.aiPlanner.title}</h1>
              <Badge className="ml-3 bg-amber-100 text-amber-800">
                <Bot className="mr-1 h-3 w-3" />
                {t.common.aiPowered}
              </Badge>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleLanguage}
                className="font-medium"
                data-testid="button-language-toggle"
              >
                {isSpanish ? '🇺🇸 English' : '🇪🇸 Español'}
              </Button>
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* AI Planner Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Brain className="mr-2 h-4 w-4" />
                  {t.aiPlanner.poweredByAI}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.aiPlanner.heroTitle}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {t.aiPlanner.heroSubtitle}
                </p>
              </div>
            </div>
          </div>
          
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              <Tabs defaultValue="generator" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generator" data-testid="tab-generator">{t.aiPlanner.contentGenerator}</TabsTrigger>
                  <TabsTrigger value="plans" data-testid="tab-plans">{t.aiPlanner.existingPlans}</TabsTrigger>
                  <TabsTrigger value="insights" data-testid="tab-insights">{t.aiPlanner.aiInsights}</TabsTrigger>
                </TabsList>

                {/* Content Generator Tab */}
                <TabsContent value="generator" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Business Data Input */}
                    <div className="lg:col-span-2">
                      <Card className="border-2 border-amber-100 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-amber-100 p-2 rounded-lg mr-3">
                              <Sparkles className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-semibold">{t.aiPlanner.businessDataInput}</div>
                              <div className="text-sm text-gray-600 font-normal">{t.aiPlanner.businessDataSubtitle}</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          
                          {/* Industry Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="industry">{t.aiPlanner.industry}</Label>
                            <Select 
                              value={businessData.industry} 
                              onValueChange={(value) => setBusinessData(prev => ({ ...prev, industry: value }))}
                            >
                              <SelectTrigger data-testid="select-industry">
                                <SelectValue placeholder={t.aiPlanner.industryPlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {(isSpanish ? industriesSpanish : industries).map((industry) => (
                                  <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Top Products */}
                          <div className="space-y-2">
                            <Label>{t.aiPlanner.topProducts}</Label>
                            <div className="flex space-x-2">
                              <Input
                                placeholder={t.aiPlanner.productPlaceholder}
                                value={newProduct}
                                onChange={(e) => setNewProduct(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && addProduct()}
                                data-testid="input-new-product"
                              />
                              <Button onClick={addProduct} data-testid="button-add-product">{t.aiPlanner.addButton}</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {businessData.topProducts.map((product) => (
                                <Badge 
                                  key={product} 
                                  variant="secondary" 
                                  className="cursor-pointer hover:bg-red-100"
                                  onClick={() => removeProduct(product)}
                                  data-testid={`product-${product}`}
                                >
                                  {product} ×
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Seasonality */}
                          <div className="space-y-2">
                            <Label htmlFor="seasonality">{t.aiPlanner.seasonalFocus}</Label>
                            <Select 
                              value={businessData.seasonality} 
                              onValueChange={(value) => setBusinessData(prev => ({ ...prev, seasonality: value }))}
                            >
                              <SelectTrigger data-testid="select-seasonality">
                                <SelectValue placeholder={t.aiPlanner.seasonalPlaceholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {(isSpanish ? seasonsSpanish : seasons).map((season) => (
                                  <SelectItem key={season} value={season}>{season}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Month/Year Selection */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t.aiPlanner.month}</Label>
                              <Select 
                                value={selectedMonth.toString()} 
                                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                              >
                                <SelectTrigger data-testid="select-month">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>{t.aiPlanner.year}</Label>
                              <Select 
                                value={selectedYear.toString()} 
                                onValueChange={(value) => setSelectedYear(parseInt(value))}
                              >
                                <SelectTrigger data-testid="select-year">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="2024">2024</SelectItem>
                                  <SelectItem value="2025">2025</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Generate Button */}
                          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200">
                            <div className="flex items-center mb-3">
                              <Wand2 className="h-5 w-5 text-amber-600 mr-2" />
                              <span className="text-sm font-medium text-amber-900">{t.aiPlanner.readyToGenerate}</span>
                            </div>
                            <Button
                              onClick={() => generatePlanMutation.mutate()}
                              disabled={generatePlanMutation.isPending || !businessData.industry}
                              className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium py-3 text-lg shadow-md"
                              data-testid="button-generate-plan"
                            >
                              {generatePlanMutation.isPending ? (
                                <>
                                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                  <span>{t.aiPlanner.generatingText}</span>
                                </>
                              ) : (
                                <>
                                  <Brain className="mr-2 h-5 w-5" />
                                  <span>{t.aiPlanner.generateButton}</span>
                                  <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                              )}
                            </Button>
                            {!businessData.industry && (
                              <p className="text-xs text-amber-700 mt-2 text-center">
                                {t.aiPlanner.selectIndustryHint}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Preview */}
                    <div>
                      <Card className="border-2 border-blue-100 shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                              <Brain className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-semibold">{t.aiPlanner.aiStrategyPreview}</div>
                              <div className="text-sm text-gray-600 font-normal">{t.aiPlanner.aiStrategySubtitle}</div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {currentPlan ? (
                            <div className="space-y-4">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center">
                                    <div className="bg-green-100 p-1.5 rounded-full mr-2">
                                      <Star className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-sm text-green-800 font-semibold">{t.aiPlanner.aiStrategyGenerated}</p>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">
                                    <Zap className="mr-1 h-3 w-3" />
                                    {t.common.aiPowered}
                                  </Badge>
                                </div>
                                <p className="text-sm text-green-700 font-medium">
                                  {currentPlan.insights?.posts?.length || 0} {t.aiPlanner.postsPlanned} {new Date(selectedYear, selectedMonth - 1).toLocaleString(isSpanish ? 'es' : 'en', { month: 'long', year: 'numeric' })}
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white/50 rounded p-2">
                                    <Target className="h-3 w-3 text-green-600 mb-1" />
                                    <div className="font-medium text-green-800">{t.aiPlanner.platformMix}</div>
                                    <div className="text-green-600">Instagram, TikTok, Email</div>
                                  </div>
                                  <div className="bg-white/50 rounded p-2">
                                    <TrendingUp className="h-3 w-3 text-green-600 mb-1" />
                                    <div className="font-medium text-green-800">{t.aiPlanner.optimization}</div>
                                    <div className="text-green-600">{t.aiPlanner.peakEngagement}</div>
                                  </div>
                                </div>
                              </div>
                              
                              {currentPlan.insights?.insights && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium">Key Insights:</h4>
                                  {currentPlan.insights.insights.slice(0, 2).map((insight, index) => (
                                    <p key={index} className="text-xs text-gray-600" data-testid={`preview-insight-${index}`}>
                                      • {insight}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-xl mb-4">
                                <Brain className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-800" data-testid="text-no-preview">
                                    {t.aiPlanner.noPreview}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {t.aiPlanner.completeProfile}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-2 text-xs text-gray-500">
                                <div className="flex items-center justify-center">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Content themes based on your industry
                                </div>
                                <div className="flex items-center justify-center">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Platform-optimized posting schedule
                                </div>
                                <div className="flex items-center justify-center">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Trending hashtags and keywords
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Existing Plans Tab */}
                <TabsContent value="plans" className="space-y-6">
                  {plansLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : contentPlans && contentPlans.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {contentPlans.map((plan) => (
                        <Card key={plan.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{plan.title}</CardTitle>
                              <Badge 
                                className={cn(
                                  plan.status === "approved" ? "bg-green-100 text-green-800" :
                                  plan.status === "published" ? "bg-blue-100 text-blue-800" :
                                  "bg-gray-100 text-gray-800"
                                )}
                                data-testid={`plan-status-${plan.id}`}
                              >
                                {plan.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(plan.year, plan.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="text-sm">
                                <span className="font-medium">{plan.insights?.posts?.length || 0}</span> posts planned
                              </div>
                              
                              {plan.insights?.insights && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">AI Insights:</h4>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {plan.insights.insights[0]}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(plan.createdAt).toLocaleDateString()}
                                </span>
                                <Button size="sm" variant="outline" data-testid={`button-view-plan-${plan.id}`}>
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-plans">
                          {t.aiPlanner.noPlanTitle}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {t.aiPlanner.noPlanText}
                        </p>
                        <Button 
                          onClick={() => {
                            // Switch to generator tab
                            const tab = document.querySelector('[data-state="active"][value="generator"]') as HTMLElement;
                            if (tab) tab.click();
                          }}
                          data-testid="button-create-first-plan"
                        >
                          {t.aiPlanner.createFirstPlan}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* AI Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Industry Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
                          {t.aiPlanner.industryTrends}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Video Content Dominance</p>
                              <p className="text-xs text-gray-600">Short-form videos see 2.5x higher engagement across all platforms</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Authentic Storytelling</p>
                              <p className="text-xs text-gray-600">Behind-the-scenes content drives 40% more customer trust</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Interactive Features</p>
                              <p className="text-xs text-gray-600">Polls, Q&As, and live sessions boost engagement by 65%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Best Practices */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="mr-2 h-5 w-5 text-blue-600" />
                          {t.aiPlanner.aiRecommendations}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Optimal Posting Times</p>
                              <p className="text-xs text-gray-600">Peak engagement: 6-8 PM on weekdays, 2-4 PM weekends</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Content Mix Strategy</p>
                              <p className="text-xs text-gray-600">70% educational, 20% promotional, 10% entertainment</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                            <div>
                              <p className="text-sm font-medium">Cross-Platform Synergy</p>
                              <p className="text-xs text-gray-600">Repurpose content with platform-specific adaptations</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Performance */}
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
                          Content Performance Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-pink-50 rounded-lg">
                            <Instagram className="mx-auto h-8 w-8 text-pink-500 mb-2" />
                            <p className="text-sm font-medium">Instagram</p>
                            <p className="text-xs text-gray-600">Visual storytelling performs best</p>
                            <p className="text-lg font-bold text-pink-600">85% engagement</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Video className="mx-auto h-8 w-8 text-purple-500 mb-2" />
                            <p className="text-sm font-medium">TikTok</p>
                            <p className="text-xs text-gray-600">Trending audio + content</p>
                            <p className="text-lg font-bold text-purple-600">92% reach</p>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <Users className="mx-auto h-8 w-8 text-green-500 mb-2" />
                            <p className="text-sm font-medium">WhatsApp</p>
                            <p className="text-xs text-gray-600">Direct customer support</p>
                            <p className="text-lg font-bold text-green-600">98% read rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
