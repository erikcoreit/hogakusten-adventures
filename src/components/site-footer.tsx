import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <p className="font-mono uppercase tracking-widest">© Höga Kusten Micro Adventures</p>
        <p>{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
