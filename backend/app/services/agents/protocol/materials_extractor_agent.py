"""
Materials Extractor Agent

Week 24 Phase 2: Extract materials with catalog numbers, suppliers, and sources
"""

import logging
import json
import os
from typing import Dict, Any
from openai import AsyncOpenAI

from backend.app.services.agents.protocol.base_protocol_agent import BaseProtocolAgent

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class MaterialsExtractorAgent(BaseProtocolAgent):
    """Agent 1: Extract materials with catalog numbers, suppliers, and source citations"""
    
    def __init__(self):
        super().__init__("MaterialsExtractorAgent")
        self.model = "gpt-4o-mini"
        self.temperature = 0.2  # Low temperature for accurate extraction
    
    async def execute(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract materials from paper content."""
        logger.info(f"🔬 {self.name}: Extracting materials...")
        
        # Build prompt
        prompt = self.get_prompt(context, previous_outputs)
        
        # Call OpenAI
        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at extracting materials lists from scientific protocols. Extract materials with catalog numbers, suppliers, and source citations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=self.temperature
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate output
            if not self.validate_output(result):
                logger.error(f"❌ {self.name}: Invalid output format")
                return self._get_empty_output()
            
            logger.info(f"✅ {self.name}: Extracted {len(result.get('materials', []))} materials")
            return result
            
        except Exception as e:
            logger.error(f"❌ {self.name}: Error during extraction: {e}")
            return self._get_empty_output()
    
    def get_prompt(
        self,
        context: Dict[str, Any],
        previous_outputs: Dict[str, Any]
    ) -> str:
        """Generate prompt for materials extraction."""
        article = context.get("article")
        pdf_text = context.get("pdf_text")
        tables = context.get("tables", [])
        
        # Use PDF text if available, otherwise abstract
        if pdf_text:
            # Extract methods section
            from backend.app.services.pdf_text_extractor import PDFTextExtractor
            extractor = PDFTextExtractor()
            content = extractor.extract_methods_section(pdf_text, max_length=10000)
            content_source = "Methods Section (PDF)"
        else:
            content = article.abstract or "No abstract available"
            content_source = "Abstract Only"
        
        # Format tables if available
        tables_section = ""
        if tables:
            tables_section = "\n**EXTRACTED TABLES:**\n"
            for table in tables[:2]:  # First 2 tables
                tables_section += f"\nTable {table.get('table_number', '?')}:\n"
                headers = table.get('headers', [])
                rows = table.get('rows', [])
                if headers:
                    tables_section += "| " + " | ".join(str(h) for h in headers) + " |\n"
                for row in rows[:5]:  # First 5 rows
                    tables_section += "| " + " | ".join(str(cell) if cell else "" for cell in row) + " |\n"
        
        prompt = f"""Extract ALL materials mentioned in this scientific protocol.

**Paper:** {article.title}
**Content Source:** {content_source}

**Content:**
{content}

{tables_section}

**Instructions:**
1. Extract EVERY material mentioned (reagents, chemicals, cells, antibodies, etc.)
2. Include catalog numbers if mentioned
3. Include suppliers if mentioned
4. Include amounts/concentrations if mentioned
5. Cite the source (which section/table the material was found in)

**Return JSON format (15 lines):**
{{
    "materials": [
        {{
            "name": "Material name",
            "catalog_number": "Cat# or null",
            "supplier": "Supplier or null",
            "amount": "Amount/concentration or null",
            "notes": "Any special notes or null"
        }}
    ],
    "material_sources": {{
        "Material name": "Found in Methods section, paragraph 2"
    }},
    "equipment": ["Equipment 1", "Equipment 2"]
}}

If no materials found, return empty arrays."""
        
        return prompt
    
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate materials extraction output."""
        if not isinstance(output, dict):
            return False
        
        # Check required fields
        if "materials" not in output:
            return False
        
        if not isinstance(output["materials"], list):
            return False
        
        # Validate each material
        for material in output["materials"]:
            if not isinstance(material, dict):
                return False
            if "name" not in material:
                return False
        
        return True
    
    def _get_empty_output(self) -> Dict[str, Any]:
        """Return empty output on error."""
        return {
            "materials": [],
            "material_sources": {},
            "equipment": []
        }

