#!/bin/bash

# Setup script for OpenAI API key
# This script securely sets up the OpenAI API key as an environment variable

echo "🔐 Setting up OpenAI API Key for R&D Agent"
echo "=========================================="

# Check if API key is already set
if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OpenAI API key is already set in environment"
    echo "   Key starts with: ${OPENAI_API_KEY:0:10}..."
else
    echo "⚠️  OpenAI API key not found in environment"
    echo ""
    echo "To set your OpenAI API key securely:"
    echo "1. Run: export OPENAI_API_KEY='your-api-key-here'"
    echo "2. Or add it to your ~/.bashrc or ~/.zshrc file"
    echo "3. Then run this script again"
    echo ""
    echo "🔒 SECURITY NOTE: Never commit API keys to version control!"
    echo ""
    
    # Offer to set it temporarily for this session
    read -p "Would you like to set the API key for this session? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Please enter your OpenAI API key:"
        read -s OPENAI_API_KEY
        export OPENAI_API_KEY
        echo "✅ API key set for this session"
    else
        echo "❌ API key not set. Tests will use mock LLM."
        exit 1
    fi
fi

# Validate API key format
if [[ $OPENAI_API_KEY =~ ^sk-proj-[A-Za-z0-9_-]{48,}$ ]] || [[ $OPENAI_API_KEY =~ ^sk-[A-Za-z0-9_-]{48,}$ ]]; then
    echo "✅ API key format appears valid"
else
    echo "⚠️  API key format may be invalid (should start with 'sk-' or 'sk-proj-')"
fi

# Test API key by making a simple request
echo ""
echo "🧪 Testing API key with simple request..."

python3 -c "
import os
import openai
from openai import OpenAI

try:
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    response = client.chat.completions.create(
        model='gpt-3.5-turbo',
        messages=[{'role': 'user', 'content': 'Hello, this is a test. Please respond with just \"API key working\".'}],
        max_tokens=10
    )
    print('✅ API key test successful!')
    print(f'   Response: {response.choices[0].message.content}')
except Exception as e:
    print(f'❌ API key test failed: {e}')
    print('   Please check your API key and try again')
    exit(1)
"

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 OpenAI API key setup complete!"
    echo "   You can now run tests with real LLM integration"
    echo ""
    echo "To run the intelligent fallback integration test:"
    echo "   python3 test_intelligent_fallback_integration.py"
else
    echo ""
    echo "❌ API key setup failed"
    echo "   Tests will fall back to mock LLM"
fi
