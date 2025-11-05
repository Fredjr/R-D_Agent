import { NextRequest, NextResponse } from 'next/server';
import { pubmedCache } from '@/utils/pubmedCache';

/**
 * Cache Invalidation API
 * Allows manual invalidation of cached PubMed data
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pmid, pattern, clearAll } = body;

    if (clearAll) {
      // Clear entire cache
      pubmedCache.clear();
      console.log('🧹 Cleared entire PubMed cache');
      return NextResponse.json({
        success: true,
        message: 'Entire cache cleared',
        cleared_entries: 'all'
      });
    }

    if (pmid) {
      // Invalidate all cache entries related to a specific PMID
      const patterns = [
        new RegExp(`pmid=${pmid}`),
        new RegExp(`/articles/${pmid}/`),
        new RegExp(`id=${pmid}`)
      ];

      let clearedCount = 0;
      patterns.forEach(pattern => {
        const matches = pubmedCache.getByPattern(pattern);
        matches.forEach(({ key }) => {
          // Extract params from key to call delete properly
          const url = new URL(`http://dummy${key}`);
          const endpoint = url.pathname;
          const params: Record<string, any> = {};
          url.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          pubmedCache.delete(endpoint, params);
          clearedCount++;
        });
      });

      console.log(`🗑️ Cleared ${clearedCount} cache entries for PMID ${pmid}`);
      return NextResponse.json({
        success: true,
        message: `Cleared cache for PMID ${pmid}`,
        cleared_entries: clearedCount
      });
    }

    if (pattern) {
      // Invalidate cache entries matching a custom pattern
      const regex = new RegExp(pattern);
      const matches = pubmedCache.getByPattern(regex);
      
      matches.forEach(({ key }) => {
        const url = new URL(`http://dummy${key}`);
        const endpoint = url.pathname;
        const params: Record<string, any> = {};
        url.searchParams.forEach((value, key) => {
          params[key] = value;
        });
        pubmedCache.delete(endpoint, params);
      });

      console.log(`🗑️ Cleared ${matches.length} cache entries matching pattern: ${pattern}`);
      return NextResponse.json({
        success: true,
        message: `Cleared cache entries matching pattern`,
        cleared_entries: matches.length,
        pattern
      });
    }

    return NextResponse.json(
      { error: 'Must provide pmid, pattern, or clearAll parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to invalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to view cache stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');

    if (pattern) {
      // Get cache entries matching pattern
      const regex = new RegExp(pattern);
      const matches = pubmedCache.getByPattern(regex);
      
      return NextResponse.json({
        pattern,
        matches: matches.map(({ key, entry }) => ({
          key,
          timestamp: new Date(entry.timestamp).toISOString(),
          expiresAt: new Date(entry.expiresAt).toISOString(),
          accessCount: entry.accessCount,
          lastAccessed: new Date(entry.lastAccessed).toISOString()
        }))
      });
    }

    // Return cache stats
    const stats = pubmedCache.getStats();
    return NextResponse.json({
      stats: {
        ...stats,
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        missRate: `${stats.missRate.toFixed(2)}%`,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        oldestEntry: stats.oldestEntry ? new Date(stats.oldestEntry).toISOString() : null,
        newestEntry: stats.newestEntry ? new Date(stats.newestEntry).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get cache stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

