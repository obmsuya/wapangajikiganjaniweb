"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

const footerLinks = {
  Product: ["Features", "Pricing", "Mobile App"],
  // Resources: ["Help Center", "Property Guides", "Blog", "Community", "API Docs"],
  Company: ["Contact"],
  Legal: ["Privacy", "Terms"],
}

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer ref={ref} className="bg-background">
      <div className="border-t border-border max-w-6xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-8"
        >
          {/* Brand */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-semibold text-foreground">Wapangaji Kiganjani</span>
            </a>
            <p className="text-sm text-muted-foreground mb-4">Simplifying property management for landlords everywhere.</p>
            {/* System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-300">
              <span className="w-2 h-2 rounded-full bg-green-500 pulse-glow" />
              <span className="text-xs text-blue-700">System Operational</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-[#2B4B80] transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Wapangaji Kiganjani, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-[#2B4B80] transition-colors">
              Instagram
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#2B4B80] transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-[#2B4B80] transition-colors">
              Contact
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
