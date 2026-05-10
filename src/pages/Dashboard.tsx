import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Wallet,
  BookOpen,
  Unlock,
  PenTool,
  Trash2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import {
  getArticlesByAuthor,
  getUnlocks,
  deleteArticle,
  formatUsdc,
} from '@/lib/storage';
import { getSolBalance, getUsdcBalance, shortenPubkey } from '@/lib/solana';
import type { Article, UnlockRecord } from '@/lib/types';
import { formatDateTime } from '@/lib/formatDate';

const Dashboard: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const navigate = useNavigate();

  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [myArticles, setMyArticles] = useState<Article[]>([]);
  const [myUnlocks, setMyUnlocks] = useState<UnlockRecord[]>([]);
  const [copied, setCopied] = useState(false);

  const wallet = publicKey?.toBase58() || '';

  useEffect(() => {
    if (!publicKey) return;

    getSolBalance(connection, publicKey).then(setSolBalance);
    getUsdcBalance(connection, publicKey).then((b) => setUsdcBalance(b));
    setMyArticles(getArticlesByAuthor(wallet));
    setMyUnlocks(getUnlocks().filter((u) => u.reader === wallet));
  }, [publicKey, connection, wallet]);

  const handleCopy = () => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (id: string) => {
    deleteArticle(id);
    setMyArticles((prev) => prev.filter((a) => a.id !== id));
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
            <h2 className="text-xl font-bold text-foreground">Connect Wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect your wallet to view your dashboard.
            </p>
            <div className="mt-6 flex justify-center">
              <WalletMultiButton />
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const totalEarned = myArticles.reduce((sum, a) => {
    const unlockCount = getUnlocks().filter(
      (u) => u.articleId === a.id
    ).length;
    return sum + a.price_usdc * unlockCount;
  }, 0);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

        {/* Wallet info */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Wallet</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-foreground">{shortenPubkey(wallet, 6)}</p>
              <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{solBalance.toFixed(4)} SOL</span>
              <span>{formatUsdc(usdcBalance)} USDC</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Published</p>
            <p className="text-2xl font-bold text-foreground">{myArticles.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">articles</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Estimated Earnings</p>
            <p className="text-2xl font-bold text-accent">{formatUsdc(totalEarned)} USDC</p>
            <p className="mt-1 text-xs text-muted-foreground">from {myUnlocks.length} unlock{myUnlocks.length !== 1 ? 's' : ''} purchased</p>
          </div>
        </div>

        {/* My Articles */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              My Articles
            </h2>
            <Link
              to="/publish"
              className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              <PenTool className="h-3 w-3" />
              New Article
            </Link>
          </div>

          {myArticles.length > 0 ? (
            <div className="space-y-2">
              {myArticles.map((article) => {
                const unlockCount = getUnlocks().filter(
                  (u) => u.articleId === article.id
                ).length;
                return (
                  <div
                    key={article.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5 hover:bg-surface-elevated transition-colors"
                  >
                    <Link to={`/article/${article.id}`} className="flex-1 min-w-0 mr-3">
                      <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors">
                        {article.cover_emoji} {article.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatUsdc(article.price_usdc)} USDC — {unlockCount} unlock{unlockCount !== 1 ? 's' : ''}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't published any articles yet.{' '}
                <Link to="/publish" className="text-primary underline underline-offset-2">
                  Create one
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* My Unlocks */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground flex items-center gap-2">
            <Unlock className="h-4 w-4 text-accent" />
            My Purchases
          </h2>

          {myUnlocks.length > 0 ? (
            <div className="space-y-2">
              {myUnlocks.map((unlock, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3.5"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/article/${unlock.articleId}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {unlock.articleId.slice(0, 24)}...
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(unlock.unlocked_at)}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${unlock.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Tx
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No purchases yet.{' '}
                <Link to="/" className="text-primary underline underline-offset-2">
                  Browse articles
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;