import type { Config } from "tailwindcss";
/* eslint-disable @typescript-eslint/no-require-imports */
export default {
    darkMode: "class",
	content: [
		'./app/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./lib/**/*.{ts,tsx}',
		'./node_modules/@shadcn/**/*.{ts,tsx}',
	  ],
	theme: {
	  container: {
		center: true,
		padding: "2rem",
		screens: {
		  "2xl": "1400px",
		},
	  },
	  extend: {
		colors: {
		  border: "hsl(var(--border))",
		  input: "hsl(var(--input))",
		  ring: "hsl(var(--ring))",
		  background: "hsl(var(--background))",
		  foreground: "hsl(var(--foreground))",
		  primary: {
			DEFAULT: "hsl(var(--primary))",
			foreground: "hsl(var(--primary-foreground))",
		  },
		  secondary: {
			DEFAULT: "hsl(var(--secondary))",
			foreground: "hsl(var(--secondary-foreground))",
		  },
		  destructive: {
			DEFAULT: "hsl(var(--destructive))",
			foreground: "hsl(var(--destructive-foreground))",
		  },
		  muted: {
			DEFAULT: "hsl(var(--muted))",
			foreground: "hsl(var(--muted-foreground))",
		  },
		  accent: {
			DEFAULT: "hsl(var(--accent))",
			foreground: "hsl(var(--accent-foreground))",
		  },
		  popover: {
			DEFAULT: "hsl(var(--popover))",
			foreground: "hsl(var(--popover-foreground))",
		  },
		  card: {
			DEFAULT: "hsl(var(--card))",
			foreground: "hsl(var(--card-foreground))",
		  },
		  // WaPangajiKiganjani brand colors
		  "brand-primary": "hsl(var(--brand-primary))",
		  "brand-secondary": "hsl(var(--brand-secondary))",
		  "brand-success": "hsl(var(--brand-success))",
		  "brand-warning": "hsl(var(--brand-warning))",
		  "brand-error": "hsl(var(--brand-error))",
		},
		borderRadius: {
		  lg: "var(--radius)",
		  md: "calc(var(--radius) - 2px)",
		  sm: "calc(var(--radius) - 4px)",
		},
		boxShadow: {
		  // Matches your material UI shadows
		  card: "0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.07)",
		  "card-hover": "0px 4px 8px rgba(0, 0, 0, 0.1), 0px 8px 16px rgba(0, 0, 0, 0.1)",
		  "dark-card": "0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.3)",
		  "dark-card-hover": "0px 4px 8px rgba(0, 0, 0, 0.3), 0px 8px 16px rgba(0, 0, 0, 0.4)",
		},
		fontFamily: {
		  sans: ["var(--font-futura)", "sans-serif"],
		},
		keyframes: {
		  "accordion-down": {
			from: { height: "0px" },
			to: { height: "var(--radix-accordion-content-height)" },
		  },
		  "accordion-up": {
			from: { height: "var(--radix-accordion-content-height)" },
			to: { height: "0" },
		  },
		},
		animation: {
		  "accordion-down": "accordion-down 0.2s ease-out",
		  "accordion-up": "accordion-up 0.2s ease-out",
		},
		// Add specific animation transitions from your MUI theme
		transitionProperty: {
		  height: "height",
		  spacing: "margin, padding",
		},
		// Adding transitions to match Material UI
		transitionTimingFunction: {
		  "material-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
		  "material-enter": "cubic-bezier(0, 0, 0.2, 1)",
		  "material-leave": "cubic-bezier(0.4, 0, 1, 1)",
		},
		transitionDuration: {
		  "material-shortest": "150ms",
		  "material-shorter": "200ms",
		  "material-short": "250ms",
		  "material-standard": "300ms",
		  "material-complex": "375ms",
		  "material-enteringScreen": "225ms",
		  "material-leavingScreen": "195ms",
		},
	  },
	},
  plugins: [
	require("tailwindcss-animate"),
	require("@tailwindcss/typography"),
	require("@tailwindcss/forms"),
	],
} satisfies Config;
