import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { translations, industriesSpanish, seasonsSpanish, getTranslation } from "@/lib/translations";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
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
  email: "bg-primary/10 text-primary",
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
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="flex-1 flex items-center">
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-ai-planner-title">{t.aiPlanner.title}</h1>
              <Badge className="ml-3 bg-gradient-to-r from-brand-600 to-cyan-500 text-white">
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
          <div className="bg-gradient-to-br from-brand-600 via-brand-500 to-cyan-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-2xl"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative">
              <div className="text-center">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-bold mb-6 shadow-lg">
                  <Brain className="mr-2 h-5 w-5" />
                  {t.aiPlanner.poweredByAI}
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">{t.aiPlanner.heroTitle}</h2>
                <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                  {t.aiPlanner.heroSubtitle}
                </p>
                <div className="mt-8">
                  <Button 
                    size="lg" 
                    className="bg-white text-brand-600 hover:bg-white/90 px-8 py-4 text-lg font-bold shadow-xl rounded-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Zap className="mr-2 h-6 w-6" />
                    Start Planning Now
                  </Button>
                </div>
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
                      <Card className="border-2 border-brand-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardHeader className="bg-gradient-to-r from-brand-50 to-cyan-50 group-hover:from-brand-100 group-hover:to-cyan-100 transition-all duration-300">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-gradient-to-br from-brand-600 to-cyan-500 p-3 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-bold text-xl">{t.aiPlanner.businessDataInput}</div>
                              <div className="text-sm text-gray-600 font-medium">{t.aiPlanner.businessDataSubtitle}</div>
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

                          {/* POS Integration */}
                          <div className="space-y-4 bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border-2 border-emerald-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="bg-gradient-to-br from-emerald-600 to-green-600 p-2 rounded-lg mr-3">
                                  <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-gray-900 font-bold text-lg">{t.aiPlanner.posIntegration}</div>
                                  <div className="text-sm text-gray-600">{t.aiPlanner.posSubtitle}</div>
                                </div>
                              </div>
                              <Badge className="bg-red-100 text-red-700">
                                {t.aiPlanner.posDisconnected}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {t.aiPlanner.posDataHelp}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-square"
                              >
                                <div className="w-4 h-4 bg-emerald-600 rounded mr-2"></div>
                                {t.aiPlanner.connectSquare}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-shopify"
                              >
                                <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                                {t.aiPlanner.connectShopify}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-clover"
                              >
                                <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                                {t.aiPlanner.connectClover}
                              </Button>
                              <Button 
                                variant="outline" 
                                className="border-emerald-200 hover:bg-emerald-50 text-emerald-700"
                                data-testid="button-connect-other"
                              >
                                <Target className="w-4 h-4 mr-2" />
                                {t.aiPlanner.connectOther}
                              </Button>
                            </div>
                            
                            <div className="bg-white/70 rounded-lg p-4 border border-emerald-100">
                              <h4 className="text-sm font-bold text-gray-900 mb-2">{t.aiPlanner.aiPosInsights}</h4>
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">$0</div>
                                  <div className="text-gray-600">{t.aiPlanner.avgOrderValue}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">0%</div>
                                  <div className="text-gray-600">{t.aiPlanner.recurrencyRate}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-emerald-600 font-bold text-lg">--</div>
                                  <div className="text-gray-600">{t.aiPlanner.peakSalesHours}</div>
                                </div>
                              </div>
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
                          <div className="bg-gradient-to-r from-brand-50 to-cyan-50 p-6 rounded-xl border-2 border-brand-200 hover:border-brand-300 transition-colors duration-300">
                            <div className="flex items-center mb-4">
                              <Wand2 className="h-6 w-6 text-brand-600 mr-3" />
                              <span className="text-lg font-bold text-gray-900">{t.aiPlanner.readyToGenerate}</span>
                            </div>
                            <Button
                              onClick={() => generatePlanMutation.mutate()}
                              disabled={generatePlanMutation.isPending || !businessData.industry}
                              className="w-full bg-gradient-to-r from-brand-600 to-cyan-500 hover:from-brand-700 hover:to-cyan-600 text-white font-bold py-4 text-xl shadow-xl rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
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
                              <p className="text-sm text-brand-700 mt-3 text-center font-medium">
                                {t.aiPlanner.selectIndustryHint}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Preview */}
                    <div>
                      <Card className="border-2 border-brand-200 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardHeader className="bg-gradient-to-r from-brand-50 to-cyan-50 group-hover:from-brand-100 group-hover:to-cyan-100 transition-all duration-300">
                          <CardTitle className="flex items-center text-lg">
                            <div className="bg-gradient-to-br from-brand-600 to-cyan-500 p-3 rounded-xl mr-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="text-gray-900 font-bold text-xl">{t.aiPlanner.aiStrategyPreview}</div>
                              <div className="text-sm text-gray-600 font-medium">{t.aiPlanner.aiStrategySubtitle}</div>
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
                              <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl mb-4">
                                <Brain className="mx-auto h-12 w-12 text-primary mb-4" />
                                <div className="space-y-2">
                                  <p className="text-sm font-medium text-gray-800" data-testid="text-no-preview">
                                    {t.aiPlanner.noPreview}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {t.aiPlanner.completeProfile}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 gap-3 text-xs">
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Content themes based on your industry
                                </div>
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Platform-optimized posting schedule
                                </div>
                                <div className="flex items-center justify-center text-gray-500">
                                  <ChevronRight className="h-3 w-3 mr-1" />
                                  Trending hashtags and keywords
                                </div>
                                
                                {/* POS Enhancement Preview */}
                                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                  <div className="flex items-center mb-2">
                                    <BarChart3 className="h-4 w-4 text-emerald-600 mr-2" />
                                    <span className="text-emerald-700 font-bold text-sm">With POS Data Integration</span>
                                  </div>
                                  <div className="space-y-1 text-emerald-600">
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Campaigns based on best-selling products
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Peak sales hours for optimal posting
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Customer recurrency patterns analysis
                                    </div>
                                    <div className="flex items-center">
                                      <ChevronRight className="h-3 w-3 mr-1" />
                                      Profit margin-optimized promotions
                                    </div>
                                  </div>
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
                                  plan.status === "published" ? "bg-primary/10 text-primary" :
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
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
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
                          <Users className="mr-2 h-5 w-5 text-primary" />
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
    </div>
  );
}
