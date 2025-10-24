export type Article = {
  title: string;
  pub_year: number;
  citation_count: number;
  pmid?: string;
  journal?: string;
  authors?: string[];
  year?: number; // For backward compatibility
};
export type AgentResult = { summary: string; confidence_score: number; methodologies: string[]; publication_score: number; overall_relevance_score: number };
export type SearchResult = { query?: string; result: AgentResult; articles: Article[]; source?: 'primary' | 'fallback' };
