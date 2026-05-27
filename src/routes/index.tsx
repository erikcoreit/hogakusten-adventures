import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAdventuresQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdventureCard } from "@/components/adventure-card";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-cliffs.jpg";
import { ArrowRight, Map, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedAdventuresQuery()),
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { data: adventures } = useSuspenseQuery(publishedAdventuresQuery());
  const featured = adventures.slice(0, 6);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <section className="relative isolate overflow-hidden border-b border-border">
        <img src={hero} alt="" width={1600} height={1024} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-32">
          <p className="label-mono mb-4 text-primary">Örnsköldsvik · Höga Kusten</p>
          <h1 className="max-w-2xl whitespace-pre-line text-4xl font-bold leading-[1.05] md:text-6xl">
            {t("home.hero.title")}
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">{t("home.hero.sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/utforska"><Map className="mr-2 h-4 w-4" />{t("home.cta.explore")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/skapa"><Plus className="mr-2 h-4 w-4" />{t("home.cta.contribute")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">{t("home.featured")}</h2>
          <Link to="/utforska" className="label-mono inline-flex items-center gap-1 text-primary">
            {t("nav.explore")} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((a) => <AdventureCard key={a.id} a={a} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
