import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminLayout });

function AdminLayout() {
  const { isModerator, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !isModerator) navigate({ to: "/" }); }, [loading, isModerator, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        <nav className="mt-4 flex gap-4 border-b border-border text-sm">
          <Link to="/admin/granska" activeProps={{ className: "border-b-2 border-primary -mb-px" }} className="px-2 py-2">{t("admin.review")}</Link>
          <Link to="/admin/rapporter" activeProps={{ className: "border-b-2 border-primary -mb-px" }} className="px-2 py-2">{t("admin.reports")}</Link>
        </nav>
        <div className="mt-6"><Outlet /></div>
      </main>
      <SiteFooter />
    </div>
  );
}
