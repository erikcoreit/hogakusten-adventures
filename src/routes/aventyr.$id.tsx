import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { adventureByIdQuery } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MapView } from "@/components/map-view";
import { AdventureFeedback } from "@/components/adventure-feedback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { deleteAdventure } from "@/lib/moderation.functions";
import { Heart, ExternalLink, Flag, ArrowLeft, Clock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/aventyr/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(adventureByIdQuery(params.id)),
  head: ({ params, loaderData }) => {
    const a = loaderData as { title?: string; description?: string; image_url?: string | null } | null;
    const url = `https://hogakusten-adventures.lovable.app/aventyr/${params.id}`;
    const title = a?.title ? `${a.title} – Höga Kusten Micro Adventures` : "Mikroäventyr – Höga Kusten";
    const rawDesc = a?.description?.replace(/\s+/g, " ").trim() ?? "Ett mikroäventyr i Höga Kusten.";
    const description = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "…" : rawDesc;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "article" },
    ];
    if (a?.image_url) {
      meta.push({ property: "og:image", content: a.image_url });
      meta.push({ name: "twitter:image", content: a.image_url });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: a
        ? [{
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: a.title,
              description,
              image: a.image_url ?? undefined,
              url,
            }),
          }]
        : [],
    };
  },
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { data: a } = useSuspenseQuery(adventureByIdQuery(id));
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fav, setFav] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!user || !a) return;
    void supabase.from("favorites").select("user_id").eq("user_id", user.id).eq("adventure_id", a.id).maybeSingle().then(({ data }) => setFav(!!data));
  }, [user, a]);

  if (!a) throw notFound();
  const author = (a as unknown as { profiles?: { display_name: string } }).profiles?.display_name ?? "—";

  const toggleFav = async () => {
    if (!user) return toast.error("Logga in för att spara");
    if (fav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("adventure_id", a.id);
      setFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, adventure_id: a.id });
      setFav(true);
    }
    qc.invalidateQueries({ queryKey: ["favorites"] });
  };

  const submitReport = async () => {
    if (!user) return toast.error("Logga in för att rapportera");
    if (!reason.trim()) return;
    const { error } = await supabase.from("reports").insert({ adventure_id: a.id, reporter_id: user.id, reason, details });
    if (error) toast.error(error.message);
    else { toast.success(t("report.sent")); setReason(""); setDetails(""); }
  };

  const mapsUrl = a.lat && a.lng ? `https://www.google.com/maps/dir/?api=1&destination=${a.lat},${a.lng}` : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <article className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Link to="/utforska" className="label-mono mb-4 inline-flex items-center gap-1 text-muted-foreground">
          <ArrowLeft className="h-3 w-3" /> {t("nav.explore")}
        </Link>
        {a.image_url && (
          <img src={a.image_url} alt={a.title} className="mb-6 aspect-[16/9] w-full object-cover" />
        )}
        <p className="label-mono text-primary">{t(`diff.${a.difficulty}` as `diff.${typeof a.difficulty}`)}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{a.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {a.duration_minutes && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{a.duration_minutes} {t("card.minutes")}</span>}
          <span>{t("detail.author")}: {author}</span>
        </div>
        <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed">{a.description}</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {mapsUrl && (
            <Button asChild><a href={mapsUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />{t("detail.openInMaps")}</a></Button>
          )}
          <Button variant="outline" onClick={toggleFav}>
            <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-current text-primary" : ""}`} />{fav ? t("detail.favorited") : t("detail.favorite")}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost"><Flag className="mr-2 h-4 w-4" />{t("detail.report")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t("report.title")}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder={t("report.reason")} value={reason} onChange={(e) => setReason(e.target.value)} />
                <Textarea placeholder={t("report.details")} value={details} onChange={(e) => setDetails(e.target.value)} />
                <Button onClick={submitReport} className="w-full">{t("report.submit")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {a.lat && a.lng && (
          <div className="mt-8 border border-border">
            <MapView adventures={[a]} center={{ lat: a.lat, lng: a.lng }} zoom={13} className="h-[40vh] w-full" />
          </div>
        )}
      </article>
      <SiteFooter />
    </div>
  );
}
