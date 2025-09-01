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
    setDiagnostics(null);
    setQueries(null);
    
    try {
      const data = await fetchReview({ molecule, objective, projectId: projectId ?? null, clinicalMode, preference, dagMode, fullTextOnly });
      const arr = Array.isArray(data?.results) ? data.results : [];
      // Attach the original objective for downstream Deep Dive calls
      const enriched = arr.map((it: any) => ({ ...it, _objective: objective, query: objective }));
      setResults(enriched);
      setDiagnostics(data?.diagnostics ?? null);
      setQueries(Array.isArray(data?.queries) ? data.queries : null);
    } catch (e: any) {
      console.error('Research generation error:', e);
      setError(e?.message || 'Failed to fetch results. Please try again with a more specific query.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Image
                src="/next.svg"
                alt="R&D Agent logo"
                width={100}
                height={20}
                priority
                className="w-20 h-4 sm:w-24 sm:h-5 dark:invert"
              />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 hidden xs:block">R&D Agent</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {selectedProjectId && (
                <Link
                  href={`/project/${selectedProjectId}`}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                >
                  <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Project</span>
                  <span className="sm:hidden">Project</span>
                </Link>
              )}
              <Link
                href="/dashboard"
                className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">My Projects</span>
                <span className="sm:hidden">Projects</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb Navigation */}
        {(selectedProjectId || results.length > 0) && (
          <nav className="mb-4 sm:mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/dashboard" className="hover:text-gray-700">
                  Projects
                </Link>
              </li>
              {selectedProjectId && (
                <>
                  <li>/</li>
                  <li>
                    <Link href={`/project/${selectedProjectId}`} className="hover:text-gray-700">
                      Project
                    </Link>
                  </li>
                </>
              )}
              <li>/</li>
              <li className="text-gray-900 font-medium">Research Analysis</li>
            </ol>
          </nav>
        )}

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            AI-Powered Research Analysis
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Get comprehensive literature reviews and deep analysis of scientific articles with our advanced AI agents.
          </p>
        </div>

        <InputForm 
          onGenerate={handleGenerateReview} 
          defaultProjectId={selectedProjectId}
          isLoading={isLoading}
        />

        {isLoading && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-blue-50 border border-blue-200 rounded-lg mx-4 sm:mx-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <h3 className="font-medium text-blue-900 text-sm sm:text-base">Analyzing Research...</h3>
            </div>
            <p className="text-blue-800 text-xs sm:text-sm">
              This may take 1-2 minutes for precision mode or up to 4 minutes for recall mode as we search literature databases and perform AI analysis.
            </p>
            <div className="mt-3 text-xs text-blue-700">
              💡 <strong>Tip:</strong> Precision mode is faster and yields focused results. Recall mode is more comprehensive but takes longer.
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 sm:mt-6 p-4 bg-red-50 border border-red-200 rounded-lg mx-4 sm:mx-0">
            <p className="text-red-800 text-sm sm:text-base">{error}</p>
            <div className="mt-2 text-xs text-red-700">
              💡 Try making your query more specific or check your internet connection.
            </div>
          </div>
        )}

        {queries && queries.length > 0 ? (
          <div className="mt-4 sm:mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg mx-4 sm:mx-0">
            <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Generated Queries:</h3>
            <ul className="text-xs sm:text-sm text-blue-800 space-y-2">
              {queries.map((q, i) => (
                <li key={i} className="font-mono bg-blue-100 p-2 sm:p-3 rounded text-xs sm:text-sm break-words">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {diagnostics ? (
          <div className="mt-4 sm:mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg mx-4 sm:mx-0">
            <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Analysis Details:</h3>
            <div className="text-xs sm:text-sm text-gray-700 space-y-1">
              <p>Pool size: {diagnostics.pool_size}</p>
              <p>Deep dive count: {diagnostics.deep_dive_count}</p>
              <p>Processing time: {diagnostics.timings_ms?.deepdive_ms}ms</p>
            </div>
          </div>
        ) : null}

        <ResultsList results={results} />
        
        {/* New Research Button when results are shown */}
        {results.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setResults([]);
                setDiagnostics(null);
                setQueries(null);
                setError(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Start New Research
            </button>
          </div>
        )}
      </main>
    </div>
  );
}