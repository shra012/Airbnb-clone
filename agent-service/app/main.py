"""FastAPI application entrypoint."""

from __future__ import annotations

import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import concierge_router

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Instantiate the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Airbnb Concierge Service",
        version="0.0.1",
        description=(
            "Microservice that orchestrates itinerary planning with LLMs and external APIs."
        ),
    )

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True,
        )

    @app.middleware("http")
    async def add_correlation_id(request: Request, call_next):
        correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.correlation_id = correlation_id

        response = await call_next(request)
        response.headers["x-request-id"] = correlation_id
        return response

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        correlation_id = getattr(request.state, "correlation_id", str(uuid.uuid4()))
        logger.exception(
            "Unhandled error [correlation_id=%s]", correlation_id, exc_info=exc
        )
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "correlation_id": correlation_id,
            },
        )

    @app.get("/health", tags=["system"])
    async def health_check() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(concierge_router, prefix="/api/agent")

    return app


app = create_app()
