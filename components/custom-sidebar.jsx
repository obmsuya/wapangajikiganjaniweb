// components/custom-sidebar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserRound, 
  Crown, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  Handshake,
  Banknote,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationSidebarFooter from "./sidebar/NotificationSidebarFooter";
import ProfileAvatar from "./ui/ProfileAvatar";

const SidebarItem = ({ icon: Icon, label, href, active, children, isSubmenuOpen, toggleSubmenu, proBadge = false }) => {
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
      <span className="flex-1">{label}</span>
      {proBadge && (
        <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs px-2 py-0.5 ml-2">
          <Crown className="w-3 h-3 mr-1" />
          PRO
        </Badge>
      )}
    </Link>
  );
};

export function CustomSidebar({ role = "admin", user }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getRoutes = () => {
    if (user?.user_type === 'landlord' || role === 'landlord') {
      return [
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
          label: "Wapangaji",
          icon: Crown,
          href: "/landlord/subscriptions/plans",
          active: pathname.includes("/landlord/subscriptions"),
          proBadge: true,
        },
        {
          label: "Payments",
          icon: Banknote,
          href: "/landlord/payments",
          active: pathname.includes("/landlord/payments"),
        },
        {
          label: "Profile",
          icon: User,
          href: "/profile",
          active: pathname.includes("/profile"),
        },
      ];
    }

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
        icon: Crown,
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
                proBadge={route.proBadge}
              />
            ))}
          </nav>

          {/* Enhanced Sidebar Footer with Notifications */}
          <NotificationSidebarFooter 
            user={user} 
            onLogout={() => setIsMobileOpen(false)}
          />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block min-w-sidebar max-w-sidebar w-sidebar h-screen border-r border-sidebar-border bg-sidebar">
        <div className="flex flex-col h-full bg-sidebar-bg text-sidebar-text">
          {/* Profile Section */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <ProfileAvatar user={user} className="h-10 w-10" />
              <div>
                <p className="font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
              </div>
            </div>
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
                proBadge={route.proBadge}
              />
            ))}
          </nav>

          {/* Enhanced Sidebar Footer with Notifications */}
          <NotificationSidebarFooter user={user} />
        </div>
      </aside>
    </>
  );
}