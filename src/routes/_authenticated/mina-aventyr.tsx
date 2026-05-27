import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { myAdventuresQuery } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mina-aventyr")({ component: Mine });

function Mine() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: list = [] } = useQuery(myAdventuresQuery(user?.id));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t("mine.title")}</h1>
          <Button asChild><Link to="/skapa"><Plus className="mr-2 h-4 w-4" />{t("mine.new")}</Link></Button>
        </div>
        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("mine.empty")}</p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {list.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{a.title || "(utan titel)"}</p>
                  <p className="label-mono text-muted-foreground">{t(`status.${a.status}` as `status.${typeof a.status}`)}</p>
                  {a.rejection_note && <p className="mt-1 text-xs text-destructive">{a.rejection_note}</p>}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/redigera/$id" params={{ id: a.id }}>Redigera</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
