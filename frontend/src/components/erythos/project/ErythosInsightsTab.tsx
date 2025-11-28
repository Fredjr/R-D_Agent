'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import InsightsTab from '@/components/project/InsightsTab';

interface ErythosInsightsTabProps {
  projectId: string;
}

/**
 * ErythosInsightsTab - Wrapper for the AI Insights feature in Erythos theme
 * 
 * Features:
 * - AI-powered analysis of research progress
 * - Cross-cutting connections between papers, questions, and hypotheses
 * - Gap analysis and recommendations
 * - Emerging trends detection
 */
export function ErythosInsightsTab({ projectId }: ErythosInsightsTabProps) {
  const { user } = useAuth();

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-400">Please sign in to view AI insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ✨ AI Insights
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            AI-powered analysis of your research project
          </p>
        </div>
      </div>

      {/* Insights Content */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <InsightsTab projectId={projectId} userId={user.email} />
      </div>
    </div>
  );
}

