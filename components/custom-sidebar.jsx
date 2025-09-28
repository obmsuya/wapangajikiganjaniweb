// components/custom-sidebar.jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Wrench, 
  Crown, 
  Settings, 
  Menu, 
  X,
  ChevronDown,
  ChevronLeft,
  Handshake,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationSidebarFooter from "./sidebar/NotificationSidebarFooter";

const SidebarItem = ({ icon: Icon, label, href, active, children, isSubmenuOpen, toggleSubmenu, proBadge = false, isCollapsed }) => {
  const hasSubmenu = Array.isArray(children) && children.length > 0;

  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button 
          onClick={toggleSubmenu}
          className={`w-full sidebar-link group ${active ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? label : ''}
        >
          <Icon size={20} className="shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronDown size={16} className={`transition-transform shrink-0 ${isSubmenuOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        
        {isSubmenuOpen && !isCollapsed && (
          <div className="ml-8 mt-1 space-y-1 border-l-2 border-sidebar-border pl-3">
            {children.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`sidebar-link text-sm py-2 ${item.active ? 'active' : ''}`}
              >
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link 
      href={href} 
      className={`sidebar-link mb-1 group ${active ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : ''}
    >
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {proBadge && (
            <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs px-2 py-0.5 ml-2 shrink-0">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
        </>
      )}
    </Link>
  );
};

export function CustomSidebar({ role = "admin", user }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenSubmenus({});
    }
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
          label: "Payments",
          icon: Banknote,
          href: "/landlord/payments",
          active: pathname === "/landlord/payments",
        },
        {
          label: "Maintenance",
          icon: Wrench,
          href: "/landlord/maintenance",
          active: pathname === "/landlord/maintenance",
        },

        {
          label: "Wapangaji",
          icon: Crown,
          href: "/landlord/subscriptions",
          active: pathname.includes("/landlord/subscriptions"),
          proBadge: true,
        },
        {
          label: "Confirm Payments",
          icon: Handshake,
          href: "/landlord/payments/confirmations",
          active: pathname.includes("/landlord/payments/confirmations"),
        }
      ];
    }

    if (user?.user_type === 'tenant' || role === 'tenant') {
      return [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/tenant",
          active: pathname === "/tenant" || pathname === "/tenant/",
        },
        {
          label: "Maintenance",
          icon: Wrench,
          href: "/tenant/maintenance",
          active: pathname === "/tenant/maintenance",
        },

      ];
    }

    if (user?.user_type === 'partner' || role === 'partner') {
      return [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/partner",
          active: pathname === "/partner",
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
        children: [
          {
            label: "All Users",
            href: "/admin/users",
            active: pathname === "/admin/users",
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
        href: "/profile",
        active: pathname.includes("/profile"),
      },
    ];
  };

  const routes = getRoutes();
  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  const getUserPortalTitle = () => {
    if (user?.user_type === 'tenant') return "Tenant Portal";
    if (user?.user_type === 'landlord') return "Landlord Portal";
    return "Admin Portal";
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between p-4 border-b border-sidebar-border ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        {(!isCollapsed || isMobile) && (
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold truncate">Wapangaji Kiganjani</h2>
            <p className="text-sm text-sidebar-fg/70 truncate">
              {getUserPortalTitle()}
            </p>
          </div>
        )}
        
        {isMobile ? (
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-md hover:bg-sidebar-hover ml-2"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        ) : (
          <button 
            onClick={toggleCollapse}
            className={`p-1.5 rounded-md hover:bg-sidebar-hover transition-colors ${isCollapsed ? 'mx-auto' : 'ml-2'}`}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={18} className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto p-3 space-y-1 ${isCollapsed && !isMobile ? 'px-2' : ''}`}>
        {routes.map((route) => (
          <SidebarItem
            key={route.href || route.label}
            icon={route.icon}
            label={route.label}
            href={route.href}
            active={route.active}
            isSubmenuOpen={route.submenuKey ? openSubmenus[route.submenuKey] : false}
            toggleSubmenu={() => route.submenuKey && toggleSubmenu(route.submenuKey)}
            children={route.children}
            proBadge={route.proBadge}
            isCollapsed={isCollapsed && !isMobile}
          />
        ))}
      </nav>

      {(!isCollapsed || isMobile) && (
        <div className="border-t border-sidebar-border">
          <NotificationSidebarFooter user={user} isCollapsed={false} />
        </div>
      )}
      
      {(isCollapsed && !isMobile) && (
        <div className="border-t border-sidebar-border">
          <NotificationSidebarFooter user={user} isCollapsed={true} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="fixed z-40 bottom-4 right-4 md:hidden bg-primary text-primary-fg p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <div 
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 md:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(true)}
      </aside>

      <aside className={`hidden md:flex fixed inset-y-0 left-0 z-30 ${sidebarWidth} bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out`}>
        {renderSidebarContent(false)}
      </aside>

      <div className={`hidden md:block ${sidebarWidth} transition-all duration-300 ease-in-out`} />
    </>
  );
}