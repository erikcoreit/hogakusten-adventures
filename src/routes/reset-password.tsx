import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({ component: Reset });

function Reset() {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message);
    else { toast.success("Lösenord uppdaterat"); navigate({ to: "/" }); }
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold">{t("auth.newPassword")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button className="w-full">{t("common.save")}</Button>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
