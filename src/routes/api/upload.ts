import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { randomUUID } from "crypto";
import { resolve } from "path";
import { mkdirSync } from "fs";

const UPLOAD_DIR = resolve(process.cwd(), "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file");

          if (!file || !(file instanceof File)) {
            return new Response(JSON.stringify({ error: "لم يتم تحميل ملف" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (!ALLOWED_TYPES.has(file.type)) {
            return new Response(
              JSON.stringify({ error: "نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, GIF, WebP" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          if (file.size > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({ error: "حجم الملف يتجاوز 5 ميغابايت" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const arrayBuffer = await file.arrayBuffer();
          const header = new Uint8Array(arrayBuffer.slice(0, 4));
          const isJPEG = header[0] === 0xff && header[1] === 0xd8;
          const isPNG =
            header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
          const isGIF = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
          const isWEBP =
            header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;

          if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
            return new Response(JSON.stringify({ error: "محتوى الملف لا يطابق نوع صورة صالح" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const filename = `${randomUUID()}.webp`;
          const filepath = resolve(UPLOAD_DIR, filename);

          try {
            await new Bun.Image(arrayBuffer).webp({ quality: 80 }).write(filepath);
          } catch (err) {
            console.error("Bun.Image error:", err);
            await Bun.write(filepath, arrayBuffer);
          }

          const url = `/uploads/${filename}`;
          return new Response(JSON.stringify({ url, filename }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const error = err as Error;
          return new Response(JSON.stringify({ error: error.message || "فشل رفع الملف" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
