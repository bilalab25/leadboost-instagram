import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Instagram, 
  Facebook, 
  Mail,
  MessageCircle,
  Clock,
  Image as ImageIcon
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

interface ScheduledPost {
  id: string;
  date: string;
  time: string;
  platform: "instagram" | "facebook" | "tiktok" | "whatsapp" | "email";
  title: string;
  status: "scheduled" | "draft" | "published";
  hasImage: boolean;
}

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: SiTiktok,
  whatsapp: MessageCircle,
  email: Mail,
};

const platformColors = {
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  facebook: "bg-blue-100 text-blue-700 border-blue-200",
  tiktok: "bg-gray-100 text-gray-700 border-gray-200",
  whatsapp: "bg-green-100 text-green-700 border-green-200",
  email: "bg-purple-100 text-purple-700 border-purple-200",
};

const statusColors = {
  scheduled: "bg-blue-500",
  draft: "bg-yellow-500",
  published: "bg-green-500",
};

const mockPosts: ScheduledPost[] = [
  {
    id: "1",
    date: "2025-11-27",
    time: "11:00 AM",
    platform: "instagram",
    title: "Glowing Skin Facial Promo",
    status: "scheduled",
    hasImage: true,
  },
  {
    id: "2",
    date: "2025-11-28",
    time: "2:00 PM",
    platform: "facebook",
    title: "Black Friday Special",
    status: "draft",
    hasImage: true,
  },
  {
    id: "3",
    date: "2025-11-29",
    time: "10:00 AM",
    platform: "tiktok",
    title: "Behind the Scenes",
    status: "scheduled",
    hasImage: false,
  },
  {
    id: "4",
    date: "2025-12-01",
    time: "9:00 AM",
    platform: "email",
    title: "December Newsletter",
    status: "draft",
    hasImage: true,
  },
  {
    id: "5",
    date: "2025-12-05",
    time: "3:00 PM",
    platform: "whatsapp",
    title: "Holiday Booking Reminder",
    status: "scheduled",
    hasImage: false,
  },
];

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts] = useState<ScheduledPost[]>(mockPosts);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getPostsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return posts.filter(post => post.date === dateStr);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (day: number) => {
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm" data-testid="content-calendar" id="new-calendar-v2">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900" data-testid="calendar-title">
            {monthName}
          </h2>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={prevMonth}
              data-testid="button-prev-month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={nextMonth}
              data-testid="button-next-month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Draft</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Published</span>
            </div>
          </div>
          <Button 
            className="bg-gradient-to-r from-[#0891b2] to-[hsl(210,70%,45%)] text-white"
            data-testid="button-new-post"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div 
            key={day} 
            className="p-2 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border-r border-b bg-gray-50 last:border-r-0" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPosts = getPostsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day} 
              className={`border-r border-b p-1 min-h-[100px] hover:bg-gray-50 transition-colors ${
                isCurrentDay ? 'bg-blue-50' : ''
              }`}
              data-testid={`calendar-day-${day}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay 
                  ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                  : 'text-gray-700'
              }`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map((post) => {
                  const PlatformIcon = platformIcons[post.platform];
                  return (
                    <div 
                      key={post.id}
                      className={`text-xs p-1.5 rounded border cursor-pointer hover:shadow-sm transition-shadow ${platformColors[post.platform]}`}
                      data-testid={`post-${post.id}`}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusColors[post.status]}`} />
                        <PlatformIcon className="h-3 w-3" />
                        {post.hasImage && <ImageIcon className="h-3 w-3" />}
                      </div>
                      <div className="truncate font-medium mt-0.5">{post.title}</div>
                      <div className="flex items-center gap-1 text-[10px] opacity-75">
                        <Clock className="h-2.5 w-2.5" />
                        {post.time}
                      </div>
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{posts.filter(p => p.status === 'scheduled').length}</span> posts scheduled this month
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{posts.filter(p => p.status === 'draft').length}</span> drafts pending
            </div>
          </div>
          <div className="flex gap-2">
            {Object.entries(platformIcons).map(([platform, Icon]) => (
              <Badge 
                key={platform} 
                variant="outline" 
                className={`${platformColors[platform as keyof typeof platformColors]} cursor-pointer`}
              >
                <Icon className="h-3 w-3 mr-1" />
                {posts.filter(p => p.platform === platform).length}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
