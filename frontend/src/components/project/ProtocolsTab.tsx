/**
 * Protocols Tab
 * 
 * Displays all extracted protocols for a project.
 * Allows viewing, editing, and deleting protocols.
 * 
 * Week 18: Protocols UI
 */

import React, { useState, useEffect } from 'react';
import { Beaker, Clock, AlertTriangle, Eye, Trash2, Download } from 'lucide-react';
import ProtocolDetailModal from './ProtocolDetailModal';

interface Material {
  name: string;
  catalog_number?: string;
  supplier?: string;
  amount?: string;
  notes?: string;
}

interface ProtocolStep {
  step_number: number;
  instruction: string;
  duration?: string;
  temperature?: string;
  notes?: string;
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
}

interface ProtocolsTabProps {
  projectId: string;
  userId: string;
}

export default function ProtocolsTab({ projectId, userId }: ProtocolsTabProps) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchProtocols();
  }, [projectId]);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proxy/protocols/project/${projectId}`, {
        headers: {
          'User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch protocols');
      }

      const data = await response.json();
      setProtocols(data);
    } catch (err) {
      console.error('Error fetching protocols:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch protocols');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProtocol = async (protocol: Protocol) => {
    try {
      const response = await fetch(`/api/proxy/protocols/${protocol.protocol_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify({
          protocol_name: protocol.protocol_name,
          protocol_type: protocol.protocol_type,
          materials: protocol.materials,
          steps: protocol.steps,
          equipment: protocol.equipment,
          duration_estimate: protocol.duration_estimate,
          difficulty_level: protocol.difficulty_level,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update protocol');
      }

      const updated = await response.json();
      setProtocols(protocols.map(p => p.protocol_id === updated.protocol_id ? updated : p));
      setSelectedProtocol(updated);
    } catch (err) {
      console.error('Error updating protocol:', err);
      alert('Failed to update protocol');
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    try {
      const response = await fetch(`/api/proxy/protocols/${protocolId}`, {
        method: 'DELETE',
        headers: {
          'User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete protocol');
      }

      setProtocols(protocols.filter(p => p.protocol_id !== protocolId));
      setSelectedProtocol(null);
    } catch (err) {
      console.error('Error deleting protocol:', err);
      alert('Failed to delete protocol');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'moderate': return 'text-yellow-400 bg-yellow-500/20';
      case 'difficult': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const filteredProtocols = filterType === 'all'
    ? protocols
    : protocols.filter(p => p.protocol_type === filterType);

  const protocolTypes = ['all', ...Array.from(new Set(protocols.map(p => p.protocol_type)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading protocols...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Beaker className="w-6 h-6" />
            Protocols
          </h2>
          <p className="text-gray-400 mt-1">
            Extracted experimental protocols from papers
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {filteredProtocols.length} protocol{filteredProtocols.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filter */}
      {protocolTypes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {protocolTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>
      )}

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-800">
          <Beaker className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No protocols yet</p>
          <p className="text-sm text-gray-500">
            Extract protocols from papers in your Smart Inbox
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProtocols.map(protocol => (
            <div
              key={protocol.protocol_id}
              className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              {/* Protocol Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {protocol.protocol_name}
                </h3>
                {protocol.article_title && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {protocol.article_title}
                  </p>
                )}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {protocol.protocol_type}
                </span>
                <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getDifficultyColor(protocol.difficulty_level)}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {protocol.difficulty_level}
                </span>
                {protocol.duration_estimate && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {protocol.duration_estimate}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <div className="text-gray-500">Materials</div>
                  <div className="text-white font-semibold">{protocol.materials.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Steps</div>
                  <div className="text-white font-semibold">{protocol.steps.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Equipment</div>
                  <div className="text-white font-semibold">{protocol.equipment.length}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProtocol(protocol)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <button
                  onClick={() => handleDeleteProtocol(protocol.protocol_id)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                  title="Delete protocol"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                Extracted {new Date(protocol.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Detail Modal */}
      {selectedProtocol && (
        <ProtocolDetailModal
          protocol={selectedProtocol}
          onClose={() => setSelectedProtocol(null)}
          onUpdate={handleUpdateProtocol}
          onDelete={handleDeleteProtocol}
        />
      )}
    </div>
  );
}


