import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { ingestBytes } from "@/lib/server/library-pipeline.server";
import { readMediaSettings } from "@/lib/server/library.server";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/library/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const header = request.headers.get("authorization");
        const bearer = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
        const user = await getSessionUser(bearer);
        if (!user) return json(401, { error: "Unauthorized" });
        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json(400, { error: "VALIDATION" });
        }
        const file = form.get("file");
        if (!(file instanceof File)) return json(400, { error: "VALIDATION" });
        const settings = await readMediaSettings();
        if (file.size > settings.maxUploadMb * 1024 * 1024) return json(400, { error: "MEDIA_TOO_LARGE" });
        const bytes = Buffer.from(await file.arrayBuffer());
        const clientRaw = form.get("clientId");
        const clientId = typeof clientRaw === "string" && clientRaw.trim() ? clientRaw.trim() : null;
        const titleRaw = form.get("title");
        const title = typeof titleRaw === "string" ? titleRaw : file.name;
        try {
          const result = await ingestBytes({
            actorId: user.id,
            clientId,
            title: title || file.name || "Upload",
            filename: file.name,
            mimeHint: file.type,
            bytes,
            source: "UPLOAD",
          });
          return json(200, {
            asset: {
              id: result.asset.id,
              title: result.asset.title,
              status: result.asset.status,
              kind: result.asset.kind,
              previewUrl: result.asset.previewUrl,
            },
            duplicate: result.duplicate,
          });
        } catch (error) {
          const code = error instanceof Error ? error.message : "DATA_UNAVAILABLE";
          return json(400, { error: code });
        }
      },
    },
  },
});
