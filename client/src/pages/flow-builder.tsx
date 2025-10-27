import { useState } from "react";
import Draggable from "react-draggable";
import {
  MessageSquare,
  Settings,
  GitBranch,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

interface FlowNode {
  id: string;
  type: "message" | "action" | "condition";
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
  };
}

interface Connection {
  from: string;
  to: string;
}

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

export default function VisualFlowBuilder() {
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<FlowNode[]>([
    {
      id: "node-1",
      type: "message",
      position: { x: 200, y: 100 },
      data: { label: "Welcome Message", content: "Hey there! 👋" },
    },
    {
      id: "node-2",
      type: "action",
      position: { x: 200, y: 280 },
      data: { label: "Wait 2 days" },
    },
    {
      id: "node-3",
      type: "condition",
      position: { x: 200, y: 460 },
      data: { label: "User replied?", content: "If user says yes..." },
    },
    {
      id: "node-4",
      type: "message",
      position: { x: 50, y: 640 },
      data: { label: "Yes Response", content: "Great! Let's continue 🎉" },
    },
    {
      id: "node-5",
      type: "message",
      position: { x: 350, y: 640 },
      data: { label: "No Response", content: "No problem! Maybe later 😊" },
    },
  ]);

  const [connections] = useState<Connection[]>([
    { from: "node-1", to: "node-2" },
    { from: "node-2", to: "node-3" },
    { from: "node-3", to: "node-4" },
    { from: "node-3", to: "node-5" },
  ]);

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

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);

  const renderNode = (node: FlowNode) => {
    const nodeType = nodeTypes.find((nt) => nt.type === node.type);
    if (!nodeType) return null;

    const Icon = nodeType.icon;

    return (
      <Draggable
        key={node.id}
        position={node.position}
        onDrag={(_, data) => updateNodePosition(node.id, data.x, data.y)}
        onStop={(_, data) => updateNodePosition(node.id, data.x, data.y)}
        handle=".drag-handle"
        scale={zoom}
      >
        <div className="absolute cursor-move">
          <Card
            className={`w-64 ${nodeType.color} border-2 shadow-lg transition-all hover:shadow-xl drag-handle`}
            data-testid={`node-${node.id}`}
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
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Connection points */}
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
          <circle
            cx={endX}
            cy={endY}
            r="4"
            fill="#94a3b8"
            className="transition-all"
          />
        </g>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader pageName="Flow Builder" />

      <div className="flex bg-gray-50 h-[calc(100vh-64px)]">
        <Sidebar />

        {/* Left Sidebar - Block Types */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-3 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Flow Blocks
            </h2>
            <p className="text-sm text-gray-600">
              Click to add blocks to canvas
            </p>
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
                      <p className="text-xs text-gray-600">
                        {nodeType.description}
                      </p>
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Automation Flow Builder
              </h1>
              <p className="text-sm text-gray-600">
                Design your conversation flow
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">
                {Math.round(zoom * 100)}%
              </span>
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
            </div>
          </div>

          {/* Canvas with Grid Background */}
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
              {/* Container with zoom applied to both SVG and nodes */}
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                {/* SVG for connections */}
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  {renderConnections()}
                </svg>

                {/* Nodes */}
                <div className="relative" style={{ zIndex: 2 }}>
                  {nodes.map((node) => renderNode(node))}
                </div>
              </div>

              {/* Empty state hint */}
              {nodes.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Start Building Your Flow
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Click on a block type in the sidebar to add it to your
                      canvas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
