import { describe, expect, it } from "vitest";
import { computeMatch } from "@/lib/matching";
import { hmacHex, verifySignature } from "@/lib/signing";

const now = new Date("2026-11-04T12:00:00Z");
const profile = { cpv_codes: ["45000000-7"], regions: ["Středočeský kraj"], value_min: 1_000_000, value_max: 6_000_000, capabilities: [], description: "" };
const tender = { cpv_codes: ["45000000-7"], region: "Středočeský kraj", value_estimate: 3_000_000, deadline: "2026-11-30T00:00:00Z", title: "x", description: "" };

describe("match rules", () => {
  it("exact CPV + region + value in range is Go", () => {
    expect(computeMatch(profile, tender, now)).toMatchObject({ score: 90, recommendation: "go" });
  });
  it("expired deadline caps score at 10 (No-Go)", () => {
    expect(computeMatch(profile, { ...tender, deadline: "2026-11-01T00:00:00Z" }, now)).toMatchObject({ score: 10, recommendation: "nogo" });
  });
});

describe("callback signature", () => {
  it("rejects a wrong signature and accepts a valid one", async () => {
    const ts = "1793793600";
    const sig = await hmacHex("s3cret", `${ts}.body`);
    const nowMs = 1793793600_000;
    expect(await verifySignature({ secret: "s3cret", timestamp: ts, signature: sig, payload: "body", nowMs })).toBe(true);
    expect(await verifySignature({ secret: "s3cret", timestamp: ts, signature: "00", payload: "body", nowMs })).toBe(false);
  });
});
