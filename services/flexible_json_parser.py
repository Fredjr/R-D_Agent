"""
Flexible JSON Parser for LLM-Generated Content
Handles any variation of JSON responses with graceful fallbacks
"""

import json
import re
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ParseResult:
    """Result of JSON parsing attempt"""
    success: bool
    data: Any
    error: Optional[str] = None
    raw_input: Optional[str] = None
    parsing_method: Optional[str] = None

class FlexibleJSONParser:
    """
    Ultra-flexible JSON parser that can handle any LLM-generated content
    """
    
    def __init__(self):
        self.parsing_strategies = [
            self._parse_clean_json,
            self._parse_markdown_json,
            self._parse_partial_json,
            self._parse_key_value_pairs,
            self._parse_structured_text,
            self._extract_json_fragments,
            self._parse_yaml_like,
            self._parse_loose_format
        ]
    
    def parse(self, content: str, expected_structure: Optional[Dict] = None, 
              fallback_factory: Optional[Callable] = None) -> ParseResult:
        """
        Parse JSON content using multiple strategies
        
        Args:
            content: Raw content from LLM
            expected_structure: Expected JSON structure for validation
            fallback_factory: Function to generate fallback data
            
        Returns:
            ParseResult with parsed data or fallback
        """
        if not content or not isinstance(content, str):
            return self._create_fallback_result(content, expected_structure, fallback_factory, "empty_input")
        
        # Try each parsing strategy
        for i, strategy in enumerate(self.parsing_strategies):
            try:
                result = strategy(content)
                if result.success:
                    # Validate structure if provided
                    if expected_structure:
                        validated_data = self._validate_and_fill_structure(result.data, expected_structure)
                        return ParseResult(
                            success=True,
                            data=validated_data,
                            raw_input=content[:500],
                            parsing_method=f"strategy_{i+1}_{strategy.__name__}"
                        )
                    return result
            except Exception as e:
                logger.debug(f"Parsing strategy {strategy.__name__} failed: {e}")
                continue
        
        # All strategies failed, use fallback
        return self._create_fallback_result(content, expected_structure, fallback_factory, "all_strategies_failed")
    
    def _parse_clean_json(self, content: str) -> ParseResult:
        """Parse standard JSON"""
        try:
            data = json.loads(content.strip())
            return ParseResult(success=True, data=data, parsing_method="clean_json")
        except json.JSONDecodeError as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_markdown_json(self, content: str) -> ParseResult:
        """Parse JSON from markdown code blocks"""
        try:
            # Remove markdown code blocks
            cleaned = content.strip()
            
            # Handle various markdown formats
            patterns = [
                r'```json\s*(.*?)\s*```',
                r'```JSON\s*(.*?)\s*```',
                r'```\s*(.*?)\s*```',
                r'`(.*?)`'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, cleaned, re.DOTALL | re.IGNORECASE)
                if matches:
                    json_content = matches[0].strip()
                    try:
                        data = json.loads(json_content)
                        return ParseResult(success=True, data=data, parsing_method="markdown_json")
                    except json.JSONDecodeError:
                        continue
            
            return ParseResult(success=False, data=None, error="no_markdown_json_found")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_partial_json(self, content: str) -> ParseResult:
        """Parse JSON with common formatting issues"""
        try:
            cleaned = content.strip()
            
            # Fix common issues
            fixes = [
                # Remove trailing commas
                (r',(\s*[}\]])', r'\1'),
                # Fix unescaped quotes in strings (basic)
                (r'(?<!\\)"([^"]*)"([^"]*)"([^"]*)"(?=\s*[,}\]])', r'"\1\"\2\"\3"'),
                # Fix single quotes to double quotes
                (r"'([^']*)':", r'"\1":'),
                # Fix missing quotes on keys
                (r'(\w+):', r'"\1":'),
                # Fix newlines in strings
                (r'\n', r'\\n'),
                (r'\r', r'\\r'),
                (r'\t', r'\\t'),
            ]
            
            for pattern, replacement in fixes:
                cleaned = re.sub(pattern, replacement, cleaned)
            
            data = json.loads(cleaned)
            return ParseResult(success=True, data=data, parsing_method="partial_json")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_key_value_pairs(self, content: str) -> ParseResult:
        """Parse key-value pairs from structured text"""
        try:
            result = {}
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().strip('"\'')
                    value = value.strip().strip('"\'')
                    
                    # Try to parse value as JSON
                    try:
                        if value.startswith('[') or value.startswith('{'):
                            value = json.loads(value)
                        elif value.lower() in ['true', 'false']:
                            value = value.lower() == 'true'
                        elif value.isdigit():
                            value = int(value)
                        elif '.' in value and value.replace('.', '').isdigit():
                            value = float(value)
                    except:
                        pass  # Keep as string
                    
                    result[key] = value
            
            if result:
                return ParseResult(success=True, data=result, parsing_method="key_value_pairs")
            return ParseResult(success=False, data=None, error="no_key_value_pairs")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_structured_text(self, content: str) -> ParseResult:
        """Parse structured text into JSON-like format"""
        try:
            result = {}
            current_section = None
            current_content = []
            
            lines = content.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check if this is a section header
                if line.endswith(':') or line.startswith('#') or line.startswith('**'):
                    # Save previous section
                    if current_section and current_content:
                        result[current_section] = '\n'.join(current_content) if len(current_content) == 1 else current_content
                    
                    # Start new section
                    current_section = line.rstrip(':').strip('#').strip('*').strip()
                    current_content = []
                elif current_section:
                    current_content.append(line)
            
            # Save last section
            if current_section and current_content:
                result[current_section] = '\n'.join(current_content) if len(current_content) == 1 else current_content
            
            if result:
                return ParseResult(success=True, data=result, parsing_method="structured_text")
            return ParseResult(success=False, data=None, error="no_structured_text")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _extract_json_fragments(self, content: str) -> ParseResult:
        """Extract JSON fragments from mixed content"""
        try:
            # Look for JSON-like patterns
            json_patterns = [
                r'\{[^{}]*\}',  # Simple objects
                r'\[[^\[\]]*\]',  # Simple arrays
                r'\{[^{}]*\{[^{}]*\}[^{}]*\}',  # Nested objects
            ]
            
            fragments = []
            for pattern in json_patterns:
                matches = re.findall(pattern, content, re.DOTALL)
                for match in matches:
                    try:
                        parsed = json.loads(match)
                        fragments.append(parsed)
                    except:
                        continue
            
            if fragments:
                # If multiple fragments, combine them
                if len(fragments) == 1:
                    return ParseResult(success=True, data=fragments[0], parsing_method="json_fragments")
                else:
                    return ParseResult(success=True, data={"fragments": fragments}, parsing_method="json_fragments")
            
            return ParseResult(success=False, data=None, error="no_json_fragments")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_yaml_like(self, content: str) -> ParseResult:
        """Parse YAML-like content"""
        try:
            import yaml
            data = yaml.safe_load(content)
            if data:
                return ParseResult(success=True, data=data, parsing_method="yaml_like")
            return ParseResult(success=False, data=None, error="no_yaml_content")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _parse_loose_format(self, content: str) -> ParseResult:
        """Parse very loose format - extract any meaningful data"""
        try:
            result = {"raw_content": content}
            
            # Extract numbers
            numbers = re.findall(r'\d+\.?\d*', content)
            if numbers:
                result["extracted_numbers"] = [float(n) if '.' in n else int(n) for n in numbers]
            
            # Extract quoted strings
            quoted_strings = re.findall(r'"([^"]*)"', content)
            if quoted_strings:
                result["extracted_strings"] = quoted_strings
            
            # Extract words that might be keys
            potential_keys = re.findall(r'(\w+):', content)
            if potential_keys:
                result["potential_keys"] = potential_keys
            
            return ParseResult(success=True, data=result, parsing_method="loose_format")
        except Exception as e:
            return ParseResult(success=False, data=None, error=str(e))
    
    def _validate_and_fill_structure(self, data: Any, expected_structure: Dict) -> Dict:
        """Validate and fill missing keys in parsed data"""
        if not isinstance(data, dict):
            # If data is not a dict, create one with the data as content
            data = {"content": data}
        
        result = {}
        
        for key, default_value in expected_structure.items():
            if key in data:
                result[key] = data[key]
            else:
                # Generate appropriate default based on type
                if isinstance(default_value, dict):
                    result[key] = {}
                elif isinstance(default_value, list):
                    result[key] = []
                elif isinstance(default_value, str):
                    result[key] = ""
                elif isinstance(default_value, (int, float)):
                    result[key] = 0
                elif isinstance(default_value, bool):
                    result[key] = False
                else:
                    result[key] = default_value
        
        # Include any extra keys from parsed data
        for key, value in data.items():
            if key not in result:
                result[key] = value
        
        return result
    
    def _create_fallback_result(self, content: str, expected_structure: Optional[Dict], 
                              fallback_factory: Optional[Callable], reason: str) -> ParseResult:
        """Create fallback result when all parsing fails"""
        if fallback_factory:
            try:
                fallback_data = fallback_factory()
                return ParseResult(
                    success=True,
                    data=fallback_data,
                    error=f"used_fallback_{reason}",
                    raw_input=str(content)[:500] if content else None,
                    parsing_method="fallback_factory"
                )
            except Exception as e:
                logger.error(f"Fallback factory failed: {e}")
        
        # Generate basic fallback from expected structure
        if expected_structure:
            fallback_data = self._validate_and_fill_structure({}, expected_structure)
            fallback_data["parsing_error"] = reason
            fallback_data["raw_input"] = str(content)[:500] if content else None
        else:
            fallback_data = {
                "parsing_error": reason,
                "raw_input": str(content)[:500] if content else None,
                "content": str(content) if content else None
            }
        
        return ParseResult(
            success=True,  # We always succeed with fallback
            data=fallback_data,
            error=f"fallback_{reason}",
            raw_input=str(content)[:500] if content else None,
            parsing_method="basic_fallback"
        )

# Global parser instance
flexible_parser = FlexibleJSONParser()

def parse_llm_json(content: str, expected_structure: Optional[Dict] = None, 
                   fallback_factory: Optional[Callable] = None) -> ParseResult:
    """
    Convenience function to parse LLM-generated JSON content
    
    Args:
        content: Raw content from LLM
        expected_structure: Expected JSON structure
        fallback_factory: Function to generate fallback data
        
    Returns:
        ParseResult with parsed data
    """
    return flexible_parser.parse(content, expected_structure, fallback_factory)
