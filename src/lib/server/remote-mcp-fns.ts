import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { requireAdmin } from "@/lib/server/access";
import { MCP_PRESET_IDS, MCP_SCOPES } from "@/lib/remote-mcp";

export const getRemoteMcpSnapshotFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { buildRemoteMcpSnapshot } = await import("@/lib/server/remote-mcp.server");
    return buildRemoteMcpSnapshot();
  });

export const mintRemoteMcpTokenFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        label: z.string().trim().min(1).max(80),
        preset: z.enum(MCP_PRESET_IDS).optional(),
        scopes: z.array(z.enum(MCP_SCOPES)).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const { mintRemoteMcpToken, buildRemoteMcpSnapshot } = await import("@/lib/server/remote-mcp.server");
    const minted = await mintRemoteMcpToken({
      label: data.label,
      preset: data.preset,
      scopes: data.scopes,
      actorId: context.userId,
    });
    const snapshot = await buildRemoteMcpSnapshot();
    return { ...minted, snapshot };
  });

export const revokeRemoteMcpTokenFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: unknown) => z.string().min(1).parse(id))
  .handler(async ({ context, data: id }) => {
    await requireAdmin(context.userId);
    const { revokeRemoteMcpToken, buildRemoteMcpSnapshot } = await import("@/lib/server/remote-mcp.server");
    await revokeRemoteMcpToken(id);
    return buildRemoteMcpSnapshot();
  });
