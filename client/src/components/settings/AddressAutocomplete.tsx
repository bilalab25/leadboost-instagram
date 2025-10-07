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
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Debug: Check if API key is loaded
  useEffect(() => {
    if (!apiKey) {
      console.error('Google Maps API key is not set. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.');
    }
  }, [apiKey]);

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
    const el = autoRef.current;
    if (!el || !value) return;

    // Wait for the component to be fully loaded
    const setDefaultValue = () => {
      const input = el.querySelector("input");
      if (input && input.value !== value) {
        input.value = value;
      }
    };

    // Try immediately and also after a short delay to ensure component is ready
    setDefaultValue();
    const timeoutId = setTimeout(setDefaultValue, 100);

    return () => clearTimeout(timeoutId);
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
          api-key={apiKey}
          placeholder={
            isSpanish ? "Escribe tu dirección..." : "Type your address..."
          }
          class="w-full pl-9 rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary transition-all shadow-sm"
        ></gmp-place-autocomplete>
      </div>
    </div>
  );
}
