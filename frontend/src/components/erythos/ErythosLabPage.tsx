'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ErythosTabs } from './ErythosTabs';
import { ErythosProtocolsTab, ErythosExperimentsTab, ErythosDataManagementTab } from './lab';

interface Project {
  project_id: string;
  project_name: string;
}

export function ErythosLabPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'protocols');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>(searchParams.get('project') || '');
  const [protocolCount, setProtocolCount] = useState(0);
  const [experimentCount, setExperimentCount] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchCounts();
  }, [user]);

  const fetchProjects = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch('/api/proxy/projects', {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchCounts = async () => {
    // In a real implementation, these would be actual API calls
    setProtocolCount(5);
    setExperimentCount(8);
  };

  const tabs = [
    { id: 'protocols', label: 'Protocols', badge: protocolCount > 0 ? protocolCount.toString() : undefined },
    { id: 'experiments', label: 'Experiments', badge: experimentCount > 0 ? experimentCount.toString() : undefined },
    { id: 'data', label: 'Data Management' },
  ];

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🧪 Lab</h1>
          <p className="text-gray-400">Execute protocols and track your experiments</p>
        </div>

        {/* Project Filter */}
        <div className="mb-6">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <ErythosTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="pills"
        />

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'protocols' && (
            <ErythosProtocolsTab projectFilter={projectFilter} />
          )}
          {activeTab === 'experiments' && (
            <ErythosExperimentsTab projectFilter={projectFilter} />
          )}
          {activeTab === 'data' && (
            <ErythosDataManagementTab />
          )}
        </div>
      </div>
    </div>
  );
}

