# MarketPulse

A web app that tracks the *mood* of the news around the stocks you care about.

You make a watchlist (AAPL, NVDA, TSLA, whatever), and for each company MarketPulse
pulls recent headlines, runs them through sentiment analysis, and tells you whether the
coverage is leaning positive, negative, or just neutral. It does **not** try to predict
prices. I built it to get hands-on with a full stack end to end: an API, a typed React frontend, a database I designed myself, login/auth, talking to third-party APIs, and an NLP step in the middle.

## What it does

After signing up and logging in you can:

- Add and remove tickers from your own watchlist, with an optional note per stock.
- Open a stock to see a dashboard — % of positive / neutral / negative headlines, an
  average sentiment score, the single most positive and most negative headline, and the
  latest news.
- See sentiment trend over the past few days as a line chart.
- Read a short auto-generated summary like *"NVDA sentiment is mostly positive this week…"*

Each user only sees their own watchlist (it's behind JWT auth).

## Tech

- **Frontend:** React + TypeScript, Tailwind, React Router, Axios, Recharts for charts.
- **Backend:** Python + FastAPI, SQLAlchemy, JWT auth, passwords hashed with bcrypt.
- **Database:** SQLite locally (no setup), Postgres in production — same code, just a
  different connection string.
- **NLP:** VADER for sentiment, Pandas to crunch the daily averages.

## A couple of design notes

**Caching the news.** The news APIs have low free-tier limits, so I store fetched
articles in the DB and only re-fetch a ticker if the last pull was over 6 hours ago. The
"Refresh" button bypasses that and forces a new pull.

**Multiple news sources with fallback.** I wired up three APIs (Finnhub, NewsAPI, Alpha
Vantage). The app tries them in order and uses the first that returns something, so one
provider being down or rate-limited doesn't break the feature.

## Things I'd do next

- Add real tests (I tested by hand and with some scripts hitting the endpoints).
- The trend chart gets more useful the longer the app has been collecting news.
