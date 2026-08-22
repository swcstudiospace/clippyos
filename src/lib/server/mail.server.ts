import { APP_NAME } from "@/lib/constants";
import { readAppSetting } from "@/lib/server/app-settings.server";
import { demoConfirmationEmail } from "@/lib/demo-email";

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export { demoConfirmationEmail };

export async function loadResendKey(): Promise<string | null> {
  const env = process.env.RESEND_API_KEY?.trim() || "";
  if (env && env.length > 12) return env;
  const stored = (await readAppSetting("RESEND_API_KEY"))?.trim() || "";
  return stored.length > 12 ? stored : null;
}

export async function sendTransactionalEmail(mail: OutboundEmail): Promise<{ sent: boolean }> {
  const key = await loadResendKey();
  if (!key) return { sent: false };
  const from =
    process.env.DEMO_FROM_EMAIL?.trim() ||
    (await readAppSetting("DEMO_FROM_EMAIL"))?.trim() ||
    `${APP_NAME} <beth.t@example.com>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
    signal: AbortSignal.timeout(15000),
  });
  return { sent: response.ok };
}
