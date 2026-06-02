import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api";
import { useAuth } from "../AuthContext";

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const { setSession } = useAuth();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const data = isSignup
        ? await authApi.register(name, email, password)
        : await authApi.login(email, password);
      setSession(data);
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-texture flex min-h-screen items-center justify-center px-5">
      <div className="rise w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <span className="live-dot h-3 w-3 rounded-full bg-pos shadow-[0_0_14px] shadow-pos/60" />
            <h1 className="font-display text-3xl tracking-tight text-bone">
              Market<span className="italic text-pos">Pulse</span>
            </h1>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ash">
            News sentiment intelligence
          </p>
        </div>

        <div className="rounded-xl border border-line bg-panel/70 p-7 backdrop-blur">
          <h2 className="mb-1 font-display text-2xl text-bone">
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p className="mb-6 text-sm text-ash">
            {isSignup ? "Start tracking market mood." : "Sign in to your watchlist."}
          </p>

          <div className="space-y-3">
            {isSignup && (
              <Field label="Name" value={name} onChange={setName} placeholder="Alex Morgan" />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
              type="email"
            />
            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
              onEnter={submit}
            />
          </div>

          {err && (
            <p className="mt-4 rounded border border-neg/40 bg-neg/10 px-3 py-2 font-mono text-xs text-neg">
              {err}
            </p>
          )}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-6 w-full rounded-lg bg-pos py-3 font-mono text-sm font-bold uppercase tracking-wider text-ink transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "..." : isSignup ? "Create account" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-ash">
            {isSignup ? "Already have an account? " : "No account yet? "}
            <Link
              to={isSignup ? "/login" : "/signup"}
              className="text-pos underline-offset-2 hover:underline"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-ash">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-bone outline-none transition placeholder:text-ash/50 focus:border-pos/60"
      />
    </label>
  );
}
