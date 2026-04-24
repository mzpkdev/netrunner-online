import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/**/*.test.{js,ts}"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{js,ts}"],
            exclude: ["src/**/*.test.{js,ts}"],
            reporter: ["text", "json-summary"],
            thresholds: {
                statements: 76,
                branches: 88,
                functions: 77,
                lines: 76,
            },
        },
    },
});
