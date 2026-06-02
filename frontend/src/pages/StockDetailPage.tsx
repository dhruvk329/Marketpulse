import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { stockApi } from "../api";
import type { SentimentSummary, SentimentHistoryPoint, NewsArticle } from "../types";
import { Navbar, LoadingSpinner, NewsArticleCard, SentimentBadge } from "../components/ui";
import { SentimentTrendChart, SentimentDonut } from "../components/charts";

export default function StockDetailPage() {
  const { ticker = "" } = useParams();
  const [summary, setSummary] = useState<SentimentSummary | null>(null);
  const [history, setHistory] = useState<SentimentHistoryPoint[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [s, h, n] = await Promise.all([
      stockApi.sentiment(ticker),
      stockApi.history(ticker),
      stockApi.news(ticker),
    ]);
    setSummary(s);
    setHistory(h);
    setNews(n);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load().catch(() => setLoading(false));
  }, [ticker]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await stockApi.refresh(ticker);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Link
          to="/"
          className="mb-5 inline-block font-mono text-xs uppercase tracking-wider text-ash transition hover:text-pos"
        >
          ← Dashboard
        </Link>

        {loading ? (
          <LoadingSpinner label={`Analyzing ${ticker}`} />
        ) : !summary ? (
          <p className="py-16 text-center text-ash">No data available for {ticker}.</p>
        ) : (
          <>
            <div className="rise mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-mono text-5xl font-bold tracking-tight text-bone">
                  {ticker}
                </h1>
                <p className="mt-1 text-ash">{summary.total_articles} headlines · last 7 days</p>
              </div>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="rounded-lg border border-line bg-panel px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition hover:border-pos/50 hover:text-pos disabled:opacity-50"
              >
                {refreshing ? "Refreshing…" : "↻ Refresh news"}
              </button>
            </div>

            {/* AI-style summary panel */}
            <div className="rise mb-6 rounded-xl border border-pos/25 bg-gradient-to-br from-panel to-panel2 p-6">
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-pos">
                <span className="live-dot h-2 w-2 rounded-full bg-pos" />
                Market summary
              </div>
              <p className="font-display text-xl leading-relaxed text-bone">
                {summary.summary_text}
              </p>
            </div>

            {/* Stats row */}
            <div className="rise mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-line bg-panel/60 p-5">
                <h3 className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ash">
                  Sentiment split
                </h3>
                <SentimentDonut summary={summary} />
                <div className="mt-2 flex justify-around font-mono text-xs">
                  <span className="text-pos">{summary.positive_pct}% pos</span>
                  <span className="text-neu">{summary.neutral_pct}% neu</span>
                  <span className="text-neg">{summary.negative_pct}% neg</span>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-panel/60 p-5 md:col-span-2">
                <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-ash">
                  Sentiment trend
                </h3>
                <SentimentTrendChart data={history} />
              </div>
            </div>

            {/* Highlights */}
            <div className="rise mb-6 grid gap-4 md:grid-cols-2">
              {summary.most_positive && (
                <Highlight title="Most positive" article={summary.most_positive} />
              )}
              {summary.most_negative && (
                <Highlight title="Most negative" article={summary.most_negative} />
              )}
            </div>

            {/* News feed */}
            <div className="rise">
              <h2 className="mb-3 font-display text-2xl text-bone">Latest headlines</h2>
              <div className="grid gap-2.5 md:grid-cols-2">
                {news.map((a) => (
                  <NewsArticleCard key={a.article_id} article={a} />
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Highlight({ title, article }: { title: string; article: NewsArticle }) {
  return (
    <div className="rounded-xl border border-line bg-panel/60 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-ash">{title}</h3>
        <SentimentBadge label={article.sentiment_label} />
      </div>
      <p className="font-display text-lg leading-snug text-bone">{article.title}</p>
      <p className="mt-2 font-mono text-[11px] text-ash">
        {article.source} · score {article.sentiment_score >= 0 ? "+" : ""}
        {article.sentiment_score.toFixed(3)}
      </p>
    </div>
  );
}
