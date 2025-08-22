import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
import { Bell, Plus, Bot, Calendar as CalendarIcon, Send, Edit, Trash2, Instagram, Clock, Zap, Eye } from "lucide-react";
import { SiWhatsapp, SiTiktok } from "react-icons/si";
import { Mail } from "lucide-react";
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
    suggestedHashtags: string[];
    visualSuggestions: string[];
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
  { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
  { value: "whatsapp", label: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
  { value: "email", label: "Email", icon: Mail, color: "text-blue-500" },
  { value: "tiktok", label: "TikTok", icon: SiTiktok, color: "text-gray-800" },
];

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Campaigns() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  
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
        suggestedHashtags: [],
        visualSuggestions: [],
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
              <h1 className="ml-3 text-2xl font-bold text-gray-900" data-testid="text-campaigns-title">Campaigns</h1>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" data-testid="button-ai-generate">
                    <Bot className="mr-2 h-4 w-4" />
                    AI Generate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Bot className="mr-2 h-5 w-5 text-amber-600" />
                      AI Campaign Generator
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-prompt">Campaign Description</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="Describe what kind of campaign you want to create (e.g., 'Product launch for new fitness equipment targeting young professionals')"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        data-testid="textarea-ai-prompt"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Target Platforms</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {platformOptions.map((platform) => {
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
                    
                    <Button
                      onClick={() => generateAICampaignMutation.mutate()}
                      disabled={generateAICampaignMutation.isPending || !aiPrompt || selectedPlatforms.length === 0}
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      data-testid="button-generate-ai-campaign"
                    >
                      {generateAICampaignMutation.isPending ? "Generating..." : "Generate AI Campaign"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-brand-600 hover:bg-brand-700" data-testid="button-new-campaign">
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter campaign title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        data-testid="input-campaign-title"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your campaign"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        data-testid="textarea-campaign-description"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Campaign content (optional - will use description if empty)"
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        rows={3}
                        data-testid="textarea-campaign-content"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Platforms</Label>
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
                      <Label>Schedule (Optional)</Label>
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
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
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
                      {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
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
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              {/* Campaign Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900" data-testid="stat-total-campaigns">
                      {campaigns?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Total Campaigns</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600" data-testid="stat-scheduled-campaigns">
                      {campaigns?.filter(c => c.status === "scheduled").length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Scheduled</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600" data-testid="stat-published-campaigns">
                      {campaigns?.filter(c => c.status === "published").length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Published</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600" data-testid="stat-ai-campaigns">
                      {campaigns?.filter(c => c.aiGenerated).length || 0}
                    </div>
                    <div className="text-sm text-gray-500">AI Generated</div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                  <TabsTrigger value="draft" data-testid="tab-draft">Draft</TabsTrigger>
                  <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="published" data-testid="tab-published">Published</TabsTrigger>
                  <TabsTrigger value="ai" data-testid="tab-ai">AI Generated</TabsTrigger>
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
