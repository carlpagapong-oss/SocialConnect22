import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "./PageState";

// Wraps pages that need a signed-in user. Guests are sent to the login page.
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}

// Wraps login/signup so signed-in users skip straight to the feed.
export function GuestRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <Outlet />;
}
