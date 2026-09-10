/**
 * Login-button flags that always resolve on the server.
 *
 * Route loaders run in-process on client navigation, so they must not call
 * `resolveGoogleSocial()` / `publishedBrokerConfigured()` directly (browser
 * env is empty and would hide configured OAuth buttons). This GET server fn
 * reads Vercel/process env. Booleans only — never return secrets.
 */
import { createServerFn } from "@tanstack/react-start";
import { brokerButtonsEnabled, resolveGoogleSocial, resolveTwitterSocial } from "./google-social";
import type { SignInFlags } from "./providers";

export const loadSignInFlags = createServerFn({ method: "GET" }).handler(async (): Promise<SignInFlags> => ({
  googleConfigured: Boolean(resolveGoogleSocial()),
  twitterConfigured: Boolean(resolveTwitterSocial()),
  brokerConfigured: brokerButtonsEnabled(),
}));
