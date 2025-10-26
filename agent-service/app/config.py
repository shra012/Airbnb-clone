"""Runtime configuration for the agent service."""

from __future__ import annotations 

from functools import lru_cache 
from pathlib import Path 
from typing import List 

from pydantic import field_validator 
from pydantic_settings import BaseSettings ,SettingsConfigDict 


_ENV_FILE =Path (__file__ ).resolve ().parent .parent /".env"


class Settings (BaseSettings ):
    """Application settings loaded from environment variables and .env file."""

    model_config =SettingsConfigDict (
    env_file =_ENV_FILE ,
    env_file_encoding ="utf-8",
    extra ="ignore",
    )

    environment :str ="development"

    openai_api_key :str |None =None 
    openai_model_name :str ="gpt-4o-mini"

    database_url :str |None =None 
    supabase_url :str |None =None 
    supabase_service_role_key :str |None =None 

    tavily_api_key :str |None =None 
    tavily_enabled :bool =False 
    weather_api_key :str |None =None 

    show_trip_insights :bool =True 

    langsmith_api_key :str |None =None 
    langsmith_project :str |None =None 
    langsmith_api_url :str |None =None 

    anthropic_api_key :str |None =None 
    anthropic_model_name :str ="claude-3-sonnet-20240229"

    agent_service_port :int =8000 

    cors_origins :List [str ]=[]

    @field_validator ("cors_origins",mode ="before")
    @classmethod 
    def split_csv_origins (cls ,value :str |List [str ]|None )->List [str ]:
        """Ensure comma-separated strings are normalised into lists."""
        if value is None :
            return []
        if isinstance (value ,list ):
            return value 
        return [origin .strip ()for origin in value .split (",")if origin .strip ()]


@lru_cache (maxsize =1 )
def get_settings ()->Settings :
    """Return cached application settings."""
    return Settings ()
