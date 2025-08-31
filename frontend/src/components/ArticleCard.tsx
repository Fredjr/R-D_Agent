import React from 'react';
import { fetchDeepDive } from '@/lib/api';
import ScientificModelCard from '@/components/ScientificModelCard';
import ExperimentalMethodsTable from '@/components/ExperimentalMethodsTable';
import ResultsInterpretationCard from '@/components/ResultsInterpretationCard';
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
  const [deepDiveOpen, setDeepDiveOpen] = React.useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = React.useState(false);
  const [deepDiveError, setDeepDiveError] = React.useState<string | null>(null);
  const [deepDiveData, setDeepDiveData] = React.useState<any | null>(null);
  // Cache deep dive data by key (pmid||title)
  const deepDiveCacheRef = React.useRef<Map<string, any>>(new Map());

  async function handleDeepDive() {
    setDeepDiveOpen(true);
    setDeepDiveError(null);
    const key = `${headerPmid || ''}||${headerTitle || ''}`;
    const cached = deepDiveCacheRef.current.get(key);
    if (cached) {
      setDeepDiveData({ ...cached });
      setDeepDiveLoading(false);
      return;
    }
    setDeepDiveLoading(true);
    setDeepDiveData(null);
    try {
      const url = headerUrl || undefined;
      const objective = (item as any)?._objective || (item as any)?.query || headerTitle;
      const data = await fetchDeepDive({ url, pmid: headerPmid, title: headerTitle, objective });
      const enriched = { ...data, _activeTab: 'Model' };
      deepDiveCacheRef.current.set(key, enriched);
      setDeepDiveData(enriched);
    } catch (e: any) {
      setDeepDiveError(e?.message || 'Failed to perform deep dive');
    } finally {
      setDeepDiveLoading(false);
    }
  }
  return (
    <article className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 text-black">
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
              {(() => {
                const sb = (item.result as any).score_breakdown || {};
                const tokens: string[] = Array.isArray(sb.matched_tokens) ? sb.matched_tokens : [];
                const cosine = typeof sb.cosine_similarity === 'number' ? sb.cosine_similarity : undefined;
                if (!tokens.length && cosine === undefined) return null;
                return (
                  <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-700">
                    {tokens.length > 0 && (
                      <div className="mb-1"><span className="font-medium">Matched tokens:</span> {tokens.join(', ')}</div>
                    )}
                    {cosine !== undefined && (
                      <div><span className="font-medium">Cosine similarity (objective vs abstract/title):</span> {Math.round(cosine)} / 100</div>
                    )}
                  </div>
                );
              })()}
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

      <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          className="w-full sm:w-auto rounded bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-500 transition-colors"
          onClick={handleDeepDive}
        >
          Deep Dive Analysis
        </button>
        <label className="w-full sm:w-auto inline-flex items-center justify-center text-sm text-indigo-700 cursor-pointer">
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setDeepDiveOpen(true);
            setDeepDiveLoading(true);
            setDeepDiveError(null);
            setDeepDiveData(null);
            try {
              const endpoint = '/api/proxy/deep-dive-upload';
              const form = new FormData();
              form.append('objective', (item as any)?.query || headerTitle);
              form.append('file', f);
              const res = await fetch(endpoint, { method: 'POST', body: form });
              if (!res.ok) throw new Error(`Upload failed (${res.status})`);
              const data = await res.json();
              setDeepDiveData({ ...data, _activeTab: 'Model' });
            } catch (err: any) {
              setDeepDiveError(err?.message || 'Upload deep dive failed');
            } finally {
              setDeepDiveLoading(false);
            }
          }} />
          <span className="w-full sm:w-auto inline-block rounded border border-indigo-300 px-4 py-2 hover:bg-indigo-50 text-center transition-colors">Upload PDF</span>
        </label>
      </div>

      {deepDiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDeepDiveOpen(false)}>
          <div className="bg-white text-black rounded-lg shadow-xl max-w-3xl w-full p-4 max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Deep Dive: Scientific Model</h3>
              <button onClick={() => setDeepDiveOpen(false)} className="text-sm text-black hover:opacity-80">Close</button>
            </div>
            {deepDiveLoading && (
              <div className="p-3 rounded border border-slate-200 bg-slate-50 text-black text-sm">Analyzing article…</div>
            )}
            {deepDiveError && (
              <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">{deepDiveError}</div>
            )}
            {deepDiveData && (
              <div>
                <div className="border-b border-slate-200 mb-3 sticky top-0 bg-white z-10">
                  {/* Source & coverage bar */}
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-black">
                    <span className="font-medium">Source:</span>
                    <span title="Selected (from results)">{headerTitle}{headerPmid ? ` · PMID ${headerPmid}` : ''}</span>
                    {(() => {
                      const d = (deepDiveData?.diagnostics||{}) as any;
                      const match = d && typeof d.mismatch === 'boolean' ? !d.mismatch : undefined;
                      if (match === true) return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">match</span>);
                      if (match === false) return (<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">mismatch</span>);
                      return null;
                    })()}
                    {(() => {
                      const d = (deepDiveData?.diagnostics||{}) as any;
                      const rt = d?.resolved_title; const rp = d?.resolved_pmid; const rd = d?.resolved_doi; const rc = d?.resolved_pmcid;
                      const src = d?.resolved_source; const lic = d?.license;
                      if (!rt && !rp && !rd && !rc && !lic) return null;
                      return (
                        <span className="ml-2" title="Resolved">
                          → {rt || ''}{rp ? ` · PMID ${rp}` : ''}{rc ? ` · PMCID ${rc}` : ''}{rd ? ` · DOI ${rd}` : ''}{src ? ` · ${src}` : ''}
                          {lic ? <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{lic}</span> : null}
                        </span>
                      );
                    })()}
                    <span className={`ml-auto inline-block px-2 py-0.5 rounded border ${deepDiveData?.diagnostics?.grounding==='full_text' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                      {deepDiveData?.diagnostics?.grounding==='full_text' ? 'Full‑text grounded' : 'Abstract‑only'}
                    </span>
                    {deepDiveData?.diagnostics?.qual_only ? (
                      <span className="inline-block px-2 py-0.5 rounded border bg-yellow-50 text-yellow-800 border-yellow-200" title="Quantitative completeness not met; qualitative only">Qual‑only</span>
                    ) : null}
                    {(() => {
                      const m1 = !!deepDiveData?.model_description_structured;
                      const m2 = Array.isArray(deepDiveData?.experimental_methods_structured) && deepDiveData.experimental_methods_structured.length>0;
                      const m3 = Array.isArray(deepDiveData?.results_interpretation_structured?.key_results) && deepDiveData.results_interpretation_structured.key_results.length>0;
                      return (
                        <span className="inline-flex items-center gap-2 ml-2">
                          <span className={`px-2 py-0.5 rounded text-xs border ${m1?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>Model</span>
                          <span className={`px-2 py-0.5 rounded text-xs border ${m2?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>Methods</span>
                          <span className={`px-2 py-0.5 rounded text-xs border ${m3?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>Results</span>
                        </span>
                      );
                    })()}
                  </div>
                  <nav className="-mb-px flex gap-4 text-sm">
                    {['Model','Methods','Results'].map((tab) => (
                      <button
                        key={tab}
                        className={`px-3 py-2 border-b-2 ${deepDiveData._activeTab===tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
                        onClick={() => setDeepDiveData({ ...deepDiveData, _activeTab: tab })}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>
                <div className="space-y-4 overflow-y-auto max-h-full">
                  {(!deepDiveData._activeTab || deepDiveData._activeTab==='Model') && (
                    deepDiveData.model_description_structured ? (
                      <ScientificModelCard data={deepDiveData.model_description_structured} />
                    ) : (
                      <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-700 text-sm">No model analysis available.</div>
                    )
                  )}
                  {(deepDiveData._activeTab==='Methods') && (
                    Array.isArray(deepDiveData.experimental_methods_structured)
                      ? <ExperimentalMethodsTable data={deepDiveData.experimental_methods_structured} />
                      : (deepDiveLoading
                          ? <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-700 text-sm">Loading methods…</div>
                          : <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-900 text-sm">Methods require full text. Upload PDF or open OA version.</div>
                        )
                  )}
                  {(deepDiveData._activeTab==='Results') && (
                    deepDiveData.results_interpretation_structured
                      ? <ResultsInterpretationCard data={deepDiveData.results_interpretation_structured} />
                      : (deepDiveLoading
                          ? <div className="p-3 rounded border border-slate-200 bg-slate-50 text-slate-700 text-sm">Loading results…</div>
                          : <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-900 text-sm">Results interpretation requires full text. Upload PDF or open OA version.</div>
                        )
                  )}
                  <div className="text-xs text-slate-600">Grounding: {deepDiveData?.diagnostics?.grounding || 'unknown'} {deepDiveData?.diagnostics?.grounding_source ? `· ${deepDiveData.diagnostics.grounding_source}` : ''}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
