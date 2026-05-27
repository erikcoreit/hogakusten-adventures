import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/logga-in", replace: true });
  }, [user, loading, navigate]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">…</div>;
  return <Outlet />;
}
