import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBrand } from "@/contexts/BrandContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  UserPlus,
  Copy,
  Users,
  Crown,
  Shield,
  Eye,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";

// ----------------------
// ZOD SCHEMAS
// ----------------------
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

// ----------------------
// TYPES
// ----------------------
interface BrandMembership {
  id: string;
  brandId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
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

// ----------------------
// MAIN COMPONENT
// ----------------------
export default function BrandsTab() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<BrandMembership[]>([]);
  const { toast } = useToast();
  const { brands, refreshBrands, activeBrandId, setActiveBrandId } = useBrand();

  // Fetch memberships for role badges, etc.
  // BrandsTab.tsx (Cerca de la línea 92)

  // ... Supongamos que usas useState para gestionar las membresías:
  // const [memberships, setMemberships] = useState([]);

  const fetchBrandMemberships = async () => {
    try {
      // 1. Llamada a la API
      const response = await fetch("/api/brand-memberships");

      // 2. Manejo de errores HTTP (si la respuesta no es 2xx)
      if (!response.ok) {
        console.error("Error en la API:", response.statusText);
        // Opcional: lanzar un error para el catch
        throw new Error(
          "Failed to fetch brand memberships: " + response.status,
        );
      }

      // 3. Procesar la respuesta JSON
      const data = await response.json();

      // 4. Actualizar el estado con el array (el backend devuelve un array)
      // Esto asegura que 'memberships' ya no sea el Array [] vacío inicial
      // sino el array con el objeto de membresía.
      setMemberships(data);
    } catch (error) {
      // 5. Manejo del error de red o de parsing
      console.error("❌ Error al obtener membresías:", error);
      // IMPORTANTE: En caso de fallo, forzamos que el estado siga siendo un array vacío,
      // lo que evita el TypeError de 'length' si 'memberships' fuera undefined.
      setMemberships([]);
    }
  };
  console.log(memberships, "memberships");
  useEffect(() => {
    fetchBrandMemberships();
  }, []);

  // ----------------------
  // CREATE BRAND
  // ----------------------
  const createForm = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      industry: "",
      description: "",
      brandColor: "#6366f1",
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: CreateBrandForm) =>
      apiRequest("POST", "/api/brands/create", data),
    onSuccess: () => {
      toast({ title: "Brand created successfully" });
      createForm.reset();
      refreshBrands();
      setCreateDialogOpen(false);
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to create brand",
        description: error.message,
        variant: "destructive",
      }),
  });

  // ----------------------
  // JOIN BRAND
  // ----------------------
  const joinForm = useForm<JoinBrandForm>({
    resolver: zodResolver(joinBrandSchema),
    defaultValues: { inviteCode: "" },
  });

  const joinBrandMutation = useMutation({
    mutationFn: async (data: JoinBrandForm) =>
      apiRequest("POST", "/api/brand-invitations/accept", data),
    onSuccess: () => {
      toast({ title: "Joined brand successfully" });
      joinForm.reset();
      refreshBrands();
      setJoinDialogOpen(false);
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to join brand",
        description: error.message,
        variant: "destructive",
      }),
  });

  // ----------------------
  // ROLE ICONS
  // ----------------------
  const getRoleIcon = (role: string) =>
    ({
      owner: <Crown className="h-4 w-4" />,
      admin: <Shield className="h-4 w-4" />,
      editor: <Edit className="h-4 w-4" />,
      viewer: <Eye className="h-4 w-4" />,
    })[role] || null;

  const getRoleBadgeVariant = (role: string) =>
    ({
      owner: "default",
      admin: "secondary",
      editor: "outline",
      viewer: "outline",
    })[role] || "outline";

  // ----------------------
  // UI
  // ----------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Brands</h2>
          <p className="text-gray-600">
            Manage brands you own or are a member of
          </p>
        </div>

        <div className="flex gap-2">
          {/* JOIN BRAND */}
          <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Join Brand
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Brand</DialogTitle>
                <DialogDescription>
                  Enter an invitation code to join an existing brand.
                </DialogDescription>
              </DialogHeader>

              <Form {...joinForm}>
                <form
                  onSubmit={joinForm.handleSubmit((data) =>
                    joinBrandMutation.mutate(data),
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
                          <Input {...field} placeholder="Enter code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setJoinDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={joinBrandMutation.isPending}
                    >
                      {joinBrandMutation.isPending
                        ? "Joining..."
                        : "Join Brand"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* CREATE BRAND */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Brand
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Brand</DialogTitle>
              </DialogHeader>

              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit((data) =>
                    createBrandMutation.mutate(data),
                  )}
                  className="space-y-4"
                >
                  {/* Name */}
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brand name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Industry */}
                  <FormField
                    control={createForm.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Industry" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Brand description"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color */}
                  <FormField
                    control={createForm.control}
                    name="brandColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Color</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-20 h-10"
                          />
                          <Input {...field} placeholder="#6366f1" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createBrandMutation.isPending}
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

      {/* BRAND LIST */}
      {/* BRAND LIST */}
      <div className="grid gap-4">
        {brands.map((brand) => {
          const membership = memberships.find((m) => m.brandId === brand.id);

          console.log("────────────────────────────────────────");
          console.log("🧩 Brand:", {
            id: brand.id,
            name: brand.name,
            primaryColor: brand.primaryColor,
          });
          console.log("➡️ membership for this brand:", membership);
          console.log("➡️ activeBrandId:", activeBrandId);

          const isActiveBug = brand.id === membership; // <-- EL BUG ORIGINAL
          const isActiveCorrect = brand.id === activeBrandId; // <-- Para comparar

          console.log("❓ isActiveBug (brand.id === membership):", isActiveBug);
          console.log(
            "❓ isActiveCorrect (brand.id === activeBrandId):",
            isActiveCorrect,
          );

          console.log(
            "🔍 Should show Manage Members?",
            membership && ["owner", "admin"].includes(membership.role),
          );

          return (
            <Card
              key={brand.id}
              className={isActiveBug ? "border-indigo-500 border-2" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                      style={{
                        backgroundColor: brand.primaryColor || "#6366f1",
                      }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {brand.name}
                        {isActiveBug && <Badge>Active</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {brand.industry || "No industry specified"}
                      </CardDescription>
                    </div>
                  </div>

                  <div>
                    {membership && (
                      <Badge
                        variant={getRoleBadgeVariant(membership.role)}
                        className="flex items-center gap-1"
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
                  {!isActiveBug && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveBrandId(brand.id)}
                    >
                      Switch
                    </Button>
                  )}

                  {membership &&
                    ["owner", "admin"].includes(membership.role) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          console.log(
                            "👥 Opening Manage Members for:",
                            brand.id,
                          );
                          setSelectedBrandId(brand.id);
                          setManageDialogOpen(true);
                        }}
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
              <p className="text-gray-600 text-center mb-4">
                Create a new brand or join an existing one to get started
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* TEAM MANAGEMENT DIALOG */}
      <ManageMembersDialog
        isOpen={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        brandId={selectedBrandId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MANAGE MEMBERS DIALOG
// ---------------------------------------------------------------------------
function ManageMembersDialog({
  isOpen,
  onClose,
  brandId,
}: {
  isOpen: boolean;
  onClose: () => void;
  brandId: string | null;
}) {
  const { toast } = useToast();
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  //if (!brandId) return null;

  // ----------------------
  // MEMBERS
  // ----------------------
  const { data: members = [], isLoading: membersLoading } = useQuery<
    BrandMembership[]
  >({
    queryKey: ["brand-members", brandId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/brands/${brandId}/members`);
      const membersData = await res.json();
      return membersData;
    },
    enabled: !!brandId && isOpen,
  });

  // ----------------------
  // INVITATIONS
  // ----------------------
  const { data: invitations = [], isLoading: invLoading } = useQuery<
    BrandInvitation[]
  >({
    queryKey: ["brand-invitations", brandId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/brand-invitations/${brandId}`);

      return res.json();
    },
    enabled: !!brandId && isOpen,
  });

  // ----------------------
  // CREATE INVITATION (Función con fetch nativo)
  // ----------------------
  const handleGenerateCode = async () => {
    if (!brandId) return;

    try {
      const response = await fetch(
        `/api/brand-invitations?brandId=${brandId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: inviteRole,
            email: inviteEmail || null,
          }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server failed to generate code");
      }
      const data: BrandInvitation = await response.json();
      setGeneratedCode(data.inviteCode);
      setInviteEmail("");
      toast({
        title: "Invitation created",
        description: "Copy the code and share it.",
      });
      queryClient.invalidateQueries({
        queryKey: ["brand-invitations", brandId],
      });
    } catch (error) {
      console.error("Error generating code:", error);
      toast({
        title: "Failed to generate invitation",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      membershipId,
      role,
    }: {
      membershipId: string;
      role: string;
    }) =>
      apiRequest("PATCH", `/api/brand-memberships/${membershipId}/role`, {
        role,
      }),
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries(["brand-members", brandId]);
    },
  });

  // ----------------------
  // REMOVE MEMBER
  // ----------------------
  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) =>
      apiRequest("DELETE", `/api/brand-memberships/${membershipId}`),
    onSuccess: () => {
      toast({ title: "Member removed" });
      queryClient.invalidateQueries(["brand-members", brandId]);
    },
  });

  // ----------------------
  // REVOKE INVITATION
  // ----------------------
  const revokeInviteMutation = useMutation({
    mutationFn: async (invId: string) =>
      apiRequest("POST", `/api/brand-invitations/${invId}/expire`),
    onSuccess: () => {
      toast({ title: "Invitation revoked" });
      queryClient.invalidateQueries(["brand-invitations", brandId]);
    },
  });

  // ----------------------
  // ROLE ICON
  // ----------------------
  const getRoleIcon = (role: string) =>
    ({
      owner: <Crown className="h-4 w-4" />,
      admin: <Shield className="h-4 w-4" />,
      editor: <Edit className="h-4 w-4" />,
      viewer: <Eye className="h-4 w-4" />,
    })[role] || null;

  // ----------------------
  // UI DIALOG
  // ----------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* ---------------------------------- */}
          {/* CREATE INVITATION */}
          {/* ---------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Invitation</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Role */}
                <div>
                  <label className="text-sm">Role</label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm">Email (optional)</label>
                  <Input
                    placeholder="member@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleGenerateCode}>Generate Code</Button>

              {generatedCode && (
                <div className="flex items-center gap-2 bg-gray-100 p-3 rounded">
                  <code className="flex-1">{generatedCode}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---------------------------------- */}
          {/* MEMBERS LIST */}
          {/* ---------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>

            <CardContent>
              {membersLoading ? (
                <p>Loading members…</p>
              ) : members.length === 0 ? (
                <p className="text-gray-600">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border rounded flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                          {(m.user?.firstName || m.userId || "??")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium">
                            {m.user?.firstName
                              ? `${m.user.firstName} ${m.user.lastName || ""}`
                              : m.userId}
                          </p>

                          <div className="flex gap-1 items-center text-sm">
                            {getRoleIcon(m.role)}
                            <span>{m.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Only non-owner can be updated */}
                        {m.role !== "owner" && (
                          <>
                            <Select
                              value={m.role}
                              onValueChange={(role) =>
                                updateRoleMutation.mutate({
                                  membershipId: m.id,
                                  role,
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMemberMutation.mutate(m.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}

                        {m.role === "owner" && <Badge>Owner</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ---------------------------------- */}
          {/* PENDING INVITES */}
          {/* ---------------------------------- */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>

            <CardContent>
              {invLoading ? (
                <p>Loading invitations…</p>
              ) : invitations.filter((i) => i.status === "pending").length ===
                0 ? (
                <p className="text-gray-600">No pending invitations.</p>
              ) : (
                invitations
                  .filter((i) => i.status === "pending")
                  .map((i) => (
                    <div
                      key={i.id}
                      className="p-3 border rounded flex items-center justify-between"
                    >
                      <div>
                        <div className="flex gap-2 items-center">
                          <code className="bg-gray-100 px-2 py-1 rounded">
                            {i.inviteCode}
                          </code>
                          <Badge variant="outline">{i.role}</Badge>
                        </div>

                        {i.email && (
                          <p className="text-sm text-gray-600">{i.email}</p>
                        )}

                        <p className="text-xs text-gray-400">
                          Expires: {new Date(i.expiresAt).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeInviteMutation.mutate(i.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
