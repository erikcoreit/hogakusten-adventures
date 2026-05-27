import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-0 font-mono text-xs">
      <Button
        variant={lang === "sv" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLang("sv")}
      >SV</Button>
      <Button
        variant={lang === "en" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 px-2"
        onClick={() => setLang("en")}
      >EN</Button>
    </div>
  );
}
