import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Citation Network API
 * Creates a complete citation network with nodes and edges from PubMed data
 * This replaces the backend API with direct PubMed integration
 */

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  metadata: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    url: string;
    abstract?: string;
    node_type: 'base_article' | 'citing_article' | 'reference_article' | 'similar_article';
  };
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'citation' | 'reference' | 'similarity';
  weight: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    source_pmid: string;
    network_type: string;
    total_nodes: number;
    total_edges: number;
  };
}

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  citation_count: number;
  abstract?: string;
  doi?: string;
}

// PubMed eUtils base URLs
const PUBMED_FETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
const PUBMED_LINK_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';

/**
 * Parse PubMed XML response to extract article data
 */
function parseArticleXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  
  try {
    const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
    
    for (const articleXML of articleMatches) {
      const pmidMatch = articleXML.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';
      
      const titleMatch = articleXML.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      const authors: string[] = [];
      const authorMatches = articleXML.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      for (const authorXML of authorMatches) {
        const lastNameMatch = authorXML.match(/<LastName>(.*?)<\/LastName>/);
        const firstNameMatch = authorXML.match(/<ForeName>(.*?)<\/ForeName>/);
        if (lastNameMatch) {
          const lastName = lastNameMatch[1];
          const firstName = firstNameMatch ? firstNameMatch[1] : '';
          authors.push(firstName ? `${firstName} ${lastName}` : lastName);
        }
      }
      
      const journalMatch = articleXML.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      const yearMatch = articleXML.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      const abstractMatch = articleXML.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      if (pmid && title) {
        articles.push({
          pmid,
          title,
          authors,
          journal,
          year,
          citation_count: 0,
          abstract
        });
      }
    }
  } catch (error) {
    console.error('Error parsing PubMed XML:', error);
  }
  
  return articles;
}

/**
 * Check if an article is Open Access based on XML content
 */
function isOpenAccessArticle(articleXml: string): boolean {
  // Check for PMC ID (PubMed Central = Open Access)
  if (articleXml.includes('<ArticleId IdType="pmc">')) {
    return true;
  }

  // Check for free-pmc or PMC in article IDs
  if (articleXml.includes('free-pmc') || articleXml.includes('PMC')) {
    return true;
  }

  // Check for "open access" in publication type or keywords
  if (articleXml.toLowerCase().includes('open access')) {
    return true;
  }

  return false;
}

/**
 * Fetch article details from PubMed by PMID
 * @param pmids Array of PMIDs to fetch
 * @param filterOpenAccess If true, only return Open Access articles
 */
async function fetchArticleDetails(pmids: string[], filterOpenAccess: boolean = false): Promise<PubMedArticle[]> {
  if (pmids.length === 0) {
    console.log('⚠️ fetchArticleDetails called with empty pmids array');
    return [];
  }

  try {
    const pmidList = pmids.join(',');
    const fetchUrl = `${PUBMED_FETCH_URL}?db=pubmed&id=${pmidList}&retmode=xml&rettype=abstract`;
    console.log(`🔍 Fetching article details for ${pmids.length} PMIDs (OA filter: ${filterOpenAccess}): ${pmidList.substring(0, 100)}...`);

    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      console.error(`❌ PubMed efetch failed: ${response.status} ${response.statusText}`);
      throw new Error(`PubMed fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    console.log(`📄 Received XML response: ${xmlText.length} characters`);

    // If filtering for OA, we need to parse and filter
    if (filterOpenAccess) {
      const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
      const oaArticleXmls = articleMatches.filter(articleXml => isOpenAccessArticle(articleXml));
      const oaXmlText = oaArticleXmls.join('\n');
      console.log(`🔓 Filtered to ${oaArticleXmls.length} Open Access articles out of ${articleMatches.length} total`);
      const articles = parseArticleXML(oaXmlText);
      console.log(`✅ Parsed ${articles.length} OA articles from XML`);
      return articles;
    } else {
      const articles = parseArticleXML(xmlText);
      console.log(`✅ Parsed ${articles.length} articles from XML`);
      return articles;
    }
  } catch (error) {
    console.error('❌ Error fetching article details:', error);
    return [];
  }
}

/**
 * Find related articles using PubMed eLink
 */
async function findRelatedArticles(pmid: string, linkType: string, limit: number = 10): Promise<string[]> {
  try {
    const linkUrl = `${PUBMED_LINK_URL}?dbfrom=pubmed&id=${pmid}&db=pubmed&linkname=${linkType}&retmode=json`;
    console.log(`🔍 Fetching related articles: ${linkUrl}`);

    const response = await fetch(linkUrl, {
      headers: {
        'User-Agent': 'RD-Agent/1.0 (Research Discovery Tool)'
      }
    });

    if (!response.ok) {
      console.error(`❌ PubMed eLink failed for PMID ${pmid}, linkType ${linkType}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`📊 PubMed eLink response for ${pmid} (${linkType}):`, JSON.stringify(data).substring(0, 500));

    const linksets = data.linksets || [];

    for (const linkset of linksets) {
      const linksetdbs = linkset.linksetdbs || [];
      for (const linksetdb of linksetdbs) {
        if (linksetdb.linkname === linkType) {
          const links = linksetdb.links || [];
          console.log(`✅ Found ${links.length} related articles for ${pmid} (${linkType})`);
          const filtered = links
            .filter((id: string) => id.toString() !== pmid) // Exclude self
            .slice(0, limit)
            .map((id: string) => id.toString());
          console.log(`📤 Returning ${filtered.length} articles after filtering and limiting`);
          return filtered;
        }
      }
    }

    console.log(`⚠️ No linksetdb found with linkname ${linkType} for PMID ${pmid}`);
    return [];
  } catch (error) {
    console.error(`❌ Error finding related articles (${linkType}):`, error);
    return [];
  }
}

/**
 * Convert PubMed article to network node
 */
function createNetworkNode(article: PubMedArticle, nodeType: NetworkNode['metadata']['node_type']): NetworkNode {
  const colors = {
    'base_article': '#4CAF50',      // Green for source
    'citing_article': '#2196F3',    // Blue for citations
    'reference_article': '#FF9800', // Orange for references
    'similar_article': '#9C27B0'    // Purple for similar
  };
  
  const sizes = {
    'base_article': 25,
    'citing_article': 15,
    'reference_article': 15,
    'similar_article': 15
  };
  
  return {
    id: article.pmid,
    label: article.title.length > 60 ? article.title.substring(0, 60) + '...' : article.title,
    size: sizes[nodeType],
    color: colors[nodeType],
    metadata: {
      pmid: article.pmid,
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      year: article.year,
      citation_count: article.citation_count,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      abstract: article.abstract,
      node_type: nodeType
    }
  };
}

/**
 * Main API endpoint handler
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pmid = searchParams.get('pmid');
    const networkType = searchParams.get('type') || 'mixed'; // 'citations', 'references', 'similar', 'mixed'
    const limit = parseInt(searchParams.get('limit') || '10');
    const debug = searchParams.get('debug') === 'true'; // Debug mode to see raw data
    const openAccessOnly = searchParams.get('open_access_only') === 'true'; // Filter for OA/Full-Text only

    if (!pmid) {
      return NextResponse.json(
        { error: 'PMID parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Network request: PMID=${pmid}, type=${networkType}, limit=${limit}, OA only=${openAccessOnly}`);

    console.log(`🔍 PubMed Network API: Building ${networkType} network for PMID ${pmid} (limit: ${limit}, debug: ${debug})`);

    // Fetch source article details
    const sourceArticles = await fetchArticleDetails([pmid]);
    const sourceArticle = sourceArticles[0];

    // If source article not found, return error (don't create placeholder)
    if (!sourceArticle) {
      console.log(`⚠️ Article PMID ${pmid} not found in PubMed`);
      return NextResponse.json(
        {
          error: 'Article not found in PubMed',
          pmid,
          details: 'The article may not be indexed in PubMed yet, or the PMID may be invalid.'
        },
        { status: 404 }
      );
    }

    // Initialize network data
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];

    // Add source node
    const sourceNode = createNetworkNode(sourceArticle, 'base_article');
    nodes.push(sourceNode);

    // Fetch related articles based on network type
    let citingPmids: string[] = [];
    let referencePmids: string[] = [];
    let similarPmids: string[] = [];

    if (networkType === 'citations' || networkType === 'mixed') {
      citingPmids = await findRelatedArticles(pmid, 'pubmed_pubmed_citedin', networkType === 'mixed' ? Math.floor(limit / 2) : limit);
    }

    if (networkType === 'references' || networkType === 'mixed') {
      referencePmids = await findRelatedArticles(pmid, 'pubmed_pubmed_refs', networkType === 'mixed' ? Math.floor(limit / 2) : limit);
    }

    if (networkType === 'similar') {
      similarPmids = await findRelatedArticles(pmid, 'pubmed_pubmed', limit);
    }

    console.log(`📊 Found: ${citingPmids.length} citations, ${referencePmids.length} references, ${similarPmids.length} similar`);

    // Fetch and add citing articles
    if (citingPmids.length > 0) {
      const citingArticles = await fetchArticleDetails(citingPmids, openAccessOnly);
      console.log(`✅ Fetched ${citingArticles.length} citing articles`);
      for (const article of citingArticles) {
        const node = createNetworkNode(article, 'citing_article');
        nodes.push(node);

        // Create edge from citing article to source
        edges.push({
          id: `${article.pmid}-cites-${pmid}`,
          source: article.pmid,
          target: pmid,
          type: 'citation',
          weight: 1
        });
      }
    }

    // Fetch and add reference articles
    if (referencePmids.length > 0) {
      const referenceArticles = await fetchArticleDetails(referencePmids, openAccessOnly);
      console.log(`✅ Fetched ${referenceArticles.length} reference articles`);
      for (const article of referenceArticles) {
        const node = createNetworkNode(article, 'reference_article');
        nodes.push(node);

        // Create edge from source to reference
        edges.push({
          id: `${pmid}-refs-${article.pmid}`,
          source: pmid,
          target: article.pmid,
          type: 'reference',
          weight: 1
        });
      }
    }

    // Fetch and add similar articles
    if (similarPmids.length > 0) {
      const similarArticles = await fetchArticleDetails(similarPmids, openAccessOnly);
      console.log(`✅ Fetched ${similarArticles.length} similar articles`);
      for (const article of similarArticles) {
        const node = createNetworkNode(article, 'similar_article');
        nodes.push(node);

        // Create bidirectional similarity edge
        edges.push({
          id: `${pmid}-similar-${article.pmid}`,
          source: pmid,
          target: article.pmid,
          type: 'similarity',
          weight: 0.8
        });
      }
    }

    const networkData: NetworkData = {
      nodes,
      edges,
      metadata: {
        source_pmid: pmid,
        network_type: networkType,
        total_nodes: nodes.length,
        total_edges: edges.length
      }
    };

    console.log(`✅ PubMed Network built: ${nodes.length} nodes, ${edges.length} edges`);
    console.log(`📤 Returning network data:`, {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      nodeIds: nodes.map(n => n.id).slice(0, 10),
      metadata: networkData.metadata
    });

    // If debug mode, include raw PMIDs and detailed fetch info in response
    if (debug) {
      // Count how many articles were actually fetched for each type
      const citingNodesCount = nodes.filter(n => n.metadata.node_type === 'citing_article').length;
      const referenceNodesCount = nodes.filter(n => n.metadata.node_type === 'reference_article').length;
      const similarNodesCount = nodes.filter(n => n.metadata.node_type === 'similar_article').length;

      return NextResponse.json({
        ...networkData,
        debug: {
          citingPmids,
          referencePmids,
          similarPmids,
          citingPmidsCount: citingPmids.length,
          referencePmidsCount: referencePmids.length,
          similarPmidsCount: similarPmids.length,
          citingNodesFetched: citingNodesCount,
          referenceNodesFetched: referenceNodesCount,
          similarNodesFetched: similarNodesCount,
          nodesCount: nodes.length,
          edgesCount: edges.length
        }
      });
    }

    return NextResponse.json(networkData);

  } catch (error) {
    console.error('PubMed network API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to build citation network from PubMed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
