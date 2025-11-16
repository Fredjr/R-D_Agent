'use client';

import React from 'react';
import { Core } from 'cytoscape';

interface CytoscapeControlsProps {
  cy: Core | null;
  className?: string;
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const CytoscapeControls: React.FC<CytoscapeControlsProps> = ({
  cy,
  className = '',
  showZoom = true,
  showFitView = true,
  showInteractive = true,
  position = 'bottom-right',
}) => {
  const handleZoomIn = () => {
    if (cy) {
      cy.zoom(cy.zoom() * 1.2);
      cy.center();
    }
  };

  const handleZoomOut = () => {
    if (cy) {
      cy.zoom(cy.zoom() * 0.8);
      cy.center();
    }
  };

  const handleFitView = () => {
    if (cy) {
      cy.fit(undefined, 50);
    }
  };

  const handleReset = () => {
    if (cy) {
      cy.zoom(1);
      cy.center();
    }
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2 ${className}`}
    >
      {showZoom && (
        <>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
        </>
      )}
      {showFitView && (
        <button
          onClick={handleFitView}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Fit View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      )}
      {showInteractive && (
        <button
          onClick={handleReset}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default CytoscapeControls;

