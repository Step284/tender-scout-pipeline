import { cn } from "@/lib/utils";
import { RECOMMENDATION_LABEL, type Recommendation, daysUntil } from "@/lib/constants";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-signal bg-signal px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-signal-foreground", className)}>
      DEMO
    </span>
  );
}

const recStyles: Record<Recommendation, string> = {
  go: "bg-success text-success-foreground",
  consider: "bg-warning text-warning-foreground",
  nogo: "bg-destructive text-destructive-foreground",
};

export function RecBadge({ rec }: { rec: Recommendation }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", recStyles[rec])}>{RECOMMENDATION_LABEL[rec]}</span>;
}

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? "var(--success)" : score >= 45 ? "var(--warning)" : "var(--destructive)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Skóre shody ${score} %`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--muted)" strokeWidth={5} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={5} fill="none" strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-bold">{score}</span>
    </div>
  );
}

export function DeadlineChip({ deadline }: { deadline: string | null }) {
  const d = daysUntil(deadline);
  if (d == null) return null;
  const tone = d < 0 ? "bg-muted text-muted-foreground" : d <= 5 ? "bg-destructive/10 text-destructive" : d <= 14 ? "bg-warning/20 text-warning-foreground" : "bg-secondary text-secondary-foreground";
  return <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", tone)}>{d < 0 ? "Po lhůtě" : d === 0 ? "Dnes" : `${d} dní`}</span>;
}
