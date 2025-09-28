import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // In production, this would call OpenAI's embedding API
    // For now, we'll return a mock embedding
    const mockEmbedding = generateMockEmbedding(text);

    return NextResponse.json({
      embedding: mockEmbedding,
      model: 'text-embedding-ada-002',
      usage: {
        prompt_tokens: text.split(' ').length,
        total_tokens: text.split(' ').length
      }
    });

  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock embedding for testing
 */
function generateMockEmbedding(text: string): number[] {
  // Create a deterministic mock embedding based on text
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // Smaller dimension for testing

  // Simple hash-based embedding generation
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode + i * j) % embedding.length;
      embedding[index] += Math.sin(charCode * 0.1) * 0.1;
    }
  }

  // Normalize the embedding
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => norm > 0 ? val / norm : 0);
}
