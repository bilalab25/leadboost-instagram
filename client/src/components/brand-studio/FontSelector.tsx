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

export default function FontPickerDrawer({
  value,
  onChange,
}: FontPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [loadedFonts, setLoadedFonts] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(30);
  const containerRef = useRef<HTMLDivElement>(null);

  // 🔹 Query Google Fonts
  const { data, isLoading, error } = useQuery({
    queryKey: ["google-fonts"],
    queryFn: async () => {
      const res = await fetch(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${
          import.meta.env.VITE_GOOGLE_FONTS_KEY
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

  // 🔎 Filtrado por búsqueda
  const filteredFonts = useMemo(() => {
    if (!data) return [];
    return data.filter(
      (f: Font) =>
        f.family && f.family.toLowerCase().includes(search.toLowerCase()),
    );
  }, [data, search]);

  // 📂 Agrupar por categoría (usa búsqueda si existe, si no toda la data)
  const groupedFonts = useMemo(() => {
    const source = search ? filteredFonts : data || [];
    return source.slice(0, visibleCount).reduce(
      (acc: any, font) => {
        if (!font?.family) return acc;
        if (!acc[font.category]) acc[font.category] = [];
        acc[font.category].push(font);
        return acc;
      },
      {} as Record<string, Font[]>,
    );
  }, [data, filteredFonts, search, visibleCount]);

  // 🔠 Cargar fuentes visibles
  useEffect(() => {
    const source = search ? filteredFonts : data || [];
    const toLoad = source.slice(0, visibleCount).map((f) => f.family);

    if (toLoad.length > 0) {
      WebFont.load({
        google: { families: toLoad },
        active: () =>
          setLoadedFonts((prev) => [...new Set([...prev, ...toLoad])]),
      });
    }
  }, [data, filteredFonts, search, visibleCount]);

  // 📜 Lazy-load en scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
        setVisibleCount((prev) => prev + 20);
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Sheet>
      {/* Botón para abrir el drawer */}
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || "Select a font"}
        </Button>
      </SheetTrigger>

      {/* Drawer desde la izquierda */}
      <SheetContent side="left" className="w-[350px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="mb-2">Fonts</SheetTitle>
          <Input
            placeholder="Search fonts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(30); // reinicia lazy-load al buscar
            }}
            className="mb-6"
          />
        </SheetHeader>

        {/* Lista agrupada */}
        <div
          ref={containerRef}
          className="overflow-y-auto h-[calc(100vh-140px)] pr-2 space-y-6"
        >
          {isLoading && <p>Loading fonts...</p>}
          {error && <p>Error loading fonts</p>}
          {!isLoading && Object.keys(groupedFonts).length === 0 && (
            <p className="text-gray-500">No fonts found</p>
          )}

          {Object.entries(groupedFonts).map(([category, fonts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {fonts.map((font) => (
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
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
