import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CanvaStyleColorPicker from "./CanvaStyleColorPicker";

export default function ColorPreviewWithPicker({
  label,
  value,
  onChange,
  allowGradient = true, // 🔹 nueva prop, por defecto true
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  allowGradient?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleApply = () => {
    onChange(tempValue);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (isOpen) {
            setTempValue(value); // 🔹 sincroniza con el valor actual al abrir
          }
        }}
      >
        <DialogTrigger asChild>
          <button
            className="w-12 h-12 rounded-md border shadow-sm"
            style={{ background: value }}
          />
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>

          <CanvaStyleColorPicker
            label={label}
            value={tempValue}
            onChange={setTempValue}
            allowGradient={allowGradient}
          />

          <div className="flex justify-end mt-4">
            <Button onClick={handleApply} className="bg-purple-600 text-white">
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
