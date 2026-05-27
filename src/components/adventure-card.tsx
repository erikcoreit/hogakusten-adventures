import { Link } from "@tanstack/react-router";
import type { Adventure, Tag } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { Clock, MapPin } from "lucide-react";

type AdventureWithLinks = Adventure & { adventure_tag_links?: { tag_id: string }[] };

export function AdventureCard({ a, tags }: { a: AdventureWithLinks; tags?: Tag[] }) {
  const { t, lang } = useI18n();
  const tagMap = tags ? new Map(tags.map((tg) => [tg.id, tg])) : null;
  const advTags = tagMap
    ? (a.adventure_tag_links ?? [])
        .map((l) => tagMap.get(l.tag_id))
        .filter((x): x is Tag => !!x)
        .slice(0, 4)
    : [];

  return (
    <Link
      to="/aventyr/$id"
      params={{ id: a.id }}
      className="group flex flex-col overflow-hidden border border-border bg-card transition hover:border-primary"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {a.image_url ? (
          <img
            src={a.image_url}
            alt={a.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MapPin className="h-7 w-7" />
          </div>
        )}
        <div className="absolute left-2 top-2 bg-background/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest">
          {t(`diff.${a.difficulty}` as `diff.${typeof a.difficulty}`)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <h3 className="text-sm font-semibold leading-tight line-clamp-2">{a.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          {a.duration_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {a.duration_minutes} {t("card.minutes")}
            </span>
          )}
          {a.address && <span className="truncate">{a.address}</span>}
        </div>
        {advTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {advTags.map((tg) => (
              <span
                key={tg.id}
                className="border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {lang === "sv" ? tg.label_sv : tg.label_en}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
