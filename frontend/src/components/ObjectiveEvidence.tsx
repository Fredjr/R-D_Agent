import React from 'react';

export interface Anchor {
  claim: string;
  confidence?: number;
  evidence?: { title?: string; year?: number; pmid?: string | null; quote?: string; figure_table_id?: string | null };
}

export default function ObjectiveEvidence({ objective, modelAnchors, methodAnchors, resultAnchors }: { objective: string; modelAnchors?: Anchor[]; methodAnchors?: Anchor[]; resultAnchors?: Anchor[] }) {
  const Section = ({ label, anchors }: { label: string; anchors?: Anchor[] }) => {
    if (!Array.isArray(anchors) || anchors.length === 0) return null;
    return (
      <details className="border border-slate-200 rounded-md p-3 bg-white text-black">
        <summary className="cursor-pointer text-sm font-semibold">{label} ({anchors.length})</summary>
        <ul className="mt-2 space-y-2">
          {anchors.map((a, i) => (
            <li key={i} className="text-sm">
              <div className="font-medium">{a.claim}</div>
              <div className="text-xs text-slate-700 mt-0.5">
                {typeof a.confidence === 'number' ? (<span className="mr-2">confidence: {(a.confidence*100).toFixed(0)}%</span>) : null}
                {a.evidence?.figure_table_id ? (<span className="mr-2">ref: {a.evidence.figure_table_id}</span>) : null}
                {a.evidence?.pmid ? (<span className="mr-2">PMID {a.evidence.pmid}</span>) : null}
                {a.evidence?.title ? (<span className="mr-2">{a.evidence.title} {a.evidence.year || ''}</span>) : null}
              </div>
              {a.evidence?.quote ? (
                <div className="mt-1 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">“{a.evidence.quote}”</div>
              ) : null}
            </li>
          ))}
        </ul>
      </details>
    );
  };
  return (
    <div className="w-full">
      <details className="border border-slate-300 rounded-md p-3 bg-white text-black">
        <summary className="cursor-pointer text-sm font-semibold">Objective → Evidence</summary>
        <div className="mt-2 text-sm">
          <div className="mb-2"><span className="text-xxs uppercase tracking-wide text-slate-600">Objective</span><div className="font-medium">{objective}</div></div>
          <div className="space-y-3">
            <Section label="Model evidence" anchors={modelAnchors} />
            <Section label="Methods evidence" anchors={methodAnchors} />
            <Section label="Results evidence" anchors={resultAnchors} />
          </div>
        </div>
      </details>
    </div>
  );
}