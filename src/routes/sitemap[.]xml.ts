import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://hogakusten-adventures.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/utforska", changefreq: "daily", priority: "0.9" },
          { path: "/om", changefreq: "monthly", priority: "0.5" },
        ];

        let dynamic: { path: string; lastmod?: string }[] = [];
        try {
          const supabase = createClient(
            process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          );
          const { data } = await supabase
            .from("micro_adventures")
            .select("id, updated_at")
            .eq("status", "published");
          dynamic = (data ?? []).map((a) => ({
            path: `/aventyr/${a.id}`,
            lastmod: a.updated_at,
          }));
        } catch {
          // ignore — still serve static entries
        }

        const all = [...staticEntries, ...dynamic];
        const urls = all.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            "lastmod" in e && e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            "changefreq" in e && e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            "priority" in e && e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
