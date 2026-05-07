import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEvStore } from "@/store/evStore";

/**
 * Route guard. Until the user signs in OR explicitly enters guest mode, every
 * route is redirected to /login. The /login route itself is always allowed.
 * Edit `publicPaths` to expose more routes without auth.
 */
const publicPaths = ["/login"];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, guestMode, authReady, loadAuth } = useEvStore();
  const { pathname } = useLocation();

  useEffect(() => { void loadAuth(); }, [loadAuth]);

  if (!authReady) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const allowed = isAuthenticated || guestMode || publicPaths.includes(pathname);
  if (!allowed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}