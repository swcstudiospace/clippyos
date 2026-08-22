import { APP_NAME, APP_TAGLINE, BRAND_ACCENT_HEX } from "./constants";

export function demoConfirmationEmail(input: {
  name: string;
  company: string;
}): { subject: string; html: string; text: string } {
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
    APP_NAME,
  ].join("\n");
  const html = `<!DOCTYPE html>
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
</html>`;
  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}
