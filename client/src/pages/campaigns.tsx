import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/useLanguage";
import { translations, platformOptionsSpanish } from "@/lib/translations";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Plus, Bot, Calendar as CalendarIcon, Send, Edit, Trash2, Instagram, Clock, Zap, Eye, MessageSquare, Users, Mail, Twitter, Youtube, FileText, Brain, Wand2, Star, Target, TrendingUp, Sparkles, ArrowRight, Play, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { SiWhatsapp, SiTiktok, SiLinkedin, SiThreads, SiFacebook, SiPinterest, SiReddit, SiDiscord, SiSnapchat, SiMedium } from "react-icons/si";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Campaign {
  id: string;
  title: string;
  description: string;
  platforms: string[];
  content: {
    content: string;
    variations: { [platform: string]: string };
    suggestedHashtags: { [platform: string]: string[] };
    visualSuggestions: { [platform: string]: string[] };
  };
  scheduledFor?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  aiGenerated: boolean;
  performance?: {
    reach: number;
    engagement: number;
    clicks: number;
  };
  createdAt: string;
}

const platformOptions = [
  { value: "instagram", label: "Instagram Posts", icon: Instagram, color: "text-pink-500" },
  { value: "instagram_story", label: "Instagram Story", icon: Instagram, color: "text-purple-500" },
  { value: "instagram_reels", label: "Instagram Reels", icon: Instagram, color: "text-red-500" },
  { value: "facebook", label: "Facebook Posts", icon: SiFacebook, color: "text-primary" },
  { value: "facebook_story", label: "Facebook Stories", icon: SiFacebook, color: "text-primary" },
  { value: "linkedin", label: "LinkedIn Posts", icon: SiLinkedin, color: "text-primary" },
  { value: "linkedin_newsletter", label: "LinkedIn Newsletter", icon: SiLinkedin, color: "text-primary" },
  { value: "linkedin_thread", label: "LinkedIn Thread", icon: SiLinkedin, color: "text-primary" },
  { value: "threads", label: "Threads", icon: SiThreads, color: "text-gray-900" },
  { value: "x", label: "X (Twitter)", icon: Twitter, color: "text-gray-900" },
  { value: "tiktok", label: "TikTok", icon: SiTiktok, color: "text-gray-800" },
  { value: "youtube", label: "YouTube Description", icon: Youtube, color: "text-red-600" },
  { value: "youtube_shorts", label: "YouTube Shorts", icon: Youtube, color: "text-red-500" },
  { value: "pinterest", label: "Pinterest", icon: SiPinterest, color: "text-red-600" },
  { value: "reddit", label: "Reddit", icon: SiReddit, color: "text-orange-600" },
  { value: "discord", label: "Discord", icon: SiDiscord, color: "text-indigo-600" },
  { value: "snapchat", label: "Snapchat", icon: SiSnapchat, color: "text-yellow-400" },
  { value: "medium", label: "Medium", icon: SiMedium, color: "text-gray-900" },
  { value: "blog", label: "Blog Posts", icon: FileText, color: "text-gray-700" },
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
  { value: "email", label: "Gmail/Email", icon: Mail, color: "text-primary" },
];

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-primary/10 text-primary",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Campaigns() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { language, toggleLanguage, isSpanish } = useLanguage();
  const queryClient = useQueryClient();
  const t = translations[language];
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
  });
  const [aiPrompt, setAiPrompt] = useState("");

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

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    retry: false,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: any) => {
      const response = await apiRequest("POST", "/api/campaigns", campaignData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Campaign created successfully!",
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

  const generateAICampaignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/campaigns/generate", {
        prompt: aiPrompt,
        platforms: selectedPlatforms,
        businessContext: "Professional social media management platform",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setIsAIDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "AI campaign generated successfully!",
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

  const publishCampaignMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/publish`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Success",
        description: "Campaign published successfully!",
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

  const resetForm = () => {
    setFormData({ title: "", description: "", content: "" });
    setSelectedPlatforms([]);
    setScheduledDate(undefined);
    setAiPrompt("");
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleCreateCampaign = () => {
    if (!formData.title || !formData.description || selectedPlatforms.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select at least one platform",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate({
      title: formData.title,
      description: formData.description,
      platforms: selectedPlatforms,
      content: {
        content: formData.content || formData.description,
        variations: {},
        suggestedHashtags: {},
        visualSuggestions: {},
      },
      scheduledFor: scheduledDate?.toISOString(),
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <div className="flex-1 px-4 flex justify-between sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
            <div className="flex-1 flex items-center">
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-campaigns-title">{t.campaigns.title}</h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleLanguage}
                className="font-medium"
                data-testid="button-language-toggle-campaigns"
              >
                {isSpanish ? '🇺🇸 English' : '🇪🇸 Español'}
              </Button>
              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100 font-medium shadow-sm" data-testid="button-ai-generate">
                    <Brain className="mr-2 h-4 w-4" />
                    <span>{t.campaigns.aiGenerate}</span>
                    <Sparkles className="ml-1 h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader className="text-center pb-4">
                    <div className="mx-auto bg-gradient-to-br from-amber-100 to-yellow-100 p-3 rounded-full w-fit mb-3">
                      <Brain className="h-8 w-8 text-amber-600" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {t.campaigns.aiCampaignGenerator}
                    </DialogTitle>
                    <p className="text-sm text-gray-600">
                      {t.campaigns.aiCampaignSubtitle}
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-prompt">{t.campaigns.campaignDescription}</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder={t.campaigns.campaignPlaceholder}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        data-testid="textarea-ai-prompt"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-base font-medium">{t.campaigns.targetPlatforms}</Label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-3">{t.campaigns.platformsHint}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(isSpanish ? platformOptionsSpanish : platformOptions).map((platform) => {
                            const Icon = platform.icon;
                            return (
                              <div key={platform.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`ai-${platform.value}`}
                                  checked={selectedPlatforms.includes(platform.value)}
                                  onCheckedChange={() => handlePlatformToggle(platform.value)}
                                  data-testid={`checkbox-ai-${platform.value}`}
                                />
                                <Label 
                                  htmlFor={`ai-${platform.value}`} 
                                  className="flex items-center cursor-pointer"
                                >
                                  <Icon className={cn("mr-2 h-4 w-4", platform.color)} />
                                  {platform.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200 mt-2">
                      <div className="flex items-center mb-3">
                        <Wand2 className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-sm font-medium text-amber-900">{t.campaigns.aiWillCreate}</span>
                      </div>
                      <Button
                        onClick={() => generateAICampaignMutation.mutate()}
                        disabled={generateAICampaignMutation.isPending || !aiPrompt || selectedPlatforms.length === 0}
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-medium py-3 shadow-md"
                        data-testid="button-generate-ai-campaign"
                      >
                        {generateAICampaignMutation.isPending ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            <span>{t.campaigns.aiCreating}</span>
                          </>
                        ) : (
                          <>
                            <Brain className="mr-2 h-4 w-4" />
                            <span>{t.campaigns.generateAICampaign}</span>
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-brand-600 hover:bg-brand-700" data-testid="button-new-campaign">
                    <Plus className="mr-2 h-4 w-4" />
                    {t.campaigns.newCampaign}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{t.campaigns.createCampaign}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t.campaigns.campaignTitle}</Label>
                      <Input
                        id="title"
                        placeholder={t.campaigns.titlePlaceholder}
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        data-testid="input-campaign-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">{t.campaigns.description}</Label>
                      <Textarea
                        id="description"
                        placeholder={t.campaigns.descriptionPlaceholder}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        data-testid="textarea-campaign-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">{t.campaigns.content}</Label>
                      <Textarea
                        id="content"
                        placeholder={t.campaigns.contentPlaceholder}
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        data-testid="textarea-campaign-content"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t.campaigns.platforms}</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {platformOptions.map((platform) => {
                          const Icon = platform.icon;
                          return (
                            <div key={platform.value} className="flex items-center space-x-2">
                              <Checkbox
                                id={platform.value}
                                checked={selectedPlatforms.includes(platform.value)}
                                onCheckedChange={() => handlePlatformToggle(platform.value)}
                                data-testid={`checkbox-${platform.value}`}
                              />
                              <Label 
                                htmlFor={platform.value} 
                                className="flex items-center cursor-pointer"
                              >
                                <Icon className={cn("mr-2 h-4 w-4", platform.color)} />
                                {platform.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t.campaigns.scheduleOptional}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                            data-testid="button-schedule-date"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : t.campaigns.pickDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <Button
                      onClick={handleCreateCampaign}
                      disabled={createCampaignMutation.isPending}
                      className="w-full"
                      data-testid="button-create-campaign"
                    >
                      {createCampaignMutation.isPending ? t.campaigns.creating : t.campaigns.createCampaign}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="ghost" size="icon" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Campaigns Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
                  <Zap className="mr-2 h-4 w-4" />
                  {t.campaigns.multiPlatformPublishing}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.campaigns.heroTitle}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {t.campaigns.heroSubtitle}
                </p>
              </div>
            </div>
          </div>
          
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Campaign Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary" data-testid="stat-total-campaigns">
                      {campaigns?.length || 0}
                    </div>
                    <div className="text-sm text-primary font-medium">{t.campaigns.totalCampaigns}</div>
                  </CardContent>
                </Card>
                <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-5 w-5 text-indigo-600 mr-1" />
                      <div className="text-2xl font-bold text-indigo-900" data-testid="stat-scheduled-campaigns">
                        {campaigns?.filter(c => c.status === "scheduled").length || 0}
                      </div>
                    </div>
                    <div className="text-sm text-indigo-600 font-medium">{t.campaigns.scheduled}</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                      <div className="text-2xl font-bold text-green-900" data-testid="stat-published-campaigns">
                        {campaigns?.filter(c => c.status === "published").length || 0}
                      </div>
                    </div>
                    <div className="text-sm text-green-600 font-medium">{t.campaigns.published}</div>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Brain className="h-5 w-5 text-amber-600 mr-1" />
                      <div className="text-2xl font-bold text-amber-900" data-testid="stat-ai-campaigns">
                        {campaigns?.filter(c => c.aiGenerated).length || 0}
                      </div>
                    </div>
                    <div className="text-sm text-amber-600 font-medium">{t.campaigns.aiGenerated}</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all" data-testid="tab-all">{t.campaigns.all}</TabsTrigger>
                  <TabsTrigger value="draft" data-testid="tab-draft">{t.campaigns.draft}</TabsTrigger>
                  <TabsTrigger value="scheduled" data-testid="tab-scheduled">{t.campaigns.scheduled}</TabsTrigger>
                  <TabsTrigger value="published" data-testid="tab-published">{t.campaigns.published}</TabsTrigger>
                  <TabsTrigger value="ai" data-testid="tab-ai">{t.campaigns.aiGenerated}</TabsTrigger>
                </TabsList>

                {/* All Campaigns */}
                <TabsContent value="all" className="space-y-6">
                  {campaignsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i}>
                          <CardHeader>
                            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="h-3 bg-gray-100 rounded animate-pulse"></div>
                              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : campaigns && campaigns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg flex items-center">
                                {campaign.aiGenerated && (
                                  <Bot className="mr-2 h-4 w-4 text-amber-600" />
                                )}
                                {campaign.title}
                              </CardTitle>
                              <Badge 
                                className={statusColors[campaign.status as keyof typeof statusColors]}
                                data-testid={`campaign-status-${campaign.id}`}
                              >
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {campaign.description}
                            </p>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {/* Platforms */}
                              <div className="flex flex-wrap gap-2">
                                {campaign.platforms.map((platform) => {
                                  const platformOption = platformOptions.find(p => p.value === platform);
                                  const Icon = platformOption?.icon;
                                  
                                  return (
                                    <Badge key={platform} variant="outline" className="flex items-center">
                                      {Icon && <Icon className={cn("mr-1 h-3 w-3", platformOption.color)} />}
                                      {platformOption?.label || platform}
                                    </Badge>
                                  );
                                })}
                              </div>
                              
                              {/* Performance */}
                              {campaign.performance && (
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div>
                                    <p className="text-sm font-medium" data-testid={`campaign-reach-${campaign.id}`}>
                                      {(campaign.performance.reach / 1000).toFixed(1)}K
                                    </p>
                                    <p className="text-xs text-gray-500">Reach</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium" data-testid={`campaign-engagement-${campaign.id}`}>
                                      {campaign.performance.engagement}
                                    </p>
                                    <p className="text-xs text-gray-500">Engagement</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium" data-testid={`campaign-clicks-${campaign.id}`}>
                                      {campaign.performance.clicks}
                                    </p>
                                    <p className="text-xs text-gray-500">Clicks</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Schedule Info */}
                              {campaign.scheduledFor && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="mr-1 h-3 w-3" />
                                  Scheduled for {new Date(campaign.scheduledFor).toLocaleDateString()}
                                </div>
                              )}
                              
                              {/* Actions */}
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(campaign.createdAt).toLocaleDateString()}
                                </span>
                                <div className="flex space-x-2">
                                  {campaign.status === "draft" && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => publishCampaignMutation.mutate(campaign.id)}
                                      disabled={publishCampaignMutation.isPending}
                                      data-testid={`button-publish-${campaign.id}`}
                                    >
                                      <Send className="mr-1 h-3 w-3" />
                                      Publish
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" data-testid={`button-view-${campaign.id}`}>
                                    <Eye className="mr-1 h-3 w-3" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-campaigns">
                          No campaigns yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Create your first campaign to start engaging with your audience.
                        </p>
                        <div className="flex justify-center space-x-4">
                          <Button 
                            onClick={() => setIsCreateDialogOpen(true)}
                            data-testid="button-create-first-campaign"
                          >
                            Create Campaign
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setIsAIDialogOpen(true)}
                            className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            data-testid="button-ai-first-campaign"
                          >
                            <Bot className="mr-2 h-4 w-4" />
                            AI Generate
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Status-specific tabs */}
                {["draft", "scheduled", "published", "ai"].map((status) => (
                  <TabsContent key={status} value={status}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {campaigns
                        ?.filter(campaign => 
                          status === "ai" ? campaign.aiGenerated : campaign.status === status
                        )
                        .map((campaign) => (
                          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-lg flex items-center">
                                  {campaign.aiGenerated && (
                                    <Bot className="mr-2 h-4 w-4 text-amber-600" />
                                  )}
                                  {campaign.title}
                                </CardTitle>
                                <Badge 
                                  className={statusColors[campaign.status as keyof typeof statusColors]}
                                  data-testid={`filtered-campaign-status-${campaign.id}`}
                                >
                                  {campaign.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {campaign.description}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                  {campaign.platforms.map((platform) => {
                                    const platformOption = platformOptions.find(p => p.value === platform);
                                    const Icon = platformOption?.icon;
                                    
                                    return (
                                      <Badge key={platform} variant="outline" className="flex items-center">
                                        {Icon && <Icon className={cn("mr-1 h-3 w-3", platformOption.color)} />}
                                        {platformOption?.label || platform}
                                      </Badge>
                                    );
                                  })}
                                </div>
                                
                                <div className="flex justify-between items-center pt-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(campaign.createdAt).toLocaleDateString()}
                                  </span>
                                  <Button size="sm" variant="outline" data-testid={`button-filtered-view-${campaign.id}`}>
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )) || (
                        <Card className="text-center py-12 col-span-full">
                          <CardContent>
                            <p className="text-gray-600" data-testid={`text-no-${status}-campaigns`}>
                              No {status === "ai" ? "AI generated" : status} campaigns found.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
