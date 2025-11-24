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

  const { longPressTriggered, ...longPressHandlers } = useLongPress(() => {
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
        {...longPressHandlers}
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

  const { longPressTriggered, ...longPressHandlers } = useLongPress(() => {
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
        {...longPressHandlers}
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
  linkedHypothesisIds?: string[];  // Week 24: Show linked hypotheses
  hypothesesMap?: Record<string, string>;  // Week 24: Map of hypothesis_id -> hypothesis_text
  linkedQuestionIds?: string[];  // Week 24: Show linked research questions
  questionsMap?: Record<string, string>;  // Week 24: Map of question_id -> question_text
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
  className,
  linkedHypothesisIds = [],
  hypothesesMap = {},
  linkedQuestionIds = [],
  questionsMap = {}
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

  const { longPressTriggered, ...longPressHandlers } = useLongPress(() => {
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
        {...longPressHandlers}
        className={className}
      >
        {/* Use the existing SpotifyCollectionCard component */}
        <div className="spotify-card-enhanced bg-white border border-gray-200 shadow-sm" onClick={onClick} style={{ backgroundColor: 'white', color: 'inherit' }}>
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
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#111827' }}>{title}</h3>
              <p className="text-sm" style={{ color: '#6B7280' }}>{articleCount} articles</p>
            </div>
          </div>
          {description && (
            <p className="text-sm mb-4" style={{ color: '#374151' }}>{description}</p>
          )}

          {/* Week 24: Show linked hypotheses and research questions */}
          {((linkedHypothesisIds && linkedHypothesisIds.length > 0) || (linkedQuestionIds && linkedQuestionIds.length > 0)) && (
            <div className="mt-3 mb-3 flex flex-wrap gap-2">
              {/* Research Questions */}
              {linkedQuestionIds && linkedQuestionIds.length > 0 && questionsMap && Object.keys(questionsMap).length > 0 && (
                <>
                  {linkedQuestionIds.slice(0, 1).map((qId) => {
                    const questionText = questionsMap[qId];
                    if (!questionText) {
                      return null;
                    }

                    const truncatedText = questionText.length > 40
                      ? questionText.slice(0, 40) + '...'
                      : questionText;

                    return (
                      <div
                        key={qId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        title={`Research Question: ${questionText}`}
                        style={{ border: '1px solid #3B82F6' }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                        </svg>
                        <span className="max-w-[200px] truncate">
                          {truncatedText}
                        </span>
                      </div>
                    );
                  })}
                  {linkedQuestionIds.length > 1 && (
                    <div className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                      +{linkedQuestionIds.length - 1} more question{linkedQuestionIds.length > 2 ? 's' : ''}
                    </div>
                  )}
                </>
              )}

              {/* Hypotheses */}
              {linkedHypothesisIds && linkedHypothesisIds.length > 0 && hypothesesMap && Object.keys(hypothesesMap).length > 0 && (
                <>
                  {linkedHypothesisIds.slice(0, 2).map((hypId) => {
                    const hypothesisText = hypothesesMap[hypId];
                    if (!hypothesisText) {
                      return null;
                    }

                    const truncatedText = hypothesisText.length > 40
                      ? hypothesisText.slice(0, 40) + '...'
                      : hypothesisText;

                    return (
                      <div
                        key={hypId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        title={`Hypothesis: ${hypothesisText}`}
                        style={{ border: '1px solid purple' }}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                        <span className="max-w-[200px] truncate">
                          {truncatedText}
                        </span>
                      </div>
                    );
                  })}
                  {linkedHypothesisIds.length > 2 && (
                    <div className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                      +{linkedHypothesisIds.length - 2} more hypothesis{linkedHypothesisIds.length > 3 ? 'es' : ''}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {lastUpdated && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Updated {lastUpdated}</p>
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

  const { longPressTriggered, ...longPressHandlers } = useLongPress(() => {
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
        {...longPressHandlers}
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
