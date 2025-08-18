import React, { useState } from 'react';
import ArticleCard from '@/components/ArticleCard';
import type { SearchResult } from '@/lib/dummy-data';

type Props = { results: SearchResult[] };

export default function ResultsList({ results }: Props) {
  if (!results?.length) {
    return (
      <div className="max-w-3xl mx-auto text-center text-gray-600 mt-8">
        No results to display. Please run a search.
      </div>
    );
  }

  const [showAll, setShowAll] = useState(false);
  const initialCount = 8;
  const visible = showAll ? results.slice(0, results.length) : results.slice(0, initialCount);
  const hasMore = results.length > initialCount;

  return (
    <div className="max-w-3xl mx-auto mt-8 grid gap-6">
      {(() => {
        const anyDiag = (results as any)?.diagnostics || (results as any)[0]?.diagnostics || null;
        if (!anyDiag) return null;
        const d = anyDiag as any;
        const t = d.timings_ms || {};
        return (
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-sm">
            <div className="font-medium mb-1">Run details</div>
            <div className="flex flex-wrap gap-3">
              <span>Pool size: {d.pool_size}</span>
              <span>Shortlist size: {d.shortlist_size}</span>
              <span>Deep-dive count: {d.deep_dive_count}</span>
            </div>
            {t ? (
              <div className="mt-1 text-xs text-slate-600">
                Timings (ms): plan {t.plan_ms} · harvest {t.harvest_ms} · triage {t.triage_ms} · deepdive {t.deepdive_ms}
              </div>
            ) : null}
          </div>
        );
      })()}
      {visible.map((item, idx) => (
        <ArticleCard key={idx} item={item} />
      ))}
      {hasMore && !showAll && (
        <button
          className="mx-auto mt-2 rounded bg-gray-800 text-white px-4 py-2 hover:bg-gray-700"
          onClick={() => setShowAll(true)}
        >
          {`Show all (${results.length - initialCount} more)`}
        </button>
      )}
    </div>
  );
}