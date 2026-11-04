import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/lib/org";
import { fetchTendersWithMatches } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { AUTOMATION_SCENARIOS, STAGES, daysUntil, formatDate } from "@/lib/constants";
import { DeadlineChip, DemoBadge } from "@/components/app/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Přehled — Tender Radar" }, { name: "description", content: "Přehled zakázek a termínů." }, { property: "og:title", content: "Přehled — Tender Radar" }, { property: "og:description", content: "Přehled zakázek a termínů." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { orgId, orgName } = useOrg();
  const { data: tenders = [] } = useQuery({ queryKey: ["tenders", orgId], queryFn: () => fetchTendersWithMatches(orgId) });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks-all", orgId], queryFn: async () => (await supabase.from("tasks").select("*").eq("organization_id", orgId).eq("done", false)).data ?? [] });
  const inPipe = tenders.filter((t) => t.pipeline);
  const upcoming = inPipe.filter((t) => { const d = daysUntil(t.deadline); return d != null && d >= 0 && d <= 14; });
  const overdueTasks = tasks.filter((t) => t.due_date && daysUntil(t.due_date)! < 0);
  const kpis = [["V pipeline", inPipe.length], ["Doporučeno Go", tenders.filter((t) => t.match?.recommendation === "go").length], ["Termín do 14 dní", upcoming.length], ["Otevřené úkoly", tasks.length]];
  return (
    <div className="space-y-8">
      <div><h1 className="text-3xl font-bold">Přehled</h1><p className="text-muted-foreground">{orgName}</p></div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(([l, v]) => <div key={l} className="rounded-xl bg-card p-5 shadow-card"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-display text-3xl font-bold">{v}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-bold">Upozornění na termíny</h2>
          {upcoming.length === 0 && overdueTasks.length === 0 && <p className="text-sm text-muted-foreground">Žádné blížící se termíny. Přidejte zakázky do pipeline.</p>}
          <ul className="space-y-2">
            {upcoming.map((t) => <li key={t.id} className="flex items-center justify-between gap-2 text-sm"><Link to="/tenders/$id" params={{ id: t.id }} className="truncate hover:underline">{t.is_demo && <DemoBadge className="mr-2" />}{t.title}</Link><DeadlineChip deadline={t.deadline} /></li>)}
            {overdueTasks.map((t) => <li key={t.id} className="text-sm text-destructive">Úkol po termínu: {t.title} ({formatDate(t.due_date)})</li>)}
          </ul>
        </section>
        <section className="rounded-xl bg-card p-5 shadow-card">
          <h2 className="mb-3 text-lg font-bold">Pipeline podle fází</h2>
          {STAGES.map((s) => { const n = inPipe.filter((t) => t.pipeline?.stage === s.id).length; return <div key={s.id} className="mb-2 flex items-center gap-3 text-sm"><span className="w-28">{s.label}</span><div className="h-2 flex-1 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${inPipe.length ? (n / inPipe.length) * 100 : 0}%` }} /></div><span className="w-6 text-right">{n}</span></div>; })}
        </section>
      </div>
      <section className="rounded-xl bg-card p-5 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Automatizace (Make)</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATION_SCENARIOS.map((s) => <div key={s.id} className="rounded-lg border p-3"><p className="font-mono text-xs text-muted-foreground">{s.id}</p><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.status}</p></div>)}
        </div>
      </section>
    </div>
  );
}
