import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter({ autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts")) {
            return "recharts-vendor";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide-vendor";
          }
          if (id.includes("node_modules/radix-ui") || id.includes("node_modules/@radix-ui")) {
            return "radix-vendor";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack-vendor";
          }
          if (id.includes("node_modules/better-auth")) {
            return "auth-vendor";
          }
          if (id.includes("node_modules/@trpc") || id.includes("node_modules/@hono/trpc-server")) {
            return "trpc-vendor";
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }
          if (id.includes("node_modules/zod")) {
            return "zod-vendor";
          }
        },
      },
    },
  },
});
