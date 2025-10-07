import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

export default function AddressAutocomplete({
  value,
  onChange,
  isSpanish = true,
}: {
  value: string;
  onChange: (val: string) => void;
  isSpanish?: boolean;
}) {
  const autoRef = useRef<any>(null);

  // Manejar evento de selección
  useEffect(() => {
    const el = autoRef.current;
    if (!el) return;

    const handleSelect = async (event: any) => {
      event.preventDefault(); // evita la navegación automática
      const place = await event.place?.fetchFields({
        fields: ["formattedAddress"],
      });
      if (place?.formattedAddress) {
        onChange(place.formattedAddress);
      }
    };

    el.addEventListener("gmp-placeselect", handleSelect);
    return () => el.removeEventListener("gmp-placeselect", handleSelect);
  }, [onChange]);

  // Mostrar valor actual si ya existe
  useEffect(() => {
    if (autoRef.current && value) {
      const input = autoRef.current.querySelector("input");
      if (input) input.value = value;
    }
  }, [value]);

  return (
    <div className="w-full">
      <label
        htmlFor="address"
        className="text-sm font-medium text-muted-foreground mb-1 block"
      >
        {isSpanish ? "Dirección" : "Address"}
      </label>

      <div className="relative w-full">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        {/* Nuevo componente oficial de Google */}
        <gmp-place-autocomplete
          ref={autoRef}
          id="address"
          api-key={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          placeholder={
            isSpanish ? "Escribe tu dirección..." : "Type your address..."
          }
          // Hereda tus estilos shadcn
          class="w-full pl-9 rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary transition-all shadow-sm"
        ></gmp-place-autocomplete>
      </div>
    </div>
  );
}
