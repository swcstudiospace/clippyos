import { createFileRoute } from "@tanstack/react-router";
import { completeLinearOAuth } from "@/lib/server/linear.server";

function html(ok: boolean, message: string): Response {
  const payload = JSON.stringify({
    source: "clippy-linear-oauth",
    ok,
    provider: "linear",
    error: ok ? null : message,
  });
  const body = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${ok ? "Connected" : "Couldn’t connect"}</title>
  </head>
  <body style="font-family:system-ui;background:#05070d;color:#f5f7fb;padding:2rem">
    <p>${ok ? "Linear connected. You can close this window." : message}</p>
    <script>
      (function () {
        var payload = ${payload};
        try {
          if (window.opener) window.opener.postMessage(payload, window.location.origin);
        } catch (e) {}
        window.close();
      })();
    </script>
  </body>
</html>`;
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export const Route = createFileRoute("/api/oauth/linear")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const error = url.searchParams.get("error");
        const code = url.searchParams.get("code")?.trim() || "";
        const state = url.searchParams.get("state")?.trim() || "";
        if (error) return html(false, "Linear denied the connection.");
        if (!code || !state) return html(false, "Missing OAuth code. Start Connect from Settings.");
        try {
          await completeLinearOAuth({ code, state });
          return html(true, "Connected");
        } catch {
          return html(false, "Couldn’t finish Linear connect. Try again from Settings.");
        }
      },
    },
  },
});
