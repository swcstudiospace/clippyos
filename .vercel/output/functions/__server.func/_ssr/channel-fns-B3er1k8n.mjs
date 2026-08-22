import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { n as getUserRole } from "./access-CV3glphY.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { r as CHANNEL_PROVIDERS } from "./channels-BG56fSeM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel-fns-B3er1k8n.js
async function requireUser(userId) {
	const role = await getUserRole(userId);
	if (!role) throw new Error("Forbidden");
	return role;
}
var getChannelsSnapshotFn_createServerFn_handler = createServerRpc({
	id: "f42b98229e88b5ea16fb41fe8662de85bd30fab27e6e1f5b958d99492e640f72",
	name: "getChannelsSnapshotFn",
	filename: "src/lib/server/channel-fns.ts"
}, (opts) => getChannelsSnapshotFn.__executeServer(opts));
var getChannelsSnapshotFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getChannelsSnapshotFn_createServerFn_handler, async ({ context }) => {
	await requireUser(context.userId);
	const { readClients } = await import("./clients-CmcyBPZd.mjs").then((n) => n.n).then((n) => n.n);
	const { channelsSnapshot } = await import("./channels.server-D0O4sCtY.mjs");
	return channelsSnapshot((await readClients()).filter((row) => !row.deletedAt).map((row) => ({
		id: row.id,
		name: row.name
	})));
});
var listChannelMessagesFn_createServerFn_handler = createServerRpc({
	id: "71043b0f1a254b5f4abc99a00c28523e1ce0295ad6e664e377df789cb1b4c8cf",
	name: "listChannelMessagesFn",
	filename: "src/lib/server/channel-fns.ts"
}, (opts) => listChannelMessagesFn.__executeServer(opts));
var listChannelMessagesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ threadId: string().min(1) }).parse(input)).handler(listChannelMessagesFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { listMessages, getThread } = await import("./channels.server-D0O4sCtY.mjs");
	const thread = await getThread(data.threadId);
	if (!thread) throw new Error("THREAD_MISSING");
	return {
		thread,
		messages: await listMessages(data.threadId)
	};
});
var sendChannelMessageFn_createServerFn_handler = createServerRpc({
	id: "f1f56c71e95fee9159870dde446fbc86ef641d336cc35175540b43898d03889a",
	name: "sendChannelMessageFn",
	filename: "src/lib/server/channel-fns.ts"
}, (opts) => sendChannelMessageFn.__executeServer(opts));
var sendChannelMessageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1).optional(),
	provider: _enum(CHANNEL_PROVIDERS).optional(),
	to: string().max(64).optional(),
	body: string().min(1).max(4e3),
	clientId: string().min(1).nullable().optional()
}).parse(input)).handler(sendChannelMessageFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { sendChannelMessage } = await import("./channels.server-D0O4sCtY.mjs");
	return sendChannelMessage({
		actorId: context.userId,
		threadId: data.threadId,
		provider: data.provider,
		to: data.to,
		body: data.body,
		clientId: data.clientId
	});
});
var assignChannelThreadFn_createServerFn_handler = createServerRpc({
	id: "1c68749e67b772a96594be7f3ffb77c7dec71add703e896b7030e79104c16b90",
	name: "assignChannelThreadFn",
	filename: "src/lib/server/channel-fns.ts"
}, (opts) => assignChannelThreadFn.__executeServer(opts));
var assignChannelThreadFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1),
	clientId: string().min(1).nullable()
}).parse(input)).handler(assignChannelThreadFn_createServerFn_handler, async ({ context, data }) => {
	await requireUser(context.userId);
	const { assignThreadClient } = await import("./channels.server-D0O4sCtY.mjs");
	await assignThreadClient(data.threadId, data.clientId);
	return { ok: true };
});
var testResidentialProxyFn_createServerFn_handler = createServerRpc({
	id: "59c80583a26f532c1cc4e5f51e59ff4b7c451b4e107eed7d8b7e32597c5ca19c",
	name: "testResidentialProxyFn",
	filename: "src/lib/server/channel-fns.ts"
}, (opts) => testResidentialProxyFn.__executeServer(opts));
var testResidentialProxyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ proxyUrl: string().max(400).optional() }).parse(input ?? {})).handler(testResidentialProxyFn_createServerFn_handler, async ({ context, data }) => {
	if (await requireUser(context.userId) !== "admin") throw new Error("Forbidden");
	const { testResidentialProxy } = await import("./daytona.server-Ccwltk3g.mjs").then((n) => n.t).then((n) => n.t);
	return testResidentialProxy(data.proxyUrl);
});
//#endregion
export { assignChannelThreadFn_createServerFn_handler, getChannelsSnapshotFn_createServerFn_handler, listChannelMessagesFn_createServerFn_handler, sendChannelMessageFn_createServerFn_handler, testResidentialProxyFn_createServerFn_handler };
