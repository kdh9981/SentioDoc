'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 150,
  maxWidth = 280
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close on click outside for mobile
  useEffect(() => {
    if (isVisible) {
      const handleClickOutside = () => setIsVisible(false);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-slate-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent border-l-slate-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-slate-800',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onTouchStart={handleTouchStart}
      onClick={(e) => e.stopPropagation()}
    >
      {children}

      {isVisible && content && (
        <div
          className={`absolute z-[100] ${positionClasses[position]}`}
          style={{ width: maxWidth }}
          role="tooltip"
        >
          <div className="bg-slate-800 text-white text-sm leading-relaxed px-4 py-3 rounded-lg shadow-xl">
            {content}
          </div>
          <div className={`absolute w-0 h-0 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}

/**
 * Clean "ⓘ" info icon with tooltip
 * Simple, clean design - just the letter "i" in a circle
 */
interface InfoTooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md';
}

export function InfoTooltip({ content, position = 'top', size = 'sm' }: InfoTooltipProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
  };

  return (
    <Tooltip content={content} position={position} maxWidth={280}>
      <span
        className={`inline-flex items-center justify-center ${sizeClasses[size]} rounded-full border border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-500 hover:bg-slate-100 cursor-help transition-all font-medium flex-shrink-0`}
        style={{ fontFamily: 'serif', fontStyle: 'italic' }}
      >
        i
      </span>
    </Tooltip>
  );
}

export default Tooltip;
