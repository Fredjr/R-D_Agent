'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionsTreeSection } from '@/components/project/questions/QuestionsTreeSection';

interface ErythosQuestionsTabProps {
  projectId: string;
}

/**
 * ErythosQuestionsTab - Questions & Hypotheses Tab
 *
 * This component uses the rich QuestionsTreeSection which provides:
 * - Hierarchical research questions with full CRUD
 * - Hypotheses linked to questions
 * - Evidence linking for both questions and hypotheses
 * - Full modal support for adding/editing
 */
export function ErythosQuestionsTab({ projectId }: ErythosQuestionsTabProps) {
  const { user } = useAuth();

  if (!user?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Please log in to view research questions.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Use the rich QuestionsTreeSection component */}
      <QuestionsTreeSection
        projectId={projectId}
        userId={user.email}
      />
    </div>
  );
}

