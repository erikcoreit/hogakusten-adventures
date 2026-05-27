import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { myFavoritesQuery } from "@/lib/queries";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdventureCard } from "@/components/adventure-card";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/favoriter")({ component: Favs });

function Favs() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data = [] } = useQuery(myFavoritesQuery(user?.id));
  const items = data.map((r) => (r as unknown as { micro_adventures: import("@/lib/queries").Adventure }).micro_adventures).filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">{t("fav.title")}</h1>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("fav.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((a) => <AdventureCard key={a.id} a={a} />)}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
