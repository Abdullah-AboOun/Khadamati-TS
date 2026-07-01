import { Hono } from "hono";
import { randomUUID } from "crypto";
import { resolve } from "path";
import { mkdirSync } from "fs";

const UPLOAD_DIR = resolve(process.cwd(), "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

// Allowed image MIME types
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const uploadApp = new Hono();

uploadApp.post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "لم يتم تحميل ملف" }, 400);
  }

  // Validate file type
  if (!ALLOWED_TYPES.has(file.type)) {
    return c.json({ error: "نوع الملف غير مدعوم. يُسمح بـ JPEG, PNG, GIF, WebP" }, 400);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "حجم الملف يتجاوز 5 ميغابايت" }, 400);
  }

  const arrayBuffer = await file.arrayBuffer();

  // Validate magic bytes to confirm actual image content
  const header = new Uint8Array(arrayBuffer.slice(0, 4));
  const isJPEG = header[0] === 0xff && header[1] === 0xd8;
  const isPNG =
    header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isGIF = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
  const isWEBP =
    header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;

  if (!isJPEG && !isPNG && !isGIF && !isWEBP) {
    return c.json({ error: "محتوى الملف لا يطابق نوع صورة صالح" }, 400);
  }

  // Generate unique filename for WebP
  const filename = `${randomUUID()}.webp`;
  const filepath = resolve(UPLOAD_DIR, filename);

  try {
    // Decode uploaded image and encode to WebP using Bun.Image (native in Bun v1.3.14+)
    await new Bun.Image(arrayBuffer).webp({ quality: 80 }).write(filepath);
  } catch (err) {
    console.error("Bun.Image error:", err);
    // Fallback if image processing fails: write original file
    await Bun.write(filepath, arrayBuffer);
  }

  const url = `/uploads/${filename}`;
  return c.json({ url, filename });
});

export { uploadApp };
