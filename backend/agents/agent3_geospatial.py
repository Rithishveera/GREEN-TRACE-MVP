import math
import logging
from typing import Any, Dict, List, Optional, cast
from datetime import datetime, timezone
from shapely.geometry import mapping, LineString, Polygon, Point
from shapely.geometry.base import BaseGeometry
from shapely.ops import transform, unary_union
import pyproj

try:
    from models.schemas import AgentResult, Agent3Data, EvidenceItem
    from services.overpass_client import OverpassClient
except (ImportError, ModuleNotFoundError):
    from backend.models.schemas import AgentResult, Agent3Data, EvidenceItem  # type: ignore
    from backend.services.overpass_client import OverpassClient  # type: ignore

logger = logging.getLogger(__name__)


def get_utm_epsg(lat: float, lon: float) -> int:
    """Calculate the EPSG code for the appropriate UTM zone."""
    zone = int(math.floor((lon + 180) / 6) + 1)
    if lat >= 0:
        return 32600 + zone
    else:
        return 32700 + zone


def project_geometry(geom: BaseGeometry, from_epsg: int, to_epsg: int) -> BaseGeometry:
    """Project a shapely geometry between EPSG coordinate reference systems."""
    project = pyproj.Transformer.from_crs(
        pyproj.CRS(f"EPSG:{from_epsg}"),
        pyproj.CRS(f"EPSG:{to_epsg}"),
        always_xy=True,
    ).transform
    result: BaseGeometry = cast(BaseGeometry, transform(project, geom))
    return result


async def run_agent3_geospatial(
    lat: float,
    lon: float,
    buffer_distance_m: float = 100.0,
    waterbody_target: str = "river",
    overpass_client: Optional[OverpassClient] = None,
) -> AgentResult:
    """
    Agent 3 — Geospatial Scout:
    Queries Overpass API for waterbody geometry around the EC site coordinates.
    Applies exact UTM metric buffering (e.g. 100m) per EC mandate.
    """
    client = overpass_client or OverpassClient()
    timestamp = datetime.now(timezone.utc).isoformat()
    warnings: List[str] = []
    evidence: List[EvidenceItem] = []
    
    # 1. Query Overpass API
    raw_overpass = await client.query_waterbodies(lat=lat, lon=lon, radius_meters=3000, water_type=waterbody_target)
    elements = raw_overpass.get("elements", [])
    
    geometries = []
    waterbody_names = set()
    
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name")
        if name:
            waterbody_names.add(name)
            
        geom_points = el.get("geometry", [])
        if len(geom_points) >= 2:
            try:
                coords = [(float(pt["lon"]), float(pt["lat"])) for pt in geom_points]
                if len(coords) >= 4 and coords[0] == coords[-1]:
                    poly = Polygon(coords)
                    if not poly.is_valid:
                        from shapely.validation import make_valid
                        poly = make_valid(poly)
                    geometries.append(poly)
                else:
                    line = LineString(coords)
                    if not line.is_valid:
                        from shapely.validation import make_valid
                        line = make_valid(line)
                    geometries.append(line)
            except Exception as geom_err:
                logger.debug(f"Skipping invalid OSM element geometry: {geom_err}")

    utm_epsg = get_utm_epsg(lat, lon)
    
    if geometries:
        waterbody_found = True
        combined_geom = unary_union(geometries)
        
        # Project to UTM for metric buffering
        geom_utm = project_geometry(combined_geom, from_epsg=4326, to_epsg=utm_epsg)
        buffered_utm = geom_utm.buffer(buffer_distance_m)
        
        # Reproject back to WGS84
        buffered_wgs84 = project_geometry(buffered_utm, from_epsg=utm_epsg, to_epsg=4326)
        
        raw_geojson = mapping(combined_geom)
        buffered_geojson = mapping(buffered_wgs84)
        bounds = buffered_wgs84.bounds  # (minx, miny, maxx, maxy) -> (min_lon, min_lat, max_lon, max_lat)
        
        status = "success"
        confidence = 0.95
        wb_name_str = ", ".join(waterbody_names) if waterbody_names else f"Unnamed {waterbody_target}"
        
        evidence.append(
            EvidenceItem(
                source="Overpass API (OSM)",
                timestamp=timestamp,
                data_type="vector_geometry",
                raw_reference=f"Overpass QL around ({lat}, {lon}) r=3000m",
                confidence=0.95,
                details={
                    "osm_elements": len(elements),
                    "waterbody_names": list(waterbody_names),
                    "utm_zone": f"EPSG:{utm_epsg}",
                    "buffer_distance_m": buffer_distance_m,
                }
            )
        )
    else:
        # Fallback: create synthetic buffer around point location if no OSM waterbody returned
        waterbody_found = False
        warnings.append(
            f"No OSM waterbody elements returned near ({lat:.4f}, {lon:.4f}). Creating nominal {buffer_distance_m}m inspection zone."
        )
        point = Point(lon, lat)
        pt_utm = project_geometry(point, from_epsg=4326, to_epsg=utm_epsg)
        buffered_utm = pt_utm.buffer(buffer_distance_m * 2)  # inspect wider radius
        buffered_wgs84 = project_geometry(buffered_utm, from_epsg=utm_epsg, to_epsg=4326)
        
        raw_geojson = mapping(point)
        buffered_geojson = mapping(buffered_wgs84)
        bounds = buffered_wgs84.bounds
        wb_name_str = "Nominal Site Buffer"
        status = "flagged"
        confidence = 0.70
        
        evidence.append(
            EvidenceItem(
                source="Overpass API (OSM)",
                timestamp=timestamp,
                data_type="point_fallback",
                raw_reference=f"Point ({lat}, {lon})",
                confidence=0.70,
                details={"warning": "Zero OSM waterbody geometry returned in 3km search radius"},
            )
        )

    data = Agent3Data(
        waterbody_found=waterbody_found,
        waterbody_type=waterbody_target,
        waterbody_name=wb_name_str,
        buffer_distance_meters=buffer_distance_m,
        utm_zone=f"EPSG:{utm_epsg}",
        osm_elements_count=len(elements),
        raw_geometry_geojson=raw_geojson,
        buffered_geometry_geojson=buffered_geojson,
        bbox=list(bounds),
        notes=f"Buffer of {buffer_distance_m}m applied in UTM {utm_epsg}."
    )

    return AgentResult(
        agent="agent3_geospatial",
        status=status,
        confidence=confidence,
        data=data.model_dump(),
        evidence=evidence,
        warnings=warnings,
    )
