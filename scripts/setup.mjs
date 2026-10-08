import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parse, printParseErrorCode } from "jsonc-parser";
import { parseEnv } from "node:util";
import { cloudflare, root, run } from "./cloudflare.mjs";

// Wrangler automatically adds offline_access to the OAuth request.
export const LOGIN_SCOPES = ["account:read", "user:read", "workers:write", "workers_scripts:write", "d1:write"];

export function readConfig(path) {
  const errors = [];
  const config = parse(readFileSync(path, "utf8"), errors, { allowTrailingComma: true });
  if (errors.length) throw new Error(`Invalid ${path}: ${printParseErrorCode(errors[0].error)}`);
  return config;
}

export function validateName(name) {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(name)) {
    throw new Error("Use a Worker name starting with a lowercase letter, followed by lowercase letters, digits or dashes (up to 48 characters).");
  }
  return name;
}

export function validateUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Use the full HTTPS site origin, such as https://my-blog.my-account.workers.dev, without a path or query.");
  }
  return url.origin;
}

export function ensureSecrets(cwd) {
  const path = resolve(cwd, ".dev.vars");
  let source = existsSync(path) ? readFileSync(path, "utf8") : "# Private secrets — never commit this file.\n";
  const values = parseEnv(source);
  for (const [name, bytes] of [["ADMIN_PASSWORD", 24], ["SESSION_SECRET", 48]]) {
    if (!values[name] || values[name].startsWith("change-me")) {
      values[name] = randomBytes(bytes).toString("base64url");
      // Append so existing optional credentials and comments are preserved.
      source += `\n${name}=${values[name]}\n`;
    }
  }
  writeFileSync(path, source, { mode: 0o600 });
  chmodSync(path, 0o600);
  return values;
}

function jsonOutput(output) {
  // Wrangler's --json output can have a banner before the JSON document.
  const start = output.search(/[\[{]/);
  return JSON.parse(output.slice(start));
}

export async function setup({ cwd = root, local = false, execute = run, ask, log = console.log } = {}) {
  const localPath = resolve(cwd, "wrangler.local.json");
  const config = readConfig(existsSync(localPath) ? localPath : resolve(cwd, "wrangler.jsonc"));
  if (local) {
    ensureSecrets(cwd);
    cloudflare("migrate-local", { cwd, execute });
    cloudflare("types", { cwd, execute });
    log("Local setup complete. Run npm run dev. Your admin password is in .dev.vars.");
    return;
  }

  let auth = execute("wrangler", ["whoami", "--json"], { cwd, capture: true, allowFailure: true });
  if (auth.status !== 0) {
    if (!/"loggedIn"\s*:\s*false/.test(auth.stdout)) {
      throw new Error("Could not check the Cloudflare login. Check your connection and rerun setup.");
    }
    execute("wrangler", ["login", "--scopes", ...LOGIN_SCOPES], { cwd });
    auth = execute("wrangler", ["whoami", "--json"], { cwd, capture: true });
  }
  const { accounts } = jsonOutput(auth.stdout);
  if (!accounts?.length) throw new Error("No Cloudflare accounts found. Create an account in the Cloudflare dashboard first.");
  accounts.forEach((account, i) => log(`${i + 1}. ${account.name}`));
  const defaultAccount = Math.max(0, accounts.findIndex((a) => a.id === config.account_id));
  const choice = accounts.length === 1 ? 1 : Number(await ask("Cloudflare account number", String(defaultAccount + 1)));
  const account = accounts[choice - 1];
  if (!account) throw new Error("Invalid account number. Rerun setup and choose a listed account.");
  if (config.account_id && config.account_id !== account.id) {
    throw new Error("This checkout is configured for another account. Use a separate clone for another deployment.");
  }

  const name = validateName(await ask("Worker name", config.name));
  if (existsSync(localPath) && name !== config.name) {
    throw new Error("This checkout already has a Worker. Use a separate clone to create a different deployment.");
  }
  log("Find your workers.dev subdomain in Cloudflare → Workers & Pages. R2 must be enabled on the account.");
  const siteUrl = validateUrl(await ask("Full public site URL", config.vars.NEXT_PUBLIC_SITE_URL || ""));
  const dbName = existsSync(localPath) ? config.d1_databases[0].database_name : `${name}-db`;
  const bucketName = existsSync(localPath) ? config.r2_buckets[0].bucket_name : `${name}-media`;
  const options = { cwd, env: { CLOUDFLARE_ACCOUNT_ID: account.id } };

  const existingSecrets = execute("wrangler", ["secret", "list", "--name", name], {
    ...options, capture: true, allowFailure: true,
  });
  const missingWorker = (existingSecrets.stderr + existingSecrets.stdout).includes(`Worker "${name}" not found.`);
  if (existingSecrets.status !== 0 && !missingWorker) {
    throw new Error("Could not check existing Worker secrets. Check your Cloudflare permissions and connection before rerunning setup.");
  }
  const secretNames = existingSecrets.status === 0
    ? jsonOutput(existingSecrets.stdout).map((secret) => secret.name)
    : [];
  if (secretNames.length && (!existsSync(localPath) || !existsSync(resolve(cwd, ".dev.vars")))) {
    throw new Error("This Worker already has secrets, but this checkout has no matching local setup. Use the original configured checkout, deploy an existing Cloudflare-created clone with npm run deploy, or choose a new Worker name. Setup will not replace existing credentials.");
  }

  // Reuse resources by name. Never turn permission/network failures into "not found".
  const listDatabases = () => jsonOutput(execute("wrangler", ["d1", "list", "--json"], { ...options, capture: true }).stdout);
  let database = listDatabases().find((db) => db.name === dbName);
  if (!database) {
    execute("wrangler", ["d1", "create", dbName], options);
    database = listDatabases().find((db) => db.name === dbName);
  }
  if (!database?.uuid) throw new Error("Could not discover the created D1 database. Rerun setup; existing resources will be reused.");
  const buckets = execute("wrangler", ["r2", "bucket", "list"], { ...options, capture: true }).stdout;
  const names = [...buckets.matchAll(/^name:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  if (!names.includes(bucketName)) execute("wrangler", ["r2", "bucket", "create", bucketName], options);

  config.name = name;
  config.account_id = account.id;
  config.vars.NEXT_PUBLIC_SITE_URL = siteUrl;
  config.d1_databases[0] = { ...config.d1_databases[0], database_name: dbName, database_id: database.uuid };
  config.r2_buckets[0] = { ...config.r2_buckets[0], bucket_name: bucketName };
  writeFileSync(localPath, JSON.stringify(config, null, 2) + "\n");
  const secrets = ensureSecrets(cwd);
  // Only required secrets are uploaded. Optional integrations are configured later.
  const missingSecrets = Object.fromEntries(
    ["ADMIN_PASSWORD", "SESSION_SECRET"].filter((key) => !secretNames.includes(key)).map((key) => [key, secrets[key]]),
  );
  if (Object.keys(missingSecrets).length) {
    execute("wrangler", ["secret", "bulk", "--config", "wrangler.local.json"], {
      ...options, input: JSON.stringify(missingSecrets),
    });
  }
  cloudflare("types", { cwd, execute });
  cloudflare("migrate-local", { cwd, execute });
  cloudflare("deploy", { cwd, execute });
  log(`Live at ${siteUrl}. Open ${siteUrl}/admin. Your password is in .dev.vars.`);
  log("Personal configuration is in wrangler.local.json; both files are gitignored. Email subscriptions stay off until Resend and Turnstile are configured.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const local = process.argv.includes("--local");
  let rl;
  try {
    if (!local && !process.stdin.isTTY) throw new Error("Run npm run setup in an interactive terminal (or npm run setup:local for local development).");
    if (!local) rl = createInterface({ input: process.stdin, output: process.stdout });
    await setup({ local, ask: async (label, fallback) => (await rl.question(`${label}${fallback ? ` [${fallback}]` : ""}: `)).trim() || fallback });
  } catch (error) {
    console.error(`Setup stopped: ${error.message}`);
    process.exitCode = 1;
  } finally {
    rl?.close();
  }
}
