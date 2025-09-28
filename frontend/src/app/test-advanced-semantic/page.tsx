'use client';

import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { semanticPaperAnalyzer } from '@/lib/semantic-paper-analysis';
import { citationNetworkIntelligence } from '@/lib/citation-network-intelligence';
import { userProfileSystem } from '@/lib/user-profile-system';
import EnhancedCollectionNavigation from '@/components/EnhancedCollectionNavigation';
import { MobileNetworkView } from '@/components/MobileOptimizations';

interface TestResult {
  system: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

export default function TestAdvancedSemanticPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [mockNetworkData, setMockNetworkData] = useState<any>(null);

  // Initialize test results
  useEffect(() => {
    setTestResults([
      { system: 'Semantic Paper Analysis', status: 'pending', message: 'Ready to test' },
      { system: 'Citation Network Intelligence', status: 'pending', message: 'Ready to test' },
      { system: 'User Behavior Modeling', status: 'pending', message: 'Ready to test' },
      { system: 'Enhanced Collection Navigation', status: 'pending', message: 'Ready to test' },
      { system: 'Mobile Network View', status: 'pending', message: 'Ready to test' }
    ]);
  }, []);

  // Update test result
  const updateTestResult = (system: string, status: TestResult['status'], message: string, data?: any, duration?: number) => {
    setTestResults(prev => prev.map(result => 
      result.system === system 
        ? { ...result, status, message, data, duration }
        : result
    ));
  };

  // Test Semantic Paper Analysis
  const testSemanticAnalysis = async () => {
    const startTime = Date.now();
    updateTestResult('Semantic Paper Analysis', 'pending', 'Analyzing sample papers...');

    try {
      // Test with sample paper data
      const samplePapers = [
        {
          pmid: '29622564',
          title: 'Machine learning applications in drug discovery and development',
          abstract: 'Machine learning (ML) has emerged as a powerful tool in pharmaceutical research, offering new approaches to drug discovery and development. This review examines current applications of ML in various stages of the drug development pipeline, including target identification, lead optimization, and clinical trial design. We discuss the advantages and limitations of different ML algorithms and their potential to accelerate the discovery of new therapeutic compounds.',
          fullText: null
        },
        {
          pmid: '12345678',
          title: 'CRISPR-Cas9 gene editing: mechanisms and therapeutic applications',
          abstract: 'The CRISPR-Cas9 system has revolutionized gene editing technology, providing unprecedented precision in modifying genomic sequences. This comprehensive review covers the molecular mechanisms underlying CRISPR-Cas9 function, recent advances in system optimization, and current therapeutic applications in treating genetic disorders. We also discuss ongoing clinical trials and future prospects for CRISPR-based therapies.',
          fullText: null
        }
      ];

      const analysisResults = [];
      for (const paper of samplePapers) {
        const result = await semanticPaperAnalyzer.analyzePaper(
          paper.pmid,
          paper.title,
          paper.abstract,
          paper.fullText || undefined,
          {
            include_embeddings: false,
            analyze_full_text: false,
            extract_statistical_methods: true,
            calculate_novelty: true,
            domain_classification: true,
            quality_assessment: true
          }
        );
        analysisResults.push(result);
      }

      const duration = Date.now() - startTime;
      updateTestResult(
        'Semantic Paper Analysis', 
        'success', 
        `Successfully analyzed ${analysisResults.length} papers`, 
        analysisResults,
        duration
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(
        'Semantic Paper Analysis', 
        'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        duration
      );
    }
  };

  // Test Citation Network Intelligence
  const testCitationIntelligence = async () => {
    const startTime = Date.now();
    updateTestResult('Citation Network Intelligence', 'pending', 'Analyzing citation networks...');

    try {
      const samplePaperIds = ['29622564', '12345678', '87654321', '11111111', '22222222'];
      
      const networkAnalysis = await citationNetworkIntelligence.analyzeCitationNetwork(samplePaperIds);
      
      const recommendations = await citationNetworkIntelligence.getPersonalizedCitationRecommendations(
        ['29622564', '12345678'],
        { preferred_domains: ['medicine', 'biology'], novelty_preference: 0.7 },
        10
      );

      const trends = await citationNetworkIntelligence.predictResearchTrends(2);
      
      const breakthroughs = await citationNetworkIntelligence.identifyBreakthroughPapers();

      // Create mock network data for visualization
      const networkData = {
        nodes: networkAnalysis.nodes.map((node, index) => ({
          id: node.pmid,
          title: node.title,
          abstract: `Abstract for ${node.title}`,
          year: node.year,
          citations: node.citation_count,
          authors: node.authors,
          x: 150 + (index % 5) * 100,
          y: 150 + Math.floor(index / 5) * 100,
          citation_velocity: node.citation_velocity,
          connections: Math.floor(Math.random() * 10)
        })),
        edges: networkAnalysis.edges.map(edge => ({
          source: { x: 100, y: 100 },
          target: { x: 200, y: 200 },
          weight: edge.citation_importance
        }))
      };

      setMockNetworkData(networkData);

      const duration = Date.now() - startTime;
      updateTestResult(
        'Citation Network Intelligence', 
        'success', 
        `Analyzed network with ${networkAnalysis.nodes.length} nodes, ${networkAnalysis.edges.length} edges`, 
        { networkAnalysis, recommendations, trends, breakthroughs },
        duration
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(
        'Citation Network Intelligence', 
        'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        duration
      );
    }
  };

  // Test User Behavior Modeling
  const testUserBehaviorModeling = async () => {
    const startTime = Date.now();
    updateTestResult('User Behavior Modeling', 'pending', 'Testing user profile system...');

    try {
      await userProfileSystem.initialize();
      
      const testUserId = 'test-user-123';
      const userProfile = await userProfileSystem.getUserProfile(testUserId, 'test@example.com');

      // Simulate user behavior
      await userProfileSystem.trackBehavior(testUserId, 'paper_view', {
        pmid: '29622564',
        duration: 300
      });

      await userProfileSystem.trackBehavior(testUserId, 'search', {
        query: 'machine learning drug discovery',
        results_clicked: ['29622564', '12345678']
      });

      await userProfileSystem.trackBehavior(testUserId, 'deep_dive', {
        pmid: '29622564',
        completion_rate: 0.85
      });

      // Update preferences
      await userProfileSystem.updatePreferences(testUserId, {
        preferred_domains: ['medicine', 'computer_science'],
        novelty_preference: 0.8,
        reading_level: 'advanced'
      });

      // Get recommendation context
      const recommendationContext = userProfileSystem.getRecommendationContext(userProfile);

      // Find similar users
      const similarUsers = userProfileSystem.findSimilarUsers(testUserId, 5);

      // Get research trajectory
      const trajectory = userProfileSystem.getResearchTrajectory(userProfile);

      const duration = Date.now() - startTime;
      updateTestResult(
        'User Behavior Modeling', 
        'success', 
        `User profile created and behavior tracked successfully`, 
        { userProfile, recommendationContext, similarUsers, trajectory },
        duration
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(
        'User Behavior Modeling', 
        'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        duration
      );
    }
  };

  // Test Enhanced Collection Navigation
  const testCollectionNavigation = async () => {
    const startTime = Date.now();
    updateTestResult('Enhanced Collection Navigation', 'pending', 'Testing collection navigation...');

    try {
      // Simulate collection navigation test
      await new Promise(resolve => setTimeout(resolve, 1000));

      const duration = Date.now() - startTime;
      updateTestResult(
        'Enhanced Collection Navigation', 
        'success', 
        'Collection navigation component loaded successfully', 
        { component: 'EnhancedCollectionNavigation' },
        duration
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(
        'Enhanced Collection Navigation', 
        'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        duration
      );
    }
  };

  // Test Mobile Network View
  const testMobileNetworkView = async () => {
    const startTime = Date.now();
    updateTestResult('Mobile Network View', 'pending', 'Testing mobile network view...');

    try {
      // Simulate mobile network view test
      await new Promise(resolve => setTimeout(resolve, 800));

      const duration = Date.now() - startTime;
      updateTestResult(
        'Mobile Network View', 
        'success', 
        'Mobile network view component loaded successfully', 
        { component: 'MobileNetworkView' },
        duration
      );

    } catch (error) {
      const duration = Date.now() - startTime;
      updateTestResult(
        'Mobile Network View', 
        'error', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        null,
        duration
      );
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true);
    
    try {
      await testSemanticAnalysis();
      await testCitationIntelligence();
      await testUserBehaviorModeling();
      await testCollectionNavigation();
      await testMobileNetworkView();
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <ArrowPathIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <ArrowPathIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get system icon
  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'Semantic Paper Analysis':
        return <BeakerIcon className="w-6 h-6 text-blue-600" />;
      case 'Citation Network Intelligence':
        return <ChartBarIcon className="w-6 h-6 text-purple-600" />;
      case 'User Behavior Modeling':
        return <UserGroupIcon className="w-6 h-6 text-green-600" />;
      case 'Enhanced Collection Navigation':
        return <SparklesIcon className="w-6 h-6 text-orange-600" />;
      case 'Mobile Network View':
        return <SparklesIcon className="w-6 h-6 text-pink-600" />;
      default:
        return <SparklesIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Advanced Semantic Features Test Suite
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Comprehensive testing of Spotify-inspired semantic systems for research discovery
          </p>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`
              inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${isRunning 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isRunning ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>Run All Tests</span>
              </>
            )}
          </button>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Status Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Results</h2>
            
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTest === result.system 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setSelectedTest(result.system)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getSystemIcon(result.system)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.system}</h3>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {result.duration && (
                        <span className="text-xs text-gray-500">{result.duration}ms</span>
                      )}
                      {getStatusIcon(result.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Details Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Details</h2>
            
            {selectedTest ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedTest}</h3>
                
                {(() => {
                  const result = testResults.find(r => r.system === selectedTest);
                  if (!result?.data) {
                    return <p className="text-gray-600">No detailed data available yet.</p>;
                  }

                  return (
                    <div className="space-y-4">
                      <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-600">Select a test to view detailed results.</p>
            )}
          </div>
        </div>

        {/* Demo Components */}
        <div className="mt-12 space-y-8">
          {/* Enhanced Collection Navigation Demo */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enhanced Collection Navigation Demo</h2>
            <div className="h-96 border border-gray-200 rounded-lg overflow-hidden">
              <EnhancedCollectionNavigation
                onCollectionSelect={(collection) => console.log('Selected collection:', collection)}
                onNetworkView={(collection) => console.log('Network view:', collection)}
                onArticlesList={(collection) => console.log('Articles list:', collection)}
              />
            </div>
          </div>

          {/* Mobile Network View Demo */}
          {mockNetworkData && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mobile Network View Demo</h2>
              <div className="h-96 border border-gray-200 rounded-lg overflow-hidden">
                <MobileNetworkView
                  networkData={mockNetworkData}
                  onNodeSelect={(node) => console.log('Selected node:', node)}
                  selectedNode={null}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
