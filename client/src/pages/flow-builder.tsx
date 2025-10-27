import { useState, useEffect } from "react";
import { useLocation, useRoute, useParams } from "wouter";
import Draggable from "react-draggable";
import {
  MessageSquare,
  Settings,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useToast } from "@/hooks/use-toast";
import { FlowStorage, FlowNode, Connection, Flow } from "@/lib/flowStorage";

const nodeTypes = [
  {
    type: "message" as const,
    icon: MessageSquare,
    label: "Message",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconColor: "text-blue-600",
    description: "Send a message",
  },
  {
    type: "action" as const,
    icon: Settings,
    label: "Action",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconColor: "text-purple-600",
    description: "Perform an action",
  },
  {
    type: "condition" as const,
    icon: GitBranch,
    label: "Condition",
    color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    iconColor: "text-yellow-600",
    description: "Add a condition",
  },
];

const actionTypes = [
  { value: "wait", label: "Wait" },
  { value: "tag", label: "Add Tag" },
  { value: "notify", label: "Send Notification" },
  { value: "webhook", label: "Call Webhook" },
];

export default function VisualFlowBuilder() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/flow-builder/:id");
  const flowId = params?.id;
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const runMode = searchParams.get("run") === "true";

  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("Untitled Flow");
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningNodeId, setCurrentRunningNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (flowId) {
      const flow = FlowStorage.getFlow(flowId);
      if (flow) {
        setFlowName(flow.name);
        setNodes(flow.nodes);
        setConnections(flow.connections);
      } else {
        toast({
          title: "Flow not found",
          description: "Redirecting to dashboard",
          variant: "destructive",
        });
        navigate("/flows-dashboard");
      }
    }
  }, [flowId]);

  useEffect(() => {
    if (runMode && !isRunning) {
      handleRunFlow();
    }
  }, [runMode]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => setZoom(1);

  const addNode = (type: "message" | "action" | "condition") => {
    const newNode: FlowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250, y: 100 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        content: type === "message" ? "Enter your message..." : undefined,
        actionType: type === "action" ? "wait" : undefined,
        conditionLogic: type === "condition" ? "" : undefined,
      },
    };
    setNodes([...nodes, newNode]);
  };

  const updateNodePosition = (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, position: { x, y } } : node
      )
    );
  };

  const updateNodeData = (id: string, data: Partial<FlowNode["data"]>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  const deleteNode = (id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setConnections((prev) =>
      prev.filter((conn) => conn.from !== id && conn.to !== id)
    );
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);

  const handleSaveFlow = () => {
    if (!flowId) {
      toast({
        title: "Cannot save",
        description: "Please create a flow from the dashboard first",
        variant: "destructive",
      });
      return;
    }

    const existingFlow = FlowStorage.getFlow(flowId);
    if (!existingFlow) {
      toast({
        title: "Flow not found",
        variant: "destructive",
      });
      return;
    }

    const updatedFlow: Flow = {
      ...existingFlow,
      name: flowName,
      nodes,
      connections,
      updatedAt: new Date().toISOString(),
    };

    FlowStorage.saveFlow(updatedFlow);

    toast({
      title: "Flow saved",
      description: `"${flowName}" has been saved successfully`,
    });
  };

  const handleRunFlow = async () => {
    if (nodes.length === 0) {
      toast({
        title: "No nodes to run",
        description: "Add some nodes to your flow first",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    const sortedNodes = [...nodes].sort((a, b) => {
      const aConnections = connections.filter((c) => c.to === a.id).length;
      const bConnections = connections.filter((c) => c.to === b.id).length;
      return aConnections - bConnections;
    });

    for (const node of sortedNodes) {
      setCurrentRunningNodeId(node.id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCurrentRunningNodeId(null);
    setIsRunning(false);

    toast({
      title: "Flow execution complete",
      description: `Executed ${sortedNodes.length} nodes`,
    });
  };

  const renderNode = (node: FlowNode) => {
    const nodeType = nodeTypes.find((nt) => nt.type === node.type);
    if (!nodeType) return null;

    const Icon = nodeType.icon;
    const isSelected = selectedNodeId === node.id;
    const isRunningNode = currentRunningNodeId === node.id;

    return (
      <Draggable
        key={node.id}
        defaultPosition={node.position}
        onDrag={(_, data) => updateNodePosition(node.id, data.x, data.y)}
        onStop={(_, data) => updateNodePosition(node.id, data.x, data.y)}
        handle=".drag-handle"
        disabled={isRunning}
      >
        <div
          className="absolute cursor-move"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        >
          <Card
            className={`w-64 ${nodeType.color} border-2 ${
              isSelected ? "ring-2 ring-blue-500" : ""
            } ${
              isRunningNode ? "ring-4 ring-green-500 animate-pulse" : ""
            } shadow-lg transition-all hover:shadow-xl drag-handle`}
            data-testid={`node-${node.id}`}
            onClick={() => !isRunning && setSelectedNodeId(node.id)}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg bg-white shadow-sm ${nodeType.iconColor}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {node.data.label}
                  </h3>
                  {node.data.content && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {node.data.content}
                    </p>
                  )}
                  {node.data.actionType && (
                    <p className="text-sm text-gray-600">
                      Action: {actionTypes.find((a) => a.value === node.data.actionType)?.label}
                    </p>
                  )}
                  {node.data.conditionLogic && (
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {node.data.conditionLogic}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isRunningNode ? "bg-green-500 animate-ping" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-gray-500">
                      {isRunningNode ? "Running" : "Ready"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNode(node.id);
                  }}
                  disabled={isRunning}
                  data-testid={`button-delete-node-${node.id}`}
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
          </Card>
        </div>
      </Draggable>
    );
  };

  const renderConnections = () => {
    return connections.map((conn, index) => {
      const fromNode = getNodeById(conn.from);
      const toNode = getNodeById(conn.to);

      if (!fromNode || !toNode) return null;

      const startX = fromNode.position.x + 128;
      const startY = fromNode.position.y + 100;
      const endX = toNode.position.x + 128;
      const endY = toNode.position.y;

      const midY = (startY + endY) / 2;

      return (
        <g key={index}>
          <path
            d={`M ${startX} ${startY} 
                L ${startX} ${midY} 
                L ${endX} ${midY} 
                L ${endX} ${endY}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeDasharray="0"
            className="transition-all"
          />
          <circle cx={endX} cy={endY} r="4" fill="#94a3b8" className="transition-all" />
        </g>
      );
    });
  };

  const selectedNode = selectedNodeId ? getNodeById(selectedNodeId) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName={flowName} />

      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        <Sidebar />

        {/* Left Sidebar - Block Types */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-3 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Flow Blocks
            </h2>
            <p className="text-sm text-gray-600">Click to add blocks to canvas</p>
          </div>

          {nodeTypes.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <Card
                key={nodeType.type}
                className={`${nodeType.color} border-2 cursor-pointer transition-all hover:scale-105`}
                onClick={() => addNode(nodeType.type)}
                data-testid={`add-node-${nodeType.type}`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`${nodeType.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {nodeType.label}
                      </h3>
                      <p className="text-xs text-gray-600">{nodeType.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Quick Actions
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => addNode("message")}
              data-testid="button-quick-add-message"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Message
            </Button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/flows-dashboard")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{flowName}</h1>
                <p className="text-sm text-gray-600">Design your conversation flow</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunFlow}
                disabled={isRunning}
                className="gap-2"
                data-testid="button-run-flow"
              >
                <Play className="h-4 w-4" />
                {isRunning ? "Running..." : "Run Flow"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                data-testid="button-reset-zoom"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                onClick={handleSaveFlow}
                className="gap-2"
                data-testid="button-save-flow"
              >
                <Save className="h-4 w-4" />
                Save Flow
              </Button>
            </div>
          </div>

          {/* Canvas with Grid Background */}
          <div className="flex-1 flex">
            <div
              className="flex-1 relative overflow-auto"
              style={{
                backgroundImage: `
                  linear-gradient(0deg, transparent 24%, rgba(203, 213, 225, 0.3) 25%, rgba(203, 213, 225, 0.3) 26%, transparent 27%, transparent 74%, rgba(203, 213, 225, 0.3) 75%, rgba(203, 213, 225, 0.3) 76%, transparent 77%, transparent),
                  linear-gradient(90deg, transparent 24%, rgba(203, 213, 225, 0.3) 25%, rgba(203, 213, 225, 0.3) 26%, transparent 27%, transparent 74%, rgba(203, 213, 225, 0.3) 75%, rgba(203, 213, 225, 0.3) 76%, transparent 77%, transparent)
                `,
                backgroundSize: "50px 50px",
                backgroundColor: "#f8fafc",
              }}
            >
              <div className="relative w-full h-full min-h-[1000px]">
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    zIndex: 1,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  {renderConnections()}
                </svg>

                <div className="relative" style={{ zIndex: 2 }}>
                  {nodes.map((node) => renderNode(node))}
                </div>

                {nodes.length === 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Start Building Your Flow
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Click on a block type in the sidebar to add it to your canvas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Node Editor */}
            {selectedNode && (
              <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto" data-testid="panel-node-editor">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNodeId(null)}
                    data-testid="button-close-editor"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="node-label">Label</Label>
                    <Input
                      id="node-label"
                      value={selectedNode.data.label}
                      onChange={(e) =>
                        updateNodeData(selectedNode.id, { label: e.target.value })
                      }
                      placeholder="Node label"
                      data-testid="input-node-label"
                    />
                  </div>

                  {selectedNode.type === "message" && (
                    <div>
                      <Label htmlFor="message-content">Message Content</Label>
                      <Textarea
                        id="message-content"
                        value={selectedNode.data.content || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, { content: e.target.value })
                        }
                        placeholder="Enter your message..."
                        rows={5}
                        data-testid="textarea-message-content"
                      />
                    </div>
                  )}

                  {selectedNode.type === "action" && (
                    <div>
                      <Label htmlFor="action-type">Action Type</Label>
                      <Select
                        value={selectedNode.data.actionType || "wait"}
                        onValueChange={(value) =>
                          updateNodeData(selectedNode.id, { actionType: value })
                        }
                      >
                        <SelectTrigger id="action-type" data-testid="select-action-type">
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedNode.type === "condition" && (
                    <div>
                      <Label htmlFor="condition-logic">Condition Logic</Label>
                      <Textarea
                        id="condition-logic"
                        value={selectedNode.data.conditionLogic || ""}
                        onChange={(e) =>
                          updateNodeData(selectedNode.id, {
                            conditionLogic: e.target.value,
                          })
                        }
                        placeholder="e.g., if user replied 'yes'"
                        rows={4}
                        data-testid="textarea-condition-logic"
                      />
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Node Type</p>
                    <div className="flex items-center gap-2">
                      {nodeTypes.find((nt) => nt.type === selectedNode.type) && (
                        <>
                          {(() => {
                            const nodeType = nodeTypes.find(
                              (nt) => nt.type === selectedNode.type
                            )!;
                            const Icon = nodeType.icon;
                            return (
                              <>
                                <div className={`p-2 rounded-lg ${nodeType.iconColor}`}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {nodeType.label}
                                </span>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
