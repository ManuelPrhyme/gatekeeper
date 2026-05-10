import React from 'react';
import { BookOpen } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Gate<span className="text-primary">Keeper</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Decentralized gated content platform on Solana. Pay with USDC, unlock knowledge.
          </p>
          <p className="text-xs text-muted-foreground">
            Built on Solana Devnet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
