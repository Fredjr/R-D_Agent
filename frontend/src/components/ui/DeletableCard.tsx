import React, { useState } from 'react';
import { 
  TrashIcon, 
  EyeIcon, 
  PencilIcon,
  DocumentDuplicateIcon 
} from '@heroicons/react/24/outline';
import { 
  ContextMenu, 
  DeleteConfirmationModal, 
  useContextMenu, 
  useLongPress 
} from './ContextMenu';
import { useDeletion, DeletableItemType, getItemTypeName, getDeletionMessage } from '@/hooks/useDeletion';
import { SpotifyProjectCard, SpotifyReportCard } from './Card';

interface DeletableProjectCardProps {
  title: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  lastUpdated?: string;
  reportCount?: number;
  onClick?: () => void;
  onDelete?: () => void;
  imageUrl?: string;
  projectId: string;
  className?: string;
}

export const DeletableProjectCard: React.FC<DeletableProjectCardProps> = ({
  title,
  description,
  status,
  lastUpdated,
  reportCount,
  onClick,
  onDelete,
  imageUrl,
  projectId,
  className
}) => {
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteProject, isDeleting } = useDeletion({
    onSuccess: () => {
      setShowDeleteModal(false);
      onDelete?.();
    },
    onError: (error) => {
      console.error('Failed to delete project:', error);
      // You could show a toast notification here
    }
  });

  const longPressProps = useLongPress(() => {
    setShowDeleteModal(true);
  }, 3000);

  const handleDelete = async () => {
    try {
      await deleteProject(projectId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const contextMenuItems = [
    {
      id: 'view',
      label: 'View Project',
      icon: EyeIcon,
      onClick: () => onClick?.()
    },
    {
      id: 'edit',
      label: 'Edit Project',
      icon: PencilIcon,
      onClick: () => {
        // TODO: Implement edit functionality
        console.log('Edit project:', projectId);
      }
    },
    {
      id: 'duplicate',
      label: 'Duplicate Project',
      icon: DocumentDuplicateIcon,
      onClick: () => {
        // TODO: Implement duplicate functionality
        console.log('Duplicate project:', projectId);
      }
    },
    {
      id: 'delete',
      label: 'Delete Project',
      icon: TrashIcon,
      onClick: () => setShowDeleteModal(true),
      variant: 'danger' as const
    }
  ];

  return (
    <>
      <div
        onContextMenu={openContextMenu}
        {...longPressProps}
        className={className}
      >
        <SpotifyProjectCard
          title={title}
          description={description}
          status={status}
          lastUpdated={lastUpdated}
          reportCount={reportCount}
          onClick={onClick}
          imageUrl={imageUrl}
          projectId={projectId}
        />
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${getItemTypeName('project')}`}
        message={getDeletionMessage('project')}
        itemName={title}
        isDeleting={isDeleting}
      />
    </>
  );
};

interface DeletableReportCardProps {
  title: string;
  objective?: string;
  status?: 'processing' | 'completed' | 'failed';
  createdAt?: string;
  onClick?: () => void;
  onDelete?: () => void;
  reportId: string;
  className?: string;
}

export const DeletableReportCard: React.FC<DeletableReportCardProps> = ({
  title,
  objective,
  status,
  createdAt,
  onClick,
  onDelete,
  reportId,
  className
}) => {
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteReport, isDeleting } = useDeletion({
    onSuccess: () => {
      setShowDeleteModal(false);
      onDelete?.();
    },
    onError: (error) => {
      console.error('Failed to delete report:', error);
    }
  });

  const longPressProps = useLongPress(() => {
    setShowDeleteModal(true);
  }, 3000);

  const handleDelete = async () => {
    try {
      await deleteReport(reportId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const contextMenuItems = [
    {
      id: 'view',
      label: 'View Report',
      icon: EyeIcon,
      onClick: () => onClick?.()
    },
    {
      id: 'duplicate',
      label: 'Duplicate Report',
      icon: DocumentDuplicateIcon,
      onClick: () => {
        // TODO: Implement duplicate functionality
        console.log('Duplicate report:', reportId);
      }
    },
    {
      id: 'delete',
      label: 'Delete Report',
      icon: TrashIcon,
      onClick: () => setShowDeleteModal(true),
      variant: 'danger' as const
    }
  ];

  return (
    <>
      <div
        onContextMenu={openContextMenu}
        {...longPressProps}
        className={className}
      >
        <SpotifyReportCard
          title={title}
          objective={objective}
          status={status}
          createdAt={createdAt}
          onClick={onClick}
          reportId={reportId}
        />
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${getItemTypeName('report')}`}
        message={getDeletionMessage('report')}
        itemName={title}
        isDeleting={isDeleting}
      />
    </>
  );
};

interface DeletableCollectionCardProps {
  title: string;
  description?: string;
  articleCount?: number;
  lastUpdated?: string;
  color?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onExplore?: () => void;
  onNetworkView?: () => void;
  collectionId: string;
  projectId: string;
  className?: string;
}

export const DeletableCollectionCard: React.FC<DeletableCollectionCardProps> = ({
  title,
  description,
  articleCount,
  lastUpdated,
  color,
  onClick,
  onDelete,
  onExplore,
  onNetworkView,
  collectionId,
  projectId,
  className
}) => {
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteCollection, isDeleting } = useDeletion({
    onSuccess: () => {
      setShowDeleteModal(false);
      onDelete?.();
    },
    onError: (error) => {
      console.error('Failed to delete collection:', error);
    }
  });

  const longPressProps = useLongPress(() => {
    setShowDeleteModal(true);
  }, 3000);

  const handleDelete = async () => {
    try {
      await deleteCollection(collectionId, projectId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const contextMenuItems = [
    {
      id: 'view',
      label: 'View Collection',
      icon: EyeIcon,
      onClick: () => onClick?.()
    },
    {
      id: 'explore',
      label: 'Explore Articles',
      icon: DocumentDuplicateIcon,
      onClick: () => onExplore?.()
    },
    {
      id: 'delete',
      label: 'Delete Collection',
      icon: TrashIcon,
      onClick: () => setShowDeleteModal(true),
      variant: 'danger' as const
    }
  ];

  return (
    <>
      <div
        onContextMenu={openContextMenu}
        {...longPressProps}
        className={className}
      >
        {/* Use the existing SpotifyCollectionCard component */}
        <div className="spotify-card-enhanced bg-white" onClick={onClick}>
          <div className="flex items-center mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
              style={{ backgroundColor: color || 'var(--spotify-green)' }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-600">{articleCount} articles</p>
            </div>
          </div>
          {description && (
            <p className="text-sm text-gray-700 mb-4">{description}</p>
          )}
          {lastUpdated && (
            <p className="text-xs text-gray-500">Updated {lastUpdated}</p>
          )}
        </div>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${getItemTypeName('collection')}`}
        message={getDeletionMessage('collection')}
        itemName={title}
        isDeleting={isDeleting}
      />
    </>
  );
};

interface DeletableDeepDiveCardProps {
  title: string;
  description?: string;
  status?: 'processing' | 'completed' | 'failed';
  createdAt?: string;
  onClick?: () => void;
  onDelete?: () => void;
  analysisId: string;
  projectId: string;
  className?: string;
}

export const DeletableDeepDiveCard: React.FC<DeletableDeepDiveCardProps> = ({
  title,
  description,
  status,
  createdAt,
  onClick,
  onDelete,
  analysisId,
  projectId,
  className
}) => {
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { deleteDeepDive, isDeleting } = useDeletion({
    onSuccess: () => {
      setShowDeleteModal(false);
      onDelete?.();
    },
    onError: (error) => {
      console.error('Failed to delete deep dive:', error);
    }
  });

  const longPressProps = useLongPress(() => {
    setShowDeleteModal(true);
  }, 3000);

  const handleDelete = async () => {
    try {
      await deleteDeepDive(analysisId, projectId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const contextMenuItems = [
    {
      id: 'view',
      label: 'View Analysis',
      icon: EyeIcon,
      onClick: () => onClick?.()
    },
    {
      id: 'duplicate',
      label: 'Duplicate Analysis',
      icon: DocumentDuplicateIcon,
      onClick: () => {
        // TODO: Implement duplicate functionality
        console.log('Duplicate deep dive:', analysisId);
      }
    },
    {
      id: 'delete',
      label: 'Delete Analysis',
      icon: TrashIcon,
      onClick: () => setShowDeleteModal(true),
      variant: 'danger' as const
    }
  ];

  const statusConfig = {
    processing: { color: 'bg-orange-500 text-white', icon: '🔄' },
    completed: { color: 'bg-green-500 text-white', icon: '✅' },
    failed: { color: 'bg-red-500 text-white', icon: '❌' }
  };

  const config = statusConfig[status || 'completed'];

  return (
    <>
      <div
        onContextMenu={openContextMenu}
        {...longPressProps}
        className={className}
      >
        <div
          className="bg-white rounded-lg shadow border hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-6"
          onClick={onClick}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
              {title}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.icon} {status || 'completed'}
            </span>
          </div>

          {description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {description}
            </p>
          )}

          {createdAt && (
            <p className="text-xs text-gray-500">
              Created {createdAt}
            </p>
          )}
        </div>
      </div>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={`Delete ${getItemTypeName('deep-dive')}`}
        message={getDeletionMessage('deep-dive')}
        itemName={title}
        isDeleting={isDeleting}
      />
    </>
  );
};
