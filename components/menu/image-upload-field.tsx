"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { createMenuImageUpload } from "@/app/dashboard/menu/actions";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUploadField({
  name,
  value,
  onChange,
  onUploaded,
  onUploadingChange,
}: {
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Called for every object that lands in storage, so the caller can clean up
   *  the ones that never get saved. */
  onUploaded: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<XMLHttpRequest | null>(null);
  const isUploading = progress !== null;

  useEffect(() => {
    onUploadingChange(isUploading);
  }, [isUploading, onUploadingChange]);

  // The owner reloading mid-upload is the case that actually happens: the photo
  // is half sent and the form is still unsaved. Ask before the page goes away.
  useEffect(() => {
    if (!isUploading) return;
    const confirmLeave = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", confirmLeave);
    return () => window.removeEventListener("beforeunload", confirmLeave);
  }, [isUploading]);

  // If they leave anyway, drop the request instead of letting it run against an
  // unmounted component.
  useEffect(() => () => requestRef.current?.abort(), []);

  async function handleFile(file: File) {
    // Mirrors the server's checks so an obviously wrong file fails instantly.
    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format gambar tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Ukuran gambar maksimal 5 MB.");
      return;
    }

    setProgress(0);
    try {
      const { uploadUrl, publicUrl } = await createMenuImageUpload(
        file.type,
        file.size,
      );

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        requestRef.current = request;

        request.open("PUT", uploadUrl);
        request.setRequestHeader("content-type", file.type);
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        request.onload = () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : reject(new Error(`Upload gagal (${request.status}).`));
        request.onerror = () =>
          reject(new Error("Koneksi terputus saat mengunggah."));
        request.onabort = () => reject(new Error("Upload dibatalkan."));
        request.send(file);
      });

      onUploaded(publicUrl);
      onChange(publicUrl);
      toast.success("Gambar terunggah.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengunggah gambar.",
      );
    } finally {
      requestRef.current = null;
      setProgress(null);
      // Let the same file be picked again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="menu-image">Gambar (opsional)</Label>

      {/* The saved value travels with the form; the picker only sets it. */}
      <input type="hidden" name={name} value={value ?? ""} />

      <div className="flex items-start gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id="menu-image"
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon />
              {value ? "Ganti gambar" : "Pilih gambar"}
            </Button>

            {value && !isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(null)}
              >
                <Trash2Icon />
                <span className="sr-only">Hapus gambar</span>
              </Button>
            )}
          </div>

          {isUploading ? (
            <div className="space-y-1">
              <Progress value={progress} className="gap-1">
                <ProgressLabel className="text-xs font-normal text-muted-foreground">
                  Mengunggah...
                </ProgressLabel>
                <ProgressValue className="text-xs" />
              </Progress>
              <p className="text-xs text-muted-foreground">
                Jangan tutup halaman ini sampai unggahan selesai.
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WEBP, atau AVIF. Maksimal 5 MB.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
