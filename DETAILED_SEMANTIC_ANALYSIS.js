/**
 * DETAILED SEMANTIC ANALYSIS SCRIPT
 * Deep dive into semantic endpoint responses and text extraction quality
 */

class DetailedSemanticAnalyzer {
    constructor() {
        this.results = [];
    }

    log(message, type = 'info', data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, type, message, data };
        this.results.push(logEntry);
        
        const emoji = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'analysis': '🔬',
            'detail': '🔍'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    analyzeStoredResults() {
        this.log('🔬 ANALYZING STORED SEMANTIC DEBUG RESULTS', 'analysis');
        
        if (!window.semanticDebugResults) {
            this.log('❌ No stored results found. Please run the semantic debug test first.', 'error');
            return null;
        }

        const storedResults = window.semanticDebugResults;
        this.log('📊 Found stored results from:', 'info', storedResults.timestamp);
        
        return storedResults;
    }

    extractResponseData(storedResults) {
        this.log('🔍 EXTRACTING RESPONSE DATA FROM LOGS', 'detail');
        
        const logs = storedResults.detailedLogs || [];
        
        // Find generate-review response
        const generateReviewLog = logs.find(log => 
            log.message.includes('✅ Semantic Generate-Review SUCCESS')
        );
        
        // Find deep-dive response  
        const deepDiveLog = logs.find(log => 
            log.message.includes('✅ Semantic Deep-Dive SUCCESS')
        );

        this.log('📋 Response Data Extraction:', 'info', {
            generateReviewFound: !!generateReviewLog,
            deepDiveFound: !!deepDiveLog,
            totalLogs: logs.length
        });

        return {
            generateReview: generateReviewLog?.data || null,
            deepDive: deepDiveLog?.data || null,
            allLogs: logs
        };
    }

    async getActualResponseData() {
        this.log('🌐 FETCHING FRESH RESPONSE DATA FOR DETAILED ANALYSIS', 'analysis');
        
        // Make a fresh request to get the actual response data
        const generateReviewPayload = {
            molecule: 'CRISPR gene editing',
            objective: 'Detailed text extraction analysis',
            fullTextOnly: false,
            max_results: 5
        };

        try {
            const response = await fetch('/api/proxy/generate-review-semantic', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': 'fredericle77@gmail.com'
                },
                body: JSON.stringify(generateReviewPayload)
            });

            if (response.ok) {
                const data = await response.json();
                this.log('✅ Fresh generate-review response obtained', 'success');
                return data;
            } else {
                this.log('❌ Failed to get fresh response', 'error', response.status);
                return null;
            }
        } catch (error) {
            this.log('❌ Error fetching fresh response', 'error', error.message);
            return null;
        }
    }

    analyzeTextExtractionDetails(responseData) {
        this.log('📄 DETAILED TEXT EXTRACTION ANALYSIS', 'analysis');
        
        if (!responseData || !responseData.results) {
            this.log('❌ No results data to analyze', 'error');
            return null;
        }

        const results = responseData.results;
        this.log(`📊 Analyzing ${results.length} papers`, 'info');

        const detailedAnalysis = {
            totalPapers: results.length,
            textExtractionBreakdown: {
                withFullText: 0,
                withAbstractOnly: 0,
                withNoText: 0,
                withBothFullTextAndAbstract: 0
            },
            contentLengthStats: {
                fullTextLengths: [],
                abstractLengths: [],
                averageFullText: 0,
                averageAbstract: 0
            },
            extractionMethods: new Set(),
            qualityMetrics: {
                qualityScores: [],
                averageQuality: 0,
                papersWithQualityScore: 0
            },
            paperDetails: []
        };

        results.forEach((paper, index) => {
            const paperDetail = {
                index: index + 1,
                pmid: paper.pmid || 'N/A',
                title: paper.title ? paper.title.substring(0, 100) + '...' : 'N/A',
                hasFullText: !!(paper.full_text && paper.full_text.length > 0),
                hasAbstract: !!(paper.abstract && paper.abstract.length > 0),
                fullTextLength: paper.full_text ? paper.full_text.length : 0,
                abstractLength: paper.abstract ? paper.abstract.length : 0,
                extractionMethod: paper.extraction_method || 'unknown',
                qualityScore: paper.quality_score || null,
                source: paper.source || 'unknown'
            };

            // Update breakdown counts
            if (paperDetail.hasFullText && paperDetail.hasAbstract) {
                detailedAnalysis.textExtractionBreakdown.withBothFullTextAndAbstract++;
            } else if (paperDetail.hasFullText) {
                detailedAnalysis.textExtractionBreakdown.withFullText++;
            } else if (paperDetail.hasAbstract) {
                detailedAnalysis.textExtractionBreakdown.withAbstractOnly++;
            } else {
                detailedAnalysis.textExtractionBreakdown.withNoText++;
            }

            // Track content lengths
            if (paperDetail.fullTextLength > 0) {
                detailedAnalysis.contentLengthStats.fullTextLengths.push(paperDetail.fullTextLength);
            }
            if (paperDetail.abstractLength > 0) {
                detailedAnalysis.contentLengthStats.abstractLengths.push(paperDetail.abstractLength);
            }

            // Track extraction methods
            detailedAnalysis.extractionMethods.add(paperDetail.extractionMethod);

            // Track quality metrics
            if (paperDetail.qualityScore !== null) {
                detailedAnalysis.qualityMetrics.qualityScores.push(paperDetail.qualityScore);
                detailedAnalysis.qualityMetrics.papersWithQualityScore++;
            }

            detailedAnalysis.paperDetails.push(paperDetail);
        });

        // Calculate averages
        const fullTextLengths = detailedAnalysis.contentLengthStats.fullTextLengths;
        const abstractLengths = detailedAnalysis.contentLengthStats.abstractLengths;
        const qualityScores = detailedAnalysis.qualityMetrics.qualityScores;

        detailedAnalysis.contentLengthStats.averageFullText = fullTextLengths.length > 0 
            ? fullTextLengths.reduce((a, b) => a + b, 0) / fullTextLengths.length 
            : 0;

        detailedAnalysis.contentLengthStats.averageAbstract = abstractLengths.length > 0 
            ? abstractLengths.reduce((a, b) => a + b, 0) / abstractLengths.length 
            : 0;

        detailedAnalysis.qualityMetrics.averageQuality = qualityScores.length > 0 
            ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
            : 0;

        // Convert Set to Array for logging
        detailedAnalysis.extractionMethodsArray = Array.from(detailedAnalysis.extractionMethods);

        this.log('📊 DETAILED TEXT EXTRACTION BREAKDOWN:', 'analysis', {
            totalPapers: detailedAnalysis.totalPapers,
            textBreakdown: detailedAnalysis.textExtractionBreakdown,
            averageFullTextLength: Math.round(detailedAnalysis.contentLengthStats.averageFullText),
            averageAbstractLength: Math.round(detailedAnalysis.contentLengthStats.averageAbstract),
            extractionMethods: detailedAnalysis.extractionMethodsArray,
            averageQualityScore: detailedAnalysis.qualityMetrics.averageQuality.toFixed(2),
            papersWithQuality: detailedAnalysis.qualityMetrics.papersWithQualityScore
        });

        return detailedAnalysis;
    }

    displayPaperByPaperAnalysis(detailedAnalysis) {
        this.log('📋 PAPER-BY-PAPER ANALYSIS:', 'analysis');
        
        if (!detailedAnalysis || !detailedAnalysis.paperDetails) {
            this.log('❌ No paper details to display', 'error');
            return;
        }

        detailedAnalysis.paperDetails.forEach(paper => {
            const textStatus = paper.hasFullText ? '📄 Full Text' : 
                             paper.hasAbstract ? '📝 Abstract Only' : 
                             '❌ No Text';
            
            this.log(`Paper ${paper.index}: ${textStatus}`, 'detail', {
                pmid: paper.pmid,
                title: paper.title,
                fullTextLength: paper.fullTextLength,
                abstractLength: paper.abstractLength,
                extractionMethod: paper.extractionMethod,
                qualityScore: paper.qualityScore,
                source: paper.source
            });
        });
    }

    analyzeSemanticEnhancements(responseData) {
        this.log('🧠 ANALYZING SEMANTIC ENHANCEMENTS', 'analysis');
        
        const enhancements = {
            hasSemanticAnalysis: !!responseData.semantic_analysis,
            hasPersonalization: !!responseData.personalization,
            hasContentQuality: !!responseData.content_quality,
            hasMetadata: !!responseData.metadata
        };

        if (responseData.semantic_analysis) {
            this.log('🔍 Semantic Analysis Found:', 'detail', {
                expandedQueries: responseData.semantic_analysis.expanded_queries?.length || 0,
                conceptMappings: Object.keys(responseData.semantic_analysis.concept_mappings || {}).length,
                domainBridges: responseData.semantic_analysis.domain_bridges?.length || 0,
                relatedConcepts: responseData.semantic_analysis.related_concepts?.length || 0
            });
        }

        if (responseData.personalization) {
            this.log('👤 Personalization Found:', 'detail', {
                relevanceScores: Object.keys(responseData.personalization.relevance_scores || {}).length,
                userInterestAlignment: Object.keys(responseData.personalization.user_interest_alignment || {}).length,
                recommendationReasons: Object.keys(responseData.personalization.recommendation_reasons || {}).length,
                followUpSuggestions: responseData.personalization.follow_up_suggestions?.length || 0
            });
        }

        if (responseData.content_quality) {
            this.log('📊 Content Quality Metrics:', 'detail', responseData.content_quality);
        }

        return enhancements;
    }

    async runDetailedAnalysis() {
        this.log('🚀 STARTING DETAILED SEMANTIC ANALYSIS', 'analysis');

        // Step 1: Try to analyze stored results (optional)
        const storedResults = this.analyzeStoredResults();
        let responseData = null;

        if (storedResults) {
            // Step 2: Extract response data from logs if available
            responseData = this.extractResponseData(storedResults);
        } else {
            this.log('ℹ️ No stored results found. Proceeding with fresh analysis only.', 'info');
        }

        // Step 3: Get fresh response data for detailed analysis (primary method)
        this.log('🌐 Making fresh requests for comprehensive analysis...', 'analysis');
        const freshData = await this.getActualResponseData();

        if (!freshData) {
            this.log('❌ Could not obtain fresh response data. Analysis cannot continue.', 'error');
            return null;
        }

        // Step 4: Analyze text extraction in detail
        const textAnalysis = this.analyzeTextExtractionDetails(freshData);

        // Step 5: Display paper-by-paper breakdown
        if (textAnalysis) {
            this.displayPaperByPaperAnalysis(textAnalysis);
        }

        // Step 6: Analyze semantic enhancements
        this.analyzeSemanticEnhancements(freshData);

        // Store detailed results
        window.detailedSemanticAnalysis = {
            storedResults,
            responseData,
            freshData,
            textAnalysis,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Detailed analysis complete. Results stored in window.detailedSemanticAnalysis', 'success');

        return window.detailedSemanticAnalysis;
    }
}

// Auto-execute when script is loaded
(async () => {
    const analyzer = new DetailedSemanticAnalyzer();
    await analyzer.runDetailedAnalysis();
})();
