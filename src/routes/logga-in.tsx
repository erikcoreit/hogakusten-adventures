import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/logga-in")({
  component: SignIn,
});

function SignIn() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate({ to: "/", replace: true }); }, [user, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };
  const handleGoogle = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Fel vid inloggning");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold">{t("auth.signin")}</h1>
        <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle}>{t("auth.google")}</Button>
        <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={handleEmail} className="space-y-3">
          <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>{t("auth.password")}</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button disabled={busy} className="w-full">{t("auth.signin")}</Button>
        </form>
        <div className="mt-4 flex justify-between text-xs">
          <Link to="/aterstall-losenord" className="text-primary">{t("auth.forgot")}</Link>
          <Link to="/registrera" className="text-primary">{t("auth.noAccount")} {t("auth.signup")}</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
