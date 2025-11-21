/**
 * Experiment Plan Detail Modal
 * 
 * Displays full experiment plan details with materials, procedure, risks, etc.
 * Allows editing status, execution notes, and results.
 * 
 * Week 19-20: Experiment Planning Feature
 */

import React, { useState } from 'react';
import { 
  X, Edit2, Save, XCircle, Clock, DollarSign, AlertTriangle, 
  CheckCircle, Target, Beaker, Shield, Wrench, BookOpen, 
  ChevronDown, ChevronUp, Trash2, Calendar
} from 'lucide-react';
import { updateExperimentPlan, deleteExperimentPlan, ExperimentPlan, UpdateExperimentPlanRequest } from '../../lib/api';

interface ExperimentPlanDetailModalProps {
  plan: ExperimentPlan;
  userId: string;
  onClose: () => void;
  onUpdate: (plan: ExperimentPlan) => void;
  onDelete: (planId: string) => void;
}

export default function ExperimentPlanDetailModal({
  plan,
  userId,
  onClose,
  onUpdate,
  onDelete
}: ExperimentPlanDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedStatus, setEditedStatus] = useState(plan.status);
  const [editedNotes, setEditedNotes] = useState(plan.execution_notes || '');
  const [editedResults, setEditedResults] = useState(plan.results_summary || '');
  const [editedOutcome, setEditedOutcome] = useState(plan.outcome || '');
  const [editedLessons, setEditedLessons] = useState(plan.lessons_learned || '');
  const [showMaterials, setShowMaterials] = useState(true);
  const [showProcedure, setShowProcedure] = useState(true);
  const [showRisks, setShowRisks] = useState(true);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const update: UpdateExperimentPlanRequest = {
        status: editedStatus,
        execution_notes: editedNotes || undefined,
        results_summary: editedResults || undefined,
        outcome: editedOutcome as any || undefined,
        lessons_learned: editedLessons || undefined,
      };

      const updatedPlan = await updateExperimentPlan(plan.plan_id, userId, update);
      onUpdate(updatedPlan);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this experiment plan?')) {
      return;
    }

    try {
      await deleteExperimentPlan(plan.plan_id, userId);
      onDelete(plan.plan_id);
      onClose();
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
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

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'difficult': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{plan.plan_name}</h2>
            <p className="text-gray-400 mb-3">{plan.objective}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                {plan.status.replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getDifficultyColor(plan.difficulty_level)}`}>
                Difficulty: {plan.difficulty_level}
              </span>
              {plan.timeline_estimate && (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {plan.timeline_estimate}
                </span>
              )}
              {plan.estimated_cost && (
                <span className="text-sm text-gray-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {plan.estimated_cost}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Edit plan"
              >
                <Edit2 className="w-5 h-5 text-gray-400" />
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedStatus(plan.status);
                    setEditedNotes(plan.execution_notes || '');
                    setEditedResults(plan.results_summary || '');
                    setEditedOutcome(plan.outcome || '');
                    setEditedLessons(plan.lessons_learned || '');
                  }}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status and Execution (Editable) */}
          {isEditing && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" />
                Update Status & Results
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={editedStatus}
                  onChange={(e) => setEditedStatus(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Execution Notes</label>
                <textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Notes about the execution process..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              </div>

              {(editedStatus === 'completed' || editedStatus === 'cancelled') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Outcome</label>
                    <select
                      value={editedOutcome}
                      onChange={(e) => setEditedOutcome(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select outcome...</option>
                      <option value="success">Success</option>
                      <option value="partial_success">Partial Success</option>
                      <option value="failure">Failure</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Results Summary</label>
                    <textarea
                      value={editedResults}
                      onChange={(e) => setEditedResults(e.target.value)}
                      placeholder="Summary of results..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Lessons Learned</label>
                    <textarea
                      value={editedLessons}
                      onChange={(e) => setEditedLessons(e.target.value)}
                      placeholder="What did you learn from this experiment?"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Execution Info (View Mode) */}
          {!isEditing && (plan.execution_notes || plan.results_summary || plan.lessons_learned) && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Execution & Results
              </h3>
              
              {plan.execution_notes && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Execution Notes</div>
                  <div className="text-gray-300">{plan.execution_notes}</div>
                </div>
              )}

              {plan.outcome && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Outcome</div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    plan.outcome === 'success' ? 'bg-green-500/20 text-green-400' :
                    plan.outcome === 'partial_success' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {plan.outcome.replace('_', ' ')}
                  </span>
                </div>
              )}

              {plan.results_summary && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Results Summary</div>
                  <div className="text-gray-300">{plan.results_summary}</div>
                </div>
              )}

              {plan.lessons_learned && (
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Lessons Learned</div>
                  <div className="text-gray-300">{plan.lessons_learned}</div>
                </div>
              )}
            </div>
          )}

          {/* Materials */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <button
              onClick={() => setShowMaterials(!showMaterials)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Beaker className="w-5 h-5 text-purple-400" />
                Materials ({plan.materials.length})
              </h3>
              {showMaterials ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {showMaterials && (
              <div className="p-4 pt-0 space-y-3">
                {plan.materials.map((material, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded p-3 border border-gray-700">
                    <div className="font-medium text-white">{material.name}</div>
                    <div className="text-sm text-gray-400 mt-1">Amount: {material.amount}</div>
                    {material.source && <div className="text-sm text-gray-400">Source: {material.source}</div>}
                    {material.notes && (
                      <div className="text-sm text-yellow-400 mt-2 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {material.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Procedure */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <button
              onClick={() => setShowProcedure(!showProcedure)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                Procedure ({plan.procedure.length} steps)
              </h3>
              {showProcedure ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {showProcedure && (
              <div className="p-4 pt-0 space-y-3">
                {plan.procedure.map((step) => (
                  <div key={step.step_number} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-semibold">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-300">{step.description}</p>
                      {step.duration && (
                        <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {step.duration}
                        </div>
                      )}
                      {step.critical_notes && (
                        <div className="text-sm text-yellow-400 mt-2 flex items-start gap-2 bg-yellow-500/10 rounded p-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {step.critical_notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expected Outcomes & Success Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Expected Outcomes
              </h3>
              <ul className="space-y-2">
                {plan.expected_outcomes.map((outcome, idx) => (
                  <li key={idx} className="text-gray-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                Success Criteria
              </h3>
              <div className="space-y-3">
                {plan.success_criteria.map((criterion, idx) => (
                  <div key={idx} className="bg-gray-900/50 rounded p-2">
                    <div className="text-sm font-medium text-white">{criterion.criterion}</div>
                    <div className="text-xs text-gray-400 mt-1">Method: {criterion.measurement_method}</div>
                    {criterion.target_value && (
                      <div className="text-xs text-blue-400 mt-1">Target: {criterion.target_value}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700">
            <button
              onClick={() => setShowRisks(!showRisks)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Risk Assessment
              </h3>
              {showRisks ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {showRisks && (
              <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Potential Risks</div>
                  <ul className="space-y-2">
                    {plan.risk_assessment.risks.map((risk, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Mitigation Strategies</div>
                  <ul className="space-y-2">
                    {plan.risk_assessment.mitigation_strategies.map((strategy, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Guide */}
          {plan.troubleshooting_guide.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700">
              <button
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/70 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-400" />
                  Troubleshooting Guide ({plan.troubleshooting_guide.length})
                </h3>
                {showTroubleshooting ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>
              {showTroubleshooting && (
                <div className="p-4 pt-0 space-y-3">
                  {plan.troubleshooting_guide.map((item, idx) => (
                    <div key={idx} className="bg-gray-900/50 rounded p-3 border border-gray-700">
                      <div className="font-medium text-red-400 mb-2">Issue: {item.issue}</div>
                      <div className="text-sm text-gray-300 mb-2">
                        <span className="font-medium text-green-400">Solution:</span> {item.solution}
                      </div>
                      {item.prevention && (
                        <div className="text-sm text-gray-400">
                          <span className="font-medium text-blue-400">Prevention:</span> {item.prevention}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Safety & Expertise */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.safety_considerations.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Safety Considerations
                </h3>
                <ul className="space-y-2">
                  {plan.safety_considerations.map((safety, idx) => (
                    <li key={idx} className="text-gray-300 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{safety}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.required_expertise.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-400" />
                  Required Expertise
                </h3>
                <ul className="space-y-2">
                  {plan.required_expertise.map((expertise, idx) => (
                    <li key={idx} className="text-gray-300 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>{expertise}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          {plan.notes && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">Additional Notes</h3>
              <p className="text-gray-300">{plan.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
            {plan.generation_confidence && (
              <span className="text-purple-400">
                Confidence: {Math.round(plan.generation_confidence)}%
              </span>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Delete Plan
          </button>
        </div>
      </div>
    </div>
  );
}

