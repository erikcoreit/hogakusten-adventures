import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ratingsQuery, commentsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function AdventureFeedback({ adventureId }: { adventureId: string }) {
  const { t } = useI18n();
  const { user, isModerator } = useAuth();
  const qc = useQueryClient();
  const { data: ratings = [] } = useQuery(ratingsQuery(adventureId));
  const { data: comments = [] } = useQuery(commentsQuery(adventureId));
  const [body, setBody] = useState("");
  const [hover, setHover] = useState(0);

  const myRating = user ? ratings.find((r) => r.user_id === user.id)?.stars ?? 0 : 0;
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : 0;

  const rate = async (stars: number) => {
    if (!user) return toast.error(t("rating.signin"));
    const { error } = await supabase.from("ratings").upsert(
      { adventure_id: adventureId, user_id: user.id, stars },
      { onConflict: "adventure_id,user_id" },
    );
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["ratings", adventureId] });
  };

  const post = async () => {
    if (!user) return toast.error(t("comments.signin"));
    if (!body.trim()) return;
    const { error } = await supabase.from("comments").insert({ adventure_id: adventureId, user_id: user.id, body: body.trim() });
    if (error) return toast.error(error.message);
    setBody("");
    qc.invalidateQueries({ queryKey: ["comments", adventureId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["comments", adventureId] });
  };

  return (
    <section className="mt-10 space-y-8">
      <div>
        <h2 className="label-mono mb-3 text-muted-foreground">{t("rating.title")}</h2>
        <div className="flex items-center gap-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => rate(n)} className="p-1" aria-label={`${n} stars`}>
                <Star className={`h-6 w-6 ${(hover || myRating) >= n ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {ratings.length > 0 ? <>{avg.toFixed(1)} · {ratings.length} {t("rating.count")}</> : "—"}
          </p>
        </div>
        {!user && <p className="mt-1 text-xs text-muted-foreground"><Link to="/logga-in" className="underline">{t("rating.signin")}</Link></p>}
      </div>

      <div>
        <h2 className="label-mono mb-3 text-muted-foreground">{t("comments.title")}</h2>
        {user ? (
          <div className="space-y-2">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("comments.placeholder")} rows={3} />
            <Button size="sm" onClick={post} disabled={!body.trim()}>{t("comments.post")}</Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground"><Link to="/logga-in" className="underline">{t("comments.signin")}</Link></p>
        )}
        <ul className="mt-6 space-y-4">
          {comments.length === 0 && <p className="text-sm text-muted-foreground">{t("comments.empty")}</p>}
          {comments.map((c) => (
            <li key={c.id} className="border-l-2 border-border pl-3">
              <div className="flex items-center justify-between">
                <p className="label-mono text-muted-foreground">{c.display_name} · {new Date(c.created_at).toLocaleDateString()}</p>
                {(user?.id === c.user_id || isModerator) && (
                  <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive" aria-label={t("comments.delete")}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
