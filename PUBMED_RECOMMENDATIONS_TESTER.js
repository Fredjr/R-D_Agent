/**
 * PUBMED RECOMMENDATIONS COMPREHENSIVE TESTER v1.0
 * 
 * Dedicated testing suite for PubMed recommendation system including:
 * - PubMed eLink API integration testing
 * - Similar papers recommendation testing
 * - Citing papers recommendation testing
 * - Referenced papers recommendation testing
 * - Trending papers recommendation testing
 * - Weekly mix PubMed integration testing
 * - Recommendation engine PubMed enhancement testing
 * - Error handling and fallback testing
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class PubMedRecommendationsTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        this.testPMIDs = [
            '29622564', // CRISPR paper
            '32887946', // COVID-19 paper
            '33462507', // Machine learning paper
            '31978945', // Diabetes paper
            '30971826'  // Nephrology paper
        ];
        this.testDomains = ['genetics', 'biotechnology', 'diabetes', 'nephrology', 'machine learning'];
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
            'pubmed': '📚',
            'similar': '🔗',
            'citing': '📄',
            'trending': '🔥',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testPubMedSimilarPapers() {
        this.log('🔗 TESTING PUBMED SIMILAR PAPERS RECOMMENDATIONS', 'similar');
        
        const results = {};

        for (const pmid of this.testPMIDs.slice(0, 3)) { // Test first 3 PMIDs
            this.log(`Testing similar papers for PMID: ${pmid}`, 'similar');
            
            try {
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: 'similar',
                        pmid: pmid,
                        limit: 10
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    results[pmid] = {
                        success: true,
                        papersFound: data.recommendations?.length || 0,
                        hasMetadata: !!data.metadata,
                        responseTime: Date.now() - this.startTime,
                        samplePaper: data.recommendations?.[0] || null
                    };
                    
                    this.log(`✅ Similar papers for ${pmid}: ${data.recommendations?.length || 0} papers found`, 'success', {
                        papers: data.recommendations?.length || 0,
                        source: data.source_pmid,
                        generated_at: data.generated_at
                    });
                } else {
                    const errorText = await response.text();
                    results[pmid] = {
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`,
                        papersFound: 0
                    };
                    this.log(`❌ Similar papers for ${pmid} failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[pmid] = {
                    success: false,
                    error: error.message,
                    papersFound: 0
                };
                this.log(`❌ Similar papers for ${pmid} error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testPubMedCitingPapers() {
        this.log('📄 TESTING PUBMED CITING PAPERS RECOMMENDATIONS', 'citing');
        
        const results = {};

        for (const pmid of this.testPMIDs.slice(0, 3)) { // Test first 3 PMIDs
            this.log(`Testing citing papers for PMID: ${pmid}`, 'citing');
            
            try {
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: 'citing',
                        pmid: pmid,
                        limit: 10
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    results[pmid] = {
                        success: true,
                        papersFound: data.recommendations?.length || 0,
                        hasMetadata: !!data.metadata,
                        responseTime: Date.now() - this.startTime,
                        samplePaper: data.recommendations?.[0] || null
                    };
                    
                    this.log(`✅ Citing papers for ${pmid}: ${data.recommendations?.length || 0} papers found`, 'success', {
                        papers: data.recommendations?.length || 0,
                        source: data.source_pmid,
                        generated_at: data.generated_at
                    });
                } else {
                    const errorText = await response.text();
                    results[pmid] = {
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`,
                        papersFound: 0
                    };
                    this.log(`❌ Citing papers for ${pmid} failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[pmid] = {
                    success: false,
                    error: error.message,
                    papersFound: 0
                };
                this.log(`❌ Citing papers for ${pmid} error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testPubMedReferencedPapers() {
        this.log('📖 TESTING PUBMED REFERENCED PAPERS RECOMMENDATIONS', 'pubmed');
        
        const results = {};

        for (const pmid of this.testPMIDs.slice(0, 2)) { // Test first 2 PMIDs
            this.log(`Testing referenced papers for PMID: ${pmid}`, 'pubmed');
            
            try {
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: 'references',
                        pmid: pmid,
                        limit: 10
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    results[pmid] = {
                        success: true,
                        papersFound: data.recommendations?.length || 0,
                        hasMetadata: !!data.metadata,
                        responseTime: Date.now() - this.startTime,
                        samplePaper: data.recommendations?.[0] || null
                    };
                    
                    this.log(`✅ Referenced papers for ${pmid}: ${data.recommendations?.length || 0} papers found`, 'success', {
                        papers: data.recommendations?.length || 0,
                        source: data.source_pmid,
                        generated_at: data.generated_at
                    });
                } else {
                    const errorText = await response.text();
                    results[pmid] = {
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`,
                        papersFound: 0
                    };
                    this.log(`❌ Referenced papers for ${pmid} failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[pmid] = {
                    success: false,
                    error: error.message,
                    papersFound: 0
                };
                this.log(`❌ Referenced papers for ${pmid} error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testPubMedTrendingPapers() {
        this.log('🔥 TESTING PUBMED TRENDING PAPERS RECOMMENDATIONS', 'trending');
        
        const results = {};

        for (const domains of [this.testDomains.slice(0, 2), this.testDomains.slice(2, 4)]) {
            const domainKey = domains.join(',');
            this.log(`Testing trending papers for domains: ${domainKey}`, 'trending');
            
            try {
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: 'trending',
                        user_domains: domains,
                        limit: 15
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    results[domainKey] = {
                        success: true,
                        papersFound: data.recommendations?.length || 0,
                        hasMetadata: !!data.metadata,
                        responseTime: Date.now() - this.startTime,
                        samplePaper: data.recommendations?.[0] || null,
                        domains: domains
                    };
                    
                    this.log(`✅ Trending papers for [${domainKey}]: ${data.recommendations?.length || 0} papers found`, 'success', {
                        papers: data.recommendations?.length || 0,
                        domains: domains,
                        generated_at: data.generated_at
                    });
                } else {
                    const errorText = await response.text();
                    results[domainKey] = {
                        success: false,
                        error: `HTTP ${response.status}: ${errorText}`,
                        papersFound: 0,
                        domains: domains
                    };
                    this.log(`❌ Trending papers for [${domainKey}] failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[domainKey] = {
                    success: false,
                    error: error.message,
                    papersFound: 0,
                    domains: domains
                };
                this.log(`❌ Trending papers for [${domainKey}] error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testWeeklyMixPubMedIntegration() {
        this.log('🎵 TESTING WEEKLY MIX PUBMED INTEGRATION', 'test');

        try {
            // Test weekly mix recommendations endpoint
            const response = await fetch(`/api/proxy/recommendations/weekly/${this.testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                }
            });

            if (response.ok) {
                const data = await response.json();
                const pubmedRecommendations = data.recommendations?.filter(r =>
                    r.source === 'pubmed' || r.metadata?.source === 'pubmed'
                ) || [];

                this.log(`✅ Weekly mix contains ${pubmedRecommendations.length} PubMed recommendations`, 'success', {
                    totalRecommendations: data.recommendations?.length || 0,
                    pubmedRecommendations: pubmedRecommendations.length,
                    samplePubMedRec: pubmedRecommendations[0] || null
                });

                return {
                    success: true,
                    totalRecommendations: data.recommendations?.length || 0,
                    pubmedRecommendations: pubmedRecommendations.length,
                    hasPubMedIntegration: pubmedRecommendations.length > 0,
                    sampleRecommendation: pubmedRecommendations[0] || null
                };
            } else {
                const errorText = await response.text();
                this.log(`❌ Weekly mix test failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${errorText}`,
                    pubmedRecommendations: 0
                };
            }
        } catch (error) {
            this.log(`❌ Weekly mix test error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                pubmedRecommendations: 0
            };
        }
    }

    async testBackendPubMedService() {
        this.log('🔧 TESTING BACKEND PUBMED SERVICE DIRECTLY', 'test');

        const results = {};
        const testPmid = this.testPMIDs[0];

        // Test similar papers backend service
        try {
            const response = await fetch(`${this.backendUrl}/recommendations/papers-for-you/${this.testUserId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const pubmedPapers = data.recommendations?.filter(r =>
                    r.source === 'pubmed' || r.metadata?.source === 'pubmed'
                ) || [];

                results.papersForYou = {
                    success: true,
                    totalRecommendations: data.recommendations?.length || 0,
                    pubmedRecommendations: pubmedPapers.length,
                    hasPubMedIntegration: pubmedPapers.length > 0
                };

                this.log(`✅ Backend Papers-for-You contains ${pubmedPapers.length} PubMed recommendations`, 'success');
            } else {
                results.papersForYou = {
                    success: false,
                    error: `HTTP ${response.status}`,
                    pubmedRecommendations: 0
                };
                this.log(`❌ Backend Papers-for-You test failed: HTTP ${response.status}`, 'error');
            }
        } catch (error) {
            results.papersForYou = {
                success: false,
                error: error.message,
                pubmedRecommendations: 0
            };
            this.log(`❌ Backend Papers-for-You error: ${error.message}`, 'error');
        }

        return results;
    }

    async testErrorHandlingAndFallbacks() {
        this.log('🛡️ TESTING ERROR HANDLING AND FALLBACKS', 'test');

        const results = {};

        // Test invalid PMID
        try {
            const response = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'similar',
                    pmid: 'invalid_pmid_12345',
                    limit: 5
                })
            });

            results.invalidPmid = {
                status: response.status,
                success: response.ok,
                handledGracefully: response.status === 400 || response.status === 404
            };

            this.log(`✅ Invalid PMID handled with status: ${response.status}`, 'success');
        } catch (error) {
            results.invalidPmid = {
                success: false,
                error: error.message,
                handledGracefully: false
            };
            this.log(`❌ Invalid PMID test error: ${error.message}`, 'error');
        }

        // Test missing parameters
        try {
            const response = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'similar'
                    // Missing pmid parameter
                })
            });

            results.missingParams = {
                status: response.status,
                success: response.ok,
                handledGracefully: response.status === 400
            };

            this.log(`✅ Missing parameters handled with status: ${response.status}`, 'success');
        } catch (error) {
            results.missingParams = {
                success: false,
                error: error.message,
                handledGracefully: false
            };
            this.log(`❌ Missing parameters test error: ${error.message}`, 'error');
        }

        return results;
    }

    async testResponseFormatValidation() {
        this.log('📋 TESTING RESPONSE FORMAT VALIDATION', 'test');

        const testPmid = this.testPMIDs[0];

        try {
            const response = await fetch('/api/proxy/pubmed/recommendations', {
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
            });

            if (response.ok) {
                const data = await response.json();

                const validation = {
                    hasRecommendations: Array.isArray(data.recommendations),
                    hasMetadata: typeof data.metadata === 'object',
                    hasSourcePmid: !!data.source_pmid,
                    hasGeneratedAt: !!data.generated_at,
                    hasValidPaperStructure: data.recommendations?.every(paper =>
                        paper.pmid && paper.title && paper.authors
                    ) || false,
                    recommendationCount: data.recommendations?.length || 0
                };

                const isValid = validation.hasRecommendations &&
                               validation.hasMetadata &&
                               validation.hasValidPaperStructure;

                this.log(`✅ Response format validation: ${isValid ? 'PASSED' : 'FAILED'}`,
                        isValid ? 'success' : 'warning', validation);

                return {
                    success: true,
                    isValid: isValid,
                    validation: validation
                };
            } else {
                this.log(`❌ Response format test failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    isValid: false
                };
            }
        } catch (error) {
            this.log(`❌ Response format test error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                isValid: false
            };
        }
    }

    async runComprehensivePubMedTest() {
        this.log('🚀 STARTING COMPREHENSIVE PUBMED RECOMMENDATIONS TEST', 'test');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');

        const testResults = {
            startTime: new Date().toISOString(),
            testConfiguration: {
                baseUrl: this.baseUrl,
                backendUrl: this.backendUrl,
                testUserId: this.testUserId,
                testPMIDs: this.testPMIDs,
                testDomains: this.testDomains
            },
            tests: {}
        };

        // Run all tests
        testResults.tests.similarPapers = await this.testPubMedSimilarPapers();
        testResults.tests.citingPapers = await this.testPubMedCitingPapers();
        testResults.tests.referencedPapers = await this.testPubMedReferencedPapers();
        testResults.tests.trendingPapers = await this.testPubMedTrendingPapers();
        testResults.tests.weeklyMixIntegration = await this.testWeeklyMixPubMedIntegration();
        testResults.tests.backendService = await this.testBackendPubMedService();
        testResults.tests.errorHandling = await this.testErrorHandlingAndFallbacks();
        testResults.tests.responseFormat = await this.testResponseFormatValidation();

        // Calculate summary statistics
        const allTests = Object.values(testResults.tests);
        const successfulTests = allTests.filter(test =>
            typeof test.success === 'boolean' ? test.success :
            Object.values(test).some(subTest => subTest.success)
        ).length;

        testResults.summary = {
            totalTests: allTests.length,
            successfulTests: successfulTests,
            failedTests: allTests.length - successfulTests,
            successRate: Math.round((successfulTests / allTests.length) * 100),
            totalPapersFound: Object.values(testResults.tests).reduce((total, test) => {
                if (typeof test === 'object' && test !== null) {
                    return total + Object.values(test).reduce((subTotal, subTest) => {
                        return subTotal + (subTest.papersFound || 0);
                    }, 0);
                }
                return total;
            }, 0),
            endTime: new Date().toISOString(),
            duration: Date.now() - this.startTime
        };

        this.log('🎉 COMPREHENSIVE PUBMED RECOMMENDATIONS TEST COMPLETED', 'success');
        this.log(`✅ Success Rate: ${testResults.summary.successRate}% (${testResults.summary.successfulTests}/${testResults.summary.totalTests})`, 'success');
        this.log(`📚 Total Papers Found: ${testResults.summary.totalPapersFound}`, 'success');
        this.log(`⏱️ Total Duration: ${testResults.summary.duration}ms`, 'info');

        // Store results globally
        window.pubmedRecommendationsTestResults = testResults;
        window.pubmedRecommendationsTestLogs = this.results;

        return testResults;
    }
}

// Auto-execute when script is loaded
console.log('🧪 PubMed Recommendations Tester v1.0 loaded');
console.log('📋 Usage: const tester = new PubMedRecommendationsTester(); await tester.runComprehensivePubMedTest();');
console.log('📊 Results will be stored in: window.pubmedRecommendationsTestResults');
console.log('📝 Logs will be stored in: window.pubmedRecommendationsTestLogs');

// Create global instance for easy access
window.PubMedRecommendationsTester = PubMedRecommendationsTester;
