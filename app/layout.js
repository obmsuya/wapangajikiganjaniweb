// app/layout.jsx
"use client";
import { Quicksand } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { usePathname } from "next/navigation";
import { Toaster } from "@/components/ui/sonner"

const comicNeue = Quicksand({
  variable: "--font-quicksand",
  weight: ["300", "400","600", "700"],
  subsets: ["latin"],
});

// export const metadata = {
//   title: "Wapangaji Kiganjani",
//   description: "Property management system for landlords",
// };

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={comicNeue.className}>
        {isHome ? (
          children
        ) : (
          <ThemeProvider 
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}