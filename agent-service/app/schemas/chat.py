"""Schemas for the conversational agent endpoint."""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    """Single chat message exchanged with the agent."""

    role: Literal["user", "assistant", "system"]
    content: str


class AgentChatRequest(BaseModel):
    """Payload for the conversational agent."""

    model_config = ConfigDict(populate_by_name=True)

    message: ChatMessage
    messages: List[ChatMessage] = Field(default_factory=list)
    traveler_id: Optional[int] = Field(
        default=None, alias="traveler_id", description="Authenticated traveler identifier"
    )
    city: Optional[str] = None
    country: Optional[str] = None
    locale: Optional[str] = None
    show_insights: bool = Field(default=True, description="Whether to include insights in the response")


class AgentChatResponse(BaseModel):
    """Agent response payload."""

    message: ChatMessage
    answer: str
    citations: List[dict] = Field(default_factory=list)
    insights: Optional[dict] = Field(default=None, description="Contextual insights including bookings, weather, etc.")
    diagnostics: Optional[dict] = None

