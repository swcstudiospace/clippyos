import { createFileRoute } from "@tanstack/react-router";
import { readLibraryBytes, verifyLibraryToken } from "@/lib/server/library-storage.server";
import { getVersionRow } from "@/lib/server/library.server";

export const Route = createFileRoute("/api/library/file")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("t")?.trim() || "";
        if (!token) return new Response("Missing token", { status: 400 });
        const verified = await verifyLibraryToken(token);
        if (!verified) return new Response("Expired or invalid", { status: 403 });
        const version = await getVersionRow(verified.versionId);
        if (!version) return new Response("Not found", { status: 404 });
        let bytes: Buffer;
        try {
          bytes = await readLibraryBytes(version.storageKey);
        } catch {
          return new Response("Not found", { status: 404 });
        }
        const mime = version.mimeType || "application/octet-stream";
        const unsafe =
          /svg|xml|html|javascript/i.test(mime) || !/^(video|image|audio)\//i.test(mime);
        const wantsDownload = url.searchParams.get("download") === "1";
        let disposition = unsafe ? "attachment" : "inline";
        if (wantsDownload && !unsafe) {
          const { getAsset } = await import("@/lib/server/library.server");
          const asset = await getAsset(version.assetId);
          const ext =
            (version.mimeType?.split("/")[1] ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5) ||
            "bin";
          const base =
            (asset?.title ?? "clip")
              .replace(/[^\w\- ]+/g, "")
              .trim()
              .replace(/\s+/g, "-")
              .slice(0, 80) || "clip";
          disposition = `attachment; filename="${base}.${ext}"`;
        }
        return new Response(new Uint8Array(bytes), {
          status: 200,
          headers: {
            "content-type": unsafe ? "application/octet-stream" : mime,
            "x-content-type-options": "nosniff",
            "cache-control": "private, max-age=60",
            "content-disposition": disposition,
          },
        });
      },
    },
  },
});
