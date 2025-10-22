"""Supabase client helper for POI and event data."""

from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List

from supabase import Client, create_client

from ..config import get_settings

logger = logging.getLogger(__name__)


class SupabaseContextClient:
    """Fetch points of interest and events from Supabase when configured."""

    def __init__(self) -> None:
        settings = get_settings()
        if settings.supabase_url and settings.supabase_service_role_key:
            self._client: Client | None = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key,
            )
        else:
            self._client = None

    @property
    def enabled(self) -> bool:
        return self._client is not None

    async def fetch_pois(
        self,
        city: str | None,
        country: str | None,
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        if not self._client:
            return []

        def _query() -> List[Dict[str, Any]]:
            query = self._client.table("pois").select(
                "id,name,description,latitude,longitude,category,price_range,"
                "accessibility_flags,tags,address,website"
            )
            if city:
                query = query.ilike("city", f"%{city}%")
            if country:
                query = query.ilike("country", f"%{country}%")
            response = query.limit(limit).execute()
            return response.data or []

        try:
            return await asyncio.to_thread(_query)
        except Exception as exc:
            logger.warning("Supabase POI query failed: %s", exc)
            return []

    async def fetch_events(
        self,
        city: str | None,
        country: str | None,
        start_date: str | None,
        end_date: str | None,
        limit: int = 15,
    ) -> List[Dict[str, Any]]:
        if not self._client:
            return []

        def _query() -> List[Dict[str, Any]]:
            query = self._client.table("events").select(
                "id,name,description,start_date,end_date,latitude,longitude,"
                "category,ticket_price,venue,address,website"
            )
            if city:
                query = query.ilike("city", f"%{city}%")
            if country:
                query = query.ilike("country", f"%{country}%")
            if start_date:
                query = query.gte("end_date", start_date)
            if end_date:
                query = query.lte("start_date", end_date)
            response = query.limit(limit).execute()
            return response.data or []

        try:
            return await asyncio.to_thread(_query)
        except Exception as exc:
            logger.warning("Supabase events query failed: %s", exc)
            return []
