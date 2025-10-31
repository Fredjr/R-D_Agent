"""
Quick test script to verify Cerebras API integration for article summaries
"""

import requests
import json

# Test article data
test_article = {
    "title": "Deep Learning for Medical Image Analysis",
    "abstract": """Deep learning has revolutionized medical image analysis by enabling automated 
    detection and diagnosis of various diseases. This study presents a comprehensive review of 
    deep learning techniques applied to medical imaging, including convolutional neural networks 
    (CNNs) for image classification, segmentation, and detection. We evaluate the performance 
    of various architectures on multiple medical imaging datasets and demonstrate significant 
    improvements over traditional methods. Our results show that deep learning models can achieve 
    diagnostic accuracy comparable to expert radiologists in several tasks."""
}

def test_cerebras_api():
    """Test Cerebras API with dual summary generation"""
    
    api_key = "csk-mmt22ed2rdrc9tehyet2x48xmy94mt3p5492rhpepwe3pddx"
    
    prompt = f"""You are a research assistant that creates accurate summaries of scientific papers.

Generate TWO summaries for this research paper:

1. SHORT SUMMARY (3-5 sentences): A concise overview covering the main objective, methodology, key findings, and significance.

2. EXPANDED SUMMARY (8-12 sentences): A more detailed summary that includes:
   - Research context and motivation
   - Detailed methodology and approach
   - Comprehensive findings and results
   - Implications and significance
   - Limitations and future directions

Title: {test_article['title']}
Abstract: {test_article['abstract']}

Format your response EXACTLY as follows:
SHORT:
[Your 3-5 sentence summary here]

EXPANDED:
[Your 8-12 sentence expanded summary here]"""

    print("🧪 Testing Cerebras API...")
    print(f"📝 Article: {test_article['title']}")
    print()
    
    try:
        response = requests.post(
            'https://api.cerebras.ai/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            },
            json={
                'model': 'llama-3.1-8b',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a research assistant that creates concise, accurate summaries of scientific papers. Always follow the exact format requested.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7,
                'max_tokens': 1000
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            full_response = data['choices'][0]['message']['content'].strip()
            
            print("✅ Cerebras API Response:")
            print("=" * 80)
            print(full_response)
            print("=" * 80)
            print()
            
            # Parse summaries
            import re
            short_match = re.search(r'SHORT:\s*([\s\S]*?)(?=EXPANDED:|$)', full_response, re.IGNORECASE)
            expanded_match = re.search(r'EXPANDED:\s*([\s\S]*?)$', full_response, re.IGNORECASE)
            
            if short_match and expanded_match:
                short_summary = short_match.group(1).strip()
                expanded_summary = expanded_match.group(1).strip()
                
                print("📊 Parsed Summaries:")
                print()
                print("SHORT SUMMARY:")
                print(short_summary)
                print()
                print(f"Length: {len(short_summary)} characters")
                print()
                print("EXPANDED SUMMARY:")
                print(expanded_summary)
                print()
                print(f"Length: {len(expanded_summary)} characters")
                print()
                print("✅ Test PASSED - Both summaries generated successfully!")
            else:
                print("❌ Failed to parse summaries from response")
                print("Response format may need adjustment")
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_cerebras_api()

