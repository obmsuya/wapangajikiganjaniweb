// app/(dashboard)/layout.jsx
import { CustomSidebar } from "@/components/custom-sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <CustomSidebar role="admin" />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}