"""Weather forecast helper."""

from __future__ import annotations

import logging
from collections import Counter, defaultdict
from datetime import datetime
from typing import Any, Dict, List

import httpx

from ..config import get_settings

logger = logging.getLogger(__name__)


class WeatherForecastClient:
    """Fetch multi-day forecast information for the destination city using free OpenWeather endpoints."""

    def __init__(self) -> None:
        settings = get_settings()
        self._api_key = settings.weather_api_key

    @property
    def enabled(self) -> bool:
        return bool(self._api_key)

    async def fetch_forecast(self, query: str) -> Dict[str, Any]:
        """Return current conditions and a compact daily summary using free OpenWeather APIs."""
        if not self._api_key:
            return {}

        geo = await self._geocode(query)
        if not geo:
            return {}

        lat = geo["lat"]
        lon = geo["lon"]

        async with httpx.AsyncClient(timeout=10.0) as client:
            current = await self._fetch_current(client, lat, lon)
            forecast = await self._fetch_forecast(client, lat, lon)

        return {
            "location": {
                "name": geo["name"],
                "country": geo["country"],
                "lat": lat,
                "lon": lon,
            },
            "forecast": forecast,
            "headline": current,
            "provider": "openweather-free",
        }

    async def _geocode(self, query: str) -> Dict[str, Any] | None:
        geo_url = "http://api.openweathermap.org/geo/1.0/direct"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    geo_url,
                    params={"q": query, "limit": 1, "appid": self._api_key},
                )
                response.raise_for_status()
            except httpx.HTTPError as exc:
                logger.warning("OpenWeather geocode failed: %s", exc)
                return None

        data = response.json()
        if not data:
            logger.warning("OpenWeather geocode returned no results for query=%s", query)
            return None

        entry = data[0]
        lat = entry.get("lat")
        lon = entry.get("lon")
        if lat is None or lon is None:
            logger.warning("OpenWeather geocode missing coordinates for query=%s", query)
            return None

        return {
            "lat": lat,
            "lon": lon,
            "name": entry.get("name"),
            "country": entry.get("country"),
            "state": entry.get("state"),
        }

    async def _fetch_current(self, client: httpx.AsyncClient, lat: float, lon: float) -> Dict[str, Any]:
        current_url = "https://api.openweathermap.org/data/2.5/weather"
        try:
            response = await client.get(
                current_url,
                params={"lat": lat, "lon": lon, "units": "metric", "appid": self._api_key},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("OpenWeather current weather failed: %s", exc)
            return {}
        return response.json()

    async def _fetch_forecast(self, client: httpx.AsyncClient, lat: float, lon: float) -> List[Dict[str, Any]]:
        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        try:
            response = await client.get(
                forecast_url,
                params={"lat": lat, "lon": lon, "units": "metric", "appid": self._api_key},
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.warning("OpenWeather forecast failed: %s", exc)
            return []

        data = response.json()
        items = data.get("list", [])
        if not items:
            return []

        daily = defaultdict(lambda: {"temp_min": float("inf"), "temp_max": float("-inf"), "pop": 0.0, "desc": Counter(), "wind": []})

        for item in items:
            dt = item.get("dt")
            if dt is None:
                continue
            date = datetime.utcfromtimestamp(dt).date().isoformat()
            main = item.get("main") or {}
            weather = item.get("weather") or []
            pop = item.get("pop", 0.0)
            wind = item.get("wind", {}).get("speed")

            entry = daily[date]
            temp_min = main.get("temp_min")
            temp_max = main.get("temp_max")
            if temp_min is not None:
                entry["temp_min"] = min(entry["temp_min"], temp_min)
            if temp_max is not None:
                entry["temp_max"] = max(entry["temp_max"], temp_max)
            entry["pop"] = max(entry["pop"], pop or 0.0)
            if wind is not None:
                entry["wind"].append(wind)
            if weather:
                desc = weather[0].get("description") or ""
                if desc:
                    entry["desc"][desc] += 1

        forecast_summary: List[Dict[str, Any]] = []
        for date in sorted(daily.keys()):
            entry = daily[date]
            desc = entry["desc"].most_common(1)[0][0] if entry["desc"] else ""
            avg_wind = sum(entry["wind"]) / len(entry["wind"]) if entry["wind"] else None
            forecast_summary.append(
                {
                    "date": date,
                    "temp_min": entry["temp_min"] if entry["temp_min"] != float("inf") else None,
                    "temp_max": entry["temp_max"] if entry["temp_max"] != float("-inf") else None,
                    "summary": desc,
                    "precip_probability": round(entry["pop"], 2),
                    "wind_speed_avg": round(avg_wind, 2) if avg_wind is not None else None,
                }
            )

        return forecast_summary[:5]
