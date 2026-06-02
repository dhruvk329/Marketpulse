import { Link, useNavigate } from "react-router-dom";
import type { NewsArticle, SentimentLabel } from "../types";
import { useAuth } from "../AuthContext";

export function SentimentBadge({ label }: { label: SentimentLabel }) {
  const map = {
    positive: { c: "text-pos border-pos/40 bg-pos/10", t: "Positive" },
    neutral: { c: "text-neu border-neu/40 bg-neu/10", t: "Neutral" },
    negative: { c: "text-neg border-neg/40 bg-neg/10", t: "Negative" },
  }[label];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${map.c}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {map.t}
    </span>
  );
}

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ash">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-pos" />
      <span className="font-mono text-sm uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="live-dot h-2.5 w-2.5 rounded-full bg-pos shadow-[0_0_12px] shadow-pos/60" />
          <span className="font-display text-xl tracking-tight text-bone">
            Market<span className="italic text-pos">Pulse</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider">
          <Link
            to="/"
            className="rounded px-3 py-2 text-ash transition hover:bg-panel hover:text-bone"
          >
            Dashboard
          </Link>
          <Link
            to="/watchlist"
            className="rounded px-3 py-2 text-ash transition hover:bg-panel hover:text-bone"
          >
            Watchlist
          </Link>
          <div className="mx-2 h-5 w-px bg-line" />
          <span className="hidden px-2 text-ash sm:inline">{user?.name}</span>
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            className="rounded border border-line px-3 py-2 text-ash transition hover:border-neg/50 hover:text-neg"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}

export function NewsArticleCard({ article }: { article: NewsArticle }) {
  const accent =
    article.sentiment_label === "positive"
      ? "border-l-pos"
      : article.sentiment_label === "negative"
      ? "border-l-neg"
      : "border-l-neu";
  const date = article.published_at
    ? new Date(article.published_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "";
  return (
    <a
      href={article.url || "#"}
      target="_blank"
      rel="noreferrer"
      className={`block border-l-2 ${accent} rounded-r-md bg-panel/60 px-4 py-3 transition hover:bg-panel`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ash">
          {article.source || "—"} · {date}
        </span>
        <SentimentBadge label={article.sentiment_label} />
      </div>
      <p className="font-display text-[15px] leading-snug text-bone">{article.title}</p>
      <span className="mt-1 inline-block font-mono text-[11px] text-ash">
        score {article.sentiment_score >= 0 ? "+" : ""}
        {article.sentiment_score.toFixed(3)}
      </span>
    </a>
  );
}
