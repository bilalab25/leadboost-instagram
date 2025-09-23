import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import {
  SiWhatsapp,
  SiTiktok,
  SiFacebook,
  SiLinkedin,
} from "react-icons/si";
import { Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ContentPost {
  id: string;
  title: string;
  platform: string;
  scheduledFor: string;
  status: "draft" | "scheduled" | "published";
  content: string;
  imageUrl?: string;
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
  facebook: "text-blue-600 bg-blue-50",
  tiktok: "text-gray-800 bg-gray-50",
  linkedin: "text-sky-600 bg-sky-50",
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
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [editPost, setEditPost] = useState<ContentPost | null>(null);

  // 🔹 Mock posts
  const mockContentPosts: ContentPost[] = [
    {
      id: "1",
      title: "Product Launch",
      platform: "instagram",
      scheduledFor: "2025-09-27T14:00:00Z",
      status: "scheduled",
      content: "🎉 Our new product is finally here!",
      imageUrl: "https://img.freepik.com/free-psd/male-grooming-template-design_23-2150195492.jpg?semt=ais_incoming&w=740&q=80",
    },
    {
      id: "2",
      title: "Customer Testimonial",
      platform: "facebook",
      scheduledFor: "2025-09-28T10:30:00Z",
      status: "draft",
      content: "Here is what our clients are saying ❤️",
      imageUrl: "https://img.freepik.com/premium-psd/aesthetic-fashion-social-media-instagram-post-template-premium-psd_20692-42.jpg",
    },
    {
      id: "3",
      title: "Behind the Scenes",
      platform: "tiktok",
      scheduledFor: "2025-09-28T16:00:00Z",
      status: "scheduled",
      content: "🎬 A look behind our daily operations",
      imageUrl: "https://img.freepik.com/premium-psd/minimalist-aesthetic-fashion-social-media-instagram-post-template_20692-45.jpg",
    },
    {
      id: "4",
      title: "Holiday Promo",
      platform: "whatsapp",
      scheduledFor: "2025-09-29T09:00:00Z",
      status: "published",
      content: "🎄 Special offers for the holiday season!",
      imageUrl: "https://img.freepik.com/premium-psd/new-year-mega-sale-women-fashion-product-minimalist-social-media-template_524105-401.jpg",
    },
    {
      id: "5",
      title: "2025 Trends",
      platform: "linkedin",
      scheduledFor: "2025-09-30T11:00:00Z",
      status: "scheduled",
      content: "Key insights shaping our industry in 2025 📊",
      imageUrl: "https://img.freepik.com/premium-psd/aesthetic-minimalist-instagram-posts-stories-quotes-templates-beige-neutral-colors-psd_878297-271.jpg",
    },
  ];

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

  const getPostsForDate = (date: Date) =>
    mockContentPosts.filter((post) =>
      isSameDay(new Date(post.scheduledFor), date)
    );

  const handleDateClick = (date: Date) => {
    setSelectedDate(
      selectedDate && isSameDay(selectedDate, date) ? null : date
    );
  };

  const handleOpenPost = (post: ContentPost) => {
    setSelectedPost(post);
    setEditPost({ ...post }); // clone to edit
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setEditPost((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    }
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  // 🔹 Bulk approve
  const handleApproveMonth = () => {
    toast({
      title: "Approved all posts",
      description: `All posts scheduled for ${format(
        currentDate,
        "MMMM yyyy"
      )} have been approved.`,
    });
  };

  const handleApproveDay = () => {
    if (!selectedDate) return;
    toast({
      title: "Approved all posts",
      description: `All posts for ${format(selectedDate, "MMMM d")} approved.`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 📅 Calendar */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold flex items-center">
                            <CalendarIcon className="mr-2 h-5 w-5" />
                            {format(currentDate, "MMMM yyyy")}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentDate(
                                  new Date(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth() - 1
                                  )
                                )
                              }
                            >
                              ←
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentDate(
                                  new Date(
                                    currentDate.getFullYear(),
                                    currentDate.getMonth() + 1
                                  )
                                )
                              }
                            >
                              →
                            </Button>
                            {/* ✅ Approve all posts in the month */}
                            <Button
                              size="sm"
                              variant="default"
                              onClick={handleApproveMonth}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              month
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Week headers */}
                        <div className="grid grid-cols-7 gap-2 mb-4">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (day) => (
                              <div
                                key={day}
                                className="text-center text-sm font-medium text-gray-500 py-2"
                              >
                                {day}
                              </div>
                            )
                          )}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-2">
                          {daysInMonth.map((day) => {
                            const postsForDay = getPostsForDate(day);
                            const isSelected =
                              selectedDate && isSameDay(selectedDate, day);
                            return (
                              <div
                                key={day.toISOString()}
                                className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-colors ${
                                  isToday(day)
                                    ? "bg-brand-50 border-brand-200"
                                    : "bg-white border-gray-200"
                                } ${isSelected ? "ring-2 ring-brand-500" : ""}`}
                                onClick={() => handleDateClick(day)}
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {format(day, "d")}
                                </div>
                                <div className="mt-1 space-y-1">
                                  {postsForDay.slice(0, 2).map((post) => {
                                    const PlatformIcon =
                                      platformIcons[
                                        post.platform as keyof typeof platformIcons
                                      ];
                                    return (
                                      <div
                                        key={post.id}
                                        className={`text-xs px-2 py-1 rounded truncate ${platformColors[post.platform as keyof typeof platformColors]}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenPost(post);
                                        }}
                                      >
                                        <PlatformIcon className="inline w-3 h-3 mr-1" />
                                        {post.title}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* 📊 Sidebar */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {selectedDate
                            ? format(selectedDate, "EEEE, MMMM d")
                            : "Select a date"}
                        </CardTitle>
                        {/* ✅ Approve all posts for the day */}
                        {selectedDate && selectedDatePosts.length > 0 && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={handleApproveDay}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve day
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        {selectedDatePosts.length > 0 ? (
                          <div className="space-y-4">
                            {selectedDatePosts.map((post) => {
                              const PlatformIcon =
                                platformIcons[post.platform as keyof typeof platformIcons];
                              return (
                                <div key={post.id} className="border rounded-lg p-4">
                                  <img
                                    src={post.imageUrl}
                                    alt={post.title}
                                    className="w-full h-32 object-cover rounded mb-2"
                                  />
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="font-medium">{post.title}</p>
                                    {/* ✅ Social Media badge */}
                                    <div
                                      className={`flex items-center text-xs px-2 py-1 rounded ${platformColors[post.platform as keyof typeof platformColors]}`}
                                    >
                                      <PlatformIcon className="w-3 h-3 mr-1" />
                                      {post.platform.charAt(0).toUpperCase() +
                                        post.platform.slice(1)}
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {format(new Date(post.scheduledFor), "h:mm a")}
                                  </p>
                                  <p className="text-sm text-gray-700 line-clamp-2">
                                    {post.content}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => handleOpenPost(post)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" /> View
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">
                            {selectedDate
                              ? "No posts for this day"
                              : "Click on a day to view posts"}
                          </p>
                        )}
                      </CardContent>
                    </Card>


                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Scheduled
                            </span>
                            <span className="font-medium">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Published
                            </span>
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

      {/* Modal Meta Ads Style */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Post Preview & Edit</DialogTitle>
          </DialogHeader>

          {editPost && (
            <div className="grid grid-cols-2 gap-6">
              {/* Live Preview */}
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={editPost.imageUrl}
                  alt={editPost.title}
                  className="w-full object-cover"
                />
                <div className="p-4">
                  <p className="font-semibold">{editPost.title}</p>
                  <p className="text-sm text-gray-700 mt-2">
                    {editPost.content}
                  </p>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <Input
                  value={editPost.title}
                  onChange={(e) =>
                    setEditPost((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev
                    )
                  }
                  placeholder="Title"
                />
                <Textarea
                  value={editPost.content}
                  onChange={(e) =>
                    setEditPost((prev) =>
                      prev ? { ...prev, content: e.target.value } : prev
                    )
                  }
                  placeholder="Post text"
                />
                <Input
                  type="datetime-local"
                  value={format(
                    new Date(editPost.scheduledFor),
                    "yyyy-MM-dd'T'HH:mm"
                  )}
                  onChange={(e) =>
                    setEditPost((prev) =>
                      prev ? { ...prev, scheduledFor: e.target.value } : prev
                    )
                  }
                />

                {/* Image Controls */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Post image
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <Button variant="outline">
                      <Wand2 className="w-4 h-4 mr-1" /> Edit image
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload or edit the post image.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between mt-4">
            <Button variant="destructive">
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
