import { Handle, Position } from "@xyflow/react";
import { MessageSquare, Settings, GitBranch, Trash2 } from "lucide-react";
import { FlowNode } from "@/lib/flowStorage";

interface CustomNodeData {
  label: string;
  content?: string;
  actionType?: string;
  conditionLogic?: FlowNode["data"]["conditionLogic"];
  onDelete?: () => void;
  isRunning?: boolean;
}

interface CustomNodeProps {
  data: CustomNodeData;
  selected?: boolean;
}

export function MessageNode({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={`relative bg-blue-50 border-2 ${
        selected ? "border-blue-500" : "border-blue-200"
      } rounded-lg shadow-md min-w-[180px] transition-all ${
        data.isRunning ? "ring-4 ring-green-400 ring-opacity-50 animate-pulse" : ""
      }`}
      data-testid={`node-message`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3"
        data-testid="handle-target-top"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm text-gray-700">
              {data.label || "Message"}
            </span>
          </div>
          {data.onDelete && (
            <button
              onClick={data.onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
              data-testid={`button-delete-node`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {data.content && (
          <p className="text-xs text-gray-600 line-clamp-2">{data.content}</p>
        )}
        {data.isRunning && (
          <span className="text-xs text-green-600 font-medium">Running...</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3"
        data-testid="handle-source-bottom"
      />
    </div>
  );
}

export function ActionNode({ data, selected }: CustomNodeProps) {
  return (
    <div
      className={`relative bg-purple-50 border-2 ${
        selected ? "border-purple-500" : "border-purple-200"
      } rounded-lg shadow-md min-w-[180px] transition-all ${
        data.isRunning ? "ring-4 ring-green-400 ring-opacity-50 animate-pulse" : ""
      }`}
      data-testid={`node-action`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3"
        data-testid="handle-target-top"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-sm text-gray-700">
              {data.label || "Action"}
            </span>
          </div>
          {data.onDelete && (
            <button
              onClick={data.onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
              data-testid={`button-delete-node`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {data.actionType && (
          <p className="text-xs text-gray-600 capitalize">{data.actionType}</p>
        )}
        {data.isRunning && (
          <span className="text-xs text-green-600 font-medium">Running...</span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 !w-3 !h-3"
        data-testid="handle-source-bottom"
      />
    </div>
  );
}

export function ConditionNode({ data, selected }: CustomNodeProps) {
  const hasConditions = data.conditionLogic && data.conditionLogic.rules.length > 0;

  return (
    <div
      className={`relative bg-yellow-50 border-2 ${
        selected ? "border-yellow-500" : "border-yellow-200"
      } rounded-lg shadow-md min-w-[180px] transition-all ${
        data.isRunning ? "ring-4 ring-green-400 ring-opacity-50 animate-pulse" : ""
      }`}
      data-testid={`node-condition`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-yellow-500 !w-3 !h-3"
        data-testid="handle-target-top"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-yellow-600" />
            <span className="font-medium text-sm text-gray-700">
              {data.label || "Condition"}
            </span>
          </div>
          {data.onDelete && (
            <button
              onClick={data.onDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
              data-testid={`button-delete-node`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {hasConditions && (
          <div className="text-xs text-gray-600">
            {data.conditionLogic!.rules.length} rule(s) -{" "}
            {data.conditionLogic!.logic}
          </div>
        )}
        {data.isRunning && (
          <span className="text-xs text-green-600 font-medium">Running...</span>
        )}
      </div>

      <div className="flex justify-between px-4 pb-2">
        <div className="text-xs text-green-600 font-medium">True</div>
        <div className="text-xs text-red-600 font-medium">False</div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !w-3 !h-3 !-left-2"
        style={{ left: "30%" }}
        data-testid="handle-source-true"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500 !w-3 !h-3 !-right-2"
        style={{ left: "70%" }}
        data-testid="handle-source-false"
      />
    </div>
  );
}
