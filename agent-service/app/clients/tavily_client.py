"""Tavily web search helper."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List

from tavily import TavilyClient

from ..config import get_settings

logger = logging.getLogger(__name__)


class TavilySearchClient:
    """Execute contextual web searches when API key is configured."""

    def __init__(self) -> None:
        settings = get_settings()
        if settings.tavily_enabled and settings.tavily_api_key:
            self._client = TavilyClient(api_key=settings.tavily_api_key)
        else:
            self._client = None

    @property
    def enabled(self) -> bool:
        return self._client is not None

    async def search(self, query: str, *, max_results: int = 6) -> List[Dict[str, Any]]:
        if not self._client:
            return []

        def _search() -> List[Dict[str, Any]]:
            response = self._client.search(
                query=query,
                search_depth="advanced",
                max_results=max_results,
                topic="travel",
                include_images=False,
            )
            return response.get("results", []) if isinstance(response, dict) else []

        try:
            return await asyncio.to_thread(_search)
        except Exception as exc:
            logger.warning("Tavily search failed: %s", exc)
            return []
