import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Building2, UserPlus, Sparkles } from "lucide-react";

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  industry: z.string().optional(),
  description: z.string().optional(),
  brandColor: z.string().optional(),
});

const joinBrandSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

type CreateBrandForm = z.infer<typeof createBrandSchema>;
type JoinBrandForm = z.infer<typeof joinBrandSchema>;

export default function Onboarding() {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refreshBrands } = useBrand();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Anteriormente, este bloque causaba un renderizado redundante o un bucle:
  // if (!isAuthenticated) {
  //   setLocation("/login");
  //   return null;
  // }

  const createForm = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      brandColor: "#6366f1",
    },
  });

  const joinForm = useForm<JoinBrandForm>({
    resolver: zodResolver(joinBrandSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: CreateBrandForm) => {
      const res = await apiRequest("POST", "/api/brands/create", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Brand created!",
        description: "Your brand has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-memberships"] });
      refreshBrands();
      setTimeout(() => setLocation("/dashboard"), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create brand",
        variant: "destructive",
      });
    },
  });

  const joinBrandMutation = useMutation({
    mutationFn: async (data: JoinBrandForm) => {
      const res = await apiRequest(
        "POST",
        "/api/brand-invitations/accept",
        data,
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined brand!",
        description: "You've successfully joined the brand.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-memberships"] });
      refreshBrands();
      setTimeout(() => setLocation("/dashboard"), 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join brand",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (data: CreateBrandForm) => {
    createBrandMutation.mutate(data);
  };

  const onJoinSubmit = (data: JoinBrandForm) => {
    joinBrandMutation.mutate(data);
  };

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to CampAIgner
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Let's get you started with your brand
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-500"
              onClick={() => setMode("create")}
              data-testid="card-create-brand"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-2xl">Create a Brand</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Start fresh by creating your own brand and inviting team
                  members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Own and manage your brand
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Invite team members
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    Full control over settings
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => setMode("join")}
              data-testid="card-join-brand"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <UserPlus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-2xl">Join a Brand</CardTitle>
                </div>
                <CardDescription className="text-base">
                  Join an existing brand using an invitation code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Collaborate with your team
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Access shared resources
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    Start working immediately
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create Your Brand</CardTitle>
            <CardDescription>
              Set up your brand profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Acme Corp"
                          data-testid="input-brand-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Technology, Retail, Healthcare"
                          data-testid="input-brand-industry"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Tell us about your brand..."
                          rows={3}
                          data-testid="textarea-brand-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="brandColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <Input
                            {...field}
                            type="color"
                            className="w-20 h-10"
                            data-testid="input-brand-color"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {field.value}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("choose")}
                    className="flex-1"
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createBrandMutation.isPending}
                    data-testid="button-create-brand"
                  >
                    {createBrandMutation.isPending
                      ? "Creating..."
                      : "Create Brand"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Join a Brand</CardTitle>
            <CardDescription>
              Enter the invitation code provided by your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...joinForm}>
              <form
                onSubmit={joinForm.handleSubmit(onJoinSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={joinForm.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation Code *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter invitation code"
                          className="font-mono text-lg tracking-wider"
                          data-testid="input-invite-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("choose")}
                    className="flex-1"
                    data-testid="button-back-join"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={joinBrandMutation.isPending}
                    data-testid="button-join-brand"
                  >
                    {joinBrandMutation.isPending ? "Joining..." : "Join Brand"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
