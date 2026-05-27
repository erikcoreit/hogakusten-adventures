import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Adventure = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  duration_minutes: number | null;
  difficulty: "latt" | "medel" | "utmanande";
  season: string[];
  image_url: string | null;
  status: "draft" | "pending" | "published" | "rejected" | "archived";
  rejection_note: string | null;
  language: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  slug: string;
  label_sv: string;
  label_en: string;
  kind: "category" | "tag";
};

export const publishedAdventuresQuery = () =>
  queryOptions({
    queryKey: ["adventures", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_adventures")
        .select("*, adventure_tag_links(tag_id)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const adventureByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["adventure", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_adventures")
        .select("*, adventure_tag_links(tag_id)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", data.author_id)
        .maybeSingle();
      return { ...data, profiles: profile ?? null };
    },
  });

export const tagsQuery = () =>
  queryOptions({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("adventure_tags")
        .select("*")
        .order("kind", { ascending: true })
        .order("label_sv", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tag[];
    },
  });

export const myAdventuresQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["adventures", "mine", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_adventures")
        .select("*")
        .eq("author_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const myFavoritesQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("adventure_id, micro_adventures(*)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

export const pendingAdventuresQuery = () =>
  queryOptions({
    queryKey: ["adventures", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_adventures")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const list = data ?? [];
      const authorIds = Array.from(new Set(list.map((a) => a.author_id)));
      if (authorIds.length === 0) return list;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return list.map((a) => ({ ...a, profiles: map.get(a.author_id) ?? null }));
    },
  });

export const openReportsQuery = () =>
  queryOptions({
    queryKey: ["reports", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, micro_adventures(id, title)")
        .eq("status", "open")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const ratingsQuery = (adventureId: string) =>
  queryOptions({
    queryKey: ["ratings", adventureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("stars, user_id")
        .eq("adventure_id", adventureId);
      if (error) throw error;
      return data ?? [];
    },
  });

export const commentsQuery = (adventureId: string) =>
  queryOptions({
    queryKey: ["comments", adventureId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from("comments")
        .select("id, body, user_id, created_at")
        .eq("adventure_id", adventureId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = comments ?? [];
      const ids = Array.from(new Set(list.map((c) => c.user_id)));
      let names = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        names = new Map((profs ?? []).map((p) => [p.id, p.display_name ?? "Anonym"]));
      }
      return list.map((c) => ({ ...c, display_name: names.get(c.user_id) ?? "Anonym" }));
    },
  });
