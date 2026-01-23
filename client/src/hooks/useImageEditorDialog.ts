import { useState } from "react";

export interface ImageEditorPost {
  id: string;
  imageUrl: string;
}

export interface EditHistory {
  original: string;
  edits: string[];
  index: number;
}

export function useImageEditorDialog() {
  const [show, setShow] = useState(false);
  const [post, setPost] = useState<ImageEditorPost | null>(null);
  const [history, setHistory] = useState<EditHistory | null>(null);

  const open = (imagePost: ImageEditorPost) => {
    setPost(imagePost);
    setHistory({
      original: imagePost.imageUrl,
      edits: [imagePost.imageUrl],
      index: 0,
    });
    setShow(true);
  };

  const close = () => {
    setPost(null);
    setHistory(null);
    setShow(false);
  };

  const saveEdit = (editedImage: string) => {
    if (!history) return;
    const newEdits = [
      ...history.edits.slice(0, history.index + 1),
      editedImage,
    ];
    setHistory({ ...history, edits: newEdits, index: history.index + 1 });
  };

  const undo = () => {
    if (history && history.index > 0) {
      setHistory({ ...history, index: history.index - 1 });
    }
  };

  const redo = () => {
    if (history && history.index < history.edits.length - 1) {
      setHistory({ ...history, index: history.index + 1 });
    }
  };

  const canUndo = history ? history.index > 0 : false;
  const canRedo = history ? history.index < history.edits.length - 1 : false;
  const currentImage = history?.edits[history?.index] || post?.imageUrl || "";

  return { show, post, open, close, saveEdit, undo, redo, canUndo, canRedo, currentImage };
}
