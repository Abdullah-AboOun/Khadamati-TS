import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { _splat?: string } }) => {
        const filename = params._splat;
        if (!filename) {
          return new Response("Not Found", { status: 404 });
        }
        const filepath = resolve(process.cwd(), "uploads", filename);
        if (!existsSync(filepath)) {
          return new Response("Not Found", { status: 404 });
        }
        const file = readFileSync(filepath);
        return new Response(file, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
