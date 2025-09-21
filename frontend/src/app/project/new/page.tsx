'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ProjectFormData {
  name: string;
  description: string;
}

export default function NewProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: formData.name.trim(),
          description: formData.description.trim() || null,
          owner_user_id: user.user_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      const project = await response.json();
      
      // Redirect to the new project
      router.push(`/project/${project.project_id}`);
      
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--spotify-black)] flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--spotify-black)] text-white">
      {/* Header */}
      <div className="border-b border-[var(--spotify-gray)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-[var(--spotify-light-text)] hover:text-white"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Create New Project</h1>
              <p className="text-[var(--spotify-light-text)] text-sm">
                Start a new research project to organize your work
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter project name..."
              className="w-full px-4 py-3 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-gray)] rounded-lg text-white placeholder-[var(--spotify-light-text)] focus:outline-none focus:border-[var(--spotify-green)] focus:ring-1 focus:ring-[var(--spotify-green)]"
              disabled={loading}
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your research project (optional)..."
              rows={4}
              className="w-full px-4 py-3 bg-[var(--spotify-dark-gray)] border border-[var(--spotify-gray)] rounded-lg text-white placeholder-[var(--spotify-light-text)] focus:outline-none focus:border-[var(--spotify-green)] focus:ring-1 focus:ring-[var(--spotify-green)] resize-vertical"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-[var(--spotify-green)] hover:bg-[var(--spotify-green)]/90 text-black font-semibold px-8 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5" />
                  Create Project
                </>
              )}
            </Button>
            
            <Button
              type="button"
              onClick={() => router.back()}
              variant="outline"
              disabled={loading}
              className="border-[var(--spotify-gray)] text-[var(--spotify-light-text)] hover:text-white hover:border-white px-8 py-3 rounded-full"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Tips */}
        <div className="mt-12 p-6 bg-[var(--spotify-dark-gray)] rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">💡 Project Tips</h3>
          <ul className="space-y-2 text-[var(--spotify-light-text)] text-sm">
            <li>• Choose a descriptive name that reflects your research focus</li>
            <li>• Add a detailed description to help collaborators understand the project</li>
            <li>• You can always edit the project details later</li>
            <li>• Projects help organize your collections, reports, and analyses</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
