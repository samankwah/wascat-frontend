import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // `server-only` throws by design when imported outside a server
      // component, which is exactly what makes it useful in the app and
      // useless in a test runner. Stub it so the data layer can be tested
      // directly; the guarantee it provides is a build-time one and is not
      // weakened by this.
      "server-only": fileURLToPath(new URL("./tests/support/server-only-stub.ts", import.meta.url)),
    },
  },
});
