import type { Database } from "@/integrations/supabase/types";

export type Stage = Database["public"]["Enums"]["pipeline_stage"];
export type Recommendation = Database["public"]["Enums"]["match_recommendation"];
export type OrgRole = Database["public"]["Enums"]["org_role"];

export const STAGES: { id: Stage; label: string }[] = [
  { id: "nove", label: "Nové" },
  { id: "k_posouzeni", label: "K posouzení" },
  { id: "pripravujeme", label: "Připravujeme" },
  { id: "ke_schvaleni", label: "Ke schválení" },
  { id: "podano", label: "Podáno" },
  { id: "uzavreno", label: "Uzavřeno" },
];
export const stageLabel = (s: Stage) => STAGES.find((x) => x.id === s)?.label ?? s;

export const RECOMMENDATION_LABEL: Record<Recommendation, string> = {
  go: "Go",
  consider: "Zvážit",
  nogo: "No-Go",
};

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Vlastník",
  admin: "Administrátor",
  member: "Člen týmu",
  viewer: "Čtenář",
};

export const REGIONS = [
  "Hlavní město Praha",
  "Středočeský kraj",
  "Jihočeský kraj",
  "Plzeňský kraj",
  "Karlovarský kraj",
  "Ústecký kraj",
  "Liberecký kraj",
  "Královéhradecký kraj",
  "Pardubický kraj",
  "Kraj Vysočina",
  "Jihomoravský kraj",
  "Olomoucký kraj",
  "Zlínský kraj",
  "Moravskoslezský kraj",
];

/** Small curated CPV list for the profile picker (division-level + common codes). */
export const CPV_CATALOG: { code: string; label: string }[] = [
  { code: "45000000-7", label: "Stavební práce" },
  { code: "45330000-9", label: "Instalatérské a sanitární práce" },
  { code: "45233140-2", label: "Práce na silnicích" },
  { code: "48000000-8", label: "Programové balíky a informační systémy" },
  { code: "72000000-5", label: "Služby v oblasti IT" },
  { code: "72212000-4", label: "Programování aplikačního SW" },
  { code: "72260000-5", label: "Služby související se SW" },
  { code: "72413000-8", label: "Návrh webových stránek" },
  { code: "72800000-8", label: "Audit a testování počítačů" },
  { code: "79212000-3", label: "Auditorské služby" },
  { code: "90910000-9", label: "Úklidové služby" },
  { code: "39130000-2", label: "Kancelářský nábytek" },
  { code: "55520000-1", label: "Catering" },
  { code: "71000000-8", label: "Architektonické a inženýrské služby" },
  { code: "79400000-8", label: "Poradenství v oblasti podnikání" },
];

export const AUTOMATION_SCENARIOS = [
  { id: "01", title: "Profil → návrh CPV kódů", status: "Připraveno (čeká na Make)" },
  { id: "02", title: "Denní vyhledávání zakázek z TED API", status: "Plánováno" },
  { id: "03", title: "AI doporučení Go / No-Go", status: "Plánováno" },
  { id: "04", title: "Checklisty z dokumentace zakázky", status: "Plánováno" },
  { id: "05", title: "Termíny a eskalace", status: "Plánováno" },
  { id: "06", title: "Reporting", status: "Plánováno" },
];

export const formatCZK = (v: number | null | undefined) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(v);

export const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" }) : "—";

export const daysUntil = (d: string | null | undefined, now = new Date()) =>
  d ? Math.ceil((new Date(d).getTime() - now.getTime()) / 86_400_000) : null;
