'use client';

import React from 'react';
import { ErythosProgressBar } from '../ErythosProgressBar';

interface OverviewStats {
  questionsCount: number;
  hypothesesCount: number;
  evidenceCount: number;
  papersAnnotated: number;
  aiAnalyses: number;
  timeSavedHours: number;
}

interface Milestone {
  id: string;
  icon: string;
  title: string;
  date: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface ErythosOverviewTabProps {
  projectId: string;
  stats: OverviewStats;
  milestones?: Milestone[];
  activities?: Activity[];
}

export function ErythosOverviewTab({ projectId, stats, milestones = [], activities = [] }: ErythosOverviewTabProps) {
  // Calculate progress percentages
  const questionProgress = stats.hypothesesCount > 0 ? Math.min((stats.evidenceCount / (stats.hypothesesCount * 3)) * 100, 100) : 0;
  const paperProgress = Math.min(stats.papersAnnotated / 50 * 100, 100);
  const analysisProgress = Math.min(stats.aiAnalyses / 10 * 100, 100);

  // Default milestones if none provided
  const defaultMilestones: Milestone[] = [
    { id: '1', icon: '🎯', title: 'Project Created', date: 'Today' },
    { id: '2', icon: '📄', title: 'First Paper Added', date: 'Pending' },
    { id: '3', icon: '💡', title: 'First Hypothesis', date: 'Pending' },
  ];

  const displayMilestones = milestones.length > 0 ? milestones : defaultMilestones;

  // Default activities if none provided
  const defaultActivities: Activity[] = [
    { id: '1', user: 'You', action: 'created', target: 'this project', time: 'just now' },
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Research Progress */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Research Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Questions Answered</span>
              <span className="text-white">{Math.round(questionProgress)}%</span>
            </div>
            <ErythosProgressBar value={questionProgress} variant="red" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Papers Reviewed</span>
              <span className="text-white">{Math.round(paperProgress)}%</span>
            </div>
            <ErythosProgressBar value={paperProgress} variant="orange" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">AI Analyses</span>
              <span className="text-white">{Math.round(analysisProgress)}%</span>
            </div>
            <ErythosProgressBar value={analysisProgress} variant="purple" />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">💡 Key Insights</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.papersAnnotated}</div>
            <div className="text-xs text-gray-400">Papers Annotated</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{stats.aiAnalyses}</div>
            <div className="text-xs text-gray-400">AI Analyses</div>
          </div>
          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.timeSavedHours}h</div>
            <div className="text-xs text-gray-400">Time Saved</div>
          </div>
        </div>
      </div>

      {/* Recent Milestones */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏆 Recent Milestones</h3>
        <div className="space-y-3">
          {displayMilestones.slice(0, 3).map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-xl">{milestone.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{milestone.title}</div>
                <div className="text-xs text-gray-500">{milestone.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Activity */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">👥 Team Activity</h3>
        <div className="space-y-3">
          {displayActivities.slice(0, 4).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                {activity.user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">
                  <span className="font-medium">{activity.user}</span> {activity.action} {activity.target}
                </div>
                <div className="text-xs text-gray-500">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

