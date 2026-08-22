import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

export const listStreamVodsFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        clientId: z.string().min(1),
        twitchLogin: z.string().max(40).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { streamListVods } = await import("@/lib/server/stream-tools.server");
    return streamListVods({
      clientId: data.clientId,
      twitchLogin: data.twitchLogin,
      actorId: context.userId,
    });
  });
