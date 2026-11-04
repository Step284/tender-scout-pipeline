import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrg } from "@/lib/org";
import { fetchTendersWithMatches, addToPipeline } from "@/lib/queries";
import { formatCZK, formatDate, stageLabel } from "@/lib/constants";
import { DeadlineChip, DemoBadge, RecBadge, ScoreRing } from "@/components/app/badges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/tenders/$id")({
  head: () => ({ meta: [{ title: "Detail zakázky — Tender Radar" }, { name: "description", content: "Detail veřejné zakázky a doporučení." }, { property: "og:title", content: "Detail zakázky — Tender Radar" }, { property: "og:description", content: "Detail veřejné zakázky a doporučení." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { orgId, userId, canEdit } = useOrg();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["tenders", orgId], queryFn: () => fetchTendersWithMatches(orgId) });
  const add = useMutation({ mutationFn: () => addToPipeline(orgId, id, userId), onSuccess: () => { toast.success("Přidáno do pipeline"); qc.invalidateQueries({ queryKey: ["tenders"] }); } });
  const t = data.find((x) => x.id === id);
  if (!t) return <p className="text-muted-foreground">Načítám…</p>;
  const reasons = (t.match?.reasons ?? []) as { kind: string; text: string }[];
  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/tenders" className="text-sm text-muted-foreground hover:underline">← Zpět na zakázky</Link>
      <div className="flex flex-wrap items-center gap-2">{t.is_demo && <DemoBadge />}<DeadlineChip deadline={t.deadline} /><span className="font-mono text-xs text-muted-foreground">{t.external_ref}</span></div>
      <h1 className="text-3xl font-bold">{t.title}</h1>
      {t.is_demo && <p className="rounded-md border border-signal bg-signal/15 p-3 text-sm">Ukázková (DEMO) zakázka pro testování aplikace. Neodpovídá skutečnému řízení.</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4 rounded-xl bg-card p-6 shadow-card">
          <p>{t.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[["Zadavatel", t.contracting_authority], ["Region", t.region], ["Předpokládaná hodnota", formatCZK(t.value_estimate)], ["Druh řízení", t.procedure_type], ["Lhůta pro nabídky", formatDate(t.deadline)], ["CPV", t.cpv_codes.join(", ")]].map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v ?? "—"}</dd></div>)}
          </dl>
          {t.requirements.length > 0 && <div><h3 className="mb-2 font-bold">Kvalifikační požadavky</h3><ul className="list-disc space-y-1 pl-5 text-sm">{t.requirements.map((r) => <li key={r}>{r}</li>)}</ul></div>}
        </div>
        <aside className="space-y-4 rounded-xl bg-card p-6 shadow-card">
          {t.match ? (<>
            <div className="flex items-center gap-3"><ScoreRing score={t.match.score} size={64} /><div><RecBadge rec={t.match.recommendation} /><p className="mt-1 text-xs text-muted-foreground">Pravidlové skóre (ne AI)</p></div></div>
            <ul className="space-y-1 text-sm">{reasons.map((r, i) => <li key={i} className={r.kind === "plus" ? "text-success" : r.kind === "minus" ? "text-destructive" : "text-muted-foreground"}>{r.kind === "plus" ? "＋" : r.kind === "minus" ? "－" : "•"} {r.text}</li>)}</ul>
          </>) : <p className="text-sm text-muted-foreground">Skóre zatím nespočteno. Použijte „Přepočítat shodu“ v seznamu zakázek.</p>}
          {t.pipeline ? <p className="text-sm">Ve fázi: <b>{stageLabel(t.pipeline.stage)}</b></p> : canEdit && <Button className="w-full" onClick={() => add.mutate()}>Přidat do pipeline</Button>}
        </aside>
      </div>
    </div>
  );
}
