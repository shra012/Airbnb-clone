"""Lightweight async tools wrapping external data sources."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ..clients import (
    SupabaseContextClient,
    TavilySearchClient,
    WeatherForecastClient,
)


class TavilyTool:
    """Wrapper around Tavily search client."""

    def __init__(self, client: TavilySearchClient | None) -> None:
        self._client = client

    @property
    def enabled(self) -> bool:
        return bool(self._client and self._client.enabled)

    async def run(self, query: str, *, max_results: int = 6) -> List[Dict[str, Any]]:
        if not self.enabled:
            return []
        if not query or len(query.strip()) < 4:
            return []
        return await self._client.search(query, max_results=max_results)


class WeatherTool:
    """Wrapper around the weather forecast client."""

    def __init__(self, client: WeatherForecastClient | None) -> None:
        self._client = client

    @property
    def enabled(self) -> bool:
        return bool(self._client and self._client.enabled)

    async def run(self, location_query: str) -> Dict[str, Any]:
        if not self.enabled or not location_query:
            return {}
        return await self._client.fetch_forecast(location_query)


class BookingsTool:
    """Supabase-backed helper to retrieve traveller bookings."""

    def __init__(self, client: SupabaseContextClient | None) -> None:
        self._client = client

    @property
    def enabled(self) -> bool:
        return bool(self._client and self._client.enabled)

    async def run(
        self,
        traveler_id: Optional[int],
        *,
        limit: int = 6,
    ) -> List[Dict[str, Any]]:
        if not self.enabled or traveler_id is None:
            return []
        return await self._client.fetch_traveler_bookings(traveler_id=traveler_id, limit=limit)

