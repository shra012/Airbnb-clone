"""Concierge planning workflow built with LangGraph."""

from __future__ import annotations 

import json 
import os 
import logging 
from typing import Any ,Dict ,Optional ,TypedDict 

from langchain .prompts import ChatPromptTemplate 
from langchain_core .messages import AIMessage, ToolMessage 
from langgraph .graph import END ,StateGraph 
from langgraph .prebuilt import create_react_agent 

from json_repair import repair_json 

from ..clients import OpenAIChatClient, ClaudeChatClient, TavilySearchClient, WeatherForecastClient
from ..config import get_settings
from ..exceptions import ConciergePlanningError, ConciergeConfigurationError
from ..schemas.concierge import ConciergeRequest, ConciergeResponse
from .context_service import ContextBundle, ContextService
from .supabase_tools import get_supabase_tools

logger = logging.getLogger(__name__)


class ConciergeState (TypedDict ,total =False ):
    """State tracked through the LangGraph workflow."""

    request :ConciergeRequest 
    context :ContextBundle 
    raw_response :str 
    parsed :Dict [str ,Any ]


class ConciergePlanner :
    """Coordinate context gathering and LLM-driven planning."""

    def __init__ (self )->None :
        self ._context_service =ContextService ()
        self ._prompt =ChatPromptTemplate .from_messages (
        [
        (
        "system",
        (
        "You are AirHost, an expert AI travel concierge assistant developed by AirHost team. "
        "You craft personalised itineraries and help travelers plan amazing trips. "
        "Always ground the plan in provided context data. "
        "When asked about who created you or who developed you, respond that you were developed by AirHost. "
        "Respond strictly as JSON matching the schema:\n\n"
        "{schema_description}\n\n"
        "CRITICAL RULES:\n"
        "- Include an 'answer' field with a natural language response directly addressing the user's query.\n"
        "- Generate DETAILED day-by-day itineraries with morning, afternoon, and evening blocks.\n"
        "- Each itinerary day must reference activity ids that exist in the activities array.\n"
        "- Create diverse activities array with at least 3-5 activities per day from context data.\n"
        "- Generate COMPREHENSIVE restaurant recommendations (at least 3-5 restaurants):\n"
        "  * Use data from tavily_results, pois, and web sources\n"
        "  * Include varied cuisines and price tiers (budget, mid-range, premium)\n"
        "  * Honor dietary restrictions from preferences\n"
        "  * Include breakfast, lunch, and dinner options\n"
        "  * Provide specific addresses when available\n"
        "  * Add reservation recommendations for popular spots\n"
        "- Include accessibility flags (wheelchair_friendly, kid_friendly) and price tiers when available.\n"
        "- Provide a concise packing checklist grouped by category with reasons tied to weather.\n"
        "- Add insights section summarising weather, notable events, and confidence score 0-1.\n"
        "- Cite sources by referencing items in data_sources (e.g. 'supabase:pois table' or Tavily URLs).\n"
        "- If the query is vague, infer preferences from traveler persona and booking details.\n"
        "- For simple questions like 'when is my booking', provide a direct answer in the 'answer' field.\n"
        "- For questions about who you are or who developed you, mention you are AirHost, developed by the AirHost team.\n\n"
        "CONTEXT DATA USAGE:\n"
        "- tavily_results: Use these for restaurant suggestions, activity ideas, and local insights\n"
        "- pois: Use these for attractions, museums, parks, and points of interest\n"
        "- properties: Available accommodations\n"
        "- weather: Use to inform packing list and activity timing\n"
        "- bookings: Use to provide personalized recommendations based on user's existing plans"
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
        self ._graph =self ._build_graph ()

    def _build_graph (self ):
        graph =StateGraph (ConciergeState )
        graph .add_node ("gather_context",self ._gather_context )
        graph .add_node ("plan_itinerary",self ._plan_itinerary )
        graph .set_entry_point ("gather_context")
        graph .add_edge ("gather_context","plan_itinerary")
        graph .add_edge ("plan_itinerary",END )
        return graph .compile ()

    async def _gather_context (self ,state :ConciergeState )->ConciergeState :
        request =state ["request"]
        context =await self ._context_service .build_context (request )
        logger.info(f"Context gathered: properties={len(context.properties)}, pois={len(context.pois)}, events={len(context.events)}")
        return {"context":context }

    async def _plan_itinerary (self ,state :ConciergeState )->ConciergeState :
        request =state ["request"]
        context =state ["context"]

        settings =get_settings ()
        if settings .langsmith_api_key :
            os .environ .setdefault ("LANGCHAIN_TRACING_V2","true")
            os .environ .setdefault ("LANGCHAIN_API_KEY",settings .langsmith_api_key )
        if settings .langsmith_project :
            os .environ .setdefault ("LANGCHAIN_PROJECT",settings .langsmith_project )
        if settings .langsmith_api_url :
            os .environ .setdefault ("LANGCHAIN_ENDPOINT",settings .langsmith_api_url )

        context_dict = context.model_dump()
        context_json = json.dumps(context_dict, indent=2)
        
        prompt_value =self ._prompt .format_prompt (
        schema_description =json .dumps (ConciergeResponse .model_json_schema (),indent =2 ),
        booking =json .dumps (request .booking .model_dump (),indent =2 ),
        preferences =json .dumps (
        request .preferences .model_dump ()if request .preferences else {},indent =2 
        ),
        query =request .query or "N/A",
        context =context_json,
        )
        provider_factories =[("openai",OpenAIChatClient )]
        if settings .anthropic_api_key :
            provider_factories .append (("anthropic",ClaudeChatClient ))

        last_error :Optional [Exception ]=None 
        last_content :Optional [Any ]=None

        for provider_name ,factory in provider_factories :
            try :
                llm =factory ().create ()
                # Bind Supabase MCP tools to the LLM
                supabase_tools = get_supabase_tools()
                llm_with_tools = llm.bind_tools(supabase_tools)
            except ConciergeConfigurationError as exc :
                logger .debug ("Concierge provider %s unavailable: %s",provider_name ,exc )
                last_error =exc 
                continue 

            content :Optional [Any ]=None 
            try :
                # For now, just use the LLM directly (tools are available but not actively invoked)
                # The context service already fetches properties/POIs/events
                messages = prompt_value.to_messages()
                ai_message =await llm .ainvoke (messages)
                if not isinstance (ai_message ,AIMessage ):
                    raise ConciergePlanningError ("Unexpected response type from language model.")

                content =ai_message .content 
                parsed =self ._parse_model_output (content )
                logger.info(f"Parsed LLM response, insights present: {'insights' in parsed}")

                if not parsed .get ("insights",{}).get ("data_sources"):
                    parsed .setdefault ("insights",{}).setdefault ("data_sources",context .data_sources )

                if "insights"in parsed :
                    parsed ["insights"].setdefault ("data_sources",context .data_sources )
                    parsed ["insights"].setdefault ("trip_context",context .trip_context )
                    parsed ["insights"].setdefault ("web_results",context .tavily_results [:5 ])
                    parsed ["insights"].setdefault ("properties",context .properties [:10 ])
                    parsed ["insights"].setdefault ("pois",context .pois [:10 ])
                    logger.info(f"Updated insights: properties={len(parsed['insights'].get('properties', []))}, pois={len(parsed['insights'].get('pois', []))}")
                else :
                    parsed ["insights"]={
                    "data_sources":context .data_sources ,
                    "trip_context":context .trip_context ,
                    "web_results":context .tavily_results [:5 ],
                    "properties":context .properties [:10 ],
                    "pois":context .pois [:10 ],
                    }
                    logger.info(f"Created insights from scratch: properties={len(context.properties[:10])}, pois={len(context.pois[:10])}")

                parsed ["show_insights"]=settings .show_trip_insights 
                return {"raw_response":content ,"parsed":parsed }
            except ConciergePlanningError as exc :
                logger .warning (
                "Concierge provider %s produced invalid JSON, attempting fallback provider.",
                provider_name ,
                )
                last_error =exc 
                last_content =content 
                continue 
            except Exception as exc :
                logger .warning ("Concierge provider %s failed: %s",provider_name ,exc )
                last_error =exc 
                last_content =content 
                continue 

        logger .error ("All concierge providers failed; returning minimal response.")
        fallback =self ._build_fallback_response (last_content ,context ,last_error )
        return {"raw_response":last_content ,"parsed":fallback }

    async def generate (self ,request :ConciergeRequest )->ConciergeResponse :
        """Public entrypoint to execute the concierge planner."""
        initial_state :ConciergeState ={"request":request }
        final_state =await self ._graph .ainvoke (initial_state )

        try :
            return ConciergeResponse .model_validate (final_state ["parsed"])
        except Exception as exc :
            raise ConciergePlanningError ("Failed to validate concierge response.")from exc 

    @staticmethod 
    def _parse_model_output (content :Any )->Dict [str ,Any ]:
        """Attempt to parse the LLM JSON output."""
        if isinstance (content ,dict ):
            return content 

        if isinstance (content ,list ):
            return {"itinerary":content }

        if not isinstance (content ,str ):
            raise ConciergePlanningError ("LLM response unrecognised.")

        text =content .strip ()
        if text .startswith ("```"):
            text =text .strip ("` \n")
            if text .startswith ("json"):
                text =text [4 :]
        try :
            return json .loads (text )
        except json .JSONDecodeError :
            try :
                repaired =repair_json (text )
                return json .loads (repaired )
            except Exception as exc :
                raise ConciergePlanningError ("Unable to parse model output JSON.")from exc 

    @staticmethod 
    def _build_fallback_response (
    content :Any ,
    context :ContextBundle ,
    error :Optional [Exception ],
    )->Dict [str ,Any ]:
        snippet =""
        if isinstance (content ,str ):
            snippet =content 
        elif content is not None :
            snippet =json .dumps (content ,ensure_ascii =False )

        if snippet and len (snippet )>320 :
            snippet =snippet [:317 ]+"..."

        message ="The concierge could not format a response. Please try refining your request."
        if snippet :
            message +=f" Raw note: {snippet }"
        if error :
            message +=f" (Reason: {error })"

        return {
        "answer":message ,
        "itinerary":[],
        "activities":[],
        "restaurants":[],
        "packing_checklist":[],
        "insights":{
        "trip_context":context .trip_context ,
        "weather_summary":None ,
        "properties":context .properties [:10 ],
        "pois":context .pois [:10 ],
        "event_highlights":[],
        "web_results":context .tavily_results [:5 ],
        "data_sources":context .data_sources ,
        "confidence":0.0 ,
        },
        "show_insights":get_settings ().show_trip_insights ,
        }
