"""Anthropic Claude chat client helper."""

from __future__ import annotations

from langchain_anthropic import ChatAnthropic

from ..config import get_settings
from ..exceptions import ConciergeConfigurationError


class ClaudeChatClient:
    """Factory for LangChain ChatAnthropic instances."""

    def __init__(self) -> None:
        self._settings = get_settings()
        if not self._settings.anthropic_api_key:
            raise ConciergeConfigurationError("ANTHROPIC_API_KEY is required for Claude fallback.")

    def create(self) -> ChatAnthropic:
        """Return a configured ChatAnthropic model."""
        return ChatAnthropic(
            api_key=self._settings.anthropic_api_key,
            model=self._settings.anthropic_model_name,
            temperature=0.6,
            max_tokens=1800,
        )
