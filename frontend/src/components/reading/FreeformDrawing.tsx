'use client';

import { useState, useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
}

interface FreeformDrawingProps {
  isEnabled: boolean;
  selectedColor: string;
  pageNumber: number;
  onDrawingComplete: (drawingData: any) => void;
}

/**
 * FreeformDrawing - Allows users to draw freeform shapes on PDF
 * 
 * Similar to Cochrane Library's freeform drawing tool
 */
export default function FreeformDrawing({
  isEnabled,
  selectedColor,
  pageNumber,
  onDrawingComplete,
}: FreeformDrawingProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [completedPaths, setCompletedPaths] = useState<DrawingPath[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  // Update canvas size and position
  useEffect(() => {
    if (!isEnabled) return;

    const updateCanvasSize = () => {
      const pageElement = document.querySelector(
        `.react-pdf__Page[data-page-number="${pageNumber}"]`
      );
      
      if (pageElement && canvasRef.current) {
        const rect = pageElement.getBoundingClientRect();
        setCanvasRect(rect);
        
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        
        // Redraw all paths
        redrawCanvas();
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isEnabled, pageNumber, completedPaths]);

  // Redraw all paths on canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed paths
    completedPaths.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      ctx.stroke();
    });

    // Draw current path
    if (currentPath.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      
      ctx.stroke();
    }
  };

  // Redraw when paths change
  useEffect(() => {
    redrawCanvas();
  }, [currentPath, completedPaths, selectedColor]);

  // Handle mouse events
  useEffect(() => {
    if (!isEnabled || !canvasRect) return;

    const handleMouseDown = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setCurrentPath((prev) => [...prev, { x, y }]);
    };

    const handleMouseUp = () => {
      if (!isDrawing) return;

      setIsDrawing(false);

      if (currentPath.length > 1) {
        const newPath: DrawingPath = {
          points: currentPath,
          color: selectedColor,
          width: 3,
        };

        setCompletedPaths((prev) => [...prev, newPath]);
        
        // Trigger callback with drawing data
        onDrawingComplete({
          paths: [...completedPaths, newPath],
          pageNumber,
        });
      }

      setCurrentPath([]);
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEnabled, isDrawing, currentPath, selectedColor, canvasRect, pageNumber]);

  if (!isEnabled || !canvasRect) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed pointer-events-auto z-[45] cursor-crosshair"
      style={{
        left: `${canvasRect.left}px`,
        top: `${canvasRect.top}px`,
      }}
    />
  );
}

