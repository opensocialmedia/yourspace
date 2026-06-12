// OpenNext adapter config — translates the Next.js build output into a
// Cloudflare Worker. The defaults are all this app needs; see
// https://opennext.js.org/cloudflare if you want to add caching layers.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
