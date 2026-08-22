/** Trusted ClippyOS client agreement — generated server-side, never from user URLs. */

const TITLE = "CLIPPY ADMIN — CLIENT SERVICES AGREEMENT";

const PARAGRAPHS: string[] = [
  "This Client Services Agreement (the “Agreement”) is between the agency operating ClippyOS (the “Agency”) and the client named on the signature page (the “Client”). It governs YouTube and social content production for the Client’s personal brand.",
  "1. Scope of services. Agency will staff a dedicated production team which may include a channel manager, short-form editor, long-form editor, and thumbnail designer, as specified in the Client’s plan. Services typically cover ideation, filming guidance, editing, thumbnail design, upload, and performance review. Short-form clips are derived from long-form videos of at least four (4) minutes unless the parties agree otherwise in writing.",
  "2. Fees. Unless a custom plan is agreed in writing, the standard setup fee is USD 30,000 and the monthly retainer is USD 3,000 (Team only) or USD 5,000 (Personal involved). Custom monthly retainers, if any, are set in one-thousand dollar increments. Setup fees are invoiced on signing. Monthly retainers are invoiced in advance of each billing period and are due on the date shown on the invoice.",
  "3. Channel access. Client will grant Agency lasting access required to perform the work: YouTube Studio (or equivalent), brand accounts, thumbnail and footage storage, and analytics. Client remains the owner of the channel. Agency will not change the channel name, custom URL, or monetization settings without written approval.",
  "4. Discord and communication. Client will join the Agency Discord (or agreed workspace) and keep a single point of contact available on business days. Production stage updates, footage drops, and review notes live in that workspace. Delayed replies may move a video to “Waiting for footage” or “In review” and pause the production calendar.",
  "5. Footage expectations. Client will deliver usable footage for each long-form video: clear audio, stable picture, and enough runtime for a video of at least four minutes after edit. Pickup shots and B-roll requested by Agency should arrive within five business days. Agency is not responsible for delays caused by missing or unusable footage.",
  "6. First 30 days — views increase guarantee. Agency guarantees a full refund of the setup fee if the Client’s channel does not see a views increase in the first thirty (30) days after the Client start date recorded in ClippyOS. Day 1 is the start date (inclusive). The comparison uses Analytics snapshots captured for the channel during that window. The guarantee does not apply if the Client: (a) fails to deliver footage or access; (b) pauses or restricts publishing; (c) is in arrears; or (d) has a CHURNED or deleted record. Refunds, if owed, are paid after Agency verifies analytics. Monthly retainers already earned are not refundable under this clause.",
  "7. Term and pause. The Agreement starts on the Client start date and continues month-to-month until either party gives thirty (30) days’ written notice. Agency may pause production for unpaid invoices. Client may request a production pause of up to one billing period; retainers remain payable unless the parties agree otherwise.",
  "8. Intellectual property. Client owns the finished videos, titles, thumbnails, and channel content produced under this Agreement once invoices for that work are paid. Agency retains its pre-existing tools, templates, internal playbooks, and ClippyOS software. Agency may show anonymized results in its portfolio unless Client objects in writing.",
  "9. Confidentiality. Each party will keep the other’s non-public business, creative, and financial information confidential, and will use it only to perform this Agreement. This duty lasts two (2) years after the Agreement ends, and indefinitely for trade secrets.",
  "10. Limitation of liability. Except for confidentiality breaches, unpaid fees, or the 30-day setup-fee guarantee above, each party’s total liability under this Agreement is limited to the fees paid by Client in the three (3) months before the claim. Neither party is liable for indirect or consequential damages.",
  "11. Independent contractor. Agency and its team members are independent contractors, not employees or partners of Client. Agency assigns work internally and remains responsible for its subcontractors.",
  "12. General. This Agreement is the entire agreement for the production work described here. Changes must be in writing. If a clause is unenforceable, the rest remains in force. Notices may be sent to the emails on file in ClippyOS. Governing law is the jurisdiction of the Agency’s principal place of business, unless the parties agree otherwise in writing.",
  "By signing (or by paying the setup invoice), Client confirms they have read this Agreement, have authority to bind the brand, and agree to the 30-day views-increase guarantee and the production terms above.",
  "Signature block — Client name: ___________________________    Date: ______________",
  "Signature block — Agency: ClippyOS operator             Date: ______________",
];

function pdfEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, (char) => {
      const code = char.charCodeAt(0);
      if (code === 8217 || code === 146) return "'";
      if (code === 8216) return "'";
      if (code === 8220 || code === 8221 || code === 147 || code === 148) return '"';
      if (code === 8211 || code === 8212) return "-";
      return " ";
    });
}

function wrapLine(text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= width) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (word.length > width) {
      for (let i = 0; i < word.length; i += width) {
        const slice = word.slice(i, i + width);
        if (i + width < word.length) lines.push(slice);
        else current = slice;
      }
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPageContent(lines: string[], pageNumber: number, pageCount: number): string {
  const commands: string[] = ["BT", "/F1 16 Tf", "54 738 Td", `(${pdfEscape(TITLE)}) Tj`];
  commands.push("/F1 10 Tf", "0 -22 Td");
  let first = true;
  for (const line of lines) {
    if (first) {
      commands.push(`(${pdfEscape(line)}) Tj`);
      first = false;
    } else {
      commands.push("0 -14 Td", `(${pdfEscape(line)}) Tj`);
    }
  }
  commands.push("ET");
  commands.push("BT", "/F1 9 Tf", "54 36 Td", `(Page ${pageNumber} of ${pageCount}  ·  ClippyOS  ·  Confidential) Tj`, "ET");
  return commands.join("\n");
}

export function buildClientAgreementPdf(): Uint8Array {
  const wrapped: string[] = [];
  for (const paragraph of PARAGRAPHS) {
    wrapped.push(...wrapLine(paragraph, 90));
    wrapped.push("");
  }

  const linesPerPage = 44;
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push([""]);

  const pageIds: number[] = [];
  let nextId = 4;
  const fontId = 3;
  const pageObjectIds: Array<{ pageId: number; contentId: number; stream: string }> = [];
  for (let i = 0; i < pages.length; i += 1) {
    const pageId = nextId;
    const contentId = nextId + 1;
    nextId += 2;
    pageIds.push(pageId);
    pageObjectIds.push({
      pageId,
      contentId,
      stream: buildPageContent(pages[i]!, i + 1, pages.length),
    });
  }

  const objects: Array<{ id: number; body: string }> = [
    { id: 1, body: "<< /Type /Catalog /Pages 2 0 R >>" },
    {
      id: 2,
      body: `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
    },
    { id: 3, body: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>" },
  ];
  for (const page of pageObjectIds) {
    objects.push({
      id: page.pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${page.contentId} 0 R >>`,
    });
    objects.push({
      id: page.contentId,
      body: `<< /Length ${Buffer.byteLength(page.stream, "utf8")} >>\nstream\n${page.stream}\nendstream`,
    });
  }
  objects.sort((a, b) => a.id - b.id);

  let output = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets[obj.id] = Buffer.byteLength(output, "utf8");
    output += `${obj.id} 0 obj\n${obj.body}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(output, "utf8");
  const maxId = objects[objects.length - 1]!.id;
  output += `xref\n0 ${maxId + 1}\n`;
  output += "0000000000 65535 f \n";
  for (let i = 1; i <= maxId; i += 1) {
    const offset = offsets[i] ?? 0;
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(output, "utf8");
}

export const CLIENT_AGREEMENT_FILENAME = "Clippy-Admin-Client-Agreement.pdf";
