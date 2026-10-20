import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, Bookmark, Home, LogOut, Search, Shield, User } from "lucide-react";
import { Logo, UserAvatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/cn";

const nav = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/home", label: "Home", icon: Home },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-52 shrink-0 flex-col border-r bg-card p-4 md:flex">
        <div className="px-2 py-1">
          <Logo />
        </div>
        <nav className="mt-8 space-y-1">
          {[...nav, ...(user?.role === "admin" ? [{ to: "/admin/accounts", label: "Admin", icon: Shield }] : [])].map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary-foreground transition hover:bg-muted",
                  isActive && "bg-accent font-medium text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-secondary-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-card px-6">
          <div className="mx-auto flex h-10 w-full max-w-md items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              placeholder="Search people or posts"
              className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="relative text-muted-foreground" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <Link to="/profile" className="flex items-center gap-2">
            <UserAvatar size={30} src={user?.avatar} />
            <div className="hidden text-xs leading-tight sm:block">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-muted-foreground">@{user?.username}</p>
            </div>
          </Link>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
