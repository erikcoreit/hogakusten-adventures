import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pendingAdventuresQuery } from "@/lib/queries";
import { useServerFn } from "@tanstack/react-start";
import { moderateAdventure } from "@/lib/moderation.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/granska")({ component: Review });

function Review() {
  const { t } = useI18n();
  const { data: list = [] } = useQuery(pendingAdventuresQuery());
  const qc = useQueryClient();
  const mod = useServerFn(moderateAdventure);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const act = async (id: string, action: "approve" | "reject" | "archive") => {
    try {
      await mod({ data: { id, action, note: notes[id] } });
      toast.success("OK");
      qc.invalidateQueries({ queryKey: ["adventures"] });
    } catch (e) { toast.error((e as Error).message); }
  };

  if (list.length === 0) return <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>;
  return (
    <ul className="space-y-4">
      {list.map((a) => {
        const author = (a as unknown as { profiles?: { display_name: string } }).profiles?.display_name ?? "—";
        return (
          <li key={a.id} className="border border-border p-4">
            <div className="flex items-start gap-4">
              {a.image_url && <img src={a.image_url} alt="" className="h-24 w-32 object-cover" />}
              <div className="flex-1">
                <h3 className="font-semibold">{a.title}</h3>
                <p className="label-mono text-muted-foreground">{author}</p>
                <p className="mt-2 line-clamp-3 text-sm">{a.description}</p>
              </div>
            </div>
            <Input className="mt-3" placeholder={t("admin.note")} value={notes[a.id] ?? ""} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => act(a.id, "approve")}>{t("admin.approve")}</Button>
              <Button size="sm" variant="outline" onClick={() => act(a.id, "reject")}>{t("admin.reject")}</Button>
              <Button size="sm" variant="ghost" onClick={() => act(a.id, "archive")}>{t("admin.archive")}</Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
