import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Info } from "lucide-react";
import { ConditionGroup, ConditionRule, ConditionOperator } from "@/lib/flowStorage";
import { nanoid } from "nanoid";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const operatorOptions: { value: ConditionOperator; label: string; description: string }[] = [
  { value: "equals", label: "Equals", description: "Exact match" },
  { value: "notEquals", label: "Not Equals", description: "Does not match" },
  { value: "contains", label: "Contains", description: "Contains text" },
  { value: "notContains", label: "Not Contains", description: "Does not contain text" },
  { value: "startsWith", label: "Starts With", description: "Begins with text" },
  { value: "endsWith", label: "Ends With", description: "Ends with text" },
  { value: "greaterThan", label: "Greater Than", description: "Number is greater" },
  { value: "lessThan", label: "Less Than", description: "Number is less" },
  { value: "greaterOrEqual", label: "Greater or Equal", description: "Number >= value" },
  { value: "lessOrEqual", label: "Less or Equal", description: "Number <= value" },
  { value: "isEmpty", label: "Is Empty", description: "Field is empty" },
  { value: "isNotEmpty", label: "Is Not Empty", description: "Field has value" },
];

interface ConditionLogicBuilderProps {
  value: ConditionGroup | undefined;
  onChange: (value: ConditionGroup) => void;
}

export function ConditionLogicBuilder({ value, onChange }: ConditionLogicBuilderProps) {
  const [logic, setLogic] = useState<"AND" | "OR">(value?.logic || "AND");
  const [rules, setRules] = useState<ConditionRule[]>(
    value?.rules || [
      {
        id: nanoid(6),
        variable: "",
        operator: "equals",
        value: "",
      },
    ]
  );

  // Sync local state when value prop changes (e.g., switching between nodes)
  useEffect(() => {
    if (value) {
      setLogic(value.logic);
      setRules(value.rules.length > 0 ? value.rules : [
        {
          id: nanoid(6),
          variable: "",
          operator: "equals",
          value: "",
        },
      ]);
    }
  }, [value]);

  const handleLogicChange = (newLogic: "AND" | "OR") => {
    setLogic(newLogic);
    onChange({ logic: newLogic, rules });
  };

  const handleRuleChange = (
    ruleId: string,
    field: keyof ConditionRule,
    newValue: string
  ) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, [field]: newValue } : rule
    );
    setRules(updatedRules);
    onChange({ logic, rules: updatedRules });
  };

  const handleAddRule = () => {
    const newRule: ConditionRule = {
      id: nanoid(6),
      variable: "",
      operator: "equals",
      value: "",
    };
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    onChange({ logic, rules: updatedRules });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (rules.length === 1) return; // Keep at least one rule
    const updatedRules = rules.filter((rule) => rule.id !== ruleId);
    setRules(updatedRules);
    onChange({ logic, rules: updatedRules });
  };

  return (
    <div className="space-y-4" data-testid="condition-logic-builder">
      <div className="flex items-center gap-2">
        <Label>Logic Type:</Label>
        <Select value={logic} onValueChange={handleLogicChange}>
          <SelectTrigger className="w-32" data-testid="select-logic-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                <strong>AND:</strong> All rules must be true
                <br />
                <strong>OR:</strong> At least one rule must be true
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card key={rule.id} className="p-4" data-testid={`condition-rule-${rule.id}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                {index > 0 && (
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {logic}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Variable/Field</Label>
                    <Input
                      placeholder="e.g., user.name"
                      value={rule.variable}
                      onChange={(e) =>
                        handleRuleChange(rule.id, "variable", e.target.value)
                      }
                      data-testid={`input-variable-${rule.id}`}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={rule.operator}
                      onValueChange={(value) =>
                        handleRuleChange(rule.id, "operator", value)
                      }
                    >
                      <SelectTrigger className="mt-1" data-testid={`select-operator-${rule.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {operatorOptions.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Value</Label>
                    <Input
                      placeholder="Compare value"
                      value={rule.value}
                      onChange={(e) =>
                        handleRuleChange(rule.id, "value", e.target.value)
                      }
                      data-testid={`input-value-${rule.id}`}
                      className="mt-1"
                      disabled={
                        rule.operator === "isEmpty" || rule.operator === "isNotEmpty"
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRule(rule.id)}
                disabled={rules.length === 1}
                className="text-gray-400 hover:text-red-500"
                data-testid={`button-delete-rule-${rule.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleAddRule}
        className="w-full"
        data-testid="button-add-condition"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Condition
      </Button>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <strong>Example variables:</strong> user.name, user.email, message.text,
        message.count, tags, status
      </div>
    </div>
  );
}
