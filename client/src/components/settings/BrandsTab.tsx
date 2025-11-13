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
    <div className="space-y-6 mt-5">
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

      {/* BRAND LIST — Linear Style */}
      <div className="space-y-3">
        {brands.map((brand) => {
          const membership = memberships.find((m) => m.brandId === brand.id);
          const isActive = brand.id === activeBrandId;

          return (
            <div
              key={brand.id}
              className={`
                relative border rounded-2xl px-6 py-5 transition-all cursor-pointer
                bg-white shadow-sm hover:shadow-md
                ${isActive ? "border-brand-500 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]" : "border-gray-200"}
              `}
              onClick={() => {
                if (!isActive) setActiveBrandId(brand.id);
              }}
            >
              <div className="flex items-center justify-between">
                {/* LEFT: Brand Info */}
                <div className="flex items-center gap-5">
                  {/* Brand Color Avatar - bigger */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-semibold shadow-sm"
                    style={{ backgroundColor: brand.primaryColor || "#6366f1" }}
                  >
                    {brand.name.charAt(0)}
                  </div>

                  {/* Name + Role */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900">
                        {brand.name}
                      </span>

                      {isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{brand.industry || "No industry specified"}</span>
                      <span className="text-gray-300">•</span>
                      <span className="capitalize flex items-center gap-1">
                        {getRoleIcon(membership?.role || "")}
                        {membership?.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Always visible action buttons */}
                <div className="flex items-center gap-3">
                  {/* Manage Members */}
                  {membership &&
                    ["owner", "admin"].includes(membership.role) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBrandId(brand.id);
                          setManageDialogOpen(true);
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    )}

                  {/* Set Active */}
                  {!isActive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBrandId(brand.id);
                      }}
                      className="bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {brands.length === 0 && (
          <div className="border border-gray-200 rounded-xl p-10 text-center bg-white shadow-sm">
            <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No brands yet</p>
            <p className="text-sm text-gray-500">
              Create or join a brand to get started.
            </p>
          </div>
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

  const { data: members = [], isLoading: membersLoading } = useQuery<
    BrandMembership[]
  >({
    queryKey: ["brand-members", brandId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/brands/${brandId}/members`);
      return res.json();
    },
    enabled: !!brandId && isOpen,
  });

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
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (membershipId: string) =>
      apiRequest("DELETE", `/api/brand-memberships/${membershipId}`),
    onSuccess: () => {
      toast({ title: "Member removed" });
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (invId: string) =>
      apiRequest("POST", `/api/brand-invitations/${invId}/expire`),
    onSuccess: () => {
      toast({ title: "Invitation revoked" });
    },
  });

  const handleGenerateCode = async () => {
    if (!brandId) return;

    try {
      const response = await fetch(
        `/api/brand-invitations?brandId=${brandId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: inviteRole,
            email: inviteEmail || null,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to generate code");

      const data: BrandInvitation = await response.json();
      setGeneratedCode(data.inviteCode);
      setInviteEmail("");
      toast({ title: "Invitation created" });
    } catch (error) {
      toast({ title: "Error creating invitation", variant: "destructive" });
    }
  };

  const getRoleIcon = (role: string) =>
    ({
      owner: <Crown className="w-4 h-4" />,
      admin: <Shield className="w-4 h-4" />,
      editor: <Edit className="w-4 h-4" />,
      viewer: <Eye className="w-4 h-4" />,
    })[role] || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl px-6 py-5">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Team Members
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Manage your team, roles and invitations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-5">
          {/* ------------------------ */}
          {/* INVITE SECTION */}
          {/* ------------------------ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Invite someone
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">
                    Role
                  </label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="mt-1">
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
                  <label className="text-xs font-medium text-gray-600">
                    Email (optional)
                  </label>
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button onClick={handleGenerateCode} className="w-full">
                Generate invite code
              </Button>

              {generatedCode && (
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg p-2 mt-2">
                  <code className="flex-1 text-sm">{generatedCode}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ------------------------ */}
          {/* MEMBERS LIST */}
          {/* ------------------------ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Members</h3>

            <div className="space-y-2">
              {membersLoading ? (
                <p className="text-gray-500 text-sm">Loading members...</p>
              ) : members.length === 0 ? (
                <p className="text-gray-500 text-sm">No members yet.</p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold text-sm">
                        {(m.user?.firstName || m.userId || "??")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {m.user?.firstName
                            ? `${m.user.firstName} ${m.user.lastName || ""}`
                            : m.userId}
                        </p>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {getRoleIcon(m.role)}
                          <span className="capitalize">{m.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* ROLE + ACTIONS */}
                    {m.role !== "owner" && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={m.role}
                          onValueChange={(role) =>
                            updateRoleMutation.mutate({
                              membershipId: m.id,
                              role,
                            })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-sm">
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
                          size="icon"
                          onClick={() => removeMemberMutation.mutate(m.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {m.role === "owner" && (
                      <Badge className="text-xs bg-gray-100 text-gray-700">
                        Owner
                      </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ------------------------ */}
          {/* INVITATIONS LIST */}
          {/* ------------------------ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Pending Invitations
            </h3>

            <div className="space-y-2">
              {invLoading ? (
                <p className="text-gray-500 text-sm">Loading invitations…</p>
              ) : invitations.filter((i) => i.status === "pending").length ===
                0 ? (
                <p className="text-gray-500 text-sm">No pending invitations.</p>
              ) : (
                invitations
                  .filter((i) => i.status === "pending")
                  .map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                            {i.inviteCode}
                          </code>
                          <Badge variant="outline" className="capitalize">
                            {i.role}
                          </Badge>
                        </div>

                        {i.email && (
                          <p className="text-xs text-gray-500 mt-1">
                            {i.email}
                          </p>
                        )}

                        <p className="text-xs text-gray-400 mt-0.5">
                          Expires: {new Date(i.expiresAt).toLocaleDateString()}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeInviteMutation.mutate(i.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
