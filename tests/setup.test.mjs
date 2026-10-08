import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { setup, ensureSecrets, validateName, validateUrl, readConfig, LOGIN_SCOPES } from "../scripts/setup.mjs";
import { cloudflare, run } from "../scripts/cloudflare.mjs";

const template = readConfig(new URL("../wrangler.jsonc", import.meta.url));
function fixture(t) {
  const cwd = mkdtempSync(resolve(tmpdir(), "yourspace-setup-"));
  writeFileSync(resolve(cwd, "wrangler.jsonc"), JSON.stringify(template));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  return cwd;
}

function fakeCloudflare({ database = false, bucket = false, failList = false, secretNames = [] } = {}) {
  const calls = [];
  let workerExists = secretNames.length > 0;
  const execute = (tool, args, options = {}) => {
    calls.push({ tool, args, options });
    let stdout = "";
    if (args[0] === "whoami") {
      stdout = JSON.stringify({ accounts: [{ id: "account-1", name: "Test Account" }] });
    } else if (args[0] === "secret" && args[1] === "list") {
      if (!workerExists) return { status: 1, stdout: "", stderr: 'Worker "my-blog" not found.' };
      stdout = JSON.stringify(secretNames.map((name) => ({ name })));
    } else if (args[0] === "secret" && args[1] === "bulk") {
      workerExists = true;
      secretNames = Object.keys(JSON.parse(options.input));
    } else if (args[0] === "d1" && args[1] === "list") {
      if (failList) throw new Error("Cloudflare permission denied");
      stdout = JSON.stringify(database ? [{ name: "my-blog-db", uuid: "database-1" }] : []);
    } else if (args[0] === "d1" && args[1] === "create") {
      database = true;
    } else if (args[0] === "r2" && args[2] === "list") {
      stdout = bucket ? "Listing buckets...\nname:          my-blog-media\ncreation_date: 2026-01-01\n" : "Listing buckets...\n";
    } else if (args[0] === "r2" && args[2] === "create") {
      bucket = true;
    }
    return { status: 0, stdout };
  };
  return { execute, calls };
}
const ask = async (label) => label === "Worker name" ? "my-blog" : "https://my-blog.account.workers.dev";

test("first deployment provisions resources, uploads only required secrets, and migrates before publishing", async (t) => {
  const cwd = fixture(t);
  const fake = fakeCloudflare();
  await setup({ cwd, execute: fake.execute, ask, log: () => {} });
  const config = readConfig(resolve(cwd, "wrangler.local.json"));
  assert.equal(config.account_id, "account-1");
  assert.equal(config.d1_databases[0].database_id, "database-1");
  assert.equal(config.r2_buckets[0].bucket_name, "my-blog-media");
  assert.deepEqual(readConfig(resolve(cwd, "wrangler.jsonc")), template);
  const bulk = fake.calls.find((call) => call.args[1] === "bulk");
  assert.deepEqual(Object.keys(JSON.parse(bulk.options.input)), ["ADMIN_PASSWORD", "SESSION_SECRET"]);
  assert.equal(statSync(resolve(cwd, ".dev.vars")).mode & 0o777, 0o600);
  const remoteMigration = fake.calls.findIndex((call) => call.args.includes("migrations") && call.args.includes("--remote"));
  const deployment = fake.calls.findIndex((call) => call.args[0] === "deploy");
  assert.ok(remoteMigration >= 0 && deployment > remoteMigration);
  assert.ok(fake.calls.filter((call) => call.args.includes("migrations")).every((call) => call.args.includes("DB")));
});

test("rerunning setup preserves credentials and reuses existing resources", async (t) => {
  const cwd = fixture(t);
  const fake = fakeCloudflare();
  await setup({ cwd, execute: fake.execute, ask, log: () => {} });
  const secrets = readFileSync(resolve(cwd, ".dev.vars"), "utf8");
  fake.calls.length = 0;
  await setup({ cwd, execute: fake.execute, ask, log: () => {} });
  assert.equal(readFileSync(resolve(cwd, ".dev.vars"), "utf8"), secrets);
  assert.ok(!fake.calls.some((call) => call.args.includes("create")));
  assert.ok(!fake.calls.some((call) => call.args[1] === "bulk"));
});

test("existing remote credentials are never overwritten by a new checkout", async (t) => {
  const cwd = fixture(t);
  const fake = fakeCloudflare({ secretNames: ["ADMIN_PASSWORD", "SESSION_SECRET"] });
  await assert.rejects(setup({ cwd, execute: fake.execute, ask, log: () => {} }), /will not replace/);
  assert.ok(!fake.calls.some((call) => call.args[1] === "bulk" || call.args.includes("create")));
});

test("a resource permission failure stops setup before writing config, secrets, or deploying", async (t) => {
  const cwd = fixture(t);
  const fake = fakeCloudflare({ failList: true });
  await assert.rejects(setup({ cwd, execute: fake.execute, ask, log: () => {} }), /permission denied/);
  assert.ok(!existsSync(resolve(cwd, "wrangler.local.json")));
  assert.ok(!existsSync(resolve(cwd, ".dev.vars")));
  assert.ok(!fake.calls.some((call) => call.args.includes("create") || call.args[0] === "deploy"));
});

test("local setup does not authenticate or provision cloud resources", async (t) => {
  const cwd = fixture(t);
  const fake = fakeCloudflare();
  await setup({ cwd, local: true, execute: fake.execute, log: () => {} });
  assert.equal(fake.calls.length, 2);
  assert.ok(fake.calls[0].args.includes("--local"));
  assert.equal(fake.calls[1].args[0], "types");
});

test("existing secrets and optional email credentials survive setup", (t) => {
  const cwd = fixture(t);
  writeFileSync(resolve(cwd, ".dev.vars"), 'ADMIN_PASSWORD="existing long password"\nSESSION_SECRET=existing-session-secret\nRESEND_API_KEY=re_existing\n');
  const secrets = ensureSecrets(cwd);
  assert.equal(secrets.ADMIN_PASSWORD, "existing long password");
  assert.equal(secrets.RESEND_API_KEY, "re_existing");
  assert.equal(parseEnv(readFileSync(resolve(cwd, ".dev.vars"), "utf8")).SESSION_SECRET, "existing-session-secret");
});

test("reject unsafe names and URLs before passing values to Wrangler", () => {
  for (const name of ["../other", "blog;echo hacked", "UPPER", ""]) assert.throws(() => validateName(name));
  assert.equal(validateName("my-blog"), "my-blog");
  for (const url of ["http://blog.test", "https://user:pass@blog.test", "https://blog.test/path", "https://blog.test?q=1"]) {
    assert.throws(() => validateUrl(url));
  }
  assert.equal(validateUrl("https://blog.test/"), "https://blog.test");
});

test("build or migration failure prevents publishing", (t) => {
  const cwd = fixture(t);
  for (const failing of ["build", "d1"]) {
    const calls = [];
    assert.throws(() => cloudflare("deploy", { cwd, execute: (_tool, args) => {
      calls.push(args[0]);
      if (args[0] === failing) throw new Error("failed");
    } }), /failed/);
    assert.ok(!calls.includes("deploy"));
  }
});

test("public template is portable and contains no personal account or active integrations", () => {
  assert.equal(template.account_id, undefined);
  assert.equal(template.vars.NEXT_PUBLIC_SITE_URL, "");
  assert.equal(template.vars.NEXT_PUBLIC_TURNSTILE_SITE_KEY, "");
  assert.equal(template.vars.RESEND_FROM_EMAIL, "");
});

test("wizard login scopes are accepted by the installed Wrangler CLI", (t) => {
  const cwd = fixture(t);
  const result = run("wrangler", ["login", "--scopes-list"], {
    cwd, capture: true, env: { WRANGLER_LOG_PATH: resolve(cwd, "logs") },
  });
  const supported = [...result.stdout.matchAll(/│\s*([a-z0-9_-]+:(?:read|write|admin|run))\s*│/g)].map((match) => match[1]);
  assert.ok(supported.length > 0);
  for (const scope of LOGIN_SCOPES) assert.ok(supported.includes(scope), `Unsupported scope: ${scope}`);
});
