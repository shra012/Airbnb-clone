"""Context aggregation for the concierge workflow."""

from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from pydantic import BaseModel, Field

from ..clients import (
    SupabaseContextClient,
    TavilySearchClient,
    WeatherForecastClient,
)
from ..schemas.concierge import ConciergeRequest


class ContextBundle(BaseModel):
    """Aggregated context data available to the concierge planner."""

    pois: List[Dict[str, Any]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    weather: Dict[str, Any] = Field(default_factory=dict)
    tavily_results: List[Dict[str, Any]] = Field(default_factory=list)
    data_sources: List[Dict[str, str]] = Field(default_factory=list)


class ContextService:
    """Gather relevant context for the concierge planner."""

    def __init__(self) -> None:
        self._supabase = SupabaseContextClient()
        self._tavily = TavilySearchClient()
        self._weather = WeatherForecastClient()

    async def build_context(self, request: ConciergeRequest) -> ContextBundle:
        booking = request.booking
        tasks = []

        async def _const(value):
            return value

        if self._supabase.enabled:
            tasks.append(
                self._supabase.fetch_pois(booking.city, booking.country, limit=20)
            )
            tasks.append(
                self._supabase.fetch_events(
                    city=booking.city,
                    country=booking.country,
                    start_date=booking.check_in,
                    end_date=booking.check_out,
                    limit=20,
                )
            )
        else:
            tasks.extend([_const([]), _const([])])

        if self._weather.enabled:
            tasks.append(self._weather.fetch_forecast(f"{booking.city}, {booking.country}"))
        else:
            tasks.append(_const({}))

        if self._tavily.enabled and request.query:
            tasks.append(self._tavily.search(request.query))
        else:
            tasks.append(_const([]))

        results = await asyncio.gather(*tasks)

        pois, events, weather, tavily_results = results

        data_sources: List[Dict[str, str]] = []
        if self._supabase.enabled and pois:
            data_sources.append(
                {"source": "supabase", "reference": "pois table"}
            )
        if self._supabase.enabled and events:
            data_sources.append(
                {"source": "supabase", "reference": "events table"}
            )
        if self._weather.enabled and weather:
            data_sources.append(
                {"source": "weatherapi", "reference": "7-day forecast"}
            )
        if self._tavily.enabled and tavily_results:
            data_sources.extend(
                {"source": "tavily", "reference": result.get("url", "")}
                for result in tavily_results
                if result.get("url")
            )

        return ContextBundle(
            pois=pois,
            events=events,
            weather=weather,
            tavily_results=tavily_results,
            data_sources=data_sources,
        )
