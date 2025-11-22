import React from 'react';

interface Paper {
  title: string;
  score: number;
  pmid?: string;
}

interface Protocol {
  name: string;
  confidence: number;
}

interface Experiment {
  name: string;
  status: string;
}

interface Result {
  outcome: string;
  supports_hypothesis: boolean | null;
  confidence_change: number | null;
}

interface EvidenceChain {
  question: string;
  hypothesis: string;
  hypothesis_confidence: number;
  papers: Paper[];
  protocols: Protocol[];
  experiments: Experiment[];
  results: Result[];
  status: 'complete' | 'in_progress' | 'blocked';
  gaps: string[];
}

interface EvidenceChainViewProps {
  chain: EvidenceChain;
}

export default function EvidenceChainView({ chain }: EvidenceChainViewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
      case 'blocked':
        return 'bg-red-500/20 border-red-500/40 text-red-400';
      default:
        return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Evidence Chain</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(chain.status)}`}>
          {chain.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Question */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">❓</span>
          <h4 className="text-sm font-semibold text-gray-400 uppercase">Question</h4>
        </div>
        <p className="text-white ml-8">{chain.question}</p>
      </div>

      {/* Arrow */}
      <div className="text-center text-3xl text-purple-400 my-3">↓</div>

      {/* Hypothesis */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">💡</span>
          <h4 className="text-sm font-semibold text-gray-400 uppercase">Hypothesis</h4>
          <span className="text-sm text-gray-400">({chain.hypothesis_confidence}% confidence)</span>
        </div>
        <p className="text-white ml-8">{chain.hypothesis}</p>
      </div>

      {/* Arrow */}
      <div className="text-center text-3xl text-purple-400 my-3">↓</div>

      {/* Papers */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📄</span>
          <h4 className="text-sm font-semibold text-gray-400 uppercase">Evidence Papers ({chain.papers.length})</h4>
        </div>
        {chain.papers.length > 0 ? (
          <div className="ml-8 space-y-2">
            {chain.papers.map((paper, i) => (
              <div key={i} className="text-gray-300 flex items-start gap-2">
                <span className="text-green-400">•</span>
                <div className="flex-1">
                  <span>{paper.title}</span>
                  <span className="ml-2 text-sm text-gray-400">(Score: {paper.score}/100)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ml-8 text-yellow-400">⚠️ No papers linked yet</p>
        )}
      </div>

      {/* Arrow */}
      <div className="text-center text-3xl text-purple-400 my-3">↓</div>

      {/* Protocols */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🔬</span>
          <h4 className="text-sm font-semibold text-gray-400 uppercase">Protocols ({chain.protocols.length})</h4>
        </div>
        {chain.protocols.length > 0 ? (
          <div className="ml-8 space-y-2">
            {chain.protocols.map((protocol, i) => (
              <div key={i} className="text-gray-300 flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <div className="flex-1">
                  <span>{protocol.name}</span>
                  <span className="ml-2 text-sm text-gray-400">(Confidence: {protocol.confidence}%)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ml-8 text-yellow-400">⚠️ No protocols extracted yet</p>
        )}
      </div>

      {/* Continue with experiments and results... */}
      {/* Gaps Section */}
      {chain.gaps.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Gaps to Address:</h4>
          <ul className="space-y-1">
            {chain.gaps.map((gap, i) => (
              <li key={i} className="text-yellow-300 ml-4 flex items-start gap-2">
                <span>•</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

