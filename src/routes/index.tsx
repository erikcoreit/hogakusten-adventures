import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAdventuresQuery, tagsQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdventureCard } from "@/components/adventure-card";
import { FilterBar } from "@/components/filter-bar";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-cliffs.jpg";
import { ArrowRight, Map as MapIcon, List, Plus, Filter as FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => {
    const title = "Höga Kusten Micro Adventures – upptäck korta friluftsäventyr";
    const description = "Community-driven karta över korta mikroäventyr i Örnsköldsvik och Höga Kusten: vandringar, vyer, bad, eldplatser och grottor.";
    const url = "https://hogakusten-adventures.lovable.app/";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(publishedAdventuresQuery());
    context.queryClient.ensureQueryData(tagsQuery());
  },
  component: Home,
});

function Home() {
  const { t, lang } = useI18n();
  const { data: adventures } = useSuspenseQuery(publishedAdventuresQuery());
  const { data: tags } = useSuspenseQuery(tagsQuery());
  const [view, setView] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const tagMap = useMemo(() => new Map(tags.map((tg) => [tg.id, tg.slug])), [tags]);
  const filtered = useMemo(() => {
    if (selected.size === 0) return adventures;
    return adventures.filter((a) => {
      const links = (a as unknown as { adventure_tag_links?: { tag_id: string }[] }).adventure_tag_links ?? [];
      const slugs = new Set(links.map((l) => tagMap.get(l.tag_id)).filter(Boolean) as string[]);
      for (const s of selected) if (!slugs.has(s)) return false;
      return true;
    });
  }, [adventures, selected, tagMap]);

  const toggle = (slug: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const featured = adventures.slice(0, 6);

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((a) => <AdventureCard key={a.id} a={a} tags={tags} />)}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold">{t("discover.title")}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilter || selected.size > 0 ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowFilter((s) => !s)}
              className="rounded-none"
            >
              <FilterIcon className="mr-1 h-4 w-4" />
              {lang === "sv" ? "Filter" : "Filter"}
              {selected.size > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-mono text-primary-foreground">
                  {selected.size}
                </span>
              )}
            </Button>
            <div className="flex border border-border">
              <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("map")}>
                <MapIcon className="mr-1 h-4 w-4" />{t("home.viewMap")}
              </Button>
              <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("list")}>
                <List className="mr-1 h-4 w-4" />{t("home.viewList")}
              </Button>
            </div>
          </div>
        </div>
        {showFilter && (
          <div className="mb-4 border border-border bg-card p-4">
            <FilterBar tags={tags} selected={selected} onToggle={toggle} onClear={() => setSelected(new Set())} />
          </div>
        )}
        {view === "map" ? (
          <MapView adventures={filtered} className="h-[60vh] w-full border border-border" mapTypeToggle />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((a) => <AdventureCard key={a.id} a={a} tags={tags} />)}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
