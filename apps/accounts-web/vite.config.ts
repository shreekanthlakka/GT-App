import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
        },
    },
    server: {
        port: 3000,
        host: true,
    },
    build: {
        outDir: "dist",
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom", "react-router-dom"],
                    redux: ["@reduxjs/toolkit", "react-redux"],
                    query: ["@tanstack/react-query"],
                },
            },
        },
    },
});
