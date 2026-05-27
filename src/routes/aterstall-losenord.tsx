import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/aterstall-losenord")({ component: Forgot });

function Forgot() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    toast.success(t("auth.resetSent"));
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold">{t("auth.reset")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input type="email" required placeholder={t("auth.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button className="w-full">{t("auth.reset")}</Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
