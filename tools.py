from langchain.tools import BaseTool
import requests
import xml.etree.ElementTree as ET
from typing import Optional
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class PubMedSearchTool(BaseTool):
    name: str = "PubMed Search"
    description: str = (
        "Use this tool to retrieve PubMed articles. The input should be a specific query. "
        "Returns a JSON array string of articles: title, abstract, authors, pub_year, citation_count, pmid."
    )
    
    def _run(self, query: str) -> str:
        """
        Search PubMed for articles using the eUtils API and return structured JSON string.
        Returns JSON array string with up to 5 articles, each containing:
        - title, abstract, authors, pub_year, citation_count, pmid
        """
        import json as _json
        try:
            # Step 1: Search for articles and get PMIDs
            search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            retmax = int(os.getenv("PUBMED_RETMAX", "25"))
            search_params = {
                "db": "pubmed",
                "term": query,
                "retmax": retmax,
                "retmode": "json",
                "sort": "relevance"
            }
            
            search_response = requests.get(search_url, params=search_params, timeout=20)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            # Extract PMIDs from search results
            pmids = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not pmids:
                return _json.dumps([])
            
            # Step 2: Fetch detailed information for each PMID
            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "xml",
                "rettype": "abstract"
            }
            
            fetch_response = requests.get(fetch_url, params=fetch_params, timeout=30)
            fetch_response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(fetch_response.content)
            
            def _extract_year(article_el) -> int:
                year_el = article_el.find(".//PubDate/Year")
                if year_el is not None and year_el.text and year_el.text.isdigit():
                    return int(year_el.text)
                medline_el = article_el.find(".//PubDate/MedlineDate")
                if medline_el is not None and medline_el.text:
                    for tok in medline_el.text.split():
                        if tok.isdigit() and len(tok) == 4:
                            return int(tok)
                return 0
            
            articles = []
            for article in root.findall(".//PubmedArticle"):
                try:
                    # Extract title
                    title_elem = article.find(".//ArticleTitle")
                    title = (title_elem.text or "").strip() if title_elem is not None else ""
                    
                    # Extract authors
                    author_list = article.findall(".//Author")
                    authors = []
                    for author in author_list:
                        last_name = author.find("LastName")
                        fore_name = author.find("ForeName")
                        if last_name is not None and fore_name is not None and last_name.text and fore_name.text:
                            authors.append(f"{fore_name.text} {last_name.text}")
                        elif last_name is not None and last_name.text:
                            authors.append(last_name.text)
                    
                    author_string = "; ".join(authors) if authors else ""
                    
                    # Extract abstract (handle multiple AbstractText segments)
                    abstract_parts = []
                    for ab in article.findall(".//Abstract/AbstractText"):
                        txt = (ab.text or "").strip()
                        label = ab.get('Label')
                        if label:
                            abstract_parts.append(f"{label}: {txt}" if txt else label)
                        elif txt:
                            abstract_parts.append(txt)
                    abstract = " \n".join([p for p in abstract_parts if p])
                    
                    # Extract publication year
                    pub_year = _extract_year(article)
                    
                    # Extract PMID
                    pmid_elem = article.find(".//PMID")
                    pmid = pmid_elem.text.strip() if pmid_elem is not None and pmid_elem.text else ""

                    # Extract Journal and DOI when available
                    journal_elem = article.find(".//Journal/Title")
                    journal = (journal_elem.text or "").strip() if journal_elem is not None else ""
                    doi = ""
                    pmcid = ""
                    for el in article.findall(".//ArticleIdList/ArticleId"):
                        if el.get('IdType') == 'doi' and el.text:
                            doi = el.text.strip()
                        if el.get('IdType') == 'pmc' and el.text:
                            pmcid = el.text.strip()  # e.g., PMC123456
                    
                    articles.append({
                        "title": title,
                        "abstract": abstract,
                        "authors": author_string,
                        "pub_year": pub_year,
                        "pmid": pmid,
                        "journal": journal,
                        "doi": doi,
                        "pmcid": pmcid,
                        "url": (f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "")
                    })
                    
                except Exception:
                    # Skip articles with parsing errors
                    continue
            
            if not articles:
                return _json.dumps([])
            
            # Step 3: Enrich with citation counts via NIH iCite (best-effort)
            try:
                icite_url = "https://icite.od.nih.gov/api/pubs"
                pmid_list = ",".join([a["pmid"] for a in articles if a.get("pmid")])
                if pmid_list:
                    r = requests.get(icite_url, params={"pmids": pmid_list}, timeout=15)
                    r.raise_for_status()
                    icite = r.json()
                    data = icite.get("data") if isinstance(icite, dict) else icite
                    citation_map = {}
                    if isinstance(data, list):
                        for entry in data:
                            pid = str(entry.get("pmid", ""))
                            count = 0
                            if isinstance(entry.get("cited_by"), list):
                                count = len(entry.get("cited_by") or [])
                            elif isinstance(entry.get("cited_by"), int):
                                count = int(entry.get("cited_by") or 0)
                            elif isinstance(entry.get("citation_count"), int):
                                count = int(entry.get("citation_count") or 0)
                            elif isinstance(entry.get("times_cited"), int):
                                count = int(entry.get("times_cited") or 0)
                            citation_map[pid] = count
                    for a in articles:
                        a["citation_count"] = int(citation_map.get(str(a.get("pmid", "")), 0))
                else:
                    for a in articles:
                        a["citation_count"] = 0
            except Exception:
                for a in articles:
                    a["citation_count"] = 0
            
            return _json.dumps(articles)
            
        except requests.RequestException:
            return _json.dumps([])
        except Exception:
            return _json.dumps([])
    
    async def _arun(self, query: str) -> str:
        """
        Async version of the run method.
        """
        return self._run(query)


class WebSearchTool(BaseTool):
    name: str = "Web Article Search"
    description: str = "Use this tool to search the general web for scientific articles, research papers, and academic content. The input should be a specific search query string."
    
    def _run(self, query: str) -> str:
        """
        Search the web using Google's Programmable Search Engine API.
        
        Args:
            query (str): Search query string
            
        Returns:
            str: Formatted string containing search results
        """
        try:
            # Retrieve API credentials from environment variables
            api_key = os.getenv("GOOGLE_API_KEY")
            cse_id = os.getenv("GOOGLE_CSE_ID")
            
            if not api_key or not cse_id:
                return "Error: Google API credentials not found. Please check your .env file."
            
            # Construct the Google Search API request URL
            search_url = "https://www.googleapis.com/customsearch/v1"
            search_params = {
                "key": api_key,
                "cx": cse_id,
                "q": query,
                "num": 5  # Get top 5 results
            }
            
            # Make the API call
            response = requests.get(search_url, params=search_params)
            response.raise_for_status()
            
            # Parse the JSON response
            search_data = response.json()
            
            # Check if we have search results
            if "items" not in search_data:
                return f"No search results found for query: '{query}'"
            
            # Extract and format the results
            results = []
            for i, item in enumerate(search_data["items"][:5], 1):
                title = item.get("title", "No title available")
                link = item.get("link", "No link available")
                snippet = item.get("snippet", "No description available")
                
                results.append(f"Result {i}:\nTitle: {title}\nLink: {link}\nDescription: {snippet}\n")
            
            # Format the final output
            result_count = len(results)
            output = f"Found {result_count} web search results for query: '{query}'\n\n"
            output += "\n".join(results)
            
            return output
            
        except requests.RequestException as e:
            return f"Error accessing Google Search API: {str(e)}"
        except Exception as e:
            return f"Error processing web search: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """
        Async version of the run method.
        """
        return self._run(query)


class PatentsSearchTool(BaseTool):
    name: str = "Patents Search"
    description: str = "Use this tool to search Google Patents via Google CSE. Input: query string. Returns JSON array of items with title, url, summary."

    def _run(self, query: str) -> str:
        try:
            import json as _json
            api_key = os.getenv("GOOGLE_API_KEY")
            cse_id = os.getenv("GOOGLE_CSE_ID")
            if not api_key or not cse_id:
                return _json.dumps([])
            # Bias patents via site restriction
            q = f"site:google.com/patents {query}"
            url = "https://www.googleapis.com/customsearch/v1"
            retmax = int(os.getenv("PATENTS_RETMAX", "10"))
            params = {"key": api_key, "cx": cse_id, "q": q, "num": min(10, retmax)}
            r = requests.get(url, params=params, timeout=10)
            r.raise_for_status()
            data = r.json()
            items = data.get("items") or []
            out = []
            for it in items:
                title = it.get("title") or ""
                link = it.get("link") or ""
                snippet = it.get("snippet") or ""
                out.append({
                    "title": title,
                    "abstract": snippet,
                    "pub_year": 0,
                    "pmid": None,
                    "url": link,
                    "citation_count": 0,
                    "source": "patents",
                })
            return _json.dumps(out)
        except Exception:
            try:
                import json as _json
                return _json.dumps([])
            except Exception:
                return "[]"

    async def _arun(self, query: str) -> str:
        return self._run(query)

# Example usage and testing
if __name__ == "__main__":
    # Test the PubMed tool
    print("=== Testing PubMed Tool ===")
    pubmed_tool = PubMedSearchTool()
    pubmed_result = pubmed_tool._run("cancer immunotherapy")
    print(pubmed_result)
    
    print("\n" + "="*50 + "\n")
    
    # Test the Web Search tool
    print("=== Testing Web Search Tool ===")
    web_tool = WebSearchTool()
    web_result = web_tool._run("CRISPR gene editing review site:researchgate.net")
    print(web_result)
