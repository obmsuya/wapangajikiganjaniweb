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
  ChevronDown,
  ChevronLeft,
  Handshake,
  Banknote,
  Bell,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active,
  children,
  isSubmenuOpen,
  toggleSubmenu,
  proBadge = false,
  isCollapsed,
}) => {
  const hasSubmenu = Array.isArray(children) && children.length > 0;

  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button
          onClick={toggleSubmenu}
          className={cn(
            "w-full flex items-center gap-2 rounded-full text-sm font-medium transition-all duration-200",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            active && "bg-sidebar-accent text-white",
            isCollapsed && "justify-center px-2",
          )}
          title={isCollapsed ? label : ""}
        >
          <Icon size={20} className="shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{label}</span>
              <ChevronDown
                size={16}
                className={cn(
                  "transition-transform shrink-0 text-sidebar-foreground/50",
                  isSubmenuOpen && "rotate-180",
                )}
              />
            </>
          )}
        </button>

        {isSubmenuOpen && !isCollapsed && (
          <div className="ml-9 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3">
            {children.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center py-2 px-2 text-sm rounded-full transition-colors",
                  "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                  item.active && "text-sidebar-foreground font-medium",
                )}
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
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-full text-sm font-medium transition-all duration-200 mb-1",
        "text-sidebar-foreground/70 hover:text-primary hover:bg-sidebar-primary/15",
        active &&
          "bg-sidebar-primary hover:bg-sidebar-primary/90 text-white hover:text-white shadow-sm",
        isCollapsed && "justify-center px-2",
      )}
      title={isCollapsed ? label : ""}
    >
      <Icon size={20} className="shrink-0" />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {proBadge && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-0.5 shrink-0 border-0">
              <Crown className="w-3 h-3 mr-1" />
              PRO
            </Badge>
          )}
        </>
      )}
    </Link>
  );
};

const BottomTabItem = ({ icon: Icon, label, href, active }) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 p-1 min-w-[64px] transition-all duration-200",
        "text-muted-foreground",
        active && "text-primary",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
          active && "bg-primary/10",
        )}
      >
        <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      </div>
      <span className={cn("text-[8px] font-medium", active && "font-semibold")}>
        {label}
      </span>
    </Link>
  );
};

export function CustomSidebar({ role = "admin", user }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenSubmenus({});
    }
  };

  const getRoutes = () => {
    if (user?.user_type === "landlord" || role === "landlord") {
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
        },
        {
          label: "Managers",
          icon: Users,
          href: "/landlord/managers",
          active: pathname.includes("/landlord/managers"),
        },
      ];
    }

    if (user?.user_type === "tenant" || role === "tenant") {
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

    if (user?.user_type === "manager" || role === "manager") {
      const routes = [
        {
          label: "Properties",
          icon: Building2,
          href: "/manager/properties",
          active: pathname.includes("/manager/properties"),
        },
      ];

      // Only show Maintenance if manager has the permission
      if (user?.can_manage_maintenance) {
        routes.push({
          label: "Maintenance",
          icon: Wrench,
          href: "/manager/maintenance",
          active: pathname === "/manager/maintenance",
        });
      }

      // Only show Payments if manager has the permission
      if (user?.can_collect_payments) {
        routes.push({
          label: "Payments",
          icon: Banknote,
          href: "/manager/payments",
          active: pathname.includes("/manager/payments"),
        });
      }

      return routes;
    }

    if (user?.user_type === "partner" || role === "partner") {
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
        label: "Users",       
        icon: Users,
        href: "/admin/users",
        active: pathname.includes("/admin/users"),
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
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  // Get primary routes for bottom tabs (max 5)
  const getBottomTabRoutes = () => {
    const primaryRoutes = routes.filter((r) => !r.children).slice(0, 4);
    // Add a profile/more tab
    return [
      ...primaryRoutes,
      {
        label: "Profile",
        icon: User,
        href: "/profile",
        active: pathname.includes("/profile"),
      },
    ].slice(0, 5);
  };

  const bottomTabRoutes = getBottomTabRoutes();

  const getUserPortalTitle = () => {
    if (user?.user_type === "tenant") return "Tenant Portal";
    if (user?.user_type === "landlord") return "Landlord Portal";
    if (user?.user_type === "manager") return "Manager Portal";
    return "Admin Portal";
  };

  console.log(user);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex border bg-sidebar fixed inset-y-0 left-4 z-30 flex-col rounded-4xl transition-all duration-300 ease-in-out my-4",
          sidebarWidth,
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between h-16 px-4",
            isCollapsed && "px-2",
          )}
        >
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-sidebar-foreground truncate">
                Wapangaji
              </h2>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {getUserPortalTitle()}
              </p>
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className={cn(
              "p-2 rounded-full hover:bg-primary/30 transition-colors text-sidebar-foreground/60 hover:text-primary border hover:border-primary",
              isCollapsed && "mx-auto",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={18}
              className={cn(
                "transition-transform",
                isCollapsed && "rotate-180",
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn("flex-1 overflow-y-auto p-4", isCollapsed && "px-2")}
        >
          {routes.map((route) => (
            <SidebarItem
              key={route.href || route.label}
              icon={route.icon}
              label={route.label}
              href={route.href}
              active={route.active}
              isSubmenuOpen={
                route.submenuKey ? openSubmenus[route.submenuKey] : false
              }
              toggleSubmenu={() =>
                route.submenuKey && toggleSubmenu(route.submenuKey)
              }
              children={route.children}
              proBadge={route.proBadge}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-full hover:bg-primary/30 transition-colors cursor-pointer",
              isCollapsed && "justify-center hover:bg-transparent",
            )}
          >
            <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-sm font-semibold shrink-0">
              {user?.full_name?.charAt(0)}
            </div>
            {!isCollapsed && (
              <Link href="/profile" className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.phone_number || "user@example.com"}
                </p>
              </Link>
            )}
            {!isCollapsed && (
              <button className="p-1.5 rounded-xl hover:bg-blue-600/50 transition-colors text-sidebar-foreground/60">
                <Bell size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop Spacer */}
      <div
        className={cn(
          "hidden md:block",
          sidebarWidth,
          "transition-all duration-300 ease-in-out",
        )}
      />

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar dark:bg-[#1C1C1E] border-t border-card-border">
        <div className="flex items-center justify-around pb-safe">
          {bottomTabRoutes.map((route) => (
            <BottomTabItem
              key={route.href}
              icon={route.icon}
              label={route.label}
              href={route.href}
              active={route.active}
            />
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </>
  );
}
