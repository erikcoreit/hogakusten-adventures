import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { openReportsQuery } from "@/lib/queries";
import { useServerFn } from "@tanstack/react-start";
import { resolveReport } from "@/lib/moderation.functions";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/rapporter")({ component: Reports });

function Reports() {
  const { t } = useI18n();
  const { data: list = [] } = useQuery(openReportsQuery());
  const qc = useQueryClient();
  const res = useServerFn(resolveReport);
  const act = async (id: string, status: "resolved" | "dismissed") => {
    try { await res({ data: { id, status } }); toast.success("OK"); qc.invalidateQueries({ queryKey: ["reports"] }); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (list.length === 0) return <p className="text-sm text-muted-foreground">{t("admin.empty")}</p>;
  return (
    <ul className="space-y-3">
      {list.map((r) => {
        const a = (r as unknown as { micro_adventures?: { id: string; title: string } }).micro_adventures;
        return (
          <li key={r.id} className="border border-border p-4">
            <p className="label-mono text-muted-foreground">{r.reason}</p>
            {a && <Link to="/aventyr/$id" params={{ id: a.id }} className="block font-semibold text-primary">{a.title}</Link>}
            {r.details && <p className="mt-1 text-sm">{r.details}</p>}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => act(r.id, "resolved")}>Klar</Button>
              <Button size="sm" variant="ghost" onClick={() => act(r.id, "dismissed")}>Avfärda</Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
