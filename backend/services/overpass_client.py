import os
import json
import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

DEFAULT_OVERPASS_URL = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")

class OverpassClient:
    def __init__(self, endpoint_url: Optional[str] = None, timeout: float = 25.0):
        self.endpoint_url = endpoint_url or DEFAULT_OVERPASS_URL
        self.timeout = timeout

    async def query_waterbodies(
        self,
        lat: float,
        lon: float,
        radius_meters: int = 2500,
        water_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Query Overpass API for water features around the given coordinates.
        Features searched: waterways (river, stream, canal, drain) and natural=water / waterbody polygons.
        """
        # Overpass QL query around (lat, lon) within radius
        query = f"""
        [out:json][timeout:25];
        (
          way["waterway"~"river|stream|canal|drain"](around:{radius_meters},{lat},{lon});
          relation["waterway"~"river|stream|canal|drain"](around:{radius_meters},{lat},{lon});
          way["natural"="water"](around:{radius_meters},{lat},{lon});
          relation["natural"="water"](around:{radius_meters},{lat},{lon});
          way["water"~"river|lake|reservoir|canal|pond"](around:{radius_meters},{lat},{lon});
          relation["water"~"river|lake|reservoir|canal|pond"](around:{radius_meters},{lat},{lon});
        );
        out body geom;
        """
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    self.endpoint_url,
                    data={"data": query},
                    headers={"User-Agent": "GreenTrace-MVP/1.0 (Environmental-Compliance-Research)"},
                )
                response.raise_for_status()
                data = response.json()
                return data
            except Exception as e:
                logger.warning(f"Overpass API query failed or timed out: {e}")
                # Return empty element structure rather than crashing
                return {"elements": [], "error": str(e)}
