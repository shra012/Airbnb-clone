"""Graph-powered conversational agent leveraging external tools."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone, date
from typing import Any, Dict, List, Optional, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import AIMessage
from langgraph.graph import END, StateGraph

from ..clients import OpenAIChatClient, SupabaseContextClient, TavilySearchClient, WeatherForecastClient
from ..exceptions import ConciergePlanningError, ConciergeConfigurationError
from ..schemas.chat import AgentChatRequest, AgentChatResponse, ChatMessage
from .tools import TavilyTool, WeatherTool, BookingsTool

logger = logging.getLogger(__name__)


class ChatAgentState(TypedDict, total=False):
    request: AgentChatRequest
    query: str
    analysis: Dict[str, Any]
    bookings: List[Dict[str, Any]]
    properties: List[Dict[str, Any]]
    weather: Dict[str, Any]
    search_results: List[Dict[str, Any]]
    citations: List[Dict[str, str]]
    response: ChatMessage


class ChatAgent:
    """Conversational agent that orchestrates Supabase, weather, and Tavily tools."""

    def __init__(self) -> None:
        self._supabase_client = SupabaseContextClient()
        self._tavily_client = TavilySearchClient()
        self._weather_client = WeatherForecastClient()

        self._bookings_tool = BookingsTool(self._supabase_client)
        self._weather_tool = WeatherTool(self._weather_client)
        self._tavily_tool = TavilyTool(self._tavily_client)

        self._prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    (
                        "You are AirHost, an AI travel concierge assistant developed by the AirHost team.\n"
                        "Use the provided structured context to answer the traveller's latest question accurately.\n"
                        "When asked about who created you or who developed you, respond that you were developed by AirHost.\n"
                        "Only rely on supplied data. If information is missing, state that transparently.\n"
                        "Be concise (under 200 words) and, when relevant, present bullet lists for multiple items.\n"
                        "Prioritise traveller bookings, dates, property names, and locations when answering account-specific questions.\n"
                        "Weather insights should reference the forecast summary only when asked or when clearly helpful.\n"
                        "Do not invent reservations or make assumptions beyond the given context."
                    ),
                ),
                (
                    "human",
                    (
                        "Conversation history:\n{history}\n\n"
                        "Latest question:\n{query}\n\n"
                        "Contextual data (JSON):\n{context}\n\n"
                        "Provide your answer for the traveller now."
                    ),
                ),
            ]
        )

        self._graph = self._build_graph()

    def _build_graph(self):
        graph = StateGraph(ChatAgentState)
        graph.add_node("classify", self._classify_query)
        graph.add_node("fetch_bookings", self._fetch_bookings)
        graph.add_node("fetch_weather", self._fetch_weather)
        graph.add_node("fetch_properties", self._fetch_properties)
        graph.add_node("fetch_search", self._fetch_search)
        graph.add_node("respond", self._build_response)

        graph.set_entry_point("classify")

        def _route_next(state: ChatAgentState) -> str:
            analysis = state.get("analysis", {})
            if analysis.get("needs_bookings"):
                return "fetch_bookings"
            elif analysis.get("needs_weather"):
                return "fetch_weather"
            elif analysis.get("needs_properties"):
                return "fetch_properties"
            elif analysis.get("needs_search"):
                return "fetch_search"
            else:
                return "respond"

        graph.add_conditional_edges("classify", _route_next)
        graph.add_edge("fetch_bookings", "respond")
        graph.add_edge("fetch_weather", "respond")
        graph.add_edge("fetch_properties", "respond")
        graph.add_edge("fetch_search", "respond")
        graph.add_edge("respond", END)

        return graph.compile()

    async def generate(self, request: AgentChatRequest) -> AgentChatResponse:
        """Generate chat response using workflow."""
        try:
            initial_state: ChatAgentState = {
                "request": request,
                "query": request.message.content,
                "analysis": {},
                "bookings": [],
                "properties": [],
                "weather": {},
                "search_results": [],
                "citations": [],
            }

            result = await self._graph.ainvoke(initial_state)
            response_msg = result.get("response")

            if not response_msg:
                raise ConciergePlanningError("No response generated")

            # Build insights from the collected data
            insights = {}
            if result.get("properties"):
                insights["properties"] = result["properties"]
            if result.get("weather"):
                insights["weather"] = result["weather"]
                # Add weather summary for UI display
                weather_data = result["weather"]
                if weather_data.get("headline"):
                    headline = weather_data["headline"]
                    main = headline.get("main", {})
                    temp = main.get("temp", 0)
                    weather_list = headline.get("weather", [])
                    desc = weather_list[0].get("description", "") if weather_list else ""
                    insights["weather_summary"] = f"Currently {temp}°C with {desc}"
            if result.get("bookings"):
                insights["bookings"] = result["bookings"]
            if result.get("search_results"):
                insights["web_results"] = result["search_results"]

            return AgentChatResponse(
                message=response_msg,
                answer=response_msg.content,
                citations=result.get("citations", []),
                insights=insights if insights else None,
            )

        except Exception as e:
            logger.error(f"Chat generation error: {e}", exc_info=True)
            error_msg = ChatMessage(
                role="assistant",
                content="I encountered an error processing your request. Please try again.",
            )
            return AgentChatResponse(
                message=error_msg,
                answer=error_msg.content,
                citations=[],
            )

    async def _classify_query(self, state: ChatAgentState) -> Dict[str, Any]:
        """Classify query to determine which tools to use."""
        query = state["query"].lower()
        analysis = {
            "needs_bookings": False,
            "needs_weather": False,
            "needs_properties": False,
            "needs_search": False,
        }

        # Check for booking-related queries
        booking_keywords = ["booking", "reservation", "trip", "upcoming", "my stays"]
        if any(kw in query for kw in booking_keywords):
            analysis["needs_bookings"] = True

        # Check for weather-related queries
        weather_keywords = ["weather", "temperature", "forecast", "rain", "sunny", "climate"]
        if any(kw in query for kw in weather_keywords):
            analysis["needs_weather"] = True

        # Check for property-related queries
        property_keywords = ["properties", "property", "rental", "rentals", "accommodation", "place to stay", "listing", "listings", "apartment", "house", "cottage"]
        if any(kw in query for kw in property_keywords):
            analysis["needs_properties"] = True

        # Check for search-related queries (general web search)
        # Only use web search for non-property, non-booking, non-weather queries
        # These are general information queries about places, landmarks, etc.
        search_keywords = ["tell me about", "what is", "who is", "information about", "history of", "facts about"]
        # Only trigger search if it's a general query AND not already covered by other tools
        is_general_query = any(kw in query for kw in search_keywords)
        is_landmark_query = any(word in query for word in ["tower", "monument", "museum", "cathedral", "palace", "bridge"])
        
        if (is_general_query or is_landmark_query) and not analysis["needs_properties"] and not analysis["needs_bookings"]:
            analysis["needs_search"] = True

        return {"analysis": analysis}

    async def _fetch_bookings(self, state: ChatAgentState) -> Dict[str, Any]:
        """Fetch booking data."""
        try:
            request = state["request"]
            traveler_id = request.traveler_id
            if not traveler_id:
                return {"bookings": []}

            bookings_data = await self._bookings_tool.run(traveler_id=traveler_id)
            return {"bookings": bookings_data if isinstance(bookings_data, list) else []}
        except Exception as e:
            logger.error(f"Bookings fetch error: {e}", exc_info=True)
            return {"bookings": []}

    async def _fetch_properties(self, state: ChatAgentState) -> Dict[str, Any]:
        """Fetch property listings from database."""
        try:
            query = state["query"]
            
            # Extract city from query (simple extraction)
            city = None
            country = None
            
            # Try to extract location from query
            words = query.lower().split()
            for i, word in enumerate(words):
                if word in ["in", "at", "near"]:
                    if i + 1 < len(words):
                        location = words[i + 1].strip("?.,!")
                        city = location.title()
                        break
            
            # Fetch properties from Supabase
            properties_data = await self._supabase_client.fetch_properties(
                city=city,
                country=country,
                limit=10
            )
            
            logger.info(f"Found {len(properties_data)} properties for city={city}")
            return {"properties": properties_data if isinstance(properties_data, list) else []}
        except Exception as e:
            logger.error(f"Properties fetch error: {e}", exc_info=True)
            return {"properties": []}

    async def _fetch_weather(self, state: ChatAgentState) -> Dict[str, Any]:
        """Fetch weather data."""
        try:
            query = state["query"]
            city = "San Francisco"

            # Simple city extraction
            words = query.split()
            for i, word in enumerate(words):
                if word.lower() in ["in", "at", "for"]:
                    if i + 1 < len(words):
                        city = words[i + 1].strip("?.,!")
                        break

            weather_data = await self._weather_tool.run(location_query=city)
            return {"weather": weather_data}
        except Exception as e:
            logger.error(f"Weather fetch error: {e}", exc_info=True)
            return {"weather": {}}

    async def _fetch_search(self, state: ChatAgentState) -> Dict[str, Any]:
        """Fetch search results."""
        try:
            query = state["query"]
            results = await self._tavily_tool.run(query=query, max_results=3)
            
            citations = []
            if isinstance(results, list):
                for r in results:
                    if isinstance(r, dict):
                        citations.append({
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                        })

            return {
                "search_results": results if isinstance(results, list) else [],
                "citations": citations,
            }
        except Exception as e:
            logger.error(f"Search fetch error: {e}", exc_info=True)
            return {"search_results": [], "citations": []}

    async def _build_response(self, state: ChatAgentState) -> Dict[str, Any]:
        """Build final response using LLM."""
        try:
            query = state["query"]
            bookings = state.get("bookings", [])
            properties = state.get("properties", [])
            weather = state.get("weather", {})
            search_results = state.get("search_results", [])

            context = {
                "bookings": bookings,
                "properties": properties,
                "weather": weather,
                "search_results": search_results,
            }

            history = ""

            client = OpenAIChatClient()
            llm = client.create()
            
            messages = self._prompt.format_messages(
                history=history,
                query=query,
                context=json.dumps(context, indent=2),
            )

            response = await llm.ainvoke(messages)
            content = response.content if hasattr(response, 'content') else str(response)

            return {
                "response": ChatMessage(
                    role="assistant",
                    content=content,
                )
            }
        except Exception as e:
            logger.error(f"Response building error: {e}", exc_info=True)
            return {
                "response": ChatMessage(
                    role="assistant",
                    content="I encountered an error building the response. Please try again.",
                )
            }
