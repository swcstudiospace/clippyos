import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getUserRole } from "@/lib/server/access";
import { CHANNEL_PROVIDERS } from "@/lib/channels";

async function requireUser(userId: string) {
  const role = await getUserRole(userId);
  if (!role) throw new Error("Forbidden");
  return role;
}

export const getChannelsSnapshotFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireUser(context.userId);
    const { readClients } = await import("@/lib/server/clients");
    const { channelsSnapshot } = await import("@/lib/server/channels.server");
    const clients = (await readClients())
      .filter((row) => !row.deletedAt)
      .map((row) => ({ id: row.id, name: row.name }));
    return channelsSnapshot(clients);
  });

export const listChannelMessagesFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ threadId: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { listMessages, getThread } = await import("@/lib/server/channels.server");
    const thread = await getThread(data.threadId);
    if (!thread) throw new Error("THREAD_MISSING");
    return { thread, messages: await listMessages(data.threadId) };
  });

export const sendChannelMessageFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        threadId: z.string().min(1).optional(),
        provider: z.enum(CHANNEL_PROVIDERS).optional(),
        to: z.string().max(64).optional(),
        body: z.string().min(1).max(4000),
        clientId: z.string().min(1).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { sendChannelMessage } = await import("@/lib/server/channels.server");
    return sendChannelMessage({
      actorId: context.userId,
      threadId: data.threadId,
      provider: data.provider,
      to: data.to,
      body: data.body,
      clientId: data.clientId,
    });
  });

export const assignChannelThreadFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ threadId: z.string().min(1), clientId: z.string().min(1).nullable() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireUser(context.userId);
    const { assignThreadClient } = await import("@/lib/server/channels.server");
    await assignThreadClient(data.threadId, data.clientId);
    return { ok: true as const };
  });

export const testResidentialProxyFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ proxyUrl: z.string().max(400).optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    const role = await requireUser(context.userId);
    if (role !== "admin") throw new Error("Forbidden");
    const { testResidentialProxy } = await import("@/lib/server/daytona.server");
    return testResidentialProxy(data.proxyUrl);
  });
