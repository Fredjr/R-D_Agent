'use client';

/**
 * Project Selector Component
 * Dropdown for selecting the current project context in global pages.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, FolderIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProjectSelectorProps {
  currentProject: Project | null;
  projects: Project[];
  onSelect: (projectId: string) => void;
  className?: string;
  label?: string;
}

export function ProjectSelector({
  currentProject,
  projects,
  onSelect,
  className = '',
  label = 'Project Context',
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white hover:bg-gray-700/50 transition-colors w-full"
      >
        <FolderIcon className="w-4 h-4 text-orange-400" />
        <span className="flex-1 text-left truncate">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                onSelect(project.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-700/50 transition-colors ${
                currentProject?.id === project.id ? 'bg-orange-500/10 text-orange-400' : 'text-white'
              }`}
            >
              <FolderIcon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{project.name}</span>
              {currentProject?.id === project.id && (
                <CheckIcon className="w-4 h-4 text-orange-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for use in headers/toolbars
 */
export function ProjectSelectorCompact({
  currentProject,
  projects,
  onSelect,
  className = '',
}: Omit<ProjectSelectorProps, 'label'>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (projects.length === 0) return null;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/30 rounded text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
      >
        <FolderIcon className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{currentProject?.name || 'No Project'}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[180px] max-h-48 overflow-y-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => {
                onSelect(project.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-700/50 ${
                currentProject?.id === project.id ? 'bg-orange-500/10 text-orange-400' : 'text-gray-300'
              }`}
            >
              <span className="flex-1 truncate">{project.name}</span>
              {currentProject?.id === project.id && <CheckIcon className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

