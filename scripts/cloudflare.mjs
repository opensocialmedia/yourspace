import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));

export function configPath(cwd = root) {
  return existsSync(resolve(cwd, "wrangler.local.json"))
    ? "wrangler.local.json"
    : "wrangler.jsonc";
}

// Invoke the installed CLI directly: no shell interpolation or global install.
export function run(tool, args, { cwd = root, capture = false, input, allowFailure = false, env = {} } = {}) {
  const entry = tool === "wrangler"
    ? "node_modules/wrangler/bin/wrangler.js"
    : "node_modules/@opennextjs/cloudflare/dist/cli/index.js";
  const result = spawnSync(process.execPath, [resolve(root, entry), ...args], {
    cwd,
    env: { ...process.env, ...env },
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    stdio: capture ? "pipe" : [input === undefined ? "inherit" : "pipe", "inherit", "inherit"],
    input,
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    if (capture) process.stderr.write(result.stderr || result.stdout || "");
    throw new Error(`${tool} ${args[0]} failed. Fix the error above and rerun the command.`);
  }
  return result;
}

export function cloudflare(command, { cwd = root, execute = run, extra = [] } = {}) {
  const config = ["--config", configPath(cwd)];
  const wrangler = (args) => execute("wrangler", [...args, ...config], { cwd });
  const openNext = (args) => execute("opennext", [...args, ...config, ...extra], { cwd });
  switch (command) {
    case "types": return wrangler(["types", "--env-interface", "CloudflareEnv", "cloudflare-env.d.ts"]);
    case "migrate-local": return wrangler(["d1", "migrations", "apply", "DB", "--local"]);
    case "migrate-remote": return wrangler(["d1", "migrations", "apply", "DB", "--remote"]);
    case "preview":
      cloudflare("migrate-local", { cwd, execute });
      openNext(["build"]);
      return openNext(["preview"]);
    case "deploy":
      openNext(["build"]);
      // Cloudflare's deploy-button flow provisions DB before this command.
      // The local setup wizard provisions it before calling npm run deploy.
      cloudflare("migrate-remote", { cwd, execute });
      return openNext(["deploy"]);
    default: throw new Error(`Unknown Cloudflare command: ${command}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    cloudflare(process.argv[2], { extra: process.argv.slice(3) });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
