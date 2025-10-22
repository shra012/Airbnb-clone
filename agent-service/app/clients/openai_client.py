"""OpenAI Chat API client helper."""

from __future__ import annotations

from langchain_openai import ChatOpenAI

from ..config import get_settings
from ..exceptions import ConciergeConfigurationError


class OpenAIChatClient:
    """Factory for LangChain ChatOpenAI instances."""

    def __init__(self) -> None:
        self._settings = get_settings()
        if not self._settings.openai_api_key:
            raise ConciergeConfigurationError(
                "OPENAI_API_KEY is required to run the concierge workflow."
            )

    def create(self) -> ChatOpenAI:
        """Return a configured ChatOpenAI model."""
        return ChatOpenAI(
            api_key=self._settings.openai_api_key,
            model=self._settings.openai_model_name,
            temperature=0.6,
            max_tokens=1800,
            timeout=60,
            max_retries=2,
        )
