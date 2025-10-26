"""Context aggregation for the concierge workflow."""

from __future__ import annotations 

import asyncio 
import logging
from typing import Any ,Dict ,List 

from pydantic import BaseModel ,Field 

from ..clients import (
SupabaseContextClient ,
TavilySearchClient ,
WeatherForecastClient ,
)
from ..schemas .concierge import ConciergeRequest 

logger = logging.getLogger(__name__) 


class ContextBundle (BaseModel ):
    """Aggregated context data available to the concierge planner."""

    pois :List [Dict [str ,Any ]]=Field (default_factory =list )
    events :List [Dict [str ,Any ]]=Field (default_factory =list )
    properties :List [Dict [str ,Any ]]=Field (default_factory =list )
    weather :Dict [str ,Any ]=Field (default_factory =dict )
    tavily_results :List [Dict [str ,Any ]]=Field (default_factory =list )
    bookings :List [Dict [str ,Any ]]=Field (default_factory =list )
    data_sources :List [Dict [str ,str ]]=Field (default_factory =list )
    trip_context :Dict [str ,Any ]=Field (default_factory =dict )


class ContextService :
    """Gather relevant context for the concierge planner."""

    def __init__ (self )->None :
        self ._supabase =SupabaseContextClient ()
        self ._tavily =TavilySearchClient ()
        self ._weather =WeatherForecastClient ()

    async def build_context (self ,request :ConciergeRequest )->ContextBundle :
        booking =request .booking 
        preferences =request .preferences 
        tasks =[]

        async def _const (value ):
            return value 


        is_trip_related =self ._is_trip_related_query (request .query )

        # Parse city and country from booking
        search_city =booking .city 
        search_country =booking .country 
        
        # If city/country not provided, try to parse from destination
        if not search_city and booking.destination:
            # Simple parsing: "San Jose, CA" -> city="San Jose", country="US"
            parts = [p.strip() for p in booking.destination.split(',')]
            if len(parts) >= 1:
                search_city = parts[0]
            if len(parts) >= 2:
                # Map state codes or country codes
                state_or_country = parts[1]
                # Simple US state mapping
                if state_or_country in ['CA', 'NY', 'TX', 'FL']:  # Add more as needed
                    search_country = 'US'
                else:
                    search_country = state_or_country
            logger.info(f"Parsed destination '{booking.destination}' -> city={search_city}, country={search_country}")

        if request .query and (not search_city or search_city .lower ()=="unknown"):
            extracted_location =self ._extract_location_from_query (request .query )
            if extracted_location .get ("city"):
                search_city =extracted_location ["city"]
            if extracted_location .get ("country"):
                search_country =extracted_location ["country"]

        # Determine query intent to avoid unnecessary tool calls
        query_intent = self._analyze_query_intent(request.query) if request.query else {}
        logger.info(f"Query intent: {query_intent}")

        property_type = None  # Disabled: users say "hotels" but DB has "apartment", "house", etc.
        # property_type =self ._extract_property_type_from_query (request .query )if request .query else None 

        if self ._supabase .enabled :
            # For city-based searches, don't filter by country to avoid mismatches (USA vs US vs United States)
            # Only use country if city is not specified
            country_filter = None if search_city else search_country
            
            # Only fetch POIs if query is about attractions/sightseeing
            if query_intent.get('needs_pois', True):
                tasks .append (
                self ._supabase .fetch_pois (search_city ,country_filter ,limit =20 )
                )
            else:
                tasks.append(_const([]))
                logger.info("Skipping POIs fetch - not needed for this query")
            
            # Only fetch events if query is about activities/events
            if query_intent.get('needs_events', True):
                tasks .append (
                self ._supabase .fetch_events (
                city =search_city ,
                country =country_filter ,
                start_date =booking .check_in ,
                end_date =booking .check_out ,
                limit =20 ,
                )
                )
            else:
                tasks.append(_const([]))
                logger.info("Skipping events fetch - not needed for this query")

            # Only fetch properties if query is about accommodation
            if query_intent.get('needs_properties', False) and (search_city or search_country):
                tasks .append (
                self ._supabase .fetch_properties (
                city =search_city ,
                country =country_filter ,
                property_type =property_type ,
                limit =15 
                )
                )
            else :
                tasks .append (_const ([]))
                if not query_intent.get('needs_properties', False):
                    logger.info("Skipping properties fetch - not needed for this query")
            
            if request .traveler_id :
                tasks .append (
                self ._supabase .fetch_traveler_bookings (
                traveler_id =request .traveler_id ,
                limit =6 ,
                )
                )
            else :
                tasks .append (_const ([]))
        else :
            tasks .extend ([_const ([]),_const ([]),_const ([]),_const ([])])


        if self ._weather .enabled and is_trip_related and query_intent.get('needs_weather', True):
            tasks .append (self ._weather .fetch_forecast (f"{search_city }, {search_country }"))
        else :
            tasks .append (_const ({}))
            if not query_intent.get('needs_weather', True):
                logger.info("Skipping weather fetch - not needed for this query")

        # Enhanced Tavily search: include main query + restaurant/activity searches
        tavily_searches = []
        if self._tavily.enabled:
            if request.query:
                tavily_searches.append(self._tavily.search(request.query, max_results=5))
            
            # Add restaurant search if we have location
            if search_city and query_intent.get('needs_restaurants', True):
                restaurant_query = f"best restaurants in {search_city}"
                if preferences and preferences.dietary_restrictions:
                    diet_str = ", ".join(preferences.dietary_restrictions)
                    restaurant_query += f" with {diet_str} options"
                tavily_searches.append(self._tavily.search(restaurant_query, max_results=5))
                logger.info(f"Added restaurant search: {restaurant_query}")
            
            # Add activities search if trip-related
            if search_city and is_trip_related and query_intent.get('needs_activities', True):
                activities_query = f"things to do and activities in {search_city}"
                if preferences and preferences.interests:
                    interests_str = ", ".join(preferences.interests[:3])  # Limit to top 3
                    activities_query += f" for {interests_str}"
                tavily_searches.append(self._tavily.search(activities_query, max_results=5))
                logger.info(f"Added activities search: {activities_query}")
        
        if tavily_searches:
            tasks.append(asyncio.gather(*tavily_searches))
        else:
            tasks.append(_const([]))

        results =await asyncio .gather (*tasks )
        
        # Log the number of results
        logger.info(f"Gathered {len(results)} results from {len(tasks)} tasks")

        pois ,events ,properties ,traveler_bookings ,weather ,tavily_result_groups =results 
        
        # Flatten Tavily results if we got multiple searches
        tavily_results = []
        if isinstance(tavily_result_groups, list):
            if tavily_result_groups and isinstance(tavily_result_groups[0], list):
                # Multiple Tavily searches - flatten them
                for group in tavily_result_groups:
                    if isinstance(group, list):
                        tavily_results.extend(group)
            else:
                # Single Tavily search
                tavily_results = tavily_result_groups
        
        logger.info(f"Combined Tavily results: {len(tavily_results)} items")
        
        # Log what we got
        logger.info(f"POIs: {len(pois)}, Events: {len(events)}, Properties: {len(properties)}, Bookings: {len(traveler_bookings)}") 


        trip_context =self ._build_trip_context (booking ,preferences ,traveler_bookings )

        data_sources :List [Dict [str ,str ]]=[]
        if self ._supabase .enabled and pois :
            data_sources .append (
            {"source":"supabase","reference":"pois table"}
            )
        if self ._supabase .enabled and events :
            data_sources .append (
            {"source":"supabase","reference":"events table"}
            )
        if self ._supabase .enabled and properties :
            data_sources .append (
            {"source":"supabase","reference":"properties table"}
            )
        if self ._supabase .enabled and traveler_bookings :
            data_sources .append (
            {"source":"supabase","reference":"bookings table"}
            )
        if self ._weather .enabled and weather :
            data_sources .append (
            {"source":"weatherapi","reference":"7-day forecast"}
            )
        if self ._tavily .enabled and tavily_results :
            data_sources .extend (
            {"source":"tavily","reference":result .get ("url","")}
            for result in tavily_results 
            if result .get ("url")
            )

        return ContextBundle (
        pois =pois ,
        events =events ,
        properties =properties ,
        bookings =traveler_bookings ,
        weather =weather ,
        tavily_results =tavily_results ,
        data_sources =data_sources ,
        trip_context =trip_context ,
        )

    def _is_trip_related_query (self ,query :str |None )->bool :
        """Check if the query is trip/travel related."""
        if not query :
            return True 

        query_lower =query .lower ()
        trip_keywords =[
        "trip","travel","visit","itinerary","plan","vacation","holiday",
        "stay","explore","tour","sightseeing","activities","things to do",
        "restaurant","eat","food","hotel","accommodation","weather",
        "pack","bring","destination","flight","transportation"
        ]
        return any (keyword in query_lower for keyword in trip_keywords )

    def _analyze_query_intent(self, query: str | None) -> Dict[str, bool]:
        """Analyze query to determine which data sources are needed."""
        if not query:
            return {
                'needs_properties': False,
                'needs_pois': True,
                'needs_events': True,
                'needs_weather': True,
            }
        
        query_lower = query.lower()
        
        # Keywords for different intents
        accommodation_keywords = [
            'hotel', 'stay', 'accommodation', 'property', 'airbnb', 'place to stay',
            'where to stay', 'rental', 'apartment', 'house', 'villa', 'cottage',
            'hostel', 'resort', 'lodge'
        ]
        
        food_keywords = [
            'food', 'restaurant', 'eat', 'dining', 'cuisine', 'meal', 'breakfast',
            'lunch', 'dinner', 'cafe', 'coffee', 'vegan', 'vegetarian', 'foodie',
            'culinary', 'eatery', 'bistro', 'gastropub', 'diner', 'bakery', 'bar'
        ]
        
        attraction_keywords = [
            'attraction', 'sight', 'landmark', 'museum', 'park', 'monument',
            'point of interest', 'poi', 'visit', 'see', 'explore', 'tour',
            'sightseeing', 'historic', 'gallery', 'temple', 'church', 'castle'
        ]
        
        activity_keywords = [
            'activity', 'event', 'festival', 'concert', 'show', 'performance',
            'entertainment', 'nightlife', 'club', 'bar', 'live music', 'theater',
            'cinema', 'sports', 'game'
        ]
        
        weather_keywords = [
            'weather', 'temperature', 'rain', 'sunny', 'forecast', 'climate',
            'pack', 'bring', 'wear', 'clothing'
        ]
        
        # Determine needs based on keywords
        needs_properties = any(kw in query_lower for kw in accommodation_keywords)
        needs_pois = any(kw in query_lower for kw in attraction_keywords)
        needs_events = any(kw in query_lower for kw in activity_keywords)
        needs_weather = any(kw in query_lower for kw in weather_keywords)
        
        # Special case: food-focused queries don't need properties/pois/events
        is_food_focused = any(kw in query_lower for kw in food_keywords)
        if is_food_focused and not needs_properties and not needs_pois:
            # Pure food query - only need Tavily
            needs_pois = False
            needs_events = False
            needs_weather = False
        
        # If no specific intent detected, default to fetching POIs and events
        if not any([needs_properties, needs_pois, needs_events, is_food_focused]):
            needs_pois = True
            needs_events = True
        
        return {
            'needs_properties': needs_properties,
            'needs_pois': needs_pois,
            'needs_events': needs_events,
            'needs_weather': needs_weather,
            'needs_restaurants': is_food_focused or self._is_trip_related_query(query),
            'needs_activities': needs_pois or needs_events or self._is_trip_related_query(query),
        }

    def _extract_location_from_query (self ,query :str )->Dict [str ,str |None ]:
        """Extract city/country from natural language query."""
        import re 




        location ={"city":None ,"country":None }
        query_lower =query .lower ()


        in_pattern =r'\b(?:in|at)\s+([a-z\s]+?)(?:\s*,\s*([a-z\s]+?))?(?:\s|$|,|\?|!)'
        match =re .search (in_pattern ,query_lower )

        if match :
            city =match .group (1 ).strip ()
            country =match .group (2 ).strip ()if match .group (2 )else None 


            city =re .sub (r'\b(the)\b','',city ).strip ()

            if city :
                location ["city"]=city .title ()
            if country :
                location ["country"]=country .title ()

        return location 

    def _extract_property_type_from_query (self ,query :str )->str |None :
        """Extract property type from natural language query."""
        query_lower =query .lower ()


        property_type_keywords ={
        "hotel":"hotel",
        "hotels":"hotel",
        "apartment":"apartment",
        "apartments":"apartment",
        "villa":"villa",
        "villas":"villa",
        "house":"house",
        "houses":"house",
        "condo":"condo",
        "condos":"condo",
        "cottage":"cottage",
        "cottages":"cottage",
        "cabin":"cabin",
        "cabins":"cabin",
        "resort":"resort",
        "resorts":"resort",
        }

        for keyword ,prop_type in property_type_keywords .items ():
            if keyword in query_lower :
                return prop_type 

        return None 

    def _build_trip_context (
    self ,
    booking :Any ,
    preferences :Any |None ,
    traveler_bookings :List [Dict [str ,Any ]]|None =None ,
    )->Dict [str ,Any ]:
        """Build trip context from booking, preferences, and Supabase booking history."""
        from datetime import datetime ,timezone 

        def _normalise (value :str |None )->str |None :
            if not value :
                return None 
            trimmed =value .strip ()
            if not trimmed or trimmed .lower ()=="unknown":
                return None 
            return trimmed 

        def _parse_iso (value :str |None )->datetime |None :
            if not value :
                return None 
            try :
                return datetime .fromisoformat (value .replace ("Z","+00:00"))
            except Exception :
                return None 

        def _select_primary (rows :List [Dict [str ,Any ]])->Dict [str ,Any ]|None :
            today =datetime .now (timezone .utc ).date ()
            upcoming :list [tuple [datetime |None ,Dict [str ,Any ]]]=[]
            past :list [tuple [datetime |None ,Dict [str ,Any ]]]=[]
            for row in rows :
                start =_parse_iso (row .get ("start_date"))
                end =_parse_iso (row .get ("end_date"))
                if not end :
                    continue 
                if end .date ()<today :
                    past .append ((end ,row ))
                else :
                    upcoming .append ((start or end ,row ))
            if upcoming :
                upcoming .sort (key =lambda item :item [0 ]or datetime .max )
                return upcoming [0 ][1 ]
            if past :
                past .sort (key =lambda item :item [0 ],reverse =True )
                return past [0 ][1 ]
            return None 

        context :Dict [str ,Any ]={}

        city =_normalise (getattr (booking ,"city",None ))
        country =_normalise (getattr (booking ,"country",None ))
        if city or country :
            context ["destination"]=", ".join (part for part in [city ,country ]if part )

        check_in_dt =_parse_iso (getattr (booking ,"check_in",None ))
        check_out_dt =_parse_iso (getattr (booking ,"check_out",None ))
        if check_in_dt and check_out_dt :
            context ["dates"]=f"{check_in_dt .strftime ('%b %d')} - {check_out_dt .strftime ('%b %d, %Y')}"
        else :
            raw_in =_normalise (getattr (booking ,"check_in",None ))
            raw_out =_normalise (getattr (booking ,"check_out",None ))
            if raw_in or raw_out :
                context ["dates"]=f"{raw_in or ''} to {raw_out or ''}".strip ()

        if getattr (booking ,"party",None ):
            context ["party"]=booking .party 

        if traveler_bookings :
            context ["existing_bookings"]=traveler_bookings 
            primary =_select_primary (traveler_bookings )
            if primary :
                prop =primary .get ("property")or {}
                if "destination"not in context or not context ["destination"]:
                    primary_city =_normalise (prop .get ("city"))
                    primary_country =_normalise (prop .get ("country"))
                    if primary_city or primary_country :
                        context ["destination"]=", ".join (
                        part for part in [primary_city ,primary_country ]if part 
                        )
                if "dates"not in context :
                    start_iso =_parse_iso (primary .get ("start_date"))
                    end_iso =_parse_iso (primary .get ("end_date"))
                    if start_iso and end_iso :
                        context ["dates"]=(
                        f"{start_iso .strftime ('%b %d')} - {end_iso .strftime ('%b %d, %Y')}"
                        )
                property_title =_normalise (prop .get ("title"))
                if property_title :
                    context ["property_name"]=property_title 

        if preferences :
            if preferences .budget :
                context ["budget"]=preferences .budget 
            if preferences .interests :
                context ["interests"]=preferences .interests 
            if preferences .dietary_restrictions :
                context ["dietary_restrictions"]=preferences .dietary_restrictions 
            if preferences .mobility_needs :
                context ["mobility_needs"]=preferences .mobility_needs 

        return context 
