import React from 'react';

export interface ExperimentalMethodAnchor { claim: string; evidence?: { title?: string; year?: number; pmid?: string | null; quote?: string } }

export interface ExperimentalMethodRow {
  technique: string;
  measurement: string;
  role_in_study: string;
  parameters: string;
  controls_validation: string;
  limitations_reproducibility: string;
  validation: string;
  accession_ids: string[];
  fact_anchors?: ExperimentalMethodAnchor[];
}

export default function ExperimentalMethodsTable({ rows }: { rows: ExperimentalMethodRow[] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-700 text-sm">No experimental methods found.</div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Technique</th>
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Measurement</th>
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Role</th>
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Key Parameters</th>
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Controls/Validation</th>
              <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Limitations</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="align-top">
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">
                  <div className="font-medium text-slate-900">{r.technique || '—'}</div>
                  {Array.isArray(r.accession_ids) && r.accession_ids.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.accession_ids.map((id, j) => (
                        <span key={j} className="inline-block text-xxs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">{id}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.measurement || '—'}</td>
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.role_in_study || '—'}</td>
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.parameters || '—'}</td>
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.controls_validation || r.validation || '—'}</td>
                <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.limitations_reproducibility || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Optional fact anchors (collapsed list) */}
      {rows.some(r => Array.isArray(r.fact_anchors) && r.fact_anchors.length) && (
        <details>
          <summary className="cursor-pointer text-xs text-slate-700">Show method fact anchors</summary>
          <div className="mt-2 space-y-2">
            {rows.map((r, i) => (
              <div key={i}>
                {Array.isArray(r.fact_anchors) && r.fact_anchors.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                    {r.fact_anchors.map((fa, k) => (
                      <li key={k}>
                        <span className="font-medium">{fa.claim}</span>
                        {fa.evidence && (
                          <span className="ml-2 text-slate-600">[{fa.evidence.title} {fa.evidence.year}{fa.evidence.pmid ? ` · PMID ${fa.evidence.pmid}` : ''}] “{fa.evidence.quote || ''}”</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

