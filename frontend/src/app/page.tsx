'use client'
import Image from "next/image";
import Link from "next/link";
import InputForm from "@/components/InputForm";
import ResultsList from "@/components/ResultsList";
import { fetchReview } from "@/lib/api";
import { useState, useEffect } from "react";
import { FolderIcon } from '@heroicons/react/24/outline';

interface Article { title: string; pub_year: number; citation_count: number; pmid?: string }
interface AgentResult { summary: string; confidence_score: number; methodologies: string[]; publication_score: number; overall_relevance_score: number }
export interface ResultData { query?: string; result: AgentResult; articles: Article[] }


export default function Home() {
  const [results, setResults] = useState<ResultData[]>([]);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [queries, setQueries] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Get project ID from URL params if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, []);

  async function handleGenerateReview({ molecule, objective, projectId, clinicalMode, preference, dagMode, fullTextOnly }: { molecule: string; objective: string; projectId?: string | null; clinicalMode?: boolean; preference?: 'precision' | 'recall'; dagMode?: boolean; fullTextOnly?: boolean }) {
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const data = await fetchReview({ molecule, objective, projectId: projectId ?? null, clinicalMode, preference, dagMode, fullTextOnly });
      const arr = Array.isArray(data?.results) ? data.results : [];
      // Attach the original objective for downstream Deep Dive calls
      const enriched = arr.map((it: any) => ({ ...it, _objective: objective, query: objective }));
      setResults(enriched);
      setDiagnostics(data?.diagnostics ?? null);
      setQueries(Array.isArray(data?.queries) ? data.queries : null);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch results');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Image
                className="dark:invert"
                src="/next.svg"
                alt="R&D Agent"
                width={120}
                height={25}
              />
              <span className="text-lg font-semibold text-gray-900">R&D Agent</span>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FolderIcon className="h-5 w-5 mr-2" />
              My Projects
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="flex flex-col gap-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Research Analysis</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Generate comprehensive literature reviews and perform deep dive analysis on scientific articles
            </p>
          </div>

          {/* Project Selection Notice */}
          {selectedProjectId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                <strong>Project Mode:</strong> Results will be saved to your selected project.
              </p>
            </div>
          )}

          {/* Research Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <InputForm 
              onGenerate={handleGenerateReview} 
              defaultProjectId={selectedProjectId}
            />
          </div>

        {isLoading && (
          <div className="mt-4 p-4 rounded-md border border-slate-200 bg-slate-50 text-slate-700">
            Loading results...
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 rounded-md border border-red-300 bg-red-50 text-red-700">
            {error}
          </div>
        )}

        {diagnostics ? (
          <div className="w-full max-w-3xl mx-auto mt-4 p-4 rounded-md border border-slate-200 bg-slate-50 text-slate-800">
            <details>
              <summary className="cursor-pointer font-medium">Run details</summary>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>Pool size: {diagnostics.pool_size}</div>
                <div>Shortlist size: {diagnostics.shortlist_size}</div>
                <div>Deep-dive count: {diagnostics.deep_dive_count}</div>
                {diagnostics.timings_ms ? (
                  <div className="sm:col-span-2 text-xs text-slate-700">
                    Timings (ms): plan {diagnostics.timings_ms.plan_ms} · harvest {diagnostics.timings_ms.harvest_ms} · triage {diagnostics.timings_ms.triage_ms} · deepdive {diagnostics.timings_ms.deepdive_ms}
                  </div>
                ) : null}
                {Array.isArray(queries) && queries.length ? (
                  <div className="sm:col-span-2 text-xs text-slate-700">
                    Queries: {queries.join(' | ')}
                  </div>
                ) : null}
              </div>
            </details>
          </div>
        ) : null}

        <ResultsList results={results} />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org
        </a>
      </footer>
    </div>
  );
}
