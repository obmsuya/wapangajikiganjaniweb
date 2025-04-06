// app/layout.jsx
import { Comic_Neue } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Wapangaji Kiganjani",
  description: "Property management system for landlords",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={comicNeue.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}