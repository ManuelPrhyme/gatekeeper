import type { Article, UnlockRecord } from './types';

const ARTICLES_KEY = 'gatekeeper_articles';
const UNLOCKS_KEY = 'gatekeeper_unlocks';

export function getArticles(): Article[] {
  try {
    const raw = localStorage.getItem(ARTICLES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getArticle(id: string): Article | undefined {
  return getArticles().find((a) => a.id === id);
}

export function saveArticle(article: Article): void {
  const articles = getArticles();
  const idx = articles.findIndex((a) => a.id === article.id);
  if (idx >= 0) {
    articles[idx] = article;
  } else {
    articles.unshift(article);
  }
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter((a) => a.id !== id);
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

export function getUnlocks(): UnlockRecord[] {
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordUnlock(record: UnlockRecord): void {
  const unlocks = getUnlocks();
  unlocks.push(record);
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(unlocks));
}

export function hasUnlocked(articleId: string, reader: string): boolean {
  return getUnlocks().some(
    (u) => u.articleId === articleId && u.reader === reader
  );
}

export function isAuthor(articleId: string, wallet: string): boolean {
  const article = getArticle(articleId);
  return article?.author === wallet;
}

export function getArticlesByAuthor(wallet: string): Article[] {
  return getArticles().filter((a) => a.author === wallet);
}

export function formatUsdc(lamports: number): string {
  return (lamports / 1_000_000).toFixed(2);
}

export function parseUsdcInput(input: string): number {
  const val = parseFloat(input);
  if (isNaN(val) || val <= 0) return 0;
  return Math.round(val * 1_000_000);
}
