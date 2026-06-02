import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from scheduler import start_scheduler
from routers import health, internal, manual


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="Tidy Home Co. — Automation Backend", lifespan=lifespan)
app.include_router(health.router)
app.include_router(internal.router)
app.include_router(manual.router)
