import { useState, useRef, useEffect, useCallback } from "react";
import {
  Stage,
  Layer,
  Image,
  Text,
  Rect,
  Circle,
  Line,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  Trash2,
  Sun,
  Contrast,
  Palette,
  MousePointer2,
  Undo2,
  Redo2,
  Sticker,
  Settings2,
  Move,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Platform presets
const PLATFORM_PRESETS = {
  "instagram-feed": {
    width: 1080,
    height: 1080,
    label: "Instagram Feed (1:1)",
  },
  "instagram-story": {
    width: 1080,
    height: 1920,
    label: "Instagram Story (9:16)",
  },
  "facebook-post": {
    width: 1200,
    height: 630,
    label: "Facebook Post (1.91:1)",
  },
  "facebook-cover": { width: 820, height: 312, label: "Facebook Cover" },
  custom: { width: 1080, height: 1080, label: "Custom" },
};

// System fonts
const SYSTEM_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Verdana",
  "Courier New",
  "Impact",
];

// Popular Google Fonts
const GOOGLE_FONTS = [
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Nunito",
  "Ubuntu",
  "Quicksand",
  "Dancing Script",
  "Pacifico",
  "Lobster",
  "Bebas Neue",
  "Comfortaa",
  "Righteous",
  "Permanent Marker",
  "Caveat",
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
  brandColors?: string[];
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

// Load Google Font dynamically
const loadGoogleFont = (fontFamily: string) => {
  const linkId = `google-font-${fontFamily.replace(/\s+/g, "-")}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;700&display=swap`;
  document.head.appendChild(link);
};

// Konva Image component for elements
function URLImage({
  id,
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
  id: string;
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
      id={id}
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

// Color Palette Component
function ColorPalette({
  brandColors,
  currentColor,
  onChange,
  label,
}: {
  brandColors: string[];
  currentColor: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  return (
    <div className="space-y-2">
      {label && <Label className="text-xs">{label}</Label>}
      <div className="flex flex-wrap gap-1">
        {brandColors.map((color, idx) => (
          <button
            key={idx}
            className={`w-6 h-6 rounded border-2 transition-all ${
              currentColor === color ? "border-primary ring-2 ring-primary/50" : "border-gray-300"
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
        <div className="relative">
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onChange(e.target.value)}
            className="w-6 h-6 rounded cursor-pointer opacity-0 absolute inset-0"
          />
          <div
            className="w-6 h-6 rounded border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-xs"
            title="Custom color"
          >
            +
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ImageEditor({
  imageUrl,
  brandAssets = [],
  brandColors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
  onSave,
  onCancel,
}: ImageEditorProps) {
  const [backgroundImage] = useImage(imageUrl, "anonymous");
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [history, setHistory] = useState<EditorElement[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorElement[][]>([]);

  // Background image position and zoom
  const [bgZoom, setBgZoom] = useState(1);
  const [bgPosition, setBgPosition] = useState({ x: 0, y: 0 });

  // Canvas dimensions
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });
  const [originalSize, setOriginalSize] = useState({
    width: 1080,
    height: 1080,
  });
  const [selectedPreset, setSelectedPreset] = useState<string>("instagram-feed");

  // Elements on canvas
  const [elements, setElements] = useState<EditorElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Inline text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Loaded fonts
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set(SYSTEM_FONTS));

  const pushToHistory = (newElements: EditorElement[]) => {
    setHistory((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements(newElements);
  };

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

  // All available fonts
  const allFonts = [...SYSTEM_FONTS, ...GOOGLE_FONTS];

  // Load font when selected
  const handleFontChange = (font: string) => {
    if (GOOGLE_FONTS.includes(font) && !loadedFonts.has(font)) {
      loadGoogleFont(font);
      setLoadedFonts((prev) => new Set(Array.from(prev).concat(font)));
    }
    setCurrentFont(font);
  };

  // Load font for element
  const ensureFontLoaded = (font: string) => {
    if (GOOGLE_FONTS.includes(font) && !loadedFonts.has(font)) {
      loadGoogleFont(font);
      setLoadedFonts((prev) => new Set(Array.from(prev).concat(font)));
    }
  };

  // Calculate display size based on container
  useEffect(() => {
    const preset = PLATFORM_PRESETS[selectedPreset as keyof typeof PLATFORM_PRESETS];
    if (preset) {
      setOriginalSize({ width: preset.width, height: preset.height });
      const maxSize = 400;
      const scale = Math.min(maxSize / preset.width, maxSize / preset.height);
      setCanvasSize({
        width: preset.width * scale,
        height: preset.height * scale,
      });
    }
  }, [selectedPreset]);

  // Update transformer when selection changes
  useEffect(() => {
    if (selectedId && transformerRef.current && stageRef.current && !editingTextId) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedId, editingTextId]);

  // Load fonts for existing elements
  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === "text" && el.fontFamily) {
        ensureFontLoaded(el.fontFamily);
      }
    });
  }, [elements]);

  const generateId = () =>
    `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // If editing text, finish editing first
    if (editingTextId) {
      finishTextEditing();
      return;
    }

    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;

    const scaleX = originalSize.width / canvasSize.width;
    const scaleY = originalSize.height / canvasSize.height;
    const x = pos.x * scaleX;
    const y = pos.y * scaleY;

    // Check if clicked on stage or background image (not sticker images which have IDs)
    const clickedNode = e.target as Konva.Node;
    const isBackground = e.target === stage || 
      (clickedNode.className === "Image" && clickedNode.name() === "background");
    
    if (isBackground) {
      if (activeTool === "text") {
        ensureFontLoaded(currentFont);
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
        pushToHistory([...elements, newElement]);
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
        pushToHistory([...elements, newElement]);
        setActiveTool("select");
      } else {
        setSelectedId(null);
      }
      return;
    }

    const clickedId = (e.target as Konva.Node).id();
    if (clickedId) {
      setSelectedId(clickedId);
      return;
    }
  };

  // Double click to edit text inline
  const handleTextDblClick = (el: EditorElement) => {
    if (el.type !== "text") return;
    setEditingTextId(el.id);
    setEditingTextValue(el.text || "");
    setSelectedId(null);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const finishTextEditing = () => {
    if (editingTextId) {
      if (editingTextValue.trim()) {
        const newElements = elements.map((el) =>
          el.id === editingTextId ? { ...el, text: editingTextValue } : el
        );
        pushToHistory(newElements);
      } else {
        const newElements = elements.filter((el) => el.id !== editingTextId);
        pushToHistory(newElements);
      }
    }
    setEditingTextId(null);
    setEditingTextValue("");
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
    pushToHistory([...elements, newElement]);
    setActiveTool("select");
  };

  const updateElement = (id: string, updates: Partial<EditorElement>) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    pushToHistory(newElements);
  };

  const deleteSelected = () => {
    if (selectedId) {
      const newElements = elements.filter((el) => el.id !== selectedId);
      pushToHistory(newElements);
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
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    if (element.type === "text") {
      updateElement(id, {
        x: node.x() / renderScale,
        y: node.y() / renderScale,
        fontSize: Math.max(8, (element.fontSize || 32) * scaleX),
        rotation: node.rotation(),
      });
    } else if (element.type === "circle") {
      updateElement(id, {
        x: node.x() / renderScale,
        y: node.y() / renderScale,
        radius: Math.max(5, (element.radius || 50) * scaleX),
        rotation: node.rotation(),
      });
    } else if (element.type === "line") {
      updateElement(id, {
        x: node.x() / renderScale,
        y: node.y() / renderScale,
        rotation: node.rotation(),
      });
    } else if (element.type === "image") {
      const scale = scaleX;
      const originalWidth = element.width || 100;
      const originalHeight = element.height || 100;
      const aspectRatio = originalHeight / originalWidth;
      const newWidth = Math.max(20, originalWidth * scale);
      const newHeight = newWidth * aspectRatio;
      updateElement(id, {
        x: node.x() / renderScale,
        y: node.y() / renderScale,
        width: newWidth,
        height: newHeight,
        rotation: node.rotation(),
      });
    } else {
      const scale = scaleX;
      updateElement(id, {
        x: node.x() / renderScale,
        y: node.y() / renderScale,
        width: Math.max(5, (element.width || 100) * scale),
        height: Math.max(5, (element.height || 100) * scale),
        rotation: node.rotation(),
      });
    }
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
    const scale = originalSize.width / canvasSize.width;
    const dataUrl = stageRef.current.toDataURL({
      pixelRatio: scale,
      mimeType: "image/png",
    });
    onSave(dataUrl);
  }, [canvasSize.width, originalSize.width, onSave]);

  const renderScale = canvasSize.width / originalSize.width;

  const getFilterStyle = () => {
    const filters = [];
    if (brightness !== 0) filters.push(`brightness(${100 + brightness}%)`);
    if (contrast !== 0) filters.push(`contrast(${100 + contrast}%)`);
    if (saturation !== 0) filters.push(`saturate(${100 + saturation}%)`);
    return filters.length > 0 ? filters.join(" ") : "none";
  };

  const selectedElement = elements.find((el) => el.id === selectedId);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setRedoStack((prev) => [...prev, elements]);
    setElements(previous);
  }, [history, elements]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setHistory((prev) => [...prev, elements]);
    setElements(next);
  }, [redoStack, elements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Allow typing in inputs
      if (isTyping) {
        // Only handle Enter for finishing text edit
        if (editingTextId && e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finishTextEditing();
        }
        return;
      }

      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }

      if (selectedId && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elements, undo, redo, editingTextId]);

  // Get position for inline text editor
  const getEditingTextPosition = () => {
    const el = elements.find((e) => e.id === editingTextId);
    if (!el) return { left: 0, top: 0, fontSize: 16, fontFamily: "Arial", color: "#ffffff" };
    return {
      left: el.x * renderScale,
      top: el.y * renderScale,
      fontSize: (el.fontSize || 32) * renderScale,
      fontFamily: el.fontFamily || "Arial",
      color: el.fill || "#ffffff",
    };
  };

  const editPos = getEditingTextPosition();

  return (
    <div className="flex flex-col h-full max-h-[85vh] bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
            <span className="ml-1 text-xs hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
            <span className="ml-1 text-xs hidden sm:inline">Redo</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1">
            <Download className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-16 bg-white dark:bg-gray-800 border-r flex flex-col items-center py-4 gap-1">
          <Button
            variant={activeTool === "select" ? "secondary" : "ghost"}
            size="sm"
            className="w-12 h-12 flex flex-col gap-1"
            onClick={() => setActiveTool("select")}
            title="Select"
          >
            <MousePointer2 className="h-5 w-5" />
            <span className="text-[10px]">Select</span>
          </Button>
          <Button
            variant={activeTool === "text" ? "secondary" : "ghost"}
            size="sm"
            className="w-12 h-12 flex flex-col gap-1"
            onClick={() => setActiveTool("text")}
            title="Text"
          >
            <Type className="h-5 w-5" />
            <span className="text-[10px]">Text</span>
          </Button>
          <Button
            variant={activeTool === "shape" ? "secondary" : "ghost"}
            size="sm"
            className="w-12 h-12 flex flex-col gap-1"
            onClick={() => setActiveTool("shape")}
            title="Shapes"
          >
            <Square className="h-5 w-5" />
            <span className="text-[10px]">Shapes</span>
          </Button>
          <Button
            variant={activeTool === "sticker" ? "secondary" : "ghost"}
            size="sm"
            className="w-12 h-12 flex flex-col gap-1"
            onClick={() => setActiveTool("sticker")}
            title="Assets"
          >
            <Sticker className="h-5 w-5" />
            <span className="text-[10px]">Assets</span>
          </Button>
          <Separator className="my-2 w-10" />
          <Button
            variant="ghost"
            size="sm"
            className="w-12 h-12 flex flex-col gap-1"
            onClick={deleteSelected}
            disabled={!selectedId}
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px]">Delete</span>
          </Button>
        </div>

        {/* Center Canvas */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-gray-100 dark:bg-gray-900">
          <div
            className="relative border rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-xl"
            style={{
              filter: getFilterStyle(),
            }}
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
                {backgroundImage &&
                  (() => {
                    const imgWidth = backgroundImage.width;
                    const imgHeight = backgroundImage.height;
                    const canvasRatio = canvasSize.width / canvasSize.height;
                    const imgRatio = imgWidth / imgHeight;

                    let baseWidth, baseHeight;
                    if (imgRatio > canvasRatio) {
                      baseHeight = canvasSize.height;
                      baseWidth = imgRatio * canvasSize.height;
                    } else {
                      baseWidth = canvasSize.width;
                      baseHeight = canvasSize.width / imgRatio;
                    }

                    const renderWidth = baseWidth * bgZoom;
                    const renderHeight = baseHeight * bgZoom;
                    const centerOffsetX = (canvasSize.width - renderWidth) / 2;
                    const centerOffsetY = (canvasSize.height - renderHeight) / 2;

                    return (
                      <Image
                        name="background"
                        image={backgroundImage}
                        x={centerOffsetX + bgPosition.x}
                        y={centerOffsetY + bgPosition.y}
                        width={renderWidth}
                        height={renderHeight}
                        draggable={true}
                        onDragEnd={(e) => {
                          const newX = e.target.x() - centerOffsetX;
                          const newY = e.target.y() - centerOffsetY;
                          setBgPosition({ x: newX, y: newY });
                        }}
                      />
                    );
                  })()}

                {/* Render elements */}
                {elements.map((el) => {
                  const scaledX = el.x * renderScale;
                  const scaledY = el.y * renderScale;

                  if (el.type === "text") {
                    if (el.id === editingTextId) return null;
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
                        onDblClick={() => handleTextDblClick(el)}
                        onDblTap={() => handleTextDblClick(el)}
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
                        id={el.id}
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

                <Transformer
                  ref={transformerRef}
                  keepRatio={true}
                  enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 30 || newBox.height < 30) return oldBox;
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>

            {/* Inline text editor */}
            {editingTextId && (
              <textarea
                ref={textInputRef}
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onBlur={finishTextEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    finishTextEditing();
                  }
                  e.stopPropagation();
                }}
                className="absolute bg-transparent border-2 border-blue-500 outline-none resize-none"
                style={{
                  left: editPos.left,
                  top: editPos.top,
                  fontSize: editPos.fontSize,
                  fontFamily: editPos.fontFamily,
                  color: editPos.color,
                  minWidth: 100,
                  minHeight: editPos.fontSize * 1.5,
                }}
              />
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-72 bg-white dark:bg-gray-800 border-l overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Tool-specific options */}
              {activeTool === "text" && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Type className="h-4 w-4" /> Text Options
                  </Label>
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text..."
                  />
                  <Select value={currentFont} onValueChange={handleFontChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <div className="px-2 py-1 text-xs text-muted-foreground">System Fonts</div>
                      {SYSTEM_FONTS.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                      <div className="px-2 py-1 text-xs text-muted-foreground">Google Fonts</div>
                      {GOOGLE_FONTS.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: loadedFonts.has(font) ? font : "inherit" }}>
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
                  <ColorPalette
                    brandColors={brandColors}
                    currentColor={currentColor}
                    onChange={setCurrentColor}
                    label="Color"
                  />
                  <p className="text-xs text-muted-foreground">Click canvas to add text</p>
                </div>
              )}

              {activeTool === "shape" && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Square className="h-4 w-4" /> Shape Options
                  </Label>
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
                  <ColorPalette
                    brandColors={brandColors}
                    currentColor={currentColor}
                    onChange={setCurrentColor}
                    label="Fill"
                  />
                  <ColorPalette
                    brandColors={brandColors}
                    currentColor={currentStrokeColor}
                    onChange={setCurrentStrokeColor}
                    label="Stroke"
                  />
                  <div className="flex gap-2 items-center">
                    <Label className="text-xs w-16">Stroke Width</Label>
                    <Slider
                      value={[currentStrokeWidth]}
                      onValueChange={([v]) => setCurrentStrokeWidth(v)}
                      min={0}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Click canvas to add shape</p>
                </div>
              )}

              {activeTool === "sticker" && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Sticker className="h-4 w-4" /> Brand Assets
                  </Label>
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
                    <div className="text-center py-4 text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No brand assets</p>
                    </div>
                  )}
                </div>
              )}

              {/* Selected element properties */}
              {selectedElement && (
                <div className="space-y-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4" /> Selected: {selectedElement.type}
                  </Label>

                  {selectedElement.type === "text" && (
                    <>
                      <Input
                        value={selectedElement.text || ""}
                        onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
                        placeholder="Edit text..."
                      />
                      <Select
                        value={selectedElement.fontFamily || "Arial"}
                        onValueChange={(v) => {
                          ensureFontLoaded(v);
                          updateElement(selectedId!, { fontFamily: v });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <div className="px-2 py-1 text-xs text-muted-foreground">System Fonts</div>
                          {SYSTEM_FONTS.map((font) => (
                            <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                              {font}
                            </SelectItem>
                          ))}
                          <Separator className="my-1" />
                          <div className="px-2 py-1 text-xs text-muted-foreground">Google Fonts</div>
                          {GOOGLE_FONTS.map((font) => (
                            <SelectItem key={font} value={font} style={{ fontFamily: loadedFonts.has(font) ? font : "inherit" }}>
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
                      <ColorPalette
                        brandColors={brandColors}
                        currentColor={selectedElement.fill || "#ffffff"}
                        onChange={(c) => updateElement(selectedId!, { fill: c })}
                        label="Color"
                      />
                    </>
                  )}

                  {(selectedElement.type === "rect" || selectedElement.type === "circle") && (
                    <>
                      <ColorPalette
                        brandColors={brandColors}
                        currentColor={selectedElement.fill || "#ffffff"}
                        onChange={(c) => updateElement(selectedId!, { fill: c })}
                        label="Fill"
                      />
                      <ColorPalette
                        brandColors={brandColors}
                        currentColor={selectedElement.stroke || "#000000"}
                        onChange={(c) => updateElement(selectedId!, { stroke: c })}
                        label="Stroke"
                      />
                    </>
                  )}

                  <p className="text-xs text-muted-foreground">Double-click text to edit inline</p>
                </div>
              )}

              <Separator />

              {/* Filters */}
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Filters
                  </Label>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Sun className="h-4 w-4 text-muted-foreground" />
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
                </div>
              </div>

              {/* Canvas Settings */}
              <div className="space-y-3 p-3 border rounded-lg">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Move className="h-4 w-4" /> Canvas Settings
                </Label>
                <Select
                  value={selectedPreset}
                  onValueChange={(value) => {
                    setSelectedPreset(value);
                    setBgPosition({ x: 0, y: 0 });
                  }}
                >
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
                <div className="flex gap-2 items-center">
                  <Label className="text-xs w-16">Bg Zoom</Label>
                  <Slider
                    value={[bgZoom * 100]}
                    onValueChange={([v]) => setBgZoom(v / 100)}
                    min={50}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs w-10">{Math.round(bgZoom * 100)}%</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setBgZoom(1);
                    setBgPosition({ x: 0, y: 0 });
                  }}
                >
                  Reset Background
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
