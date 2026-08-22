import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseE164,
  parseTelegramChatId,
  telegramApiUrl,
  whatsappMessagesUrl,
  whatsappSubscribedAppsUrl,
} from "./channels.ts";
import {
  composeProxyUrl,
  ipfsGatewayUrl,
  parseCid,
  parseIpfsGateway,
  parseResidentialProxy,
} from "./social-machine.ts";

test("Telegram API URL is bot-scoped and rejects junk tokens", () => {
  const url = telegramApiUrl("123456:ABC-DEF_ghiJKLmnopQRSTUVwxyz", "getMe");
  assert.match(url, /^https:\/\/api\.telegram\.org\/bot123456:ABC-DEF_ghiJKLmnopQRSTUVwxyz\/getMe$/);
  assert.throws(() => telegramApiUrl("short", "getMe"));
  assert.throws(() => telegramApiUrl("123456:ABC-DEF_ghiJKLmnopQRSTUVwxyz", "../secret"));
});

test("WhatsApp Cloud API URL uses the phone number id", () => {
  assert.equal(
    whatsappMessagesUrl("15551234567"),
    "https://graph.facebook.com/v21.0/15551234567/messages",
  );
  assert.equal(
    whatsappSubscribedAppsUrl("15551234567"),
    "https://graph.facebook.com/v21.0/15551234567/subscribed_apps",
  );
  assert.throws(() => whatsappMessagesUrl("abc"));
});

test("E.164 and Telegram chat ids are strict", () => {
  assert.equal(parseE164("+61412345678"), "+61412345678");
  assert.equal(parseE164("0412 345 678"), null);
  assert.equal(parseTelegramChatId("123456789"), "123456789");
  assert.equal(parseTelegramChatId("@clippy_os"), "@clippy_os");
  assert.equal(parseTelegramChatId("not a chat"), null);
});

test("residential proxy composes from host/port/user without leaking ftp", () => {
  const parsed = parseResidentialProxy({
    host: "gate.sydney.example",
    port: "8000",
    username: "au-user",
    password: "s3cret",
    protocol: "https",
  });
  assert.ok(parsed);
  assert.equal(parsed.host, "gate.sydney.example");
  assert.equal(parsed.port, 8000);
  const url = composeProxyUrl(parsed);
  assert.match(url, /^https:\/\/au-user:s3cret@gate\.sydney\.example:8000$/);
  assert.equal(parseResidentialProxy({ url: "socks5://nope" }), null);
});

test("proxy URL paste round-trips into structured fields", () => {
  const parsed = parseResidentialProxy({
    url: "https://user:p%40ss@proxy.au.example:8443",
  });
  assert.equal(parsed?.host, "proxy.au.example");
  assert.equal(parsed?.port, 8443);
  assert.equal(parsed?.username, "user");
  assert.equal(parsed?.password, "p@ss");
});

test("IPFS gateway and CID stay on ipfs:// paths, never the Windows VM", () => {
  assert.equal(parseCid("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"), "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
  assert.equal(parseCid("C:\\Users\\Public\\ClippyOS\\uploads\\x.mp4"), null);
  const gateway = parseIpfsGateway("https://ipfs.filebase.io/ipfs/");
  assert.ok(gateway);
  const url = ipfsGatewayUrl(gateway, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
  assert.match(url, /^https:\/\/ipfs\.filebase\.io\/ipfs\/bafy/);
  assert.doesNotMatch(url, /ClippyOS/);
});
