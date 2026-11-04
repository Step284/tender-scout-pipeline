import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org";
import { CPV_CATALOG, REGIONS } from "@/lib/constants";
import { triggerMakeProfile } from "@/server/make.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profil firmy — Tender Radar" }, { name: "description", content: "Profil firmy pro párování zakázek." }, { property: "og:title", content: "Profil firmy — Tender Radar" }, { property: "og:description", content: "Profil firmy pro párování zakázek." }] }),
  component: Profile,
});

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

function Profile() {
  const { orgId, canEdit } = useOrg();
  const qc = useQueryClient();
  const analyze = useServerFn(triggerMakeProfile);
  const { data: p } = useQuery({ queryKey: ["profile", orgId], queryFn: async () => (await supabase.from("company_profiles").select("*").eq("organization_id", orgId).single()).data });
  const { data: events = [] } = useQuery({ queryKey: ["events", orgId], queryFn: async () => (await supabase.from("automation_events").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(5)).data ?? [] });
  const { data: sugg = [] } = useQuery({ queryKey: ["sugg", orgId], queryFn: async () => (await supabase.from("cpv_suggestions").select("*").eq("organization_id", orgId).eq("status", "pending")).data ?? [] });
  const [f, setF] = useState({ description: "", industry: "", cpv_codes: [] as string[], regions: [] as string[], value_min: "", value_max: "", capabilities: "" });
  useEffect(() => { if (p) setF({ description: p.description, industry: p.industry, cpv_codes: p.cpv_codes, regions: p.regions, value_min: p.value_min?.toString() ?? "", value_max: p.value_max?.toString() ?? "", capabilities: p.capabilities.join(", ") }); }, [p]);

  const save = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("company_profiles").update({ description: f.description, industry: f.industry, cpv_codes: f.cpv_codes, regions: f.regions, value_min: f.value_min ? Number(f.value_min) : null, value_max: f.value_max ? Number(f.value_max) : null, capabilities: f.capabilities.split(",").map((s) => s.trim()).filter(Boolean) }).eq("organization_id", orgId); if (error) throw error; },
    onSuccess: () => { toast.success("Profil uložen"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Uložení selhalo"),
  });
  const run = useMutation({
    mutationFn: () => analyze({ data: { organizationId: orgId } }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["events"] }); if (r.ok) toast.success(r.deduplicated ? "Analýza již byla odeslána pro tuto verzi profilu." : "Událost odeslána do Make."); else toast.error(r.message); },
    onError: () => toast.error("Požadavek selhal"),
  });
  const review = async (id: string, code: string, accept: boolean) => {
    await supabase.from("cpv_suggestions").update({ status: accept ? "accepted" : "rejected" }).eq("id", id);
    if (accept && !f.cpv_codes.includes(code)) setF({ ...f, cpv_codes: [...f.cpv_codes, code] });
    qc.invalidateQueries({ queryKey: ["sugg"] });
  };
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`;
  const last = events[0];
  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">Profil firmy</h1><p className="text-sm text-muted-foreground">Viditelné pouze členům vaší organizace. Neuvádějte citlivé obchodní údaje.</p></div>
      <section className="space-y-4 rounded-xl bg-card p-6 shadow-card">
        <label className="block space-y-1 text-sm"><span className="font-medium">Obor</span><Input disabled={!canEdit} value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} placeholder="např. Stavebnictví" /></label>
        <label className="block space-y-1 text-sm"><span className="font-medium">Popis firmy</span><Textarea disabled={!canEdit} maxLength={4000} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        <div className="space-y-2 text-sm"><span className="font-medium">CPV kódy</span><div className="flex flex-wrap gap-2">{CPV_CATALOG.map((c) => <button type="button" disabled={!canEdit} key={c.code} className={chip(f.cpv_codes.includes(c.code))} onClick={() => setF({ ...f, cpv_codes: toggle(f.cpv_codes, c.code) })}>{c.label} <span className="opacity-70">{c.code}</span></button>)}</div></div>
        <div className="space-y-2 text-sm"><span className="font-medium">Regiony</span><div className="flex flex-wrap gap-2">{REGIONS.map((r) => <button type="button" disabled={!canEdit} key={r} className={chip(f.regions.includes(r))} onClick={() => setF({ ...f, regions: toggle(f.regions, r) })}>{r}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="space-y-1"><span className="font-medium">Hodnota od (Kč)</span><Input disabled={!canEdit} type="number" min={0} value={f.value_min} onChange={(e) => setF({ ...f, value_min: e.target.value })} /></label>
          <label className="space-y-1"><span className="font-medium">Hodnota do (Kč)</span><Input disabled={!canEdit} type="number" min={0} value={f.value_max} onChange={(e) => setF({ ...f, value_max: e.target.value })} /></label>
        </div>
        <label className="block space-y-1 text-sm"><span className="font-medium">Schopnosti (oddělte čárkou, nesensitivní)</span><Input disabled={!canEdit} value={f.capabilities} onChange={(e) => setF({ ...f, capabilities: e.target.value })} placeholder="rekonstrukce, rozvody vody, web" /></label>
        {canEdit && <Button onClick={() => save.mutate()} disabled={save.isPending}>Uložit profil</Button>}
      </section>
      <section className="space-y-3 rounded-xl bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Automatická analýza profilu (Make · scénář 01)</h2><p className="text-sm text-muted-foreground">Odešle do Make pouze ID události, typ, ID organizace a čas.</p></div>
          {canEdit && <Button variant="outline" onClick={() => run.mutate()} disabled={run.isPending}>{run.isPending ? "Odesílám…" : "Analyzovat profil"}</Button>}
        </div>
        {last && <p className="text-sm">Poslední událost: <span className="font-mono">{last.status}</span>{last.last_error === "make_not_configured" && <span className="ml-2 text-destructive">Make není připojen</span>} · pokusy {last.attempts}</p>}
        {sugg.length > 0 && <div className="space-y-2"><h3 className="font-bold">Navržené CPV kódy</h3>{sugg.map((s) => <div key={s.id} className="flex items-center gap-2 text-sm"><span className="flex-1">{s.cpv_code} {s.label}</span><Button size="sm" onClick={() => review(s.id, s.cpv_code, true)}>Přijmout</Button><Button size="sm" variant="ghost" onClick={() => review(s.id, s.cpv_code, false)}>Zamítnout</Button></div>)}</div>}
      </section>
    </div>
  );
}
