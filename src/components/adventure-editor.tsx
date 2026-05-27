import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { tagsQuery, adventureByIdQuery, type Adventure } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useServerFn } from "@tanstack/react-start";
import { submitForReview } from "@/lib/moderation.functions";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapView } from "@/components/map-view";
import { toast } from "sonner";

interface Props { id?: string; onDone: () => void; }

export function AdventureEditor({ id, onDone }: Props) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const submitFn = useServerFn(submitForReview);
  const { data: tags = [] } = useQuery(tagsQuery());
  const { data: existing } = useQuery({ ...adventureByIdQuery(id ?? ""), enabled: !!id });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [difficulty, setDifficulty] = useState<Adventure["difficulty"]>("latt");
  const [season, setSeason] = useState<Set<string>>(new Set());
  const [tagIds, setTagIds] = useState<Set<string>>(new Set());
  const [latlng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    const e = existing as unknown as Adventure & { adventure_tag_links?: { tag_id: string }[] };
    setTitle(e.title);
    setDescription(e.description);
    setDuration(e.duration_minutes?.toString() ?? "");
    setDifficulty(e.difficulty);
    setSeason(new Set(e.season ?? []));
    setTagIds(new Set((e.adventure_tag_links ?? []).map((l) => l.tag_id)));
    if (e.lat && e.lng) setLatLng({ lat: e.lat, lng: e.lng });
    setAddress(e.address ?? "");
    setImageUrl(e.image_url ?? null);
  }, [existing]);

  const toggleSet = (set: Set<string>, v: string) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; };

  const uploadImage = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("adventure-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("adventure-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  };

  const persist = async (status: "draft" | "pending") => {
    if (!user) return;
    setSaving(true);
    const payload = {
      author_id: user.id,
      title, description,
      duration_minutes: duration ? parseInt(duration) : null,
      difficulty, season: Array.from(season),
      lat: latlng?.lat ?? null, lng: latlng?.lng ?? null,
      address: address || null,
      image_url: imageUrl,
      language: lang,
      status,
    };
    let adventureId = id;
    if (id) {
      const { error } = await supabase.from("micro_adventures").update(payload).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    } else {
      const { data, error } = await supabase.from("micro_adventures").insert(payload).select().single();
      if (error || !data) { setSaving(false); return toast.error(error?.message ?? "Fel"); }
      adventureId = data.id;
    }
    // sync tag links
    if (adventureId) {
      await supabase.from("adventure_tag_links").delete().eq("adventure_id", adventureId);
      if (tagIds.size > 0) {
        await supabase.from("adventure_tag_links").insert(Array.from(tagIds).map((tag_id) => ({ adventure_id: adventureId!, tag_id })));
      }
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ["adventures"] });
    toast.success(status === "pending" ? "Inskickat för granskning" : "Sparat");
    onDone();
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !latlng) return toast.error("Fyll i titel, beskrivning och plats");
    // ensure saved first as draft, then submit
    if (!id) {
      // create as pending directly is allowed
      await persist("pending");
    } else {
      await persist("draft");
      await submitFn({ data: { id } });
      toast.success("Inskickat för granskning");
      onDone();
    }
  };

  const categories = tags.filter((t) => t.kind === "category");
  const attrs = tags.filter((t) => t.kind === "tag");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-bold">{id ? "Redigera" : t("create.title")}</h1>
        <div className="mt-6 space-y-5">
          <div>
            <Label>{t("create.fields.title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>{t("create.fields.description")}</Label>
            <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("create.fields.duration")}</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <Label>{t("create.fields.difficulty")}</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Adventure["difficulty"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latt">{t("diff.latt")}</SelectItem>
                  <SelectItem value="medel">{t("diff.medel")}</SelectItem>
                  <SelectItem value="utmanande">{t("diff.utmanande")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{t("create.fields.season")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["var", "sommar", "host", "vinter"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSeason(toggleSet(season, s))}
                  className={`label-mono border px-3 py-1 ${season.has(s) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {t(`season.${s}` as `season.${typeof s}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("create.fields.tags")}</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...categories, ...attrs].map((tag) => (
                <button key={tag.id} type="button" onClick={() => setTagIds(toggleSet(tagIds, tag.id))}
                  className={`label-mono border px-3 py-1 ${tagIds.has(tag.id) ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {lang === "sv" ? tag.label_sv : tag.label_en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{t("create.fields.location")}</Label>
            <p className="mb-2 text-xs text-muted-foreground">{t("create.fields.locationHelp")}</p>
            <div className="border border-border">
              <MapView adventures={[]} pickerMarker={latlng} onPick={(lat, lng) => setLatLng({ lat, lng })} className="h-[40vh] w-full" />
            </div>
            {latlng && <p className="mt-2 font-mono text-xs">lat: {latlng.lat.toFixed(5)}, lng: {latlng.lng.toFixed(5)}</p>}
            <Input className="mt-2" placeholder="Adress (valfri)" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <Label>{t("create.fields.image")}</Label>
            <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f); }} />
            {imageUrl && <img src={imageUrl} alt="" className="mt-2 aspect-[16/9] w-full object-cover" />}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button variant="outline" disabled={saving} onClick={() => persist("draft")}>{t("create.saveDraft")}</Button>
            <Button disabled={saving} onClick={submit}>{t("create.submit")}</Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
