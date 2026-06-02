export interface User {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WatchlistItem {
  watchlist_id: number;
  ticker: string;
  company_name: string;
  sector: string | null;
  notes: string | null;
  created_at: string;
}

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface NewsArticle {
  article_id: number;
  ticker: string;
  title: string;
  source: string | null;
  published_at: string | null;
  url: string | null;
  sentiment_score: number;
  sentiment_label: SentimentLabel;
}

export interface SentimentSummary {
  ticker: string;
  total_articles: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  avg_sentiment: number;
  most_positive: NewsArticle | null;
  most_negative: NewsArticle | null;
  latest: NewsArticle[];
  summary_text: string;
}

export interface SentimentHistoryPoint {
  date: string;
  avg_sentiment: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}
