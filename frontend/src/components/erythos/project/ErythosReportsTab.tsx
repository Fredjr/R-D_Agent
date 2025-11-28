'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Report {
  report_id: string;
  title: string;
  report_type: 'summary' | 'analysis' | 'deep_dive' | 'literature_review';
  created_at: string;
  status: 'draft' | 'complete';
}

interface ErythosReportsTabProps {
  projectId: string;
}

export function ErythosReportsTab({ projectId }: ErythosReportsTabProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [projectId]);

  const fetchReports = async () => {
    if (!user?.email) return;
    
    try {
      const response = await fetch(`/api/proxy/projects/${projectId}/reports`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || data || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'summary': return '📋';
      case 'analysis': return '📊';
      case 'deep_dive': return '🔬';
      case 'literature_review': return '📚';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">📊 Reports</h3>
          <p className="text-sm text-gray-400">AI-generated reports and analyses</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors">
            🔬 Deep Dive
          </button>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm transition-colors">
            ➕ Generate Report
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-gray-400 mb-4">No reports generated yet</p>
          <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
            Generate Your First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <div 
              key={report.report_id}
              className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 hover:border-orange-500/50 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                  <span className="text-xl">{getTypeIcon(report.report_type)}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">
                    {report.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>{report.report_type.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{formatDate(report.created_at)}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      report.status === 'complete' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h4 className="text-white font-medium mb-4">⚡ Quick Generate</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '📋', label: 'Summary', desc: 'Quick overview' },
            { icon: '📊', label: 'Analysis', desc: 'Deep analysis' },
            { icon: '🔬', label: 'Deep Dive', desc: 'Detailed exploration' },
            { icon: '📚', label: 'Lit Review', desc: 'Literature review' },
          ].map((action, index) => (
            <button 
              key={index}
              className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left transition-colors"
            >
              <span className="text-2xl mb-2 block">{action.icon}</span>
              <div className="text-white text-sm font-medium">{action.label}</div>
              <div className="text-gray-500 text-xs">{action.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

