import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SOCIAL_MACHINE_OS,
  DEFAULT_SOCIAL_MACHINE_SIZE,
  DEFAULT_SOCIAL_TIMEZONE,
  FILEBASE_ENDPOINT,
  HOT_SNAPSHOT_NAME,
  LIBRARY_BUCKET,
  TARGET_WINDOWS_RESOURCES,
  WINDOWS_GEO_ID,
  WINDOWS_TIMEZONE_ID,
  composeProxyUrl,
  ensureBridgeDirsCommand,
  bridgeStatusNote,
  bucketMountScript,
  ensureUploadDirCommand,
  hibernatePlan,
  idlePolicy,
  instagramGeoWarning,
  ipfsGatewayUrl,
  ipfsStrategyNote,
  isHotSnapshot,
  isWindowsSnapshot,
  libraryBackendNote,
  listWindowsCommand,
  linuxBucketMountScript,
  machineDropKey,
  machineDropPath,
  machineLibraryRoot,
  mapProviderState,
  openUrlCommand,
  parseCid,
  parseHttpsProxy,
  parseIpfsGateway,
  parseIpfsPinStrategy,
  parseProxyCountry,
  parseProxyListLine,
  parseResidentialProxy,
  parseS3Config,
  parseSocialMachineOs,
  parseSocialMachineRegion,
  parseSocialMachineSize,
  pickLibraryBackend,
  proxyscrapeListUrl,
  freeProxyListUrls,
  osForSize,
  linuxProxyScript,
  shouldResizeWindows,
  snapshotCandidates,
  snapshotForSize,
  socialMachineDomainAllowList,
  stopActionForOs,
  uploadPath,
  verifyMachineMountCommand,
  windowsBucketMountScript,
  windowsLocaleScript,
  windowsProxyScript,
} from "./social-machine.ts";

test("defaults to daytona-vm-medium Linux Social Machine in Sydney locale", () => {
  assert.equal(DEFAULT_SOCIAL_MACHINE_OS, "linux");
  assert.equal(DEFAULT_SOCIAL_MACHINE_SIZE, "daytona-vm-medium");
  assert.equal(snapshotForSize("daytona-vm-medium"), "daytona-vm-medium");
  assert.equal(osForSize("daytona-vm-medium"), "linux");
  assert.equal(osForSize("windows-large"), "windows");
  assert.equal(DEFAULT_SOCIAL_TIMEZONE, "Australia/Sydney");
  assert.ok(isWindowsSnapshot("windows-large"));
  assert.equal(isWindowsSnapshot("daytona-vm-medium"), false);
});

test("size parser accepts linux default and still maps windows aliases", () => {
  assert.equal(parseSocialMachineSize("windows-large"), "windows-large");
  assert.equal(parseSocialMachineSize("windows-medium"), "windows-medium");
  assert.equal(parseSocialMachineSize("windows-small"), "windows-medium");
  assert.equal(parseSocialMachineSize("linux"), "daytona-vm-medium");
  assert.equal(parseSocialMachineSize(""), "daytona-vm-medium");
  assert.equal(parseSocialMachineSize("daytona-medium"), "daytona-vm-medium");
});

test("Daytona regions are us or eu — there is no Australia target", () => {
  assert.equal(parseSocialMachineRegion("eu"), "eu");
  assert.equal(parseSocialMachineRegion("US"), "us");
  assert.equal(parseSocialMachineRegion("ap-sydney"), "us");
  assert.match(instagramGeoWarning("us"), /no Australia region/i);
  assert.match(instagramGeoWarning("us"), /Graph API/i);
});

test("idle policy pauses instead of destroying", () => {
  const policy = idlePolicy(20);
  assert.equal(policy.autoStopInterval, 0);
  assert.equal(policy.autoPauseInterval, 20);
  assert.equal(policy.autoDeleteInterval, -1);
  assert.equal(stopActionForOs("windows"), "pause");
  assert.equal(stopActionForOs("linux"), "stop");
  assert.equal(HOT_SNAPSHOT_NAME, "clippy-os-social-hot");
});

test("hibernate plan snapshots while running then pauses — never after pause, never delete", () => {
  const plan = hibernatePlan();
  assert.equal(plan.primary, "pause");
  assert.equal(plan.snapshotWhileRunning, true);
  assert.equal(plan.neverDelete, true);
  assert.equal(plan.snapshotAfterPause, false);
});

test("snapshot candidates prefer linux default and fall back off Windows quota", () => {
  assert.deepEqual(snapshotCandidates("daytona-vm-medium", null), [
    "daytona-vm-medium",
    "daytona-medium",
  ]);
  assert.deepEqual(snapshotCandidates("windows-large", null), [
    "windows-large",
    "windows-medium",
    "daytona-vm-medium",
  ]);
  assert.deepEqual(snapshotCandidates("windows-large", HOT_SNAPSHOT_NAME), [
    HOT_SNAPSHOT_NAME,
    "windows-large",
    "windows-medium",
    "daytona-vm-medium",
  ]);
  assert.ok(isHotSnapshot(HOT_SNAPSHOT_NAME));
  assert.equal(isHotSnapshot("windows-large"), false);
});

test("undersized Windows VMs should hot-resize to 4 vCPU / 16 GiB", () => {
  assert.deepEqual(TARGET_WINDOWS_RESOURCES, { cpu: 4, memory: 16 });
  assert.equal(shouldResizeWindows(2, 8), true);
  assert.equal(shouldResizeWindows(4, 16), false);
  assert.equal(shouldResizeWindows(4, 8), true);
  assert.equal(shouldResizeWindows(null, null), false);
});

test("provider state maps pause/archive to paused so Resume works", () => {
  assert.equal(mapProviderState("started"), "running");
  assert.equal(mapProviderState("paused"), "paused");
  assert.equal(mapProviderState("archived"), "paused");
  assert.equal(mapProviderState("pausing"), "stopping");
  assert.equal(mapProviderState("pulling_snapshot"), "starting");
  assert.equal(mapProviderState("snapshotting"), "stopping");
  assert.notEqual(mapProviderState("snapshotting"), "starting");
  assert.notEqual(mapProviderState("snapshotting"), "running");
});

test("Windows open-url never uses xdg-open", () => {
  const cmd = openUrlCommand("windows", "https://www.instagram.com/");
  assert.match(cmd, /Start-Process/);
  assert.doesNotMatch(cmd, /xdg-open/);
  const linux = openUrlCommand("linux", "https://www.instagram.com/");
  assert.match(linux, /xdg-open/);
  assert.throws(() => openUrlCommand("windows", "javascript:alert(1)"));
});

test("upload paths and locale script are Windows-native and Australia-scoped", () => {
  assert.equal(
    uploadPath("windows", "job-1", ".mp4"),
    "C:\\Users\\Public\\ClippyOS\\uploads\\job-1.mp4",
  );
  assert.match(ensureUploadDirCommand("windows"), /ClippyOS\\uploads/);
  const locale = windowsLocaleScript();
  assert.match(locale, new RegExp(WINDOWS_TIMEZONE_ID));
  assert.match(locale, new RegExp(String(WINDOWS_GEO_ID)));
  assert.match(locale, /en-AU/);
  assert.match(locale, /Set-WinUserLanguageList/);
  assert.match(listWindowsCommand("windows"), /Get-Process/);
});

test("Windows proxy script sets WinHTTP and IE/Edge proxy from an https URL", () => {
  assert.equal(windowsProxyScript(null), null);
  assert.equal(windowsProxyScript("ftp://nope"), null);
  const script = windowsProxyScript("https://user:p@ss@gate.au.example:8443");
  assert.ok(script);
  assert.match(script, /winhttp set proxy/);
  assert.match(script, /ProxyEnable/);
  assert.match(script, /gate.au.example:8443/);
  assert.doesNotMatch(script, /xdg-open/);
});

test("proxy parser only accepts http(s) URLs", () => {
  assert.equal(parseHttpsProxy("https://gate.example:8443"), "https://gate.example:8443/");
  assert.equal(parseHttpsProxy("ftp://nope"), null);
  assert.equal(parseHttpsProxy(""), null);
});

test("library stays on Supabase or S3 — never the Windows VM", () => {
  assert.equal(pickLibraryBackend({ hasSupabase: true }), "supabase");
  assert.equal(pickLibraryBackend({ hasSupabase: false, hasS3: true }), "s3");
  assert.equal(pickLibraryBackend({ hasSupabase: true, hasS3: true }), "supabase");
  assert.equal(pickLibraryBackend({ hasSupabase: false }), "local");
  assert.equal(LIBRARY_BUCKET, "clippy-library");
  assert.match(libraryBackendNote("supabase"), /not the library/i);
  assert.match(libraryBackendNote("s3"), /not the library/i);
  assert.equal(FILEBASE_ENDPOINT, "https://s3.filebase.com");
});

test("S3 config parser accepts Filebase-style endpoints and rejects blanks", () => {
  const ok = parseS3Config({
    endpoint: "https://s3.filebase.com",
    region: "us-east-1",
    bucket: "clippy-clips",
    accessKey: "keykeykeykey",
    secret: "secretsecretsecret",
  });
  assert.ok(ok);
  assert.equal(ok?.endpoint, "https://s3.filebase.com");
  assert.equal(ok?.bucket, "clippy-clips");
  assert.equal(parseS3Config({ endpoint: "not-a-url", bucket: "x", accessKey: "k", secret: "s" }), null);
  assert.equal(parseS3Config({ endpoint: FILEBASE_ENDPOINT, bucket: "", accessKey: "k", secret: "s" }), null);
});

test("os parser treats unknown as linux", () => {
  assert.equal(parseSocialMachineOs("windows"), "windows");
  assert.equal(parseSocialMachineOs("linux"), "linux");
  assert.equal(parseSocialMachineOs("darwin"), "linux");
});

test("residential proxy structured fields compose an https URL", () => {
  const parsed = parseResidentialProxy({
    host: "gate.sydney.example",
    port: "8000",
    username: "au-user",
    password: "s3cret",
    protocol: "https",
  });
  assert.ok(parsed);
  assert.equal(composeProxyUrl(parsed), "https://au-user:s3cret@gate.sydney.example:8000");
});

test("IPFS CID parser rejects Windows paths", () => {
  assert.equal(
    parseCid("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"),
    "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
  );
  assert.equal(parseCid("C:\\Users\\Public\\ClippyOS\\uploads\\x.mp4"), null);
  const gateway = parseIpfsGateway("https://ipfs.filebase.io/ipfs/");
  assert.ok(gateway);
  const url = ipfsGatewayUrl(gateway, "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi");
  assert.match(url, /^https:\/\/ipfs\.filebase\.io\/ipfs\/bafy/);
});

test("IPFS pin strategies never treat the Windows VM as a backend", () => {
  assert.equal(parseIpfsPinStrategy("on_publish"), "on_publish");
  assert.equal(parseIpfsPinStrategy("replicate"), "replicate");
  assert.equal(parseIpfsPinStrategy("nope"), "eager");
  assert.match(ipfsStrategyNote("eager"), /never the write backend/i);
  assert.doesNotMatch(ipfsStrategyNote("replicate"), /ClippyOS\\uploads/);
});

test("location proxy list is country-scoped and parses ProxyScrape lines", () => {
  assert.equal(parseProxyCountry("au"), "AU");
  assert.equal(parseProxyCountry("mars"), "AU");
  assert.match(proxyscrapeListUrl("AU"), /country=AU/);
  assert.match(proxyscrapeListUrl("AU", "https"), /protocol=https/);
  const lists = freeProxyListUrls("AU");
  assert.equal(lists.length, 3);
  assert.match(lists[0] ?? "", /country=AU/);
  assert.match(parseProxyListLine("http://203.0.113.10:8080") ?? "", /203\.0\.113\.10:8080/);
  assert.equal(parseProxyListLine("socks5://nope"), null);
  assert.match(linuxProxyScript("http://203.0.113.10:8080") ?? "", /proxy-applied/);
});

test("storage bridge paths map Windows drives and POSIX mounts to machine-drops keys", () => {
  assert.equal(machineLibraryRoot("windows"), "Y:");
  assert.equal(machineLibraryRoot("linux"), "/home/daytona/library");
  assert.equal(
    machineDropPath("windows", "clip-1.mp4"),
    "Y:\\machine-drops\\clip-1.mp4",
  );
  assert.equal(machineDropPath("linux", "clip-1.mp4"), "/home/daytona/library/machine-drops/clip-1.mp4");
  // Path traversal and separators never survive into bucket keys.
  assert.equal(machineDropKey("../../etc/passwd"), "machine-drops/.._.._etc_passwd");
  assert.equal(machineDropKey("sub/dir/clip.mp4"), "machine-drops/sub_dir_clip.mp4");
});

test("bucket mount scripts embed config but short-circuit when mounted", () => {
  const input = {
    endpoint: "https://s3.filebase.com",
    region: "us-east-1",
    bucket: "clippy-library",
    accessKey: "keykeykeykey",
    secret: "secretsecretsecret",
  };
  const win = windowsBucketMountScript(input);
  assert.match(win, /mount-present/);
  assert.match(win, /clippy-bridge/);
  assert.match(win, /rclone\.exe/);
  assert.match(win, /vfs-cache-mode/);
  assert.doesNotMatch(win.replace(/access_key_id = .*$/m, ""), /^keykeykeykey$/m);
  const linux = linuxBucketMountScript(input);
  assert.match(linux, /mountpoint -q/);
  assert.match(linux, /chmod 600/);
  assert.equal(bucketMountScript("linux", input), linux);
});

test("bridge verify + bootstrap commands are os-native and idempotent", () => {
  assert.match(verifyMachineMountCommand("windows"), /machine-drops/);
  assert.match(verifyMachineMountCommand("linux"), /^test -d/);
  assert.match(ensureBridgeDirsCommand("windows"), /New-Item/);
  assert.match(ensureBridgeDirsCommand("linux"), /mkdir -p/);
  assert.match(bridgeStatusNote(false, null), /not configured/i);
  assert.match(bridgeStatusNote(true, true), /mounted/i);
  assert.match(bridgeStatusNote(true, false), /not mounted/i);
  assert.match(bridgeStatusNote(true, null), /unknown/i);
});

test("Social Machine egress defaults to a publisher domain allowlist", () => {
  const def = socialMachineDomainAllowList();
  assert.ok(def);
  assert.match(def ?? "", /tiktok\.com/);
  assert.match(def ?? "", /instagram\.com/);
  assert.match(def ?? "", /youtube\.com/);
  assert.equal(socialMachineDomainAllowList("unrestricted"), undefined);
  assert.equal(socialMachineDomainAllowList("*"), undefined);
  assert.equal(socialMachineDomainAllowList("example.com, *.tiktok.com"), "example.com,*.tiktok.com");
});
