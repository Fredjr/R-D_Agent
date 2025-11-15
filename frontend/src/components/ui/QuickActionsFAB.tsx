'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  FolderPlusIcon,
  MagnifyingGlassIcon,
  BookmarkIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  gradient: string;
  onClick: () => void;
}

interface QuickActionsFABProps {
  onCreateProject?: () => void;
  onCreateCollection?: () => void;
  className?: string;
}

export const QuickActionsFAB: React.FC<QuickActionsFABProps> = ({
  onCreateProject,
  onCreateCollection,
  className = ''
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'New Project',
      icon: FolderPlusIcon,
      gradient: 'from-blue-500 to-cyan-600',
      onClick: () => {
        setIsOpen(false);
        if (onCreateProject) {
          onCreateProject();
        } else {
          router.push('/dashboard?action=create');
        }
      }
    },
    {
      id: 'new-collection',
      label: 'New Collection',
      icon: BookmarkIcon,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => {
        setIsOpen(false);
        if (onCreateCollection) {
          onCreateCollection();
        } else {
          router.push('/collections?action=create');
        }
      }
    },
    {
      id: 'search-papers',
      label: 'Search Papers',
      icon: MagnifyingGlassIcon,
      gradient: 'from-purple-500 to-indigo-600',
      onClick: () => {
        setIsOpen(false);
        router.push('/search');
      }
    },
    {
      id: 'add-note',
      label: 'Add Note',
      icon: DocumentTextIcon,
      gradient: 'from-orange-500 to-red-600',
      onClick: () => {
        setIsOpen(false);
        // TODO: Implement note creation
        alert('Note creation coming soon!');
      }
    }
  ];

  return (
    <div className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 ${className}`}>
      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2 animate-fade-in">
          {quickActions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center gap-3 bg-[var(--spotify-dark-gray)] hover:bg-[var(--spotify-gray)] text-white px-4 py-3 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 group w-full"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${action.gradient} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-br from-[var(--spotify-green)] to-green-600 hover:from-green-500 hover:to-green-700 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Quick actions"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <PlusIcon className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default QuickActionsFAB;

