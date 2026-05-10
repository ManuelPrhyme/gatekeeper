import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Lock, CheckCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import type { Article } from '@/lib/types';
import { formatUsdc, hasUnlocked, isAuthor } from '@/lib/storage';

interface ArticleCardProps {
  article: Article;
  index?: number;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, index = 0 }) => {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() || '';

  const unlocked = wallet
    ? hasUnlocked(article.id, wallet) || isAuthor(article.id, wallet)
    : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link
        to={`/article/${article.id}`}
        className="group block rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-glow/30 hover:bg-surface-elevated"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-xl">
            {article.cover_emoji}
          </div>
          <div className="flex items-center gap-2">
            {unlocked ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <CheckCircle className="h-3 w-3" />
                Unlocked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                <Lock className="h-3 w-3" />
                {formatUsdc(article.price_usdc)} USDC
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="mt-3.5 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {article.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="rounded bg-secondary px-2 py-0.5 font-medium">
            {article.category}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.read_time} min
            </span>
            <span>{article.author_name}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ArticleCard;
