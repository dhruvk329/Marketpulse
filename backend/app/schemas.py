from datetime import datetime, date
from typing import Optional, List

from pydantic import BaseModel, EmailStr, ConfigDict


# --- auth ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    name: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- watchlist ---
class WatchlistCreate(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    notes: Optional[str] = None


class WatchlistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    watchlist_id: int
    ticker: str
    company_name: str
    sector: Optional[str]
    notes: Optional[str]
    created_at: datetime


# --- news + sentiment ---
class NewsArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    article_id: int
    ticker: str
    title: str
    source: Optional[str]
    published_at: Optional[datetime]
    url: Optional[str]
    sentiment_score: float
    sentiment_label: str


class SentimentSummary(BaseModel):
    ticker: str
    total_articles: int
    positive_count: int
    neutral_count: int
    negative_count: int
    positive_pct: float
    neutral_pct: float
    negative_pct: float
    avg_sentiment: float
    most_positive: Optional[NewsArticleOut]
    most_negative: Optional[NewsArticleOut]
    latest: List[NewsArticleOut]
    summary_text: str


class SentimentHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    date: date
    avg_sentiment: float
    positive_count: int
    neutral_count: int
    negative_count: int
