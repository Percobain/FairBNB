import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.resolve();

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            process: "process/browser",
            stream: "stream-browserify",
            util: "util",
        },
    },
    define: {
        global: "globalThis",
    },
    optimizeDeps: {
        include: ["@bnb-chain/greenfield-js-sdk"],
    },
});
