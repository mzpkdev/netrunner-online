import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        // Explicit defence-in-depth: mirrors Vitest's built-in default so that
        // a future upstream change cannot silently re-enable .only in CI.
        allowOnly: !process.env.CI,
        include: ["src/**/*.test.{js,ts}"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{js,ts}"],
            exclude: ["src/**/*.test.{js,ts}"],
            reporter: ["text", "json-summary"],
            thresholds: {
                statements: 82,
                branches: 89,
                functions: 80,
                lines: 82,
            },
        },
    },
});
