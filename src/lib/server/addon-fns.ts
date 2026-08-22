import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const listAddons = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { buildAddonsSnapshot } = await import("@/lib/server/addons.server");
    return buildAddonsSnapshot();
  });

export const setAddonEnabled = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z.object({ id: z.string().min(1), enabled: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { setAddonEnabledInternal } = await import("@/lib/server/addons.server");
    return setAddonEnabledInternal(data);
  });

export const installAddonManifest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ manifest: z.unknown() }).parse(input))
  .handler(async ({ context, data }) => {
    const { requireAdmin } = await import("@/lib/server/access");
    await requireAdmin(context.userId);
    const { installAddonManifestInternal } = await import("@/lib/server/addons.server");
    return installAddonManifestInternal(data.manifest);
  });
