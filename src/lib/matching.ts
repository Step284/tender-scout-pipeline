/**
 * Rule-based match scoring (rules_v1). Transparent and deterministic —
 * NOT AI. Scenario 03 will later replace/augment this via Make.
 */
export type MatchProfile = {
  cpv_codes: string[];
  regions: string[];
  value_min: number | null;
  value_max: number | null;
  capabilities: string[];
  description: string;
};
export type MatchTender = {
  cpv_codes: string[];
  region: string | null;
  value_estimate: number | null;
  deadline: string | null;
  title: string;
  description: string;
};
export type MatchResult = {
  score: number;
  recommendation: "go" | "consider" | "nogo";
  reasons: { kind: "plus" | "minus" | "info"; text: string }[];
};

const division = (cpv: string) => cpv.slice(0, 2);
const group = (cpv: string) => cpv.slice(0, 3);

export function computeMatch(p: MatchProfile, t: MatchTender, now = new Date()): MatchResult {
  const reasons: MatchResult["reasons"] = [];
  let score = 0;

  // CPV (max 50)
  const exact = t.cpv_codes.some((c) => p.cpv_codes.includes(c));
  const grp = t.cpv_codes.some((c) => p.cpv_codes.some((pc) => group(pc) === group(c)));
  const div = t.cpv_codes.some((c) => p.cpv_codes.some((pc) => division(pc) === division(c)));
  if (p.cpv_codes.length === 0) reasons.push({ kind: "info", text: "Profil nemá vyplněné CPV kódy." });
  else if (exact) { score += 50; reasons.push({ kind: "plus", text: "CPV kód přesně odpovídá profilu." }); }
  else if (grp) { score += 38; reasons.push({ kind: "plus", text: "CPV kód ve stejné skupině oborů." }); }
  else if (div) { score += 25; reasons.push({ kind: "plus", text: "CPV kód ve stejné oborové divizi." }); }
  else reasons.push({ kind: "minus", text: "CPV kódy neodpovídají vašemu oboru." });

  // Region (max 20)
  if (p.regions.length === 0) { score += 10; reasons.push({ kind: "info", text: "Region neomezen v profilu." }); }
  else if (t.region && p.regions.includes(t.region)) { score += 20; reasons.push({ kind: "plus", text: `Působíte v regionu ${t.region}.` }); }
  else reasons.push({ kind: "minus", text: "Mimo vaše cílové regiony." });

  // Value (max 20)
  const v = t.value_estimate;
  if (v == null) score += 10;
  else {
    const min = p.value_min ?? 0;
    const max = p.value_max ?? Number.POSITIVE_INFINITY;
    if (v >= min && v <= max) { score += 20; reasons.push({ kind: "plus", text: "Hodnota zakázky je ve vašem rozpětí." }); }
    else if (v > max) reasons.push({ kind: "minus", text: "Hodnota přesahuje vaše maximum." });
    else { score += 8; reasons.push({ kind: "minus", text: "Hodnota je pod vaším minimem." }); }
  }

  // Capabilities keyword overlap (max 10)
  const text = `${t.title} ${t.description}`.toLowerCase();
  const hits = p.capabilities.filter((c) => c.trim().length > 2 && text.includes(c.trim().toLowerCase()));
  if (hits.length) { score += Math.min(10, hits.length * 5); reasons.push({ kind: "plus", text: `Shoda schopností: ${hits.join(", ")}.` }); }

  // Deadline feasibility (penalty)
  if (t.deadline) {
    const days = Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86_400_000);
    if (days < 0) { score = Math.min(score, 10); reasons.push({ kind: "minus", text: "Lhůta pro podání již uplynula." }); }
    else if (days <= 5) { score -= 10; reasons.push({ kind: "minus", text: `Do podání zbývá jen ${days} dní.` }); }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const recommendation = score >= 70 ? "go" : score >= 45 ? "consider" : "nogo";
  return { score, recommendation, reasons };
}
