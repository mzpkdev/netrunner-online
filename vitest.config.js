import { defineConfig } from "vitest/config";

export default defineConfig({
    define: {
        "import.meta.env.VITE_TURN_USERNAME": JSON.stringify("test-turn-username"),
        "import.meta.env.VITE_TURN_CREDENTIAL": JSON.stringify("test-turn-credential"),
    },
    test: {
        include: ["src/**/*.test.{js,ts}"],
    },
});
