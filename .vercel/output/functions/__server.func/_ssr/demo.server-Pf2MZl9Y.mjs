import { A as isMissingTable } from "./mappers-Bmic_hyw.mjs";
import { n as APP_TAGLINE, r as BRAND_ACCENT_HEX, t as APP_NAME } from "./constants-CdtfzQP2.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { n as getAgencyAdmin, r as localSql } from "./agency-db.server-C5U0oEf7.mjs";
import { r as readAppSetting } from "./app-settings.server-BlmGCrwi.mjs";
import { D as parseProxyCountry } from "./social-machine-D22Q8XQF.mjs";
import { n as parseDemoEmail, r as parseDemoName, t as DEMO_ROLES } from "./demo-BGRHcPAA.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/demo.server-Pf2MZl9Y.js
function demoConfirmationEmail(input) {
	const first = input.name.split(" ")[0] || input.name;
	const subject = `We received your ${APP_NAME} demo request`;
	const text = [
		`Hi ${first},`,
		"",
		`Thanks for requesting a demo of ${APP_NAME} — ${APP_TAGLINE}.`,
		input.company ? `We’ll reach out about ${input.company} shortly.` : "We’ll reach out shortly.",
		"",
		"ClippyOS is the autonomous operating system for clipping: Social Machine for X, YouTube, Instagram, and TikTok; Telegram, WhatsApp, and Discord for liaison; Hermes Agent and Linear kanban, natively.",
		"",
		"If you didn’t request this, you can ignore the note.",
		"",
		APP_NAME
	].join("\n");
	return {
		subject,
		html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&display=swap" />
</head>
<body style="margin:0;padding:0;background:#050a08;color:#f3faf6;font-family:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:-0.03em;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050a08;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0e1612;border:1px solid rgba(52,211,153,0.18);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;border-radius:10px;background:#04140e;border:1px solid ${BRAND_ACCENT_HEX};text-align:center;vertical-align:middle;color:${BRAND_ACCENT_HEX};font-weight:700;font-size:13px;">C</td>
                  <td style="padding-left:12px;font-weight:600;font-size:16px;letter-spacing:-0.02em;color:#f3faf6;">${APP_NAME}</td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:12px;color:#8aa396;">${APP_TAGLINE}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              <h1 style="margin:16px 0 12px;font-size:26px;line-height:1.15;letter-spacing:-0.03em;color:#f3faf6;">Demo request received.</h1>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#c5d5cc;">Hi ${escapeHtml(first)} — thanks for reaching out${input.company ? ` about ${escapeHtml(input.company)}` : ""}.</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#c5d5cc;">We’ll be in touch to walk the OS: Social Machine for X, YouTube, Instagram, and TikTok; Telegram, WhatsApp, and Discord for liaison; Hermes Agent and Linear kanban, natively. Clips live in immutable cloud storage. The machine hibernates hot.</p>
              <p style="margin:24px 0 0;padding:14px 16px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(52,211,153,0.18);font-size:13px;color:#8aa396;">No action needed. If you didn’t request a demo, ignore this note.</p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#5f7469;">${APP_NAME} · Autonomous Operating System for Clipping</p>
      </td>
    </tr>
  </table>
</body>
</html>`,
		text
	};
}
function escapeHtml(value) {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function loadResendKey() {
	const env = process.env.RESEND_API_KEY?.trim() || "";
	if (env && env.length > 12) return env;
	const stored = (await readAppSetting("RESEND_API_KEY"))?.trim() || "";
	return stored.length > 12 ? stored : null;
}
async function sendTransactionalEmail(mail) {
	const key = await loadResendKey();
	if (!key) return { sent: false };
	const from = process.env.DEMO_FROM_EMAIL?.trim() || (await readAppSetting("DEMO_FROM_EMAIL"))?.trim() || `ClippyOS <beth.t@example.com>`;
	return { sent: (await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${key}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			from,
			to: [mail.to],
			subject: mail.subject,
			html: mail.html,
			text: mail.text
		}),
		signal: AbortSignal.timeout(15e3)
	})).ok };
}
var SCHEMA = `
create table if not exists demo_requests (
  id          text primary key,
  name        text not null,
  email       text not null,
  company     text,
  role        text,
  country     text,
  message     text,
  emailed     text not null default '0',
  created_at  timestamptz not null default now()
)`;
var ready = null;
async function ensureSchema() {
	if (ready) return ready;
	ready = (async () => {
		try {
			await (await localSql()).query(`${SCHEMA};`);
		} catch {}
	})();
	return ready;
}
var hits = /* @__PURE__ */ new Map();
function rateLimit(key) {
	const last = hits.get(key) ?? 0;
	if (Date.now() - last < 8e3) throw new Error("DEMO_RATE_LIMIT");
	hits.set(key, Date.now());
}
async function submitDemoRequest(input) {
	rateLimit(input.ip || String(input.email));
	const name = parseDemoName(input.name);
	const email = parseDemoEmail(input.email);
	if (!name || !email) throw new Error("VALIDATION");
	const company = sanitizeText(String(input.company ?? "")).slice(0, 120);
	const roleRaw = String(input.role ?? "other").trim().toLowerCase();
	const role = DEMO_ROLES.includes(roleRaw) ? roleRaw : "other";
	const country = parseProxyCountry(input.country);
	const message = sanitizeText(String(input.message ?? "")).slice(0, 2e3);
	const id = crypto.randomUUID();
	const stamp = (/* @__PURE__ */ new Date()).toISOString();
	await ensureSchema();
	const payload = {
		id,
		name,
		email,
		company: company || null,
		role,
		country,
		message: message || null,
		emailed: "0",
		created_at: stamp
	};
	const admin = await getAgencyAdmin();
	if (admin) {
		const { error } = await admin.from("demo_requests").insert(payload);
		if (error && !isMissingTable(error)) throw new Error("DATA_UNAVAILABLE");
	} else await (await localSql()).query(`insert into demo_requests (id, name, email, company, role, country, message, emailed, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
		id,
		name,
		email,
		company || null,
		role,
		country,
		message || null,
		"0",
		stamp
	]);
	const mail = demoConfirmationEmail({
		name,
		company
	});
	const sent = await sendTransactionalEmail({
		to: email,
		subject: mail.subject,
		html: mail.html,
		text: mail.text
	});
	if (sent.sent) {
		if (admin) await admin.from("demo_requests").update({ emailed: "1" }).eq("id", id).then(() => void 0);
		else await (await localSql()).query(`update demo_requests set emailed = '1' where id = $1`, [id]);
	}
	return {
		ok: true,
		emailed: sent.sent
	};
}
//#endregion
export { submitDemoRequest };
