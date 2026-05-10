import React from 'react';
import { motion } from 'framer-motion';
import { PenTool, Wallet, CreditCard, CheckCircle, BookOpen, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: PenTool,
    title: 'Author Publishes',
    description: 'Create article with title, content, and USDC price',
    color: 'primary' as const,
  },
  {
    icon: Wallet,
    title: 'Reader Connects',
    description: 'Connect Phantom or Solflare wallet',
    color: 'primary' as const,
  },
  {
    icon: CreditCard,
    title: 'Pay USDC',
    description: 'SPL Token transfer to author via Solana program',
    color: 'accent' as const,
  },
  {
    icon: CheckCircle,
    title: 'Program Validates',
    description: 'On-chain validation records access grant',
    color: 'primary' as const,
  },
  {
    icon: BookOpen,
    title: 'Content Unlocked',
    description: 'Full article revealed to reader',
    color: 'accent' as const,
  },
];

const WorkflowDiagram: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 border-t border-border/30">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A 5-step flow from content creation to reader access
        </p>
      </div>

      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start justify-between gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isAccent = step.color === 'accent';
          return (
            <React.Fragment key={step.title}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-1 flex-col items-center text-center"
              >
                <div
                  className={`mb-3 flex h-14 w-14 items-center justify-center rounded-xl border ${
                    isAccent
                      ? 'bg-accent/10 border-accent/20'
                      : 'bg-primary/10 border-primary/20'
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 ${isAccent ? 'text-accent' : 'text-primary'}`}
                  />
                </div>
                <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-[140px]">
                  {step.description}
                </p>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="mt-6 flex items-center text-muted-foreground/30">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isAccent = step.color === 'accent';
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-4"
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                    isAccent
                      ? 'bg-accent/10 border-accent/20'
                      : 'bg-primary/10 border-primary/20'
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 ${isAccent ? 'text-accent' : 'text-primary'}`}
                  />
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-border" />
                )}
              </div>
              <div className="pt-1.5">
                <h3 className="text-sm font-semibold text-foreground">
                  <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                  {step.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default WorkflowDiagram;
