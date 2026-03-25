import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMapsScript } from "@/utils/loadGoogleMaps";

export default function AddressAutocomplete({
  value,
  onChange,
  isSpanish = true,
}: {
  value: string;
  onChange: (val: string) => void;
  isSpanish?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!(window as any).google?.maps?.places || !inputRef.current) return;

        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["geocode"],
            componentRestrictions: { country: "mx" },
          },
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          }
        });
      })
      .catch((err) => console.error("Error loading Google Maps script:", err));
  }, [onChange]);

  useEffect(() => {
    if (inputRef.current && value) inputRef.current.value = value;
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
          placeholder={
            isSpanish ? "Escribe tu dirección..." : "Type your address..."
          }
          className="block w-full pl-9 rounded-full border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary transition-all shadow-sm min-h-[42px]"
        />
      </div>
    </div>
  );
}
