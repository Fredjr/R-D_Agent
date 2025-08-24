import React from 'react';

export interface KeyResultRow {
  metric: string;
  value: string;
  unit: string;
  effect_size: string;
  p_value: string;
  fdr: string;
  ci: string;
  direction: string;
  figure_table_ref: string;
}

export interface ResultsInterpretationProps {
  hypothesis_alignment: string;
  key_results: KeyResultRow[];
  limitations_biases_in_results: string[];
  fact_anchors?: { claim: string; evidence?: { title?: string; year?: number; pmid?: string | null; quote?: string } }[];
}

export default function ResultsInterpretationCard({ hypothesis_alignment, key_results, limitations_biases_in_results, fact_anchors }: ResultsInterpretationProps) {
  const NA = (s?: string) => (s && s.trim().length > 0 ? s : 'Not reported');
  const rows = Array.isArray(key_results) ? key_results : [];
  const lims = Array.isArray(limitations_biases_in_results) ? limitations_biases_in_results : [];
  return (
    <div className="border rounded-lg shadow-sm p-4 bg-white">
      <h3 className="text-lg font-semibold mb-3">Results Interpretation</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Hypothesis Alignment</h4>
          <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{NA(hypothesis_alignment)}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Key Quantitative Results</h4>
          {rows.length === 0 ? (
            <p className="mt-1 text-sm text-gray-900">No quantitative results extracted.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Metric</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Value</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Effect</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">p / FDR</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">CI</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Direction</th>
                    <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Figure/Table</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="align-top">
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{NA(r.metric)}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{[r.value, r.unit].filter(Boolean).join(' ') || '—'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.effect_size || '—'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{[r.p_value, r.fdr].filter(Boolean).join(' / ') || '—'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.ci || '—'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.direction || '—'}</td>
                      <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.figure_table_ref || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800">Limitations / Biases</h4>
          {lims.length === 0 ? (
            <p className="mt-1 text-sm text-gray-900">None reported.</p>
          ) : (
            <ul className="mt-1 list-disc list-inside text-sm text-gray-900 space-y-1">
              {lims.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
        </div>
        {Array.isArray(fact_anchors) && fact_anchors.length > 0 && (
          <details>
            <summary className="cursor-pointer text-xs text-slate-700">Show result fact anchors</summary>
            <ul className="mt-2 list-disc list-inside text-xs text-slate-700 space-y-1">
              {fact_anchors.map((fa, i) => (
                <li key={i}>
                  <span className="font-medium">{fa.claim}</span>
                  {fa.evidence && (
                    <span className="ml-2 text-slate-600">[{fa.evidence.title} {fa.evidence.year}{fa.evidence.pmid ? ` · PMID ${fa.evidence.pmid}` : ''}] “{fa.evidence.quote || ''}”</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

