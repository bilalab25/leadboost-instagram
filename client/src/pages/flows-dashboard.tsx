import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight,
  GitBranch,
  MessageSquare,
  Plus,
  Settings2,
  Sparkles,
  Split,
  Timer,
  Webhook,
  Zap,
} from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlowStorage, Flow } from "@/lib/flowStorage";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

const features = [
  {
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
    en: {
      title: "Trigger-Based Automation",
      desc: "Launch flows automatically when a customer messages, clicks a link, or reaches a milestone.",
    },
    es: {
      title: "Automatización por Disparadores",
      desc: "Inicia flujos automáticamente cuando un cliente escribe, hace clic o alcanza un hito.",
    },
  },
  {
    icon: Split,
    color: "text-violet-500",
    bg: "bg-violet-50",
    en: {
      title: "Conditional Logic",
      desc: "Branch conversations based on customer replies, tags, or any custom condition you define.",
    },
    es: {
      title: "Lógica Condicional",
      desc: "Bifurca conversaciones según respuestas, etiquetas o cualquier condición personalizada.",
    },
  },
  {
    icon: MessageSquare,
    color: "text-blue-500",
    bg: "bg-blue-50",
    en: {
      title: "Multi-Platform Messaging",
      desc: "Send messages across WhatsApp, Instagram, and Facebook from a single flow canvas.",
    },
    es: {
      title: "Mensajería Multiplataforma",
      desc: "Envía mensajes a WhatsApp, Instagram y Facebook desde un solo canvas.",
    },
  },
  {
    icon: Timer,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    en: {
      title: "Time Delays & Scheduling",
      desc: "Wait hours, days, or until a specific time before the next step runs.",
    },
    es: {
      title: "Retrasos y Programación",
      desc: "Espera horas, días o hasta un momento específico antes del siguiente paso.",
    },
  },
  {
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-50",
    en: {
      title: "AI-Powered Replies",
      desc: "Let AI respond to customer messages intelligently mid-flow using your brand context.",
    },
    es: {
      title: "Respuestas con IA",
      desc: "Deja que la IA responda mensajes de clientes de forma inteligente usando el contexto de tu marca.",
    },
  },
  {
    icon: Webhook,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
    en: {
      title: "Webhook & API Actions",
      desc: "Trigger external systems, update CRMs, and fire webhooks at any step in your flow.",
    },
    es: {
      title: "Webhooks y Acciones API",
      desc: "Activa sistemas externos, actualiza CRMs y dispara webhooks en cualquier paso.",
    },
  },
];

const flowPreviewNodes = [
  {
    label: "Customer sends message",
    icon: MessageSquare,
    color: "bg-blue-500",
    x: "left-0",
    y: "top-0",
  },
  {
    label: "AI reads intent",
    icon: Sparkles,
    color: "bg-violet-500",
    x: "left-1/2 -translate-x-1/2",
    y: "top-0",
  },
  {
    label: "Send reply",
    icon: SiWhatsapp,
    color: "bg-emerald-500",
    x: "right-0",
    y: "top-0",
  },
];

export default function FlowsDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [flows, setFlows] = useState<Flow[]>(FlowStorage.getAllFlows());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDescription, setNewFlowDescription] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your flow",
        variant: "destructive",
      });
      return;
    }
    const newFlow = FlowStorage.createNewFlow(newFlowName, newFlowDescription);
    FlowStorage.saveFlow(newFlow);
    setFlows(FlowStorage.getAllFlows());
    setIsCreateDialogOpen(false);
    setNewFlowName("");
    setNewFlowDescription("");
    toast({
      title: "Flow created",
      description: `"${newFlowName}" has been created successfully`,
    });
    navigate(`/flow-builder/${newFlow.id}`);
  };

  const handleDeleteFlow = (flowId: string) => {
    FlowStorage.deleteFlow(flowId);
    setFlows(FlowStorage.getAllFlows());
    setDeleteConfirmId(null);
    toast({ title: "Flow deleted", description: "The flow has been removed" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero */}
        <div
          className="relative rounded-2xl overflow-hidden p-8 sm:p-12"
          style={{
            background:
              "linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)",
          }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-semibold tracking-wide uppercase">
                {isSpanish ? "Próximamente" : "Coming Soon"}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
                {isSpanish ? (
                  <>
                    Automatiza tus
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      conversaciones
                    </span>
                  </>
                ) : (
                  <>
                    Automate your
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      customer conversations
                    </span>
                  </>
                )}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-md leading-relaxed">
                {isSpanish
                  ? "Construye flujos visuales con arrastrar y soltar para automatizar respuestas, calificar leads y guiar clientes — en piloto automático."
                  : "Build visual drag-and-drop flows to automate replies, qualify leads, and guide customers — on autopilot."}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="lg"
                disabled
                data-testid="button-create-flow"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 gap-2 opacity-70 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                {isSpanish ? "Crear Flujo" : "Create Flow"}
              </Button>
              <p className="text-slate-500 text-xs text-center mt-2">
                {isSpanish ? "Disponible pronto" : "Available soon"}
              </p>
            </div>
          </div>

          {/* Platform chips */}
          <div className="relative z-10 flex flex-wrap gap-3 mt-8 pt-8 border-t border-white/10">
            <p className="text-slate-500 text-xs self-center mr-1 uppercase tracking-wider font-medium">
              {isSpanish ? "Canales:" : "Channels:"}
            </p>
            {[
              { icon: SiWhatsapp, name: "WhatsApp", color: "#25D366" },
              { icon: SiInstagram, name: "Instagram", color: "#E1306C" },
              { icon: SiFacebook, name: "Facebook", color: "#1877F2" },
            ].map(({ icon: Icon, name, color }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
              >
                <Icon style={{ color }} className="w-3.5 h-3.5" />
                <span className="text-slate-300 text-xs font-medium">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Visual flow preview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <GitBranch className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-800">
              {isSpanish ? "Vista previa del constructor" : "Builder preview"}
            </h2>
            <Badge
              variant="outline"
              className="ml-auto text-xs text-gray-400 border-gray-200"
            >
              {isSpanish ? "Próximamente" : "Coming soon"}
            </Badge>
          </div>

          {/* Mock canvas */}
          <div className="relative bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 min-h-[180px] overflow-hidden">
            {/* Grid dots background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative flex items-center justify-between gap-2">
              {/* Node 1 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-sm w-full max-w-[120px]">
                  <p className="text-[11px] font-medium text-gray-700">
                    {isSpanish ? "Cliente escribe" : "Customer writes"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {isSpanish ? "Disparador" : "Trigger"}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />

              {/* Node 2 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-200">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-sm w-full max-w-[120px]">
                  <p className="text-[11px] font-medium text-gray-700">
                    {isSpanish ? "IA detecta intención" : "AI reads intent"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {isSpanish ? "Condición" : "Condition"}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />

              {/* Node 3 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <SiWhatsapp className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-sm w-full max-w-[120px]">
                  <p className="text-[11px] font-medium text-gray-700">
                    {isSpanish ? "Enviar respuesta" : "Send reply"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {isSpanish ? "Acción" : "Action"}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />

              {/* Node 4 */}
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                  <Settings2 className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center shadow-sm w-full max-w-[120px]">
                  <p className="text-[11px] font-medium text-gray-700">
                    {isSpanish ? "Asignar agente" : "Assign agent"}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {isSpanish ? "Acción" : "Action"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-800">
              {isSpanish ? "Lo que viene" : "What's coming"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const copy = isSpanish ? f.es : f.en;
              return (
                <div
                  key={f.en.title}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${f.bg} flex items-center justify-center mb-3`}
                  >
                    <f.icon className={`w-4 h-4 ${f.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {copy.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {copy.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Flow Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-flow">
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
            <DialogDescription>
              Give your automation flow a name and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input
                id="flow-name"
                placeholder="e.g., Welcome Sequence"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                data-testid="input-flow-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flow-description">Description (optional)</Label>
              <Textarea
                id="flow-description"
                placeholder="Describe what this flow does..."
                value={newFlowDescription}
                onChange={(e) => setNewFlowDescription(e.target.value)}
                rows={3}
                data-testid="input-flow-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFlow}
              data-testid="button-confirm-create"
            >
              Create Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Delete Flow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flow? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmId && handleDeleteFlow(deleteConfirmId)
              }
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
