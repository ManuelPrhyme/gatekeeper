import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft, Clock, User, Calendar, Tag, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { renderMarkdown } from '@/lib/markdown';
import Layout from '@/components/Layout';
import PaywallOverlay from '@/components/PaywallOverlay';
import { getArticle, hasUnlocked, isAuthor, formatUsdc } from '@/lib/storage';
import { shortenPubkey } from '@/lib/solana';
import type { Article } from '@/lib/types';
import { formatDate } from '@/lib/formatDate';

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicKey } = useWallet();

  const [article, setArticle] = useState<Article | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!id) return;
    const found = getArticle(id);
    if (!found) {
      navigate('/');
      return;
    }
    setArticle(found);
  }, [id, navigate]);

  useEffect(() => {
    if (!article || !publicKey) {
      setUnlocked(false);
      return;
    }
    const wallet = publicKey.toBase58();
    setUnlocked(
      hasUnlocked(article.id, wallet) || isAuthor(article.id, wallet)
    );
  }, [article, publicKey]);

  const handleUnlocked = useCallback(() => {
    setUnlocked(true);
  }, []);

  if (!article) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const wallet = publicKey?.toBase58() || '';
  const isOwner = isAuthor(article.id, wallet);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Article header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-3xl">{article.cover_emoji}</span>
            <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {article.category}
            </span>
            {isOwner && (
              <span className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary">
                Your Article
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-foreground">
            {article.title}
          </h1>

          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            {article.description}
          </p>

          {/* Meta bar */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-6 border-b border-border">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {article.author_name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(article.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {article.read_time} min read
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {formatUsdc(article.price_usdc)} USDC
            </span>
            {article.author !== '11111111111111111111111111111111' && (
              <a
                href={`https://explorer.solana.com/address/${article.author}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                {shortenPubkey(article.author)}
              </a>
            )}
          </div>
        </motion.div>

        {/* Content or Paywall */}
        <div className="mt-8">
          {unlocked ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="prose-content"
            >
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
            </motion.div>
          ) : (
            <PaywallOverlay article={article} onUnlocked={handleUnlocked} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ArticleDetail;