"""Supabase MCP-style tools for the AI agent."""

from __future__ import annotations 

import logging 
from typing import Any ,Dict ,List ,Optional 

from langchain_core .tools import tool 

from ..clients .supabase_client import SupabaseContextClient 

logger =logging .getLogger (__name__ )


@tool 
async def search_properties (
city :Optional [str ]=None ,
country :Optional [str ]=None ,
state :Optional [str ]=None ,
property_type :Optional [str ]=None ,
min_price :Optional [float ]=None ,
max_price :Optional [float ]=None ,
bedrooms :Optional [int ]=None ,
limit :int =10 ,
)->List [Dict [str ,Any ]]:
    """Search for available properties (hotels, apartments, villas, etc.) in the booking system.
    
    Use this tool when users ask about:
    - Finding hotels, apartments, or other accommodations
    - Properties in a specific location (city, state, or country)
    - Accommodation options with specific features (bedrooms, price range)
    - Available places to stay
    
    Args:
        city: City name to search in (e.g., "San Jose", "New York")
        country: Country name or code (e.g., "USA", "Portugal")
        state: State or province name (e.g., "California", "CA")
        property_type: Type of property (e.g., "hotel", "apartment", "villa", "house")
        min_price: Minimum price per night
        max_price: Maximum price per night
        bedrooms: Number of bedrooms required
        limit: Maximum number of results to return (default 10)
    
    Returns:
        List of properties with details including title, location, price, amenities
    """
    client =SupabaseContextClient ()
    if not client .enabled :
        logger .warning ("Supabase client not enabled")
        return []

    try :
        properties =await client .fetch_properties (
        city =city ,
        country =country ,
        property_type =property_type ,
        limit =limit 
        )


        filtered =properties 
        if state :
            filtered =[p for p in filtered if p .get ("state","").lower ()==state .lower ()]
        if min_price is not None :
            filtered =[p for p in filtered if p .get ("price_per_night",0 )>=min_price ]
        if max_price is not None :
            filtered =[p for p in filtered if p .get ("price_per_night",float ("inf"))<=max_price ]
        if bedrooms is not None :
            filtered =[p for p in filtered if p .get ("bedrooms",0 )>=bedrooms ]

        return filtered [:limit ]
    except Exception as e :
        logger .error (f"Error searching properties: {e }")
        return []


@tool 
async def search_points_of_interest (
city :Optional [str ]=None ,
country :Optional [str ]=None ,
category :Optional [str ]=None ,
limit :int =15 ,
)->List [Dict [str ,Any ]]:
    """Search for points of interest (POIs) like restaurants, attractions, and activities.
    
    Use this tool when users ask about:
    - Things to do in a location
    - Restaurants or places to eat
    - Tourist attractions or landmarks
    - Activities or entertainment options
    - Shopping, nightlife, or local experiences
    
    Args:
        city: City name to search in
        country: Country name or code
        category: Type of POI (e.g., "restaurant", "museum", "park", "shopping", "nightlife")
        limit: Maximum number of results to return (default 15)
    
    Returns:
        List of POIs with details including name, description, category, address, price range
    """
    client =SupabaseContextClient ()
    if not client .enabled :
        logger .warning ("Supabase client not enabled")
        return []

    try :
        pois =await client .fetch_pois (city =city ,country =country ,limit =limit )


        if category :
            pois =[
            poi for poi in pois 
            if category .lower ()in poi .get ("category","").lower ()
            ]

        return pois [:limit ]
    except Exception as e :
        logger .error (f"Error searching POIs: {e }")
        return []


@tool 
async def search_events (
city :Optional [str ]=None ,
country :Optional [str ]=None ,
start_date :Optional [str ]=None ,
end_date :Optional [str ]=None ,
category :Optional [str ]=None ,
limit :int =15 ,
)->List [Dict [str ,Any ]]:
    """Search for local events happening during a specific time period.
    
    Use this tool when users ask about:
    - Events or festivals in a location
    - Things happening during their trip dates
    - Concerts, sports, or cultural events
    - Special occasions or celebrations
    
    Args:
        city: City name to search in
        country: Country name or code
        start_date: Start date in YYYY-MM-DD format (events ending on or after this date)
        end_date: End date in YYYY-MM-DD format (events starting on or before this date)
        category: Type of event (e.g., "concert", "sports", "festival", "cultural")
        limit: Maximum number of results to return (default 15)
    
    Returns:
        List of events with details including name, description, dates, venue, ticket price
    """
    client =SupabaseContextClient ()
    if not client .enabled :
        logger .warning ("Supabase client not enabled")
        return []

    try :
        events =await client .fetch_events (
        city =city ,
        country =country ,
        start_date =start_date ,
        end_date =end_date ,
        limit =limit 
        )


        if category :
            events =[
            event for event in events 
            if category .lower ()in event .get ("category","").lower ()
            ]

        return events [:limit ]
    except Exception as e :
        logger .error (f"Error searching events: {e }")
        return []


@tool 
async def get_traveler_bookings (
traveler_id :int ,
limit :int =5 ,
)->List [Dict [str ,Any ]]:
    """Get the traveler's booking history with property details.
    
    Use this tool when:
    - Users ask about their bookings or reservations
    - Need to reference past or upcoming trips
    - Building personalized recommendations based on travel history
    
    Args:
        traveler_id: The ID of the traveler
        limit: Maximum number of bookings to return (default 5)
    
    Returns:
        List of bookings with property details, dates, status, and guest count
    """
    client =SupabaseContextClient ()
    if not client .enabled :
        logger .warning ("Supabase client not enabled")
        return []

    try :
        return await client .fetch_traveler_bookings (
        traveler_id =traveler_id ,
        limit =limit 
        )
    except Exception as e :
        logger .error (f"Error fetching traveler bookings: {e }")
        return []


@tool
async def get_favorite_properties(
    traveler_id: int,
    limit: int = 10,
) -> List[Dict[str, Any]]:
    """Get the traveler's favorite/saved properties (wishlist).
    
    Use this tool when users ask about:
    - Their favorite properties or saved stays
    - Their wishlist or saved places
    - Properties they liked or bookmarked
    - Places they want to visit or stay at later
    
    Args:
        traveler_id: The ID of the traveler
        limit: Maximum number of favorites to return (default 10)
    
    Returns:
        List of favorite properties with full details including title, location, price, 
        amenities, and when it was favorited
    """
    client = SupabaseContextClient()
    if not client.enabled:
        logger.warning("Supabase client not enabled")
        return []

    try:
        return await client.fetch_favorite_properties(
            traveler_id=traveler_id,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Error fetching favorite properties: {e}")
        return []


def get_supabase_tools ()->List :
    """Return all Supabase MCP tools for the agent."""
    return [
    search_properties ,
    search_points_of_interest ,
    search_events ,
    get_traveler_bookings ,
    get_favorite_properties,
    ]

