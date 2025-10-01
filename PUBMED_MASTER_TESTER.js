/**
 * PUBMED MASTER TESTER v1.0
 * 
 * Master testing suite that orchestrates all PubMed recommendation tests:
 * - PUBMED_RECOMMENDATIONS_TESTER.js - Core recommendation functionality
 * - PUBMED_XML_PARSER_TESTER.js - XML parsing and API integration
 * - PUBMED_WORKFLOW_TESTER.js - End-to-end workflow testing
 * 
 * This script loads and runs all PubMed test suites in sequence and provides
 * a comprehensive summary of all test results.
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class PubMedMasterTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        this.testSuites = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const elapsed = Date.now() - this.startTime;
        const logEntry = { timestamp, type, message, data, elapsed };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'master': '🎯',
            'suite': '📦',
            'summary': '📊',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async loadTestSuite(suiteName, suiteClass) {
        this.log(`📦 Loading test suite: ${suiteName}`, 'suite');
        
        try {
            if (typeof suiteClass === 'undefined') {
                throw new Error(`${suiteName} class not found. Make sure the script is loaded.`);
            }
            
            const suite = new suiteClass();
            this.testSuites.push({
                name: suiteName,
                instance: suite,
                loaded: true
            });
            
            this.log(`✅ Successfully loaded: ${suiteName}`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ Failed to load ${suiteName}: ${error.message}`, 'error');
            this.testSuites.push({
                name: suiteName,
                instance: null,
                loaded: false,
                error: error.message
            });
            return false;
        }
    }

    async runTestSuite(suiteName, runMethod) {
        this.log(`🧪 Running test suite: ${suiteName}`, 'test');
        
        const suite = this.testSuites.find(s => s.name === suiteName);
        if (!suite || !suite.loaded) {
            this.log(`❌ Cannot run ${suiteName}: Suite not loaded`, 'error');
            return {
                success: false,
                error: 'Suite not loaded',
                suiteName: suiteName
            };
        }

        try {
            const startTime = Date.now();
            const results = await suite.instance[runMethod]();
            const duration = Date.now() - startTime;
            
            this.log(`✅ Completed ${suiteName}: ${duration}ms`, 'success', {
                duration: duration,
                successRate: results.summary?.successRate || 'N/A'
            });
            
            return {
                success: true,
                suiteName: suiteName,
                duration: duration,
                results: results
            };
        } catch (error) {
            this.log(`❌ Error running ${suiteName}: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                suiteName: suiteName
            };
        }
    }

    generateComprehensiveSummary(allResults) {
        this.log('📊 Generating comprehensive summary', 'summary');
        
        const summary = {
            testExecution: {
                totalSuites: allResults.length,
                successfulSuites: allResults.filter(r => r.success).length,
                failedSuites: allResults.filter(r => !r.success).length,
                totalDuration: allResults.reduce((total, r) => total + (r.duration || 0), 0)
            },
            testResults: {},
            overallMetrics: {
                totalTests: 0,
                successfulTests: 0,
                failedTests: 0,
                totalPapersFound: 0,
                averageSuccessRate: 0,
                averageAccuracy: 0
            },
            recommendations: []
        };

        // Analyze each suite's results
        allResults.forEach(suiteResult => {
            if (suiteResult.success && suiteResult.results) {
                const results = suiteResult.results;
                summary.testResults[suiteResult.suiteName] = {
                    success: true,
                    summary: results.summary || {},
                    keyMetrics: {
                        successRate: results.summary?.successRate || 0,
                        totalTests: results.summary?.totalTests || 0,
                        duration: suiteResult.duration
                    }
                };

                // Aggregate metrics
                summary.overallMetrics.totalTests += results.summary?.totalTests || 0;
                summary.overallMetrics.successfulTests += results.summary?.successfulTests || 0;
                summary.overallMetrics.failedTests += results.summary?.failedTests || 0;
                summary.overallMetrics.totalPapersFound += results.summary?.totalPapersFound || 0;
            } else {
                summary.testResults[suiteResult.suiteName] = {
                    success: false,
                    error: suiteResult.error
                };
            }
        });

        // Calculate averages
        const successfulSuites = allResults.filter(r => r.success && r.results?.summary);
        if (successfulSuites.length > 0) {
            summary.overallMetrics.averageSuccessRate = Math.round(
                successfulSuites.reduce((sum, r) => sum + (r.results.summary.successRate || 0), 0) / successfulSuites.length
            );
            
            const accuracySuites = successfulSuites.filter(r => r.results.summary.averageAccuracy !== undefined);
            if (accuracySuites.length > 0) {
                summary.overallMetrics.averageAccuracy = Math.round(
                    accuracySuites.reduce((sum, r) => sum + r.results.summary.averageAccuracy, 0) / accuracySuites.length
                );
            }
        }

        // Generate recommendations
        if (summary.overallMetrics.averageSuccessRate < 80) {
            summary.recommendations.push('🔧 Consider investigating failed tests to improve system reliability');
        }
        if (summary.overallMetrics.averageAccuracy < 85) {
            summary.recommendations.push('🎯 XML parsing accuracy could be improved');
        }
        if (summary.overallMetrics.totalPapersFound < 50) {
            summary.recommendations.push('📚 PubMed API might be returning fewer results than expected');
        }
        if (summary.testExecution.totalDuration > 60000) {
            summary.recommendations.push('⚡ Consider optimizing API response times');
        }
        if (summary.recommendations.length === 0) {
            summary.recommendations.push('🎉 All PubMed recommendation systems are performing excellently!');
        }

        return summary;
    }

    async runAllPubMedTests() {
        this.log('🎯 STARTING COMPREHENSIVE PUBMED MASTER TEST SUITE', 'master');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');
        
        const masterResults = {
            startTime: new Date().toISOString(),
            testConfiguration: {
                baseUrl: this.baseUrl,
                backendUrl: this.backendUrl,
                testUserId: this.testUserId
            },
            suiteResults: [],
            summary: null
        };

        // Load all test suites
        this.log('📦 Loading all PubMed test suites...', 'suite');
        await this.loadTestSuite('PubMedRecommendationsTester', window.PubMedRecommendationsTester);
        await this.loadTestSuite('PubMedXMLParserTester', window.PubMedXMLParserTester);
        await this.loadTestSuite('PubMedWorkflowTester', window.PubMedWorkflowTester);

        // Run all test suites
        this.log('🧪 Running all PubMed test suites...', 'test');
        
        const suiteConfigs = [
            { name: 'PubMedRecommendationsTester', method: 'runComprehensivePubMedTest' },
            { name: 'PubMedXMLParserTester', method: 'runComprehensiveXMLParserTest' },
            { name: 'PubMedWorkflowTester', method: 'runComprehensiveWorkflowTest' }
        ];

        for (const config of suiteConfigs) {
            const result = await this.runTestSuite(config.name, config.method);
            masterResults.suiteResults.push(result);
            
            // Add delay between test suites to avoid overwhelming the API
            if (config !== suiteConfigs[suiteConfigs.length - 1]) {
                this.log('⏳ Waiting 2 seconds before next test suite...', 'info');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Generate comprehensive summary
        masterResults.summary = this.generateComprehensiveSummary(masterResults.suiteResults);
        masterResults.endTime = new Date().toISOString();
        masterResults.totalDuration = Date.now() - this.startTime;

        // Log final results
        this.log('🎉 COMPREHENSIVE PUBMED MASTER TEST COMPLETED', 'success');
        this.log(`✅ Suite Success Rate: ${Math.round((masterResults.summary.testExecution.successfulSuites / masterResults.summary.testExecution.totalSuites) * 100)}%`, 'success');
        this.log(`🎯 Overall Test Success Rate: ${masterResults.summary.overallMetrics.averageSuccessRate}%`, 'success');
        this.log(`📚 Total Papers Found: ${masterResults.summary.overallMetrics.totalPapersFound}`, 'success');
        this.log(`⏱️ Total Duration: ${masterResults.totalDuration}ms`, 'info');

        // Log recommendations
        this.log('💡 RECOMMENDATIONS:', 'summary');
        masterResults.summary.recommendations.forEach(rec => {
            this.log(rec, 'info');
        });

        // Store results globally
        window.pubmedMasterTestResults = masterResults;
        window.pubmedMasterTestLogs = this.results;

        return masterResults;
    }

    displayTestSummary() {
        if (!window.pubmedMasterTestResults) {
            console.log('❌ No master test results found. Run the tests first.');
            return;
        }

        const results = window.pubmedMasterTestResults;
        const summary = results.summary;

        console.log('\n🎯 PUBMED MASTER TEST SUMMARY');
        console.log('═══════════════════════════════════════');
        console.log(`📊 Test Execution:`);
        console.log(`   • Total Suites: ${summary.testExecution.totalSuites}`);
        console.log(`   • Successful: ${summary.testExecution.successfulSuites}`);
        console.log(`   • Failed: ${summary.testExecution.failedSuites}`);
        console.log(`   • Duration: ${Math.round(summary.testExecution.totalDuration / 1000)}s`);
        
        console.log(`\n🎯 Overall Metrics:`);
        console.log(`   • Total Tests: ${summary.overallMetrics.totalTests}`);
        console.log(`   • Success Rate: ${summary.overallMetrics.averageSuccessRate}%`);
        console.log(`   • Papers Found: ${summary.overallMetrics.totalPapersFound}`);
        console.log(`   • Average Accuracy: ${summary.overallMetrics.averageAccuracy}%`);
        
        console.log(`\n💡 Recommendations:`);
        summary.recommendations.forEach(rec => console.log(`   • ${rec}`));
        
        console.log('\n📋 Detailed results available in: window.pubmedMasterTestResults');
    }
}

// Auto-execute when script is loaded
console.log('🎯 PubMed Master Tester v1.0 loaded');
console.log('📋 Usage: const tester = new PubMedMasterTester(); await tester.runAllPubMedTests();');
console.log('📊 Summary: tester.displayTestSummary();');
console.log('📝 Results will be stored in: window.pubmedMasterTestResults');

// Create global instance for easy access
window.PubMedMasterTester = PubMedMasterTester;
