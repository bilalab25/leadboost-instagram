import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Image, Text, Rect, Circle, Line, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Type,
  Square,
  Circle as CircleIcon,
  Minus,
  Image as ImageIcon,
  Download,
  RotateCcw,
  Trash2,
  Sun,
  Contrast,
  Palette,
  Crop,
} from "lucide-react";

// Platform presets
const PLATFORM_PRESETS = {
  "instagram-feed": { width: 1080, height: 1080, label: "Instagram Feed (1:1)" },
  "instagram-story": { width: 1080, height: 1920, label: "Instagram Story (9:16)" },
  "facebook-post": { width: 1200, height: 630, label: "Facebook Post (1.91:1)" },
  "facebook-cover": { width: 820, height: 312, label: "Facebook Cover" },
  custom: { width: 1080, height: 1080, label: "Custom" },
};

// Available fonts
const FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
  "Comic Sans MS",
];

// Shape types
type ShapeType = "rect" | "circle" | "line";

interface EditorElement {
  id: string;
  type: "text" | "rect" | "circle" | "line" | "image";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  src?: string;
  draggable: boolean;
}

interface ImageEditorProps {
  imageUrl: string;
  brandAssets?: { id: string; url: string; name: string }[];
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

// Konva Image component for elements
function URLImage({
  src,
  x,
  y,
  width,
  height,
  draggable,
  onClick,
  onDragEnd,
  onTransformEnd,
}: {
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  draggable: boolean;
  onClick?: () => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}) {
  const [image] = useImage(src, "anonymous");
  const imageRef = useRef<Konva.Image>(null);

  return (
    <Image
      ref={imageRef}
      image={image}
      x={x}
      y={y}
      width={width || (image?.width ?? 100)}
      height={height || (image?.height ?? 100)}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

export default function ImageEditor({
  imageUrl,
  brandAssets = [],
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [backgroundImage] = useImage(imageUrl, "anonymous");
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [originalSize, setOriginalSize] = useState({ width: 1080, height: 1080 });
  const [selectedPreset, setSelectedPreset] = useState<string>("instagram-feed");

  // Elements on canvas
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Tool state
  const [activeTool, setActiveTool] = useState<"select" | "text" | "shape" | "sticker">("select");
  const [currentShape, setCurrentShape] = useState<ShapeType>("rect");
  const [currentColor, setCurrentColor] = useState("#ffffff");
  const [currentStrokeColor, setCurrentStrokeColor] = useState("#000000");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [currentFontSize, setCurrentFontSize] = useState(32);
  const [currentFont, setCurrentFont] = useState("Arial");
  const [newText, setNewText] = useState("Text");

  // Filters
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Calculate display size based on container
  useEffect(() => {
    const preset = PLATFORM_PRESETS[selectedPreset as keyof typeof PLATFORM_PRESETS];
    if (preset) {
      setOriginalSize({ width: preset.width, height: preset.height });
      // Scale to fit in view (max 600px)
      const maxSize = 500;
      const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
      setCanvasSize({
        width: preset.width * scale,
        height: preset.height * scale,
      });
    }
  }, [selectedPreset]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty area - deselect
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
      return;
    }

    // If in select mode, let elements handle their own clicks
    if (activeTool === "select") return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    // Scale position to original size
    const scaleX = originalSize.width / canvasSize.width;
    const scaleY = originalSize.height / canvasSize.height;
    const x = pos.x * scaleX;
    const y = pos.y * scaleY;

    if (activeTool === "text") {
      const newElement: EditorElement = {
        id: generateId(),
        type: "text",
        x,
        y,
        text: newText,
        fontSize: currentFontSize,
        fontFamily: currentFont,
        fill: currentColor,
        draggable: true,
      };
      setElements([...elements, newElement]);
      setActiveTool("select");
    } else if (activeTool === "shape") {
      let newElement: EditorElement;
      if (currentShape === "rect") {
        newElement = {
          id: generateId(),
          type: "rect",
          x,
          y,
          width: 100,
          height: 100,
          fill: currentColor,
          stroke: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          draggable: true,
        };
      } else if (currentShape === "circle") {
        newElement = {
          id: generateId(),
          type: "circle",
          x,
          y,
          radius: 50,
          fill: currentColor,
          stroke: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          draggable: true,
        };
      } else {
        newElement = {
          id: generateId(),
          type: "line",
          x: 0,
          y: 0,
          points: [x, y, x + 100, y],
          stroke: currentStrokeColor,
          strokeWidth: currentStrokeWidth,
          draggable: true,
        };
      }
      setElements([...elements, newElement]);
      setActiveTool("select");
    }
  };

  const addSticker = (assetUrl: string) => {
    const newElement: EditorElement = {
      id: generateId(),
      type: "image",
      x: originalSize.width / 2 - 75,
      y: originalSize.height / 2 - 75,
      width: 150,
      height: 150,
      src: assetUrl,
      draggable: true,
    };
    setElements([...elements, newElement]);
    setActiveTool("select");
  };

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    setElements(elements.map((el) => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteSelected = () => {
    if (selectedId) {
      setElements(elements.filter((el) => el.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const scaleX = originalSize.width / canvasSize.width;
    const scaleY = originalSize.height / canvasSize.height;
    updateElement(id, {
      x: e.target.x() * scaleX,
      y: e.target.y() * scaleY,
    });
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = originalSize.width / canvasSize.width;
    const scaleY = originalSize.height / canvasSize.height;
    
    updateElement(id, {
      x: node.x() * scaleX,
      y: node.y() * scaleY,
      width: Math.max(5, node.width() * node.scaleX()),
      height: Math.max(5, node.height() * node.scaleY()),
      rotation: node.rotation(),
    });
    
    node.scaleX(1);
    node.scaleY(1);
  };

  const resetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };

  const handleSave = useCallback(() => {
    if (!stageRef.current) return;

    // Export at original resolution
    const scale = originalSize.width / canvasSize.width;
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: scale,
      mimeType: "image/png",
    });
    onSave(dataUrl);
  }, [canvasSize.width, originalSize.width, onSave]);

  // Calculate scale for rendering
  const renderScale = canvasSize.width / originalSize.width;

  // Get filter CSS
  const getFilterStyle = () => {
    const filters = [];
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    return filters.length > 0 ? filters.join(" ") : "none";
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full max-h-[80vh]">
      {/* Tools Panel */}
      <div className="w-full lg:w-72 flex-shrink-0 order-2 lg:order-1">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="stickers">Assets</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="resize">Resize</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="space-y-4 mt-4">
            {/* Tool buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={activeTool === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTool("select")}
                title="Select"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === "text" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTool("text")}
                title="Add Text"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant={activeTool === "shape" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTool("shape")}
                title="Add Shape"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteSelected}
                disabled={!selectedId}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Text options */}
            {activeTool === "text" && (
              <div className="space-y-3 p-3 border rounded-lg">
                <Label className="text-sm font-medium">Text Options</Label>
                <Input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Enter text..."
                />
                <Select value={currentFont} onValueChange={setCurrentFont}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Size</Label>
                  <Slider
                    value={[currentFontSize]}
                    onValueChange={([v]) => setCurrentFontSize(v)}
                    min={12}
                    max={120}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{currentFontSize}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Color</Label>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Click on canvas to add text</p>
              </div>
            )}

            {/* Shape options */}
            {activeTool === "shape" && (
              <div className="space-y-3 p-3 border rounded-lg">
                <Label className="text-sm font-medium">Shape Options</Label>
                <div className="flex gap-2">
                  <Button
                    variant={currentShape === "rect" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentShape("rect")}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={currentShape === "circle" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentShape("circle")}
                  >
                    <CircleIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={currentShape === "line" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentShape("line")}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Fill</Label>
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Stroke</Label>
                  <input
                    type="color"
                    value={currentStrokeColor}
                    onChange={(e) => setCurrentStrokeColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Width</Label>
                  <Slider
                    value={[currentStrokeWidth]}
                    onValueChange={([v]) => setCurrentStrokeWidth(v)}
                    min={0}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Click on canvas to add shape</p>
              </div>
            )}

            {/* Selected element properties */}
            {selectedElement && selectedElement.type === "text" && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                <Label className="text-sm font-medium">Edit Text</Label>
                <Input
                  value={selectedElement.text || ""}
                  onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
                />
                <Select
                  value={selectedElement.fontFamily || "Arial"}
                  onValueChange={(v) => updateElement(selectedId!, { fontFamily: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONTS.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Size</Label>
                  <Slider
                    value={[selectedElement.fontSize || 32]}
                    onValueChange={([v]) => updateElement(selectedId!, { fontSize: v })}
                    min={12}
                    max={120}
                    step={2}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-12">Color</Label>
                  <input
                    type="color"
                    value={selectedElement.fill || "#ffffff"}
                    onChange={(e) => updateElement(selectedId!, { fill: e.target.value })}
                    className="w-10 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stickers" className="mt-4">
            <ScrollArea className="h-64">
              {brandAssets.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {brandAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => addSticker(asset.url)}
                      className="aspect-square rounded-lg border overflow-hidden hover:ring-2 ring-primary transition-all"
                    >
                      <img
                        src={asset.url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No brand assets available</p>
                  <p className="text-xs">Add assets in Brand Studio</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4 mt-4">
            <div className="space-y-4 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Image Filters</Label>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs w-16">Brightness</Label>
                  <Slider
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    min={-50}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{brightness}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Contrast className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs w-16">Contrast</Label>
                  <Slider
                    value={[contrast]}
                    onValueChange={([v]) => setContrast(v)}
                    min={-50}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{contrast}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs w-16">Saturation</Label>
                  <Slider
                    value={[saturation]}
                    onValueChange={([v]) => setSaturation(v)}
                    min={-50}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-8">{saturation}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resize" className="space-y-4 mt-4">
            <div className="space-y-3 p-3 border rounded-lg">
              <Label className="text-sm font-medium">Platform Presets</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Output: {originalSize.width} x {originalSize.height}px
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col items-center order-1 lg:order-2">
        <div
          className="border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-lg"
          style={{ filter: getFilterStyle() }}
        >
          <Stage
            ref={stageRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            <Layer>
              {/* Background image */}
              {backgroundImage && (
                <Image
                  image={backgroundImage}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              )}

              {/* Render elements */}
              {elements.map((el) => {
                const scaledX = el.x * renderScale;
                const scaledY = el.y * renderScale;
                const isSelected = el.id === selectedId;

                if (el.type === "text") {
                  return (
                    <Text
                      key={el.id}
                      id={el.id}
                      x={scaledX}
                      y={scaledY}
                      text={el.text}
                      fontSize={(el.fontSize || 32) * renderScale}
                      fontFamily={el.fontFamily || "Arial"}
                      fill={el.fill || "#ffffff"}
                      draggable={el.draggable}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(el.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(el.id, e)}
                    />
                  );
                }

                if (el.type === "rect") {
                  return (
                    <Rect
                      key={el.id}
                      id={el.id}
                      x={scaledX}
                      y={scaledY}
                      width={(el.width || 100) * renderScale}
                      height={(el.height || 100) * renderScale}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={(el.strokeWidth || 2) * renderScale}
                      draggable={el.draggable}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(el.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(el.id, e)}
                    />
                  );
                }

                if (el.type === "circle") {
                  return (
                    <Circle
                      key={el.id}
                      id={el.id}
                      x={scaledX}
                      y={scaledY}
                      radius={(el.radius || 50) * renderScale}
                      fill={el.fill}
                      stroke={el.stroke}
                      strokeWidth={(el.strokeWidth || 2) * renderScale}
                      draggable={el.draggable}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(el.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(el.id, e)}
                    />
                  );
                }

                if (el.type === "line" && el.points) {
                  return (
                    <Line
                      key={el.id}
                      id={el.id}
                      points={el.points.map((p) => p * renderScale)}
                      stroke={el.stroke}
                      strokeWidth={(el.strokeWidth || 2) * renderScale}
                      draggable={el.draggable}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(el.id, e)}
                    />
                  );
                }

                if (el.type === "image" && el.src) {
                  return (
                    <URLImage
                      key={el.id}
                      src={el.src}
                      x={scaledX}
                      y={scaledY}
                      width={(el.width || 100) * renderScale}
                      height={(el.height || 100) * renderScale}
                      draggable={el.draggable}
                      onClick={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(el.id, e)}
                      onTransformEnd={(e) => handleTransformEnd(el.id, e)}
                    />
                  );
                }

                return null;
              })}

              {/* Transformer for selected element */}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Download className="h-4 w-4" />
            Save Image
          </Button>
        </div>
      </div>
    </div>
  );
}
