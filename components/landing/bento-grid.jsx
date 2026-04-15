"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  Activity,
  Users,
  BarChart3,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};

/* ── Mini components ──────────────────────────────────────── */

function SystemStatus() {
  const [statuses, setStatuses] = useState([true, true, true, false, true]);

  useEffect(() => {
    const id = setInterval(
      () => setStatuses((p) => p.map(() => Math.random() > 0.2)),
      2500,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      {statuses.map((active, i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${active ? "bg-emerald-500" : "bg-gray-300 dark:bg-zinc-600"}`}
          animate={active ? { scale: [1, 1.25, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
      <span className="ml-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        All systems go
      </span>
    </div>
  );
}

const paymentRows = [
  {
    name: "Apt 4B – Kariakoo",
    amount: "Tsh 45,000",
    status: "paid",
    icon: CheckCircle2,
  },
  {
    name: "Unit 2 – Mikocheni",
    amount: "Tsh 32,000",
    status: "pending",
    icon: Clock,
  },
  {
    name: "Suite 1A – Masaki",
    amount: "Tsh 78,000",
    status: "paid",
    icon: CheckCircle2,
  },
  {
    name: "Room 7 – Kinondoni",
    amount: "Tsh 18,500",
    status: "late",
    icon: AlertCircle,
  },
];

const statusMeta = {
  paid: {
    label: "Paid",
    bg: "bg-emerald-50  dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-50    dark:bg-amber-900/30",
    text: "text-amber-700  dark:text-amber-400",
  },
  late: {
    label: "Late",
    bg: "bg-red-50      dark:bg-red-900/30",
    text: "text-red-700    dark:text-red-400",
  },
};

function PaymentList() {
  return (
    <div className="space-y-2 mt-4">
      {paymentRows.map((row, i) => {
        const meta = statusMeta[row.status];
        const Icon = row.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1, duration: 0.45, ease }}
            className="flex items-center justify-between px-3 py-2 rounded-xl
              bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/8"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${meta.text}`} />
              <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                {row.name}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {row.amount}
              </span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}
              >
                {meta.label}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function AnalyticsBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          Tsh {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease, delay: 0.8 }}
        />
      </div>
    </div>
  );
}

function TenantAvatars() {
  const colors = [
    "bg-blue-400",
    "bg-violet-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-rose-400",
  ];
  const initials = ["AK", "BN", "CM", "DS", "EF"];
  return (
    <div className="flex -space-x-2 mt-4">
      {initials.map((s, i) => (
        <div
          key={i}
          className={`w-9 h-9 rounded-full ${colors[i]} border-2 border-white dark:border-[#0a0f1e]
            flex items-center justify-center text-xs font-bold text-white`}
        >
          {s}
        </div>
      ))}
      <div
        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 border-2 border-white dark:border-[#0a0f1e]
        flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-300"
      >
        +8
      </div>
    </div>
  );
}

/* ── Card wrapper ─────────────────────────────────────────── */
function Card({ children, className = "" }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`group relative p-5 sm:p-6 rounded-2xl
        bg-white dark:bg-white/[0.03]
        border border-gray-200 dark:border-white/10
        hover:border-blue-400/60 dark:hover:border-blue-500/50
        hover:shadow-lg hover:shadow-blue-500/8
        hover:-translate-y-0.5
        transition-all duration-300 overflow-hidden
        ${className}`}
    >
      {/* Subtle hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
        bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.06),_transparent_60%)]
        dark:bg-[radial-gradient(ellipse_at_top_left,_rgba(59,130,246,0.08),_transparent_60%)]
        pointer-events-none"
      />
      {children}
    </motion.div>
  );
}

function IconBadge({ icon: Icon, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50   dark:bg-blue-500/15   text-blue-600   dark:text-blue-400",
    violet:
      "bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400",
    emerald:
      "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    amber:
      "bg-amber-50  dark:bg-amber-500/15  text-amber-600  dark:text-amber-400",
  };
  return (
    <div className={`p-2 rounded-xl w-fit mb-4 ${colors[color]}`}>
      <Icon className="w-5 h-5" strokeWidth={1.5} />
    </div>
  );
}

/* ── Main section ─────────────────────────────────────────── */
export function BentoGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            Features
          </span>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight"
            style={{ fontFamily: "var(--font-cal-sans), Georgia, serif" }}
          >
            Your properties,{" "}
            <span className="bg-gradient-to-r from-primary to-sky-500 dark:to-sky-300 bg-clip-text text-transparent">
              in your pocket
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            All-in-one property management tools designed for landlords. Handle
            rentals, tenants, and maintenance from one dashboard.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* 1 — Rent Collection (wide) */}
          <Card className="sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <IconBadge icon={Activity} color="blue" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Automated Rent Collection
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Collect rent via M-Pesa, Mixx by Yas, Airtel Money &amp; Azam
                  Pesa with instant notifications and full payment tracking.
                </p>
              </div>
              <SystemStatus />
            </div>
            <PaymentList />
          </Card>

          {/* 2 — Tenant Management */}
          <Card>
            <IconBadge icon={Users} color="violet" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Tenant Management
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage leases, maintenance requests, and complete tenant profiles
              all in one place.
            </p>
            <TenantAvatars />
            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              13 active tenants · 2 leases expiring soon
            </div>
          </Card>

          {/* 3 — Analytics */}
          <Card>
            <IconBadge icon={BarChart3} color="emerald" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Real-Time Analytics
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              Track income, expenses, and property performance with detailed
              reports.
            </p>
            <div className="space-y-3">
              <AnalyticsBar
                label="Revenue"
                value={173500}
                max={200000}
                color="bg-blue-500"
              />
              <AnalyticsBar
                label="Expenses"
                value={48200}
                max={200000}
                color="bg-violet-400"
              />
              <AnalyticsBar
                label="Net"
                value={125300}
                max={200000}
                color="bg-emerald-500"
              />
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +12% vs last month
            </div>
          </Card>

          {/* 4 — Multi-Property (wide) */}
          <Card className="sm:col-span-2">
            <IconBadge icon={Building2} color="amber" />
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Multi-Property Support
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Manage multiple properties and units from a single unified
                  dashboard with consolidated controls and reporting.
                </p>
              </div>
              {/* Property pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Kariakoo Block A", units: 12 },
                  { name: "Mikocheni Villas", units: 4 },
                  { name: "Masaki Suites", units: 8 },
                  { name: "Kinondoni Apts", units: 6 },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium
                      bg-gray-100 dark:bg-white/8
                      text-gray-700 dark:text-gray-300
                      border border-gray-200 dark:border-white/10"
                  >
                    {p.name}
                    <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                      {p.units}u
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary strip */}
            <div className="mt-6 grid grid-cols-3 gap-3 pt-5 border-t border-gray-100 dark:border-white/8">
              {[
                { label: "Properties", value: "4" },
                { label: "Total Units", value: "30" },
                { label: "Occupancy", value: "93%" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {s.value}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
