"""
Cache Manager
Simple disk-based caching for expensive operations
"""

import pickle
import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
import logging

from config import config

logger = logging.getLogger(__name__)


class CacheManager:
    """
    Simple file-based cache manager
    Caches expensive operations like OSM downloads and graph computations
    """
    
    def __init__(self, cache_dir=None, ttl=None):
        """
        Initialize cache manager
        
        Args:
            cache_dir: Cache directory (from config if None)
            ttl: Time-to-live in seconds (from config if None)
        """
        self.cache_dir = cache_dir or config.CACHE_DIR
        self.ttl = ttl or config.CACHE_TTL
        self.enabled = config.ENABLE_CACHE
        
        if self.enabled:
            self.cache_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"CacheManager initialized: {self.cache_dir}, TTL={self.ttl}s")
    
    def get(self, key):
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found/expired
        """
        if not self.enabled:
            return None
        
        cache_file = self._get_cache_file(key)
        
        if not cache_file.exists():
            return None
        
        # Check if expired
        if self._is_expired(cache_file):
            self._delete_cache_file(cache_file)
            return None
        
        try:
            with open(cache_file, 'rb') as f:
                data = pickle.load(f)
            
            logger.debug(f"Cache hit: {key}")
            return data
            
        except Exception as e:
            logger.warning(f"Cache read error for {key}: {e}")
            self._delete_cache_file(cache_file)
            return None
    
    def set(self, key, value):
        """
        Store value in cache
        
        Args:
            key: Cache key
            value: Value to cache (must be picklable)
        """
        if not self.enabled:
            return
        
        cache_file = self._get_cache_file(key)
        
        try:
            with open(cache_file, 'wb') as f:
                pickle.dump(value, f)
            
            logger.debug(f"Cache set: {key}")
            
        except Exception as e:
            logger.warning(f"Cache write error for {key}: {e}")
    
    def has(self, key):
        """
        Check if key exists in cache (and not expired)
        
        Args:
            key: Cache key
            
        Returns:
            True if exists and not expired
        """
        if not self.enabled:
            return False
        
        cache_file = self._get_cache_file(key)
        
        if not cache_file.exists():
            return False
        
        return not self._is_expired(cache_file)
    
    def delete(self, key):
        """
        Delete cache entry
        
        Args:
            key: Cache key
        """
        if not self.enabled:
            return
        
        cache_file = self._get_cache_file(key)
        self._delete_cache_file(cache_file)
    
    def clear(self):
        """Clear all cache entries"""
        if not self.enabled:
            return
        
        count = 0
        for cache_file in self.cache_dir.glob('*.pkl'):
            cache_file.unlink()
            count += 1
        
        logger.info(f"Cleared {count} cache entries")
    
    def clear_expired(self):
        """Clear only expired cache entries"""
        if not self.enabled:
            return
        
        count = 0
        for cache_file in self.cache_dir.glob('*.pkl'):
            if self._is_expired(cache_file):
                cache_file.unlink()
                count += 1
        
        logger.info(f"Cleared {count} expired cache entries")
    
    def get_stats(self):
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        if not self.enabled:
            return {'enabled': False}
        
        cache_files = list(self.cache_dir.glob('*.pkl'))
        
        total_size = sum(f.stat().st_size for f in cache_files)
        expired_count = sum(1 for f in cache_files if self._is_expired(f))
        
        stats = {
            'enabled': True,
            'total_entries': len(cache_files),
            'expired_entries': expired_count,
            'total_size_bytes': total_size,
            'total_size_mb': total_size / (1024 * 1024),
            'cache_dir': str(self.cache_dir),
            'ttl_seconds': self.ttl
        }
        
        return stats
    
    def _get_cache_file(self, key):
        """
        Get cache file path for key
        
        Args:
            key: Cache key
            
        Returns:
            Path object
        """
        # Hash key to create safe filename
        key_hash = hashlib.md5(str(key).encode()).hexdigest()
        return self.cache_dir / f"{key_hash}.pkl"
    
    def _is_expired(self, cache_file):
        """
        Check if cache file is expired
        
        Args:
            cache_file: Path to cache file
            
        Returns:
            True if expired
        """
        if self.ttl <= 0:  # TTL of 0 means no expiration
            return False
        
        try:
            mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
            age = datetime.now() - mtime
            return age > timedelta(seconds=self.ttl)
        except:
            return True
    
    def _delete_cache_file(self, cache_file):
        """Delete cache file safely"""
        try:
            if cache_file.exists():
                cache_file.unlink()
        except Exception as e:
            logger.warning(f"Failed to delete cache file: {e}")


if __name__ == '__main__':
    # Test
    print("Testing CacheManager...")
    
    cache = CacheManager()
    
    # Test set/get
    cache.set('test_key', {'data': 'test_value'})
    value = cache.get('test_key')
    print(f"Cache get: {value}")
    
    # Test has
    print(f"Cache has test_key: {cache.has('test_key')}")
    
    # Test stats
    stats = cache.get_stats()
    print(f"Cache stats: {stats}")
    
    # Test delete
    cache.delete('test_key')
    print(f"After delete, has test_key: {cache.has('test_key')}")
    
    print("✅ CacheManager test passed")
