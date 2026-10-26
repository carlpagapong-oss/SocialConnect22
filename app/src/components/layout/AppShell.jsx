import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bookmark, Home, LogOut, Search, Shield, User } from "lucide-react";
import { Logo, UserAvatar } from "@/components/common/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/userService";
import { cn } from "@/utils/cn";

const RECENT_SEARCHES_KEY = "socialconnect:recent-searches";
const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [directory, setDirectory] = useState([]);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const searchRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideMenus = (event) => {
      if (!searchRef.current?.contains(event.target)) setSearchOpen(false);
      if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false);
    };
    document.addEventListener("pointerdown", handleOutsideMenus);
    return () => document.removeEventListener("pointerdown", handleOutsideMenus);
  }, []);

  useEffect(() => {
    userService
      .getDirectory()
      .then((data) => setDirectory(data.users || []))
      .catch(() => setDirectory([]));
  }, []);

  const searchResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return directory
      .filter((person) =>
        [person.name, person.username, person.email].some((value) =>
          String(value || "").toLowerCase().includes(needle),
        ),
      )
      .slice(0, 5);
  }, [directory, query]);

  const openProfile = (person) => {
    const nextRecent = [
      person,
      ...recentSearches.filter((item) => item.username !== person.username),
    ].slice(0, 5);
    setRecentSearches(nextRecent);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(nextRecent));
    setQuery("");
    setSearchOpen(false);
    navigate(person.username === user?.username ? "/profile" : `/user/${person.username}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderPerson = (person) => (
    <button
      key={person.id}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => openProfile(person)}
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
    >
      <UserAvatar size={34} src={person.avatar} />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{person.name}</span>
        <span className="block truncate text-xs text-muted-foreground">@{person.username}</span>
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 px-3 shadow-sm backdrop-blur sm:px-4 md:px-8">
        <div className="relative flex min-h-16 w-full items-center gap-2 py-2 sm:gap-4 md:h-16 md:flex-nowrap md:py-0">
          <div className="flex min-w-0 flex-1 items-center gap-2 pl-1 sm:gap-4 sm:pl-3 md:pl-4">
            <Link to="/home" className="shrink-0">
              <Logo />
            </Link>
            <div
              ref={searchRef}
              className="relative flex h-10 min-w-0 max-w-xs flex-1 items-center gap-2 rounded-full bg-muted px-3 text-sm text-muted-foreground"
            >
              <Search className="h-4 w-4" />
              <input
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search people"
                className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {searchOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border bg-card p-2 text-foreground shadow-lg">
                  {query.trim() ? (
                    searchResults.length > 0 ? (
                      searchResults.map(renderPerson)
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">No people found.</p>
                    )
                  ) : recentSearches.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between px-2 py-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Recent searches
                        </p>
                        <button type="button" onClick={clearRecentSearches} className="text-xs text-primary">
                          Clear
                        </button>
                      </div>
                      {recentSearches.map(renderPerson)}
                    </>
                  ) : (
                    <p className="px-2 py-3 text-sm text-muted-foreground">Search for a person.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          <nav className="order-3 flex h-10 w-full items-center justify-center gap-1 md:absolute md:left-1/2 md:top-0 md:order-none md:h-16 md:w-auto md:-translate-x-1/2">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  cn(
                    "flex h-full min-w-12 items-center justify-center gap-2 border-b-2 border-transparent px-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground sm:min-w-20 sm:px-3",
                    isActive && "border-primary font-semibold text-primary",
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin/accounts"
                title="Admin"
                className={({ isActive }) =>
                  cn(
                    "flex h-full items-center justify-center border-b-2 border-transparent px-3 text-sm text-muted-foreground hover:text-foreground",
                    isActive && "border-primary font-semibold text-primary",
                  )
                }
              >
                <Shield className="h-5 w-5" />
                <span className="ml-2 hidden lg:inline">Admin</span>
              </NavLink>
            )}
          </nav>
          <div className="flex flex-1 items-center justify-end gap-3 pr-1 sm:pr-3 md:pr-4">
            <div ref={profileMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full p-1.5 hover:bg-muted"
              aria-expanded={profileMenuOpen}
              aria-label="Open account menu"
            >
              <UserAvatar size={30} src={user?.avatar} />
              <div className="hidden text-xs leading-tight sm:block">
                <p className="font-semibold">{user?.name}</p>
                <p className="text-muted-foreground">@{user?.username}</p>
                </div>
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded-xl border bg-card p-2 shadow-lg">
                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <User className="h-4 w-4" /> View profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
