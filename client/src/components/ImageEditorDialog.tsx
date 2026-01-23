import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ImageEditor from "./ImageEditor";
export interface BrandAsset {
  id: string;
  url: string;
  name: string;
}

interface Props {
  show: boolean;
  post: { id: string; imageUrl: string } | null;
  brandAssets: BrandAsset[];
  onClose: () => void;
  onSave: (image: string) => Promise<void>;
  onAcceptWithoutEdit: () => void;
  isUploading?: boolean;
}

export default function ImageEditorDialog({
  show,
  post,
  brandAssets,
  onClose,
  onSave,
  onAcceptWithoutEdit,
  isUploading = false,
}: Props) {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6">
        <DialogTitle className="text-xl font-semibold mb-4">
          Edit Image Before Accepting
        </DialogTitle>

        {post?.imageUrl && (
          <ImageEditor
            imageUrl={post.imageUrl}
            brandAssets={brandAssets}
            onSave={onSave}
            onCancel={onClose}
          />
        )}

        <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-200 relative">
          <Button
            onClick={onAcceptWithoutEdit}
            disabled={isUploading}
            variant="outline"
          >
            Accept Without Editing
          </Button>

          {isUploading && (
            <div className="flex items-center gap-2 absolute right-0 top-6 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
