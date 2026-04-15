"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1];

const trustPoints = ["No credit card required", "Cancel anytime"];

// Payment provider logos as styled text badges (replace with <img> if you have SVGs)
const providers = ["M-Pesa", "Mixx By Yas", "Airtel Money", "Azam Pesa"];

export function FinalCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="relative py-28 px-4 overflow-hidden bg-background">
      <div className="w-full py-24 bg-gradient-to-b from-background to-transparent absolute -top-4 left-0 z-10" />
      <div className="w-full py-24 bg-gradient-to-b to-background from-transparent absolute -bottom-4 left-0 z-10" />

      {/* Background — solid blue band with radial fade */}
      <div
        className="absolute inset-0 pointer-events-none
        bg-[radial-gradient(ellipse_140%_80%_at_50%_50%,_#2563eb14_0%,_transparent_70%)]
        dark:bg-[radial-gradient(ellipse_140%_80%_at_50%_50%,_#1e3a6e60_0%,_transparent_70%)]"
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.175] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Glowing orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[500px] h-[300px] rounded-full pointer-events-none
        bg-blue-300/20 blur-[80px]
        dark:bg-blue-600/12 dark:blur-[100px]"
      />

      {/* Content */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 36 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease }}
        className="relative z-10 max-w-2xl mx-auto text-center"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6
            bg-blue-50 border border-blue-200 text-blue-700
            dark:bg-blue-900/40 dark:border-blue-700/60 dark:text-blue-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
          <span className="text-sm font-medium">Trusted by 100+ landlords</span>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, delay: 0.18, ease }}
          className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.1] mb-5
            text-foreground"
          style={{ fontFamily: "var(--font-cal-sans), Georgia, serif" }}
        >
          Ready to simplify{" "}
          <span className="bg-gradient-to-r from-primary to-sky-600 dark:to-sky-500 bg-clip-text text-transparent">
            property management?
          </span>
        </motion.h2>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.26, ease }}
          className="text-base text-muted-foreground mb-8 leading-relaxed"
        >
          Join landlords already managing their properties with Wapangaji
          Kiganjani. Get started in minutes — no setup fees, no contracts.
        </motion.p>

        {/* Trust checkpoints */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.34, ease }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-10"
        >
          {trustPoints.map((point) => (
            <span
              key={point}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              {point}
            </span>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.42, ease }}
          className="flex items-center justify-center gap-3 mb-10 max-w-xs mx-auto"
        >
          <Button className="gap-2" asChild>
            <a href="/register">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/login">Sign In</a>
          </Button>
        </motion.div>

        {/* Payment providers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.52, ease }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-gray-400 dark:text-gray-600 mr-1">
            Payments via
          </span>
          {providers.map((p) => (
            <span
              key={p}
              className="px-2.5 py-1 rounded-lg text-xs font-medium
                bg-gray-100 text-gray-600
                dark:bg-white/8 dark:text-gray-400
                border border-gray-200 dark:border-white/10"
            >
              {p}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
