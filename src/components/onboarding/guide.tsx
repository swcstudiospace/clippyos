import { GlassCard } from "@/components/ui/glass-card";

const SECTIONS = [
  {
    title: "1. Confirm the plan",
    body: "Agree Team only ($3,000 / mo), Personal involved ($5,000 / mo), or a custom retainer in $1,000 steps up to $20,000. Setup is $30,000 unless a custom note says otherwise. Record the start date on the client — Day 1 of the 30-day views guarantee is that date, inclusive.",
  },
  {
    title: "2. Send the client agreement",
    body: "Download the ClippyOS client agreement and send it for signature before production starts. Paying the setup invoice also counts as acceptance. Keep the signed copy in the client’s Drive folder. Do not use a link the client emailed you — only this workspace’s trusted document.",
  },
  {
    title: "3. Collect access",
    body: "YouTube Studio (or Brand Account) with permission to upload, edit, and read analytics. Footage Drive or Dropbox. Thumbnail references. Google account email on the client record. Without Studio access we cannot snapshot views for the guarantee.",
  },
  {
    title: "4. Discord",
    body: "Invite the founder and their point of contact to the agency Discord. Create a client channel. Production stages (Waiting for footage → Published) are posted there. Store the server id on the client if you use the Discord bridge later.",
  },
  {
    title: "5. Footage expectations",
    body: "Long-form is the source of truth. We only treat a video as long-form at 4 minutes or longer. Ask for clean audio, a stable frame, and enough runtime to cut a 4+ minute A-roll. B-roll and pickups should arrive within five business days of the request. Missing footage parks the lane on Waiting for footage.",
  },
  {
    title: "6. First 30 days",
    body: "We guarantee a full refund of the setup fee if the channel does not see a views increase in the first 30 days. Dashboard Daily Objectives track Day n/30 for every active client with a start date, and turn orange at day 25 and red at day 30. Pull analytics snapshots so the comparison is real. The guarantee does not apply if they withhold footage or access, pause publishing, or fall into arrears.",
  },
  {
    title: "7. Money setup",
    body: "Create the setup invoice and the first monthly invoice on the client. They appear on Money and on Calendar on the due date. Mark collected / Mark as Paid is the same action — it sets paidDate to today and status to PAID. Churned clients drop out of MRR but their historical paid invoices still count as lifetime revenue.",
  },
  {
    title: "8. Staff the lane",
    body: "Assign a channel manager, short-form editor, long-form editor, and thumbnail designer as needed. Team costs are monthly and roll into Money margins and the Team tab capacity tracker. Anyone on more than three active clients is flagged overloaded. AI teammates (Grok Bot / Hermes) appear on Team and never count as load.",
  },
  {
    title: "9. Kick off production",
    body: "Set the stage to Waiting for footage. Use Ideation (global) for strategy and the client’s Suggested Titles / Ideas tools for channel-specific work. Thumbnails stay in the Thumbnails tab, always tagged to this client. Publish, snapshot analytics, and stay on the 30-day list until the window closes.",
  },
  {
    title: "10. Turn on require approval before first client publish",
    body: "Settings → Approvals. Live social publishes wait in the Approvals inbox until an Owner or Admin signs off. Drafts never wait. Keep this on before the first client goes live.",
  },
] as const;

export function OnboardingGuide() {
  return (
    <div className="flex flex-col gap-3">
      {SECTIONS.map((section) => (
        <GlassCard key={section.title}>
          <h2 className="text-card font-semibold tracking-tight">{section.title}</h2>
          <p className="mt-2 max-w-3xl text-body text-muted">{section.body}</p>
        </GlassCard>
      ))}
    </div>
  );
}
