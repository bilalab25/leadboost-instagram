import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, MessageSquare, BarChart3, Bot, DollarSign } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "increase" | "decrease";
  icon: "message" | "chart" | "robot" | "dollar";
  loading?: boolean;
}

const iconMap = {
  message: MessageSquare,
  chart: BarChart3,
  robot: Bot,
  dollar: DollarSign,
};

const iconColorMap = {
  message: "bg-primary",
  chart: "bg-green-500",
  robot: "bg-amber-500",
  dollar: "bg-purple-500",
};

export default function StatsCard({ title, value, change, changeType = "increase", icon, loading }: StatsCardProps) {
  const Icon = iconMap[icon];
  const iconBgColor = iconColorMap[icon];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <div className="ml-5 w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="flex items-baseline space-x-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
              <Icon className="text-white h-5 w-5" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900" data-testid="stat-value">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    changeType === "increase" ? "text-green-600" : "text-red-600"
                  }`}>
                    {changeType === "increase" ? (
                      <TrendingUp className="text-xs mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="text-xs mr-1 h-3 w-3" />
                    )}
                    <span data-testid="stat-change">{change}</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
