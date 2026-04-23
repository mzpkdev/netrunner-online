import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "e2e",
    reporter: [["html", { open: "never" }]],
    use: {
        baseURL: "http://localhost:5173",
        headless: true,
        trace: "retain-on-failure",
    },
    webServer: {
        command: "npm run serve",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
    },
});
