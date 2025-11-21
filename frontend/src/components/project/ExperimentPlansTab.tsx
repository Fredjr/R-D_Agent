/**
 * Experiment Plans Tab
 * 
 * Displays all experiment plans for a project.
 * Shows plan cards with status, timeline, and quick actions.
 * 
 * Week 19-20: Experiment Planning Feature
 */

import React, { useState, useEffect } from 'react';
import { Beaker, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Loader2, Calendar, Target } from 'lucide-react';
import { getProjectExperimentPlans, ExperimentPlan } from '../../lib/api';
import ExperimentPlanDetailModal from './ExperimentPlanDetailModal';

interface ExperimentPlansTabProps {
  projectId: string;
  userId: string;
}

export default function ExperimentPlansTab({ projectId, userId }: ExperimentPlansTabProps) {
  const [plans, setPlans] = useState<ExperimentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ExperimentPlan | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchPlans();
  }, [projectId]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPlans = await getProjectExperimentPlans(projectId, userId);
      setPlans(fetchedPlans);
    } catch (err: any) {
      console.error('Error fetching experiment plans:', err);
      setError(err.message || 'Failed to load experiment plans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400';
      case 'approved': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'in_progress': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return null;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'difficult': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredPlans = filterStatus === 'all' 
    ? plans 
    : plans.filter(p => p.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-red-400 font-medium">Failed to load experiment plans</div>
          <div className="text-red-300 text-sm mt-1">{error}</div>
          <button
            onClick={fetchPlans}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Beaker className="w-7 h-7 text-purple-400" />
            Experiment Plans
          </h2>
          <p className="text-gray-400 mt-1">
            AI-generated experiment plans from protocols
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {plans.length} {plans.length === 1 ? 'plan' : 'plans'}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'draft', 'approved', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {status !== 'all' && (
              <span className="ml-2 text-xs opacity-75">
                ({plans.filter(p => p.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Beaker className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No experiment plans yet</p>
          <p className="text-sm mt-2">
            {filterStatus === 'all'
              ? 'Generate plans from protocols in the Protocols tab'
              : `No plans with status "${filterStatus}"`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => (
            <div
              key={plan.plan_id}
              className="bg-gray-800/50 rounded-lg p-5 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
              onClick={() => setSelectedPlan(plan)}
            >
              {/* Plan Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{plan.plan_name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{plan.objective}</p>
                </div>
              </div>

              {/* Status and Difficulty */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(plan.status)}`}>
                  {getStatusIcon(plan.status)}
                  {plan.status.replace('_', ' ')}
                </span>
                <span className={`text-xs font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                  {plan.difficulty_level}
                </span>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {plan.timeline_estimate && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{plan.timeline_estimate}</span>
                  </div>
                )}
                {plan.estimated_cost && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{plan.estimated_cost}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan(plan);
                  }}
                  className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Detail Modal */}
      {selectedPlan && (
        <ExperimentPlanDetailModal
          plan={selectedPlan}
          userId={userId}
          onClose={() => setSelectedPlan(null)}
          onUpdate={(updatedPlan) => {
            setPlans(plans.map(p => p.plan_id === updatedPlan.plan_id ? updatedPlan : p));
            setSelectedPlan(updatedPlan);
          }}
          onDelete={(planId) => {
            setPlans(plans.filter(p => p.plan_id !== planId));
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}

