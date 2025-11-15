'use client';

import { 
  ChartBarIcon, 
  LinkIcon, 
  PencilIcon, 
  ShareIcon, 
  BookmarkIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface TopActionBarProps {
  onAnnotateToggle: () => void;
  isAnnotateActive: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * TopActionBar - Cochrane Library-style top toolbar
 * 
 * Actions: Figures | Metrics | Related | Annotate | Share | Add to Library | Close
 */
export default function TopActionBar({
  onAnnotateToggle,
  isAnnotateActive,
  onClose,
  title,
}: TopActionBarProps) {
  const actions = [
    {
      id: 'figures',
      label: 'Figures',
      icon: PhotoIcon,
      onClick: () => console.log('Figures clicked'),
      disabled: true,
    },
    {
      id: 'metrics',
      label: 'Metrics',
      icon: ChartBarIcon,
      onClick: () => console.log('Metrics clicked'),
      disabled: true,
    },
    {
      id: 'related',
      label: 'Related',
      icon: LinkIcon,
      onClick: () => console.log('Related clicked'),
      disabled: true,
    },
    {
      id: 'annotate',
      label: 'Annotate',
      icon: PencilIcon,
      onClick: onAnnotateToggle,
      active: isAnnotateActive,
      disabled: false,
    },
    {
      id: 'share',
      label: 'Share',
      icon: ShareIcon,
      onClick: () => console.log('Share clicked'),
      disabled: true,
    },
    {
      id: 'library',
      label: 'Add to Library',
      icon: BookmarkIcon,
      onClick: () => console.log('Add to Library clicked'),
      disabled: true,
    },
  ];

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Title */}
        <div className="flex-1 min-w-0 mr-4">
          <h1 className="text-sm font-medium truncate">
            {title || 'PDF Viewer'}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${action.active 
                    ? 'bg-white text-purple-600 shadow-md' 
                    : action.disabled
                    ? 'text-purple-200 cursor-not-allowed opacity-50'
                    : 'text-white hover:bg-white/20'
                  }
                `}
                title={action.label}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-6 bg-white/30 mx-2" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            title="Close PDF Viewer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

