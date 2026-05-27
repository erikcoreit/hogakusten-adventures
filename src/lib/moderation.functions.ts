import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertModerator(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("moderator") && !roles.includes("admin")) {
    throw new Error("Forbidden");
  }
}

export const submitForReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("micro_adventures")
      .update({ status: "pending" })
      .eq("id", data.id)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moderateAdventure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      action: z.enum(["approve", "reject", "archive"]),
      note: z.string().max(2000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertModerator(context.userId);
    const patch =
      data.action === "approve"
        ? { status: "published" as const, published_at: new Date().toISOString(), rejection_note: null }
        : data.action === "reject"
        ? { status: "rejected" as const, rejection_note: data.note ?? null }
        : { status: "archived" as const };
    const { error } = await supabaseAdmin.from("micro_adventures").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["resolved", "dismissed"]),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertModerator(context.userId);
    const { error } = await supabaseAdmin.from("reports").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
