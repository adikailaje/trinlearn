
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader } from './Loader';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  cropSize?: number; // The output size of the square image containing the circle
  minZoom?: number;
  maxZoom?: number;
}

const CROP_VIEW_SIZE = 300; // Display size of the cropping UI
const DEFAULT_CROP_OUTPUT_SIZE = 200; // Actual output image dimension

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onCancel,
  cropSize = DEFAULT_CROP_OUTPUT_SIZE,
  minZoom = 0.5,
  maxZoom = 3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Important for canvas if image is from different origin
      img.onload = () => {
        setImgElement(img);
        // Reset zoom and offset when new image is loaded
        const initialZoom = Math.max(CROP_VIEW_SIZE / img.width, CROP_VIEW_SIZE / img.height);
        setZoom(Math.max(minZoom, initialZoom)); // Ensure it fits initially but not less than minZoom
        setOffset({ x: (CROP_VIEW_SIZE - img.width * initialZoom) / 2, y: (CROP_VIEW_SIZE - img.height * initialZoom) / 2 });

      };
      img.onerror = () => {
        console.error("Failed to load image for cropping.");
        onCancel(); // Or show an error
      }
      img.src = imageSrc;
    } else {
      setImgElement(null);
    }
  }, [imageSrc, minZoom, onCancel]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CROP_VIEW_SIZE, CROP_VIEW_SIZE);
    
    // Draw the image panned and zoomed
    ctx.drawImage(imgElement, offset.x, offset.y, imgElement.width * zoom, imgElement.height * zoom);

    // Draw the circular crop guide overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.rect(0, 0, CROP_VIEW_SIZE, CROP_VIEW_SIZE);
    ctx.arc(CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, 0, Math.PI * 2, true); // Cut out circle
    ctx.fill();

    // Draw a border for the circle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, CROP_VIEW_SIZE / 2, 0, Math.PI * 2);
    ctx.stroke();

  }, [imgElement, zoom, offset]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !imgElement) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    // Constrain panning
    const maxOffsetX = 0;
    const minOffsetX = CROP_VIEW_SIZE - imgElement.width * zoom;
    const maxOffsetY = 0;
    const minOffsetY = CROP_VIEW_SIZE - imgElement.height * zoom;

    newX = Math.min(maxOffsetX, Math.max(minOffsetX, newX));
    newY = Math.min(maxOffsetY, Math.max(minOffsetY, newY));
    
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(!imgElement) return;
    const newZoom = parseFloat(e.target.value);
    
    // Calculate new offset to zoom towards center
    const centerX = CROP_VIEW_SIZE / 2;
    const centerY = CROP_VIEW_SIZE / 2;

    const newOffsetX = centerX - (centerX - offset.x) * (newZoom / zoom);
    const newOffsetY = centerY - (centerY - offset.y) * (newZoom / zoom);
    
    // Constrain new offset after zoom
    const maxOffsetX = 0;
    const minOffsetX = CROP_VIEW_SIZE - imgElement.width * newZoom;
    const maxOffsetY = 0;
    const minOffsetY = CROP_VIEW_SIZE - imgElement.height * newZoom;

    setOffset({
      x: Math.min(maxOffsetX, Math.max(minOffsetX, newOffsetX)),
      y: Math.min(maxOffsetY, Math.max(minOffsetY, newOffsetY))
    });
    setZoom(newZoom);
  };

  const handleCrop = () => {
    if (!imgElement) return;
    setIsProcessing(true);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropSize;
    tempCanvas.height = cropSize;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
      console.error("Failed to create temp canvas context for cropping.");
      setIsProcessing(false);
      onCancel(); // Or show an error
      return;
    }
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Apply circular clipping path to the output canvas
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Calculate source rectangle from the original image that corresponds to the
    // CROP_VIEW_SIZE x CROP_VIEW_SIZE preview area.
    // sx, sy: top-left of the source rectangle in the original image.
    // This is derived from the preview's top-left (0,0) point, adjusted for pan (offset) and zoom.
    const sx = -offset.x / zoom;
    const sy = -offset.y / zoom;

    // sWidth, sHeight: dimensions of the source rectangle in the original image.
    // This corresponds to the full CROP_VIEW_SIZE preview area, scaled back to original image dimensions.
    const sWidth = CROP_VIEW_SIZE / zoom;
    const sHeight = CROP_VIEW_SIZE / zoom;

    // Draw the calculated source rectangle from the original image onto the output canvas.
    // This scales the content seen in the CROP_VIEW_SIZE preview area to fit the cropSize output area.
    ctx.drawImage(
      imgElement,
      sx,                      // Source X from original image
      sy,                      // Source Y from original image
      sWidth,                  // Source Width from original image
      sHeight,                 // Source Height from original image
      0, 0, cropSize, cropSize  // Destination X, Y, Width, Height on output canvas
    );

    const croppedDataUrl = tempCanvas.toDataURL('image/png');
    onCropComplete(croppedDataUrl);
    setIsProcessing(false);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#1A1A1A] p-6 rounded-lg shadow-xl border border-[#2C2C2C] w-full max-w-md">
        <h3 className="text-xl font-semibold text-neutral-100 mb-4">Crop Your Picture</h3>
        
        {imgElement ? (
          <>
            <div 
              className="relative mx-auto cursor-grab mb-4 overflow-hidden" // Added overflow-hidden for neatness
              style={{ width: CROP_VIEW_SIZE, height: CROP_VIEW_SIZE }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              <canvas 
                ref={canvasRef} 
                width={CROP_VIEW_SIZE} 
                height={CROP_VIEW_SIZE}
                className="rounded-md" // This might be hidden by the overlay anyway
              />
            </div>

            <div className="mb-4">
              <label htmlFor="zoom" className="block text-sm font-medium text-neutral-300 mb-1">Zoom</label>
              <input
                type="range"
                id="zoom"
                min={minZoom}
                max={maxZoom}
                step="0.01"
                value={zoom}
                onChange={handleZoomChange}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center mb-4" style={{ height: CROP_VIEW_SIZE }}>
            <Loader size="lg" />
            <p className="ml-3 text-neutral-400">Loading image...</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 rounded-md text-sm font-medium text-neutral-300 bg-neutral-600 hover:bg-neutral-500 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            disabled={!imgElement || isProcessing}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isProcessing && <Loader size="sm" className="mr-2" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
