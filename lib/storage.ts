/**
 * Menu image storage, spoken over the plain Supabase Storage REST API.
 *
 * No SDK on purpose: the browser has to upload with XMLHttpRequest anyway to
 * get progress events (the SDK uses fetch, which reports none), and keeping
 * this to three HTTP calls means swapping in S3 or any other object store later
 * touches only this file.
 */

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES: readonly string[] = ACCEPTED_TYPES;

function config() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "menu-images";

  if (!baseUrl || !serviceKey) {
    throw new Error(
      "Upload gambar belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env.",
    );
  }
  return { baseUrl, serviceKey, bucket };
}

/** Public URL of an object, matching Supabase's public-bucket URL shape. */
function publicUrlFor(baseUrl: string, bucket: string, path: string) {
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Reverses `publicUrlFor`. Returns null for anything that is not an object in
 * our own bucket, so a stray URL can never be turned into a delete request.
 */
export function storagePathFromPublicUrl(url: string) {
  let baseUrl: string;
  let bucket: string;
  try {
    ({ baseUrl, bucket } = config());
  } catch {
    return null;
  }

  const prefix = `${baseUrl}/storage/v1/object/public/${bucket}/`;
  if (!url.startsWith(prefix)) return null;

  const path = url.slice(prefix.length);
  // No traversal, no empty path.
  if (!path || path.includes("..")) return null;
  return path;
}

/**
 * Mints a short-lived URL the browser can PUT a single file to. The service key
 * stays on the server; the browser only ever sees the one-shot signed URL.
 */
export async function createSignedImageUpload(contentType: string) {
  const { baseUrl, serviceKey, bucket } = config();

  const extension = EXTENSION_BY_TYPE[contentType];
  if (!extension) {
    throw new Error("Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.");
  }

  // Server-generated name: the original filename is untrusted and would let the
  // owner overwrite another item's image by uploading the same name twice.
  const path = `${crypto.randomUUID()}.${extension}`;

  const response = await fetch(
    `${baseUrl}/storage/v1/object/upload/sign/${bucket}/${path}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Gagal menyiapkan upload (${response.status}). ${detail.slice(0, 200)}`.trim(),
    );
  }

  const { url } = (await response.json()) as { url: string };

  return {
    uploadUrl: `${baseUrl}/storage/v1${url}`,
    publicUrl: publicUrlFor(baseUrl, bucket, path),
  };
}

/** Best-effort removal of an object we own. Never throws for a foreign URL. */
export async function deleteStoredImage(publicUrl: string) {
  const path = storagePathFromPublicUrl(publicUrl);
  if (!path) return;

  const { baseUrl, serviceKey, bucket } = config();

  await fetch(`${baseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serviceKey}` },
  });
}
