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
    trip_context: Dict[str, Any] = Field(default_factory=dict)


class ContextService:
    """Gather relevant context for the concierge planner."""

    def __init__(self) -> None:
        self._supabase = SupabaseContextClient()
        self._tavily = TavilySearchClient()
        self._weather = WeatherForecastClient()

    async def build_context(self, request: ConciergeRequest) -> ContextBundle:
        booking = request.booking
        preferences = request.preferences
        tasks = []

        async def _const(value):
            return value

        # Determine if query is trip-related (has location/dates/activities keywords)
        is_trip_related = self._is_trip_related_query(request.query)

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

        # Only fetch weather if query is trip-related
        if self._weather.enabled and is_trip_related:
            tasks.append(self._weather.fetch_forecast(f"{booking.city}, {booking.country}"))
        else:
            tasks.append(_const({}))

        if self._tavily.enabled and request.query:
            tasks.append(self._tavily.search(request.query))
        else:
            tasks.append(_const([]))

        results = await asyncio.gather(*tasks)

        pois, events, weather, tavily_results = results

        # Build trip context from request
        trip_context = self._build_trip_context(booking, preferences)

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
            trip_context=trip_context,
        )

    def _is_trip_related_query(self, query: str | None) -> bool:
        """Check if the query is trip/travel related."""
        if not query:
            return True  # Default to trip-related if no query

        query_lower = query.lower()
        trip_keywords = [
            "trip", "travel", "visit", "itinerary", "plan", "vacation", "holiday",
            "stay", "explore", "tour", "sightseeing", "activities", "things to do",
            "restaurant", "eat", "food", "hotel", "accommodation", "weather",
            "pack", "bring", "destination", "flight", "transportation"
        ]
        return any(keyword in query_lower for keyword in trip_keywords)

    def _build_trip_context(
        self,
        booking: Any,
        preferences: Any | None
    ) -> Dict[str, Any]:
        """Build trip context from booking and preferences."""
        from datetime import datetime

        context = {
            "destination": f"{booking.city}, {booking.country}",
        }

        # Format dates nicely
        try:
            check_in = datetime.fromisoformat(booking.check_in.replace('Z', '+00:00'))
            check_out = datetime.fromisoformat(booking.check_out.replace('Z', '+00:00'))
            context["dates"] = f"{check_in.strftime('%b %d')} - {check_out.strftime('%b %d, %Y')}"
        except Exception:
            context["dates"] = f"{booking.check_in} to {booking.check_out}"

        if booking.party:
            context["party"] = booking.party

        if preferences:
            if preferences.budget:
                context["budget"] = preferences.budget
            if preferences.interests:
                context["interests"] = preferences.interests
            if preferences.dietary_restrictions:
                context["dietary_restrictions"] = preferences.dietary_restrictions
            if preferences.mobility_needs:
                context["mobility_needs"] = preferences.mobility_needs

        return context
