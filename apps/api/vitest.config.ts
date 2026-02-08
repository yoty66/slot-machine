import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "vitest.setup.ts",
        "run-time/",
      ],
    },
  },
  resolve: {
    alias: {
      "@src": path.resolve(__dirname, "./src"),
    },
    // Resolve .js imports to .ts for NodeNext-style imports
    extensionAlias: {
      ".js": [".ts", ".js"],
    },
  },
});
