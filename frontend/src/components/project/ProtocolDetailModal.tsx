/**
 * Protocol Detail Modal
 * 
 * Displays extracted protocol with materials, steps, and equipment.
 * Allows editing and exporting protocols.
 * 
 * Week 18: Protocols UI
 */

import React, { useState } from 'react';
import { X, Copy, Download, Edit2, Save, XCircle, Clock, AlertTriangle, Shield, ChevronDown, ChevronUp, FileText, Beaker } from 'lucide-react';
import ExperimentPlanningModal from './ExperimentPlanningModal';
import { ExperimentPlan } from '../../lib/api';

interface Material {
  name: string;
  catalog_number?: string;
  supplier?: string;
  amount?: string;
  notes?: string;
  source_text?: string;
}

interface ProtocolStep {
  step_number: number;
  instruction: string;
  duration?: string;
  temperature?: string;
  notes?: string;
  source_text?: string;
}

interface TableData {
  table_number: number;
  page: number;
  headers: string[];
  rows: string[][];
  row_count: number;
  col_count: number;
}

interface FigureData {
  figure_number: number;
  page: number;
  width: number;
  height: number;
  size_bytes: number;
  image_data: string;
}

interface Protocol {
  protocol_id: string;
  source_pmid: string;
  protocol_name: string;
  protocol_type: string;
  materials: Material[];
  steps: ProtocolStep[];
  equipment: string[];
  duration_estimate?: string;
  difficulty_level: string;
  extracted_by: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  article_title?: string;
  article_authors?: string;
  article_journal?: string;
  article_year?: number;
  extraction_confidence?: number;
  confidence_explanation?: {
    overall_score: number;
    confidence_level: string;
    criteria: any;
    explanation: string;
  };
  material_sources?: Record<string, any>;
  step_sources?: Record<string, any>;
  // Week 22: Rich content
  tables_data?: TableData[];
  figures_data?: FigureData[];
  figures_analysis?: string;
}

interface ProtocolDetailModalProps {
  protocol: Protocol;
  projectId: string;
  userId: string;
  onClose: () => void;
  onUpdate?: (protocol: Protocol) => void;
  onDelete?: (protocolId: string) => void;
  onPlanCreated?: (plan: ExperimentPlan) => void;
}

export default function ProtocolDetailModal({
  protocol,
  projectId,
  userId,
  onClose,
  onUpdate,
  onDelete,
  onPlanCreated
}: ProtocolDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProtocol, setEditedProtocol] = useState<Protocol>(protocol);
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedProtocol);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProtocol(protocol);
    setIsEditing(false);
  };

  const handleCopyToClipboard = () => {
    const text = formatProtocolAsText(protocol);
    navigator.clipboard.writeText(text);
    alert('Protocol copied to clipboard!');
  };

  const handleDownloadJSON = () => {
    const dataStr = JSON.stringify(protocol, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `protocol_${protocol.source_pmid}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatProtocolAsText = (p: Protocol): string => {
    let text = `${p.protocol_name}\n`;
    text += `${'='.repeat(p.protocol_name.length)}\n\n`;
    
    if (p.article_title) {
      text += `Source: ${p.article_title}\n`;
      text += `Authors: ${p.article_authors || 'N/A'}\n`;
      text += `Journal: ${p.article_journal || 'N/A'} (${p.article_year || 'N/A'})\n`;
      text += `PMID: ${p.source_pmid}\n\n`;
    }
    
    text += `Type: ${p.protocol_type}\n`;
    text += `Difficulty: ${p.difficulty_level}\n`;
    text += `Duration: ${p.duration_estimate || 'Not specified'}\n\n`;
    
    if (p.materials.length > 0) {
      text += `MATERIALS\n${'='.repeat(50)}\n`;
      p.materials.forEach((m, i) => {
        text += `${i + 1}. ${m.name}\n`;
        if (m.catalog_number) text += `   Cat#: ${m.catalog_number}\n`;
        if (m.supplier) text += `   Supplier: ${m.supplier}\n`;
        if (m.amount) text += `   Amount: ${m.amount}\n`;
        if (m.notes) text += `   Notes: ${m.notes}\n`;
        text += '\n';
      });
    }
    
    if (p.equipment.length > 0) {
      text += `EQUIPMENT\n${'='.repeat(50)}\n`;
      p.equipment.forEach((e, i) => {
        text += `${i + 1}. ${e}\n`;
      });
      text += '\n';
    }
    
    if (p.steps.length > 0) {
      text += `PROCEDURE\n${'='.repeat(50)}\n`;
      p.steps.forEach((s) => {
        text += `Step ${s.step_number}: ${s.instruction}\n`;
        if (s.duration) text += `   Duration: ${s.duration}\n`;
        if (s.temperature) text += `   Temperature: ${s.temperature}\n`;
        if (s.notes) text += `   ⚠️  ${s.notes}\n`;
        text += '\n';
      });
    }
    
    return text;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {protocol.protocol_name}
            </h2>
            {protocol.article_title && (
              <div className="text-sm text-gray-400 space-y-1">
                <p className="font-medium">{protocol.article_title}</p>
                <p>{protocol.article_authors}</p>
                <p>{protocol.article_journal} ({protocol.article_year}) • PMID: {protocol.source_pmid}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {!isEditing && (
              <>
                <button
                  onClick={() => setShowPlanningModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  title="Generate experiment plan from this protocol"
                >
                  <Beaker className="w-4 h-4" />
                  Plan Experiment
                </button>
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={handleDownloadJSON}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Download JSON"
                >
                  <Download className="w-5 h-5 text-gray-400" />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Edit protocol"
                >
                  <Edit2 className="w-5 h-5 text-gray-400" />
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
              {protocol.protocol_type}
            </span>
            <span className={`flex items-center gap-1 ${getDifficultyColor(protocol.difficulty_level)}`}>
              <AlertTriangle className="w-4 h-4" />
              {protocol.difficulty_level}
            </span>
            {protocol.duration_estimate && (
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-4 h-4" />
                {protocol.duration_estimate}
              </span>
            )}
            {protocol.extraction_confidence !== undefined && protocol.extraction_confidence !== null && (
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                protocol.extraction_confidence >= 80 ? 'bg-green-500/20 text-green-400' :
                protocol.extraction_confidence >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                <Shield className="w-4 h-4" />
                Confidence: {protocol.extraction_confidence}/100
              </span>
            )}
          </div>

          {/* Confidence Explanation */}
          {protocol.confidence_explanation && (
            <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
              <button
                onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Extraction Confidence: {protocol.confidence_explanation.confidence_level}
                  </h3>
                </div>
                {showConfidenceDetails ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {showConfidenceDetails && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-gray-300">{protocol.confidence_explanation.explanation}</p>

                  {protocol.confidence_explanation.criteria && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {protocol.confidence_explanation.criteria.materials_with_amounts !== undefined && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-500">Materials with amounts</div>
                          <div className="text-white font-semibold">
                            {protocol.confidence_explanation.criteria.materials_with_amounts}/{protocol.confidence_explanation.criteria.total_materials || 0}
                          </div>
                        </div>
                      )}
                      {protocol.confidence_explanation.criteria.steps_with_timing !== undefined && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-500">Steps with timing</div>
                          <div className="text-white font-semibold">
                            {protocol.confidence_explanation.criteria.steps_with_timing}/{protocol.confidence_explanation.criteria.total_steps || 0}
                          </div>
                        </div>
                      )}
                      {protocol.confidence_explanation.criteria.specificity_score !== undefined && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-500">Specificity Score</div>
                          <div className="text-white font-semibold">{protocol.confidence_explanation.criteria.specificity_score}/40</div>
                        </div>
                      )}
                      {protocol.confidence_explanation.criteria.evidence_score !== undefined && (
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-gray-500">Evidence Score</div>
                          <div className="text-white font-semibold">{protocol.confidence_explanation.criteria.evidence_score}/40</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Materials */}
          {protocol.materials.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Materials</h3>
              <div className="space-y-3">
                {protocol.materials.map((material, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-lg p-4 relative group">
                    <div className="font-medium text-white mb-2 flex items-center gap-2">
                      {material.name}
                      {material.source_text && (
                        <span className="text-xs text-blue-400 flex items-center gap-1" title="Source citation available">
                          <FileText className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                      {material.catalog_number && (
                        <div>
                          <span className="text-gray-500">Cat#:</span> {material.catalog_number}
                        </div>
                      )}
                      {material.supplier && (
                        <div>
                          <span className="text-gray-500">Supplier:</span> {material.supplier}
                        </div>
                      )}
                      {material.amount && (
                        <div>
                          <span className="text-gray-500">Amount:</span> {material.amount}
                        </div>
                      )}
                    </div>
                    {material.source_text && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                        <div className="flex items-start gap-1">
                          <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">Source: </span>
                            <span className="italic">"{material.source_text}"</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {material.notes && (
                      <div className="mt-2 text-sm text-yellow-400 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {material.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {protocol.equipment.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Equipment</h3>
              <ul className="space-y-2">
                {protocol.equipment.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-300">
                    <span className="text-gray-500 mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tables (Week 22) */}
          {protocol.tables_data && protocol.tables_data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📊 Tables from Paper</h3>
              <div className="space-y-6">
                {protocol.tables_data.map((table) => (
                  <div key={table.table_number} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-400">
                        Table {table.table_number} (Page {table.page})
                      </p>
                      <p className="text-xs text-gray-500">
                        {table.row_count} rows × {table.col_count} columns
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-700 text-sm">
                        {table.headers && table.headers.length > 0 && (
                          <thead className="bg-gray-800">
                            <tr>
                              {table.headers.map((header, i) => (
                                <th key={i} className="border border-gray-700 px-3 py-2 text-left text-gray-300 font-semibold">
                                  {header || '—'}
                                </th>
                              ))}
                            </tr>
                          </thead>
                        )}
                        <tbody>
                          {table.rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'}>
                              {row.map((cell, j) => (
                                <td key={j} className="border border-gray-700 px-3 py-2 text-gray-300">
                                  {cell || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Figures (Week 22) */}
          {protocol.figures_data && protocol.figures_data.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">🖼️ Figures from Paper</h3>
              <div className="space-y-6">
                {protocol.figures_data.map((figure) => (
                  <div key={figure.figure_number} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-400">
                        Figure {figure.figure_number} (Page {figure.page})
                      </p>
                      <p className="text-xs text-gray-500">
                        {figure.width}×{figure.height}px
                      </p>
                    </div>
                    <div className="mb-3 rounded border border-gray-700 overflow-hidden bg-white">
                      <img
                        src={`data:image/jpeg;base64,${figure.image_data}`}
                        alt={`Figure ${figure.figure_number}`}
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Figures Analysis */}
              {protocol.figures_analysis && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <Beaker className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-blue-400">AI Analysis of Figures</h4>
                  </div>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{protocol.figures_analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Procedure */}
          {protocol.steps.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Procedure</h3>
              <div className="space-y-4">
                {protocol.steps.map((step) => (
                  <div key={step.step_number} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-semibold">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <p className="text-gray-300 flex-1">{step.instruction}</p>
                        {step.source_text && (
                          <span className="text-xs text-blue-400 flex items-center gap-1 flex-shrink-0" title="Source citation available">
                            <FileText className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                        {step.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {step.duration}
                          </span>
                        )}
                        {step.temperature && (
                          <span>🌡️ {step.temperature}</span>
                        )}
                      </div>
                      {step.source_text && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300">
                          <div className="flex items-start gap-1">
                            <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-semibold">Source: </span>
                              <span className="italic">"{step.source_text}"</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {step.notes && (
                        <div className="mt-2 text-sm text-yellow-400 flex items-start gap-2 bg-yellow-500/10 rounded p-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {step.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {protocol.materials.length === 0 && protocol.steps.length === 0 && protocol.equipment.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>No protocol details found in this paper.</p>
              <p className="text-sm mt-2">The paper may not contain a detailed experimental protocol.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between text-sm text-gray-400">
          <div>
            Extracted by {protocol.extracted_by} • {new Date(protocol.created_at).toLocaleDateString()}
          </div>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this protocol?')) {
                  onDelete(protocol.protocol_id);
                  onClose();
                }
              }}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              Delete Protocol
            </button>
          )}
        </div>
      </div>

      {/* Experiment Planning Modal */}
      {showPlanningModal && (
        <ExperimentPlanningModal
          protocolId={protocol.protocol_id}
          protocolName={protocol.protocol_name}
          projectId={projectId}
          userId={userId}
          onClose={() => setShowPlanningModal(false)}
          onPlanCreated={(plan) => {
            setShowPlanningModal(false);
            if (onPlanCreated) {
              onPlanCreated(plan);
            }
          }}
        />
      )}
    </div>
  );
}
