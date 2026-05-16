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

  const CANVAS_SIZE = 300;

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        drawCanvas();
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const drawCanvas = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = imgRef.current;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    const displayWidth = img.naturalWidth * zoom;
    const displayHeight = img.naturalHeight * zoom;

    ctx.drawImage(
      img,
      offsetX,
      offsetY,
      displayWidth,
      displayHeight,
      0,
      0,
      CANVAS_SIZE,
      CANVAS_SIZE
    );
  };

  useEffect(() => {
    drawCanvas();
  }, [zoom, offsetX, offsetY]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoom(parseFloat(e.target.value));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !imgRef.current) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const maxOffsetX = (imgRef.current.naturalWidth * zoom - CANVAS_SIZE) / 2;
    const maxOffsetY = (imgRef.current.naturalHeight * zoom - CANVAS_SIZE) / 2;

    const newOffsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX + dx));
    const newOffsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY + dy));

    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.82);
    onCrop(dataUrl);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 flex flex-col gap-4 w-full"
        style={{ maxWidth: 400, background: "var(--bg-2)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
          Ajuster votre photo
        </h2>

        {/* Canvas — zone de crop */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl cursor-move border-2"
            style={{ borderColor: "var(--red)", background: "#000" }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {/* Slider de zoom */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Zoom : {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={handleZoomChange}
            className="w-full"
            style={{
              accentColor: "var(--red)",
            }}
          />
        </div>

        {/* Instructions */}
        <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
          Glissez pour positionner, utilisez le zoom pour ajuster la taille
        </p>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "var(--bg-3)",
              color: "var(--text-2)",
              border: "1px solid var(--border)",
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{
              background: "var(--red)",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
