import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // tsconfig sets `jsx: "preserve"` for Next's own compiler, so the transform
  // used by vitest has to be told to emit the automatic JSX runtime itself.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
