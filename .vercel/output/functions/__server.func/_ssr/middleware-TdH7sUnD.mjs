import { n as createMiddleware } from "./ssr2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/middleware-TdH7sUnD.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-C4IS_tWT.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-BhkgXDma.mjs");
	const { requireUserId } = await import("./verify.server-Bpwplt8y.mjs").then((n) => n.n);
	assertSameSiteRequest();
	const userId = await requireUserId(context.bearerToken);
	try {
		const { isOperatorRevoked } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
		if (await isOperatorRevoked(userId)) {
			const { ForbiddenError } = await import("./access-CV3glphY.mjs").then((n) => n.t).then((n) => n.t);
			throw new ForbiddenError();
		}
	} catch (error) {
		if (error instanceof Error && error.name === "ForbiddenError") throw error;
	}
	return next({ context: { userId } });
});
//#endregion
export { authMiddleware as t };
