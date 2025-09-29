/**
 * CORRECTED TEXT EXTRACTION ANALYSIS
 * Fixed to handle the actual response data structure
 */

class CorrectedTextExtractionAnalyzer {
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
            'fix': '🔧'
        }[type] || 'ℹ️';
        
        console.log(`${emoji} [${timestamp}] ${message}`);
        if (data) {
            console.log('Data:', data);
        }
    }

    analyzeActualDataStructure() {
        this.log('🔧 ANALYZING ACTUAL DATA STRUCTURE', 'fix');
        
        if (!window.detailedSemanticAnalysis?.freshData) {
            this.log('❌ No fresh data available. Please run detailed analysis first.', 'error');
            return null;
        }

        const data = window.detailedSemanticAnalysis.freshData;
        const results = data.results || [];
        
        this.log(`📊 Found ${results.length} result objects`, 'info');
        
        // Analyze the structure of the first result
        if (results.length > 0) {
            const firstResult = results[0];
            this.log('🔍 First result structure:', 'analysis', {
                hasQuery: !!firstResult.query,
                hasResult: !!firstResult.result,
                hasArticles: !!firstResult.articles,
                hasTopArticle: !!firstResult.top_article,
                articlesCount: firstResult.articles?.length || 0,
                topArticleKeys: Object.keys(firstResult.top_article || {})
            });

            // Examine the articles array
            if (firstResult.articles && firstResult.articles.length > 0) {
                const firstArticle = firstResult.articles[0];
                this.log('📄 First article structure:', 'analysis', {
                    keys: Object.keys(firstArticle),
                    hasTitle: !!firstArticle.title,
                    hasAbstract: !!firstArticle.abstract,
                    hasFullText: !!firstArticle.full_text,
                    hasPmid: !!firstArticle.pmid
                });
            }

            // Examine the top_article
            if (firstResult.top_article) {
                this.log('🏆 Top article structure:', 'analysis', firstResult.top_article);
            }
        }

        return { data, results };
    }

    extractPapersFromActualStructure(data) {
        this.log('🔧 EXTRACTING PAPERS FROM ACTUAL STRUCTURE', 'fix');
        
        const results = data.results || [];
        const extractedPapers = [];

        results.forEach((resultObj, index) => {
            // Each result object contains articles array and top_article
            const topArticle = resultObj.top_article || {};
            const articles = resultObj.articles || [];
            
            // Use top_article as primary source, supplement with articles[0] if available
            const primaryArticle = articles.length > 0 ? articles[0] : {};
            
            const extractedPaper = {
                index: index + 1,
                pmid: topArticle.pmid || primaryArticle.pmid || 'N/A',
                title: topArticle.title || primaryArticle.title || 'N/A',
                abstract: primaryArticle.abstract || topArticle.abstract || '',
                full_text: primaryArticle.full_text || topArticle.full_text || '',
                url: topArticle.url || primaryArticle.url || '',
                citation_count: topArticle.citation_count || primaryArticle.citation_count || 0,
                pub_year: topArticle.pub_year || primaryArticle.pub_year || 'N/A',
                source: resultObj.source || 'unknown',
                query_used: resultObj.query || '',
                // Additional metadata
                domain_relevance: resultObj.domain_relevance || 0,
                semantic_similarity: resultObj.semantic_similarity || 0,
                user_relevance: resultObj.user_relevance || 0,
                extraction_method: primaryArticle.extraction_method || 'pubmed_api',
                quality_score: primaryArticle.quality_score || null
            };

            extractedPapers.push(extractedPaper);
        });

        this.log(`✅ Extracted ${extractedPapers.length} papers from actual structure`, 'success');
        return extractedPapers;
    }

    analyzeExtractedPapers(papers) {
        this.log('📊 ANALYZING EXTRACTED PAPERS', 'analysis');
        
        const analysis = {
            totalPapers: papers.length,
            textExtractionBreakdown: {
                withFullText: 0,
                withAbstractOnly: 0,
                withNoText: 0,
                withBothFullTextAndAbstract: 0,
                withTitleOnly: 0
            },
            contentLengthStats: {
                fullTextLengths: [],
                abstractLengths: [],
                titleLengths: [],
                averageFullText: 0,
                averageAbstract: 0,
                averageTitle: 0
            },
            metadataAnalysis: {
                withPmid: 0,
                withUrl: 0,
                withCitationCount: 0,
                withPubYear: 0,
                averageCitations: 0,
                yearRange: { min: null, max: null }
            },
            qualityMetrics: {
                domainRelevanceScores: [],
                semanticSimilarityScores: [],
                userRelevanceScores: [],
                averageDomainRelevance: 0,
                averageSemanticSimilarity: 0,
                averageUserRelevance: 0
            },
            paperDetails: []
        };

        papers.forEach(paper => {
            // Text extraction analysis
            const hasFullText = !!(paper.full_text && paper.full_text.length > 0);
            const hasAbstract = !!(paper.abstract && paper.abstract.length > 0);
            const hasTitle = !!(paper.title && paper.title !== 'N/A' && paper.title.length > 0);

            if (hasFullText && hasAbstract) {
                analysis.textExtractionBreakdown.withBothFullTextAndAbstract++;
            } else if (hasFullText) {
                analysis.textExtractionBreakdown.withFullText++;
            } else if (hasAbstract) {
                analysis.textExtractionBreakdown.withAbstractOnly++;
            } else if (hasTitle) {
                analysis.textExtractionBreakdown.withTitleOnly++;
            } else {
                analysis.textExtractionBreakdown.withNoText++;
            }

            // Content length tracking
            if (hasFullText) {
                analysis.contentLengthStats.fullTextLengths.push(paper.full_text.length);
            }
            if (hasAbstract) {
                analysis.contentLengthStats.abstractLengths.push(paper.abstract.length);
            }
            if (hasTitle) {
                analysis.contentLengthStats.titleLengths.push(paper.title.length);
            }

            // Metadata analysis
            if (paper.pmid && paper.pmid !== 'N/A') analysis.metadataAnalysis.withPmid++;
            if (paper.url) analysis.metadataAnalysis.withUrl++;
            if (paper.citation_count > 0) analysis.metadataAnalysis.withCitationCount++;
            if (paper.pub_year && paper.pub_year !== 'N/A') {
                analysis.metadataAnalysis.withPubYear++;
                const year = parseInt(paper.pub_year);
                if (!isNaN(year)) {
                    if (!analysis.metadataAnalysis.yearRange.min || year < analysis.metadataAnalysis.yearRange.min) {
                        analysis.metadataAnalysis.yearRange.min = year;
                    }
                    if (!analysis.metadataAnalysis.yearRange.max || year > analysis.metadataAnalysis.yearRange.max) {
                        analysis.metadataAnalysis.yearRange.max = year;
                    }
                }
            }

            // Quality metrics
            if (paper.domain_relevance > 0) analysis.qualityMetrics.domainRelevanceScores.push(paper.domain_relevance);
            if (paper.semantic_similarity > 0) analysis.qualityMetrics.semanticSimilarityScores.push(paper.semantic_similarity);
            if (paper.user_relevance > 0) analysis.qualityMetrics.userRelevanceScores.push(paper.user_relevance);

            // Paper detail for display
            const paperDetail = {
                index: paper.index,
                pmid: paper.pmid,
                title: paper.title.length > 100 ? paper.title.substring(0, 100) + '...' : paper.title,
                hasFullText,
                hasAbstract,
                hasTitle,
                fullTextLength: paper.full_text ? paper.full_text.length : 0,
                abstractLength: paper.abstract ? paper.abstract.length : 0,
                citationCount: paper.citation_count,
                pubYear: paper.pub_year,
                domainRelevance: paper.domain_relevance,
                semanticSimilarity: paper.semantic_similarity,
                userRelevance: paper.user_relevance,
                source: paper.source
            };

            analysis.paperDetails.push(paperDetail);
        });

        // Calculate averages
        const { fullTextLengths, abstractLengths, titleLengths } = analysis.contentLengthStats;
        analysis.contentLengthStats.averageFullText = fullTextLengths.length > 0 
            ? Math.round(fullTextLengths.reduce((a, b) => a + b, 0) / fullTextLengths.length) : 0;
        analysis.contentLengthStats.averageAbstract = abstractLengths.length > 0 
            ? Math.round(abstractLengths.reduce((a, b) => a + b, 0) / abstractLengths.length) : 0;
        analysis.contentLengthStats.averageTitle = titleLengths.length > 0 
            ? Math.round(titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length) : 0;

        // Citation average
        const citationCounts = papers.map(p => p.citation_count).filter(c => c > 0);
        analysis.metadataAnalysis.averageCitations = citationCounts.length > 0 
            ? Math.round(citationCounts.reduce((a, b) => a + b, 0) / citationCounts.length) : 0;

        // Quality averages
        const { domainRelevanceScores, semanticSimilarityScores, userRelevanceScores } = analysis.qualityMetrics;
        analysis.qualityMetrics.averageDomainRelevance = domainRelevanceScores.length > 0 
            ? (domainRelevanceScores.reduce((a, b) => a + b, 0) / domainRelevanceScores.length).toFixed(2) : 0;
        analysis.qualityMetrics.averageSemanticSimilarity = semanticSimilarityScores.length > 0 
            ? (semanticSimilarityScores.reduce((a, b) => a + b, 0) / semanticSimilarityScores.length).toFixed(2) : 0;
        analysis.qualityMetrics.averageUserRelevance = userRelevanceScores.length > 0 
            ? (userRelevanceScores.reduce((a, b) => a + b, 0) / userRelevanceScores.length).toFixed(2) : 0;

        this.log('📊 CORRECTED TEXT EXTRACTION ANALYSIS:', 'analysis', {
            totalPapers: analysis.totalPapers,
            textBreakdown: analysis.textExtractionBreakdown,
            averageFullTextLength: analysis.contentLengthStats.averageFullText,
            averageAbstractLength: analysis.contentLengthStats.averageAbstract,
            averageTitleLength: analysis.contentLengthStats.averageTitle,
            metadataCompleteness: {
                withPmid: analysis.metadataAnalysis.withPmid,
                withUrl: analysis.metadataAnalysis.withUrl,
                withCitationCount: analysis.metadataAnalysis.withCitationCount,
                withPubYear: analysis.metadataAnalysis.withPubYear
            },
            qualityAverages: {
                domainRelevance: analysis.qualityMetrics.averageDomainRelevance,
                semanticSimilarity: analysis.qualityMetrics.averageSemanticSimilarity,
                userRelevance: analysis.qualityMetrics.averageUserRelevance
            }
        });

        return analysis;
    }

    displayCorrectedPaperAnalysis(analysis) {
        this.log('📋 CORRECTED PAPER-BY-PAPER ANALYSIS:', 'analysis');
        
        analysis.paperDetails.forEach(paper => {
            let textStatus = '❌ No Text';
            if (paper.hasFullText && paper.hasAbstract) {
                textStatus = '📄 Full Text + Abstract';
            } else if (paper.hasFullText) {
                textStatus = '📄 Full Text Only';
            } else if (paper.hasAbstract) {
                textStatus = '📝 Abstract Only';
            } else if (paper.hasTitle) {
                textStatus = '🏷️ Title Only';
            }
            
            this.log(`Paper ${paper.index}: ${textStatus}`, 'analysis', {
                pmid: paper.pmid,
                title: paper.title,
                fullTextLength: paper.fullTextLength,
                abstractLength: paper.abstractLength,
                citationCount: paper.citationCount,
                pubYear: paper.pubYear,
                domainRelevance: paper.domainRelevance,
                semanticSimilarity: paper.semanticSimilarity,
                userRelevance: paper.userRelevance,
                source: paper.source
            });
        });
    }

    async runCorrectedAnalysis() {
        this.log('🚀 STARTING CORRECTED TEXT EXTRACTION ANALYSIS', 'fix');
        
        // Step 1: Analyze actual data structure
        const structureAnalysis = this.analyzeActualDataStructure();
        if (!structureAnalysis) return null;

        // Step 2: Extract papers using correct structure
        const extractedPapers = this.extractPapersFromActualStructure(structureAnalysis.data);
        
        // Step 3: Analyze extracted papers
        const correctedAnalysis = this.analyzeExtractedPapers(extractedPapers);
        
        // Step 4: Display corrected paper-by-paper analysis
        this.displayCorrectedPaperAnalysis(correctedAnalysis);

        // Store corrected results
        window.correctedTextExtractionAnalysis = {
            structureAnalysis,
            extractedPapers,
            correctedAnalysis,
            timestamp: new Date().toISOString(),
            logs: this.results
        };

        this.log('✅ Corrected analysis complete. Results stored in window.correctedTextExtractionAnalysis', 'success');
        
        return window.correctedTextExtractionAnalysis;
    }
}

// Auto-execute when script is loaded
(async () => {
    const analyzer = new CorrectedTextExtractionAnalyzer();
    await analyzer.runCorrectedAnalysis();
})();
