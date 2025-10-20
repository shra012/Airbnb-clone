"""Endpoints for the concierge planning workflow."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from ..exceptions import (
    ConciergeConfigurationError,
    ConciergePlanningError,
    RateLimitExceededError,
)
from ..schemas.concierge import ConciergeRequest, ConciergeResponse
from ..services.concierge_planner import ConciergePlanner
from ..utils import SlidingWindowRateLimiter

planner = ConciergePlanner()
rate_limiter = SlidingWindowRateLimiter(max_requests=20, window_seconds=60)

router = APIRouter(tags=["concierge"])


@router.post(
    "/concierge",
    response_model=ConciergeResponse,
    status_code=status.HTTP_200_OK,
    summary="Plan itinerary with AI concierge",
)
async def run_concierge_workflow(
    payload: ConciergeRequest,
    http_request: Request,
) -> ConciergeResponse:
    """Trigger the concierge planning workflow."""

    def _detail(message: str) -> dict[str, str]:
        detail = {"message": message}
        correlation_id = getattr(http_request.state, "correlation_id", None)
        if correlation_id:
            detail["correlation_id"] = correlation_id
        return detail

    try:
        rate_limiter.check()
        return await planner.generate(payload)
    except RateLimitExceededError as exc:
        headers = {"Retry-After": f"{int(exc.retry_after) or 1}"}
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=_detail(str(exc)),
            headers=headers,
        ) from exc
    except ConciergeConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_detail(str(exc)),
        ) from exc
    except ConciergePlanningError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=_detail(str(exc)),
        ) from exc
