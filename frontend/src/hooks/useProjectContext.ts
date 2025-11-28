'use client';

/**
 * Project Context Hook
 * Provides project context to global pages that need to know about the current project.
 * Uses URL parameters and localStorage to persist project selection.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description?: string;
}

interface ProjectContextState {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'erythos_current_project';

export function useProjectContext(userId: string | undefined) {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProjectContextState>({
    currentProject: null,
    projects: [],
    isLoading: true,
    error: null,
  });

  // Fetch all projects for the user
  const fetchProjects = useCallback(async () => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(`/api/proxy/projects?user_id=${userId}`, {
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      const projects: Project[] = (data || []).map((p: any) => ({
        id: p.project_id || p.id,
        name: p.project_name || p.name,
        description: p.description,
      }));

      // Determine current project from URL, localStorage, or first project
      const urlProjectId = searchParams.get('projectId');
      const storedProjectId = typeof window !== 'undefined' 
        ? localStorage.getItem(STORAGE_KEY) 
        : null;
      
      let currentProject: Project | null = null;
      
      if (urlProjectId) {
        currentProject = projects.find(p => p.id === urlProjectId) || null;
      } else if (storedProjectId) {
        currentProject = projects.find(p => p.id === storedProjectId) || null;
      }
      
      // Fall back to first project if none selected
      if (!currentProject && projects.length > 0) {
        currentProject = projects[0];
      }

      setState({
        currentProject,
        projects,
        isLoading: false,
        error: null,
      });

      // Persist selection
      if (currentProject && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, currentProject.id);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, [userId, searchParams]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
    if (project && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, project.id);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Select project by ID
  const selectProject = useCallback((projectId: string) => {
    const project = state.projects.find(p => p.id === projectId);
    if (project) {
      setCurrentProject(project);
    }
  }, [state.projects, setCurrentProject]);

  return {
    ...state,
    setCurrentProject,
    selectProject,
    refreshProjects: fetchProjects,
  };
}

/**
 * Project Selector Component Props
 */
export interface ProjectSelectorProps {
  currentProject: Project | null;
  projects: Project[];
  onSelect: (projectId: string) => void;
  className?: string;
}

