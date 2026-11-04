import { createContext, useContext, type ReactNode } from "react";
import type { OrgRole } from "@/lib/constants";

export type OrgContextValue = {
  orgId: string;
  orgName: string;
  role: OrgRole;
  userId: string;
  email: string;
  canEdit: boolean;
};

const Ctx = createContext<OrgContextValue | null>(null);

export function OrgProvider({ value, children }: { value: OrgContextValue; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** UI convenience only — every read/write is still enforced by RLS on the backend. */
export function useOrg() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOrg must be used inside OrgProvider");
  return v;
}
