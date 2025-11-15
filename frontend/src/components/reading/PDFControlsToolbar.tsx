'use client';

import React from 'react';
import {
  MagnifyingGlassIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';

interface PDFControlsToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onFitWidth: () => void;
  onToggleThumbnails: () => void;
  onToggleSearch: () => void;
  showThumbnails: boolean;
  showSearch: boolean;
}

export default function PDFControlsToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onRotate,
  onFitWidth,
  onToggleThumbnails,
  onToggleSearch,
  showThumbnails,
  showSearch,
}: PDFControlsToolbarProps) {
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 bg-gray-900 rounded-lg shadow-2xl p-1">
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
        title="Zoom out"
      >
        <MagnifyingGlassMinusIcon className="w-5 h-5" />
      </button>

      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
        title="Zoom in"
      >
        <MagnifyingGlassPlusIcon className="w-5 h-5" />
      </button>

      {/* Zoom Percentage Display */}
      <div className="px-3 py-1 text-white text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Rotate */}
      <button
        onClick={onRotate}
        className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
        title="Rotate"
      >
        <ArrowPathIcon className="w-5 h-5" />
      </button>

      {/* Fit Width */}
      <button
        onClick={onFitWidth}
        className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
        title="Fit to width"
      >
        <Squares2X2Icon className="w-5 h-5" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Page Thumbnails */}
      <button
        onClick={onToggleThumbnails}
        className={`p-2 rounded transition-colors ${
          showThumbnails
            ? 'bg-purple-600 text-white'
            : 'text-white hover:bg-gray-700'
        }`}
        title="Page thumbnails"
      >
        <RectangleStackIcon className="w-5 h-5" />
      </button>

      {/* Search */}
      <button
        onClick={onToggleSearch}
        className={`p-2 rounded transition-colors ${
          showSearch
            ? 'bg-purple-600 text-white'
            : 'text-white hover:bg-gray-700'
        }`}
        title="Search in PDF"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

