from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.core.database import get_db
from app.api import dependencies as deps
from app.models import User
from app.services.llm_orchestrator import llm_orchestrator

router = APIRouter()


@router.get("/providers", response_model=Dict[str, Any])
async def get_ai_providers(
    current_user: User = Depends(deps.get_current_user)
):
    """Get user's configured AI providers and supported models"""
    providers = llm_orchestrator.get_all_providers()
    
    # Check which providers have keys configured
    user_config = {
        "openai": bool(current_user.openai_api_key),
        "anthropic": bool(current_user.anthropic_api_key),
        "google": bool(current_user.google_api_key),
        "azure": bool(current_user.azure_api_key)
    }
    
    return {
        "available_providers": providers,
        "user_configuration": user_config,
        "preferred_provider": current_user.preferred_ai_provider,
        "preferred_model": current_user.preferred_ai_model
    }


@router.post("/configure", status_code=status.HTTP_200_OK)
async def configure_ai_provider(
    config: Dict[str, str],
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Configure user's AI provider settings (Bring Your Own Key)
    Expected Body: {"provider": "openai", "api_key": "sk-..."}
    """
    provider = config.get("provider", "").lower()
    api_key = config.get("api_key")
    
    if provider not in ["openai", "anthropic", "google", "azure", "litellm"]:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    
    if not api_key:
        raise HTTPException(status_code=400, detail="API key is required")

    # Encrypt and save key
    encrypted_key = llm_orchestrator.encrypt_api_key(api_key)
    
    if provider == "openai":
        current_user.openai_api_key = encrypted_key
    elif provider == "anthropic":
        current_user.anthropic_api_key = encrypted_key
    elif provider == "google":
        current_user.google_api_key = encrypted_key
    elif provider == "azure":
        current_user.azure_api_key = encrypted_key
    
    # Save model preference
    model = config.get("model")
    current_user.preferred_ai_provider = provider
    if model:
        current_user.preferred_ai_model = model
        
    await db.commit()
    return {"message": f"Successfully configured {provider} API key", "model": model}


@router.post("/test-connection", status_code=status.HTTP_200_OK)
async def test_ai_connection(
    config: Dict[str, str],
    current_user: User = Depends(deps.get_current_user)
):
    """
    Test if an API key is valid by making a minimal call to the provider.
    Expected Body: {"provider": "litellm", "model": "gemini-pro", "base_url": "https://...", "api_key": "sk-..."}
    """
    provider = config.get("provider", "").lower()
    api_key = config.get("api_key")
    model = config.get("model")
    base_url = config.get("base_url")
    
    if provider not in ["openai", "anthropic", "google", "azure", "litellm"]:
        return {"success": False, "message": "Unsupported provider"}
    
    if not api_key:
        return {"success": False, "message": "API key is required"}

    try:
        # Use the verify_api_key method which directly tests the raw key
        result = await llm_orchestrator.verify_api_key(api_key, provider, model, base_url)
        
        if result.get("valid"):
            return {
                "success": True, 
                "message": f"Connected to {provider} successfully using model {result.get('model', model)}"
            }
        else:
            return {"success": False, "message": result.get("error", "Connection failed")}
    except Exception as e:
        return {"success": False, "message": f"Connection test failed: {str(e)}"}
