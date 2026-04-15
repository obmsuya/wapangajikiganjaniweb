"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 px-4 bg-background">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight"
          style={{ fontFamily: "var(--font-cal-sans)" }}
        >
          Ready to simplify property management?
        </h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join 100+ landlords already managing their properties with PropManager. Become efficient today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-[12rem] mx-auto">
          <Button
            className="shimmer-btn px-8 h-14"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            className="px-8 h-14"
          >
            Sign In
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">Works with M-Pesa, Mixx By Yas, Airtel Money and Azam Pesa. All extra pricing options will be available when logged into dashboard.</p>
      </motion.div>
    </section>
  )
}
