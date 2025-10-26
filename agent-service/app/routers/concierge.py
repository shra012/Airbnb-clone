"""Endpoints for the concierge planning workflow."""

from __future__ import annotations 

from fastapi import APIRouter ,HTTPException ,Request ,status 

from ..exceptions import (
ConciergeConfigurationError ,
ConciergePlanningError ,
RateLimitExceededError ,
)
from ..schemas .concierge import ConciergeRequest ,ConciergeResponse 
from ..services .concierge_planner import ConciergePlanner 
from ..services .context_service import ContextService
from ..utils import SlidingWindowRateLimiter 
planner =ConciergePlanner ()
context_service = ContextService()
rate_limiter =SlidingWindowRateLimiter (max_requests =20 ,window_seconds =60 )

router =APIRouter (tags =["concierge"])


def _build_detail (http_request :Request ,message :str )->dict [str ,str ]:
    detail ={"message":message }
    correlation_id =getattr (http_request .state ,"correlation_id",None )
    if correlation_id :
        detail ["correlation_id"]=correlation_id 
    return detail 


@router .post (
"/concierge",
response_model =ConciergeResponse ,
status_code =status .HTTP_200_OK ,
summary ="Plan itinerary with AI concierge",
)
async def run_concierge_workflow (
payload :ConciergeRequest ,
http_request :Request ,
)->ConciergeResponse :
    """Trigger the concierge planning workflow."""

    try :
        rate_limiter .check ()
        return await planner .generate(payload )
    except RateLimitExceededError as exc :
        headers ={"Retry-After":f"{int (exc .retry_after )or 1 }"}
        raise HTTPException (
        status_code =status .HTTP_429_TOO_MANY_REQUESTS ,
        detail =_build_detail (http_request ,str (exc )),
        headers =headers ,
        )from exc 
    except ConciergeConfigurationError as exc :
        raise HTTPException (
        status_code =status .HTTP_503_SERVICE_UNAVAILABLE ,
        detail =_build_detail (http_request ,str (exc )),
        )from exc 
    except ConciergePlanningError as exc :
        raise HTTPException (
        status_code =status .HTTP_500_INTERNAL_SERVER_ERROR ,
        detail =_build_detail (http_request ,str (exc )),
        )from exc 


@router.post(
    "/debug/context",
    status_code=status.HTTP_200_OK,
    summary="Debug: Test context building"
)
async def debug_context(payload: ConciergeRequest):
    """Debug endpoint to test context building."""
    context = await context_service.build_context(payload)
    return {
        "properties_count": len(context.properties),
        "pois_count": len(context.pois),
        "events_count": len(context.events),
        "web_results_count": len(context.tavily_results),
        "properties": context.properties[:3],
        "pois": context.pois[:3]
    }
