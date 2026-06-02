from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .config import settings
from .news_provider import active_providers
from .routers import auth_routes, watchlist_routes, stock_routes


Base.metadata.create_all(bind=engine)

app = FastAPI(title="MarketPulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(watchlist_routes.router)
app.include_router(stock_routes.router)


@app.get("/health")
def health():
    return {"status": "ok", "news_providers": active_providers()}
