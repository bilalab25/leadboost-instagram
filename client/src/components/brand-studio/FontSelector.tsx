import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import WebFont from "webfontloader";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Font {
  family: string;
  category: string;
  variants: string[];
}

interface FontPickerDrawerProps {
  value: string;
  onChange: (val: string) => void;
}

const CATEGORIES = [
  "all",
  "serif",
  "sans-serif",
  "display",
  "handwriting",
  "monospace",
];

// Mapeo de pesos legibles
const WEIGHT_LABELS: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  regular: "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
};

export default function FontPickerDrawer({ value, onChange }: FontPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedFont, setExpandedFont] = useState<string | null>(null);
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 🔹 Cargar fuentes desde la API
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-fonts"],
    queryFn: async () => {
      const res = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${
          import.meta.env.VITE_GOOGLE_FONTS_API_KEY
        }&sort=popularity`
      );
      const json = await res.json();
      if (!json.items) return [];
      return json.items.map((f: any) => ({
        family: f.family,
        category: f.category ?? "other",
        variants: f.variants ?? [],
      })) as Font[];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // 🔎 Filtrado
  const filteredFonts = useMemo(() => {
    if (!data) return [];
    return data.filter((f) => {
      const matchesSearch = f.family.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || f.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [data, search, categoryFilter]);

  const visibleFonts = useMemo(
    () => filteredFonts.slice(0, visibleCount),
    [filteredFonts, visibleCount]
  );

  // 🔠 Cargar familias visibles
  useEffect(() => {
    const toLoad = visibleFonts.map((f) => f.family);
    if (toLoad.length > 0) {
      WebFont.load({
        google: { families: toLoad },
        active: () => setLoadedFonts((prev) => [...new Set([...prev, ...toLoad])]),
      });
    }
  }, [visibleFonts]);

  // 📜 Lazy load
  useEffect(() => {
    const el = containerRef.current;
    const sentinel = sentinelRef.current;
    if (!el || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + 20);
            setIsLoadingMore(false);
          }, 500);
        }
      },
      { root: el, rootMargin: "50px", threshold: 1.0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredFonts]);

  // 💅 Formatear nombre legible del variant
  const formatVariant = (fontFamily: string, v: string) => {
    const baseWeight = v.replace("italic", "") || "400";
    const label = WEIGHT_LABELS[baseWeight] || baseWeight;
    const isItalic = v.includes("italic");
    const displayName = `${fontFamily} ${label}${isItalic ? " Italic" : ""}`;
    return `${displayName} (${v})`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || "Select a font"}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[350px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="mb-2">Fonts</SheetTitle>
          <Input
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(30);
            }}
            className="mb-3"
          />

          {/* Filtros de categoría */}
          <div className="flex gap-2 flex-wrap mb-4">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => {
                  setCategoryFilter(cat);
                  setVisibleCount(30);
                }}
              >
                {cat}
              </Button>
            ))}
          </div>
        </SheetHeader>

        {/* Lista scrollable */}
        <div
          ref={containerRef}
          className="overflow-y-auto h-[calc(100vh-180px)] pr-2 space-y-1"
        >
          {isLoading && <p>Loading fonts...</p>}
          {error && <p>Error loading fonts</p>}
          {!isLoading && visibleFonts.length === 0 && (
            <p className="text-gray-500">No fonts found</p>
          )}

          {visibleFonts.map((font) => (
            <div
              key={font.family}
              className="border rounded-lg bg-white hover:shadow-sm transition overflow-hidden"
            >
              {/* Header de familia */}
              <button
                onClick={() =>
                  setExpandedFont((prev) => (prev === font.family ? null : font.family))
                }
                className={`w-full flex justify-between items-center px-3 py-2 ${
                  value?.startsWith(font.family)
                    ? "bg-gray-100"
                    : "hover:bg-gray-50"
                }`}
                style={{
                  fontFamily: loadedFonts.includes(font.family)
                    ? font.family
                    : "sans-serif",
                }}
              >
                <span>{font.family}</span>
                <span className="text-sm text-gray-400">
                  {expandedFont === font.family ? "▲" : "▼"}
                </span>
              </button>

              {/* Variantes animadas */}
              <AnimatePresence initial={false}>
                {expandedFont === font.family && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pl-4 pr-3 py-2 bg-gray-50 border-t space-y-1"
                  >
                    {font.variants.map((variant) => (
                      <button
                        key={variant}
                        onClick={() => onChange(`${font.family}:${variant}`)}
                        className={`block w-full text-left text-sm px-2 py-1 rounded-md transition ${
                          value === `${font.family}:${variant}`
                            ? "bg-brand-100 text-brand-700"
                            : "hover:bg-gray-100"
                        }`}
                        style={{
                          fontFamily: font.family,
                          fontWeight: variant.replace("italic", "") || "400",
                          fontStyle: variant.includes("italic") ? "italic" : "normal",
                        }}
                      >
                        {formatVariant(font.family, variant)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Sentinel */}
          <div
            ref={sentinelRef}
            className="h-12 flex items-center justify-center"
          >
            {isLoadingMore && (
              <span className="text-gray-500 text-sm animate-pulse">
                Loading more…
              </span>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
