import { createFileRoute } from "@tanstack/react-router";
import { authenticateApiKey } from "@/lib/server/autonomy-auth.server";
import { sanitizeRequestId } from "@/lib/security-headers";
import { runAutonomyAction } from "@/lib/server/autonomy-actions.server";
import { readIdempotency, writeIdempotency, writeAuditLog } from "@/lib/server/autonomy-audit.server";
import { hasScope, type ApiKeyScope } from "@/lib/autonomy";
import {
  checkCrayoLogin,
  clippingSnapshot,
  runClippingProcedureSkill,
} from "@/lib/server/clipping.server";

function json(status: number, body: unknown, extra?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

function requestIdOf(request: Request): string {
  return sanitizeRequestId(request.headers.get("x-request-id"));
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (request.method === "GET" || request.method === "HEAD") return {};
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    throw new Error("VALIDATION");
  }
}

type ClippingRoute =
  | { kind: "session" }
  | { kind: "check-login" }
  | { kind: "run-procedure"; slug: string };

const CLIPPING_SCOPES: Record<ClippingRoute["kind"], ApiKeyScope> = {
  session: "read",
  "check-login": "write:clipping",
  "run-procedure": "write:clipping",
};

function matchClippingRoute(method: string, parts: string[]): ClippingRoute | null {
  const [a, b, c, d] = parts;
  if (method === "GET" && a === "clipping" && b === "session" && !c) return { kind: "session" };
  if (method === "POST" && a === "clipping" && b === "crayo" && c === "check-login" && !d) {
    return { kind: "check-login" };
  }
  if (method === "POST" && a === "clipping" && b === "skills" && c && d === "run") {
    return { kind: "run-procedure", slug: c };
  }
  return null;
}
function clippingErrorStatus(code: string): number {
  if (code === "MACHINE_STOPPED") return 409;
  if (code === "DAYTONA_UNAVAILABLE") return 503;
  if (code === "SKILL_MISSING" || code === "NOT_A_BROWSER_PROCEDURE") return 404;
  return 400;
}

/**
 * Scoped direct handling for the clipping v1 surface. The write paths are
 * gated by the `write:clipping` scope and audited here (the procedure run is
 * additionally audited per-run by the executor).
 */
async function handleClippingRoute(
  route: ClippingRoute,
  input: { actor: { source: "api" | "mcp" | "webhook"; keyId: string | null; label: string; scopes: ApiKeyScope[] }; requestId: string },
): Promise<{ ok: true; data: unknown } | { ok: false; status: number; code: string; message: string }> {
  const { actor, requestId } = input;
  if (!hasScope(actor.scopes, CLIPPING_SCOPES[route.kind])) {
    if (route.kind !== "session") {
      await writeAuditLog({
        requestId,
        actor,
        action: route.kind === "check-login" ? "clipping.check_crayo_login" : "clipping.run_browser_procedure",
        result: "denied",
        errorCode: "FORBIDDEN",
      });
    }
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: `This endpoint requires the ${CLIPPING_SCOPES[route.kind]} scope.`,
    };
  }
  try {
    if (route.kind === "session") return { ok: true, data: await clippingSnapshot("") };
    if (route.kind === "check-login") {
      const data = await checkCrayoLogin();
      await writeAuditLog({
        requestId,
        actor,
        action: "clipping.check_crayo_login",
        entityType: "platform",
        entityId: "crayo.io",
        result: "ok",
      });
      return { ok: true, data };
    }
    const data = await runClippingProcedureSkill({ slug: route.slug, actorId: actor.keyId ?? actor.label });
    return { ok: true, data };
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLIPPING_FAILED";
    if (route.kind === "check-login") {
      await writeAuditLog({
        requestId,
        actor,
        action: "clipping.check_crayo_login",
        entityType: "platform",
        entityId: "crayo.io",
        result: "error",
        errorCode: code,
      });
    }
    return {
      ok: false,
      status: clippingErrorStatus(code),
      code,
      message: "Clipping request failed.",
    };
  }
}

function parsePath(url: URL): string[] {
  return url.pathname.replace(/^\/api\/v1\/?/, "").split("/").filter(Boolean);
}

function idempotencyCacheKey(keyId: string | null, method: string, path: string, idem: string): string {
  return `api:${keyId}:${method}:${path}:${idem}`;
}

function encodeIdempotencyRecord(status: number, body: string): string {
  return JSON.stringify({ status, body });
}

function decodeIdempotencyRecord(cached: string): { status: number; body: string } {
  try {
    const parsed = JSON.parse(cached) as { status?: unknown; body?: unknown };
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.status === "number" &&
      typeof parsed.body === "string"
    ) {
      return { status: parsed.status, body: parsed.body };
    }
  } catch {
    /* body-only cache from before status was persisted */
  }
  return { status: 200, body: cached };
}

function routeAction(
  method: string,
  parts: string[],
  body: Record<string, unknown>,
  search: URLSearchParams,
): { action: string; payload: Record<string, unknown> } | null {
  const [a, b, c, d] = parts;
  if (method === "GET" && parts.length === 0) return { action: "get_dashboard_snapshot", payload: {} };
  if (method === "GET" && a === "dashboard") return { action: "get_dashboard_snapshot", payload: {} };
  if (method === "GET" && a === "playbooks") return { action: "get_playbook_catalog", payload: {} };
  if (method === "GET" && a === "automation" && b === "connect-status") {
    return { action: "get_connect_status", payload: {} };
  }
  if (method === "GET" && a === "automation" && b === "playbook-package") {
    return { action: "get_playbook_package", payload: { origin: body.origin ?? search.get("origin") } };
  }
  if (method === "GET" && a === "integrations" && (!b || b === "status")) {
    return { action: "get_integration_status", payload: {} };
  }
  if (method === "GET" && a === "clients" && b === "at-risk") {
    return { action: "list_at_risk_clients", payload: {} };
  }
  if (method === "GET" && a === "clients" && !b) {
    return {
      action: "list_clients",
      payload: {
        search: search.get("search") ?? "",
        status: search.get("status"),
      },
    };
  }
  if (method === "POST" && a === "clients" && !b) return { action: "create_client", payload: body };
  if (method === "GET" && a === "clients" && b && !c) return { action: "get_client", payload: { id: b } };
  if (method === "PATCH" && a === "clients" && b && !c) {
    return { action: "update_client", payload: { ...body, id: b } };
  }
  if (method === "GET" && a === "clients" && b && c === "progress") {
    return { action: "get_client_progress", payload: { clientId: b } };
  }
  if (method === "POST" && a === "clients" && b && c === "progress") {
    return { action: "set_client_stage", payload: { ...body, clientId: b } };
  }
  if (method === "GET" && a === "clients" && b && c === "analytics") {
    return { action: "get_analytics_snapshot", payload: { clientId: b } };
  }
  if (method === "POST" && a === "clients" && b && c === "analytics" && d === "pull") {
    return { action: "pull_client_analytics", payload: { clientId: b } };
  }
  if (method === "POST" && a === "clients" && b && c === "suggested-titles" && d === "regenerate") {
    return { action: "regenerate_suggested_titles", payload: { clientId: b } };
  }
  if (method === "POST" && a === "clients" && b && c === "suggested-ideas" && d === "regenerate") {
    return { action: "regenerate_suggested_ideas", payload: { clientId: b } };
  }
  if (method === "GET" && a === "payments") {
    return { action: "list_payments", payload: { clientId: search.get("clientId") } };
  }
  if (method === "POST" && a === "payments" && b && c === "mark-paid") {
    return { action: "mark_payment_paid", payload: { id: b } };
  }
  if (method === "GET" && a === "leads") return { action: "list_leads", payload: {} };
  if (method === "POST" && a === "leads") return { action: "create_lead", payload: body };
  if (method === "PATCH" && a === "leads" && b) {
    return { action: "update_lead", payload: { ...body, id: b } };
  }
  if (method === "GET" && a === "jobs" && b) return { action: "get_job", payload: { id: b } };

  if (method === "GET" && a === "social" && b === "machine" && !c) {
    return { action: "social.get_machine_status", payload: {} };
  }
  if (method === "POST" && a === "social" && b === "machine" && c === "start") {
    return { action: "social.start_machine", payload: body };
  }
  if (method === "POST" && a === "social" && b === "machine" && c === "stop") {
    return { action: "social.stop_machine", payload: body };
  }
  if (method === "POST" && a === "social" && b === "machine" && c === "auto-stop") {
    return { action: "social.set_auto_stop", payload: body };
  }
  if (method === "POST" && a === "social" && b === "machine" && c === "computer-use") {
    return { action: "social.ensure_computer_use", payload: body };
  }
  if (method === "POST" && a === "social" && b === "machine" && c === "force-stop") {
    return { action: "social.force_stop_if_running", payload: body };
  }
  if (method === "GET" && a === "social" && b === "desktop" && c === "preview") {
    return { action: "social.get_desktop_preview", payload: {} };
  }
  if (method === "POST" && a === "social" && b === "screenshot") {
    return { action: "social.take_screenshot", payload: body };
  }
  if (method === "GET" && a === "social" && b === "windows") {
    return { action: "social.list_open_windows", payload: {} };
  }
  if (method === "GET" && a === "social" && b === "platforms" && !c) {
    return { action: "social.list_platforms", payload: {} };
  }
  if (method === "GET" && a === "social" && b === "publishers" && !c) {
    return { action: "social.get_publisher_status", payload: {} };
  }
  if (method === "GET" && a === "social" && b === "platforms" && c && !d) {
    return { action: "social.get_platform_status", payload: { platform: c } };
  }
  if (method === "POST" && a === "social" && b === "platforms" && c && d === "session") {
    return { action: "social.mark_platform_session", payload: { ...body, platform: c } };
  }
  if (method === "POST" && a === "social" && b === "platforms" && c && d === "open") {
    return { action: "social.open_platform", payload: { ...body, platform: c } };
  }
  if (method === "POST" && a === "social" && b === "platforms" && c && d === "health") {
    return { action: "social.check_session_health", payload: { ...body, platform: c } };
  }
  if (method === "GET" && a === "social" && b === "assets" && !c) {
    return { action: "social.list_uploadable_assets", payload: { clientId: search.get("clientId") } };
  }
  if (method === "GET" && a === "social" && b === "assets" && c) {
    return {
      action: "social.resolve_asset",
      payload: { assetId: c, clientId: search.get("clientId") ?? body.clientId },
    };
  }
  if (method === "POST" && a === "social" && b === "jobs" && c === "bulk") {
    return { action: "social.bulk_create_upload_jobs", payload: body };
  }
  if (method === "POST" && a === "social" && b === "jobs" && !c) {
    return { action: "social.create_upload_job", payload: body };
  }
  if (method === "GET" && a === "social" && b === "jobs" && !c) {
    return {
      action: "social.list_upload_jobs",
      payload: {
        clientId: search.get("clientId"),
        platform: search.get("platform"),
        status: search.get("status"),
        since: search.get("since"),
      },
    };
  }
  if (method === "GET" && a === "social" && b === "jobs" && c && !d) {
    return { action: "social.get_upload_job", payload: { id: c } };
  }
  if (method === "POST" && a === "social" && b === "jobs" && c && d === "retry") {
    return { action: "social.retry_upload_job", payload: { ...body, id: c } };
  }
  if (method === "POST" && a === "social" && b === "jobs" && c && d === "cancel") {
    return { action: "social.cancel_upload_job", payload: { ...body, id: c } };
  }
  if (method === "GET" && a === "social" && b === "posts" && !c) {
    return {
      action: "social.list_posts",
      payload: {
        clientId: search.get("clientId"),
        platform: search.get("platform"),
        status: search.get("status"),
      },
    };
  }
  if (method === "GET" && a === "social" && b === "posts" && c) {
    return { action: "social.get_post", payload: { id: c } };
  }
  if (method === "POST" && a === "social" && b === "plan") {
    return { action: "social.plan_distribution", payload: body };
  }
  if (method === "GET" && a === "social" && b === "cost-guard") {
    return { action: "social.get_cost_guard", payload: {} };
  }
  if (method === "GET" && a === "addons") return { action: "list_addons", payload: {} };
  if (method === "GET" && a === "skills" && !b) return { action: "skills.list", payload: {} };
  if (method === "GET" && a === "skills" && b && !c) return { action: "skills.get", payload: { id: b } };
  if (method === "POST" && a === "skills" && !b) return { action: "skills.create", payload: body };
  if (method === "POST" && a === "skills" && b && c === "invoke") {
    return { action: "skills.invoke", payload: { ...body, id: b } };
  }
  if (method === "PATCH" && a === "skills" && b && !c) {
    return { action: "skills.patch", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "skills" && b && c === "enabled") {
    return { action: "skills.set_enabled", payload: { ...body, id: b } };
  }
  if (method === "GET" && a === "tasks" && b) return { action: "tasks.get", payload: { id: b } };
  if (method === "GET" && a === "llm" && (b === "providers" || b === "models" || !b)) {
    return { action: "get_llm_providers", payload: {} };
  }
  if (method === "POST" && a === "skill-manage" && b === "create") {
    return { action: "skill_manage.create", payload: body };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "edit") {
    return { action: "skill_manage.edit", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "patch") {
    return { action: "skill_manage.patch", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "files") {
    return { action: "skill_manage.write_file", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "enabled") {
    return { action: "skill_manage.set_enabled", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "review") {
    return { action: "skill_manage.set_provenance_review", payload: { ...body, id: b } };
  }
  if (method === "GET" && a === "skill-manage" && b && c === "versions") {
    return { action: "skill_manage.list_versions", payload: { id: b } };
  }
  if (method === "POST" && a === "skill-manage" && b && c === "rollback") {
    return { action: "skill_manage.rollback", payload: { ...body, id: b } };
  }
  if (method === "POST" && a === "vision" && b === "analyze") {
    return { action: "vision.analyze", payload: body };
  }
  if (method === "POST" && a === "vision" && b === "compare") {
    return { action: "vision.compare", payload: body };
  }
  if (method === "POST" && a === "computer" && b === "start") return { action: "computer.start", payload: body };
  if (method === "POST" && a === "computer" && b === "stop") return { action: "computer.stop", payload: body };
  if (method === "POST" && a === "computer" && b === "screenshot") return { action: "computer.screenshot", payload: body };
  if (method === "POST" && a === "computer" && b === "mouse-click") return { action: "computer.mouse_click", payload: body };
  if (method === "POST" && a === "computer" && b === "mouse-move") return { action: "computer.mouse_move", payload: body };
  if (method === "POST" && a === "computer" && b === "mouse-drag") return { action: "computer.mouse_drag", payload: body };
  if (method === "POST" && a === "computer" && b === "scroll") return { action: "computer.mouse_scroll", payload: body };
  if (method === "POST" && a === "computer" && b === "type") return { action: "computer.keyboard_type", payload: body };
  if (method === "POST" && a === "computer" && b === "key") return { action: "computer.keyboard_key", payload: body };
  if (method === "POST" && a === "computer" && b === "a11y") return { action: "computer.accessibility_find", payload: body };
  if (method === "GET" && a === "computer" && b === "windows") return { action: "computer.list_windows", payload: {} };
  if (method === "POST" && a === "browser" && b === "open") return { action: "browser.open_url", payload: body };
  if (method === "POST" && a === "browser" && b === "wait") return { action: "browser.wait_for_text", payload: body };
  if (method === "POST" && a === "browser" && b === "upload") return { action: "browser.upload_file", payload: body };
  if (method === "POST" && a === "browser" && b === "summary") return { action: "browser.get_page_summary", payload: body };
  if (method === "POST" && a === "browser" && b === "instagram") return { action: "browser.open_instagram_upload", payload: body };
  if (method === "POST" && a === "browser" && b === "x") return { action: "browser.open_x_compose", payload: body };
  if (method === "POST" && a === "browser" && b === "tiktok") return { action: "browser.open_tiktok_upload", payload: body };
  if (method === "POST" && a === "clipping" && b === "research") return { action: "clipping.research_channel", payload: body };
  if (method === "POST" && a === "clipping" && b === "ideas") return { action: "clipping.generate_ideas", payload: body };
  if (method === "POST" && a === "clipping" && b === "titles") return { action: "clipping.generate_titles", payload: body };
  if (method === "POST" && a === "clipping" && b === "thumbnail") return { action: "clipping.generate_thumbnail", payload: body };
  if (method === "POST" && a === "clipping" && b === "stage") return { action: "clipping.set_stage", payload: body };
  if (method === "POST" && a === "clipping" && b === "publish") return { action: "clipping.mark_published", payload: body };
  if (method === "POST" && a === "clipping" && b === "distribute") return { action: "clipping.distribute_social", payload: body };
  if (method === "POST" && a === "clipping" && b === "skill") return { action: "clipping.run_skill", payload: body };
  if (method === "POST" && a === "clipping" && b === "observe") return { action: "clipping.observe_desktop", payload: body };
  if (method === "GET" && a === "library" && b === "assets" && !c) {
    return { action: "library.search_assets", payload: { clientId: search.get("clientId"), search: search.get("q") } };
  }
  if (method === "GET" && a === "library" && b === "assets" && c) {
    return { action: "library.get_asset", payload: { id: c } };
  }
  if (method === "POST" && a === "library" && b === "ingest") {
    return { action: "library.ingest_url", payload: body };
  }
  if (method === "POST" && a === "library" && b === "clips") {
    return { action: "library.ingest_stream_clip", payload: body };
  }
  if (method === "POST" && a === "library" && b === "thumbnails") {
    return { action: "library.ingest_thumbnail", payload: body };
  }
  if (method === "POST" && a === "library" && b === "renders" && !c) {
    return { action: "library.queue_render", payload: body };
  }
  if (method === "GET" && a === "library" && b === "renders") {
    return { action: "library.list_renders", payload: { assetId: search.get("assetId") } };
  }
  if (method === "POST" && a === "library" && b === "attach") {
    return { action: "library.attach_to_social_job", payload: body };
  }
  if (method === "GET" && a === "library" && b === "status") {
    return { action: "library.get_pipeline_status", payload: {} };
  }
  return null;
}

async function handle(request: Request): Promise<Response> {
  const rid = requestIdOf(request);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "GET,POST,PATCH,OPTIONS" } });
  }
  let actor;
  try {
    actor = await authenticateApiKey(request.headers.get("authorization"));
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNAUTHORIZED";
    if (code === "RATE_LIMITED") {
      return json(429, { error: { code, message: "Too many requests." }, requestId: rid }, { "Retry-After": "60" });
    }
    void writeAuditLog({
      requestId: rid,
      actor: { source: "api", keyId: null, label: "unknown" },
      action: "auth",
      result: "denied",
      errorCode: "UNAUTHORIZED",
    });
    return json(401, { error: { code: "UNAUTHORIZED", message: "Invalid or revoked API key." }, requestId: rid });
  }

  const url = new URL(request.url);
  const parts = parsePath(url);
  // The clipping procedure-run endpoint accepts both header spellings — the
  // Deno driver sends X-Idempotency-Key while sibling endpoints use
  // idempotency-key.
  const idempotencyHeaders = ["idempotency-key", "x-idempotency-key"];
  if (matchClippingRoute(request.method, parts)?.kind === "run-procedure") {
    idempotencyHeaders.reverse();
  }
  const idem = idempotencyHeaders
    .map((header) => request.headers.get(header)?.trim())
    .find(Boolean);
  const cacheKey = idem ? idempotencyCacheKey(actor.keyId, request.method, url.pathname, idem) : null;
  if (cacheKey) {
    const cached = await readIdempotency(cacheKey);
    if (cached) {
      const replay = decodeIdempotencyRecord(cached);
      return new Response(replay.body, {
        status: replay.status,
        headers: { "Content-Type": "application/json; charset=utf-8", "X-Request-Id": rid },
      });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = await readJson(request);
  } catch {
    return json(400, { error: { code: "VALIDATION", message: "JSON body required." }, requestId: rid });
  }

  const clipRoute = matchClippingRoute(request.method, parts);
  if (clipRoute) {
    const clipResult = await handleClippingRoute(clipRoute, { actor, requestId: rid });
    const headers: HeadersInit = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Request-Id": rid,
    };
    if (!clipResult.ok) {
      return json(clipResult.status, { error: { code: clipResult.code, message: clipResult.message }, requestId: rid }, headers);
    }
    const encoded = JSON.stringify({ data: clipResult.data, requestId: rid });
    if (cacheKey) await writeIdempotency(cacheKey, encodeIdempotencyRecord(200, encoded));
    return new Response(encoded, { status: 200, headers });
  }
  const mapped = routeAction(request.method, parts, body, url.searchParams);
  if (!mapped) {
    return json(404, { error: { code: "NOT_FOUND", message: "Unknown endpoint." }, requestId: rid });
  }
  if (mapped.action === "get_playbook_package" && !mapped.payload.origin) {
    mapped.payload.origin = url.origin;
  }

  const result = await runAutonomyAction({
    actor,
    action: mapped.action,
    payload: mapped.payload,
    requestId: rid,
    playbookId: request.headers.get("x-playbook-id") || (typeof body.playbook === "string" ? body.playbook : null),
    runId: request.headers.get("x-run-id") || (typeof body.runId === "string" ? body.runId : null),
  });
  if (!result.ok) {
    const headers: HeadersInit = { "X-Request-Id": rid };
    if (result.status === 429) (headers as Record<string, string>)["Retry-After"] = "60";
    return json(result.status, { error: { code: result.code, message: result.message }, requestId: rid }, headers);
  }
  const encoded = JSON.stringify({ data: result.data, requestId: rid });
  const status = mapped.action.startsWith("create") && request.method === "POST" ? 201 : 200;
  if (cacheKey) await writeIdempotency(cacheKey, encodeIdempotencyRecord(status, encoded));
  return new Response(encoded, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Request-Id": rid,
    },
  });
}

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
      PATCH: ({ request }) => handle(request),
      OPTIONS: ({ request }) => handle(request),
    },
  },
});
