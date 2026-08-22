import { readAppSetting, writeAppSetting } from "@/lib/server/app-settings.server";
import { listApiKeyRows } from "@/lib/server/autonomy-auth.server";
import {
  readLastDelivery,
  readLastDeliveryByEvent,
  readOutboundConfig,
} from "@/lib/server/autonomy-events.server";
import {
  readAutomationEnabled,
  readPlaybookPolicies,
} from "@/lib/server/autonomy-policy.server";
import {
  deriveConnectSteps,
  deriveHermesConnection,
  PLAYBOOK_PACKAGE_VERSION,
  type HermesConnectFlags,
  type HermesConnectStatus,
} from "@/lib/connect";
import { formatPlaybookPackage } from "@/lib/playbooks";
import type { HermesConnectionState } from "@/lib/autonomy";

const CONNECT_KEY = "HERMES_CONNECT_JSON";

const EMPTY_FLAGS: HermesConnectFlags = {
  pastedIntoHermes: false,
  pastedAt: null,
  socialPolicyAckedAt: null,
  outboundSkipped: false,
};

export async function readConnectFlags(): Promise<HermesConnectFlags> {
  const raw = await readAppSetting(CONNECT_KEY);
  if (!raw) return { ...EMPTY_FLAGS };
  try {
    const parsed = JSON.parse(raw) as Partial<HermesConnectFlags>;
    return {
      pastedIntoHermes: parsed.pastedIntoHermes === true,
      pastedAt: typeof parsed.pastedAt === "string" ? parsed.pastedAt : null,
      socialPolicyAckedAt:
        typeof parsed.socialPolicyAckedAt === "string" ? parsed.socialPolicyAckedAt : null,
      outboundSkipped: parsed.outboundSkipped === true,
    };
  } catch {
    return { ...EMPTY_FLAGS };
  }
}

export async function writeConnectFlags(patch: Partial<HermesConnectFlags>): Promise<HermesConnectFlags> {
  const current = await readConnectFlags();
  const next: HermesConnectFlags = { ...current, ...patch };
  await writeAppSetting(CONNECT_KEY, JSON.stringify(next));
  return next;
}

function saneWhen(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  if (time < Date.parse("2020-01-01T00:00:00.000Z") || time > Date.now() + 120_000) return null;
  return value;
}

export async function buildConnectStatus(): Promise<HermesConnectStatus> {
  const [keys, flags, outbound, lastDelivery, byEvent, enabled, policies, mcpHash, webhookSecret, daytona] =
    await Promise.all([
      listApiKeyRows(),
      readConnectFlags(),
      readOutboundConfig(),
      readLastDelivery(),
      readLastDeliveryByEvent(),
      readAutomationEnabled(),
      readPlaybookPolicies(),
      readAppSetting("MCP_TOKEN_HASH"),
      readAppSetting("WEBHOOK_SIGNING_SECRET"),
      readAppSetting("DAYTONA_API_KEY"),
    ]);
  const active = keys.filter((row) => !row.revokedAt);
  const hermesKey =
    active.find((row) => row.name.toLowerCase().includes("hermes")) ?? active[0] ?? null;
  const keyLastUsedAt = active
    .map((row) => saneWhen(row.lastUsedAt))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
  const hasHermesKey = active.length > 0;
  const hermesConnection = deriveHermesConnection({ hasHermesKey, keyLastUsedAt });
  const socialPolicyAcked = Boolean(flags.socialPolicyAckedAt);
  const outboundUrlConfigured = Boolean(outbound.destinationUrl);
  const steps = deriveConnectSteps({
    hasHermesKey,
    keyLastUsedAt,
    pastedIntoHermes: flags.pastedIntoHermes,
    socialPolicyAcked,
    outboundUrlConfigured,
    outboundSkipped: flags.outboundSkipped,
  });
  let socialMachineState = "not_configured";
  try {
    const { peekSocialHealth } = await import("@/lib/server/social");
    const health = await peekSocialHealth();
    socialMachineState = health.state;
  } catch {
    socialMachineState = daytona?.trim() ? "stopped" : "not_configured";
  }

  return {
    hasHermesKey,
    keyLastUsedAt,
    keyLast4: hermesKey?.last4 ?? null,
    keyName: hermesKey?.name ?? null,
    hermesConnection,
    playbookPackageVersion: PLAYBOOK_PACKAGE_VERSION,
    pastedIntoHermes: flags.pastedIntoHermes,
    pastedAt: flags.pastedAt,
    socialPolicyAcked,
    outboundSkipped: flags.outboundSkipped,
    policies,
    webhookSubscriptions: outbound.events,
    outboundUrlConfigured,
    lastDelivery: {
      at: saneWhen(lastDelivery.at),
      status: lastDelivery.status,
      eventType: lastDelivery.eventType,
    },
    lastDeliveryByEvent: byEvent,
    daytonaConnected: Boolean(daytona?.trim()),
    socialMachineState,
    automationEnabled: enabled,
    mcpConfigured: Boolean(mcpHash),
    webhookConfigured: Boolean(webhookSecret),
    steps,
    completedRequired: Number(steps.mintKey) + Number(steps.pastePlaybook) + Number(steps.socialPolicy),
    requiredTotal: 3,
  };
}

export function connectionFromStatus(status: HermesConnectStatus): HermesConnectionState {
  return status.hermesConnection;
}

export async function buildPlaybookPackageText(origin?: string): Promise<{
  version: string;
  text: string;
}> {
  const [policies, enabled, skills, llm] = await Promise.all([
    readPlaybookPolicies(),
    readAutomationEnabled(),
    import("@/lib/server/skills.server").then((mod) => mod.listPublicSkills()).catch(() => []),
    import("@/lib/server/llm-router.server").then((mod) => mod.readLlmRouter()).catch(() => null),
  ]);
  return {
    version: PLAYBOOK_PACKAGE_VERSION,
    text: formatPlaybookPackage({
      policies,
      enabled,
      origin,
      version: PLAYBOOK_PACKAGE_VERSION,
      skills: skills.map((row) => ({ slug: row.slug, name: row.name, version: row.version })),
      llmProvider: llm?.defaultProvider,
      llmModel: llm?.defaultModel,
    }),
  };
}
