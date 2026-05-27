import type { Tag } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";

interface Props {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
  onClear?: () => void;
}

export function FilterBar({ tags, selected, onToggle, onClear }: Props) {
  const { lang, t } = useI18n();
  const categories = tags.filter((x) => x.kind === "category");
  const attrs = tags.filter((x) => x.kind === "tag");

  const renderGroup = (label: string, list: Tag[]) => {
    if (list.length === 0) return null;
    return (
      <div>
        <p className="label-mono mb-2 text-muted-foreground">{label}</p>
        <div className="flex flex-wrap gap-2">
          {list.map((tg) => {
            const on = selected.has(tg.slug);
            return (
              <button
                key={tg.id}
                onClick={() => onToggle(tg.slug)}
                className={`label-mono border px-3 py-1 transition ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {lang === "sv" ? tg.label_sv : tg.label_en}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderGroup(t("create.fields.tags"), categories)}
      {renderGroup(lang === "sv" ? "Attribut" : "Attributes", attrs)}
      {selected.size > 0 && onClear && (
        <button onClick={onClear} className="label-mono text-muted-foreground underline-offset-4 hover:underline">
          {lang === "sv" ? "Rensa filter" : "Clear filters"} ({selected.size})
        </button>
      )}
    </div>
  );
}
