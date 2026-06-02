"""
Scores news headlines using VADER and builds a short text summary.
"""
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

# Extra finance terms with hand-picked scores (VADER scale is roughly -4 to 4).
analyzer.lexicon.update({
    "beats": 2.0, "beat": 1.8, "surge": 2.5, "surges": 2.5, "soars": 2.8,
    "rally": 2.2, "upgrade": 2.0, "upgraded": 2.0, "outperform": 2.0,
    "record": 1.5, "growth": 1.5, "profit": 1.6, "gains": 1.6,
    "misses": -2.0, "miss": -1.8, "plunge": -2.8, "plunges": -2.8,
    "slump": -2.2, "downgrade": -2.0, "downgraded": -2.0, "lawsuit": -1.8,
    "probe": -1.5, "recall": -1.8, "layoffs": -2.0, "selloff": -2.2,
    "tumble": -2.4, "warning": -1.5, "cuts": -1.2, "loss": -1.6,
})


def score_text(text):
    """Score one headline. Returns the compound score and a positive/neutral/negative label."""
    score = analyzer.polarity_scores(text or "")["compound"]
    if score >= 0.05:
        label = "positive"
    elif score <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return {"score": round(score, 4), "label": label}


def build_summary(ticker, articles):
    """Turn the scored headlines into a one-line plain-English summary."""
    if not articles:
        return f"No recent news found for {ticker}."

    total = len(articles)
    pos = [a for a in articles if a["sentiment_label"] == "positive"]
    neg = [a for a in articles if a["sentiment_label"] == "negative"]
    neu = [a for a in articles if a["sentiment_label"] == "neutral"]
    avg = sum(a["sentiment_score"] for a in articles) / total

    if avg >= 0.15:
        mood = "mostly positive"
    elif avg <= -0.15:
        mood = "mostly negative"
    elif abs(avg) < 0.05 and len(neu) >= total / 2:
        mood = "mostly neutral"
    else:
        mood = "mixed"

    parts = [
        f"{ticker} sentiment is {mood} this week "
        f"({len(pos)} positive, {len(neu)} neutral, {len(neg)} negative out of {total} headlines)."
    ]
    if pos:
        best = max(pos, key=lambda a: a["sentiment_score"])
        parts.append(f'Positive coverage is led by "{_short(best["title"])}".')
    if neg:
        worst = min(neg, key=lambda a: a["sentiment_score"])
        parts.append(f'The main negative note is "{_short(worst["title"])}".')

    return " ".join(parts)


def _short(text, limit=80):
    text = text.strip()
    return text if len(text) <= limit else text[:limit - 1].rstrip() + "…"
