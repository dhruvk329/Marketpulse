from datetime import datetime, timedelta

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..news_provider import fetch_news
from ..sentiment import score_text, build_summary

router = APIRouter(prefix="/stocks", tags=["stocks"])

# Don't re-fetch from the news API if we pulled this ticker in the last few hours.
CACHE_TTL = timedelta(hours=6)


def _ingest_news(db: Session, ticker: str) -> int:
    """Fetch news, score each headline, and save any we don't already have."""
    added = 0
    for art in fetch_news(ticker):
        url = art.get("url")
        # Skip articles we've already stored (matched by url).
        if url and db.query(models.NewsArticle).filter_by(ticker=ticker, url=url).first():
            continue

        scored = score_text(art["title"])
        db.add(models.NewsArticle(
            ticker=ticker,
            title=art["title"],
            source=art.get("source"),
            published_at=art.get("published_at"),
            url=url,
            sentiment_score=scored["score"],
            sentiment_label=scored["label"],
        ))
        added += 1

    db.commit()
    if added:
        _rebuild_history(db, ticker)
    return added


def _rebuild_history(db: Session, ticker: str):
    """Group all stored articles by day with Pandas to get daily averages for the chart."""
    rows = db.query(models.NewsArticle).filter_by(ticker=ticker).all()
    if not rows:
        return

    df = pd.DataFrame([{
        "date": (r.published_at or r.created_at).date(),
        "score": r.sentiment_score,
        "label": r.sentiment_label,
    } for r in rows])

    for day, group in df.groupby("date"):
        avg = round(float(group["score"].mean()), 4)
        pos = int((group["label"] == "positive").sum())
        neu = int((group["label"] == "neutral").sum())
        neg = int((group["label"] == "negative").sum())

        row = db.query(models.SentimentHistory).filter_by(ticker=ticker, date=day).first()
        if row:
            row.avg_sentiment, row.positive_count, row.neutral_count, row.negative_count = avg, pos, neu, neg
        else:
            db.add(models.SentimentHistory(
                ticker=ticker, date=day, avg_sentiment=avg,
                positive_count=pos, neutral_count=neu, negative_count=neg,
            ))
    db.commit()


def _ensure_fresh(db: Session, ticker: str):
    """Pull new news only if we have none yet or the cache has expired."""
    latest = (
        db.query(models.NewsArticle)
        .filter_by(ticker=ticker)
        .order_by(models.NewsArticle.created_at.desc())
        .first()
    )
    if latest is None or datetime.utcnow() - latest.created_at > CACHE_TTL:
        _ingest_news(db, ticker)


@router.get("/{ticker}/news", response_model=list[schemas.NewsArticleOut])
def get_news(ticker: str, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    ticker = ticker.upper()
    _ensure_fresh(db, ticker)
    return (
        db.query(models.NewsArticle)
        .filter_by(ticker=ticker)
        .order_by(models.NewsArticle.published_at.desc().nullslast())
        .limit(25)
        .all()
    )


@router.get("/{ticker}/sentiment", response_model=schemas.SentimentSummary)
def get_sentiment(ticker: str, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    ticker = ticker.upper()
    _ensure_fresh(db, ticker)

    articles = (
        db.query(models.NewsArticle)
        .filter_by(ticker=ticker)
        .order_by(models.NewsArticle.published_at.desc().nullslast())
        .all()
    )
    if not articles:
        raise HTTPException(status_code=404, detail="No news available for this ticker")

    total = len(articles)
    pos = [a for a in articles if a.sentiment_label == "positive"]
    neu = [a for a in articles if a.sentiment_label == "neutral"]
    neg = [a for a in articles if a.sentiment_label == "negative"]
    avg = sum(a.sentiment_score for a in articles) / total

    summary_input = [
        {"title": a.title, "sentiment_score": a.sentiment_score, "sentiment_label": a.sentiment_label}
        for a in articles
    ]

    return schemas.SentimentSummary(
        ticker=ticker,
        total_articles=total,
        positive_count=len(pos),
        neutral_count=len(neu),
        negative_count=len(neg),
        positive_pct=round(len(pos) / total * 100, 1),
        neutral_pct=round(len(neu) / total * 100, 1),
        negative_pct=round(len(neg) / total * 100, 1),
        avg_sentiment=round(avg, 4),
        most_positive=max(articles, key=lambda a: a.sentiment_score) if pos else None,
        most_negative=min(articles, key=lambda a: a.sentiment_score) if neg else None,
        latest=articles[:8],
        summary_text=build_summary(ticker, summary_input),
    )


@router.get("/{ticker}/history", response_model=list[schemas.SentimentHistoryOut])
def get_history(ticker: str, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    ticker = ticker.upper()
    _ensure_fresh(db, ticker)
    return (
        db.query(models.SentimentHistory)
        .filter_by(ticker=ticker)
        .order_by(models.SentimentHistory.date.asc())
        .all()
    )


# Force a fresh pull, ignoring the cache (the "Refresh news" button hits this).
@router.post("/{ticker}/refresh")
def refresh(ticker: str, db: Session = Depends(get_db), user: models.User = Depends(auth.get_current_user)):
    ticker = ticker.upper()
    added = _ingest_news(db, ticker)
    return {"ticker": ticker, "new_articles": added}
