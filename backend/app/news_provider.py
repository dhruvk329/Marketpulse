"""
Fetches recent news headlines for a ticker.
"""
import random
import hashlib
from datetime import datetime, timedelta, timezone

import httpx

from .config import settings

TIMEOUT = 15

COMPANIES = {
    "AAPL": ("Apple Inc.", "Technology"),
    "MSFT": ("Microsoft Corporation", "Technology"),
    "NVDA": ("NVIDIA Corporation", "Technology"),
    "TSLA": ("Tesla, Inc.", "Automotive"),
    "JPM": ("JPMorgan Chase & Co.", "Financials"),
    "AMZN": ("Amazon.com, Inc.", "Consumer Cyclical"),
    "GOOGL": ("Alphabet Inc.", "Technology"),
    "META": ("Meta Platforms, Inc.", "Technology"),
    "NFLX": ("Netflix, Inc.", "Communication Services"),
    "AMD": ("Advanced Micro Devices, Inc.", "Technology"),
}


def resolve_company(ticker):
    name, sector = COMPANIES.get(ticker.upper(), (f"{ticker.upper()} Corp.", "—"))
    return {"company_name": name, "sector": sector}


def fetch_news(ticker):
    """
    Main entry point. Returns a list of raw article dicts
    (title, source, published_at, url) - sentiment is added later.
    """
    for name in _providers():
        try:
            articles = _fetch_from(name, ticker)
            if articles:
                return articles
        except Exception:
            # rate limit / bad key / network issue -> just try the next provider
            continue
    return _mock_headlines(ticker)


def active_providers():
    """Which providers actually have a key set (shown on /health). 'mock' if none."""
    return _providers() or ["mock"]


def _providers():
    """The configured providers in priority order, skipping any without a key."""
    keys = {
        "finnhub": settings.FINNHUB_API_KEY,
        "newsapi": settings.NEWSAPI_KEY,
        "alphavantage": settings.ALPHA_VANTAGE_API_KEY,
    }
    order = [p.strip().lower() for p in settings.NEWS_PROVIDER_ORDER.split(",")]
    return [p for p in order if p in keys and keys[p]]


def _fetch_from(provider, ticker):
    if provider == "finnhub":
        return _finnhub(ticker)
    if provider == "newsapi":
        return _newsapi(ticker)
    if provider == "alphavantage":
        return _alpha_vantage(ticker)
    return []


# --- the three real APIs ---

def _finnhub(ticker):
    today = datetime.now(timezone.utc).date()
    params = {
        "symbol": ticker.upper(),
        "from": (today - timedelta(days=7)).isoformat(),
        "to": today.isoformat(),
        "token": settings.FINNHUB_API_KEY,
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        r = client.get("https://finnhub.io/api/v1/company-news", params=params)
        r.raise_for_status()
        data = r.json()

    articles = []
    for item in data[:30]:
        ts = item.get("datetime")
        articles.append({
            "title": item.get("headline", ""),
            "source": item.get("source"),
            "published_at": datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None) if ts else None,
            "url": item.get("url"),
        })
    return [a for a in articles if a["title"]]


def _newsapi(ticker):
    company = resolve_company(ticker)["company_name"].split(",")[0]
    params = {
        "q": f'"{company}" OR {ticker.upper()}',  # match by name or symbol
        "from": (datetime.now(timezone.utc).date() - timedelta(days=7)).isoformat(),
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 30,
        "apiKey": settings.NEWSAPI_KEY,
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        r = client.get("https://newsapi.org/v2/everything", params=params)
        r.raise_for_status()
        data = r.json()

    if data.get("status") != "ok":
        raise RuntimeError(data.get("message", "NewsAPI error"))

    articles = []
    for item in data.get("articles", [])[:30]:
        articles.append({
            "title": item.get("title", ""),
            "source": (item.get("source") or {}).get("name"),
            "published_at": _parse_iso(item.get("publishedAt")),
            "url": item.get("url"),
        })
    return [a for a in articles if a["title"] and a["title"] != "[Removed]"]


def _alpha_vantage(ticker):
    params = {
        "function": "NEWS_SENTIMENT",
        "tickers": ticker.upper(),
        "limit": 50,
        "sort": "LATEST",
        "apikey": settings.ALPHA_VANTAGE_API_KEY,
    }
    with httpx.Client(timeout=TIMEOUT) as client:
        r = client.get("https://www.alphavantage.co/query", params=params)
        r.raise_for_status()
        data = r.json()

    # On rate limits Alpha Vantage returns a "Note"/"Information" message instead of news.
    if "feed" not in data:
        raise RuntimeError(data.get("Information") or data.get("Note") or "no feed")

    articles = []
    for item in data["feed"][:30]:
        articles.append({
            "title": item.get("title", ""),
            "source": item.get("source"),
            "published_at": _parse_av_time(item.get("time_published")),
            "url": item.get("url"),
        })
    return [a for a in articles if a["title"]]


def _parse_iso(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _parse_av_time(value):
    # Alpha Vantage uses a format like 20240115T123000
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y%m%dT%H%M%S")
    except ValueError:
        return None


# --- mock fallback (used when no API keys are configured) ---

_POSITIVE = [
    "{c} beats earnings estimates as revenue surges",
    "Analysts upgrade {c} on strong AI demand",
    "{c} shares rally to record high after upbeat guidance",
    "{c} announces expanded partnership, profit growth ahead",
    "{c} outperform: institutional investors raise stakes",
]
_NEGATIVE = [
    "{c} shares plunge after disappointing delivery report",
    "Analysts downgrade {c} amid valuation concerns",
    "{c} faces lawsuit, regulators open probe",
    "{c} misses revenue targets, warns on weak demand",
    "{c} announces layoffs as costs climb",
]
_NEUTRAL = [
    "{c} to report quarterly results next week",
    "{c} holds annual shareholder meeting",
    "{c} names new board member",
    "What investors should know about {c} this quarter",
    "{c} updates product lineup ahead of conference",
]


def _mock_headlines(ticker, n=12):
    # Seed off the ticker so the same ticker always gets the same fake news.
    seed = int(hashlib.md5(ticker.encode()).hexdigest(), 16) % (10 ** 8)
    rng = random.Random(seed)
    company = resolve_company(ticker)["company_name"].split(",")[0].split(" Inc")[0]

    templates = _POSITIVE + _NEGATIVE + _NEUTRAL
    rng.shuffle(templates)
    sources = ["Reuters", "Bloomberg", "CNBC", "MarketWatch", "The Wall Street Journal"]

    now = datetime.utcnow()
    articles = []
    for i, tpl in enumerate(templates[:n]):
        articles.append({
            "title": tpl.format(c=company),
            "source": rng.choice(sources),
            "published_at": now - timedelta(hours=i * 5 + rng.randint(0, 4)),
            "url": f"https://news.example.com/{ticker.lower()}/{i}-{seed}",
        })
    return articles
