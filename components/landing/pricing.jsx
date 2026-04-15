"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const ease = [0.22, 1, 0.36, 1];

const plans = [
  {
    name: "Starter",
    description: "For small property portfolios",
    price: { monthly: 0, yearly: 0 },
    currency: "Free",
    features: [
      "Up to 5 properties",
      "Basic tenant management",
      "Mobile money payments",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    description: "For growing property managers",
    price: { monthly: 15000, yearly: 12000 },
    currency: "TSh",
    features: [
      "Up to 25 properties",
      "Advanced analytics",
      "Tenant screening",
      "Priority support",
      "Maintenance tracking",
    ],
    cta: "Start Today",
    highlighted: true,
  },
  {
    name: "Enterprise",
    description: "For large portfolios and teams",
    price: { monthly: 45000, yearly: 38000 },
    currency: "TSh",
    features: [
      "Unlimited properties",
      "Multi-user access",
      "API access",
      "Dedicated support",
      "Custom reporting",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [billing, setBilling] = useState("monthly");

  return (
    <section id="pricing" className="py-24 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-3">
            Pricing
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
            style={{ fontFamily: "var(--font-cal-sans), Georgia, serif" }}
          >
            Transparent pricing,{" "}
            <span className="bg-gradient-to-r from-primary to-sky-600 dark:to-sky-300 bg-clip-text text-transparent">
              no surprises
            </span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Start free with full access for 14 days. Scale as your portfolio
            grows.
          </p>

          {/* Billing toggle */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-full
            bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10"
          >
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBilling(cycle)}
                className={`relative px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize
                  ${
                    billing === cycle
                      ? "bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
              >
                {cycle}
                {cycle === "yearly" && (
                  <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    −20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.15, ease }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start"
        >
          {plans.map((plan, i) => {
            const isHighlighted = plan.highlighted;
            const price = plan.price[billing];
            const isFree = price === 0;

            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25 + i * 0.1, ease }}
                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300
                  hover:-translate-y-1
                  ${
                    isHighlighted
                      ? `bg-primary text-white shadow-2xl shadow-blue-500/30 dark:shadow-blue-500/20
                       ring-1 ring-blue-400/50`
                      : `bg-white dark:bg-white/[0.03]
                       border border-gray-200 dark:border-white/10
                       hover:border-blue-300 dark:hover:border-blue-600/50
                       hover:shadow-md hover:shadow-blue-500/8`
                  }`}
              >
                {/* Popular badge */}
                {isHighlighted && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2
                    flex items-center gap-1.5 px-3 py-1 rounded-full
                    bg-amber-400 text-amber-900 text-xs font-bold shadow-md whitespace-nowrap"
                  >
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                {/* Plan name + desc */}
                <div className="mb-5">
                  <h3
                    className={`text-lg font-semibold mb-1 ${isHighlighted ? "text-white" : "text-gray-900 dark:text-white"}`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`text-sm ${isHighlighted ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {isFree ? (
                    <div
                      className={`text-4xl font-bold ${isHighlighted ? "text-white" : "text-gray-900 dark:text-white"}`}
                    >
                      Free
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-sm ${isHighlighted ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        {plan.currency}
                      </span>
                      <motion.span
                        key={`${plan.name}-${billing}`}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`text-4xl font-bold ${isHighlighted ? "text-white" : "text-gray-900 dark:text-white"}`}
                      >
                        {price.toLocaleString()}
                      </motion.span>
                      <span
                        className={`text-sm ${isHighlighted ? "text-blue-100" : "text-gray-400 dark:text-gray-500"}`}
                      >
                        /mo
                      </span>
                    </div>
                  )}
                  {!isFree && billing === "yearly" && (
                    <p
                      className={`text-xs mt-1 ${isHighlighted ? "text-blue-100" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      Billed annually · saves TSh{" "}
                      {((plan.price.monthly - price) * 12).toLocaleString()}/yr
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div
                  className={`h-px mb-5 ${isHighlighted ? "bg-white/20" : "bg-gray-100 dark:bg-white/8"}`}
                />

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0
                        ${isHighlighted ? "bg-white/20" : "bg-blue-50 dark:bg-blue-500/15"}`}
                      >
                        <Check
                          className={`w-2.5 h-2.5 ${isHighlighted ? "text-white" : "text-blue-600 dark:text-blue-400"}`}
                          strokeWidth={2.5}
                        />
                      </div>
                      <span
                        className={
                          isHighlighted
                            ? "text-blue-50"
                            : "text-gray-600 dark:text-gray-300"
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full rounded-full font-semibold text-sm transition-all duration-200
                    ${
                      isHighlighted
                        ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                        : `border
                         border-gray-200 dark:border-white/15
                         bg-transparent
                         text-gray-800 dark:text-white
                         hover:bg-gray-50 dark:hover:bg-white/8`
                    }`}
                  asChild
                >
                  <a href="/register">{plan.cta}</a>
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center text-xs text-gray-400 dark:text-gray-600 mt-8"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
