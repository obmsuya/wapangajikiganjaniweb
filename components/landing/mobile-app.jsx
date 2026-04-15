"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Bell, Shield, Zap } from "lucide-react";

const ease = [0.22, 1, 0.36, 1];

const APP_SCREENSHOT_1 = "/images/screenshots/welcome.jpeg";
const APP_SCREENSHOT_2 = "/images/screenshots/properties.jpeg";

const highlights = [
  { icon: Bell,   label: "Instant Notifications", desc: "Get paid alerts the moment rent lands" },
  { icon: Shield, label: "Secure & Encrypted",     desc: "Bank-grade security for all transactions" },
  { icon: Zap,    label: "Works Offline",           desc: "Core features available without internet" },
];

function PhoneMockup({ screenshot, alt, rotate, right, zIndex, shadow }) {
  return (
    <div
      className="absolute"
      style={{
        ...(right !== undefined ? { right } : { left: 0 }),
        top: right !== undefined ? 10 : 60,
        zIndex,
        transform: `rotate(${rotate}deg)`,
        transformOrigin: "bottom center",
      }}
    >
      <div
        className="relative w-[190px] sm:w-[210px] rounded-[2.4rem] bg-zinc-900 p-[9px] ring-1 ring-white/10"
        style={{ boxShadow: shadow }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 rounded-b-2xl z-20 flex items-center justify-center">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-16 w-[3px] h-6  bg-zinc-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-24 w-[3px] h-10 bg-zinc-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-10 bg-zinc-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-24 w-[3px] h-14 bg-zinc-700 rounded-r-sm" />
        {/* Screen */}
        <div className="w-full overflow-hidden rounded-[1.9rem] bg-black" style={{ aspectRatio: "9/19.5" }}>
          <img src={screenshot} alt={alt} className="w-full h-full object-cover object-top" />
        </div>
      </div>
    </div>
  );
}

export function MobileApp() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="mobileApp"
      className="relative py-24 px-4 overflow-hidden bg-background"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none
        bg-[radial-gradient(ellipse_120%_70%_at_80%_50%,_#dbeafe_0%,_transparent_65%)]
        dark:bg-[radial-gradient(ellipse_100%_60%_at_80%_50%,_#1e3a6e40_0%,_transparent_65%)]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.175] dark:opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-6xl px-4 mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Content ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6
              bg-blue-50 border border-blue-200 text-blue-700
              dark:bg-blue-900/40 dark:border-blue-700/60 dark:text-blue-300">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">Mobile App</span>
            </div>

            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4
                text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-cal-sans), Georgia, serif" }}
            >
              Manage your properties{" "}
              <span className="bg-gradient-to-r from-primary to-sky-500 dark:to-sky-500 bg-clip-text text-transparent">
                on the go
              </span>
            </h2>

            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-md">
              Download Wapangaji Kiganjani and manage your properties anytime,
              anywhere. Collect rent, track tenants, and get real-time
              notifications right from your phone.
            </p>

            {/* Highlights */}
            <ul className="space-y-4 mb-10">
              {highlights.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/15 shrink-0">
                    <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex gap-3 max-w-xs">
              <Button
                className="rounded-full px-6 h-11 font-semibold text-sm gap-2
                 text-white shadow-lg shadow-blue-500/25"
                asChild
              >
                <a
                  href="https://play.google.com/store/apps/details?id=com.faltasiinnovations.wapangajikiganjani"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4" />
                  Download on Google Play
                </a>
              </Button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
              Available on Android · All features included
            </p>
          </motion.div>

          {/* ── Right: Phone mockups ───────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="flex justify-center items-center"
          >
            {/* Glow behind phones */}
            <div className="absolute w-64 h-64 rounded-full
              bg-blue-300/30 blur-[60px]
              dark:bg-blue-600/15 dark:blur-[80px]
              pointer-events-none" />

            <div className="relative" style={{ width: "320px", height: "520px" }}>
              <PhoneMockup
                screenshot={APP_SCREENSHOT_1}
                alt="Welcome screen"
                rotate={-7}
                zIndex={1}
                shadow="0 20px 50px rgba(0,0,0,0.25)"
              />
              <PhoneMockup
                screenshot={APP_SCREENSHOT_2}
                alt="Properties screen"
                rotate={6}
                right={0}
                zIndex={2}
                shadow="-12px 20px 56px rgba(0,0,0,0.4)"
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}