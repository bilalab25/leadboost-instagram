import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, UserPlus, Copy, Users, Crown, Shield, Eye, Edit, Plus, Trash2 } from "lucide-react";

const createBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  industry: z.string().optional(),
  description: z.string().optional(),
  brandColor: z.string().optional(),
});

const joinBrandSchema = z.object({
  inviteCode: z.string().min(1, "Invitation code is required"),
});

type CreateBrandForm = z.infer<typeof createBrandSchema>;
type JoinBrandForm = z.infer<typeof joinBrandSchema>;

interface BrandMembership {
  id: string;
  brandId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
}

interface BrandInvitation {
  id: string;
  brandId: string;
  inviteCode: string;
  role: string;
  email: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function BrandsTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const { toast } = useToast();
  const { brands, refreshBrands, activeBrandId, setActiveBrandId } = useBrand();

  // Fetch brand memberships
  const { data: memberships = [] } = useQuery<BrandMembership[]>({
    queryKey: ["/api/brand-memberships"],
  });

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
      return await apiRequest("/api/brands/create", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Brand created successfully",
        description: "You can now start managing your brand.",
      });
      setCreateDialogOpen(false);
      createForm.reset();
      refreshBrands();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create brand",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const joinBrandMutation = useMutation({
    mutationFn: async (data: JoinBrandForm) => {
      return await apiRequest("/api/brand-invitations/accept", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Joined brand successfully",
        description: "You now have access to this brand.",
      });
      setJoinDialogOpen(false);
      joinForm.reset();
      refreshBrands();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join brand",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "editor":
        return <Edit className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "admin":
        return "secondary";
      case "editor":
        return "outline";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Brands</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage brands you own or are a member of
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-join-brand">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Brand</DialogTitle>
                <DialogDescription>
                  Enter an invitation code to join an existing brand
                </DialogDescription>
              </DialogHeader>
              <Form {...joinForm}>
                <form
                  onSubmit={joinForm.handleSubmit((data) =>
                    joinBrandMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={joinForm.control}
                    name="inviteCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invitation Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter invitation code"
                            data-testid="input-invite-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setJoinDialogOpen(false)}
                      data-testid="button-cancel-join"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={joinBrandMutation.isPending}
                      data-testid="button-submit-join"
                    >
                      {joinBrandMutation.isPending ? "Joining..." : "Join Brand"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-brand">
                <Plus className="h-4 w-4 mr-2" />
                Create Brand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Brand</DialogTitle>
                <DialogDescription>
                  Set up a new brand for your business
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit((data) =>
                    createBrandMutation.mutate(data)
                  )}
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
                            placeholder="Enter brand name"
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
                            placeholder="E.g., E-commerce, SaaS, Consulting"
                            data-testid="input-industry"
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
                            placeholder="Brief description of your brand"
                            rows={3}
                            data-testid="input-description"
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
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="color"
                              {...field}
                              className="w-20 h-10"
                              data-testid="input-brand-color"
                            />
                          </FormControl>
                          <Input
                            type="text"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="#6366f1"
                            className="flex-1"
                            data-testid="input-brand-color-hex"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createBrandMutation.isPending}
                      data-testid="button-submit-create"
                    >
                      {createBrandMutation.isPending
                        ? "Creating..."
                        : "Create Brand"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {brands.map((brand) => {
          const membership = memberships.find((m) => m.brandId === brand.id);
          const isActive = brand.id === activeBrandId;

          return (
            <Card
              key={brand.id}
              className={isActive ? "border-indigo-500 dark:border-indigo-400 border-2" : ""}
              data-testid={`card-brand-${brand.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: brand.primaryColor || "#6366f1" }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {brand.name}
                        {isActive && (
                          <Badge variant="default">Active</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {brand.industry || "No industry specified"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {membership && (
                      <Badge
                        variant={getRoleBadgeVariant(membership.role)}
                        className="flex items-center gap-1"
                        data-testid={`badge-role-${brand.id}`}
                      >
                        {getRoleIcon(membership.role)}
                        {membership.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {!isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveBrandId(brand.id)}
                      data-testid={`button-switch-to-${brand.id}`}
                    >
                      Switch to this brand
                    </Button>
                  )}
                  {membership && ["owner", "admin"].includes(membership.role) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBrandId(brand.id);
                        setManageDialogOpen(true);
                      }}
                      data-testid={`button-manage-${brand.id}`}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {brands.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brands yet</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                Create a new brand or join an existing one to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Manage Members Dialog */}
      <ManageMembersDialog
        isOpen={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        brandId={selectedBrandId}
      />
    </div>
  );
}

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string | null;
}

function ManageMembersDialog({ isOpen, onClose, brandId }: ManageMembersDialogProps) {
  const { toast } = useToast();
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Fetch brand members
  const { data: members = [], isLoading: membersLoading } = useQuery<BrandMembership[]>({
    queryKey: ["/api/brands", brandId, "members"],
    enabled: !!brandId && isOpen,
  });

  // Fetch brand invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<BrandInvitation[]>({
    queryKey: ["/api/brand-invitations", brandId],
    enabled: !!brandId && isOpen,
  });

  // Generate invitation mutation
  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/brand-invitations?brandId=${brandId}`, "POST", {
        role: inviteRole,
        email: inviteEmail || null,
      });
    },
    onSuccess: (data: BrandInvitation) => {
      setGeneratedCode(data.inviteCode);
      setInviteEmail("");
      toast({
        title: "Invitation created",
        description: "Copy the code and share it with your team member.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-invitations", brandId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ membershipId, role }: { membershipId: string; role: string }) => {
      return await apiRequest(`/api/brand-memberships/${membershipId}/role`, "PATCH", { role });
    },
    onSuccess: () => {
      toast({
        title: "Role updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      return await apiRequest(`/api/brand-memberships/${membershipId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Member removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Expire invitation mutation
  const expireInviteMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      return await apiRequest(`/api/brand-invitations/${invitationId}/expire`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Invitation revoked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/brand-invitations", brandId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to revoke invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Invitation code copied successfully.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner": return <Crown className="h-4 w-4" />;
      case "admin": return <Shield className="h-4 w-4" />;
      case "editor": return <Edit className="h-4 w-4" />;
      case "viewer": return <Eye className="h-4 w-4" />;
      default: return null;
    }
  };

  if (!brandId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Invite team members, manage roles, and control access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate Invitation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generate Invitation</CardTitle>
              <CardDescription>
                Create an invitation code to add new team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger data-testid="select-invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Email (Optional)</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    data-testid="input-invite-email"
                  />
                </div>
              </div>
              <Button
                onClick={() => generateInviteMutation.mutate()}
                disabled={generateInviteMutation.isPending}
                data-testid="button-generate-invite"
              >
                Generate Invitation Code
              </Button>

              {generatedCode && (
                <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <code className="flex-1 text-sm font-mono">{generatedCode}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(generatedCode)}
                    data-testid="button-copy-code"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-4">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                  No members yet
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`member-${member.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                          {member.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.userId}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                            {getRoleIcon(member.role)}
                            <span>{member.role}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.role !== "owner" && (
                          <>
                            <Select
                              value={member.role}
                              onValueChange={(role) =>
                                updateRoleMutation.mutate({
                                  membershipId: member.id,
                                  role,
                                })
                              }
                            >
                              <SelectTrigger className="w-32" data-testid={`select-role-${member.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="owner">Owner</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate(member.id)}
                              disabled={removeMemberMutation.isPending}
                              data-testid={`button-remove-${member.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {member.role === "owner" && (
                          <Badge variant="default">Owner</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="text-center py-4">Loading invitations...</div>
              ) : invitations.filter(i => i.status === "pending").length === 0 ? (
                <div className="text-center py-4 text-gray-600 dark:text-gray-300">
                  No pending invitations
                </div>
              ) : (
                <div className="space-y-2">
                  {invitations.filter(i => i.status === "pending").map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`invitation-${invite.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {invite.inviteCode}
                          </code>
                          <Badge variant="outline">{invite.role}</Badge>
                        </div>
                        {invite.email && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {invite.email}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => expireInviteMutation.mutate(invite.id)}
                        disabled={expireInviteMutation.isPending}
                        data-testid={`button-revoke-${invite.id}`}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
