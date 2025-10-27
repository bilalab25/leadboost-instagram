export interface FlowNode {
  id: string;
  type: "message" | "action" | "condition";
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    actionType?: string;
    conditionLogic?: string;
  };
}

export interface Connection {
  from: string;
  to: string;
}

export interface Flow {
  id: string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  connections: Connection[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "campaigner_flows";

export class FlowStorage {
  static getAllFlows(): Flow[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading flows:", error);
      return [];
    }
  }

  static getFlow(id: string): Flow | null {
    const flows = this.getAllFlows();
    return flows.find((f) => f.id === id) || null;
  }

  static saveFlow(flow: Flow): void {
    const flows = this.getAllFlows();
    const existingIndex = flows.findIndex((f) => f.id === flow.id);

    if (existingIndex >= 0) {
      flows[existingIndex] = { ...flow, updatedAt: new Date().toISOString() };
    } else {
      flows.push(flow);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
  }

  static deleteFlow(id: string): void {
    const flows = this.getAllFlows();
    const filtered = flows.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  static createNewFlow(name: string, description?: string): Flow {
    return {
      id: `flow-${Date.now()}`,
      name,
      description,
      nodes: [],
      connections: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
