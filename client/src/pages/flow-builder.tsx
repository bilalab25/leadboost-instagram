import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection as RFConnection,
  addEdge,
  useNodesState,
  useEdgesState,
  getOutgoers,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  MessageSquare,
  Settings,
  GitBranch,
  Save,
  ArrowLeft,
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
import { MessageNode, ActionNode, ConditionNode } from "@/components/FlowNodes";
import { ConditionLogicBuilder } from "@/components/ConditionLogicBuilder";
import { nanoid } from "nanoid";

const nodeTypes = {
  message: MessageNode,
  action: ActionNode,
  condition: ConditionNode,
};

const blockTypes = [
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

function FlowBuilderContent() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/flow-builder/:id");
  const flowId = params?.id;
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const runMode = searchParams.get("run") === "true";

  const { toast } = useToast();
  const { getNodes, getEdges } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [flowName, setFlowName] = useState("Untitled Flow");
  const [isRunning, setIsRunning] = useState(false);
  const [currentRunningNodeId, setCurrentRunningNodeId] = useState<string | null>(null);

  // Load flow from storage
  useEffect(() => {
    if (flowId) {
      const flow = FlowStorage.getFlow(flowId);
      if (flow) {
        setFlowName(flow.name);
        
        // Convert stored nodes to ReactFlow format
        const rfNodes: Node[] = flow.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: {
            ...node.data,
            onDelete: () => handleDeleteNode(node.id),
            isRunning: false,
          },
        }));
        
        // Convert stored connections to ReactFlow edges
        const rfEdges: Edge[] = flow.connections.map((conn) => ({
          id: conn.id,
          source: conn.source,
          target: conn.target,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
          type: conn.type || "default",
          animated: conn.animated || false,
          label: conn.label,
        }));
        
        setNodes(rfNodes);
        setEdges(rfEdges);
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

  // Auto-run flow if in run mode
  useEffect(() => {
    if (runMode && !isRunning && nodes.length > 0) {
      handleRunFlow();
    }
  }, [runMode, nodes.length]);

  const addNode = (type: "message" | "action" | "condition") => {
    const newNode: Node = {
      id: `node-${nanoid(8)}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        content: type === "message" ? "Enter your message..." : undefined,
        actionType: type === "action" ? "wait" : undefined,
        conditionLogic: type === "condition" ? { logic: "AND", rules: [] } : undefined,
        onDelete: () => handleDeleteNode(`node-${nanoid(8)}`),
        isRunning: false,
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // Update onDelete callback when nodes change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onDelete: () => handleDeleteNode(node.id),
        },
      }))
    );
  }, [handleDeleteNode]);

  const updateNodeData = (id: string, data: Partial<FlowNode["data"]>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  // Connection validation: prevent duplicates and circular connections
  const isValidConnection = useCallback(
    (connection: Edge | RFConnection) => {
      const nodes = getNodes();
      const edges = getEdges();

      // Prevent self-loops
      if (connection.source === connection.target) {
        return false;
      }

      // Prevent duplicate connections
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle
      );

      if (isDuplicate) return false;

      // Prevent circular connections
      const target = nodes.find((node) => node.id === connection.target);
      if (!target) return false;

      const hasCycle = (node: Node, visited = new Set<string>()): boolean => {
        if (visited.has(node.id)) return false;
        visited.add(node.id);

        const outgoers = getOutgoers(node, nodes, edges);
        for (const outgoer of outgoers) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
        return false;
      };

      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  const onConnect = useCallback(
    (connection: RFConnection) => {
      const newEdge: Edge = {
        id: `edge-${nanoid(8)}`,
        ...connection,
        type: "default",
        animated: false,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

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

    // Convert ReactFlow nodes back to storage format
    const storageNodes: FlowNode[] = nodes.map((node) => ({
      id: node.id,
      type: node.type as "message" | "action" | "condition",
      position: node.position,
      data: {
        label: node.data.label as string,
        content: node.data.content as string | undefined,
        actionType: node.data.actionType as string | undefined,
        conditionLogic: node.data.conditionLogic as FlowNode["data"]["conditionLogic"],
      },
    }));

    // Convert ReactFlow edges back to storage format
    const storageConnections: Connection[] = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      type: edge.type,
      animated: edge.animated,
      label: typeof edge.label === "string" ? edge.label : undefined,
    }));

    const updatedFlow: Flow = {
      ...existingFlow,
      name: flowName,
      nodes: storageNodes,
      connections: storageConnections,
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
    
    // Sort nodes by incoming connections (start nodes first)
    const sortedNodes = [...nodes].sort((a, b) => {
      const aConnections = edges.filter((e) => e.target === a.id).length;
      const bConnections = edges.filter((e) => e.target === b.id).length;
      return aConnections - bConnections;
    });

    for (const node of sortedNodes) {
      setCurrentRunningNodeId(node.id);
      
      // Update node to show running state
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node.id
            ? { ...n, data: { ...n.data, isRunning: true } }
            : { ...n, data: { ...n.data, isRunning: false } }
        )
      );
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setCurrentRunningNodeId(null);
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isRunning: false } })));
    setIsRunning(false);

    toast({
      title: "Flow execution complete",
      description: `Executed ${sortedNodes.length} nodes`,
    });
  };

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;

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

          {blockTypes.map((blockType) => {
            const Icon = blockType.icon;
            return (
              <Card
                key={blockType.type}
                className={`${blockType.color} border-2 cursor-pointer transition-all hover:scale-105`}
                onClick={() => addNode(blockType.type)}
                data-testid={`add-node-${blockType.type}`}
              >
                <div className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`${blockType.iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {blockType.label}
                      </h3>
                      <p className="text-xs text-gray-600">{blockType.description}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="pt-4 border-t border-gray-200 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Flow Actions
            </h3>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleSaveFlow}
              data-testid="button-save-flow"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Flow
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleRunFlow}
              disabled={isRunning}
              data-testid="button-run-flow"
            >
              <Play className="w-4 h-4 mr-2" />
              {isRunning ? "Running..." : "Run Flow"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate("/flows-dashboard")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative bg-gray-100">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_event, node) => !isRunning && setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {/* Right Sidebar - Node Editor */}
        {selectedNode && (
          <div
            className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto"
            data-testid="panel-node-editor"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Node</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNodeId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Node Label</Label>
                <Input
                  value={selectedNode.data.label as string}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { label: e.target.value })
                  }
                  data-testid="input-node-label"
                  placeholder="Enter label"
                />
              </div>

              {selectedNode.type === "message" && (
                <div>
                  <Label>Message Content</Label>
                  <Textarea
                    value={(selectedNode.data.content as string) || ""}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, { content: e.target.value })
                    }
                    data-testid="textarea-message-content"
                    placeholder="Enter your message..."
                    rows={6}
                  />
                </div>
              )}

              {selectedNode.type === "action" && (
                <div>
                  <Label>Action Type</Label>
                  <Select
                    value={selectedNode.data.actionType as string}
                    onValueChange={(value) =>
                      updateNodeData(selectedNode.id, { actionType: value })
                    }
                  >
                    <SelectTrigger data-testid="select-action-type">
                      <SelectValue placeholder="Select action" />
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
                  <Label className="mb-2 block">Condition Logic</Label>
                  <ConditionLogicBuilder
                    value={selectedNode.data.conditionLogic as any}
                    onChange={(value) =>
                      updateNodeData(selectedNode.id, { conditionLogic: value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualFlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderContent />
    </ReactFlowProvider>
  );
}
