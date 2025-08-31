import React, { useState } from 'react';
import ArticleCard from '@/components/ArticleCard';
import type { SearchResult } from '@/lib/dummy-data';

type Props = { results: SearchResult[] };

export default function ResultsList({ results }: Props) {
  if (!results?.length) {
    return (
      <div className="max-w-4xl mx-auto text-center text-gray-600 mt-6 sm:mt-8 px-4">
        <p className="text-sm sm:text-base">No results to display. Please run a search.</p>
      </div>
    );
  }

  const [showAll, setShowAll] = useState(false);
  const initialCount = 8;
  const visible = showAll ? results.slice(0, results.length) : results.slice(0, initialCount);
  const hasMore = results.length > initialCount;

  return (
    <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-4 sm:px-0 grid gap-4 sm:gap-6">
      {(() => {
        const anyDiag = (results as any)?.diagnostics || (results as any)[0]?.diagnostics || null;
        if (!anyDiag) return null;
        const d = anyDiag as any;
        const t = d.timings_ms || {};
        return (
          <div className="p-3 sm:p-4 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm">
            <div className="font-medium mb-2">Run details</div>
            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm">
              <span>Pool: {d.pool_size}</span>
              <span>Shortlist: {d.shortlist_size}</span>
              <span>Deep-dive: {d.deep_dive_count}</span>
              {d.dag_topped_up ? (
                <span className="inline-flex items-center gap-1 text-xxs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200" title="Results were topped up to meet target depth">
                  topped up
                </span>
              ) : null}
              {d.dag_fallback_v2 ? (
                <span className="inline-flex items-center gap-1 text-xxs px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200" title="Fallback path was used to ensure completeness">
                  fallback
                </span>
              ) : null}
            </div>
            {t ? (
              <div className="mt-2 text-xxs sm:text-xs text-slate-600 break-words">
                <span className="hidden sm:inline">Timings (ms): plan {t.plan_ms} · harvest {t.harvest_ms} · triage {t.triage_ms} · deepdive {t.deepdive_ms}</span>
                <span className="sm:hidden">Time: {t.deepdive_ms}ms</span>
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
          className="mx-auto mt-4 rounded bg-gray-800 text-white px-4 sm:px-6 py-2 sm:py-3 hover:bg-gray-700 text-sm sm:text-base transition-colors"
          onClick={() => setShowAll(true)}
        >
          {`Show all (${results.length - initialCount} more)`}
        </button>
      )}
    </div>
  );
}