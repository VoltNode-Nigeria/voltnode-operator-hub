import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, LayoutDashboard, Zap, History, Building2, Wallet, AlertTriangle, FileText, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/sessions/live", label: "Live Sessions", icon: Zap },
  { to: "/sessions/history", label: "Session History", icon: History },
  { to: "/stations", label: "My Stations", icon: Building2 },
  { to: "/revenue", label: "Revenue", icon: Wallet },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Reports", icon: FileText },
];

const titleMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/sessions/live": "Live Sessions",
  "/sessions/history": "Session History",
  "/stations": "My Stations",
  "/revenue": "Revenue",
  "/alerts": "Alerts",
  "/reports": "Reports",
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title =
    titleMap[location.pathname] ||
    (location.pathname.startsWith("/stations/") ? "Bay Management" : "VoltNode");

  const initials = (user?.name || user?.email || "OP")
    .split(/[\s@.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className="w-60 shrink-0 bg-navy text-navy-foreground flex flex-col fixed inset-y-0 left-0">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="text-xl font-bold tracking-wide">
            <span className="text-white">VOLT</span>
            <span className="text-primary">NODE</span>
          </div>
          <div className="text-xs text-white/60 mt-1">Operator Dashboard</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-sm font-medium truncate">{user?.name || "Operator"}</div>
          <div className="text-xs text-white/60 truncate mb-3">{user?.email}</div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-60 min-h-screen flex flex-col">
        <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-navy">{title}</h1>
          <div className="flex items-center gap-4">
            <button className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </button>
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium">{user?.name || "Operator"}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold">
              {initials || "OP"}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}