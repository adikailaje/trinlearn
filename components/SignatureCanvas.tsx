
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { TrashIcon, PencilIcon } from './Icons';

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  penColor?: string;
  backgroundColor?: string;
}

export interface SignatureCanvasRef {
  getSignature: () => string | null; 
  clearSignature: () => void;
  isEmpty: () => boolean;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ width = 400, height = 150, penColor = '#FFFFFF', backgroundColor = '#2D2D2D' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmptyCanvas, setIsEmptyCanvas] = useState(true);

    useImperativeHandle(ref, () => ({
      getSignature: () => {
        if (!canvasRef.current || isEmptyCanvas) return null;
        return canvasRef.current.toDataURL('image/png');
      },
      clearSignature: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setIsEmptyCanvas(true);
          }
        }
      },
      isEmpty: () => isEmptyCanvas,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, width, height);
          setIsEmptyCanvas(true); 
        }
      }
    }, [width, height, backgroundColor]);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;
      if (event.nativeEvent instanceof MouseEvent) {
        clientX = event.nativeEvent.clientX;
        clientY = event.nativeEvent.clientY;
      } else if (event.nativeEvent instanceof TouchEvent) {
        if (event.nativeEvent.touches.length === 0) return null; 
        clientX = event.nativeEvent.touches[0].clientX;
        clientY = event.nativeEvent.touches[0].clientY;
      } else {
        return null; 
      }
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
      const coords = getCoordinates(event);
      if (!coords || !canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      setIsDrawing(true);
      setIsEmptyCanvas(false);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      event.preventDefault(); 
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || !canvasRef.current) return;
      const coords = getCoordinates(event);
      if (!coords) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = penColor;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      event.preventDefault();
    };

    const stopDrawing = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.closePath();
      setIsDrawing(false);
    };
    
    const handleClear = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setIsEmptyCanvas(true);
          }
        }
    };

    return (
      <div className="relative w-full max-w-md">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing} 
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="border border-neutral-600 rounded-md touch-none bg-[var(--canvas-bg-color)]" 
          style={{ '--canvas-bg-color': backgroundColor } as React.CSSProperties}
          aria-label="Signature Pad"
        />
        {!isDrawing && isEmptyCanvas && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-500">
                <PencilIcon className="w-5 h-5 mr-2"/>
                <span>Draw your signature here</span>
            </div>
        )}
        <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-neutral-700/50 hover:bg-neutral-600/70 text-neutral-300 hover:text-white transition-colors"
            title="Clear Signature"
        >
            <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }
);

export default SignatureCanvas;
