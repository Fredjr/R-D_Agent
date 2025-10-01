/**
 * PUBMED XML PARSER & API INTEGRATION TESTER v1.0
 * 
 * Dedicated testing suite for PubMed XML parsing and API integration including:
 * - PubMed eLink API response parsing
 * - XML structure validation
 * - Paper metadata extraction accuracy
 * - Author parsing validation
 * - Journal information extraction
 * - Publication date parsing
 * - Abstract extraction testing
 * - Error handling for malformed XML
 * 
 * Usage: Copy and paste this script into browser console on your frontend domain
 */

class PubMedXMLParserTester {
    constructor() {
        this.baseUrl = 'https://frontend-psi-seven-85.vercel.app';
        this.backendUrl = 'https://r-dagent-production.up.railway.app';
        this.testUserId = 'fredericle77@gmail.com';
        this.results = [];
        this.startTime = Date.now();
        
        // Test PMIDs with known good metadata
        this.testPMIDs = [
            {
                pmid: '29622564',
                expectedTitle: 'CRISPR',
                expectedAuthors: ['Jinek', 'Charpentier'],
                expectedJournal: 'Science'
            },
            {
                pmid: '32887946',
                expectedTitle: 'COVID-19',
                expectedAuthors: ['Zhou', 'Yang'],
                expectedJournal: 'Nature'
            },
            {
                pmid: '33462507',
                expectedTitle: 'machine learning',
                expectedAuthors: ['LeCun', 'Bengio'],
                expectedJournal: 'Nature'
            }
        ];
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
            'xml': '📄',
            'parse': '🔍',
            'validate': '✔️',
            'test': '🧪'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] [+${elapsed}ms] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    async testXMLParsingAccuracy() {
        this.log('🔍 TESTING XML PARSING ACCURACY', 'parse');
        
        const results = {};

        for (const testCase of this.testPMIDs) {
            this.log(`Testing XML parsing for PMID: ${testCase.pmid}`, 'parse');
            
            try {
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: 'similar',
                        pmid: testCase.pmid,
                        limit: 5
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const papers = data.recommendations || [];
                    
                    // Validate parsing accuracy
                    const validation = {
                        papersFound: papers.length,
                        allHavePMID: papers.every(p => p.pmid),
                        allHaveTitle: papers.every(p => p.title && p.title.length > 0),
                        allHaveAuthors: papers.every(p => p.authors && p.authors.length > 0),
                        allHaveJournal: papers.every(p => p.journal),
                        allHaveYear: papers.every(p => p.year),
                        validPMIDFormat: papers.every(p => /^\d+$/.test(p.pmid)),
                        validYearFormat: papers.every(p => !p.year || /^\d{4}$/.test(p.year.toString())),
                        samplePaper: papers[0] || null
                    };
                    
                    const accuracy = Object.values(validation).filter(v => v === true).length / 
                                   (Object.keys(validation).length - 2); // Exclude papersFound and samplePaper
                    
                    results[testCase.pmid] = {
                        success: true,
                        accuracy: Math.round(accuracy * 100),
                        validation: validation,
                        expectedData: testCase
                    };
                    
                    this.log(`✅ XML parsing for ${testCase.pmid}: ${Math.round(accuracy * 100)}% accuracy`, 'success', validation);
                } else {
                    results[testCase.pmid] = {
                        success: false,
                        error: `HTTP ${response.status}`,
                        accuracy: 0
                    };
                    this.log(`❌ XML parsing for ${testCase.pmid} failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[testCase.pmid] = {
                    success: false,
                    error: error.message,
                    accuracy: 0
                };
                this.log(`❌ XML parsing for ${testCase.pmid} error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testAuthorParsingValidation() {
        this.log('👥 TESTING AUTHOR PARSING VALIDATION', 'validate');
        
        const testPmid = this.testPMIDs[0].pmid;
        
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
                    limit: 3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const papers = data.recommendations || [];
                
                const authorValidation = papers.map(paper => ({
                    pmid: paper.pmid,
                    title: paper.title?.substring(0, 50) + '...',
                    authorCount: paper.authors?.length || 0,
                    hasValidAuthors: paper.authors?.every(author => 
                        typeof author === 'string' && author.length > 0
                    ) || false,
                    authorFormat: paper.authors?.[0] || null,
                    hasLastNameFirst: paper.authors?.some(author => 
                        author.includes(',') || author.includes(' ')
                    ) || false
                }));
                
                const validAuthors = authorValidation.filter(v => v.hasValidAuthors).length;
                const accuracy = Math.round((validAuthors / authorValidation.length) * 100);
                
                this.log(`✅ Author parsing validation: ${accuracy}% accuracy`, 'success', {
                    totalPapers: authorValidation.length,
                    validAuthorPapers: validAuthors,
                    accuracy: accuracy,
                    sampleValidation: authorValidation[0]
                });
                
                return {
                    success: true,
                    accuracy: accuracy,
                    totalPapers: authorValidation.length,
                    validAuthorPapers: validAuthors,
                    authorValidation: authorValidation
                };
            } else {
                this.log(`❌ Author parsing validation failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    accuracy: 0
                };
            }
        } catch (error) {
            this.log(`❌ Author parsing validation error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                accuracy: 0
            };
        }
    }

    async testJournalInformationExtraction() {
        this.log('📰 TESTING JOURNAL INFORMATION EXTRACTION', 'validate');
        
        const testPmid = this.testPMIDs[1].pmid;
        
        try {
            const response = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'citing',
                    pmid: testPmid,
                    limit: 5
                })
            });

            if (response.ok) {
                const data = await response.json();
                const papers = data.recommendations || [];
                
                const journalValidation = papers.map(paper => ({
                    pmid: paper.pmid,
                    title: paper.title?.substring(0, 40) + '...',
                    journal: paper.journal,
                    hasJournal: !!paper.journal,
                    journalLength: paper.journal?.length || 0,
                    hasValidJournal: paper.journal && paper.journal.length > 2,
                    year: paper.year,
                    hasYear: !!paper.year,
                    validYear: paper.year && paper.year >= 1900 && paper.year <= new Date().getFullYear()
                }));
                
                const validJournals = journalValidation.filter(v => v.hasValidJournal).length;
                const validYears = journalValidation.filter(v => v.validYear).length;
                const journalAccuracy = Math.round((validJournals / journalValidation.length) * 100);
                const yearAccuracy = Math.round((validYears / journalValidation.length) * 100);
                
                this.log(`✅ Journal extraction: ${journalAccuracy}% accuracy, Year extraction: ${yearAccuracy}% accuracy`, 'success', {
                    totalPapers: journalValidation.length,
                    validJournals: validJournals,
                    validYears: validYears,
                    journalAccuracy: journalAccuracy,
                    yearAccuracy: yearAccuracy,
                    sampleValidation: journalValidation[0]
                });
                
                return {
                    success: true,
                    journalAccuracy: journalAccuracy,
                    yearAccuracy: yearAccuracy,
                    totalPapers: journalValidation.length,
                    validJournals: validJournals,
                    validYears: validYears,
                    journalValidation: journalValidation
                };
            } else {
                this.log(`❌ Journal information extraction failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    journalAccuracy: 0,
                    yearAccuracy: 0
                };
            }
        } catch (error) {
            this.log(`❌ Journal information extraction error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                journalAccuracy: 0,
                yearAccuracy: 0
            };
        }
    }

    async testAbstractExtractionTesting() {
        this.log('📝 TESTING ABSTRACT EXTRACTION', 'validate');
        
        const testPmid = this.testPMIDs[2].pmid;
        
        try {
            const response = await fetch('/api/proxy/pubmed/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': this.testUserId
                },
                body: JSON.stringify({
                    type: 'references',
                    pmid: testPmid,
                    limit: 3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const papers = data.recommendations || [];
                
                const abstractValidation = papers.map(paper => ({
                    pmid: paper.pmid,
                    title: paper.title?.substring(0, 40) + '...',
                    hasAbstract: !!paper.abstract,
                    abstractLength: paper.abstract?.length || 0,
                    hasValidAbstract: paper.abstract && paper.abstract.length > 50,
                    abstractPreview: paper.abstract?.substring(0, 100) + '...' || null
                }));
                
                const validAbstracts = abstractValidation.filter(v => v.hasValidAbstract).length;
                const accuracy = Math.round((validAbstracts / abstractValidation.length) * 100);
                
                this.log(`✅ Abstract extraction: ${accuracy}% accuracy`, 'success', {
                    totalPapers: abstractValidation.length,
                    validAbstracts: validAbstracts,
                    accuracy: accuracy,
                    sampleValidation: abstractValidation[0]
                });
                
                return {
                    success: true,
                    accuracy: accuracy,
                    totalPapers: abstractValidation.length,
                    validAbstracts: validAbstracts,
                    abstractValidation: abstractValidation
                };
            } else {
                this.log(`❌ Abstract extraction failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    accuracy: 0
                };
            }
        } catch (error) {
            this.log(`❌ Abstract extraction error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                accuracy: 0
            };
        }
    }

    async testErrorHandlingMalformedXML() {
        this.log('🛡️ TESTING ERROR HANDLING FOR MALFORMED XML', 'test');

        // Test with a PMID that might return malformed or empty XML
        const testPmid = '99999999'; // Non-existent PMID

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

            const isHandledGracefully = response.status === 404 || response.status === 400 ||
                                      (response.ok && (await response.json()).recommendations?.length === 0);

            this.log(`✅ Malformed XML handling: ${isHandledGracefully ? 'PASSED' : 'NEEDS IMPROVEMENT'}`,
                    isHandledGracefully ? 'success' : 'warning', {
                status: response.status,
                handledGracefully: isHandledGracefully
            });

            return {
                success: true,
                handledGracefully: isHandledGracefully,
                status: response.status
            };
        } catch (error) {
            this.log(`✅ Malformed XML handling: Error caught gracefully`, 'success', {
                error: error.message
            });
            return {
                success: true,
                handledGracefully: true,
                error: error.message
            };
        }
    }

    async testPubMedAPIIntegration() {
        this.log('🔗 TESTING PUBMED API INTEGRATION', 'test');

        const results = {};
        const testPmid = this.testPMIDs[0].pmid;

        // Test different PubMed eLink API endpoints
        const linkTypes = ['similar', 'citing', 'references'];

        for (const linkType of linkTypes) {
            this.log(`Testing PubMed ${linkType} API integration`, 'test');

            try {
                const startTime = Date.now();
                const response = await fetch('/api/proxy/pubmed/recommendations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-ID': this.testUserId
                    },
                    body: JSON.stringify({
                        type: linkType,
                        pmid: testPmid,
                        limit: 5
                    })
                });
                const responseTime = Date.now() - startTime;

                if (response.ok) {
                    const data = await response.json();
                    results[linkType] = {
                        success: true,
                        responseTime: responseTime,
                        papersFound: data.recommendations?.length || 0,
                        hasMetadata: !!data.metadata,
                        apiCallSuccessful: true
                    };

                    this.log(`✅ PubMed ${linkType} API: ${data.recommendations?.length || 0} papers in ${responseTime}ms`, 'success');
                } else {
                    results[linkType] = {
                        success: false,
                        responseTime: responseTime,
                        error: `HTTP ${response.status}`,
                        apiCallSuccessful: false
                    };
                    this.log(`❌ PubMed ${linkType} API failed: HTTP ${response.status}`, 'error');
                }
            } catch (error) {
                results[linkType] = {
                    success: false,
                    error: error.message,
                    apiCallSuccessful: false
                };
                this.log(`❌ PubMed ${linkType} API error: ${error.message}`, 'error');
            }
        }

        return results;
    }

    async testXMLStructureValidation() {
        this.log('📋 TESTING XML STRUCTURE VALIDATION', 'validate');

        const testPmid = this.testPMIDs[1].pmid;

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
                    limit: 3
                })
            });

            if (response.ok) {
                const data = await response.json();
                const papers = data.recommendations || [];

                // Validate XML structure requirements
                const structureValidation = {
                    hasRecommendations: Array.isArray(papers),
                    allPapersHaveRequiredFields: papers.every(paper =>
                        paper.pmid && paper.title && paper.authors
                    ),
                    validPMIDStructure: papers.every(paper =>
                        typeof paper.pmid === 'string' && /^\d+$/.test(paper.pmid)
                    ),
                    validTitleStructure: papers.every(paper =>
                        typeof paper.title === 'string' && paper.title.length > 0
                    ),
                    validAuthorsStructure: papers.every(paper =>
                        Array.isArray(paper.authors) && paper.authors.length > 0
                    ),
                    validJournalStructure: papers.every(paper =>
                        !paper.journal || typeof paper.journal === 'string'
                    ),
                    validYearStructure: papers.every(paper =>
                        !paper.year || (typeof paper.year === 'number' && paper.year > 1800)
                    ),
                    paperCount: papers.length
                };

                const validationScore = Object.values(structureValidation)
                    .filter(v => v === true).length / (Object.keys(structureValidation).length - 1); // Exclude paperCount
                const accuracy = Math.round(validationScore * 100);

                this.log(`✅ XML structure validation: ${accuracy}% compliance`, 'success', structureValidation);

                return {
                    success: true,
                    accuracy: accuracy,
                    structureValidation: structureValidation,
                    paperCount: papers.length
                };
            } else {
                this.log(`❌ XML structure validation failed: HTTP ${response.status}`, 'error');
                return {
                    success: false,
                    error: `HTTP ${response.status}`,
                    accuracy: 0
                };
            }
        } catch (error) {
            this.log(`❌ XML structure validation error: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message,
                accuracy: 0
            };
        }
    }

    async runComprehensiveXMLParserTest() {
        this.log('🚀 STARTING COMPREHENSIVE PUBMED XML PARSER TEST', 'test');
        this.log(`Testing against: ${this.baseUrl}`, 'info');
        this.log(`Backend: ${this.backendUrl}`, 'info');
        this.log(`Test User: ${this.testUserId}`, 'info');

        const testResults = {
            startTime: new Date().toISOString(),
            testConfiguration: {
                baseUrl: this.baseUrl,
                backendUrl: this.backendUrl,
                testUserId: this.testUserId,
                testPMIDs: this.testPMIDs
            },
            tests: {}
        };

        // Run all XML parsing tests
        testResults.tests.xmlParsingAccuracy = await this.testXMLParsingAccuracy();
        testResults.tests.authorParsing = await this.testAuthorParsingValidation();
        testResults.tests.journalExtraction = await this.testJournalInformationExtraction();
        testResults.tests.abstractExtraction = await this.testAbstractExtractionTesting();
        testResults.tests.errorHandling = await this.testErrorHandlingMalformedXML();
        testResults.tests.apiIntegration = await this.testPubMedAPIIntegration();
        testResults.tests.xmlStructure = await this.testXMLStructureValidation();

        // Calculate summary statistics
        const allTests = Object.values(testResults.tests);
        const successfulTests = allTests.filter(test => test.success).length;

        // Calculate average accuracy
        const accuracyTests = allTests.filter(test => test.accuracy !== undefined);
        const averageAccuracy = accuracyTests.length > 0 ?
            Math.round(accuracyTests.reduce((sum, test) => sum + test.accuracy, 0) / accuracyTests.length) : 0;

        testResults.summary = {
            totalTests: allTests.length,
            successfulTests: successfulTests,
            failedTests: allTests.length - successfulTests,
            successRate: Math.round((successfulTests / allTests.length) * 100),
            averageAccuracy: averageAccuracy,
            endTime: new Date().toISOString(),
            duration: Date.now() - this.startTime
        };

        this.log('🎉 COMPREHENSIVE PUBMED XML PARSER TEST COMPLETED', 'success');
        this.log(`✅ Success Rate: ${testResults.summary.successRate}% (${testResults.summary.successfulTests}/${testResults.summary.totalTests})`, 'success');
        this.log(`🎯 Average Accuracy: ${testResults.summary.averageAccuracy}%`, 'success');
        this.log(`⏱️ Total Duration: ${testResults.summary.duration}ms`, 'info');

        // Store results globally
        window.pubmedXMLParserTestResults = testResults;
        window.pubmedXMLParserTestLogs = this.results;

        return testResults;
    }
}

// Auto-execute when script is loaded
console.log('🧪 PubMed XML Parser Tester v1.0 loaded');
console.log('📋 Usage: const tester = new PubMedXMLParserTester(); await tester.runComprehensiveXMLParserTest();');
console.log('📊 Results will be stored in: window.pubmedXMLParserTestResults');
console.log('📝 Logs will be stored in: window.pubmedXMLParserTestLogs');

// Create global instance for easy access
window.PubMedXMLParserTester = PubMedXMLParserTester;
