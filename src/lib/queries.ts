import { supabase } from "@/integrations/supabase/client";

export async function fetchTendersWithMatches(orgId: string) {
  const [t, m, p] = await Promise.all([
    supabase.from("tenders").select("*").order("deadline"),
    supabase.from("matches").select("*").eq("organization_id", orgId),
    supabase.from("pipeline_items").select("id, tender_id, stage").eq("organization_id", orgId),
  ]);
  if (t.error) throw t.error;
  const matches = new Map((m.data ?? []).map((x) => [x.tender_id, x]));
  const pipe = new Map((p.data ?? []).map((x) => [x.tender_id, x]));
  return (t.data ?? []).map((x) => ({ ...x, match: matches.get(x.id) ?? null, pipeline: pipe.get(x.id) ?? null }));
}

export async function addToPipeline(orgId: string, tenderId: string, userId: string) {
  const { error } = await supabase.from("pipeline_items").insert({ organization_id: orgId, tender_id: tenderId, owner_user_id: userId });
  if (error && !error.message.includes("duplicate")) throw error;
}
