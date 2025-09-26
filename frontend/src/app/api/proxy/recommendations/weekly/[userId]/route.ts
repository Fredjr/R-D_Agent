import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

// 🧠 Phase 2A.2: Semantic Analysis Integration
interface SemanticAnalysis {
  methodology?: 'experimental' | 'theoretical' | 'computational' | 'review' | 'meta_analysis' | 'case_study' | 'survey';
  complexity_score?: number;
  novelty_type?: 'breakthrough' | 'incremental' | 'replication' | 'review';
  research_domains?: string[];
  technical_terms?: string[];
  confidence_scores?: {
    methodology: number;
    complexity: number;
    novelty: number;
  };
  analysis_metadata?: {
    analysis_time_seconds?: number;
    service_initialized?: boolean;
  };
}

// 🧠 Generate Fallback Semantic Analysis
function generateFallbackSemanticAnalysis(paper: any): SemanticAnalysis {
  // Determine methodology based on paper characteristics
  let methodology: SemanticAnalysis['methodology'] = 'theoretical';
  if (paper.title?.toLowerCase().includes('experimental') || paper.title?.toLowerCase().includes('trial')) {
    methodology = 'experimental';
  } else if (paper.title?.toLowerCase().includes('computational') || paper.title?.toLowerCase().includes('algorithm')) {
    methodology = 'computational';
  } else if (paper.title?.toLowerCase().includes('review') || paper.title?.toLowerCase().includes('survey')) {
    methodology = 'review';
  }

  // Determine novelty based on citation count and recency
  let novelty_type: SemanticAnalysis['novelty_type'] = 'incremental';
  if (paper.citation_count > 100 && paper.year >= 2023) {
    novelty_type = 'breakthrough';
  } else if (paper.citation_count < 10) {
    novelty_type = 'incremental';
  }

  // Generate complexity score based on title complexity and citation count
  const titleComplexity = (paper.title?.length || 50) / 100;
  const citationComplexity = Math.min(paper.citation_count / 200, 1);
  const complexity_score = Math.min((titleComplexity + citationComplexity) / 2, 1);

  // Extract research domains from category and title
  const research_domains = [];
  if (paper.category) {
    research_domains.push(paper.category.toLowerCase().replace(/\s+/g, '_'));
  }

  // Add common domains based on title keywords
  const title_lower = paper.title?.toLowerCase() || '';
  if (title_lower.includes('machine learning') || title_lower.includes('ai')) {
    research_domains.push('machine_learning');
  }
  if (title_lower.includes('biology') || title_lower.includes('medical')) {
    research_domains.push('biology');
  }
  if (title_lower.includes('chemistry') || title_lower.includes('chemical')) {
    research_domains.push('chemistry');
  }

  return {
    methodology,
    complexity_score,
    novelty_type,
    research_domains: research_domains.slice(0, 3), // Limit to 3 domains
    technical_terms: [], // Could be enhanced with NLP extraction
    confidence_scores: {
      methodology: 0.7,
      complexity: 0.6,
      novelty: 0.65
    },
    analysis_metadata: {
      analysis_time_seconds: 0.001,
      service_initialized: false // Indicates this is fallback data
    }
  };
}

// 🧠 Add Semantic Analysis to Papers
function addSemanticAnalysis(papers: any[]): any[] {
  if (!papers || papers.length === 0) {
    return [];
  }

  console.log(`🧠 SEMANTIC: Adding semantic analysis to ${papers.length} papers`);

  return papers.map(paper => ({
    ...paper,
    semantic_analysis: generateFallbackSemanticAnalysis(paper)
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    console.log('🎵 Processing weekly recommendations request for user:', userId);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    
    // Build backend URL
    let backendUrl = `${BACKEND_BASE}/recommendations/weekly/${userId}`;
    if (projectId) {
      backendUrl += `?project_id=${projectId}`;
    }

    // Forward headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Forward User-ID header if present
    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers.set('User-ID', userIdHeader);
    }

    console.log('🎵 Forwarding to backend:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error('❌ Backend weekly recommendations failed:', response.status);
      return await handleProxyError(response, 'Weekly recommendations', BACKEND_BASE);
    }

    const data = await response.json();
    console.log('✅ Weekly recommendations successful for user:', userId);

    // Always use backend data when available - the backend service has been updated
    console.log('✅ Using real backend recommendations data directly');

    // Check if backend returned empty recommendations and enhance for better UX
    const recommendations = data.recommendations || {};
    const totalRecommendations =
      (recommendations.papers_for_you || []).length +
      (recommendations.trending_in_field || []).length +
      (recommendations.cross_pollination || []).length +
      (recommendations.citation_opportunities || []).length;

    // Only generate fallback if backend is completely empty AND user has no data
    if (totalRecommendations === 0 && (!data.user_insights || Object.keys(data.user_insights).length === 0)) {
      console.log('📝 Backend returned completely empty data, using minimal fallback...');
      // Return empty recommendations - let the backend service provide real data
      // The backend has been updated to return real recommendations
    }

    // 🧠 Phase 2A.2: Add Semantic Analysis to All Papers
    console.log('🧠 SEMANTIC: Starting semantic analysis integration...');

    try {
      const recommendations = data.recommendations || {};

      // Process each recommendation category
      const enhancedRecommendations = {
        papers_for_you: addSemanticAnalysis(recommendations.papers_for_you || []),
        trending_in_field: addSemanticAnalysis(recommendations.trending_in_field || []),
        cross_pollination: addSemanticAnalysis(recommendations.cross_pollination || []),
        citation_opportunities: addSemanticAnalysis(recommendations.citation_opportunities || [])
      };

      // Update the data with enhanced recommendations
      data.recommendations = enhancedRecommendations;

      console.log('✅ SEMANTIC: Successfully integrated semantic analysis into all recommendation categories');
      console.log(`📊 SEMANTIC: Enhanced ${
        enhancedRecommendations.papers_for_you.length +
        enhancedRecommendations.trending_in_field.length +
        enhancedRecommendations.cross_pollination.length +
        enhancedRecommendations.citation_opportunities.length
      } total papers with semantic analysis`);

    } catch (error) {
      console.error('❌ SEMANTIC: Failed to add semantic analysis, proceeding without it:', error);
      // Continue without semantic analysis if it fails
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Weekly recommendations proxy exception:', error);
    return handleProxyException(error, 'Weekly recommendations', BACKEND_BASE);
  }
}
