import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, RefreshCw, ChartBar, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPlan {
  id: string;
  title: string;
  month: number;
  year: number;
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

const platformColors = {
  instagram: "bg-primary/10 text-primary",
  whatsapp: "bg-green-100 text-green-800", 
  tiktok: "bg-purple-100 text-purple-800",
  email: "bg-yellow-100 text-yellow-800",
  multi: "bg-red-100 text-red-800",
};

const platformAbbrevations = {
  instagram: "IG",
  whatsapp: "WA", 
  tiktok: "TT",
  email: "Email",
  multi: "Multi",
};

export default function ContentCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: contentPlans, isLoading } = useQuery<ContentPlan[]>({
    queryKey: ["/api/content-plans"],
    retry: false,
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/content-plans/generate", {
        month: currentMonth,
        year: currentYear,
        businessData: {
          industry: "General Business",
          topProducts: ["Product A", "Product B"],
          seasonality: "Q4",
        },
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

  // Get current month's content plan
  const currentPlan = contentPlans?.find(plan => 
    plan.month === currentMonth && plan.year === currentYear
  );

  // Generate calendar days for current month
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getPostForDay = (day: number) => {
    if (!currentPlan?.insights?.posts) return null;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return currentPlan.insights.posts.find(post => post.date === dateStr);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-amber-200 rounded mb-2"></div>
          <div className="h-3 bg-amber-100 rounded"></div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="bg-white p-2 h-24 animate-pulse">
              <div className="h-3 bg-gray-200 rounded mb-1"></div>
              <div className="h-2 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Summary */}
      {currentPlan?.insights?.insights && (
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Lightbulb className="text-amber-600 text-xl h-5 w-5" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-amber-800">AI Content Strategy Insights</h4>
                <div className="mt-1 text-sm text-amber-700 space-y-1">
                  {currentPlan.insights.insights.slice(0, 2).map((insight, index) => (
                    <p key={index} data-testid={`ai-insight-${index}`}>{insight}</p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Calendar */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900">
            {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generatePlanMutation.mutate()}
            disabled={generatePlanMutation.isPending}
            data-testid="button-regenerate-calendar"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", generatePlanMutation.isPending && "animate-spin")} />
            {generatePlanMutation.isPending ? "Generating..." : "Regenerate"}
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Calendar Header */}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500 text-center">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((day, index) => {
            const post = day ? getPostForDay(day) : null;
            const platform = post?.platform || "";
            const platformColor = platformColors[platform as keyof typeof platformColors] || "bg-gray-100 text-gray-800";
            const platformAbbr = platformAbbrevations[platform as keyof typeof platformAbbrevations] || "";
            
            return (
              <div key={index} className="bg-white p-2 h-24 relative">
                {day && (
                  <>
                    <span className="text-sm text-gray-500">{day}</span>
                    {post && (
                      <div className="mt-1" data-testid={`calendar-post-${day}`}>
                        <Badge className={cn("px-1 py-0.5 rounded text-xs truncate w-full", platformColor)}>
                          {platformAbbr}: {post.contentType.replace("_", " ")}
                        </Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      {currentPlan?.insights?.recommendations && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">AI Recommendations</h4>
          <div className="space-y-3">
            {currentPlan.insights.recommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3" data-testid={`recommendation-${index}`}>
                <div className="flex-shrink-0 mt-1">
                  {index === 0 && <ChartBar className="text-green-500 h-4 w-4" />}
                  {index === 1 && <Users className="text-primary h-4 w-4" />}
                  {index === 2 && <Video className="text-purple-500 h-4 w-4" />}
                </div>
                <p className="text-sm text-gray-600">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Plan State */}
      {!currentPlan && !isLoading && (
        <Card className="text-center py-8">
          <CardContent>
            <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2" data-testid="text-no-plan">
              No content plan for this month
            </h3>
            <p className="text-gray-600 mb-4">
              Let AI create a personalized content strategy based on your business data.
            </p>
            <Button
              onClick={() => generatePlanMutation.mutate()}
              disabled={generatePlanMutation.isPending}
              data-testid="button-generate-plan"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", generatePlanMutation.isPending && "animate-spin")} />
              {generatePlanMutation.isPending ? "Generating..." : "Generate AI Plan"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
