'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface TestResult {
  timestamp: string;
  test: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

export default function TestEnhancedExtractionPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testPmid, setTestPmid] = useState('29622564'); // Default test PMID
  const [testTitle, setTestTitle] = useState('');

  const addTestResult = (test: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      message,
      data
    };
    setTestResults(prev => [...prev, result]);
    console.log(`[${test}] ${status.toUpperCase()}: ${message}`, data);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('System', 'info', 'Starting comprehensive enhanced extraction test...');

    try {
      // Test 1: Enhanced OA Detection
      addTestResult('OA Detection', 'info', `Testing enhanced OA detection for PMID: ${testPmid}`);
      
      const { enhancedOADetection } = await import('@/lib/enhanced-oa-detection');
      const oaInfo = await enhancedOADetection.detectOpenAccess(testPmid);
      
      addTestResult('OA Detection', 'success', `OA Detection completed`, {
        is_open_access: oaInfo.is_open_access,
        source: oaInfo.source,
        confidence: oaInfo.confidence,
        access_type: oaInfo.access_type,
        has_full_text_url: !!oaInfo.full_text_url,
        has_pdf_url: !!oaInfo.pdf_url,
        pmc_id: oaInfo.pmc_id
      });

      // Test 2: Enhanced Content Extraction
      addTestResult('Content Extraction', 'info', 'Testing enhanced content extraction...');
      
      const contentResult = await enhancedOADetection.extractContent(oaInfo);
      
      addTestResult('Content Extraction', contentResult.success ? 'success' : 'error', 
        `Content extraction ${contentResult.success ? 'successful' : 'failed'}`, {
        success: contentResult.success,
        source: contentResult.source,
        quality_score: contentResult.quality_score,
        extraction_method: contentResult.extraction_method,
        char_count: contentResult.char_count,
        has_title: !!contentResult.title,
        has_abstract: !!contentResult.abstract,
        has_full_text: !!contentResult.full_text,
        error: contentResult.error
      });

      // Test 3: Enhanced Deep Dive V2 API
      addTestResult('Deep Dive V2', 'info', 'Testing enhanced deep dive V2 API...');
      
      const deepDivePayload = {
        pmid: testPmid,
        title: testTitle || undefined,
        objective: `Test enhanced deep dive analysis for PMID ${testPmid}`,
        doi: oaInfo.doi
      };

      const deepDiveResponse = await fetch('/api/proxy/deep-dive-enhanced-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'test-user@example.com'
        },
        body: JSON.stringify(deepDivePayload)
      });

      if (deepDiveResponse.ok) {
        const deepDiveResult = await deepDiveResponse.json();
        
        const hasModel = !!deepDiveResult.model_description_structured;
        const hasMethods = !!deepDiveResult.methods_structured;
        const hasResults = !!deepDiveResult.results_structured;
        const hasContent = hasModel || hasMethods || hasResults;

        addTestResult('Deep Dive V2', hasContent ? 'success' : 'error', 
          `Enhanced deep dive analysis ${hasContent ? 'successful' : 'returned empty content'}`, {
          enhanced_analysis: deepDiveResult.enhanced_analysis,
          version: deepDiveResult.version,
          analysis_mode: deepDiveResult.analysis_mode,
          has_model_analysis: hasModel,
          has_methods_analysis: hasMethods,
          has_results_analysis: hasResults,
          oa_detection: deepDiveResult.oa_detection,
          content_extraction: deepDiveResult.content_extraction,
          analysis_quality: deepDiveResult.analysis_quality,
          note: deepDiveResult.note
        });

        // Test content quality
        if (hasContent) {
          const modelSections = deepDiveResult.model_description_structured?.length || 0;
          const methodsSections = deepDiveResult.methods_structured?.length || 0;
          const resultsSections = deepDiveResult.results_structured?.length || 0;
          
          addTestResult('Content Quality', 'success', 'Content quality analysis completed', {
            model_sections: modelSections,
            methods_sections: methodsSections,
            results_sections: resultsSections,
            total_sections: modelSections + methodsSections + resultsSections,
            quality_score: deepDiveResult.analysis_quality?.overall_completeness || 0
          });
        }

      } else {
        const errorResult = await deepDiveResponse.json();
        addTestResult('Deep Dive V2', 'error', `Enhanced deep dive failed: ${errorResult.error}`, errorResult);
      }

      // Test 4: Compare with Original API
      addTestResult('Comparison', 'info', 'Comparing with original deep dive API...');
      
      const originalPayload = {
        pmid: testPmid,
        title: testTitle || `Test analysis for PMID ${testPmid}`,
        objective: `Original deep dive analysis for PMID ${testPmid}`
      };

      const originalResponse = await fetch('/api/proxy/deep-dive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'test-user@example.com'
        },
        body: JSON.stringify(originalPayload)
      });

      if (originalResponse.ok) {
        const originalResult = await originalResponse.json();
        
        const originalHasModel = !!originalResult.model_description_structured;
        const originalHasMethods = !!originalResult.methods_structured;
        const originalHasResults = !!originalResult.results_structured;
        const originalHasContent = originalHasModel || originalHasMethods || originalHasResults;

        addTestResult('Comparison', 'info', 'Original API comparison completed', {
          original_has_content: originalHasContent,
          original_has_model: originalHasModel,
          original_has_methods: originalHasMethods,
          original_has_results: originalHasResults,
          comparison: 'Enhanced V2 vs Original API'
        });

      } else {
        const originalError = await originalResponse.json();
        addTestResult('Comparison', 'error', `Original API failed: ${originalError.error}`, originalError);
      }

      // Test 5: Cache Performance
      addTestResult('Cache', 'info', 'Testing cache performance...');
      
      const cacheStats = enhancedOADetection.getCacheStats();
      addTestResult('Cache', 'success', 'Cache statistics retrieved', cacheStats);

      // Test 6: Multiple PMIDs
      addTestResult('Batch Test', 'info', 'Testing multiple PMIDs...');
      
      const testPmids = ['29622564', '33462507', '32123456']; // Mix of valid and invalid
      const batchResults = [];

      for (const pmid of testPmids) {
        try {
          const batchOaInfo = await enhancedOADetection.detectOpenAccess(pmid);
          batchResults.push({
            pmid,
            is_open_access: batchOaInfo.is_open_access,
            source: batchOaInfo.source,
            confidence: batchOaInfo.confidence
          });
        } catch (error) {
          batchResults.push({
            pmid,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      addTestResult('Batch Test', 'success', `Batch test completed for ${testPmids.length} PMIDs`, {
        results: batchResults,
        success_rate: batchResults.filter(r => !r.error).length / batchResults.length
      });

      addTestResult('System', 'success', '🎉 Comprehensive enhanced extraction test completed successfully!');

    } catch (error) {
      addTestResult('System', 'error', `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickTest = async () => {
    setIsRunning(true);
    clearResults();
    
    addTestResult('Quick Test', 'info', `Running quick test for PMID: ${testPmid}`);

    try {
      const response = await fetch('/api/proxy/deep-dive-enhanced-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': 'test-user@example.com'
        },
        body: JSON.stringify({
          pmid: testPmid,
          title: testTitle || undefined,
          objective: `Quick test for PMID ${testPmid}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        const hasContent = !!(result.model_description_structured || result.methods_structured || result.results_structured);
        
        addTestResult('Quick Test', hasContent ? 'success' : 'error', 
          `Quick test ${hasContent ? 'successful' : 'returned empty content'}`, {
          enhanced_analysis: result.enhanced_analysis,
          version: result.version,
          has_content: hasContent,
          oa_status: result.oa_detection?.is_open_access,
          content_quality: result.content_extraction?.quality_score
        });
      } else {
        const errorResult = await response.json();
        addTestResult('Quick Test', 'error', `Quick test failed: ${errorResult.error}`, errorResult);
      }

    } catch (error) {
      addTestResult('Quick Test', 'error', `Quick test error: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Enhanced Content Extraction Test</h1>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Enhanced OA Detection V2</span>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test PMID</label>
              <Input
                value={testPmid}
                onChange={(e) => setTestPmid(e.target.value)}
                placeholder="Enter PMID to test"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Title (Optional)</label>
              <Input
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Enter article title (optional)"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={runQuickTest} 
              disabled={isRunning || !testPmid}
              variant="outline"
            >
              {isRunning ? 'Running...' : 'Quick Test'}
            </Button>
            <Button 
              onClick={runComprehensiveTest} 
              disabled={isRunning || !testPmid}
            >
              {isRunning ? 'Running...' : 'Comprehensive Test'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="secondary"
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({testResults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No test results yet. Run a test to see results.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'success' ? 'bg-green-100 text-green-800' :
                        result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {result.test}
                      </span>
                      <span className="text-sm text-gray-500">{result.timestamp}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{result.message}</p>
                  {result.data && (
                    <textarea
                      value={JSON.stringify(result.data, null, 2)}
                      readOnly
                      className="w-full text-xs font-mono h-32 p-2 border rounded bg-gray-50"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
