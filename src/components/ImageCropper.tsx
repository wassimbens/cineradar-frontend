"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  file: File;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ file, onCrop, onCancel }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const SIZE = 240;

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        draw();
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Calcul correct : quelle portion de l'image source afficher
    const srcW = img.naturalWidth / zoom;
    const srcH = img.naturalHeight / zoom;
    const srcX = (img.naturalWidth - srcW) / 2 - offsetX / zoom;
    const srcY = (img.naturalHeight - srcH) / 2 - offsetY / zoom;

    // Fond noir
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Clip circulaire pour l'aperçu
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, SIZE, SIZE);
    ctx.restore();

    // Contour du cercle
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "var(--red, #e63946)";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => { draw(); }, [zoom, offsetX, offsetY]);

  const applyDrag = (clientX: number, clientY: number) => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const maxX = (img.naturalWidth * zoom - SIZE) / 2;
    const maxY = (img.naturalHeight * zoom - SIZE) / 2;
    setOffsetX(v => Math.max(-maxX, Math.min(maxX, v + dx)));
    setOffsetY(v => Math.max(-maxY, Math.min(maxY, v + dy)));
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    applyDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDragging) return;
    const t = e.touches[0];
    applyDrag(t.clientX, t.clientY);
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    // Export en carré (le CSS de l'avatar gère le cercle)
    const out = document.createElement("canvas");
    out.width = SIZE;
    out.height = SIZE;
    const ctx = out.getContext("2d")!;

    const srcW = img.naturalWidth / zoom;
    const srcH = img.naturalHeight / zoom;
    const srcX = (img.naturalWidth - srcW) / 2 - offsetX / zoom;
    const srcY = (img.naturalHeight - srcH) / 2 - offsetY / zoom;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, SIZE, SIZE);

    onCrop(out.toDataURL("image/jpeg", 0.85));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl p-6 flex flex-col gap-4 w-full"
        style={{ maxWidth: 380, background: "var(--bg-2)", border: "1px solid var(--border)" }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-center" style={{ color: "var(--text)" }}>
          Ajuster votre photo
        </h2>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className="cursor-move"
            style={{ borderRadius: "50%", background: "#000" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setIsDragging(false)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium" style={{ color: "var(--text-3)" }}>
            Zoom : {zoom.toFixed(1)}×
          </label>
          <input
            type="range" min="1" max="3" step="0.05"
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-full"
            style={{ accentColor: "var(--red)" }}
          />
        </div>

        <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
          Glissez pour recentrer · zoomez pour cadrer
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--bg-3)", color: "var(--text-2)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            Annuler
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--red)", border: "none", cursor: "pointer" }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
