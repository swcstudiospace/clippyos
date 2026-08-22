/** Live lead pipeline totals. Never stored. */

import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/entities";
import { asMoney } from "@/lib/money";

export const LEADS_QUERY_KEY = ["leads"] as const;

export const OPEN_LEAD_STATUSES: readonly LeadStatus[] = [
  "TO_CONTACT",
  "CONTACTED",
  "IN_TALKS",
];

export type LeadTotals = {
  count: number;
  openCount: number;
  openUpfront: number;
  openMrr: number;
  closedUpfront: number;
  closedMrr: number;
  overallUpfront: number;
  overallMrr: number;
  byStatus: Record<LeadStatus, { count: number; upfront: number; mrr: number }>;
};

export function isOpenLead(status: LeadStatus): boolean {
  return OPEN_LEAD_STATUSES.includes(status);
}

export function deriveLeadTotals(leads: Lead[]): LeadTotals {
  const live = leads.filter((lead) => !lead.deletedAt);
  const byStatus = Object.fromEntries(
    LEAD_STATUSES.map((status) => [status, { count: 0, upfront: 0, mrr: 0 }]),
  ) as LeadTotals["byStatus"];

  let openUpfront = 0;
  let openMrr = 0;
  let closedUpfront = 0;
  let closedMrr = 0;
  let overallUpfront = 0;
  let overallMrr = 0;
  let openCount = 0;

  for (const lead of live) {
    const upfront = asMoney(lead.upfrontCash);
    const mrr = asMoney(lead.monthlyRecurring);
    const bucket = byStatus[lead.status];
    bucket.count += 1;
    bucket.upfront += upfront;
    bucket.mrr += mrr;
    if (lead.status === "LOST") continue;
    overallUpfront += upfront;
    overallMrr += mrr;
    if (lead.status === "CLOSED") {
      closedUpfront += upfront;
      closedMrr += mrr;
    } else if (isOpenLead(lead.status)) {
      openCount += 1;
      openUpfront += upfront;
      openMrr += mrr;
    }
  }

  return {
    count: live.length,
    openCount,
    openUpfront,
    openMrr,
    closedUpfront,
    closedMrr,
    overallUpfront,
    overallMrr,
    byStatus,
  };
}
