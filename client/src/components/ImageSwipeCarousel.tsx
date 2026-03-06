import { useState, useRef, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Sparkles,
  X,
  Check,
  ImageIcon,
  ZoomIn,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  variant: number;
  hash: string;
}

interface ImageSwipeCarouselProps {
  images: GeneratedImage[];
  onApprove: (image: GeneratedImage) => void;
  onReject: (image: GeneratedImage) => void;
  onComplete: (approved: GeneratedImage[], rejected: GeneratedImage[]) => void;
}

export default function ImageSwipeCarousel({
  images,
  onApprove,
  onReject,
  onComplete,
}: ImageSwipeCarouselProps) {
  const { isSpanish } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approved, setApproved] = useState<GeneratedImage[]>([]);
  const [rejected, setRejected] = useState<GeneratedImage[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const startX = useRef(0);
  const maxDrag = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  const isComplete = currentIndex >= images.length;
  const remaining = images.length - currentIndex;

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!currentImage) return;

      setSwipeDirection(direction);

      setTimeout(() => {
        if (direction === "right") {
          const newApproved = [...approved, currentImage];
          setApproved(newApproved);
          onApprove(currentImage);

          if (currentIndex + 1 >= images.length) {
            onComplete(newApproved, rejected);
          }
        } else {
          const newRejected = [...rejected, currentImage];
          setRejected(newRejected);
          onReject(currentImage);

          if (currentIndex + 1 >= images.length) {
            onComplete(approved, newRejected);
          }
        }

        setCurrentIndex((prev) => prev + 1);
        setSwipeDirection(null);
        setDragOffset(0);
      }, 300);
    },
    [currentImage, currentIndex, images.length, approved, rejected, onApprove, onReject, onComplete],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    maxDrag.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX.current;
    setDragOffset(diff);
    maxDrag.current = Math.max(maxDrag.current, Math.abs(diff));
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (maxDrag.current < 6) {
      setDragOffset(0);
      setPreviewImage(currentImage);
      return;
    }

    if (Math.abs(dragOffset) > 100) {
      handleSwipe(dragOffset > 0 ? "right" : "left");
    } else {
      setDragOffset(0);
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-center">
          {isSpanish ? "¡Selección Completa!" : "Selection Complete!"}
        </h3>
        <div className="flex gap-4">
          <Badge variant="default" className="bg-green-500 text-white px-3 py-1 text-sm">
            <Check className="w-3 h-3 mr-1" />
            {approved.length} {isSpanish ? "aprobadas" : "approved"}
          </Badge>
          <Badge variant="secondary" className="bg-red-100 text-red-700 px-3 py-1 text-sm">
            <X className="w-3 h-3 mr-1" />
            {rejected.length} {isSpanish ? "rechazadas" : "rejected"}
          </Badge>
        </div>
      </div>
    );
  }

  const rotation = dragOffset * 0.05;
  const opacity = Math.max(0, 1 - Math.abs(dragOffset) / 400);
  const swipeAnimClass = swipeDirection === "right"
    ? "translate-x-[120%] rotate-12 opacity-0"
    : swipeDirection === "left"
    ? "-translate-x-[120%] -rotate-12 opacity-0"
    : "";

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center justify-between w-full max-w-sm">
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < currentIndex
                  ? approved.includes(images[i])
                    ? "w-4 bg-green-500"
                    : "w-4 bg-red-400"
                  : i === currentIndex
                  ? "w-6 bg-teal-500"
                  : "w-3 bg-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600 border-green-300">
            <Check className="w-3 h-3 mr-1" />{approved.length}
          </Badge>
          <Badge variant="outline" className="text-red-500 border-red-300">
            <X className="w-3 h-3 mr-1" />{rejected.length}
          </Badge>
        </div>
      </div>

      <div className="relative w-full max-w-sm h-[400px]">
        {images.slice(currentIndex + 1, currentIndex + 3).reverse().map((img, i) => (
          <div
            key={img.id}
            className="absolute inset-0 rounded-xl overflow-hidden shadow-md"
            style={{
              transform: `scale(${0.95 - i * 0.03}) translateY(${(2 - i) * 8}px)`,
              zIndex: i,
              opacity: 0.6 + i * 0.15,
            }}
          >
            <img
              src={img.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}

        <div
          ref={cardRef}
          className={`absolute inset-0 rounded-xl overflow-hidden shadow-xl cursor-grab active:cursor-grabbing transition-transform ${
            swipeDirection ? "duration-300 ease-out " + swipeAnimClass : isDragging ? "" : "duration-150"
          }`}
          style={{
            zIndex: 10,
            transform: !swipeDirection
              ? `translateX(${dragOffset}px) rotate(${rotation}deg)`
              : undefined,
            opacity: !swipeDirection ? opacity : undefined,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={currentImage?.imageUrl}
            alt={`Variation ${currentImage?.variant}`}
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />

          {dragOffset > 50 && (
            <div className="absolute top-6 left-6 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg rotate-[-15deg] shadow-lg border-2 border-white">
              {isSpanish ? "APROBAR" : "APPROVE"}
            </div>
          )}
          {dragOffset < -50 && (
            <div className="absolute top-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg rotate-[15deg] shadow-lg border-2 border-white">
              {isSpanish ? "RECHAZAR" : "REJECT"}
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {isSpanish ? "Variación" : "Variation"} {currentImage?.variant}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
                <ZoomIn className="w-3 h-3 text-white" />
                <span className="text-white text-xs">{isSpanish ? "Ver" : "Preview"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Button
          onClick={() => handleSwipe("left")}
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full border-2 border-red-300 hover:bg-red-50 hover:border-red-500 transition-all"
          disabled={!!swipeDirection}
        >
          <ThumbsDown className="w-6 h-6 text-red-500" />
        </Button>

        <span className="text-sm text-muted-foreground">
          {remaining} {isSpanish ? "restantes" : "remaining"}
        </span>

        <Button
          onClick={() => handleSwipe("right")}
          variant="outline"
          size="lg"
          className="h-14 w-14 rounded-full border-2 border-green-300 hover:bg-green-50 hover:border-green-500 transition-all"
          disabled={!!swipeDirection}
        >
          <ThumbsUp className="w-6 h-6 text-green-500" />
        </Button>
      </div>

      {approved.length > 0 && (
        <Button
          onClick={() => onComplete(approved, rejected)}
          className="w-full max-w-sm bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl h-12 shadow-md"
          disabled={!!swipeDirection}
        >
          <Check className="w-4 h-4 mr-2" />
          {isSpanish
            ? `Listo — Agregar ${approved.length} al Calendario`
            : `Done — Add ${approved.length} to Calendar`}
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center max-w-xs">
        {isSpanish
          ? "Toca para ver la imagen completa. Desliza a la derecha para aprobar, a la izquierda para rechazar."
          : "Tap to preview. Swipe right to approve, left to reject. You can also use the buttons."}
      </p>

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl w-full p-2 bg-black border-none">
          <div className="relative">
            <img
              src={previewImage?.imageUrl}
              alt={`Variation ${previewImage?.variant}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {isSpanish ? "Variación" : "Variation"} {previewImage?.variant}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
