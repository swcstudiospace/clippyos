import { Bt as _enum, Jt as object, Zt as string } from "../_libs/@better-auth/core+[...].mjs";
import { i as createServerFn } from "./ssr2.mjs";
import { t as authMiddleware } from "./middleware-TdH7sUnD.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { r as CHANNEL_PROVIDERS } from "./channels-BG56fSeM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/channel-fns-DBsr47y0.js
var getChannelsSnapshotFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("f42b98229e88b5ea16fb41fe8662de85bd30fab27e6e1f5b958d99492e640f72"));
var listChannelMessagesFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ threadId: string().min(1) }).parse(input)).handler(createSsrRpc("71043b0f1a254b5f4abc99a00c28523e1ce0295ad6e664e377df789cb1b4c8cf"));
var sendChannelMessageFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1).optional(),
	provider: _enum(CHANNEL_PROVIDERS).optional(),
	to: string().max(64).optional(),
	body: string().min(1).max(4e3),
	clientId: string().min(1).nullable().optional()
}).parse(input)).handler(createSsrRpc("f1f56c71e95fee9159870dde446fbc86ef641d336cc35175540b43898d03889a"));
var assignChannelThreadFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	threadId: string().min(1),
	clientId: string().min(1).nullable()
}).parse(input)).handler(createSsrRpc("1c68749e67b772a96594be7f3ffb77c7dec71add703e896b7030e79104c16b90"));
var testResidentialProxyFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ proxyUrl: string().max(400).optional() }).parse(input ?? {})).handler(createSsrRpc("59c80583a26f532c1cc4e5f51e59ff4b7c451b4e107eed7d8b7e32597c5ca19c"));
//#endregion
export { testResidentialProxyFn as a, sendChannelMessageFn as i, getChannelsSnapshotFn as n, listChannelMessagesFn as r, assignChannelThreadFn as t };
