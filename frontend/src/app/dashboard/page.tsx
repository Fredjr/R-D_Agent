'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, FolderIcon, UsersIcon, CalendarIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectListResponse {
  projects: Project[];
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  // Auto-dismiss errors after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchProjects = async () => {
    try {
      setError(null); // Clear any existing errors
      const response = await fetch('/api/proxy/projects');
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Failed to fetch projects (${response.status}): ${errorText}`);
      }
      const data: ProjectListResponse = await response.json();
      setProjects(data.projects);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    setError(null); // Clear any existing errors
    
    try {
      const response = await fetch('/api/proxy/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: newProjectName.trim(),
          description: newProjectDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Project creation failed:', response.status, errorText);
        throw new Error(`Failed to create project (${response.status}): ${errorText || 'Unknown server error'}`);
      }

      const newProject = await response.json();
      setProjects(prev => [newProject, ...prev]);
      setShowCreateModal(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Auto-dismiss any success state after a brief moment
      setTimeout(() => setError(null), 100);
    } catch (err) {
      console.error('Project creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project due to an unknown error');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm"
                >
                  ← Back to Research Hub
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Research Projects</h1>
              <p className="mt-2 text-gray-600">
                Manage your research projects and collaborate with your team
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <BeakerIcon className="h-5 w-5 mr-2" />
                Research Hub
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error:</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <div className="mt-2 text-xs text-red-600">
                  Backend URL: {process.env.NEXT_PUBLIC_BACKEND_URL || 'Not configured'}
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={fetchProjects}
                className="text-xs px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first research project to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.project_id}
                href={`/project/${project.project_id}`}
                className="block"
              >
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <FolderIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(project.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.project_name}
                  </h3>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      Owner: {project.owner_user_id}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Project</h2>
            
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter project name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your research project"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectName('');
                    setNewProjectDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
