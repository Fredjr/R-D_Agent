/**
 * PUBMED RECOMMENDATION WORKFLOW TESTER v1.0
 * 
 * End-to-end testing suite for PubMed recommendation workflow including:
 * - Complete recommendation pipeline testing
 * - User activity simulation and tracking
 * - Weekly mix automation with PubMed integration
 * - Recommendation engine enhancement validation
 * - Performance and load testing
 * - Integration with existing recommendation systems
 * - User experience flow testing
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class PubMedWorkflowTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        
        // Simulate user research interests
        this.userProfile = {
            domains: ['genetics', 'biotechnology', 'machine learning', 'diabetes', 'nephrology'],
            recentPapers: [
                { pmid: '29622564', title: 'CRISPR gene editing', domain: 'genetics' },
                { pmid: '32887946', title: 'COVID-19 research', domain: 'biotechnology' },
                { pmid: '33462507', title: 'Machine learning applications', domain: 'machine learning' }
            ],
            searchHistory: ['CRISPR', 'diabetes treatment', 'machine learning healthcare', 'nephrology biomarkers']
        };
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
            'workflow': '🔄',
            'user': '👤',
            'performance': '⚡',
            'integration': '🔗',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testCompleteRecommendationPipeline() {
        this.log('🔄 TESTING COMPLETE RECOMMENDATION PIPELINE', 'workflow');
        
        const pipelineResults = {};
        const testPaper = this.userProfile.recentPapers[0];

        // Step 1: Get similar papers
        this.log(`Step 1: Getting similar papers for ${testPaper.pmid}`, 'workflow');
        try {
            const similarResponse = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'similar',
                    pmid: testPaper.pmid,
                    limit: 10
                })
            });

            if (similarResponse.ok) {
                const similarData = await similarResponse.json();
                pipelineResults.similarPapers = {
                    success: true,
                    count: similarData.recommendations?.length || 0,
                    papers: similarData.recommendations || []
                };
                this.log(`✅ Step 1 completed: ${similarData.recommendations?.length || 0} similar papers found`, 'success');
            } else {
                pipelineResults.similarPapers = { success: false, error: `HTTP ${similarResponse.status}` };
                this.log(`❌ Step 1 failed: HTTP ${similarResponse.status}`, 'error');
            }
        } catch (error) {
            pipelineResults.similarPapers = { success: false, error: error.message };
            this.log(`❌ Step 1 error: ${error.message}`, 'error');
        }

        // Step 2: Get citing papers
        this.log(`Step 2: Getting citing papers for ${testPaper.pmid}`, 'workflow');
        try {
            const citingResponse = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'citing',
                    pmid: testPaper.pmid,
                    limit: 10
                })
            });

            if (citingResponse.ok) {
                const citingData = await citingResponse.json();
                pipelineResults.citingPapers = {
                    success: true,
                    count: citingData.recommendations?.length || 0,
                    papers: citingData.recommendations || []
                };
                this.log(`✅ Step 2 completed: ${citingData.recommendations?.length || 0} citing papers found`, 'success');
            } else {
                pipelineResults.citingPapers = { success: false, error: `HTTP ${citingResponse.status}` };
                this.log(`❌ Step 2 failed: HTTP ${citingResponse.status}`, 'error');
            }
        } catch (error) {
            pipelineResults.citingPapers = { success: false, error: error.message };
            this.log(`❌ Step 2 error: ${error.message}`, 'error');
        }

        // Step 3: Get trending papers for user domains
        this.log(`Step 3: Getting trending papers for user domains`, 'workflow');
        try {
            const trendingResponse = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'trending',
                    user_domains: this.userProfile.domains.slice(0, 3),
                    limit: 15
                })
            });

            if (trendingResponse.ok) {
                const trendingData = await trendingResponse.json();
                pipelineResults.trendingPapers = {
                    success: true,
                    count: trendingData.recommendations?.length || 0,
                    papers: trendingData.recommendations || []
                };
                this.log(`✅ Step 3 completed: ${trendingData.recommendations?.length || 0} trending papers found`, 'success');
            } else {
                pipelineResults.trendingPapers = { success: false, error: `HTTP ${trendingResponse.status}` };
                this.log(`❌ Step 3 failed: HTTP ${trendingResponse.status}`, 'error');
            }
        } catch (error) {
            pipelineResults.trendingPapers = { success: false, error: error.message };
            this.log(`❌ Step 3 error: ${error.message}`, 'error');
        }

        // Calculate pipeline success
        const successfulSteps = Object.values(pipelineResults).filter(step => step.success).length;
        const totalPapersFound = Object.values(pipelineResults).reduce((total, step) => 
            total + (step.count || 0), 0);

        this.log(`🔄 Pipeline completed: ${successfulSteps}/3 steps successful, ${totalPapersFound} total papers`, 
                successfulSteps === 3 ? 'success' : 'warning');

        return {
            success: successfulSteps === 3,
            successfulSteps: successfulSteps,
            totalSteps: 3,
            totalPapersFound: totalPapersFound,
            pipelineResults: pipelineResults
        };
    }

    async testUserActivitySimulation() {
        this.log('👤 TESTING USER ACTIVITY SIMULATION', 'user');
        
        const activityResults = {};

        // Simulate user viewing papers
        this.log('Simulating user paper viewing activity', 'user');
        const viewedPapers = this.userProfile.recentPapers.slice(0, 2);
        
        for (const paper of viewedPapers) {
            try {
                // Simulate getting paper details
                const detailsResponse = await fetch(`/api/proxy/pubmed/details/${paper.pmid}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    }
                });

                if (detailsResponse.ok) {
                    const detailsData = await detailsResponse.json();
                    activityResults[paper.pmid] = {
                        success: true,
                        hasDetails: !!detailsData.title,
                        paperTitle: detailsData.title?.substring(0, 50) + '...' || 'Unknown'
                    };
                    this.log(`✅ Viewed paper ${paper.pmid}: ${detailsData.title?.substring(0, 30) || 'Unknown'}...`, 'success');
                } else {
                    activityResults[paper.pmid] = {
                        success: false,
                        error: `HTTP ${detailsResponse.status}`
                    };
                    this.log(`❌ Failed to view paper ${paper.pmid}: HTTP ${detailsResponse.status}`, 'error');
                }
            } catch (error) {
                activityResults[paper.pmid] = {
                    success: false,
                    error: error.message
                };
                this.log(`❌ Error viewing paper ${paper.pmid}: ${error.message}`, 'error');
            }
        }

        const successfulViews = Object.values(activityResults).filter(result => result.success).length;
        
        return {
            success: successfulViews > 0,
            totalPapersViewed: viewedPapers.length,
            successfulViews: successfulViews,
            activityResults: activityResults
        };
    }

    async testWeeklyMixAutomation() {
        this.log('🎵 TESTING WEEKLY MIX AUTOMATION WITH PUBMED', 'workflow');
        
        try {
            // Test weekly mix generation
            const weeklyMixResponse = await fetch(`/api/proxy/recommendations/weekly/${this.testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            });

            if (weeklyMixResponse.ok) {
                const weeklyMixData = await weeklyMixResponse.json();
                const recommendations = weeklyMixData.recommendations || [];
                
                // Analyze PubMed integration in weekly mix
                const pubmedRecommendations = recommendations.filter(rec => 
                    rec.source === 'pubmed' || 
                    rec.metadata?.source === 'pubmed' ||
                    rec.type?.includes('pubmed')
                );
                
                const analysisResults = {
                    totalRecommendations: recommendations.length,
                    pubmedRecommendations: pubmedRecommendations.length,
                    pubmedIntegrationRate: recommendations.length > 0 ? 
                        Math.round((pubmedRecommendations.length / recommendations.length) * 100) : 0,
                    hasPubMedIntegration: pubmedRecommendations.length > 0,
                    recommendationTypes: [...new Set(recommendations.map(r => r.type))],
                    samplePubMedRec: pubmedRecommendations[0] || null
                };
                
                this.log(`✅ Weekly mix analysis: ${analysisResults.pubmedIntegrationRate}% PubMed integration`, 'success', {
                    total: analysisResults.totalRecommendations,
                    pubmed: analysisResults.pubmedRecommendations,
                    types: analysisResults.recommendationTypes
                });
                
                return {
                    success: true,
                    ...analysisResults
                };
            } else {
                this.log(`❌ Weekly mix test failed: HTTP ${weeklyMixResponse.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${weeklyMixResponse.status}`,
                    pubmedIntegrationRate: 0
                };
            }
        } catch (error) {
            this.log(`❌ Weekly mix test error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                pubmedIntegrationRate: 0
            };
        }
    }

    async testPerformanceAndLoad() {
        this.log('⚡ TESTING PERFORMANCE AND LOAD', 'performance');

        const performanceResults = {};
        const testPmid = this.userProfile.recentPapers[0].pmid;

        // Test concurrent requests
        this.log('Testing concurrent PubMed recommendation requests', 'performance');
        const concurrentRequests = [];
        const requestCount = 5;

        for (let i = 0; i < requestCount; i++) {
            const requestPromise = fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'similar',
                    pmid: testPmid,
                    limit: 5
                })
            }).then(response => ({
                requestId: i,
                status: response.status,
                ok: response.ok,
                timestamp: Date.now()
            })).catch(error => ({
                requestId: i,
                error: error.message,
                timestamp: Date.now()
            }));

            concurrentRequests.push(requestPromise);
        }

        try {
            const startTime = Date.now();
            const results = await Promise.all(concurrentRequests);
            const endTime = Date.now();

            const successfulRequests = results.filter(r => r.ok).length;
            const averageResponseTime = (endTime - startTime) / requestCount;

            performanceResults.concurrentRequests = {
                success: successfulRequests > 0,
                totalRequests: requestCount,
                successfulRequests: successfulRequests,
                failedRequests: requestCount - successfulRequests,
                averageResponseTime: averageResponseTime,
                totalTime: endTime - startTime,
                successRate: Math.round((successfulRequests / requestCount) * 100)
            };

            this.log(`✅ Concurrent requests: ${successfulRequests}/${requestCount} successful, avg ${Math.round(averageResponseTime)}ms`, 'success');
        } catch (error) {
            performanceResults.concurrentRequests = {
                success: false,
                error: error.message
            };
            this.log(`❌ Concurrent requests error: ${error.message}`, 'error');
        }

        // Test response time for different recommendation types
        const recommendationTypes = ['similar', 'citing', 'trending'];
        performanceResults.responseTimesByType = {};

        for (const type of recommendationTypes) {
            this.log(`Testing response time for ${type} recommendations`, 'performance');

            try {
                const startTime = Date.now();
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: type,
                        pmid: type === 'trending' ? undefined : testPmid,
                        user_domains: type === 'trending' ? this.userProfile.domains.slice(0, 2) : undefined,
                        limit: 10
                    })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    performanceResults.responseTimesByType[type] = {
                        success: true,
                        responseTime: responseTime,
                        papersFound: data.recommendations?.length || 0,
                        performanceRating: responseTime < 2000 ? 'excellent' :
                                         responseTime < 5000 ? 'good' : 'needs improvement'
                    };
                    this.log(`✅ ${type} recommendations: ${responseTime}ms (${performanceResults.responseTimesByType[type].performanceRating})`, 'success');
                } else {
                    performanceResults.responseTimesByType[type] = {
                        success: false,
                        responseTime: responseTime,
                        error: `HTTP ${response.status}`
                    };
                    this.log(`❌ ${type} recommendations failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                performanceResults.responseTimesByType[type] = {
                    success: false,
                    error: error.message
                };
                this.log(`❌ ${type} recommendations error: ${error.message}`, 'error');
            }
        }

        return performanceResults;
    }

    async testIntegrationWithExistingRecommendations() {
        this.log('🔗 TESTING INTEGRATION WITH EXISTING RECOMMENDATION SYSTEMS', 'integration');

        const integrationResults = {};

        // Test Papers-for-You integration
        this.log('Testing Papers-for-You PubMed integration', 'integration');
        try {
            const papersForYouResponse = await fetch(`/api/proxy/recommendations/papers-for-you/${this.testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            });

            if (papersForYouResponse.ok) {
                const data = await papersForYouResponse.json();
                const recommendations = data.recommendations || [];
                const pubmedRecs = recommendations.filter(r =>
                    r.source === 'pubmed' || r.metadata?.source === 'pubmed'
                );

                integrationResults.papersForYou = {
                    success: true,
                    totalRecommendations: recommendations.length,
                    pubmedRecommendations: pubmedRecs.length,
                    integrationRate: recommendations.length > 0 ?
                        Math.round((pubmedRecs.length / recommendations.length) * 100) : 0,
                    hasIntegration: pubmedRecs.length > 0
                };

                this.log(`✅ Papers-for-You integration: ${integrationResults.papersForYou.integrationRate}% PubMed content`, 'success');
            } else {
                integrationResults.papersForYou = {
                    success: false,
                    error: `HTTP ${papersForYouResponse.status}`
                };
                this.log(`❌ Papers-for-You integration failed: HTTP ${papersForYouResponse.status}`, 'error');
            }
        } catch (error) {
            integrationResults.papersForYou = {
                success: false,
                error: error.message
            };
            this.log(`❌ Papers-for-You integration error: ${error.message}`, 'error');
        }

        // Test Citation Opportunities integration
        this.log('Testing Citation Opportunities PubMed integration', 'integration');
        try {
            const citationOppsResponse = await fetch(`/api/proxy/recommendations/citation-opportunities/${this.testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            });

            if (citationOppsResponse.ok) {
                const data = await citationOppsResponse.json();
                const recommendations = data.recommendations || [];
                const pubmedRecs = recommendations.filter(r =>
                    r.source === 'pubmed' || r.metadata?.source === 'pubmed'
                );

                integrationResults.citationOpportunities = {
                    success: true,
                    totalRecommendations: recommendations.length,
                    pubmedRecommendations: pubmedRecs.length,
                    integrationRate: recommendations.length > 0 ?
                        Math.round((pubmedRecs.length / recommendations.length) * 100) : 0,
                    hasIntegration: pubmedRecs.length > 0
                };

                this.log(`✅ Citation Opportunities integration: ${integrationResults.citationOpportunities.integrationRate}% PubMed content`, 'success');
            } else {
                integrationResults.citationOpportunities = {
                    success: false,
                    error: `HTTP ${citationOppsResponse.status}`
                };
                this.log(`❌ Citation Opportunities integration failed: HTTP ${citationOppsResponse.status}`, 'error');
            }
        } catch (error) {
            integrationResults.citationOpportunities = {
                success: false,
                error: error.message
            };
            this.log(`❌ Citation Opportunities integration error: ${error.message}`, 'error');
        }

        return integrationResults;
    }

    async runComprehensiveWorkflowTest() {
        this.log('🚀 STARTING COMPREHENSIVE PUBMED WORKFLOW TEST', 'test');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');
        this.log(`User Profile: ${this.userProfile.domains.join(', ')}`, 'info');

        const testResults = {
            startTime: new Date().toISOString(),
            testConfiguration: {
                baseUrl: this.baseUrl,
                backendUrl: this.backendUrl,
                testUserId: this.testUserId,
                userProfile: this.userProfile
            },
            tests: {}
        };

        // Run all workflow tests
        testResults.tests.recommendationPipeline = await this.testCompleteRecommendationPipeline();
        testResults.tests.userActivitySimulation = await this.testUserActivitySimulation();
        testResults.tests.weeklyMixAutomation = await this.testWeeklyMixAutomation();
        testResults.tests.performanceAndLoad = await this.testPerformanceAndLoad();
        testResults.tests.existingIntegration = await this.testIntegrationWithExistingRecommendations();

        // Calculate summary statistics
        const allTests = Object.values(testResults.tests);
        const successfulTests = allTests.filter(test => test.success).length;

        // Calculate total papers found across all tests
        const totalPapersFound = allTests.reduce((total, test) => {
            if (test.totalPapersFound) return total + test.totalPapersFound;
            if (test.totalRecommendations) return total + test.totalRecommendations;
            if (test.pipelineResults) {
                return total + Object.values(test.pipelineResults).reduce((subTotal, result) =>
                    subTotal + (result.count || 0), 0);
            }
            return total;
        }, 0);

        testResults.summary = {
            totalTests: allTests.length,
            successfulTests: successfulTests,
            failedTests: allTests.length - successfulTests,
            successRate: Math.round((successfulTests / allTests.length) * 100),
            totalPapersFound: totalPapersFound,
            endTime: new Date().toISOString(),
            duration: Date.now() - this.startTime
        };

        this.log('🎉 COMPREHENSIVE PUBMED WORKFLOW TEST COMPLETED', 'success');
        this.log(`✅ Success Rate: ${testResults.summary.successRate}% (${testResults.summary.successfulTests}/${testResults.summary.totalTests})`, 'success');
        this.log(`📚 Total Papers Found: ${testResults.summary.totalPapersFound}`, 'success');
        this.log(`⏱️ Total Duration: ${testResults.summary.duration}ms`, 'info');

        // Store results globally
        window.pubmedWorkflowTestResults = testResults;
        window.pubmedWorkflowTestLogs = this.results;

        return testResults;
    }
}

// Auto-execute when script is loaded
console.log('🧪 PubMed Workflow Tester v1.0 loaded');
console.log('📋 Usage: const tester = new PubMedWorkflowTester(); await tester.runComprehensiveWorkflowTest();');
console.log('📊 Results will be stored in: window.pubmedWorkflowTestResults');
console.log('📝 Logs will be stored in: window.pubmedWorkflowTestLogs');

// Create global instance for easy access
window.PubMedWorkflowTester = PubMedWorkflowTester;
