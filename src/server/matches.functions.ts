import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeMatch } from "@/lib/matching";

/** Recomputes rule-based matches for all tenders visible to the org. Runs as the user (RLS applies). */
export const recomputeMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ organizationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: member } = await supabase
      .from("organization_members").select("role")
      .eq("organization_id", data.organizationId).eq("user_id", userId).maybeSingle();
    if (!member || member.role === "viewer") throw new Error("Nemáte oprávnění.");

    const { data: profile, error: pe } = await supabase
      .from("company_profiles").select("*").eq("organization_id", data.organizationId).single();
    if (pe || !profile) throw new Error("Profil nenalezen.");

    const { data: tenders, error: te } = await supabase
      .from("tenders").select("id, cpv_codes, region, value_estimate, deadline, title, description, organization_id")
      .or(`organization_id.is.null,organization_id.eq.${data.organizationId}`);
    if (te) throw new Error(te.message);

    const rows = (tenders ?? []).map((t) => {
      const m = computeMatch(
        { ...profile, value_min: profile.value_min, value_max: profile.value_max },
        t,
      );
      return {
        organization_id: data.organizationId,
        tender_id: t.id,
        score: m.score,
        recommendation: m.recommendation,
        reasons: m.reasons,
        method: "rules_v1",
        computed_at: new Date().toISOString(),
      };
    });
    if (rows.length) {
      const { error } = await supabase.from("matches").upsert(rows, { onConflict: "organization_id,tender_id" });
      if (error) throw new Error(error.message);
    }
    return { count: rows.length };
  });
