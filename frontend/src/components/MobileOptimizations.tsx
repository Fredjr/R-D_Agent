import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ShareIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

// Hook for detecting mobile devices and screen sizes
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize.width < 768;
  const isTablet = screenSize.width >= 768 && screenSize.width < 1024;
  const isDesktop = screenSize.width >= 1024;
  const isSmallScreen = screenSize.width < 640;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
};

// Mobile-optimized network node
interface MobileNetworkNodeProps {
  id: string;
  data: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    node_type: string;
  };
  selected?: boolean;
  onTap?: (nodeId: string) => void;
  onLongPress?: (nodeId: string) => void;
}

export const MobileNetworkNode = memo<MobileNetworkNodeProps>(({
  id,
  data,
  selected = false,
  onTap,
  onLongPress
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    setIsPressed(true);
    pressTimer.current = setTimeout(() => {
      onLongPress?.(id);
    }, 500);
  }, [id, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      onTap?.(id);
    }
  }, [id, onTap]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  }, []);

  return (
    <div
      className={`
        bg-white rounded-lg border-2 p-3 min-w-[250px] max-w-[280px]
        transition-all duration-200 touch-manipulation
        ${selected ? 'border-blue-500 shadow-lg' : 'border-gray-200'}
        ${isPressed ? 'scale-95 shadow-sm' : 'shadow-md'}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Compact header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {data.node_type}
        </span>
        <span className="text-xs text-gray-500">{data.year}</span>
      </div>

      {/* Title - truncated for mobile */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
        {data.title}
      </h3>

      {/* Authors - show only first author on mobile */}
      <div className="text-xs text-gray-600 mb-2">
        {data.authors[0] || 'Unknown author'}
        {data.authors.length > 1 && ` +${data.authors.length - 1} more`}
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500 truncate flex-1 mr-2">
          {data.journal}
        </span>
        {data.citation_count > 0 && (
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {data.citation_count} cites
          </span>
        )}
      </div>

      {/* Touch indicators */}
      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 text-center">
        Tap to select • Long press for options
      </div>
    </div>
  );
});

MobileNetworkNode.displayName = 'MobileNetworkNode';

// Mobile-optimized sidebar
interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const MobileSidebar = memo<MobileSidebarProps>(({
  isOpen,
  onClose,
  title,
  children
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          md:relative md:translate-x-0 md:w-80
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 md:hidden"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
});

MobileSidebar.displayName = 'MobileSidebar';

// Mobile-optimized collection grid
interface MobileCollectionGridProps {
  collections: Array<{
    collection_id: string;
    collection_name: string;
    article_count: number;
    created_at: string;
  }>;
  onCollectionSelect: (collectionId: string) => void;
  selectedCollection?: string;
}

export const MobileCollectionGrid = memo<MobileCollectionGridProps>(({
  collections,
  onCollectionSelect,
  selectedCollection
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {collections.map((collection) => (
        <div
          key={collection.collection_id}
          className={`
            bg-white rounded-lg border-2 p-4 cursor-pointer
            transition-all duration-200 touch-manipulation
            ${selectedCollection === collection.collection_id 
              ? 'border-blue-500 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
          onClick={() => onCollectionSelect(collection.collection_id)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">📁</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {collection.collection_name}
              </h3>
              <p className="text-xs text-gray-500">
                {collection.article_count} articles
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

MobileCollectionGrid.displayName = 'MobileCollectionGrid';

// Mobile navigation tabs
interface MobileTabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const MobileTabs = memo<MobileTabsProps>(({
  tabs,
  activeTab,
  onTabChange
}) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScroll);
      return () => element.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -100, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 100, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 z-10 bg-white shadow-md rounded-r-lg px-2 flex items-center"
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}
      
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 z-10 bg-white shadow-md rounded-l-lg px-2 flex items-center"
        >
          <ChevronRightIcon className="w-4 h-4 text-gray-600" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide space-x-1 p-1 bg-gray-100 rounded-lg"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
              whitespace-nowrap transition-all duration-200 touch-manipulation
              ${activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {tab.icon && <span className="text-lg">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`
                px-2 py-1 rounded-full text-xs
                ${activeTab === tab.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

MobileTabs.displayName = 'MobileTabs';

// Mobile-optimized floating action button
interface MobileFABProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const MobileFAB = memo<MobileFABProps>(({
  icon,
  label,
  onClick,
  position = 'bottom-right',
  color = 'blue'
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  const colorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed z-50 w-14 h-14 rounded-full shadow-lg
        flex items-center justify-center text-white
        transition-all duration-200 touch-manipulation
        ${positionClasses[position]} ${colorClasses[color]}
        hover:shadow-xl active:scale-95
        md:hidden
      `}
      aria-label={label}
    >
      {icon}
    </button>
  );
});

MobileFAB.displayName = 'MobileFAB';

// Mobile-optimized search bar
interface MobileSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  loading?: boolean;
}

export const MobileSearch = memo<MobileSearchProps>(({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  loading = false
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSubmit()}
        placeholder={placeholder}
        className="
          w-full px-4 py-3 pr-12 text-base border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          touch-manipulation
        "
      />
      <button
        onClick={onSubmit}
        disabled={loading}
        className="
          absolute right-2 top-1/2 transform -translate-y-1/2
          p-2 text-gray-400 hover:text-gray-600
          disabled:opacity-50
        "
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </button>
    </div>
  );
});

MobileSearch.displayName = 'MobileSearch';

// Enhanced Mobile-optimized network view with gesture support
export function MobileNetworkView({
  networkData,
  onNodeSelect,
  selectedNode,
  className = ''
}: {
  networkData: any;
  onNodeSelect: (node: any) => void;
  selectedNode?: any;
  className?: string;
}) {
  const [viewMode, setViewMode] = useState<'graph' | 'list' | 'cards'>('cards');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!networkData?.nodes) return [];

    let filtered = networkData.nodes;

    if (searchQuery) {
      filtered = filtered.filter((node: any) =>
        node.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.authors?.some((author: string) => author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [networkData?.nodes, searchQuery]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Mobile network controls */}
      <div className="flex-shrink-0 bg-white border-b">
        {/* Search bar */}
        <div className="p-4 border-b">
          <MobileSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={() => {}}
            placeholder="Search network..."
          />
        </div>

        {/* View mode controls */}
        <div className="flex items-center justify-between p-4">
          <MobileTabs
            tabs={[
              { id: 'cards', label: 'Cards', icon: <Squares2X2Icon className="w-4 h-4" /> },
              { id: 'list', label: 'List', icon: <ListBulletIcon className="w-4 h-4" /> },
              { id: 'graph', label: 'Graph', icon: <ShareIcon className="w-4 h-4" /> }
            ]}
            activeTab={viewMode}
            onTabChange={(tab) => setViewMode(tab as any)}
          />
        </div>
      </div>

      {/* Network content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'cards' && (
          <div className="p-4 space-y-4 h-full overflow-y-auto">
            {filteredNodes.map((node: any) => (
              <div
                key={node.id}
                onClick={() => onNodeSelect(node)}
                className={`p-4 bg-white rounded-xl border-2 transition-all active:scale-95 ${
                  selectedNode?.id === node.id
                    ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <h3 className="font-semibold text-gray-900 text-base leading-tight mb-2">
                  {node.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{node.abstract}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{node.year}</span>
                  <span>{node.citations} citations</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="h-full overflow-y-auto">
            {filteredNodes.map((node: any) => (
              <div
                key={node.id}
                onClick={() => onNodeSelect(node)}
                className={`p-4 border-b border-gray-200 transition-colors ${
                  selectedNode?.id === node.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <h3 className="font-medium text-gray-900 truncate">{node.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{node.authors?.join(', ')}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{node.year}</span>
                  <span>{node.citations} citations</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'graph' && (
          <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <div
              className="absolute inset-0 transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
                transformOrigin: 'center center'
              }}
            >
              <svg className="w-full h-full">
                {filteredNodes.map((node: any, index: number) => {
                  const x = 150 + (index % 5) * 100;
                  const y = 150 + Math.floor(index / 5) * 100;
                  const isSelected = selectedNode?.id === node.id;

                  return (
                    <circle
                      key={node.id}
                      cx={x}
                      cy={y}
                      r={isSelected ? 12 : 8}
                      fill={isSelected ? '#3b82f6' : '#6b7280'}
                      onClick={() => onNodeSelect(node)}
                      className="cursor-pointer"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex-shrink-0 px-4 py-2 bg-gray-50 border-t text-center">
        <span className="text-sm text-gray-600">
          Showing {filteredNodes.length} of {networkData?.nodes?.length || 0} papers
        </span>
      </div>
    </div>
  );
}

// All components are already exported individually above
