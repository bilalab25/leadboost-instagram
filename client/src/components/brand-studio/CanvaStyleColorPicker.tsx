import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function CanvaStyleColorPicker({
  label,
  value,
  onChange,
  allowGradient = true,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowGradient?: boolean;
}) {
  const [tab, setTab] = useState("solid");

  // Solid color state
  const [solidColor, setSolidColor] = useState("#2563eb");

  // Gradient state
  const [colors, setColors] = useState<string[]>(["#2563eb", "#60a5fa"]);
  const [gradType, setGradType] = useState("linear-to-right");

  // Generate gradient string
  const generateGradient = (colors: string[], type: string) => {
    const joined = colors.join(", ");
    switch (type) {
      case "linear-to-right":
        return `linear-gradient(to right, ${joined})`;
      case "linear-to-bottom":
        return `linear-gradient(to bottom, ${joined})`;
      case "linear-diagonal":
        return `linear-gradient(45deg, ${joined})`;
      case "linear-reverse":
        return `linear-gradient(to left, ${joined})`;
      case "radial":
        return `radial-gradient(circle, ${joined})`;
      default:
        return `linear-gradient(to right, ${joined})`;
    }
  };

  // Solid change
  const handleSolidChange = (c: string) => {
    setSolidColor(c);
    onChange(c);
  };

  // Gradient change
  const handleGradientChange = (
    newColors: string[] = colors,
    newType = gradType,
  ) => {
    const grad = generateGradient(newColors, newType);
    onChange(grad);
  };

  // Sincronizar con value que viene del padre
  useEffect(() => {
    if (value?.startsWith("linear") || value?.startsWith("radial")) {
      // Es un gradiente → parsear colores
      setTab("gradient");
      setGradType(
        value.includes("to bottom")
          ? "linear-to-bottom"
          : value.includes("45deg")
            ? "linear-diagonal"
            : value.includes("to left")
              ? "linear-reverse"
              : value.includes("radial")
                ? "radial"
                : "linear-to-right",
      );

      // Extraer colores del string
      const matches = value.match(/#([0-9a-fA-F]{3,6})/g);
      if (matches && matches.length > 0) {
        setColors(matches);
      }
    } else if (value) {
      // Es color sólido
      setTab("solid");
      setSolidColor(value);
    }
  }, [value]);
  return (
    <div className="w-full p-3 border rounded-lg bg-white shadow-sm">
      <p className="text-sm font-medium mb-2">{label}</p>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList
          className={`w-full mb-3 ${
            allowGradient ? "grid grid-cols-2" : "grid-cols-1"
          }`}
        >
          <TabsTrigger value="solid">Solid Color</TabsTrigger>
          {allowGradient && (
            <TabsTrigger value="gradient">Gradient</TabsTrigger>
          )}
        </TabsList>

        {/* ---------- Solid Color ---------- */}
        <TabsContent value="solid" className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={solidColor}
              onChange={(e) => handleSolidChange(e.target.value)}
              className="w-12 h-12 cursor-pointer rounded-md border"
            />
            <Input
              type="text"
              value={solidColor}
              onChange={(e) => handleSolidChange(e.target.value)}
              className="w-28"
            />
          </div>
        </TabsContent>

        {/* ---------- Gradient ---------- */}
        {allowGradient && (
          <TabsContent value="gradient" className="space-y-4">
            {/* Gradient colors */}
            <div>
              <Label className="text-sm font-medium">Colors</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {colors.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border rounded-md p-2"
                  >
                    {/* Color Picker */}
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[i] = e.target.value;
                        setColors(newColors);
                        handleGradientChange(newColors);
                      }}
                      className="w-12 h-12 cursor-pointer rounded-md border"
                    />

                    {/* Hex Input */}
                    <Input
                      type="text"
                      value={c}
                      onChange={(e) => {
                        const newColors = [...colors];
                        newColors[i] = e.target.value;
                        setColors(newColors);
                        handleGradientChange(newColors);
                      }}
                      className="flex-1"
                    />

                    {/* Delete Button (if > 2 colors) */}
                    {colors.length > 2 && (
                      <button
                        onClick={() => {
                          if (colors.length > 2) {
                            const newColors = colors.filter(
                              (_, idx) => idx !== i,
                            );
                            setColors(newColors);
                            handleGradientChange(newColors);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add new color (max 4) */}
                {colors.length < 4 && (
                  <button
                    onClick={() => {
                      const newColors = [...colors, "#ffffff"];
                      setColors(newColors);
                      handleGradientChange(newColors);
                    }}
                    className="w-full h-12 flex items-center justify-center rounded-md border bg-gray-100 text-lg col-span-2"
                  >
                    +
                  </button>
                )}
              </div>
            </div>

            {/* Gradient type */}
            <div>
              <Label className="text-sm font-medium">Style</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {[
                  { key: "linear-to-right", title: "→" },
                  { key: "linear-to-bottom", title: "↓" },
                  { key: "linear-diagonal", title: "↘" },
                  { key: "linear-reverse", title: "←" },
                  { key: "radial", title: "◎" },
                ].map((style) => {
                  const preview = generateGradient(colors, style.key);
                  return (
                    <div
                      key={style.key}
                      onClick={() => {
                        setGradType(style.key);
                        handleGradientChange(colors, style.key);
                      }}
                      className={`w-16 h-10 rounded-md border cursor-pointer ${
                        gradType === style.key ? "ring-2 ring-purple-500" : ""
                      }`}
                      style={{ background: preview }}
                      title={style.key}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
