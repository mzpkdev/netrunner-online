import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "e2e",
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
