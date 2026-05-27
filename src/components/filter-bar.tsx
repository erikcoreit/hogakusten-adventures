import type { Tag } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";

interface Props {
  tags: Tag[];
  selected: Set<string>;
  onToggle: (slug: string) => void;
}

export function FilterBar({ tags, selected, onToggle }: Props) {
  const { lang } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => {
        const label = lang === "sv" ? t.label_sv : t.label_en;
        const on = selected.has(t.slug);
        return (
          <button
            key={t.id}
            onClick={() => onToggle(t.slug)}
            className={`label-mono border px-3 py-1 transition ${
              on
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
