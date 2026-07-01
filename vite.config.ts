import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tanstackRouter(), react(), tailwindcss()],
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
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react-vendor",
              test: /node_modules[\\/](react|react-dom)/,
              priority: 40,
            },
            {
              name: "tanstack-vendor",
              test: /node_modules[\\/]@tanstack/,
              priority: 30,
            },
            {
              name: "auth-vendor",
              test: /node_modules[\\/]better-auth/,
              priority: 20,
            },
            {
              name: "trpc-vendor",
              test: /node_modules[\\/](@trpc|@hono\/trpc-server)/,
              priority: 20,
            },
            {
              name: "zod-vendor",
              test: /node_modules[\\/]zod/,
              priority: 20,
            },
            {
              name: "vendor",
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
