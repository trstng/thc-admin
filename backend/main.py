import logging
from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from routers import health, manual

app = FastAPI(title="Tidy Home Co. — Automation Backend")
app.include_router(health.router)
app.include_router(manual.router)
