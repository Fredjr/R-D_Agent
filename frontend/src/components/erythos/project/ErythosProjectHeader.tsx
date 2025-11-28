'use client';

import React from 'react';

interface ProjectStats {
  paper_count: number;
  collection_count: number;
  note_count: number;
  report_count: number;
  experiment_count: number;
}

interface Project {
  project_id: string;
  project_name: string;
  description?: string;
  created_at: string;
  collaborators?: Array<{ user_id: string; role: string }>;
  settings?: { research_question?: string };
}

interface ErythosProjectHeaderProps {
  project: Project;
  stats: ProjectStats;
}

export function ErythosProjectHeader({ project, stats }: ErythosProjectHeaderProps) {
  // Calculate days active
  const daysActive = Math.ceil(
    (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-[#1a1a1a] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Title & Status */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{project.project_name}</h1>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full flex items-center gap-1">
                ✅ Active
              </span>
            </div>
            {project.description && (
              <p className="text-gray-400 text-base max-w-3xl line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{daysActive} days active</span>
          <span>•</span>
          <span>{project.collaborators?.length || 1} collaborator(s)</span>
        </div>

        {/* Stats Grid - Always Visible */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard icon="📄" label="Papers" value={stats.paper_count} color="blue" />
          <StatCard icon="📁" label="Collections" value={stats.collection_count} color="orange" />
          <StatCard icon="📝" label="Notes" value={stats.note_count} color="green" />
          <StatCard icon="📊" label="Reports" value={stats.report_count} color="purple" />
          <StatCard icon="🧪" label="Experiments" value={stats.experiment_count} color="red" />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-4 text-center`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

