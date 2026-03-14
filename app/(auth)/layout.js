// app/(auth)/layout.jsx
import { ToastProvider } from "@/components/ui/toast-provider";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <ToastProvider />
      <div className="">
        {children}
      </div>
    </div>
  );
}