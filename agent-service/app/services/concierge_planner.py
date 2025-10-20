"""Concierge planning workflow built with LangGraph."""

from __future__ import annotations

import json
import os
import logging
from typing import Any, Dict, Optional, TypedDict

from langchain.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage
from langgraph.graph import END, StateGraph

from json_repair import repair_json

from ..clients import OpenAIChatClient, ClaudeChatClient
from ..config import get_settings
from ..exceptions import ConciergePlanningError, ConciergeConfigurationError
from ..schemas.concierge import ConciergeRequest, ConciergeResponse
from .context_service import ContextBundle, ContextService

logger = logging.getLogger(__name__)


class ConciergeState(TypedDict, total=False):
    """State tracked through the LangGraph workflow."""

    request: ConciergeRequest
    context: ContextBundle
    raw_response: str
    parsed: Dict[str, Any]


class ConciergePlanner:
    """Coordinate context gathering and LLM-driven planning."""

    def __init__(self) -> None:
        self._context_service = ContextService()
        self._prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "You are an expert travel concierge that crafts personalised itineraries. "
                        "Always ground the plan in provided context data. "
                        "Respond strictly as JSON matching the schema:\n\n"
                        "{schema_description}\n\n"
                        "Rules:\n"
                        "- Each itinerary day must reference activity ids that exist in the activities array.\n"
                        "- Include accessibility flags and price tiers when available; otherwise mark as null.\n"
                        "- Restaurant recommendations must honour dietary restrictions.\n"
                        "- Provide a concise packing checklist grouped by category with reasons tied to weather.\n"
                        "- Add insights section summarising weather, notable events, and confidence score 0-1.\n"
                        "- Cite sources by referencing items in data_sources (e.g. 'supabase:pois table' or Tavily URLs).\n"
                        "- If the query is vague, infer preferences from traveler persona and booking details."
                    ),
                ),
                (
                    "human",
                    (
                        "Booking details:\n{booking}\n\n"
                        "Traveler preferences:\n{preferences}\n\n"
                        "Natural language query: {query}\n\n"
                        "Context bundle:\n{context}\n\n"
                        "Produce JSON only, no additional commentary."
                    ),
                ),
            ]
        )
        self._graph = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(ConciergeState)
        graph.add_node("gather_context", self._gather_context)
        graph.add_node("plan_itinerary", self._plan_itinerary)
        graph.set_entry_point("gather_context")
        graph.add_edge("gather_context", "plan_itinerary")
        graph.add_edge("plan_itinerary", END)
        return graph.compile()

    async def _gather_context(self, state: ConciergeState) -> ConciergeState:
        request = state["request"]
        context = await self._context_service.build_context(request)
        return {"context": context}

    async def _plan_itinerary(self, state: ConciergeState) -> ConciergeState:
        request = state["request"]
        context = state["context"]

        settings = get_settings()
        if settings.langsmith_api_key:
            os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
            os.environ.setdefault("LANGCHAIN_API_KEY", settings.langsmith_api_key)
        if settings.langsmith_project:
            os.environ.setdefault("LANGCHAIN_PROJECT", settings.langsmith_project)
        if settings.langsmith_api_url:
            os.environ.setdefault("LANGCHAIN_ENDPOINT", settings.langsmith_api_url)

        prompt_value = self._prompt.format_prompt(
            schema_description=json.dumps(ConciergeResponse.model_json_schema(), indent=2),
            booking=json.dumps(request.booking.model_dump(), indent=2),
            preferences=json.dumps(
                request.preferences.model_dump() if request.preferences else {}, indent=2
            ),
            query=request.query or "N/A",
            context=json.dumps(context.model_dump(), indent=2),
        )
        provider_factories = [("openai", OpenAIChatClient)]
        if settings.anthropic_api_key:
            provider_factories.append(("anthropic", ClaudeChatClient))

        last_error: Optional[Exception] = None
        last_content: Optional[Any] = None

        for provider_name, factory in provider_factories:
            try:
                llm = factory().create()
            except ConciergeConfigurationError as exc:
                logger.debug("Concierge provider %s unavailable: %s", provider_name, exc)
                last_error = exc
                continue

            content: Optional[Any] = None
            try:
                ai_message = await llm.ainvoke(prompt_value.to_messages())
                if not isinstance(ai_message, AIMessage):
                    raise ConciergePlanningError("Unexpected response type from language model.")

                content = ai_message.content
                parsed = self._parse_model_output(content)

                if not parsed.get("insights", {}).get("data_sources"):
                    parsed.setdefault("insights", {}).setdefault("data_sources", context.data_sources)

                if "insights" in parsed:
                    parsed["insights"].setdefault("data_sources", context.data_sources)
                else:
                    parsed["insights"] = {"data_sources": context.data_sources}

                return {"raw_response": content, "parsed": parsed}
            except ConciergePlanningError as exc:
                logger.warning(
                    "Concierge provider %s produced invalid JSON, attempting fallback provider.",
                    provider_name,
                )
                last_error = exc
                last_content = content
                continue
            except Exception as exc:  # pylint: disable=broad-except
                logger.warning("Concierge provider %s failed: %s", provider_name, exc)
                last_error = exc
                last_content = content
                continue

        logger.error("All concierge providers failed; returning minimal response.")
        fallback = self._build_fallback_response(last_content, context, last_error)
        return {"raw_response": last_content, "parsed": fallback}

    async def generate(self, request: ConciergeRequest) -> ConciergeResponse:
        """Public entrypoint to execute the concierge planner."""
        initial_state: ConciergeState = {"request": request}
        final_state = await self._graph.ainvoke(initial_state)

        try:
            return ConciergeResponse.model_validate(final_state["parsed"])
        except Exception as exc:  # pylint: disable=broad-except
            raise ConciergePlanningError("Failed to validate concierge response.") from exc

    @staticmethod
    def _parse_model_output(content: Any) -> Dict[str, Any]:
        """Attempt to parse the LLM JSON output."""
        if isinstance(content, dict):
            return content

        if isinstance(content, list):
            return {"itinerary": content}

        if not isinstance(content, str):
            raise ConciergePlanningError("LLM response unrecognised.")

        text = content.strip()
        if text.startswith("```"):
            text = text.strip("` \n")
            if text.startswith("json"):
                text = text[4:]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            try:
                repaired = repair_json(text)
                return json.loads(repaired)
            except Exception as exc:  # pylint: disable=broad-except
                raise ConciergePlanningError("Unable to parse model output JSON.") from exc

    @staticmethod
    def _build_fallback_response(
        content: Any,
        context: ContextBundle,
        error: Optional[Exception],
    ) -> Dict[str, Any]:
        snippet = ""
        if isinstance(content, str):
            snippet = content
        elif content is not None:
            snippet = json.dumps(content, ensure_ascii=False)

        if snippet and len(snippet) > 320:
            snippet = snippet[:317] + "..."

        message = "The concierge could not format a response. Please try refining your request."
        if snippet:
            message += f" Raw note: {snippet}"
        if error:
            message += f" (Reason: {error})"

        return {
            "itinerary": [],
            "activities": [],
            "restaurants": [],
            "packing_checklist": [],
            "insights": {
                "weather_summary": message,
                "event_highlights": [],
                "data_sources": context.data_sources,
                "confidence": 0.0,
            },
        }
