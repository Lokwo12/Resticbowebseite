import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, GripHorizontal } from 'lucide-react';

interface DraggableDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  headerColor?: string;
}

export function DraggableDialog({
  open,
  onClose,
  title,
  children,
  defaultWidth = 680,
  defaultHeight = 600,
  headerColor = '#2f5496',
}: DraggableDialogProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, width: 0, height: 0 });

  // Centre on open or when defaultWidth/defaultHeight change
  useEffect(() => {
    if (open) {
      const w = defaultWidth;
      const h = defaultHeight;
      setSize({ width: w, height: h });
      setPosition({
        x: Math.max(0, (window.innerWidth - w) / 2),
        y: Math.max(24, (window.innerHeight - h) / 2),
      });
    }
  }, [open, defaultWidth, defaultHeight]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 56, e.clientY - dragOffset.current.y)),
        });
      }
      if (isResizing) {
        const newW = Math.max(380, resizeStart.current.width + (e.clientX - resizeStart.current.mouseX));
        const newH = Math.max(280, resizeStart.current.height + (e.clientY - resizeStart.current.mouseY));
        setSize({ width: newW, height: newH });
      }
    },
    [isDragging, isResizing, size.width]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const onTitleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setIsDragging(true);
    e.preventDefault();
  };

  const onResizeHandleMouseDown = (e: React.MouseEvent) => {
    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: size.width,
      height: size.height,
    };
    setIsResizing(true);
    e.preventDefault();
    e.stopPropagation();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: 'none' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/20"
        style={{ pointerEvents: 'auto' }}
        onClick={onClose}
      />

      {/* Dialog window */}
      <div
        className="absolute bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: size.width,
          height: size.height,
          minWidth: 380,
          minHeight: 280,
          userSelect: isDragging || isResizing ? 'none' : 'auto',
          pointerEvents: 'auto',
        }}
      >
        {/* Title bar — drag handle */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-4 flex-shrink-0 select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'grab', backgroundColor: headerColor }}
          onMouseDown={onTitleBarMouseDown}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <GripHorizontal size={15} className="text-emerald-300 flex-shrink-0" />
            <h2 className="text-base font-semibold text-white tracking-wide truncate">{title}</h2>
          </div>
          <button
            data-no-drag
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500 text-white transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content — both axes */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>

        {/* Resize handle — bottom-right corner */}
        <div
          className="absolute bottom-0 right-0 w-7 h-7 cursor-se-resize flex items-end justify-end p-1.5 opacity-30 hover:opacity-80 transition-opacity"
          onMouseDown={onResizeHandleMouseDown}
          data-no-drag
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M11 1L1 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 6L6 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 11" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}
