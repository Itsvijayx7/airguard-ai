"""
AirGuard AI - Main FastAPI Application Entrypoint.

Configures application lifespan, compression middleware, CORS, routing,
and deterministic environmental intelligence demonstration datasets.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.routes import router, load_one_click_demo
from app.services.demo_service import demo_service

# Structured logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("airguard.main")


def init_app_state() -> None:
    """Initialize application directories and seed initial demo data."""
    sample_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "sample-data",
    )
    try:
        demo_service.create_sample_files(sample_dir)
        logger.info("Sample datasets verified in %s", sample_dir)
    except Exception as exc:
        logger.warning("Could not write sample files: %s", exc)

    try:
        load_one_click_demo()
        logger.info("Initial demo dataset and intelligence models initialized.")
    except Exception as exc:
        logger.warning("Demo auto-load error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown lifecycle."""
    logger.info("Initializing AirGuard AI Engine...")
    init_app_state()
    yield
    logger.info("AirGuard AI Engine gracefully terminated.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AirGuard AI: Advanced Environmental Intelligence and Civic Intervention Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Compression Middleware: Drastically improves API efficiency by compressing JSON payloads > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Cross-Origin Resource Sharing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_performance_and_security_headers(request: Request, call_next):
    """Inject security, timing, and caching headers into responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Capture unhandled exceptions with structured logging."""
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error_type": exc.__class__.__name__,
            "path": request.url.path,
        },
    )


app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
