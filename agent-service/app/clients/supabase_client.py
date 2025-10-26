"""Supabase client helper for POI and event data."""

from __future__ import annotations 

import asyncio 
import logging
from datetime import date, datetime 
from decimal import Decimal
from typing import Any ,Dict ,List 
from urllib.parse import urlparse, parse_qs

import asyncpg

from ..config import get_settings 

logger =logging .getLogger (__name__ )


def _convert_to_json_serializable(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert non-JSON-serializable types (Decimal, datetime, date) to serializable formats."""
    result = {}
    for k, v in data.items():
        if isinstance(v, Decimal):
            result[k] = float(v)
        elif isinstance(v, datetime):
            result[k] = v.isoformat()
        elif isinstance(v, date):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result


class SupabaseContextClient :
    """Fetch points of interest and events from Supabase PostgreSQL database."""

    def __init__ (self )->None :
        settings =get_settings ()
        self._pool = None
        self._pool_lock = asyncio.Lock()
        
        # Use DATABASE_URL from settings (loaded from .env)
        self._database_url = settings.database_url
        
        # If not available, try supabase_url (if it's a postgres URL)
        if not self._database_url and settings.supabase_url:
            if settings.supabase_url.startswith(('postgres', 'postgresql')):
                self._database_url = settings.supabase_url
            else:
                logger.warning("SUPABASE_URL should be a PostgreSQL connection string, not an API URL")
    
    async def _get_pool(self):
        """Lazy initialization of connection pool with thread safety."""
        if self._pool is not None:
            return self._pool
            
        async with self._pool_lock:
            # Double-check after acquiring lock
            if self._pool is not None:
                return self._pool
                
            if not self._database_url:
                return None
                
            try:
                # Parse the URL and clean it up for asyncpg
                url = self._database_url.replace('postgresql://', 'postgres://')
                # Remove pgbouncer parameter as it's not needed for asyncpg
                if '?pgbouncer=true' in url:
                    url = url.replace('?pgbouncer=true', '')
                # Disable statement cache for pgbouncer compatibility
                self._pool = await asyncpg.create_pool(
                    url, 
                    min_size=1, 
                    max_size=10,
                    statement_cache_size=0  # Disable for pgbouncer
                )
                logger.info("PostgreSQL connection pool created")
            except Exception as e:
                logger.error(f"Failed to create PostgreSQL pool: {e}")
                self._pool = None
        return self._pool
    
    @property 
    def enabled (self )->bool :
        return self._database_url is not None 

    async def fetch_pois (
    self ,
    city :str |None ,
    country :str |None ,
    limit :int =15 ,
    )->List [Dict [str ,Any ]]:
        pool = await self._get_pool()
        if not pool:
            return []

        try:
            query = 'SELECT id, title, description, location, tags FROM "PointOfInterest"'
            conditions = []
            params = []
            
            if city:
                conditions.append(f'location ILIKE ${len(params) + 1}')
                params.append(f'%{city}%')
            if country:
                conditions.append(f'location ILIKE ${len(params) + 1}')
                params.append(f'%{country}%')
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
            
            query += f' LIMIT ${len(params) + 1}'
            params.append(limit)
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return [_convert_to_json_serializable(dict(row)) for row in rows]
        except Exception as exc:
            logger.warning("PostgreSQL POI query failed: %s", exc)
            return []

    async def fetch_events (
    self ,
    city :str |None ,
    country :str |None ,
    start_date :str |None ,
    end_date :str |None ,
    limit :int =15 ,
    )->List [Dict [str ,Any ]]:
        pool = await self._get_pool()
        if not pool:
            return []

        try:
            query = '''SELECT id, title, description, start_date as "startDate", end_date as "endDate", 
                       tags, price_tier as "priceTier", location 
                       FROM "LocalEvent"'''
            conditions = []
            params = []
            
            if city:


                conditions.append(f'location ILIKE ${len(params) + 1}')
                params.append(f'%{city}%')
            if country:
                conditions.append(f'location ILIKE ${len(params) + 1}')
                params.append(f'%{country}%')
            if start_date:
                # Convert string date to date object
                date_obj = datetime.strptime(start_date, '%Y-%m-%d').date() if isinstance(start_date, str) else start_date
                conditions.append(f'end_date >= ${len(params) + 1}')
                params.append(date_obj)
            if end_date:
                # Convert string date to date object
                date_obj = datetime.strptime(end_date, '%Y-%m-%d').date() if isinstance(end_date, str) else end_date
                conditions.append(f'start_date <= ${len(params) + 1}')
                params.append(date_obj)
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
            
            query += f' LIMIT ${len(params) + 1}'
            params.append(limit)
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                return [_convert_to_json_serializable(dict(row)) for row in rows]
        except Exception as exc:
            logger.warning("PostgreSQL events query failed: %s", exc)
            return []

    async def fetch_traveler_bookings (
    self ,
    traveler_id :int ,
    limit :int =5 ,
    )->List [Dict [str ,Any ]]:
        """Return a traveller's recent bookings enriched with property metadata."""
        pool = await self._get_pool()
        if not pool:
            return []

        try:
            # Join bookings with properties to get enriched data
            query = '''
                SELECT 
                    b.id, b.status, b.start_date as "startDate", b.end_date as "endDate", b.guests, 
                    b.created_at as "createdAt", b.updated_at as "updatedAt",
                    p.id as "property_id", p.title as "property_title", 
                    p.city as "property_city", p.country as "property_country",
                    p.state as "property_state", p.property_type as "property_type",
                    p.max_guests as "property_max_guests"
                FROM "Booking" b
                LEFT JOIN "Property" p ON b.property_id = p.id
                WHERE b.traveler_id = $1
                ORDER BY b.start_date ASC
                LIMIT $2
            '''
            
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, traveler_id, limit)
                
                # Transform the flat rows into nested structure
                enriched = []
                for row in rows:
                    row_dict = dict(row)
                    booking = {
                        'id': row_dict['id'],
                        'status': row_dict['status'],
                        'startDate': row_dict['startDate'],
                        'endDate': row_dict['endDate'],
                        'guests': row_dict['guests'],
                        'createdAt': row_dict['createdAt'],
                        'updatedAt': row_dict['updatedAt'],
                    }
                    
                    if row_dict.get('property_id'):
                        booking['property'] = {
                            'id': row_dict['property_id'],
                            'title': row_dict['property_title'],
                            'city': row_dict['property_city'],
                            'country': row_dict['property_country'],
                            'state': row_dict['property_state'],
                            'propertyType': row_dict['property_type'],
                            'maxGuests': row_dict['property_max_guests'],
                        }
                    
                    enriched.append(booking)
                
                # Convert datetime fields to ISO format strings
                return [_convert_to_json_serializable(b) for b in enriched]
        except Exception as exc:
            logger.warning("PostgreSQL bookings query failed: %s", exc)
            return [] 

    async def fetch_properties (
    self ,
    city :str |None ,
    country :str |None ,
    property_type :str |None =None ,
    limit :int =15 ,
    )->List [Dict [str ,Any ]]:
        """Search for properties by location and type."""
        pool = await self._get_pool()
        if not pool:
            logger.warning("fetch_properties: No connection pool available")
            return []

        try:
            query = '''SELECT id, title, description, city, country, state, 
                       property_type as "propertyType", bedrooms, bathrooms, max_guests as "maxGuests", 
                       price_per_night as "pricePerNight"
                       FROM "Property"'''
            conditions = []
            params = []
            
            if city:
                conditions.append(f'city ILIKE ${len(params) + 1}')
                params.append(f'%{city}%')
            if country:
                conditions.append(f'country ILIKE ${len(params) + 1}')
                params.append(f'%{country}%')
            if property_type:
                conditions.append(f'property_type ILIKE ${len(params) + 1}')
                params.append(f'%{property_type}%')
            
            if conditions:
                query += ' WHERE ' + ' AND '.join(conditions)
            
            query += f' LIMIT ${len(params) + 1}'
            params.append(limit)
            
            logger.info(f"Executing properties query with city={city}, country={country}")
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, *params)
                logger.info(f"Properties query returned {len(rows)} rows")
                return [_convert_to_json_serializable(dict(row)) for row in rows]
        except Exception as exc:
            logger.warning("PostgreSQL properties query failed: %s", exc)
            return []

    async def fetch_favorite_properties(
        self,
        traveler_id: int,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Fetch a traveler's favorite/saved properties with property details.
        
        Args:
            traveler_id: The ID of the traveler
            limit: Maximum number of favorites to return
            
        Returns:
            List of favorite properties with full property details and when they were favorited
        """
        pool = await self._get_pool()
        if not pool:
            logger.warning("fetch_favorite_properties: No connection pool available")
            return []

        try:
            query = '''
                SELECT 
                    f.id as favorite_id,
                    f.created_at as favorited_at,
                    p.id as property_id,
                    p.title,
                    p.description,
                    p.city,
                    p.country,
                    p.state,
                    p.property_type,
                    p.bedrooms,
                    p.bathrooms,
                    p.max_guests,
                    p.price_per_night
                FROM "Favorite" f
                INNER JOIN "Property" p ON f.property_id = p.id
                WHERE f.traveler_id = $1
                ORDER BY f.created_at DESC
                LIMIT $2
            '''
            
            logger.info(f"Fetching favorites for traveler_id={traveler_id}, limit={limit}")
            async with pool.acquire() as conn:
                rows = await conn.fetch(query, traveler_id, limit)
                logger.info(f"Favorites query returned {len(rows)} rows")
                
                # Convert to dictionaries and format the response
                favorites = []
                for row in rows:
                    row_dict = dict(row)
                    favorite = {
                        'favorite_id': row_dict['favorite_id'],
                        'favorited_at': row_dict['favorited_at'],
                        'property': {
                            'id': row_dict['property_id'],
                            'title': row_dict['title'],
                            'description': row_dict['description'],
                            'city': row_dict['city'],
                            'country': row_dict['country'],
                            'state': row_dict['state'],
                            'propertyType': row_dict['property_type'],
                            'bedrooms': row_dict['bedrooms'],
                            'bathrooms': row_dict['bathrooms'],
                            'maxGuests': row_dict['max_guests'],
                            'pricePerNight': row_dict['price_per_night'],
                        }
                    }
                    favorites.append(favorite)
                
                return [_convert_to_json_serializable(fav) for fav in favorites]
        except Exception as exc:
            logger.warning("PostgreSQL favorites query failed: %s", exc)
            return []

