import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router, load_one_click_demo
from app.services.demo_service import demo_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("airguard.main")

def init_app_state():
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample-data")
    try:
        demo_service.create_sample_files(sample_dir)
        logger.info(f"Sample datasets verified in {sample_dir}")
    except Exception as e:
        logger.warning(f"Could not write sample files: {e}")

    try:
        load_one_click_demo()
        logger.info("Initial demo dataset and intelligence models initialized.")
    except Exception as e:
        logger.warning(f"Demo auto-load error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing AirGuard AI Engine...")
    init_app_state()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AirGuard AI: Advanced Environmental Intelligence and Civic Intervention Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
