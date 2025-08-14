# R&D Agent FastAPI Backend

A FastAPI backend application for the R&D Agent project.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Run the development server:
```bash
uvicorn main:app --reload
```

3. Access the API at: http://127.0.0.1:8000

## API Endpoints

- `GET /` - Returns status message: `{"status": "ok"}`

## Dependencies

- fastapi
- uvicorn
- langchain
- langchain-google-genai
- python-dotenv
- requests

## Tools

### PubMedSearchTool

A LangChain tool for searching PubMed scientific articles using the eUtils API.

**Features:**
- Search PubMed database with specific queries
- Retrieve top 5 most relevant articles
- Extract title, authors, journal, publication year, PMID, and abstract
- Automatic error handling and response formatting

**Usage:**
```python
from tools import PubMedSearchTool

tool = PubMedSearchTool()
result = tool._run("cancer immunotherapy")
print(result)
```

**API Endpoints Used:**
- PubMed eUtils Search API: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi
- PubMed eUtils Fetch API: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi
