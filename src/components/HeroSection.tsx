import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Zap, Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import heroBg from '@/assets/hero-bg.png';

const HeroSection: React.FC = () => {
  const { publicKey } = useWallet();

  return (
    <section className="relative overflow-hidden border-b border-border/30">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Animated orbs */}
      <div className="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 h-48 w-48 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Powered by Solana</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
            Premium content,{' '}
            <span className="text-primary">gated on-chain</span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl leading-relaxed text-muted-foreground max-w-xl">
            Publish tutorials, research, and guides. Readers pay in USDC — validated by a Solana program. No middlemen, instant settlement.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/publish"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:shadow-lg hover:brightness-110"
            >
              Start Publishing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#articles"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
            >
              Browse Articles
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { icon: Lock, label: 'On-chain Access', desc: 'USDC payments validated by program' },
              { icon: Shield, label: 'Non-custodial', desc: 'Authors receive funds directly' },
              { icon: Zap, label: 'Instant', desc: 'Sub-second Solana finality' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary border border-border">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
