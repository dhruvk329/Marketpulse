import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchlistApi } from "../api";
import type { WatchlistItem } from "../types";
import { Navbar, LoadingSpinner } from "../components/ui";

const SUGGESTIONS = ["AAPL", "MSFT", "NVDA", "TSLA", "JPM", "AMZN", "GOOGL", "META"];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setItems(await watchlistApi.list());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const add = async (t?: string) => {
    const sym = (t || ticker).trim().toUpperCase();
    if (!sym) return;
    setErr("");
    setBusy(true);
    try {
      await watchlistApi.add(sym, notes || undefined);
      setTicker("");
      setNotes("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Could not add ticker.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (sym: string) => {
    await watchlistApi.remove(sym);
    setItems((prev) => prev.filter((i) => i.ticker !== sym));
  };

  const owned = new Set(items.map((i) => i.ticker));

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="rise mb-1 font-display text-4xl tracking-tight text-bone">
          Watchlist
        </h1>
        <p className="rise mb-8 text-ash">Add the companies you want to monitor.</p>

        {/* Add form */}
        <div className="rise mb-6 rounded-xl border border-line bg-panel/60 p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="TICKER e.g. NVDA"
              className="w-full rounded-lg border border-line bg-ink px-4 py-2.5 font-mono uppercase tracking-wider text-bone outline-none transition placeholder:text-ash/40 focus:border-pos/60 sm:w-44"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="Notes (optional) — e.g. Track before earnings"
              className="w-full flex-1 rounded-lg border border-line bg-ink px-4 py-2.5 text-bone outline-none transition placeholder:text-ash/40 focus:border-pos/60"
            />
            <button
              onClick={() => add()}
              disabled={busy}
              className="rounded-lg bg-pos px-6 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-ink transition hover:brightness-110 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {err && <p className="mt-3 font-mono text-xs text-neg">{err}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ash">
              Quick add:
            </span>
            {SUGGESTIONS.filter((s) => !owned.has(s)).map((s) => (
              <button
                key={s}
                onClick={() => add(s)}
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ash transition hover:border-pos/50 hover:text-pos"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-ash">No stocks yet. Add one above.</p>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, i) => (
              <div
                key={item.watchlist_id}
                className="rise flex items-center justify-between rounded-lg border border-line bg-panel/50 px-5 py-3.5 transition hover:bg-panel"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link to={`/stock/${item.ticker}`} className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-base font-bold text-bone">
                      {item.ticker}
                    </span>
                    <span className="text-sm text-ash">{item.company_name}</span>
                    {item.sector && item.sector !== "—" && (
                      <span className="rounded border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ash">
                        {item.sector}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="mt-0.5 text-xs italic text-ash">“{item.notes}”</p>
                  )}
                </Link>
                <button
                  onClick={() => remove(item.ticker)}
                  className="ml-4 rounded-md border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ash transition hover:border-neg/50 hover:text-neg"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
