'use client'
import Image from "next/image";
import InputForm from "@/components/InputForm";
import ResultsList from "@/components/ResultsList";
import { fetchReview } from "@/lib/api";
import { useState } from "react";

interface Article { title: string; pub_year: number; citation_count: number; pmid?: string }
interface AgentResult { summary: string; confidence_score: number; methodologies: string[]; publication_score: number; overall_relevance_score: number }
export interface ResultData { query?: string; result: AgentResult; articles: Article[] }


export default function Home() {
  const [results, setResults] = useState<ResultData[]>([]);
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [queries, setQueries] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start max-h-[85vh] overflow-auto text-black">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
              <div className="w-full mt-8">
          <InputForm onGenerate={handleGenerateReview} />
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
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
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
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
