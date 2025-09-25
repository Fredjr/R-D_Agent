/**
 * Phase 2A.2: Semantic Analysis Hook
 * Custom React hook for calling backend semantic analysis endpoints
 */

import { useState, useCallback } from 'react';

// Types matching the backend API
export interface SemanticAnalysisRequest {
  title: string;
  abstract: string;
  full_text?: string;
  pmid?: string;
}

export interface SemanticAnalysisResponse {
  methodology: string;
  complexity_score: number;
  novelty_type: string;
  technical_terms: string[];
  research_domains: string[];
  confidence_scores: {
    methodology: number;
    complexity: number;
    novelty: number;
  };
  embedding_dimensions: number;
  analysis_metadata: {
    pmid?: string;
    title_length: number;
    abstract_length: number;
    has_full_text: boolean;
    service_initialized: boolean;
    analysis_time_seconds?: number;
    total_request_time_seconds?: number;
  };
}

export interface SemanticAnalysisServiceStatus {
  service_name: string;
  version: string;
  is_available: boolean;
  is_initialized: boolean;
  capabilities: {
    methodology_detection: boolean;
    complexity_scoring: boolean;
    novelty_detection: boolean;
    technical_term_extraction: boolean;
    research_domain_identification: boolean;
    semantic_embeddings: boolean;
  };
  supported_methodologies: string[];
  supported_novelty_types: string[];
  models: {
    scibert_available: boolean;
    sentence_transformer_available: boolean;
    spacy_available: boolean;
  };
}

export interface UseSemanticAnalysisReturn {
  // Analysis functions
  analyzePaper: (request: SemanticAnalysisRequest) => Promise<SemanticAnalysisResponse | null>;
  getServiceStatus: () => Promise<SemanticAnalysisServiceStatus | null>;
  initializeService: () => Promise<boolean>;
  runTestAnalysis: () => Promise<any>;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastAnalysis: SemanticAnalysisResponse | null;
  serviceStatus: SemanticAnalysisServiceStatus | null;
  
  // Utilities
  clearError: () => void;
  isServiceReady: boolean;
}

const BACKEND_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://r-dagent-production.up.railway.app'
  : 'http://localhost:8080';

export function useSemanticAnalysis(): UseSemanticAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<SemanticAnalysisResponse | null>(null);
  const [serviceStatus, setServiceStatus] = useState<SemanticAnalysisServiceStatus | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const analyzePaper = useCallback(async (request: SemanticAnalysisRequest): Promise<SemanticAnalysisResponse | null> => {
    setIsLoading(true);
    setError(null);

    const requestId = `frontend_${Date.now()}`;
    const startTime = performance.now();

    try {
      console.log(`🧠 [FRONTEND] [${requestId}] SEMANTIC ANALYSIS REQUEST STARTED`);
      console.log(`📝 [FRONTEND] [${requestId}] Title: "${request.title.substring(0, 100)}..."`);
      console.log(`📄 [FRONTEND] [${requestId}] Abstract length: ${request.abstract?.length || 0} chars`);
      console.log(`📚 [FRONTEND] [${requestId}] Full text: ${request.full_text ? 'Provided' : 'Not provided'}`);
      console.log(`🔢 [FRONTEND] [${requestId}] PMID: ${request.pmid || 'None'}`);
      console.log(`🌐 [FRONTEND] [${requestId}] Backend URL: ${BACKEND_BASE}`);

      const fetchStart = performance.now();
      const response = await fetch(`${BACKEND_BASE}/api/semantic/analyze-paper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const fetchTime = performance.now() - fetchStart;

      console.log(`📡 [FRONTEND] [${requestId}] HTTP request completed in ${fetchTime.toFixed(1)}ms`);
      console.log(`📊 [FRONTEND] [${requestId}] Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const parseStart = performance.now();
      const result = await response.json();
      const parseTime = performance.now() - parseStart;
      const totalTime = performance.now() - startTime;

      console.log(`📦 [FRONTEND] [${requestId}] Response parsed in ${parseTime.toFixed(1)}ms`);
      console.log(`✅ [FRONTEND] [${requestId}] SEMANTIC ANALYSIS SUCCESSFUL!`);
      console.log(`🧪 [FRONTEND] [${requestId}] Results: ${result.methodology} | ${(result.complexity_score * 100).toFixed(0)}% complexity | ${result.novelty_type}`);
      console.log(`🎯 [FRONTEND] [${requestId}] Domains: ${result.research_domains?.join(', ') || 'None'}`);
      console.log(`⚡ [FRONTEND] [${requestId}] Total time: ${totalTime.toFixed(1)}ms (fetch: ${fetchTime.toFixed(1)}ms, parse: ${parseTime.toFixed(1)}ms)`);

      setLastAnalysis(result);
      return result;
    } catch (err) {
      const totalTime = performance.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`❌ [FRONTEND] [${requestId}] SEMANTIC ANALYSIS FAILED after ${totalTime.toFixed(1)}ms`);
      console.error(`💥 [FRONTEND] [${requestId}] Error: ${errorMessage}`);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getServiceStatus = useCallback(async (): Promise<SemanticAnalysisServiceStatus | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧠 [SEMANTIC] Getting service status...');
      
      const response = await fetch(`${BACKEND_BASE}/api/semantic/service-status`);

      if (!response.ok) {
        throw new Error(`Service status check failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🧠 [SEMANTIC] Service status:', result);
      
      setServiceStatus(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('🧠 [SEMANTIC] Service status error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeService = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧠 [SEMANTIC] Initializing service...');
      
      const response = await fetch(`${BACKEND_BASE}/api/semantic/initialize-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Service initialization failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🧠 [SEMANTIC] Service initialized:', result);
      
      // Refresh service status after initialization
      await getServiceStatus();
      
      return result.status === 'success';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('🧠 [SEMANTIC] Initialization error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getServiceStatus]);

  const runTestAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🧠 [SEMANTIC] Running test analysis...');
      
      const response = await fetch(`${BACKEND_BASE}/api/semantic/test-analysis`);

      if (!response.ok) {
        throw new Error(`Test analysis failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🧠 [SEMANTIC] Test analysis complete:', result);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('🧠 [SEMANTIC] Test analysis error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isServiceReady = Boolean(serviceStatus?.is_available && serviceStatus?.is_initialized);

  return {
    // Analysis functions
    analyzePaper,
    getServiceStatus,
    initializeService,
    runTestAnalysis,
    
    // State
    isLoading,
    error,
    lastAnalysis,
    serviceStatus,
    
    // Utilities
    clearError,
    isServiceReady,
  };
}
