'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon, EllipsisHorizontalIcon, HeartIcon, ShareIcon, PlusIcon } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';

interface SpotifyCardProps {
  title: string;
  description?: string;
  imageUrl?: string;
  href?: string;
  onClick?: () => void;
  onPlay?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onAddToCollection?: () => void;
  isLiked?: boolean;
  showPlayButton?: boolean;
  showContextMenu?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onAddToCollection?: () => void;
  isLiked?: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onPlay,
  onLike,
  onShare,
  onAddToCollection,
  isLiked
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`spotify-context-menu ${isOpen ? 'show' : ''}`}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {onPlay && (
        <div className="spotify-context-menu-item" onClick={onPlay}>
          <PlayIcon />
          Play
        </div>
      )}
      {onLike && (
        <div className="spotify-context-menu-item" onClick={onLike}>
          {isLiked ? <HeartIcon /> : <HeartOutlineIcon />}
          {isLiked ? 'Remove from Liked' : 'Add to Liked'}
        </div>
      )}
      {onAddToCollection && (
        <>
          <div className="spotify-context-menu-separator" />
          <div className="spotify-context-menu-item" onClick={onAddToCollection}>
            <PlusIcon />
            Add to Collection
          </div>
        </>
      )}
      {onShare && (
        <div className="spotify-context-menu-item" onClick={onShare}>
          <ShareIcon />
          Share
        </div>
      )}
    </div>
  );
};

export const SpotifyCard: React.FC<SpotifyCardProps> = ({
  title,
  description,
  imageUrl,
  href,
  onClick,
  onPlay,
  onLike,
  onShare,
  onAddToCollection,
  isLiked = false,
  showPlayButton = true,
  showContextMenu = true,
  className = '',
  children
}) => {
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({
    isOpen: false,
    position: { x: 0, y: 0 }
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!showContextMenu) return;
    
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }
    });
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay();
    }
  };

  return (
    <>
      <div
        className={`spotify-card-enhanced ${className}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {imageUrl && (
          <div className="relative mb-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-full aspect-square object-cover rounded-md"
            />
          </div>
        )}
        
        <div className="relative">
          <h3 className="text-white font-semibold text-base mb-2 line-clamp-2">
            {title}
          </h3>
          
          {description && (
            <p className="text-[var(--spotify-light-text)] text-sm line-clamp-2 mb-4">
              {description}
            </p>
          )}
          
          {children}
        </div>

        {showPlayButton && onPlay && (
          <div className="spotify-play-overlay" onClick={handlePlayClick}>
            <PlayIcon />
          </div>
        )}
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
        onPlay={onPlay}
        onLike={onLike}
        onShare={onShare}
        onAddToCollection={onAddToCollection}
        isLiked={isLiked}
      />
    </>
  );
};

// Enhanced Collection Card specifically for collections
export const SpotifyCollectionCard: React.FC<{
  title: string;
  description?: string;
  articleCount?: number;
  lastUpdated?: string;
  color?: string;
  onClick?: () => void;
  onExplore?: () => void;
  onNetworkView?: () => void;
}> = ({
  title,
  description,
  articleCount = 0,
  lastUpdated,
  color = 'var(--spotify-green)',
  onClick,
  onExplore,
  onNetworkView
}) => {
  return (
    <div className="spotify-card-enhanced bg-white" onClick={onClick}>
      <div className="flex items-center mb-4">
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
          style={{ backgroundColor: color }}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[#1a1a1a] font-semibold text-base mb-1">
            {title}
          </h3>
          <p className="text-[#4a4a4a] text-sm">
            {articleCount} articles
          </p>
        </div>
      </div>
      
      {description && (
        <p className="text-[#4a4a4a] text-sm mb-4 line-clamp-2">
          {description}
        </p>
      )}
      
      {lastUpdated && (
        <p className="text-[#6a6a6a] text-xs mb-4">
          Updated {lastUpdated}
        </p>
      )}
      
      <div className="flex gap-2">
        {onExplore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExplore();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Explore Articles
          </button>
        )}
        {onNetworkView && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNetworkView();
            }}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Network View
          </button>
        )}
      </div>
    </div>
  );
};

export default SpotifyCard;
