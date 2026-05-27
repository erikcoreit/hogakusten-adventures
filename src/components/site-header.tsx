import { Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "./language-toggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { t } = useI18n();
  const { user, isModerator, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="font-semibold">Höga Kusten</span>
          <span className="text-muted-foreground">/ Micro Adventures</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/utforska" className="rounded px-3 py-2 text-sm hover:bg-secondary">{t("nav.explore")}</Link>
          <Link to="/om" className="rounded px-3 py-2 text-sm hover:bg-secondary">{t("nav.about")}</Link>
          {user && <Link to="/mina-aventyr" className="rounded px-3 py-2 text-sm hover:bg-secondary">{t("nav.myAdventures")}</Link>}
          {user && <Link to="/favoriter" className="rounded px-3 py-2 text-sm hover:bg-secondary">{t("nav.favorites")}</Link>}
          {isModerator && <Link to="/admin" className="rounded px-3 py-2 text-sm hover:bg-secondary">{t("nav.admin")}</Link>}
          <LanguageToggle />
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>{t("nav.signout")}</Button>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/logga-in">{t("nav.signin")}</Link>
            </Button>
          )}
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            <Link to="/utforska" onClick={() => setOpen(false)} className="py-2 text-sm">{t("nav.explore")}</Link>
            <Link to="/om" onClick={() => setOpen(false)} className="py-2 text-sm">{t("nav.about")}</Link>
            {user && <Link to="/mina-aventyr" onClick={() => setOpen(false)} className="py-2 text-sm">{t("nav.myAdventures")}</Link>}
            {user && <Link to="/favoriter" onClick={() => setOpen(false)} className="py-2 text-sm">{t("nav.favorites")}</Link>}
            {isModerator && <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm">{t("nav.admin")}</Link>}
            <div className="flex items-center justify-between py-2">
              <LanguageToggle />
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleSignOut}>{t("nav.signout")}</Button>
              ) : (
                <Button variant="default" size="sm" asChild>
                  <Link to="/logga-in" onClick={() => setOpen(false)}>{t("nav.signin")}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
