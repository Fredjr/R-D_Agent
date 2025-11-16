'use client';

import React from 'react';

interface CytoscapePanelProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const CytoscapePanel: React.FC<CytoscapePanelProps> = ({
  position = 'top-left',
  className = '',
  style,
  children,
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-10 ${className}`} style={style}>
      {children}
    </div>
  );
};

export default CytoscapePanel;

