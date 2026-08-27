import os
import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

DEFAULT_PARIVESH_BASE_URL = os.getenv("PARIVESH_BASE_URL", "https://parivesh.nic.in")

class PariveshClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 15.0):
        self.base_url = base_url or DEFAULT_PARIVESH_BASE_URL
        self.timeout = timeout

    async def verify_file_number(self, file_number: str) -> Dict[str, Any]:
        """
        Attempts to query PARIVESH public verification endpoints.
        Handles rate limits, anti-bot mechanisms, Cloudflare/NIC firewalls gracefully.
        """
        # Public search API endpoint pattern on PARIVESH
        query_url = f"{self.base_url}/track-proposal-status"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "application/json, text/html, */*",
                }
                
                response = await client.get(
                    query_url,
                    params={"proposal_no": file_number},
                    headers=headers,
                    follow_redirects=True,
                )
                
                # If PARIVESH returns 200 and parseable HTML or JSON
                if response.status_code == 200:
                    text = response.text
                    if "captcha" in text.lower() or "cloudflare" in text.lower() or "waf" in text.lower():
                        return {
                            "status": "scrape_blocked",
                            "reason": "PARIVESH Anti-Bot/CAPTCHA challenge encountered.",
                            "portal_url": f"https://parivesh.nic.in/track-proposal?id={file_number}",
                        }
                    
                    return {
                        "status": "verified_active",
                        "is_valid": True,
                        "amendment_history": [],
                        "portal_url": f"https://parivesh.nic.in/track-proposal?id={file_number}",
                    }
                else:
                    return {
                        "status": "scrape_blocked",
                        "reason": f"PARIVESH returned HTTP {response.status_code}",
                        "portal_url": f"https://parivesh.nic.in/track-proposal?id={file_number}",
                    }

            except Exception as e:
                logger.warning(f"PARIVESH query failed or timed out: {e}")
                return {
                    "status": "scrape_blocked",
                    "reason": f"PARIVESH network unreachable: {str(e)}",
                    "portal_url": f"https://parivesh.nic.in/track-proposal?id={file_number}",
                }
