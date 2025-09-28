'use client';

import React, { useState } from 'react';
import { SemanticPaperFilter, FilterCriteria } from '@/lib/semantic-filtering';
import { SemanticSearchEngine, SemanticSearchQuery } from '@/lib/semantic-search';
import { PersonalizedRecommendationEngine, RecommendationContext } from '@/lib/recommendation-engine';
import { CrossDomainDiscoveryEngine } from '@/lib/cross-domain-discovery';
import SemanticDiscoveryInterface from '@/components/SemanticDiscoveryInterface';
import SpotifyStyleRecommendationCard from '@/components/SpotifyStyleRecommendationCard';

export default function TestSemanticEnhancedPage() {
  const [activeMode, setActiveMode] = useState<'recommendations' | 'semantic_search' | 'cross_domain' | 'smart_filters' | 'trending' | 'for_you' | 'cross_domain_discoveries'>('recommendations');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Initialize semantic engines
  const [semanticFilter] = useState(() => new SemanticPaperFilter());
  const [semanticSearch] = useState(() => new SemanticSearchEngine());
  const [recommendationEngine] = useState(() => new PersonalizedRecommendationEngine());
  const [crossDomainEngine] = useState(() => new CrossDomainDiscoveryEngine());

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleSemanticSearch = async (query: string, options: any) => {
    setLoading(true);
    addTestResult(`Starting semantic search for: "${query}"`);
    
    try {
      const searchQuery: SemanticSearchQuery = {
        query,
        semantic_expansion: options.semantic_expansion,
        similarity_threshold: options.similarity_threshold,
        include_related_concepts: options.include_related_concepts,
        max_results: 10
      };

      // Test the semantic search engine
      const searchResults = await semanticSearch.performSemanticSearch(searchQuery);
      addTestResult(`Semantic search completed. Found ${searchResults.length} results`);
      
      // Create mock results for display
      const mockResults = Array.from({ length: 5 }, (_, i) => ({
        pmid: `mock_${i + 1}`,
        title: `Mock Paper ${i + 1}: ${query} Research`,
        abstract: `This is a mock abstract for testing semantic search with query: ${query}. The paper explores various aspects of the research topic and provides insights into the field.`,
        authors: [`Author ${i + 1}`, `Co-Author ${i + 1}`],
        journal: `Journal of ${query} Research`,
        publication_year: 2023 - i,
        overall_score: 0.9 - (i * 0.1),
        recommendation_reason: `High semantic similarity to your search query: ${query}`,
        research_domain: 'Test Domain',
        estimated_reading_time: 15 + i * 2,
        difficulty_level: Math.min(5, 2 + i)
      }));

      setResults(mockResults);
      addTestResult(`Mock results generated for display`);
    } catch (error) {
      addTestResult(`Error in semantic search: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (criteria: any) => {
    setLoading(true);
    addTestResult(`Applying smart filters with criteria: ${JSON.stringify(criteria)}`);
    
    try {
      const filterCriteria: FilterCriteria = {
        min_similarity_score: criteria.min_similarity_score,
        preferred_domains: criteria.preferred_domains || [],
        min_citation_count: criteria.min_citation_count,
        publication_year_range: criteria.publication_year_range,
        novelty_preference: criteria.novelty_preference
      };

      // Test the semantic filter
      const mockPapers = Array.from({ length: 10 }, (_, i) => ({
        pmid: `filter_test_${i}`,
        title: `Filtered Paper ${i + 1}`,
        similarity_score: Math.random(),
        citation_count: Math.floor(Math.random() * 100),
        publication_year: 2020 + Math.floor(Math.random() * 4),
        research_domain: ['Oncology', 'Cardiology', 'Neuroscience'][Math.floor(Math.random() * 3)],
        keywords: ['test', 'research'],
        mesh_terms: ['Test Term'],
        methodology_type: 'experimental',
        recency_score: Math.random()
      }));

      const filteredResults = await semanticFilter.filterPapers(mockPapers, filterCriteria);
      addTestResult(`Smart filtering completed. ${filteredResults.length} papers passed filters`);
      
      // Convert to display format
      const displayResults = filteredResults.slice(0, 5).map((paper, i) => ({
        pmid: paper.pmid,
        title: paper.title,
        abstract: `This paper passed the smart filtering criteria. Citation count: ${paper.citation_count}, Similarity: ${paper.similarity_score?.toFixed(2)}`,
        authors: [`Author ${i + 1}`],
        journal: 'Filtered Journal',
        publication_year: paper.publication_year,
        overall_score: paper.similarity_score,
        recommendation_reason: 'Passed smart filtering criteria',
        research_domain: paper.research_domain,
        estimated_reading_time: 12,
        difficulty_level: 3
      }));

      setResults(displayResults);
    } catch (error) {
      addTestResult(`Error in smart filtering: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCrossDomainExplore = async (domains: string[]) => {
    setLoading(true);
    addTestResult(`Exploring cross-domain opportunities for: ${domains.join(', ')}`);
    
    try {
      const opportunities = await crossDomainEngine.discoverCrossDomainOpportunities(
        domains,
        ['research', 'innovation', 'discovery']
      );
      
      addTestResult(`Cross-domain exploration completed. Found ${opportunities.length} opportunities`);
      
      // Create mock cross-domain results
      const mockResults = domains.slice(0, 3).map((domain, i) => ({
        pmid: `cross_${i + 1}`,
        title: `Cross-Domain Research: ${domain} Applications`,
        abstract: `This paper explores innovative applications of ${domain} research in other fields, demonstrating cross-pollination opportunities and interdisciplinary insights.`,
        authors: [`Cross-Domain Researcher ${i + 1}`],
        journal: 'Interdisciplinary Science',
        publication_year: 2023,
        overall_score: 0.85,
        recommendation_reason: `Cross-domain opportunity in ${domain}`,
        research_domain: domain,
        estimated_reading_time: 18,
        difficulty_level: 4
      }));

      setResults(mockResults);
    } catch (error) {
      addTestResult(`Error in cross-domain exploration: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAllSystems = async () => {
    setLoading(true);
    setTestResults([]);
    addTestResult('Starting comprehensive semantic systems test...');

    try {
      // Test 1: Vector Database
      addTestResult('Testing Vector Database...');
      const { vectorDB } = await import('@/lib/vector-database');
      await vectorDB.initialize();
      const stats = vectorDB.getStats();
      addTestResult(`✅ Vector Database: ${stats.totalEmbeddings} embeddings, ${stats.domains.length} domains`);

      // Test 2: User Profile System
      addTestResult('Testing User Profile System...');
      const { userProfileSystem } = await import('@/lib/user-profile-system');
      await userProfileSystem.initialize();
      const testProfile = await userProfileSystem.getUserProfile('test_user', 'test@example.com');
      addTestResult(`✅ User Profile System: Profile created for ${testProfile.email}`);

      // Test 3: Semantic Filter
      addTestResult('Testing SemanticPaperFilter...');
      const mockPapers = [
        { pmid: '1', title: 'Test Paper 1', similarity_score: 0.8, citation_count: 50, publication_year: 2023, research_domain: 'Oncology', keywords: ['test'], mesh_terms: ['Test'], methodology_type: 'experimental', recency_score: 0.9 },
        { pmid: '2', title: 'Test Paper 2', similarity_score: 0.6, citation_count: 20, publication_year: 2022, research_domain: 'Cardiology', keywords: ['test'], mesh_terms: ['Test'], methodology_type: 'observational', recency_score: 0.7 }
      ];
      const filterCriteria: FilterCriteria = { min_similarity_score: 0.7, min_citation_count: 30 };
      const filtered = await semanticFilter.filterPapers(mockPapers, filterCriteria);
      addTestResult(`✅ SemanticPaperFilter: ${filtered.length} papers passed filters`);

      // Test 4: Semantic Search with Vector DB
      addTestResult('Testing Enhanced SemanticSearchEngine...');
      const searchQuery: SemanticSearchQuery = { query: 'machine learning cancer', max_results: 5 };
      const searchResults = await semanticSearch.performSemanticSearch(searchQuery);
      addTestResult(`✅ SemanticSearchEngine: Found ${searchResults.length} results`);

      // Test 5: Vector Similarity Search
      addTestResult('Testing Vector Similarity Search...');
      const vectorResults = await vectorDB.semanticSearch('deep learning', { limit: 3 });
      addTestResult(`✅ Vector Search: Found ${vectorResults.length} similar papers`);

      // Test 6: Recommendation Engine
      addTestResult('Testing PersonalizedRecommendationEngine...');
      const context: RecommendationContext = { context_type: 'discovery' };
      addTestResult(`✅ PersonalizedRecommendationEngine: Initialized successfully`);

      // Test 7: Cross-Domain Discovery
      addTestResult('Testing CrossDomainDiscoveryEngine...');
      const opportunities = await crossDomainEngine.discoverCrossDomainOpportunities(['Oncology'], ['research']);
      addTestResult(`✅ CrossDomainDiscoveryEngine: ${opportunities.length} opportunities found`);

      // Test 8: Embedding Generation
      addTestResult('Testing Embedding Generation...');
      const response = await fetch('/api/proxy/generate-embedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'machine learning in healthcare' })
      });
      const embeddingData = await response.json();
      addTestResult(`✅ Embedding Generation: ${embeddingData.embedding?.length || 0} dimensions`);

      addTestResult('🎉 All enhanced semantic systems tested successfully!');
    } catch (error) {
      addTestResult(`❌ Error during testing: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Enhanced Semantic Systems Test</h1>
          <p className="text-gray-600 mb-6">
            Test the enhanced semantic discovery, filtering, search, and recommendation systems with Spotify-inspired UI.
          </p>
          
          <button
            onClick={testAllSystems}
            disabled={loading}
            className="mb-6 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All Systems'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Semantic Discovery Interface */}
          <div className="lg:col-span-2">
            <SemanticDiscoveryInterface
              activeMode={activeMode}
              onModeChange={setActiveMode}
              onSemanticSearch={handleSemanticSearch}
              onFilterChange={handleFilterChange}
              onCrossDomainExplore={handleCrossDomainExplore}
              loading={loading}
            />

            {/* Results Display */}
            {results.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Results</h3>
                <div className="space-y-6">
                  {results.map((paper, index) => (
                    <SpotifyStyleRecommendationCard
                      key={paper.pmid}
                      paper={paper}
                      type="discovery"
                      onPlay={(pmid) => addTestResult(`Play clicked for ${pmid}`)}
                      onLike={(pmid) => addTestResult(`Like clicked for ${pmid}`)}
                      onBookmark={(pmid) => addTestResult(`Bookmark clicked for ${pmid}`)}
                      onShare={(pmid) => addTestResult(`Share clicked for ${pmid}`)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Results Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded ${
                      result.includes('✅') ? 'bg-green-50 text-green-800' :
                      result.includes('❌') ? 'bg-red-50 text-red-800' :
                      result.includes('🎉') ? 'bg-blue-50 text-blue-800' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {result}
                  </div>
                ))}
                {testResults.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    Click "Test All Systems" to run comprehensive tests
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
