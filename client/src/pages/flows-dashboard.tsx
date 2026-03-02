import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Edit, Play, Trash2, GitBranch, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { FlowStorage, Flow } from "@/lib/flowStorage";
import { useToast } from "@/hooks/use-toast";

export default function FlowsDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
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

  const handleEditFlow = (flowId: string) => {
    navigate(`/flow-builder/${flowId}`);
  };

  const handleRunFlow = (flow: Flow) => {
    navigate(`/flow-builder/${flow.id}?run=true`);
  };

  const handleDeleteFlow = (flowId: string) => {
    FlowStorage.deleteFlow(flowId);
    setFlows(FlowStorage.getAllFlows());
    setDeleteConfirmId(null);

    toast({
      title: "Flow deleted",
      description: "The flow has been removed",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        <div className="flex-1 p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Automation Flows
                </h1>
                <p className="text-gray-600 mt-1">
                  Create and manage your automation workflows
                </p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
                data-testid="button-create-flow"
                disabled
              >
                <Plus className="h-4 w-4" />
                Create New Flow
              </Button>
            </div>
          </div>

          {/* Flows Grid */}
          <Card className="p-12 text-center">
            <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Comming Soon
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your own automation flow. Build conversations, set
              conditions, and automate your customer interactions.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
              data-testid="button-create-first-flow"
              disabled
            >
              <Plus className="h-4 w-4" />
              Create Your First Flow
            </Button>
          </Card>
          {/*  {flows.length === 0 ? (
            <Card className="p-12 text-center">
              <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No flows yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first automation flow. Build
                conversations, set conditions, and automate your customer
                interactions.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
                data-testid="button-create-first-flow"
              >
                <Plus className="h-4 w-4" />
                Create Your First Flow
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flows.map((flow) => (
                <Card
                  key={flow.id}
                  className="p-6 hover:shadow-lg transition-shadow"
                  data-testid={`flow-card-${flow.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GitBranch className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {flow.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(flow.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {flow.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {flow.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {flow.nodes.length} nodes
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {flow.connections.length} connections
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditFlow(flow.id)}
                      data-testid={`button-edit-${flow.id}`}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleRunFlow(flow)}
                      data-testid={`button-run-${flow.id}`}
                    >
                      <Play className="h-4 w-4" />
                      Run
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(flow.id)}
                      data-testid={`button-delete-${flow.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )} */}
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
