import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { publishedAdventuresQuery, tagsQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdventureCard } from "@/components/adventure-card";
import { FilterBar } from "@/components/filter-bar";
import { MapView } from "@/components/map-view";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, List } from "lucide-react";

export const Route = createFileRoute("/utforska")({
  head: () => ({ meta: [{ title: "Utforska – Höga Kusten Micro Adventures" }] }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(publishedAdventuresQuery());
    context.queryClient.ensureQueryData(tagsQuery());
  },
  component: Discover,
});

function Discover() {
  const { t } = useI18n();
  const { data: adventures } = useSuspenseQuery(publishedAdventuresQuery());
  const { data: tags } = useSuspenseQuery(tagsQuery());
  const [view, setView] = useState<"map" | "list">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t.slug])), [tags]);
  const filtered = useMemo(() => {
    if (selected.size === 0) return adventures;
    return adventures.filter((a) => {
      const links = (a as unknown as { adventure_tag_links?: { tag_id: string }[] }).adventure_tag_links ?? [];
      const slugs = new Set(links.map((l) => tagMap.get(l.tag_id)).filter(Boolean) as string[]);
      for (const s of selected) if (!slugs.has(s)) return false;
      return true;
    });
  }, [adventures, selected, tagMap]);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("discover.title")}</h1>
          <div className="flex border border-border">
            <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("list")}>
              <List className="mr-1 h-4 w-4" />{t("discover.list")}
            </Button>
            <Button variant={view === "map" ? "secondary" : "ghost"} size="sm" className="rounded-none" onClick={() => setView("map")}>
              <MapIcon className="mr-1 h-4 w-4" />{t("discover.map")}
            </Button>
          </div>
        </div>
        <div className="mb-6">
          <FilterBar tags={tags} selected={selected} onToggle={toggle} />
        </div>
        {view === "map" ? (
          <MapView adventures={filtered} className="h-[70vh] w-full border border-border" />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("discover.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => <AdventureCard key={a.id} a={a} />)}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
