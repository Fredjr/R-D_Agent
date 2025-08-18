import React from 'react';
import type { SearchResult } from '@/lib/dummy-data';

type Props = { item: SearchResult };

export default function ArticleCard({ item }: Props) {
  const headerTitle = (item as any).top_article?.title ?? item.articles?.[0]?.title ?? 'Untitled';
  const headerPmid = (item as any).top_article?.pmid ?? item.articles?.[0]?.pmid;
  const headerUrl = (item as any).top_article?.url ?? (headerPmid ? `https://pubmed.ncbi.nlm.nih.gov/${headerPmid}/` : undefined);
  const { summary, publication_score, overall_relevance_score, confidence_score, methodologies } = item.result;
  const factAnchors = (item.result as any).fact_anchors as Array<{ claim: string; evidence: { title: string; year: number; pmid?: string; quote: string } }>|undefined;
  const relevanceJustification = (item.result as any).relevance_justification as string | undefined;
  const specialistTags = Array.isArray((item.result as any).specialist_tags) ? (item.result as any).specialist_tags as string[] : [];

  const [expandSummary, setExpandSummary] = React.useState(false);
  const [expandAnchors, setExpandAnchors] = React.useState(false);
  return (
    <article className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 flex flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {item.source ? (
            <div className="mb-2 flex items-center gap-2">
              <span
                title={item.source === 'fallback' ? 'Broader recall used after primary retrieval' : 'From stricter primary retrieval'}
                className={
                  item.source === 'fallback'
                    ? 'inline-block text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200'
                    : 'inline-block text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200'
                }
              >
                {item.source === 'fallback' ? 'Fallback' : 'Primary'}
              </span>
            </div>
          ) : null}
          {headerUrl ? (
            <h2 className="text-xl font-semibold text-gray-900">
              <a
                href={headerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {headerTitle}
              </a>
            </h2>
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">{headerTitle}</h2>
          )}
          {specialistTags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {specialistTags.map((t, i) => (
                <span key={i} className="inline-block text-xxs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-2 text-gray-700 leading-relaxed">
            <p className={expandSummary ? '' : 'line-clamp-4'}>{summary}</p>
            {summary && summary.length > 0 && (
              <button onClick={() => setExpandSummary(!expandSummary)} className="mt-1 text-xs text-indigo-600 hover:underline">
                {expandSummary ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
          {typeof (item as any).memories_used === 'number' && (item as any).memories_used > 0 ? (
            <div className="mt-2 text-xs text-slate-600" title="Previous relevant context informed this result">
              Memories used: {(item as any).memories_used}
            </div>
          ) : null}
          {relevanceJustification ? (
            <div className="mt-3 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-900">
              <strong className="block text-sm uppercase tracking-wide mb-1">Relevance</strong>
              <p className="text-sm leading-relaxed">{relevanceJustification}</p>
            </div>
          ) : null}
          {Array.isArray(factAnchors) && factAnchors.length ? (
            <div className="mt-3 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900">
              <strong className="block text-sm uppercase tracking-wide mb-1">Fact Anchors</strong>
              <ul className={`list-disc list-inside text-sm space-y-1 ${expandAnchors ? '' : ''}`}>
                {(expandAnchors ? factAnchors : factAnchors.slice(0,5)).map((fa, i) => (
                  <li key={i}>
                    <span className="font-medium">{fa.claim}</span>
                    {fa.evidence ? (
                      <span className="ml-2 text-xs text-emerald-800">[{fa.evidence.title} {fa.evidence.year}{fa.evidence.pmid ? ` · PMID ${fa.evidence.pmid}` : ''}] “{expandAnchors ? fa.evidence.quote : `${fa.evidence.quote?.slice(0,120)}${(fa.evidence.quote?.length||0)>120?'…':''}`}”</span>
                    ) : null}
                  </li>
                ))}
              </ul>
              {factAnchors.length > 5 && (
                <button onClick={() => setExpandAnchors(!expandAnchors)} className="mt-2 text-xs text-emerald-700 hover:underline">
                  {expandAnchors ? 'Show fewer' : `Show all (${factAnchors.length})`}
                </button>
              )}
            </div>
          ) : null}
          {/* Relevance Scorecard */}
          {((item.result as any)?.score_breakdown) ? (
            <div className="mt-3 p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-800">
              <strong className="block text-sm uppercase tracking-wide mb-2">Relevance Scorecard</strong>
              {(() => {
                const sb = (item.result as any).score_breakdown || {};
                const toNum = (v: unknown): number | undefined => {
                  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
                  const n = Number((v as any));
                  return Number.isFinite(n) ? n : undefined;
                };
                const sim = toNum(sb.objective_similarity_score);
                const rec = toNum(sb.recency_score);
                const imp = toNum(sb.impact_score);
                const ctx = toNum(sb.contextual_match_score);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">🎯 Objective Similarity:</span> {sim !== undefined ? `${Math.round(sim)} / 100` : '—'}
                      <div className="text-xs text-slate-600">How closely the article matches your goal</div>
                    </div>
                    <div>
                      <span className="font-medium">🗓️ Recency:</span> {rec !== undefined ? `${Math.round(rec)} / 100` : '—'}
                      <div className="text-xs text-slate-600">Based on publication year</div>
                    </div>
                    <div>
                      <span className="font-medium">💥 Impact:</span> {imp !== undefined ? `${Math.round(imp)} / 100` : '—'}
                      <div className="text-xs text-slate-600">Citations per year (normalized)</div>
                    </div>
                    <div>
                      <span className="font-medium">🧠 Contextual Match:</span> {ctx !== undefined ? `${Math.round(ctx)} / 100` : '—'}
                      <div className="text-xs text-slate-600">AI assessment vs your specific objective</div>
                    </div>
                  </div>
                );
              })()}
              <div className="mt-2 text-xs text-slate-600">
                Weighted Overall = 40% Similarity + 20% Recency + 20% Impact + 20% Contextual Match
              </div>
            </div>
          ) : null}
        </div>
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold">
            {Math.round(overall_relevance_score)}
          </div>
          <div className="text-xs text-gray-700">
            <div>Publication: {Math.round(publication_score)}</div>
            <div>LLM conf: {Math.round(confidence_score)}</div>
          </div>
        </div>
      </header>

      {methodologies?.length ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {methodologies.map((m, idx) => (
            <span key={idx} className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full border border-blue-200">{m}</span>
          ))}
        </div>
      ) : null}

      {item.articles?.length ? (
        <div className="mt-2 grid gap-2 text-sm text-gray-600">
          {item.articles.slice(0, 3).map((a, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                {a.pmid ? (
                  <a
                    href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:underline"
                  >
                    • {a.title}
                  </a>
                ) : (
                  <span className="truncate">• {a.title}</span>
                )}
                <span className="ml-3 shrink-0 text-gray-500">{a.pub_year} · {a.citation_count} cites</span>
              </div>
              {Boolean((a as any).score_breakdown) && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries((a as any).score_breakdown).map(([k, v]) => (
                    <span key={k} className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
