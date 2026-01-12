"""
LLM Orchestrator using LiteLLM for multi-provider support
This is the core AI-agnostic layer that allows users to use any LLM provider
"""
import litellm
from litellm import completion, embedding
from typing import Dict, List, Optional, Any
import asyncio
from functools import lru_cache
import json
import hashlib

from app.core.config import settings
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

# Configure LiteLLM
litellm.cache = litellm.Cache() if settings.LITELLM_CACHE_ENABLED else None
litellm.set_verbose = settings.DEBUG


class LLMOrchestrator:
    """
    AI-agnostic LLM orchestrator using LiteLLM
    Supports OpenAI, Anthropic, Google, Azure, and open-source models
    """
    
    SUPPORTED_PROVIDERS = {
        "openai": {
            "models": ["gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo", "gpt-4"],
            "embedding_model": "text-embedding-ada-002"
        },
        "anthropic": {
            "models": ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
            "embedding_model": None  # Anthropic doesn't provide embeddings
        },
        "google": {
            "models": ["gemini-2.0-flash-exp", "gemini-pro", "gemini-1.5-pro"],
            "embedding_model": "text-embedding-004"
        },
        "azure": {
            "models": ["azure/gpt-4", "azure/gpt-35-turbo"],
            "embedding_model": "azure/text-embedding-ada-002"
        }
    }
    
    def __init__(self):
        self.encryption_key = settings.SECRET_KEY.encode()[:32].ljust(32, b'0')
        self.cipher = Fernet(Fernet.generate_key())  # TODO: Use proper key management
    
    def encrypt_api_key(self, api_key: str) -> str:
        """Encrypt user API key"""
        return self.cipher.encrypt(api_key.encode()).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """Decrypt user API key"""
        return self.cipher.decrypt(encrypted_key.encode()).decode()
    
    def _get_cache_key(self, prompt: str, model: str, params: Dict) -> str:
        """Generate cache key for deduplication"""
        cache_data = f"{prompt}:{model}:{json.dumps(params, sort_keys=True)}"
        return hashlib.sha256(cache_data.encode()).hexdigest()
    
    async def generate_completion(
        self,
        prompt: str,
        user_api_key: str,
        provider: str = "openai",
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        system_message: Optional[str] = None,
        use_system_key_fallback: bool = True
    ) -> Dict[str, Any]:
        """
        Generate LLM completion with user's API key
        
        Args:
            prompt: User prompt
            user_api_key: User's encrypted API key
            provider: LLM provider (openai, anthropic, google, azure)
            model: Specific model to use
            temperature: Generation temperature
            max_tokens: Maximum tokens
            system_message: System message/instructions
            use_system_key_fallback: Use system key if user key fails
        
        Returns:
            Dict with response, usage, and metadata
        """
        try:
            # Decrypt user API key
            api_key = self.decrypt_api_key(user_api_key) if user_api_key else None
            
            # Determine model
            if not model:
                model = self.SUPPORTED_PROVIDERS[provider]["models"][0]
            
            # Prepare messages
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            # Generate completion using LiteLLM
            response = await asyncio.to_thread(
                completion,
                model=model,
                messages=messages,
                api_key=api_key,
                temperature=temperature,
                max_tokens=max_tokens,
                timeout=settings.LITELLM_TIMEOUT,
                num_retries=settings.LITELLM_MAX_RETRIES
            )
            
            # Extract response
            content = response.choices[0].message.content
            usage = response.usage
            
            return {
                "success": True,
                "content": content,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                },
                "model": response.model,
                "provider": provider,
                "cost": self._calculate_cost(provider, model, usage)
            }
            
        except Exception as e:
            logger.error(f"LLM generation error: {str(e)}")
            
            # Try fallback with system key
            if use_system_key_fallback and self._has_system_key(provider):
                logger.info(f"Attempting fallback with system key for {provider}")
                return await self._generate_with_system_key(
                    prompt, provider, model, temperature, max_tokens, system_message
                )
            
            return {
                "success": False,
                "error": str(e),
                "provider": provider,
                "model": model
            }
    
    async def _generate_with_system_key(
        self,
        prompt: str,
        provider: str,
        model: str,
        temperature: float,
        max_tokens: int,
        system_message: Optional[str]
    ) -> Dict[str, Any]:
        """Fallback generation using system API key"""
        system_keys = {
            "openai": settings.SYSTEM_OPENAI_API_KEY,
            "anthropic": settings.SYSTEM_ANTHROPIC_API_KEY,
            "google": settings.SYSTEM_GOOGLE_API_KEY
        }
        
        system_key = system_keys.get(provider)
        if not system_key:
            return {
                "success": False,
                "error": f"No system key available for {provider}",
                "provider": provider
            }
        
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        try:
            response = await asyncio.to_thread(
                completion,
                model=model,
                messages=messages,
                api_key=system_key,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            content = response.choices[0].message.content
            usage = response.usage
            
            return {
                "success": True,
                "content": content,
                "usage": {
                    "prompt_tokens": usage.prompt_tokens,
                    "completion_tokens": usage.completion_tokens,
                    "total_tokens": usage.total_tokens
                },
                "model": response.model,
                "provider": provider,
                "used_system_key": True,
                "cost": self._calculate_cost(provider, model, usage)
            }
        except Exception as e:
            logger.error(f"System key fallback failed: {str(e)}")
            return {
                "success": False,
                "error": f"System key fallback failed: {str(e)}",
                "provider": provider
            }
    
    def _has_system_key(self, provider: str) -> bool:
        """Check if system has API key for provider"""
        system_keys = {
            "openai": settings.SYSTEM_OPENAI_API_KEY,
            "anthropic": settings.SYSTEM_ANTHROPIC_API_KEY,
            "google": settings.SYSTEM_GOOGLE_API_KEY
        }
        return bool(system_keys.get(provider))
    
    def _calculate_cost(self, provider: str, model: str, usage) -> float:
        """
        Calculate cost for LLM usage
        Prices per 1M tokens (approximate as of Jan 2026)
        """
        pricing = {
            "gpt-4-turbo": {"input": 10, "output": 30},
            "gpt-4o": {"input": 5, "output": 15},
            "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
            "claude-3-5-sonnet": {"input": 3, "output": 15},
            "claude-3-opus": {"input": 15, "output": 75},
            "gemini-2.0-flash-exp": {"input": 0.1, "output": 0.3},
            "gemini-pro": {"input": 0.5, "output": 1.5}
        }
        
        model_pricing = pricing.get(model.split("/")[-1], {"input": 1, "output": 3})
        
        input_cost = (usage.prompt_tokens / 1_000_000) * model_pricing["input"]
        output_cost = (usage.completion_tokens / 1_000_000) * model_pricing["output"]
        
        return round(input_cost + output_cost, 6)
    
    async def verify_api_key(self, api_key: str, provider: str) -> Dict[str, Any]:
        """
        Verify if API key is valid by making a test request
        """
        try:
            test_prompt = "Say 'API key verified' in 3 words."
            model = self.SUPPORTED_PROVIDERS[provider]["models"][0]
            
            response = await asyncio.to_thread(
                completion,
                model=model,
                messages=[{"role": "user", "content": test_prompt}],
                api_key=api_key,
                max_tokens=10
            )
            
            return {
                "valid": True,
                "provider": provider,
                "model": model,
                "message": "API key verified successfully"
            }
        except Exception as e:
            return {
                "valid": False,
                "provider": provider,
                "error": str(e)
            }
    
    @lru_cache(maxsize=100)
    def get_supported_models(self, provider: str) -> List[str]:
        """Get list of supported models for a provider"""
        return self.SUPPORTED_PROVIDERS.get(provider, {}).get("models", [])
    
    def get_all_providers(self) -> Dict[str, Any]:
        """Get all supported providers and their models"""
        return self.SUPPORTED_PROVIDERS


# Global instance
llm_orchestrator = LLMOrchestrator()
