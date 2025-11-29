'use client';

import React, { useState } from 'react';
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosButton } from './ErythosButton';

interface ErythosCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: { project_id: string; project_name: string }) => void;
}

export function ErythosCreateProjectModal({ isOpen, onClose, onProjectCreated }: ErythosCreateProjectModalProps) {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !user?.email) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': user.email,
        },
        body: JSON.stringify({
          project_name: projectName.trim(),
          description: description.trim() || null,
          owner_user_id: user.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create project');
      }

      const project = await response.json();
      onProjectCreated(project);
      
      // Reset form
      setProjectName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <FolderPlusIcon className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">New Project</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Cancer Immunotherapy Research"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white 
                placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              autoFocus
              disabled={isCreating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white 
                placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
              disabled={isCreating}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <ErythosButton
              type="submit"
              variant="primary"
              disabled={!projectName.trim() || isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </ErythosButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ErythosCreateProjectModal;

