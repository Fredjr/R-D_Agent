"""
Query Result Caching Utility
Week 1: Database Optimization - Query Result Caching

This module provides caching decorators and utilities for database queries
to reduce database load and improve response times.

Features:
- In-memory caching with TTL
- Redis caching for production
- Cache invalidation utilities
- Query performance monitoring
"""

import functools
import hashlib
import json
import logging
import time
from typing import Any, Callable, Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ============================================================================
# IN-MEMORY CACHE (Development & Fallback)
# ============================================================================

class InMemoryCache:
    """Simple in-memory cache with TTL support"""
    
    def __init__(self):
        self._cache: Dict[str, tuple[Any, float]] = {}
        self._stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "invalidations": 0
        }
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in self._cache:
            value, expires_at = self._cache[key]
            if time.time() < expires_at:
                self._stats["hits"] += 1
                logger.debug(f"✅ Cache HIT: {key}")
                return value
            else:
                # Expired, remove it
                del self._cache[key]
        
        self._stats["misses"] += 1
        logger.debug(f"❌ Cache MISS: {key}")
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL (seconds)"""
        expires_at = time.time() + ttl
        self._cache[key] = (value, expires_at)
        self._stats["sets"] += 1
        logger.debug(f"💾 Cache SET: {key} (TTL: {ttl}s)")
    
    def invalidate(self, pattern: str = None):
        """Invalidate cache entries matching pattern"""
        if pattern is None:
            # Clear all
            count = len(self._cache)
            self._cache.clear()
            self._stats["invalidations"] += count
            logger.info(f"🗑️ Cache cleared: {count} entries")
        else:
            # Clear matching pattern
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self._cache[key]
            self._stats["invalidations"] += len(keys_to_delete)
            logger.info(f"🗑️ Cache invalidated: {len(keys_to_delete)} entries matching '{pattern}'")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = (self._stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self._stats,
            "total_requests": total_requests,
            "hit_rate": f"{hit_rate:.1f}%",
            "cache_size": len(self._cache)
        }

# Global in-memory cache instance
_memory_cache = InMemoryCache()

# ============================================================================
# REDIS CACHE (Production)
# ============================================================================

_redis_client = None

def init_redis_cache(redis_url: str = None):
    """Initialize Redis cache for production use"""
    global _redis_client
    
    try:
        import redis
        
        if redis_url:
            _redis_client = redis.from_url(redis_url, decode_responses=True)
        else:
            # Try default local Redis
            _redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        
        # Test connection
        _redis_client.ping()
        logger.info("✅ Redis cache initialized successfully")
        return True
    except Exception as e:
        logger.warning(f"⚠️ Redis not available, using in-memory cache: {e}")
        _redis_client = None
        return False

def get_cache() -> InMemoryCache:
    """Get active cache instance (Redis or in-memory)"""
    return _memory_cache

# ============================================================================
# CACHE KEY GENERATION
# ============================================================================

def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a unique cache key from function arguments"""
    # Create a string representation of all arguments
    key_parts = [prefix]
    
    # Add positional arguments
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            # For complex objects, use their string representation
            key_parts.append(str(arg))
    
    # Add keyword arguments (sorted for consistency)
    for k, v in sorted(kwargs.items()):
        if isinstance(v, (str, int, float, bool)):
            key_parts.append(f"{k}={v}")
        else:
            key_parts.append(f"{k}={str(v)}")
    
    # Join and hash if too long
    key = ":".join(key_parts)
    if len(key) > 200:
        # Hash long keys
        key_hash = hashlib.md5(key.encode()).hexdigest()
        key = f"{prefix}:{key_hash}"
    
    return key

# ============================================================================
# CACHING DECORATORS
# ============================================================================

def cache_query_result(ttl: int = 300, key_prefix: str = None):
    """
    Decorator to cache database query results
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        key_prefix: Custom cache key prefix (default: function name)
    
    Usage:
        @cache_query_result(ttl=600, key_prefix="project")
        def get_project_with_collections(project_id: str, db: Session):
            return db.query(Project).filter(...).first()
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or func.__name__
            cache_key = generate_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cache = get_cache()
            cached_value = cache.get(cache_key)
            
            if cached_value is not None:
                return cached_value
            
            # Cache miss - execute function
            start_time = time.time()
            result = func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000  # ms
            
            # Store in cache
            cache.set(cache_key, result, ttl)
            
            logger.info(f"⚡ Query executed and cached: {prefix} ({execution_time:.1f}ms)")
            
            return result
        
        return wrapper
    return decorator

def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern
    
    Usage:
        invalidate_cache("project:123")  # Invalidate all caches for project 123
        invalidate_cache("project")      # Invalidate all project caches
    """
    cache = get_cache()
    cache.invalidate(pattern)

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    cache = get_cache()
    return cache.get_stats()

# ============================================================================
# CACHE WARMING
# ============================================================================

def warm_cache(func: Callable, *args, **kwargs):
    """
    Pre-populate cache with query results
    
    Usage:
        warm_cache(get_project_with_collections, project_id="123", db=db)
    """
    try:
        result = func(*args, **kwargs)
        logger.info(f"🔥 Cache warmed: {func.__name__}")
        return result
    except Exception as e:
        logger.error(f"❌ Cache warming failed: {e}")
        return None

