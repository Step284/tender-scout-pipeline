import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/lib/org";
import { ROLE_LABEL, formatDate } from "@/lib/constants";
import { getIntegrationStatus } from "@/server/make.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Nastavení — Tender Radar" }, { name: "description", content: "Tým, role a integrace." }, { property: "og:title", content: "Nastavení — Tender Radar" }, { property: "og:description", content: "Tým, role a integrace." }] }),
  component: Settings,
});

function Settings() {
  const { orgId, orgName, role } = useOrg();
  const status = useServerFn(getIntegrationStatus);
  const { data: members = [] } = useQuery({ queryKey: ["members", orgId], queryFn: async () => (await supabase.from("organization_members").select("*").eq("organization_id", orgId)).data ?? [] });
  const { data: integ } = useQuery({ queryKey: ["integ"], queryFn: () => status() });
  const { data: events = [] } = useQuery({ queryKey: ["events-all", orgId], queryFn: async () => (await supabase.from("automation_events").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }).limit(20)).data ?? [] });
  const dot = (on?: boolean) => <span className={on ? "text-success" : "text-destructive"}>{on ? "Nastaveno" : "Nenastaveno"}</span>;
  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-3xl font-bold">Nastavení</h1><p className="text-sm text-muted-foreground">{orgName} · vaše role: {ROLE_LABEL[role]}</p></div>
      <section className="rounded-xl bg-card p-6 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Tým</h2>
        <ul className="divide-y text-sm">{members.map((m) => <li key={m.id} className="flex justify-between py-2"><span>{m.display_name} <span className="text-muted-foreground">{m.email}</span></span><span>{ROLE_LABEL[m.role]}</span></li>)}</ul>
        <p className="mt-3 text-xs text-muted-foreground">Pozvánky členů jsou plánovány v další verzi.</p>
      </section>
      <section className="rounded-xl bg-card p-6 shadow-card text-sm">
        <h2 className="mb-3 text-lg font-bold">Integrace Make</h2>
        <p>Webhook URL: {dot(integ?.makeWebhook)}</p>
        <p>Podpisový klíč: {dot(integ?.makeSigning)}</p>
        <p>API klíč (volitelný): {dot(integ?.makeApiKey)}</p>
        {!integ?.makeWebhook && <p className="mt-2 font-medium text-destructive">Make není připojen.</p>}
      </section>
      <section className="rounded-xl bg-card p-6 shadow-card">
        <h2 className="mb-3 text-lg font-bold">Log automatizací</h2>
        {!events.length ? <p className="text-sm text-muted-foreground">Zatím žádné události.</p> : (
          <table className="w-full text-sm"><thead className="text-left text-muted-foreground"><tr><th>Datum</th><th>Typ</th><th>Stav</th><th>Chyba</th></tr></thead>
            <tbody>{events.map((e) => <tr key={e.id} className="border-t"><td className="py-1">{formatDate(e.created_at)}</td><td className="font-mono">{e.event_type}</td><td>{e.status}</td><td className="text-muted-foreground">{e.last_error ?? "—"}</td></tr>)}</tbody></table>
        )}
      </section>
    </div>
  );
}
