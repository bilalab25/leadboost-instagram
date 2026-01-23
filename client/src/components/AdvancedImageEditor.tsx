// components/AdvancedImageEditor.tsx
import { useState } from "react";
import { Box, Button } from "@mui/material";
import type { BrandAsset } from "../types";

interface Props {
  imageUrl: string;
  brandAssets: BrandAsset[];
  onSave: (image: string) => void;
  onCancel: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export default function AdvancedImageEditor({
  imageUrl,
  brandAssets,
  onSave,
  onCancel,
  undo,
  redo,
  canUndo,
  canRedo,
}: Props) {
  const [editedImage, setEditedImage] = useState(imageUrl);

  // Placeholder: aquí iría lógica real de edición (canvas, filtros, overlays)
  const applyFilter = (filter: string) => {
    // solo simula cambio
    setEditedImage(`${imageUrl}?filter=${filter}`);
  };

  const handleDropAsset = (url: string) => {
    setEditedImage(`${editedImage}?asset=${url}`);
  };

  return (
    <Box className="flex flex-col md:flex-row gap-4">
      {/* Previsualización */}
      <Box className="flex-1 border rounded p-2">
        <img
          src={editedImage}
          alt="Preview"
          className="w-full h-auto rounded"
        />
      </Box>

      {/* Panel de edición */}
      <Box className="flex flex-col gap-3 w-64">
        <Button variant="outlined" onClick={() => applyFilter("brandFilter")}>
          Apply Brand Filter
        </Button>

        <Box>
          <strong>Assets (Drag & Drop)</strong>
          <Box className="flex flex-wrap gap-2 mt-2">
            {brandAssets.map((asset) => (
              <img
                key={asset.id}
                src={asset.url}
                alt={asset.name}
                className="w-16 h-16 border rounded cursor-pointer"
                onClick={() => handleDropAsset(asset.url)}
              />
            ))}
          </Box>
        </Box>

        <Box className="flex gap-2 mt-2">
          <Button onClick={undo} disabled={!canUndo}>
            Undo
          </Button>
          <Button onClick={redo} disabled={!canRedo}>
            Redo
          </Button>
        </Box>

        <Box className="flex gap-2 mt-4">
          <Button variant="contained" onClick={() => onSave(editedImage)}>
            Save
          </Button>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
