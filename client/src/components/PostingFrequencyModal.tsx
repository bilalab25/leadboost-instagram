import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Instagram,
  Calendar,
  Sparkles,
  Check,
  Plus,
  X,
} from "lucide-react";
import {
  SiWhatsapp,
  SiTiktok,
  SiFacebook,
  SiLinkedin,
  SiX,
  SiYoutube,
  SiPinterest,
} from "react-icons/si";

interface PlatformSchedule {
  platform: string;
  postsPerWeek: number;
  selectedDays: string[];
}

interface PostingFrequencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: PlatformSchedule[] | null;
  onSaveSchedule: (schedule: PlatformSchedule[]) => void;
}

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "facebook", name: "Facebook", icon: SiFacebook, color: "text-blue-600" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "text-gray-800" },
  { id: "whatsapp", name: "WhatsApp", icon: SiWhatsapp, color: "text-green-500" },
  { id: "linkedin", name: "LinkedIn", icon: SiLinkedin, color: "text-sky-600" },
  { id: "twitter", name: "X (Twitter)", icon: SiX, color: "text-gray-900" },
  { id: "youtube", name: "YouTube", icon: SiYoutube, color: "text-red-600" },
  { id: "pinterest", name: "Pinterest", icon: SiPinterest, color: "text-red-500" },
];

const daysOfWeek = [
  { id: "monday", name: "Mon", full: "Monday" },
  { id: "tuesday", name: "Tue", full: "Tuesday" },
  { id: "wednesday", name: "Wed", full: "Wednesday" },
  { id: "thursday", name: "Thu", full: "Thursday" },
  { id: "friday", name: "Fri", full: "Friday" },
  { id: "saturday", name: "Sat", full: "Saturday" },
  { id: "sunday", name: "Sun", full: "Sunday" },
];

export default function PostingFrequencyModal({
  isOpen,
  onClose,
  currentSchedule,
  onSaveSchedule,
}: PostingFrequencyModalProps) {
  const { toast } = useToast();
  
  // Generate suggested schedule based on platform best practices
  const generateSuggestedSchedule = (): PlatformSchedule[] => {
    return [
      {
        platform: "instagram",
        postsPerWeek: 5,
        selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      {
        platform: "facebook",
        postsPerWeek: 3,
        selectedDays: ["monday", "wednesday", "friday"],
      },
      {
        platform: "tiktok",
        postsPerWeek: 4,
        selectedDays: ["monday", "wednesday", "thursday", "saturday"],
      },
      {
        platform: "linkedin",
        postsPerWeek: 3,
        selectedDays: ["tuesday", "wednesday", "thursday"],
      },
      {
        platform: "twitter",
        postsPerWeek: 7,
        selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
    ];
  };

  const [schedules, setSchedules] = useState<PlatformSchedule[]>(
    currentSchedule || generateSuggestedSchedule()
  );
  const [useSuggested, setUseSuggested] = useState(!currentSchedule);

  useEffect(() => {
    if (isOpen && !currentSchedule) {
      // Only reset to suggested if there's no saved schedule
      setSchedules(generateSuggestedSchedule());
      setUseSuggested(true);
    } else if (isOpen && currentSchedule) {
      // Load the saved schedule
      setSchedules(currentSchedule);
      setUseSuggested(false);
    }
  }, [isOpen, currentSchedule]);

  const handleAcceptSuggestion = () => {
    onSaveSchedule(schedules);
    toast({
      title: "Posting Schedule Applied",
      description: `AI-suggested posting schedule has been applied to your calendar.`,
    });
    onClose();
  };

  const handleCustomize = () => {
    setUseSuggested(false);
  };

  const updateSchedule = (
    platform: string,
    field: "postsPerWeek" | "selectedDays",
    value: number | string[]
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.platform === platform ? { ...s, [field]: value } : s
      )
    );
  };

  const toggleDay = (platform: string, day: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.platform !== platform) return s;
        const days = s.selectedDays.includes(day)
          ? s.selectedDays.filter((d) => d !== day)
          : [...s.selectedDays, day];
        return { ...s, selectedDays: days, postsPerWeek: days.length };
      })
    );
  };

  const addPlatform = (platformId: string) => {
    if (!schedules.find((s) => s.platform === platformId)) {
      setSchedules([
        ...schedules,
        { platform: platformId, postsPerWeek: 2, selectedDays: ["monday", "thursday"] },
      ]);
    }
  };

  const removePlatform = (platformId: string) => {
    setSchedules(schedules.filter((s) => s.platform !== platformId));
  };

  const handleSaveCustomSchedule = () => {
    onSaveSchedule(schedules);
    toast({
      title: "Custom Schedule Saved",
      description: `Your custom posting schedule has been applied to the calendar.`,
    });
    onClose();
  };

  const getPlatformInfo = (platformId: string) => {
    return platforms.find((p) => p.id === platformId);
  };

  const availablePlatforms = platforms.filter(
    (p) => !schedules.find((s) => s.platform === p.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-posting-frequency">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Set Posting Frequency
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Suggestion Banner */}
          {useSuggested && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    AI-Suggested Schedule
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Based on industry best practices and optimal engagement times,
                    we've created a posting schedule tailored for maximum reach and engagement.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleAcceptSuggestion}
                      data-testid="button-accept-suggestion"
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept Suggestion
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCustomize}
                      data-testid="button-customize-schedule"
                    >
                      Customize Schedule
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Platform Schedules */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Platform Schedules</h3>
              {!useSuggested && availablePlatforms.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Add Platform:</Label>
                  <div className="flex gap-1">
                    {availablePlatforms.slice(0, 3).map((platform) => {
                      const Icon = platform.icon;
                      return (
                        <Button
                          key={platform.id}
                          size="sm"
                          variant="outline"
                          onClick={() => addPlatform(platform.id)}
                          className="h-8 w-8 p-0"
                          data-testid={`button-add-platform-${platform.id}`}
                        >
                          <Icon className={`h-4 w-4 ${platform.color}`} />
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {schedules.map((schedule) => {
              const platformInfo = getPlatformInfo(schedule.platform);
              if (!platformInfo) return null;
              const Icon = platformInfo.icon;

              return (
                <div
                  key={schedule.platform}
                  className="border rounded-lg p-4 space-y-3 bg-white"
                  data-testid={`schedule-${schedule.platform}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${platformInfo.color}`} />
                      <span className="font-medium">{platformInfo.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {schedule.postsPerWeek} posts/week
                      </Badge>
                    </div>
                    {!useSuggested && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removePlatform(schedule.platform)}
                        data-testid={`button-remove-platform-${schedule.platform}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Days of Week Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Posting Days:</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => {
                        const isSelected = schedule.selectedDays.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            onClick={() => !useSuggested && toggleDay(schedule.platform, day.id)}
                            disabled={useSuggested}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            } ${useSuggested ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                            data-testid={`button-toggle-day-${schedule.platform}-${day.id}`}
                          >
                            {day.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Posts Per Week (Custom mode only) */}
                  {!useSuggested && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        Posts Per Week: {schedule.postsPerWeek}
                      </Label>
                      <Input
                        type="range"
                        min="1"
                        max="7"
                        value={schedule.postsPerWeek}
                        onChange={(e) =>
                          updateSchedule(
                            schedule.platform,
                            "postsPerWeek",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full"
                        data-testid={`slider-posts-per-week-${schedule.platform}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {schedules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No platforms configured. Add platforms to get started.</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-frequency">
            Cancel
          </Button>
          {!useSuggested && (
            <Button onClick={handleSaveCustomSchedule} data-testid="button-save-custom-schedule">
              <Check className="h-4 w-4 mr-1" /> Save Schedule
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
