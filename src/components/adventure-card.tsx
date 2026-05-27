import { Link } from "@tanstack/react-router";
import type { Adventure } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { Clock, MapPin } from "lucide-react";

export function AdventureCard({ a }: { a: Adventure }) {
  const { t } = useI18n();
  return (
    <Link
      to="/aventyr/$id"
      params={{ id: a.id }}
      className="group flex flex-col overflow-hidden border border-border bg-card transition hover:border-primary"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {a.image_url ? (
          <img
            src={a.image_url}
            alt={a.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <MapPin className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-2 top-2 bg-background/90 px-2 py-1 font-mono text-[10px] uppercase tracking-widest">
          {t(`diff.${a.difficulty}` as `diff.${typeof a.difficulty}`)}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="font-semibold leading-tight">{a.title}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {a.duration_minutes && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {a.duration_minutes} {t("card.minutes")}
            </span>
          )}
          {a.address && <span className="truncate">{a.address}</span>}
        </div>
      </div>
    </Link>
  );
}
