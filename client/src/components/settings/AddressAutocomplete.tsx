import { useRef } from "react";
import { Input } from "@/components/ui/input";
import ReactGoogleAutocomplete from "react-google-autocomplete";
import { MapPin } from "lucide-react"; // opcional: ícono bonito

export default function AddressAutocomplete({
  value,
  onChange,
  isSpanish = true,
}: {
  value: string;
  onChange: (val: string) => void;
  isSpanish?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full">
      <label
        htmlFor="address"
        className="text-sm font-medium text-muted-foreground mb-1 block"
      >
        {isSpanish ? "Dirección" : "Address"}
      </label>

      <div className="relative w-full">
        {/* Ícono opcional */}
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

        <ReactGoogleAutocomplete
          apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          onPlaceSelected={(place) => {
            if (place.formatted_address) {
              onChange(place.formatted_address);
            }
          }}
          language={isSpanish ? "es" : "en"}
          options={{
            types: ["geocode"],
            componentRestrictions: { country: "mx" },
          }}
          defaultValue={value}
          renderInput={(params) => (
            <Input
              {...params}
              ref={ref}
              id="address"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={
                isSpanish ? "Escribe tu dirección..." : "Type your address..."
              }
              className="
                w-full
                pl-9  /* deja espacio para el ícono */
                rounded-full
                border
                border-input
                bg-background
                px-4
                py-2
                text-sm
                placeholder:text-muted-foreground
                focus-visible:ring-2
                focus-visible:ring-offset-1
                focus-visible:ring-primary
                transition-all
                shadow-sm
              "
            />
          )}
        />
      </div>
    </div>
  );
}
