"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1];

const textRevealVariants = {
  hidden: { y: "105%", opacity: 0 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.85, ease, delay: i * 0.12 },
  }),
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, ease, delay },
});

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden bg-background">
      {/* ── Backgrounds ─────────────────────────────────── */}

      {/* Light mode: soft sky-to-white gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_160%_90%_at_50%_-20%,_#dbeafe_0%,_#ffffff_65%)] dark:hidden pointer-events-none" />

      {/* Dark mode: deep navy with indigo glow */}
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_140%_80%_at_50%_-10%,_#1e3a6e_0%,_#0a0f1e_60%)] pointer-events-none" />

      <div className="absolute bottom-0 left-0 py-24 bg-gradient-to-b from-transparent to-background w-full " />

      {/* Subtle dot-grid pattern — visible in both modes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Soft center glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[480px] rounded-full pointer-events-none
          bg-blue-300/20 blur-[80px]
          dark:bg-blue-500/10 dark:blur-[100px]"
      />

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          {...fadeUp(0)}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8
            bg-blue-50 border border-blue-200 text-blue-700
            dark:bg-blue-900/40 dark:border-blue-700/60 dark:text-blue-300"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-sm font-medium tracking-wide">
            Trusted by 100+ landlords
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
        </motion.div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-[5.25rem] font-bold tracking-tight leading-[1.08] mb-6"
          style={{ fontFamily: "var(--font-cal-sans), 'Georgia', serif" }}
        >
          <span className="block overflow-hidden">
            <motion.span
              className="block text-gray-900 dark:text-white"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={0}
            >
              Manage properties
            </motion.span>
          </span>

          <span className="block overflow-hidden">
            <motion.span
              className="block bg-gradient-to-r from-primary to-sky-500 dark:to-sky-400 bg-clip-text text-transparent"
              variants={textRevealVariants}
              initial="hidden"
              animate="visible"
              custom={1}
            >
              effortlessly.
            </motion.span>
          </span>
        </h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.55)}
          className="text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed
              text-gray-500 dark:text-gray-400"
        >
          Simplify your property management with automated rent collection,
          tenant management, and real-time analytics.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.7)}
          className="flex flex-row items-center justify-center gap-3 max-w-[12rem] w-full mx-auto"
        >
          <Button asChild className="gap-2">
            <a href="/register">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>

          <Button variant="outline" asChild>
            <a href="#features">Explore Features</a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
