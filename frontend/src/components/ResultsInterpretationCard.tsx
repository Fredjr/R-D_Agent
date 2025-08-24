import React from 'react';

export interface ResultsInterpretationProps {
  primary_finding: string;
  interpretation: string;
  unexpected_findings: string;
}

export default function ResultsInterpretationCard({ primary_finding, interpretation, unexpected_findings }: ResultsInterpretationProps) {
  const NA = (s: string) => (s && s.trim().length > 0 ? s : 'Not reported');
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Results Interpretation</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Primary Finding</h4>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(primary_finding)}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Interpretation</h4>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(interpretation)}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Unexpected Findings / Limitations</h4>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(unexpected_findings)}</p>
        </div>
      </div>
    </div>
  );
}

