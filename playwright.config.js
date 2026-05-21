import { defineConfig } from "@playwright/test";

export default defineConfig({
    forbidOnly: !!process.env.CI,
    testDir: "e2e",
    use: {
        baseURL: "http://localhost:5173",
        headless: true,
    },
    webServer: {
        command: "npm run serve",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
    },
});
