import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "e2e",
    // One retry in CI absorbs transient infrastructure noise.
    // A test that fails then passes is annotated "flaky" in the HTML report.
    // That annotation is visible only in the downloaded artifact, not in the
    // GitHub commit status — recurring flakiness requires artifact inspection
    // to detect.
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [["github"], ["html"]] : [["html"]],
    use: {
        baseURL: "http://localhost:5173",
        headless: true,
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
    },
    webServer: {
        command: "npm run serve",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
    },
});
