"""Request and response models for the concierge endpoint."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class BookingContext(BaseModel):
    """Structured booking details supplied to the concierge."""

    check_in: str = Field(..., description="ISO8601 start date for the stay")
    check_out: str = Field(..., description="ISO8601 end date for the stay")
    city: str
    country: str
    party: Optional[str] = Field(default=None, description="Party composition e.g. family, couple")
    property_type: Optional[str] = None


class TravelerPreferences(BaseModel):
    """Traveller preferences guiding the itinerary."""

    budget: Optional[str] = Field(default=None, description="Budget descriptor (e.g. premium, mid, value)")
    interests: List[str] = Field(default_factory=list)
    mobility_needs: List[str] = Field(default_factory=list)
    dietary_restrictions: List[str] = Field(default_factory=list)
    traveler_persona: Optional[str] = None


class ConciergeRequest(BaseModel):
    """Payload accepted by the concierge endpoint."""

    booking: BookingContext
    preferences: Optional[TravelerPreferences] = None
    query: Optional[str] = Field(
        default=None,
        description="Free-text natural language query to augment structured context.",
    )
    locale: Optional[str] = Field(default=None, description="Preferred language/locale code.")


class ItineraryBlock(BaseModel):
    """Morning/afternoon/evening itinerary entry referencing activities."""

    title: str
    summary: Optional[str] = None
    activity_ids: List[str] = Field(default_factory=list)


class DayPlan(BaseModel):
    """Day-by-day plan segmented into morning/afternoon/evening blocks."""

    date: Optional[str] = None
    morning: Optional[ItineraryBlock] = None
    afternoon: Optional[ItineraryBlock] = None
    evening: Optional[ItineraryBlock] = None


class GeoPoint(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AccessibilityFlags(BaseModel):
    wheelchair_friendly: Optional[bool] = None
    kid_friendly: Optional[bool] = None


class ActivityCard(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    address: Optional[str] = None
    geo: Optional[GeoPoint] = None
    price_tier: Optional[str] = None
    duration: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    accessibility: AccessibilityFlags = Field(default_factory=AccessibilityFlags)
    data_source: Optional[str] = None


class RestaurantRecommendation(BaseModel):
    id: str
    name: str
    cuisine: Optional[str] = None
    price_tier: Optional[str] = None
    address: Optional[str] = None
    reservation: Optional[str] = None
    dietary_notes: List[str] = Field(default_factory=list)
    data_source: Optional[str] = None


class PackingItem(BaseModel):
    item: str
    reason: Optional[str] = None
    must_have: bool = False


class PackingCategory(BaseModel):
    category: str
    items: List[PackingItem] = Field(default_factory=list)


class ConciergeInsights(BaseModel):
    weather_summary: Optional[str] = None
    event_highlights: List[str] = Field(default_factory=list)
    data_sources: List[dict] = Field(default_factory=list)
    confidence: float = Field(default=0.6, ge=0, le=1)


class ConciergeResponse(BaseModel):
    """Structured concierge response consumed by the frontend."""

    itinerary: List[DayPlan] = Field(default_factory=list)
    activities: List[ActivityCard] = Field(default_factory=list)
    restaurants: List[RestaurantRecommendation] = Field(default_factory=list)
    packing_checklist: List[PackingCategory] = Field(default_factory=list)
    insights: ConciergeInsights = Field(default_factory=ConciergeInsights)
