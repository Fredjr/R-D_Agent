import React from 'react';

export interface MiniFlowProps {
  objective: string;
  model?: { model_type?: string; study_design?: string };
  methods?: string[];
  resultsSummary?: string;
  hypothesisAlignment?: string;
  evidenceRefs?: string[];
}

export default function MiniFlow({ objective, model, methods, resultsSummary, hypothesisAlignment, evidenceRefs }: MiniFlowProps) {
  const pill = (label: string, value?: string) => (
    <div className="flex flex-col items-start">
      <div className="text-xxs uppercase tracking-wide text-slate-600">{label}</div>
      <div className="text-sm font-medium text-black truncate max-w-[16rem]" title={value || ''}>{value || '—'}</div>
    </div>
  );
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[720px] bg-white border border-slate-200 rounded-md p-3 flex items-center gap-3 text-black">
        {pill('Objective', objective)}
        <span className="text-slate-400">→</span>
        {pill('Model', [model?.model_type, model?.study_design].filter(Boolean).join(' · '))}
        <span className="text-slate-400">→</span>
        {pill('Methods', (methods && methods.length) ? methods.slice(0,2).join(', ') + (methods.length>2 ? '…' : '') : undefined)}
        <span className="text-slate-400">→</span>
        {pill('Results', resultsSummary)}
        <span className="text-slate-400">→</span>
        {pill('Interpretation', hypothesisAlignment)}
        {Array.isArray(evidenceRefs) && evidenceRefs.length > 0 && (
          <div className="ml-auto text-xs text-slate-700" title="Figures/Tables supporting results">
            Evidence: {evidenceRefs.slice(0,6).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}