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
                alt="R&D Agent logo"
                width={120}
                height={24}
                priority
              />
              <span className="text-xl font-semibold text-gray-900">R&D Agent</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FolderIcon className="h-5 w-5 mr-2" />
                My Projects
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Research Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get comprehensive literature reviews and deep analysis of scientific articles with our advanced AI agents.
          </p>
        </div>

        <InputForm 
          onGenerate={handleGenerateReview} 
          defaultProjectId={selectedProjectId}
          isLoading={isLoading}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {queries && queries.length > 0 ? (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Generated Queries:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {queries.map((q, i) => (
                <li key={i} className="font-mono bg-blue-100 p-2 rounded">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {diagnostics ? (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Analysis Details:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>Pool size: {diagnostics.pool_size}</p>
              <p>Deep dive count: {diagnostics.deep_dive_count}</p>
              <p>Processing time: {diagnostics.timings_ms?.deepdive_ms}ms</p>
            </div>
          </div>
        ) : null}

        <ResultsList results={results} />
      </main>
    </div>
  );
}