import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  abstract?: string;
  citation_count?: number;
}

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
    node_type: string;
    source: 'collection' | 'pubmed_citation' | 'pubmed_reference';
  };
}

interface NetworkEdge {
  id: string;
  from: string;
  to: string;
  relationship: string;
  weight?: number;
}

interface HybridNetworkResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    total_nodes: number;
    total_edges: number;
    collection_articles: number;
    pubmed_expansions: number;
    inter_collection_edges: number; // Edges between papers within the collection
    source: 'hybrid_collection_pubmed';
  };
}

// Utility function to fetch article details from PubMed
async function fetchPubMedArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];
  
  try {
    const pmidList = pmids.join(',');
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmidList}&retmode=xml&rettype=abstract`;
    
    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.log(`⚠️ PubMed efetch failed: ${response.status}`);
      return [];
    }
    
    const xmlText = await response.text();
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error('Error fetching PubMed article details:', error);
    return [];
  }
}

// Parse PubMed XML response
function parsePubMedXML(xmlText: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  
  // Extract individual articles
  const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
  
  for (const articleXml of articleMatches) {
    try {
      // Extract PMID
      const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      const pmid = pmidMatch ? pmidMatch[1] : '';
      
      // Extract title
      const titleMatch = articleXml.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Unknown Title';
      
      // Extract authors
      const authors: string[] = [];
      const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      for (const authorXml of authorMatches) {
        const lastNameMatch = authorXml.match(/<LastName>(.*?)<\/LastName>/);
        const firstNameMatch = authorXml.match(/<ForeName>(.*?)<\/ForeName>/);
        if (lastNameMatch) {
          const lastName = lastNameMatch[1];
          const firstName = firstNameMatch ? firstNameMatch[1] : '';
          authors.push(firstName ? `${firstName} ${lastName}` : lastName);
        }
      }
      
      // Extract journal
      const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
      const journal = journalMatch ? journalMatch[1] : 'Unknown Journal';
      
      // Extract year
      const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extract abstract
      const abstractMatch = articleXml.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
      const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      if (pmid) {
        articles.push({
          pmid,
          title,
          authors,
          journal,
          year,
          abstract,
          citation_count: 0 // Will be populated if available
        });
      }
    } catch (error) {
      console.error('Error parsing article XML:', error);
    }
  }
  
  return articles;
}

// Find related articles using PubMed eLink
async function findRelatedPubMedArticles(pmid: string, linkType: string, limit: number = 10): Promise<string[]> {
  try {
    const elinkUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=pubmed&db=pubmed&id=${pmid}&linkname=${linkType}&retmode=json`;
    
    const response = await fetch(elinkUrl);
    if (!response.ok) {
      console.log(`⚠️ PubMed elink failed for ${pmid}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    const linksets = data.linksets || [];
    
    for (const linkset of linksets) {
      if (linkset.linksetdbs) {
        for (const linksetdb of linkset.linksetdbs) {
          if (linksetdb.linkname === linkType && linksetdb.links) {
            return linksetdb.links.slice(0, limit);
          }
        }
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error finding related articles for ${pmid}:`, error);
    return [];
  }
}

// Create network node from article data
function createNetworkNode(article: PubMedArticle, nodeType: 'collection' | 'pubmed_citation' | 'pubmed_reference'): NetworkNode {
  const colors = {
    collection: '#4CAF50',      // Green for collection articles
    pubmed_citation: '#2196F3', // Blue for citing articles
    pubmed_reference: '#FF9800' // Orange for reference articles
  };
  
  return {
    id: article.pmid,
    label: article.title,
    size: Math.min(20 + (article.citation_count || 0) / 10, 50),
    color: colors[nodeType],
    metadata: {
      pmid: article.pmid,
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      year: article.year,
      citation_count: article.citation_count || 0,
      url: `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
      abstract: article.abstract || '',
      node_type: nodeType,
      source: nodeType
    }
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeReferences = searchParams.get('includeReferences') !== 'false';
    const includeCitations = searchParams.get('includeCitations') !== 'false';
    
    console.log(`🔍 Fetching hybrid collection network for collection ${collectionId}`);
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required for collection network' },
        { status: 400 }
      );
    }
    
    // Step 1: Fetch collection articles from backend
    const collectionResponse = await fetch(
      `${BACKEND_URL}/projects/${projectId}/collections/${collectionId}/articles?limit=50`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-ID': request.headers.get('User-ID') || 'default_user',
        },
      }
    );
    
    if (!collectionResponse.ok) {
      console.log(`⚠️ Backend collection fetch failed: ${collectionResponse.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch collection articles from backend' },
        { status: collectionResponse.status }
      );
    }
    
    const collectionData = await collectionResponse.json();
    const collectionArticles = collectionData.articles || [];
    
    console.log(`📊 Found ${collectionArticles.length} articles in collection`);
    
    // Step 2: Extract PMIDs from collection articles
    const collectionPmids = collectionArticles
      .filter((article: any) => article.article_pmid)
      .map((article: any) => article.article_pmid);
    
    console.log(`📊 Found ${collectionPmids.length} articles with PMIDs`);
    
    if (collectionPmids.length === 0) {
      // Return empty network if no PMIDs found
      return NextResponse.json({
        nodes: [],
        edges: [],
        metadata: {
          total_nodes: 0,
          total_edges: 0,
          collection_articles: 0,
          pubmed_expansions: 0,
          source: 'hybrid_collection_pubmed'
        }
      });
    }
    
    // Step 3: Fetch detailed article information from PubMed
    const collectionArticleDetails = await fetchPubMedArticleDetails(collectionPmids);

    // Step 4: Create network nodes and edges
    const nodes: NetworkNode[] = [];
    const edges: NetworkEdge[] = [];
    const collectionPmidSet = new Set(collectionPmids); // For fast lookup

    // Add collection articles as nodes
    for (const article of collectionArticleDetails) {
      nodes.push(createNetworkNode(article, 'collection'));
    }

    console.log(`✅ Created ${nodes.length} collection nodes`);

    // Step 5: Find INTER-COLLECTION relationships (papers citing each other within the collection)
    // This is the key feature: show how papers in the collection relate to each other
    let interCollectionEdges = 0;

    console.log(`🔍 Finding inter-collection relationships for ${collectionPmids.length} papers...`);

    for (const pmid of collectionPmids) {
      // Find what this paper references
      const referencePmids = await findRelatedPubMedArticles(pmid, 'pubmed_pubmed_refs', 50); // Get more to find inter-collection links

      // Check if any references are also in the collection
      for (const refPmid of referencePmids) {
        if (collectionPmidSet.has(refPmid) && refPmid !== pmid) {
          // This paper references another paper in the collection!
          const edgeId = `${pmid}-cites-${refPmid}`;
          // Avoid duplicate edges
          if (!edges.find(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              from: pmid,
              to: refPmid,
              relationship: 'intra_collection_citation', // Special relationship type
              weight: 2 // Higher weight for inter-collection relationships
            });
            interCollectionEdges++;
          }
        }
      }

      // Also check citations (papers that cite this one)
      const citingPmids = await findRelatedPubMedArticles(pmid, 'pubmed_pubmed_citedin', 50);

      for (const citingPmid of citingPmids) {
        if (collectionPmidSet.has(citingPmid) && citingPmid !== pmid) {
          // Another paper in the collection cites this one!
          const edgeId = `${citingPmid}-cites-${pmid}`;
          // Avoid duplicate edges
          if (!edges.find(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              from: citingPmid,
              to: pmid,
              relationship: 'intra_collection_citation',
              weight: 2
            });
            interCollectionEdges++;
          }
        }
      }
    }

    console.log(`✅ Found ${interCollectionEdges} inter-collection citation relationships`);

    // Step 6: Expand network with external PubMed citations and references (optional expansion)
    let expansionCount = 0;
    const maxExpansions = Math.min(limit - nodes.length, collectionPmids.length * 3);

    for (const pmid of collectionPmids.slice(0, 3)) { // Limit to first 3 articles for performance
      if (expansionCount >= maxExpansions) break;

      // Fetch citing articles (external only - not already in collection)
      if (includeCitations) {
        const citingPmids = await findRelatedPubMedArticles(pmid, 'pubmed_pubmed_citedin', 5);
        const externalCitingPmids = citingPmids.filter(p => !collectionPmidSet.has(p));

        if (externalCitingPmids.length > 0) {
          const citingArticles = await fetchPubMedArticleDetails(externalCitingPmids.slice(0, 3));

          for (const citingArticle of citingArticles) {
            if (expansionCount >= maxExpansions) break;

            // Add citing article as node if not already present
            if (!nodes.find(n => n.id === citingArticle.pmid)) {
              nodes.push(createNetworkNode(citingArticle, 'pubmed_citation'));
              expansionCount++;
            }

            // Add edge from citing article to collection article
            edges.push({
              id: `${citingArticle.pmid}-cites-${pmid}`,
              from: citingArticle.pmid,
              to: pmid,
              relationship: 'citation',
              weight: 1
            });
          }
        }
      }

      // Fetch reference articles (external only - not already in collection)
      if (includeReferences && expansionCount < maxExpansions) {
        const referencePmids = await findRelatedPubMedArticles(pmid, 'pubmed_pubmed_refs', 5);
        const externalReferencePmids = referencePmids.filter(p => !collectionPmidSet.has(p));

        if (externalReferencePmids.length > 0) {
          const referenceArticles = await fetchPubMedArticleDetails(externalReferencePmids.slice(0, 3));

          for (const referenceArticle of referenceArticles) {
            if (expansionCount >= maxExpansions) break;

            // Add reference article as node if not already present
            if (!nodes.find(n => n.id === referenceArticle.pmid)) {
              nodes.push(createNetworkNode(referenceArticle, 'pubmed_reference'));
              expansionCount++;
            }

            // Add edge from collection article to reference article
            edges.push({
              id: `${pmid}-references-${referenceArticle.pmid}`,
              from: pmid,
              to: referenceArticle.pmid,
              relationship: 'reference',
              weight: 1
            });
          }
        }
      }
    }

    console.log(`✅ Added ${expansionCount} external PubMed expansion nodes`);
    console.log(`✅ Total edges: ${edges.length} (${interCollectionEdges} inter-collection + ${edges.length - interCollectionEdges} external)`);
    
    const response: HybridNetworkResponse = {
      nodes,
      edges,
      metadata: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        collection_articles: collectionArticleDetails.length,
        pubmed_expansions: expansionCount,
        inter_collection_edges: interCollectionEdges,
        source: 'hybrid_collection_pubmed'
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Hybrid collection network error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create hybrid collection network',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
