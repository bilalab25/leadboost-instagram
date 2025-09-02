import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus, Eye, Edit, Trash2, Clock, Instagram, CheckCircle } from "lucide-react";
import { SiWhatsapp, SiTiktok, SiFacebook, SiLinkedin } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";

interface ContentPost {
  id: string;
  title: string;
  platform: string;
  scheduledFor: string;
  status: "draft" | "scheduled" | "published";
  content: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

const platformIcons = {
  instagram: Instagram,
  whatsapp: SiWhatsapp,
  facebook: SiFacebook,
  tiktok: SiTiktok,
  linkedin: SiLinkedin,
};

const platformColors = {
  instagram: "text-pink-500 bg-pink-50",
  whatsapp: "text-green-500 bg-green-50",
  facebook: "text-primary bg-primary/5",
  tiktok: "text-gray-800 bg-gray-50",
  linkedin: "text-primary bg-primary/5",
};

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-primary/10 text-primary",
  published: "bg-green-100 text-green-800",
};

export default function ContentCalendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Mock data for content calendar
  const mockContentPosts: ContentPost[] = [
    {
      id: "1",
      title: "New Product Launch",
      platform: "instagram",
      scheduledFor: "2024-12-27T14:00:00Z",
      status: "scheduled",
      content: "🎉 Exciting news! Our latest product is here...",
      engagement: { likes: 245, comments: 23, shares: 12 }
    },
    {
      id: "2", 
      title: "Customer Testimonial",
      platform: "facebook",
      scheduledFor: "2024-12-28T10:30:00Z",
      status: "draft",
      content: "Check out what our customers are saying about us!"
    },
    {
      id: "3",
      title: "Behind the Scenes",
      platform: "tiktok",
      scheduledFor: "2024-12-28T16:00:00Z",
      status: "scheduled",
      content: "Take a peek behind the curtain of our daily operations"
    },
    {
      id: "4",
      title: "Holiday Campaign",
      platform: "whatsapp",
      scheduledFor: "2024-12-29T09:00:00Z",
      status: "published",
      content: "Special holiday offers for our valued customers! 🎄",
      engagement: { likes: 156, comments: 34, shares: 8 }
    },
    {
      id: "5",
      title: "Industry Insights",
      platform: "linkedin",
      scheduledFor: "2024-12-30T11:00:00Z",
      status: "scheduled",
      content: "Key trends shaping our industry in 2025..."
    }
  ];

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPostsForDate = (date: Date) => {
    return mockContentPosts.filter(post => 
      isSameDay(new Date(post.scheduledFor), date)
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(selectedDate && isSameDay(selectedDate, date) ? null : date);
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <TopHeader pageName="Content Calendar" />

        {/* Calendar Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center">
                          <CalendarIcon className="mr-2 h-5 w-5" />
                          {format(currentDate, 'MMMM yyyy')}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                            data-testid="button-prev-month"
                          >
                            ←
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                            data-testid="button-next-month"
                          >
                            →
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-2">
                        {daysInMonth.map(day => {
                          const postsForDay = getPostsForDate(day);
                          const isSelected = selectedDate && isSameDay(selectedDate, day);
                          
                          return (
                            <div
                              key={day.toISOString()}
                              className={`
                                p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors
                                ${isToday(day) ? 'bg-brand-50 border-brand-200' : 'bg-white border-gray-200'}
                                ${isSelected ? 'ring-2 ring-brand-500' : ''}
                                hover:bg-gray-50
                              `}
                              onClick={() => handleDateClick(day)}
                              data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {format(day, 'd')}
                              </div>
                              <div className="mt-1 space-y-1">
                                {postsForDay.slice(0, 2).map(post => {
                                  const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                                  return (
                                    <div 
                                      key={post.id}
                                      className={`
                                        text-xs px-2 py-1 rounded truncate
                                        ${platformColors[post.platform as keyof typeof platformColors]}
                                      `}
                                    >
                                      <PlatformIcon className="inline w-3 h-3 mr-1" />
                                      {post.title}
                                    </div>
                                  );
                                })}
                                {postsForDay.length > 2 && (
                                  <div className="text-xs text-gray-500 px-2">
                                    +{postsForDay.length - 2} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Selected Date Details */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDatePosts.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDatePosts.map(post => {
                            const PlatformIcon = platformIcons[post.platform as keyof typeof platformIcons];
                            return (
                              <div key={post.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <PlatformIcon className="w-4 h-4 text-gray-600" />
                                    <span className="font-medium">{post.title}</span>
                                  </div>
                                  <Badge variant="secondary" className={statusColors[post.status]}>
                                    {post.status === 'scheduled' && <Clock className="w-3 h-3 mr-1" />}
                                    {post.status === 'published' && <CheckCircle className="w-3 h-3 mr-1" />}
                                    {post.status}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-2">
                                  {format(new Date(post.scheduledFor), 'h:mm a')}
                                </p>
                                
                                <p className="text-sm text-gray-800 mb-3 line-clamp-2">
                                  {post.content}
                                </p>
                                
                                {post.engagement && (
                                  <div className="flex space-x-4 text-xs text-gray-500 mb-3">
                                    <span>👍 {post.engagement.likes}</span>
                                    <span>💬 {post.engagement.comments}</span>
                                    <span>🔄 {post.engagement.shares}</span>
                                  </div>
                                )}
                                
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" data-testid={`button-view-${post.id}`}>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline" data-testid={`button-edit-${post.id}`}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : selectedDate ? (
                        <p className="text-gray-500 text-center py-8">
                          No content scheduled for this date
                        </p>
                      ) : (
                        <p className="text-gray-500 text-center py-8">
                          Click on a date to view scheduled content
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Scheduled</span>
                          <span className="font-medium">3</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Published</span>
                          <span className="font-medium">1</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Drafts</span>
                          <span className="font-medium">1</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}