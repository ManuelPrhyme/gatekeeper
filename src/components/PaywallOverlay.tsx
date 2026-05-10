import React, { useState, useCallback } from 'react';
import { Lock, Wallet, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import type { Article } from '@/lib/types';
import { formatUsdc, recordUnlock } from '@/lib/storage';
import { getUsdcBalance } from '@/lib/solana';
import { useGateKeeper } from '@/hooks/useGateKeeper';

interface PaywallOverlayProps {
  article: Article;
  onUnlocked: () => void;
}

type PayState = 'idle' | 'checking' | 'confirming' | 'success' | 'error';

const PaywallOverlay: React.FC<PaywallOverlayProps> = ({ article, onUnlocked }) => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const sdk = useGateKeeper();
  const [state, setState] = useState<PayState>('idle');
  const [error, setError] = useState('');

  const handlePay = useCallback(async () => {
    if (!publicKey || !sdk) return;

    setState('checking');
    setError('');

    try {
      // Check USDC balance
      const balance = await getUsdcBalance(connection, publicKey);
      if (balance < article.price_usdc) {
        setError(
          `Insufficient USDC. You have ${formatUsdc(balance)} USDC but need ${formatUsdc(article.price_usdc)} USDC.`
        );
        setState('error');
        return;
      }

      setState('confirming');

      // Use on-chain program to unlock article via CPI USDC transfer
      const authorPubkey = new PublicKey(article.author);
      const result = await sdk.unlockArticle(article.id, authorPubkey);

      if (!result.success) {
        setError(result.error || 'Transaction failed.');
        setState('error');
        return;
      }

      // Record the unlock locally
      recordUnlock({
        articleId: article.id,
        reader: publicKey.toBase58(),
        txSignature: result.data!.signature,
        unlocked_at: new Date().toISOString(),
      });

      setState('success');
      setTimeout(() => onUnlocked(), 1500);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Transaction failed. Please try again.');
      setState('error');
    }
  }, [publicKey, sdk, connection, article, onUnlocked]);

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-md opacity-30 max-h-64 overflow-hidden" aria-hidden>
        <div className="prose-content">
          <p>{article.body.slice(0, 600)}...</p>
        </div>
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-background/95 to-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-lg"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20">
            <Lock className="h-5 w-5 text-accent" />
          </div>

          <h3 className="text-lg font-bold text-foreground">Premium Content</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Unlock this article by paying the author directly in USDC via the on-chain program.
          </p>

          <div className="my-5 rounded-lg bg-secondary p-3 border border-border">
            <p className="text-2xl font-bold text-foreground">
              {formatUsdc(article.price_usdc)}{' '}
              <span className="text-sm font-medium text-muted-foreground">USDC</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Paid directly to {article.author_name}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!publicKey ? (
              <motion.div key="connect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center gap-2">
                  <WalletMultiButton />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    Connect wallet to pay
                  </p>
                </div>
              </motion.div>
            ) : state === 'success' ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex flex-col items-center gap-2 text-primary">
                  <CheckCircle className="h-8 w-8" />
                  <p className="text-sm font-semibold">Payment confirmed on-chain!</p>
                  <p className="text-xs text-muted-foreground">Unlocking content...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={handlePay}
                  disabled={state === 'checking' || state === 'confirming'}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state === 'checking' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking balance...
                    </>
                  )}
                  {state === 'confirming' && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirm in wallet...
                    </>
                  )}
                  {(state === 'idle' || state === 'error') && (
                    <>
                      <Lock className="h-4 w-4" />
                      Pay {formatUsdc(article.price_usdc)} USDC to Unlock
                    </>
                  )}
                </button>

                {state === 'error' && error && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-left">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default PaywallOverlay;
