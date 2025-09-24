import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef } from "react";
import WebFont from "webfontloader";
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

export default function FontPickerDrawer({
  value,
  onChange,
}: FontPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 🔹 Query Google Fonts
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-fonts"],
    queryFn: async () => {
      const res = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${
          import.meta.env.VITE_GOOGLE_FONTS_API_KEY
        }&sort=popularity`,
      );
      const json = await res.json();
      if (!json.items) return [];
      return json.items.map((f: any) => ({
        family: f.family ?? "Unknown",
        category: f.category ?? "other",
      })) as Font[];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  // 🔎 Filtrado por búsqueda + categoría
  const filteredFonts = useMemo(() => {
    if (!data) return [];
    return data.filter((f: Font) => {
      const matchesSearch = f.family
        ?.toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || f.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [data, search, categoryFilter]);

  // 📂 Agrupación (ya no por categoría, porque ya filtramos)
  const visibleFonts = useMemo(() => {
    return filteredFonts.slice(0, visibleCount);
  }, [filteredFonts, visibleCount]);

  // 🔠 Cargar fuentes visibles
  useEffect(() => {
    const toLoad = visibleFonts.map((f) => f.family);
    if (toLoad.length > 0) {
      WebFont.load({
        google: { families: toLoad },
        active: () =>
          setLoadedFonts((prev) => [...new Set([...prev, ...toLoad])]),
      });
    }
  }, [visibleFonts]);

  // 📜 Lazy-load con IntersectionObserver
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
      { root: el, rootMargin: "50px", threshold: 1.0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredFonts]);

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
            <button
              key={font.family}
              onClick={() => onChange(font.family)}
              className={`w-full text-left px-3 py-2 rounded-md border transition ${
                value === font.family
                  ? "border-brand-500 bg-gray-100"
                  : "border-transparent hover:bg-gray-50"
              }`}
              style={{
                fontFamily: loadedFonts.includes(font.family)
                  ? font.family
                  : "sans-serif",
              }}
            >
              {font.family}
            </button>
          ))}

          {/* Sentinel para lazy-load */}
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
