import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchlistApi, stockApi } from "../api";
import type { WatchlistItem, SentimentSummary } from "../types";
import { Navbar, LoadingSpinner } from "../components/ui";

interface Row {
  item: WatchlistItem;
  summary: SentimentSummary | null;
}

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const items = await watchlistApi.list();
      const withSummary = await Promise.all(
        items.map(async (item) => {
          try {
            const summary = await stockApi.sentiment(item.ticker);
            return { item, summary };
          } catch {
            return { item, summary: null };
          }
        })
      );
      setRows(withSummary);
      setLoading(false);
    })();
  }, []);

  const marketAvg =
    rows.filter((r) => r.summary).length > 0
      ? rows.reduce((s, r) => s + (r.summary?.avg_sentiment || 0), 0) /
        rows.filter((r) => r.summary).length
      : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      <TickerStrip rows={rows} />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="rise mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl tracking-tight text-bone">
              Market Dashboard
            </h1>
            <p className="mt-1 text-ash">
              Sentiment across {rows.length} tracked {rows.length === 1 ? "company" : "companies"}.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel px-5 py-3 text-right">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-ash">
              Aggregate mood
            </span>
            <span
              className="font-mono text-2xl font-bold"
              style={{
                color: marketAvg > 0.05 ? "#3fd17a" : marketAvg < -0.05 ? "#e5564e" : "#d6a64a",
              }}
            >
              {marketAvg >= 0 ? "+" : ""}
              {marketAvg.toFixed(2)}
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Analyzing headlines" />
        ) : rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, i) => (
              <StockCard key={r.item.ticker} row={r} delay={i * 60} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TickerStrip({ rows }: { rows: Row[] }) {
  const valid = rows.filter((r) => r.summary);
  if (valid.length === 0) return null;
  const doubled = [...valid, ...valid];
  return (
    <div className="overflow-hidden border-b border-line/60 bg-panel/40">
      <div className="ticker-track flex w-max gap-8 py-2">
        {doubled.map((r, i) => {
          const avg = r.summary!.avg_sentiment;
          const color = avg > 0.05 ? "#3fd17a" : avg < -0.05 ? "#e5564e" : "#d6a64a";
          return (
            <span key={i} className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-bone">{r.item.ticker}</span>
              <span style={{ color }}>
                {avg >= 0 ? "▲" : "▼"} {avg.toFixed(2)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StockCard({ row, delay }: { row: Row; delay: number }) {
  const { item, summary } = row;
  return (
    <Link
      to={`/stock/${item.ticker}`}
      className="rise group rounded-xl border border-line bg-panel/60 p-5 transition hover:border-pos/40 hover:bg-panel"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-lg font-bold tracking-wide text-bone">
            {item.ticker}
          </h3>
          <p className="text-xs text-ash">{item.company_name}</p>
        </div>
        {summary && (
          <span
            className="font-mono text-lg font-bold"
            style={{
              color:
                summary.avg_sentiment > 0.05
                  ? "#3fd17a"
                  : summary.avg_sentiment < -0.05
                  ? "#e5564e"
                  : "#d6a64a",
            }}
          >
            {summary.avg_sentiment >= 0 ? "+" : ""}
            {summary.avg_sentiment.toFixed(2)}
          </span>
        )}
      </div>

      {summary ? (
        <>
          <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-ink">
            <div className="bg-pos" style={{ width: `${summary.positive_pct}%` }} />
            <div className="bg-neu" style={{ width: `${summary.neutral_pct}%` }} />
            <div className="bg-neg" style={{ width: `${summary.negative_pct}%` }} />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-ash">
            <span className="text-pos">{summary.positive_pct}%+</span>
            <span className="text-neu">{summary.neutral_pct}%~</span>
            <span className="text-neg">{summary.negative_pct}%−</span>
          </div>
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ash">
            {summary.summary_text}
          </p>
        </>
      ) : (
        <p className="font-mono text-xs text-ash">No data available</p>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-line bg-panel/30 py-20 text-center">
      <p className="mb-2 font-display text-2xl text-bone">Your watchlist is empty</p>
      <p className="mb-6 text-ash">Add a few tickers to start tracking sentiment.</p>
      <Link
        to="/watchlist"
        className="inline-block rounded-lg bg-pos px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-ink transition hover:brightness-110"
      >
        Build watchlist
      </Link>
    </div>
  );
}
