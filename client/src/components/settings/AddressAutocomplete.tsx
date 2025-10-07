import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  isSpanish?: boolean;
}

export default function AddressAutocomplete({
  value,
  onChange,
  isSpanish = true,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Esperar a que Google Maps esté disponible
    if (!window.google?.maps?.places || !inputRef.current) return;

    // Inicializar autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["geocode"],
        componentRestrictions: { country: "mx" },
      },
    );

    // Manejar selección
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });
  }, [onChange]);

  // Mostrar dirección si ya existe
  useEffect(() => {
    if (inputRef.current && value) {
      inputRef.current.value = value;
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
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        <input
          ref={inputRef}
          id="address"
          type="text"
          defaultValue={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isSpanish ? "Escribe tu dirección..." : "Type your address..."
          }
          className="block w-full pl-9 rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary transition-all shadow-sm min-h-[42px]"
        />
      </div>
    </div>
  );
}
