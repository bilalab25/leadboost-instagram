// components/ImageEditorDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import AdvancedImageEditor from "./AdvancedImageEditor";
import { BrandButton } from "./BrandButton";
import type { BrandAsset } from "../types";

interface Props {
  show: boolean;
  post: { id: string; imageUrl: string } | null;
  brandAssets: BrandAsset[];
  onClose: () => void;
  onSave: (image: string) => Promise<void>;
  onAcceptWithoutEdit: () => void;
  isUploading?: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentImage: string;
}

export default function ImageEditorDialog({
  show,
  post,
  brandAssets,
  onClose,
  onSave,
  onAcceptWithoutEdit,
  isUploading = false,
  undo,
  redo,
  canUndo,
  canRedo,
  currentImage,
}: Props) {
  return (
    <Dialog open={show} onClose={onClose} fullWidth maxWidth="xl">
      <DialogContent className="p-6 relative">
        <DialogTitle className="text-xl font-semibold mb-4 font-['Inter']">
          Edit Image Before Accepting
        </DialogTitle>

        {post?.imageUrl && (
          <AdvancedImageEditor
            imageUrl={currentImage}
            brandAssets={brandAssets}
            onSave={onSave}
            onCancel={onClose}
            undo={undo}
            redo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        )}

        {/* Accept without editing */}
        <Box className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-200 relative">
          <BrandButton onClick={onAcceptWithoutEdit} disabled={isUploading}>
            Accept Without Editing
          </BrandButton>

          {isUploading && (
            <Box className="flex items-center gap-2 absolute right-0 top-6 text-gray-500">
              <CircularProgress size={20} />
              <Typography variant="body2">Uploading...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
