"use client";

import { Sidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 border-r">
        {/* Add your sidebar content here */}
        <div className="p-4">
          <h2 className="text-lg font-semibold">Landlord Dashboard</h2>
          <nav className="mt-4 space-y-2">
            {/* Add your navigation items here */}
          </nav>
        </div>
        <div className="absolute bottom-4 left-4">
          <ThemeToggle />
        </div>
      </Sidebar>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}