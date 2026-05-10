import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { getArticles } from '@/lib/storage';
import { CATEGORIES } from '@/lib/types';
import type { ArticleCategory } from '@/lib/types';
import ArticleCard from './ArticleCard';

const ArticleList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ArticleCategory | 'All'>('All');

  const articles = useMemo(() => getArticles(), []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'All' || a.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [articles, search, category]);

  return (
    <section id="articles" className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          Explore Articles
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Premium content from builders, researchers, and educators
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat as ArticleCategory | 'All')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-secondary text-muted-foreground border border-transparent hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No articles found. Be the first to{' '}
            <a href="/publish" className="text-primary underline underline-offset-2">
              publish one
            </a>
            .
          </p>
        </div>
      )}
    </section>
  );
};

export default ArticleList;
