import React from 'react';

export interface ExperimentalMethodRow {
  technique: string;
  role_in_study: string;
  assessment: string;
}

export default function ExperimentalMethodsTable({ rows }: { rows: ExperimentalMethodRow[] }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-700 text-sm">No experimental methods found.</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-700">
            <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Technique</th>
            <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Role in Study</th>
            <th className="text-left font-semibold px-3 py-2 border-b border-slate-200">Assessment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.technique || '—'}</td>
              <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.role_in_study || '—'}</td>
              <td className="px-3 py-2 border-b border-slate-100 whitespace-pre-line">{r.assessment || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

