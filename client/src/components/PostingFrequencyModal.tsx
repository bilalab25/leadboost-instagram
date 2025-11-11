import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Edit,
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
  const queryClient = useQueryClient();

  // Fetch user's connected integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<any[]>({
    queryKey: ["/api/integrations"],
    enabled: isOpen, // Only fetch when modal is open
  });

  // Fetch saved posting frequencies from database
  const { data: savedFrequencies = [], isLoading: frequenciesLoading } = useQuery<any[]>({
    queryKey: ["/api/posting-frequency"],
    enabled: isOpen, // Only fetch when modal is open
  });

  // Get connected platform providers
  const connectedPlatforms = integrations.map((integration) => integration.provider?.toLowerCase());

  // Filter platforms to only show connected ones
  const userPlatforms = platforms.filter((p) => connectedPlatforms.includes(p.id));
  
  // Generate suggested schedule based on platform best practices (only for connected platforms)
  const generateSuggestedSchedule = (): PlatformSchedule[] => {
    const defaultSchedules: { [key: string]: PlatformSchedule } = {
      instagram: {
        platform: "instagram",
        postsPerWeek: 5,
        selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      },
      facebook: {
        platform: "facebook",
        postsPerWeek: 3,
        selectedDays: ["monday", "wednesday", "friday"],
      },
      tiktok: {
        platform: "tiktok",
        postsPerWeek: 4,
        selectedDays: ["monday", "wednesday", "thursday", "saturday"],
      },
      linkedin: {
        platform: "linkedin",
        postsPerWeek: 3,
        selectedDays: ["tuesday", "wednesday", "thursday"],
      },
      twitter: {
        platform: "twitter",
        postsPerWeek: 7,
        selectedDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
      whatsapp: {
        platform: "whatsapp",
        postsPerWeek: 2,
        selectedDays: ["monday", "thursday"],
      },
      youtube: {
        platform: "youtube",
        postsPerWeek: 2,
        selectedDays: ["tuesday", "friday"],
      },
      pinterest: {
        platform: "pinterest",
        postsPerWeek: 4,
        selectedDays: ["monday", "wednesday", "friday", "sunday"],
      },
    };

    // Only return schedules for connected platforms
    return connectedPlatforms
      .map((platform) => defaultSchedules[platform])
      .filter((schedule) => schedule !== undefined);
  };

  const [schedules, setSchedules] = useState<PlatformSchedule[]>([]);
  const [useSuggested, setUseSuggested] = useState(true);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen && !frequenciesLoading) {
      // Check if there are saved frequencies in the database
      if (savedFrequencies && savedFrequencies.length > 0) {
        // Convert database format to component format
        const convertedSchedules = savedFrequencies.map((freq: any) => ({
          platform: freq.platform,
          postsPerWeek: freq.frequencyDays,
          selectedDays: freq.daysWeek,
        }));
        setSchedules(convertedSchedules);
        setUseSuggested(false);
        setHasSavedData(true);
        setIsEditMode(false); // Start in view mode
      } else if (currentSchedule) {
        // Use parent-provided schedule
        setSchedules(currentSchedule);
        setUseSuggested(false);
        setHasSavedData(false);
        setIsEditMode(true); // Allow editing
      } else {
        // Generate AI suggestions
        setSchedules(generateSuggestedSchedule());
        setUseSuggested(true);
        setHasSavedData(false);
        setIsEditMode(false);
      }
    }
  }, [isOpen, savedFrequencies, currentSchedule, frequenciesLoading]);

  // Mutation to save posting frequency to database
  const saveFrequencyMutation = useMutation({
    mutationFn: async (schedules: PlatformSchedule[]) => {
      const response = await apiRequest("POST", "/api/posting-frequency", {
        schedules,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posting-frequency"] });
      toast({
        title: "Success!",
        description: "Posting frequency saved to database successfully.",
      });
      onSaveSchedule(schedules);
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save posting frequency",
        variant: "destructive",
      });
    },
  });

  const handleAcceptSuggestion = () => {
    saveFrequencyMutation.mutate(schedules);
  };

  const handleCustomize = () => {
    setUseSuggested(false);
    setIsEditMode(true);
    setHasSavedData(false); // This is a new customization, not saved data
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    // Reload saved data
    if (savedFrequencies && savedFrequencies.length > 0) {
      const convertedSchedules = savedFrequencies.map((freq: any) => ({
        platform: freq.platform,
        postsPerWeek: freq.frequencyDays,
        selectedDays: freq.daysWeek,
      }));
      setSchedules(convertedSchedules);
    }
    setIsEditMode(false);
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
    saveFrequencyMutation.mutate(schedules);
  };

  const getPlatformInfo = (platformId: string) => {
    return platforms.find((p) => p.id === platformId);
  };

  // Only show connected platforms that aren't already in the schedule
  const availablePlatforms = userPlatforms.filter(
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

        {(integrationsLoading || frequenciesLoading) ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your posting schedule...</p>
          </div>
        ) : userPlatforms.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-900 mb-2">No Connected Platforms</h3>
            <p className="text-gray-500 mb-4">
              Please connect your social media platforms first to set up posting frequency.
            </p>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        ) : (
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
                      disabled={saveFrequencyMutation.isPending}
                      data-testid="button-accept-suggestion"
                    >
                      <Check className="h-4 w-4 mr-1" /> 
                      {saveFrequencyMutation.isPending ? "Saving..." : "Accept Suggestion"}
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
              {!useSuggested && isEditMode && availablePlatforms.length > 0 && (
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
                    {!useSuggested && isEditMode && (
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
                            onClick={() => (!useSuggested && isEditMode) && toggleDay(schedule.platform, day.id)}
                            disabled={useSuggested || !isEditMode}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            } ${(useSuggested || !isEditMode) ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
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
                        disabled={!isEditMode}
                        className={`w-full ${!isEditMode ? "opacity-60 cursor-not-allowed" : ""}`}
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
        )}

        {!integrationsLoading && !frequenciesLoading && userPlatforms.length > 0 && (
          <DialogFooter>
          {hasSavedData && !isEditMode ? (
            <>
              <Button variant="outline" onClick={onClose} data-testid="button-close-frequency">
                Close
              </Button>
              <Button onClick={handleEdit} data-testid="button-edit-frequency">
                <Edit className="h-4 w-4 mr-1" /> Edit Schedule
              </Button>
            </>
          ) : hasSavedData && isEditMode ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCustomSchedule} 
                disabled={saveFrequencyMutation.isPending}
                data-testid="button-save-changes"
              >
                <Check className="h-4 w-4 mr-1" /> 
                {saveFrequencyMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : !useSuggested ? (
            <>
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-frequency">
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCustomSchedule} 
                disabled={saveFrequencyMutation.isPending}
                data-testid="button-save-custom-schedule"
              >
                <Check className="h-4 w-4 mr-1" /> 
                {saveFrequencyMutation.isPending ? "Saving..." : "Save Schedule"}
              </Button>
            </>
          ) : null}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
