'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Protocol {
  protocol_id: string;
  protocol_name: string;
  protocol_type: string;
  relevance_score?: number;
  difficulty_level: string;
  duration_estimate?: string;
  context_aware?: boolean;
  project_id?: string;
  project_name?: string;
  created_at: string;
}

interface ErythosProtocolsTabProps {
  projectFilter?: string;
}

export function ErythosProtocolsTab({ projectFilter }: ErythosProtocolsTabProps) {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    fetchProtocols();
  }, [projectFilter]);

  const fetchProtocols = async () => {
    if (!user?.email) return;
    
    try {
      // Fetch all protocols - in a real implementation this would be a global endpoint
      const response = await fetch(`/api/proxy/protocols${projectFilter ? `?project_id=${projectFilter}` : ''}`, {
        headers: { 'User-ID': user.email }
      });
      if (response.ok) {
        const data = await response.json();
        setProtocols(data.protocols || data || []);
      }
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'clinical_trial': return 'bg-blue-500/20 text-blue-400';
      case 'in_vitro': return 'bg-purple-500/20 text-purple-400';
      case 'in_vivo': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredProtocols = protocols
    .filter(p => typeFilter === 'all' || p.protocol_type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'relevance') return (b.relevance_score || 0) - (a.relevance_score || 0);
      return a.protocol_name.localeCompare(b.protocol_name);
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Types</option>
            <option value="clinical_trial">Clinical Trial</option>
            <option value="in_vitro">In Vitro</option>
            <option value="in_vivo">In Vivo</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="relevance">Relevance</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors">
          📄 Extract Protocol from Paper
        </button>
      </div>

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-gray-400 mb-4">No protocols found</p>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
            Extract Your First Protocol
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredProtocols.map((protocol) => (
            <div
              key={protocol.protocol_id}
              className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-5 hover:border-purple-500/50 transition-all"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center">
                  <span className="text-2xl">🧪</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{protocol.protocol_name}</h4>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {protocol.relevance_score && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                        {protocol.relevance_score}% Relevant
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(protocol.protocol_type)}`}>
                      {protocol.protocol_type}
                    </span>
                    {protocol.context_aware && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                        🧠 AI Context-Aware
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4">
                <button className="flex-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors">
                  👁️ View
                </button>
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  🧪 Plan Experiment
                </button>
                <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors">
                  📤 Export
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

