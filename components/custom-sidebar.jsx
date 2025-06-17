// components/sidebar/custom-sidebar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserRound, 
  CreditCard, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  Sun,
  Moon,
  Handshake,
  LogOut
} from "lucide-react";
import AuthService from "@/services/auth";

// Keep your exact SidebarItem component unchanged
const SidebarItem = ({ icon: Icon, label, href, active, children, isSubmenuOpen, toggleSubmenu }) => {
  const hasSubmenu = Array.isArray(children) && children.length > 0;

  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button 
          onClick={toggleSubmenu}
          className={`w-full sidebar-link ${active ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span className="flex-1 text-left">{label}</span>
          <ChevronDown size={16} className={`transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isSubmenuOpen && (
          <div className="ml-8 mt-1 space-y-1 border-l-2 border-sidebar-border pl-2">
            {children.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`sidebar-link text-sm py-1.5 ${item.active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={href} className={`sidebar-link mb-1 ${active ? 'active' : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

// Main Sidebar Component - Only modified the routes logic
export function CustomSidebar({ role = "admin", user }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push('/login');
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      router.push('/login');
    }
  };

  // ONLY CHANGE: Updated routes based on user type
  const getRoutes = () => {
    if (user?.user_type === 'landlord' || role === 'landlord') {
      return [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/landlord/dashboard",
          active: pathname === "/landlord/dashboard",
        },
        {
          label: "Properties",
          icon: Building2,
          href: "/landlord/properties",
          active: pathname.includes("/landlord/properties"),
        },
        {
          label: "Tenants",
          icon: UserRound,
          href: "/landlord/tenants",
          active: pathname.includes("/landlord/tenants"),
        },
        {
          label: "Payments",
          icon: CreditCard,
          href: "/landlord/payments",
          active: pathname.includes("/landlord/payments"),
        },
        {
          label: "Settings",
          icon: Settings,
          href: "/landlord/settings",
          active: pathname.includes("/landlord/settings"),
        },
      ];
    }

    // Default admin routes (your original)
    return [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin/dashboard",
        active: pathname === "/admin/dashboard",
      },
      {
        label: "Users",
        icon: Users,
        href: "#",
        active: pathname.includes("/admin/users"),
        submenuKey: "users",
        submenu: [
          {
            label: "All Users",
            href: "/admin/users",
            active: pathname === "/admin/users",
          },
          {
            label: "Landlords",
            href: "/admin/users/landlords",
            active: pathname === "/admin/users/landlords",
          }
        ]
      },
      {
        label: "Properties",
        icon: Building2,
        href: "/admin/properties",
        active: pathname.includes("/admin/properties"),
      },
      {
        label: "Partners",
        icon: Handshake,
        href: "/admin/partner",
        active: pathname.includes("/admin/partner"),
      },
      {
        label: "Payments",
        icon: CreditCard,
        href: "/admin/payments",
        active: pathname.includes("/admin/payments"),
      },
      {
        label: "Settings",
        icon: Settings,
        href: "/admin/settings",
        active: pathname.includes("/admin/settings"),
      },
    ];
  };

  const routes = getRoutes();

  // Keep your exact structure and styling
  return (
    <>
      {/* Mobile Trigger Button */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed z-40 bottom-4 right-4 md:hidden bg-primary text-primary-fg p-3 rounded-full shadow-lg"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-sidebar bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 border-b border-sidebar-border">
            <div>
              <h2 className="text-xl font-bold">Wapangaji Kiganjani</h2>
              <p className="text-sm text-sidebar-fg/70">
                {user?.user_type === 'landlord' ? "Landlord Portal" : "Admin Portal"}
              </p>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="p-1 rounded-md hover:bg-sidebar-hover"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {routes.map((route) => (
              <SidebarItem
                key={route.href || route.label}
                icon={route.icon}
                label={route.label}
                href={route.href}
                active={route.active}
                isSubmenuOpen={route.submenuKey ? openSubmenus[route.submenuKey] : false}
                toggleSubmenu={() => route.submenuKey && toggleSubmenu(route.submenuKey)}
                children={route.submenu}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sidebar-hover flex items-center justify-center">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.full_name || "User Name"}</p>
                  <p className="text-xs text-sidebar-fg/70">
                    {user?.user_type === 'landlord' ? "Landlord" : "Administrator"}
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-md bg-sidebar-hover text-sidebar-fg hover:bg-sidebar-active hover:text-sidebar-active-fg transition-colors"
                aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar - Keep exactly as yours */}
      <aside className="hidden md:block min-w-sidebar max-w-sidebar w-sidebar h-screen border-r border-sidebar-border bg-sidebar">
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-sidebar-border">
            <h2 className="text-xl font-bold">Wapangaji Kiganjani</h2>
            <p className="text-sm text-sidebar-fg/70">
              {user?.user_type === 'landlord' ? "Landlord Portal" : "Admin Portal"}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {routes.map((route) => (
              <SidebarItem
                key={route.href || route.label}
                icon={route.icon}
                label={route.label}
                href={route.href}
                active={route.active}
                isSubmenuOpen={route.submenuKey ? openSubmenus[route.submenuKey] : false}
                toggleSubmenu={() => route.submenuKey && toggleSubmenu(route.submenuKey)}
                children={route.submenu}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sidebar-hover flex items-center justify-center">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.full_name || "User Name"}</p>
                  <p className="text-xs text-sidebar-fg/70">
                    {user?.user_type === 'landlord' ? "Landlord" : "Administrator"}
                  </p>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-md bg-sidebar-hover text-sidebar-fg hover:bg-sidebar-active hover:text-sidebar-active-fg transition-colors"
                aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}