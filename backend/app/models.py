from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Date, Text, ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    watchlist = relationship("WatchlistItem", back_populates="user", cascade="all, delete-orphan")


class WatchlistItem(Base):
    __tablename__ = "watchlist"
    # A user can't add the same ticker twice.
    __table_args__ = (UniqueConstraint("user_id", "ticker", name="uq_user_ticker"),)

    watchlist_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    ticker = Column(String(12), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(120), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="watchlist")


class NewsArticle(Base):
    __tablename__ = "news_articles"
    # Same article (same url) shouldn't be stored twice for a ticker.
    __table_args__ = (UniqueConstraint("ticker", "url", name="uq_ticker_url"),)

    article_id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(12), nullable=False, index=True)
    title = Column(Text, nullable=False)
    source = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True)
    url = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=False, default=0.0)
    sentiment_label = Column(String(12), nullable=False, default="neutral")
    created_at = Column(DateTime, default=datetime.utcnow)


# One row per ticker per day - powers the trend chart.
class SentimentHistory(Base):
    __tablename__ = "sentiment_history"
    __table_args__ = (UniqueConstraint("ticker", "date", name="uq_ticker_date"),)

    history_id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(12), nullable=False, index=True)
    date = Column(Date, nullable=False, default=date.today)
    avg_sentiment = Column(Float, nullable=False, default=0.0)
    positive_count = Column(Integer, nullable=False, default=0)
    neutral_count = Column(Integer, nullable=False, default=0)
    negative_count = Column(Integer, nullable=False, default=0)
