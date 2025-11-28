"""
Feature Flags Router for Erythos Restructuring
Provides API endpoint to fetch feature flags from environment variables
"""
import os
from fastapi import APIRouter, Header
from typing import Optional

router = APIRouter()


def str_to_bool(value: str) -> bool:
    """Convert string environment variable to boolean"""
    return value.lower() in ('true', '1', 'yes', 'on')


@router.get("/feature-flags")
async def get_feature_flags(user_id: Optional[str] = Header(None, alias="User-ID")):
    """
    Get current feature flags for Erythos restructuring.
    
    Feature flags control gradual rollout of new features:
    - enable_new_home_page: Simplified home page with 4 workflow cards
    - enable_new_discover_page: Unified discovery with 3 tabs (Smart Inbox, Explore, All Papers)
    - enable_new_collections_page: Simplified collections page with flat list
    - enable_new_project_workspace: Project workspace with 7 flat tabs
    - enable_new_lab_page: Global lab page with 3 tabs
    - enable_global_triage: Collection-centric AI triage (scans all collections)
    - enable_erythos_theme: New visual theme (red/purple/orange)
    
    Returns:
        dict: Feature flags with boolean values
    """
    return {
        "enable_new_home_page": str_to_bool(os.getenv("ENABLE_NEW_HOME_PAGE", "false")),
        "enable_new_discover_page": str_to_bool(os.getenv("ENABLE_NEW_DISCOVER_PAGE", "false")),
        "enable_new_collections_page": str_to_bool(os.getenv("ENABLE_NEW_COLLECTIONS_PAGE", "false")),
        "enable_new_project_workspace": str_to_bool(os.getenv("ENABLE_NEW_PROJECT_WORKSPACE", "false")),
        "enable_new_lab_page": str_to_bool(os.getenv("ENABLE_NEW_LAB_PAGE", "false")),
        "enable_global_triage": str_to_bool(os.getenv("ENABLE_GLOBAL_TRIAGE", "false")),
        "enable_erythos_theme": str_to_bool(os.getenv("ENABLE_ERYTHOS_THEME", "false")),
    }


@router.get("/feature-flags/status")
async def get_feature_flags_status(user_id: Optional[str] = Header(None, alias="User-ID")):
    """
    Get detailed status of feature flags with descriptions.
    
    Returns:
        dict: Feature flags with status and descriptions
    """
    flags = await get_feature_flags(user_id)
    
    return {
        "flags": flags,
        "descriptions": {
            "enable_new_home_page": "Simplified home page with 4 workflow cards (Discover, Organize, Lab, Write)",
            "enable_new_discover_page": "Unified discovery page with 3 tabs (Smart Inbox, Explore, All Papers)",
            "enable_new_collections_page": "Simplified collections page with flat list and note count",
            "enable_new_project_workspace": "Project workspace with 7 flat tabs (no sub-tabs)",
            "enable_new_lab_page": "Global lab page with 3 tabs (Protocols, Experiments, Data Management)",
            "enable_global_triage": "Collection-centric AI triage (scans across all collections)",
            "enable_erythos_theme": "New visual theme with red/purple/orange color scheme",
        },
        "enabled_count": sum(1 for v in flags.values() if v),
        "total_count": len(flags),
    }

