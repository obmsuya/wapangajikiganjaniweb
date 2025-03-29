// app/layout.tsx
import "./globals.css"
import { ThemeProvider } from '@/app/components/theme-provider';
import { futura } from '@/lib/fonts';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: 'Wapangaji Kiganjani Admin Dashboard',
  description: 'Property management system admin dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
        <script src="https://unpkg.com/@tailwindcss/browser@4"></script>
      </head> */}
      <body suppressHydrationWarning className={futura.className}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="wapangajiki-theme"
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}