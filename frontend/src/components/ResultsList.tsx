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
  const visible = showAll ? results.slice(0, 8) : results.slice(0, 5);
  const hasMore = results.length > 5;

  return (
    <div className="max-w-3xl mx-auto mt-8 grid gap-6">
      {(() => {
        const anyDiag = (results as any)?.diagnostics || null;
        return null;
      })()}
      {visible.map((item, idx) => (
        <ArticleCard key={idx} item={item} />
      ))}
      {hasMore && !showAll && (
        <button
          className="mx-auto mt-2 rounded bg-gray-800 text-white px-4 py-2 hover:bg-gray-700"
          onClick={() => setShowAll(true)}
        >
          Show 3 more
        </button>
      )}
    </div>
  );
}