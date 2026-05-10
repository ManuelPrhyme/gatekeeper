import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PenTool, Eye, ArrowLeft, Wallet, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { renderMarkdown } from '@/lib/markdown';
import Layout from '@/components/Layout';
import { saveArticle, parseUsdcInput } from '@/lib/storage';
import { CATEGORIES, CATEGORY_EMOJIS } from '@/lib/types';
import type { Article, ArticleCategory } from '@/lib/types';
import { useGateKeeper } from '@/hooks/useGateKeeper';

const Publish: React.FC = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const sdk = useGateKeeper();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('General');
  const [authorName, setAuthorName] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setError('');

    if (!publicKey) {
      setError('Connect your wallet to publish.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }
    if (!body.trim()) {
      setError('Article body is required.');
      return;
    }
    const priceUsdc = parseUsdcInput(priceInput);
    if (priceUsdc <= 0) {
      setError('Enter a valid price (e.g. 1.00 for 1 USDC).');
      return;
    }

    const readTime = Math.max(1, Math.ceil(body.split(/\s+/).length / 200));
    const articleId = `article-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const article: Article = {
      id: articleId,
      title: title.trim(),
      description: description.trim(),
      body: body.trim(),
      price_usdc: priceUsdc,
      author: publicKey.toBase58(),
      author_name: authorName.trim() || 'Anonymous',
      created_at: new Date().toISOString(),
      category,
      cover_emoji: CATEGORY_EMOJIS[category],
      read_time: readTime,
    };

    // Register on-chain if SDK is available
    if (sdk) {
      setPublishing(true);
      try {
        const result = await sdk.registerArticle(articleId, priceUsdc);
        if (!result.success) {
          // Save locally even if on-chain fails (can retry later)
          console.warn('On-chain registration failed:', result.error);
        }
      } catch (err) {
        console.warn('On-chain registration error:', err);
      } finally {
        setPublishing(false);
      }
    }

    saveArticle(article);
    navigate(`/article/${article.id}`);
  };

  if (!publicKey) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-8"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Connect to Publish</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your Solana wallet to start publishing gated content.
            </p>
            <div className="mt-6 flex justify-center">
              <WalletMultiButton />
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Publish Article</h1>
              <p className="text-xs text-muted-foreground">
                Set a USDC price — readers pay you directly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(!preview)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                preview
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {preview ? <PenTool className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>

        {preview ? (
          /* Preview */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl">{CATEGORY_EMOJIS[category]}</span>
              <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">{title || 'Untitled'}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              By {authorName || 'Anonymous'} — {priceInput ? `${priceInput} USDC` : 'No price set'}
            </div>
            <hr className="my-6 border-border" />
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(body || '*No content yet*') }}
            />
          </motion.div>
        ) : (
          /* Editor */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Understanding Solana's Account Model"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short summary for the article card"
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            {/* Row: Category + Price + Author */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_EMOJIS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Price (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="1.00"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Author Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Content (Markdown)
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"# My Article\n\nWrite your content in Markdown...\n\n## Section 1\n\nExplain your topic here.\n\n```rust\nfn main() {\n    println!(\"Hello Solana!\");\n}\n```"}
                rows={16}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors resize-y leading-relaxed"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {publishing ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Registering on-chain...
                </>
              ) : (
                'Publish Article'
              )}
            </button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default Publish;