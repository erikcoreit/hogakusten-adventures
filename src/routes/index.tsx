import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAdventuresQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdventureCard } from "@/components/adventure-card";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-cliffs.jpg";
import { ArrowRight, Map as MapIcon, List, Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedAdventuresQuery()),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data: adventures } = useSuspenseQuery(publishedAdventuresQuery());
  const featured = adventures.slice(0, 6);
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden border-b border-border">
        <img src={hero} alt="" width={1800} height={1200} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="label-mono mb-4 text-primary">Örnsköldsvik · Höga Kusten</p>
          <h1 className="max-w-2xl whitespace-pre-line text-4xl font-bold leading-[1.05] text-foreground md:text-6xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-lg text-base text-foreground/80 md:text-lg">{t("home.hero.sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/skapa"><Plus className="mr-2 h-4 w-4" />{t("home.cta.contribute")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">{t("home.featured")}</h2>
            <Link to="/utforska" className="label-mono inline-flex items-center gap-1 text-primary">
              {t("nav.explore")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => <AdventureCard key={a.id} a={a} />)}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("discover.title")}</h2>
          <div className="flex border border-border">
            <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("map")}>
              <MapIcon className="mr-1 h-4 w-4" />{t("home.viewMap")}
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("list")}>
              <List className="mr-1 h-4 w-4" />{t("home.viewList")}
            </Button>
          </div>
        </div>
        {view === "map" ? (
          <MapView adventures={adventures} className="h-[60vh] w-full border border-border" mapTypeToggle />
        ) : adventures.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adventures.map((a) => <AdventureCard key={a.id} a={a} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
