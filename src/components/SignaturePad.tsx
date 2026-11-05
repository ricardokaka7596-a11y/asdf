import React, { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { RotateCcw, Trash2, Check, PenTool } from 'lucide-react';
import { PenColor, PenWidth, Point, Stroke } from '../types';

export interface SignaturePadRef {
  clear: () => void;
  undo: () => void;
  getDataUrl: () => string | null;
  isEmpty: () => boolean;
}

interface SignaturePadProps {
  onStrokeChange?: (hasStrokes: boolean) => void;
  height?: number;
}

const PEN_COLORS: { label: string; value: PenColor; bgClass: string }[] = [
  { label: '먹색 (Black)', value: '#0f172a', bgClass: 'bg-slate-900' },
  { label: '청색 (Navy)', value: '#1e3a8a', bgClass: 'bg-blue-900' },
  { label: '인주색 (Red)', value: '#991b1b', bgClass: 'bg-red-800' },
];

const PEN_WIDTHS: { label: string; value: PenWidth }[] = [
  { label: '보통', value: 3.5 },
  { label: '얇게', value: 2 },
  { label: '굵게', value: 5 },
];

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(function SignaturePad(
  { onStrokeChange, height = 240 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [penColor, setPenColor] = useState<PenColor>('#0f172a');
  const [penWidth, setPenWidth] = useState<PenWidth>(3.5);
  const [isDrawing, setIsDrawing] = useState(false);
  const dprRef = useRef(1);

  // Redraw all strokes on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = dprRef.current;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        // Dot
        const pt = stroke.points[0];
        ctx.arc(pt.x, pt.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        return;
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p1 = stroke.points[i - 1];
        const p2 = stroke.points[i];
        // Quadratic curve midpoint smoothing for silky natural handwriting
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    });

    ctx.restore();
  }, [strokes, currentStroke]);

  // Adjust canvas resolution for DPR & container size
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    updateCanvasDimensions();
    const handleResize = () => {
      updateCanvasDimensions();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions]);

  useEffect(() => {
    redrawCanvas();
    onStrokeChange?.(strokes.length > 0 || currentStroke !== null);
  }, [strokes, currentStroke, redrawCanvas, onStrokeChange]);

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // In case pointer capture fails on some browsers
    }

    const startPoint = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke({
      points: [startPoint],
      color: penColor,
      width: penWidth,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const nextPoint = getCanvasCoordinates(e);

    // Filter tiny jitter for smoothness
    const lastPoint = currentStroke.points[currentStroke.points.length - 1];
    if (lastPoint) {
      const dist = Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y);
      if (dist < 1.2) return;
    }

    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, nextPoint],
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // safe ignore
      }
    }

    setIsDrawing(false);
    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  const clear = () => {
    setStrokes([]);
    setCurrentStroke(null);
  };

  const undo = () => {
    setStrokes((prev) => prev.slice(0, prev.length - 1));
    setCurrentStroke(null);
  };

  const isEmpty = () => {
    return strokes.length === 0 && currentStroke === null;
  };

  const getDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty()) return null;

    // Create a pristine export canvas with white background (or transparent)
    // A clean white background is best for receipts, sheets, and documents
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw the signature on top
    ctx.drawImage(canvas, 0, 0);

    return exportCanvas.toDataURL('image/png');
  };

  useImperativeHandle(ref, () => ({
    clear,
    undo,
    getDataUrl,
    isEmpty,
  }));

  const hasContent = strokes.length > 0 || currentStroke !== null;

  return (
    <div className="w-full select-none">
      {/* Top Toolbar: Pen Color & Thickness Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">펜 색상</span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {PEN_COLORS.map((color) => {
              const isSelected = penColor === color.value;
              return (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setPenColor(color.value)}
                  className={`relative w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                    color.bgClass
                  } ${isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105' : 'opacity-80 hover:opacity-100'}`}
                  title={color.label}
                  aria-label={color.label}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Pen thickness */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {PEN_WIDTHS.map((width) => (
              <button
                key={width.value}
                type="button"
                onClick={() => setPenWidth(width.value)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  penWidth === width.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {width.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear and Undo buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={undo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="마지막 획 실행 취소"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>되돌리기</span>
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasContent}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-red-600 bg-red-50/60 border border-red-100 hover:bg-red-100/70 active:bg-red-200/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="서명 전체 지우기"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>지우기</span>
          </button>
        </div>
      </div>

      {/* Signature Canvas Box */}
      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="relative w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 hover:border-slate-400 focus-within:border-slate-800 transition-colors overflow-hidden shadow-inner cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          className="signature-canvas block w-full h-full"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        />

        {/* Subtle Sign-Here Baseline Indicator */}
        <div
          className={`pointer-events-none absolute inset-x-6 bottom-10 flex items-center justify-between transition-opacity duration-300 ${
            hasContent ? 'opacity-25' : 'opacity-80'
          }`}
        >
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
            <span className="text-lg font-serif">✕</span>
            <span>여기에 정자로 서명해 주세요</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <PenTool className="w-3.5 h-3.5" />
            <span>손가락 / 펜 / 마우스 터치</span>
          </div>
        </div>
        <div
          className={`pointer-events-none absolute inset-x-6 bottom-8 border-b border-slate-300 transition-opacity duration-300 ${
            hasContent ? 'opacity-20' : 'opacity-70'
          }`}
        />
      </div>

      <div className="flex items-center justify-between pt-1.5 px-1 text-[11px] text-slate-400">
        <span>* 서명은 고해상도로 안전하게 저장됩니다.</span>
        <span>{hasContent ? `${strokes.length}개 획 입력됨` : '서명 대기 중'}</span>
      </div>
    </div>
  );
});
