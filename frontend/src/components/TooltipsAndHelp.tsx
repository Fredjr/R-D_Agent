import React, { memo, useState, useRef, useEffect } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Basic tooltip component
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  maxWidth?: string;
  className?: string;
  disabled?: boolean;
}

export const Tooltip = memo<TooltipProps>(({
  content,
  children,
  position = 'top',
  delay = 500,
  maxWidth = '200px',
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900'
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          className={`
            absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg
            shadow-lg pointer-events-none whitespace-normal
            ${positionClasses[position]}
          `}
          style={{ maxWidth }}
        >
          {content}
          <div className={`absolute ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

// Help icon with tooltip
interface HelpIconProps {
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const HelpIcon = memo<HelpIconProps>(({
  content,
  size = 'sm',
  position = 'top',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Tooltip content={content} position={position}>
      <QuestionMarkCircleIcon 
        className={`${sizeClasses[size]} text-gray-400 hover:text-gray-600 cursor-help ${className}`}
      />
    </Tooltip>
  );
});

HelpIcon.displayName = 'HelpIcon';

// Interactive help overlay
interface HelpOverlayProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const HelpOverlay = memo<HelpOverlayProps>(({
  visible,
  onClose,
  title = 'Help',
  children
}) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
});

HelpOverlay.displayName = 'HelpOverlay';

// Keyboard shortcuts help panel
interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    key: string;
    description: string;
    category?: string;
  }>;
  formatShortcut: (shortcut: any) => string;
}

export const KeyboardShortcutsHelp = memo<KeyboardShortcutsHelpProps>(({
  shortcuts,
  formatShortcut
}) => {
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category || 'General';
    if (!groups[category]) groups[category] = [];
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Keyboard Shortcuts
        </h3>
        <p className="text-gray-600">
          Use these shortcuts to navigate and interact more efficiently
        </p>
      </div>

      {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
        <div key={category}>
          <h4 className="text-md font-medium text-gray-800 mb-3 border-b border-gray-200 pb-1">
            {category}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryShortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-800 shadow-sm">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

KeyboardShortcutsHelp.displayName = 'KeyboardShortcutsHelp';

// Feature introduction tour
interface TourStep {
  target: string; // CSS selector
  title: string;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface FeatureTourProps {
  steps: TourStep[];
  visible: boolean;
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onFinish: () => void;
}

export const FeatureTour = memo<FeatureTourProps>(({
  steps,
  visible,
  currentStep,
  onNext,
  onPrevious,
  onClose,
  onFinish
}) => {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (visible && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.position = 'relative';
        element.style.zIndex = '1000';
      }
    }

    return () => {
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
      }
    };
  }, [visible, currentStep, steps, targetElement]);

  if (!visible || !steps[currentStep] || !targetElement) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Tour popup */}
      <div className="fixed z-50 bg-white rounded-lg shadow-xl border max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6 text-gray-700">
          {step.content}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </div>
          
          <div className="flex space-x-2">
            {!isFirstStep && (
              <button
                onClick={onPrevious}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Previous
              </button>
            )}
            
            {isLastStep ? (
              <button
                onClick={onFinish}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Finish
              </button>
            ) : (
              <button
                onClick={onNext}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
});

FeatureTour.displayName = 'FeatureTour';

// Context-sensitive help
interface ContextHelpProps {
  context: string;
  className?: string;
}

const CONTEXT_HELP: Record<string, { title: string; content: React.ReactNode }> = {
  'network-view': {
    title: 'Network View',
    content: (
      <div className="space-y-3">
        <p>Explore citation relationships between research papers:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Click</strong> a node to view paper details</li>
          <li><strong>Double-click</strong> to expand citations/references</li>
          <li><strong>Ctrl+Click</strong> to select multiple nodes</li>
          <li><strong>Drag</strong> to pan the network</li>
          <li><strong>Scroll</strong> to zoom in/out</li>
        </ul>
      </div>
    )
  },
  'collections': {
    title: 'Collections',
    content: (
      <div className="space-y-3">
        <p>Organize and manage your research papers:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Create collections to group related papers</li>
          <li>Add papers from PubMed exploration</li>
          <li>View citation networks for your collections</li>
          <li>Export collections for sharing</li>
        </ul>
      </div>
    )
  },
  'multi-column': {
    title: 'Multi-Column View',
    content: (
      <div className="space-y-3">
        <p>Explore multiple research paths simultaneously:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Each column shows a different network type</li>
          <li>Switch between Citations, References, and Similar Papers</li>
          <li>Click papers to expand in new columns</li>
          <li>Compare different research directions</li>
        </ul>
      </div>
    )
  }
};

export const ContextHelp = memo<ContextHelpProps>(({
  context,
  className = ''
}) => {
  const helpData = CONTEXT_HELP[context];
  
  if (!helpData) return null;

  return (
    <HelpIcon
      content={
        <div className="max-w-xs">
          <div className="font-medium mb-2">{helpData.title}</div>
          {helpData.content}
        </div>
      }
      className={className}
    />
  );
});

ContextHelp.displayName = 'ContextHelp';

// Hook for managing help state
export const useHelp = () => {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

  const showHelp = () => setIsHelpVisible(true);
  const hideHelp = () => setIsHelpVisible(false);
  const toggleHelp = () => setIsHelpVisible(prev => !prev);

  const startTour = () => {
    setCurrentTourStep(0);
    setTourVisible(true);
  };

  const nextTourStep = () => setCurrentTourStep(prev => prev + 1);
  const previousTourStep = () => setCurrentTourStep(prev => Math.max(0, prev - 1));
  
  const finishTour = () => {
    setTourVisible(false);
    setCurrentTourStep(0);
  };

  return {
    isHelpVisible,
    tourVisible,
    currentTourStep,
    showHelp,
    hideHelp,
    toggleHelp,
    startTour,
    nextTourStep,
    previousTourStep,
    finishTour
  };
};
