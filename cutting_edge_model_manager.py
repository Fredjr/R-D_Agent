"""
Cutting-Edge Model Manager for GPT-5, O3, and Latest OpenAI Models

This module provides advanced model availability detection and management
for the latest OpenAI models including GPT-5 and O3 series.
"""

import os
import asyncio
import logging
import openai
from typing import Dict, List, Optional, Any
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CuttingEdgeModelManager:
    """
    Advanced model manager for GPT-5, O3, and cutting-edge OpenAI models
    with automatic availability detection and intelligent fallback.
    """
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.openai_client = openai.OpenAI(api_key=api_key)
        
        # Model hierarchy for different use cases
        self.model_hierarchy = {
            "premium_phd": [
                "gpt-5",           # Ultimate quality when available
                "o3",              # Advanced reasoning when available
                "gpt-4-turbo",     # Current premium fallback
                "gpt-4o"           # Reliable fallback
            ],
            "fast_processing": [
                "o3-mini",         # Fast advanced reasoning when available
                "gpt-4o-mini",     # Current fast fallback
                "gpt-3.5-turbo"    # Emergency fallback
            ],
            "balanced": [
                "gpt-5",
                "gpt-4-turbo",
                "gpt-4o",
                "gpt-4o-mini"
            ]
        }
        
        self._model_availability_cache = {}
        self._cache_timestamp = None
        self._cache_duration = timedelta(hours=1)  # Cache for 1 hour
    
    async def check_model_availability(self, model_name: str) -> bool:
        """Check if a specific model is available via OpenAI API"""
        try:
            # Check cache first
            if self._is_cache_valid() and model_name in self._model_availability_cache:
                return self._model_availability_cache[model_name]
            
            test_response = await self._test_model_call(model_name)
            if test_response:
                logger.info(f"✅ Model {model_name} is available")
                self._model_availability_cache[model_name] = True
                return True
            else:
                logger.warning(f"⚠️ Model {model_name} is not available")
                self._model_availability_cache[model_name] = False
                return False
        except Exception as e:
            logger.error(f"❌ Error checking model {model_name}: {e}")
            self._model_availability_cache[model_name] = False
            return False
    
    async def _test_model_call(self, model_name: str) -> bool:
        """Test if a model is available by making a minimal API call"""
        try:
            response = self.openai_client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=1,
                temperature=0
            )
            return response is not None
        except openai.NotFoundError:
            return False
        except openai.RateLimitError:
            # Rate limit means model exists but quota exceeded
            return True
        except Exception as e:
            logger.debug(f"Model test error for {model_name}: {e}")
            return False
    
    def _is_cache_valid(self) -> bool:
        """Check if the model availability cache is still valid"""
        if self._cache_timestamp is None:
            return False
        return datetime.now() - self._cache_timestamp < self._cache_duration
    
    def _update_cache_timestamp(self):
        """Update the cache timestamp"""
        self._cache_timestamp = datetime.now()
    
    async def get_best_available_model(self, use_case: str = "premium_phd") -> str:
        """
        Get the best available model for a specific use case
        
        Args:
            use_case: One of "premium_phd", "fast_processing", "balanced"
            
        Returns:
            The best available model name
        """
        if use_case not in self.model_hierarchy:
            logger.warning(f"Unknown use case: {use_case}, using premium_phd")
            use_case = "premium_phd"
        
        models_to_try = self.model_hierarchy[use_case]
        
        for model in models_to_try:
            if await self.check_model_availability(model):
                logger.info(f"✅ Selected model: {model} for {use_case}")
                self._update_cache_timestamp()
                return model
        
        # Fallback to the last model in the hierarchy
        fallback_model = models_to_try[-1]
        logger.warning(f"⚠️ Using fallback model: {fallback_model} for {use_case}")
        return fallback_model
    
    def get_model_sync(self, use_case: str = "premium_phd") -> str:
        """
        Synchronous version of get_best_available_model
        Uses cached results or returns the first model in hierarchy
        """
        if use_case not in self.model_hierarchy:
            use_case = "premium_phd"
        
        models_to_try = self.model_hierarchy[use_case]
        
        # Check cache for available models
        if self._is_cache_valid():
            for model in models_to_try:
                if self._model_availability_cache.get(model, False):
                    logger.info(f"✅ Using cached model: {model} for {use_case}")
                    return model
        
        # Return first model in hierarchy (optimistic approach)
        selected_model = models_to_try[0]
        logger.info(f"✅ Using optimistic model: {selected_model} for {use_case}")
        return selected_model
    
    def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        model_info = {
            "name": model_name,
            "available": self._model_availability_cache.get(model_name, None),
            "last_checked": self._cache_timestamp,
            "use_cases": []
        }
        
        # Find which use cases this model belongs to
        for use_case, models in self.model_hierarchy.items():
            if model_name in models:
                model_info["use_cases"].append(use_case)
        
        return model_info
    
    def get_all_models_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all models in the hierarchy"""
        all_models = set()
        for models in self.model_hierarchy.values():
            all_models.update(models)
        
        return {model: self.get_model_info(model) for model in all_models}
    
    async def refresh_model_availability(self) -> Dict[str, bool]:
        """Refresh the availability status of all models"""
        logger.info("🔄 Refreshing model availability...")
        
        all_models = set()
        for models in self.model_hierarchy.values():
            all_models.update(models)
        
        results = {}
        for model in all_models:
            # Force refresh by clearing cache for this model
            if model in self._model_availability_cache:
                del self._model_availability_cache[model]
            
            results[model] = await self.check_model_availability(model)
        
        self._update_cache_timestamp()
        logger.info(f"✅ Model availability refreshed: {results}")
        return results
    
    def clear_cache(self):
        """Clear the model availability cache"""
        self._model_availability_cache.clear()
        self._cache_timestamp = None
        logger.info("🗑️ Model availability cache cleared")


# Global instance for easy access
_global_model_manager = None

def get_global_model_manager() -> Optional[CuttingEdgeModelManager]:
    """Get the global model manager instance"""
    return _global_model_manager

def initialize_global_model_manager(api_key: str) -> CuttingEdgeModelManager:
    """Initialize the global model manager"""
    global _global_model_manager
    _global_model_manager = CuttingEdgeModelManager(api_key)
    logger.info("✅ Global cutting-edge model manager initialized")
    return _global_model_manager

# Convenience functions for common use cases
def get_premium_model() -> str:
    """Get the best model for premium PhD-level content"""
    manager = get_global_model_manager()
    if manager:
        return manager.get_model_sync("premium_phd")
    return "gpt-4-turbo"  # Safe fallback

def get_fast_model() -> str:
    """Get the best model for fast processing"""
    manager = get_global_model_manager()
    if manager:
        return manager.get_model_sync("fast_processing")
    return "gpt-4o-mini"  # Safe fallback

def get_balanced_model() -> str:
    """Get the best balanced model"""
    manager = get_global_model_manager()
    if manager:
        return manager.get_model_sync("balanced")
    return "gpt-4o"  # Safe fallback


# Example usage and testing
if __name__ == "__main__":
    """
    Example usage of the Cutting-Edge Model Manager
    """
    
    api_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key:
        print("❌ OpenAI API key not found")
        exit(1)
    
    async def test_model_manager():
        manager = CuttingEdgeModelManager(api_key)
        
        print("🚀 Testing Cutting-Edge Model Manager")
        print("=" * 50)
        
        # Test model availability
        print("\n🔍 Checking model availability...")
        models_to_test = ["gpt-5", "o3", "o3-mini", "gpt-4-turbo", "gpt-4o"]
        
        for model in models_to_test:
            available = await manager.check_model_availability(model)
            status = "✅ Available" if available else "❌ Not available"
            print(f"   {model}: {status}")
        
        # Test best model selection
        print("\n🎯 Best model selection:")
        for use_case in ["premium_phd", "fast_processing", "balanced"]:
            best_model = await manager.get_best_available_model(use_case)
            print(f"   {use_case}: {best_model}")
        
        # Test model info
        print("\n📊 Model information:")
        all_status = manager.get_all_models_status()
        for model, info in all_status.items():
            available = info.get('available', 'Unknown')
            use_cases = ', '.join(info.get('use_cases', []))
            print(f"   {model}: {available} (Use cases: {use_cases})")
        
        print("\n✅ Testing completed!")
    
    # Run the test
    asyncio.run(test_model_manager())
