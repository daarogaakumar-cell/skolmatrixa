"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileIcon, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FileUploadProps {
  folder: string;
  accept?: string;
  maxSizeMB?: number;
  onUpload: (url: string, key: string) => void;
  className?: string;
  preview?: boolean;
  currentUrl?: string | null;
}

export function FileUpload({
  folder,
  accept = "image/*",
  maxSizeMB = 5,
  onUpload,
  className,
  preview = true,
  currentUrl,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File too large. Max size: ${maxSizeMB}MB`);
        return;
      }

      setUploading(true);
      try {
        // Upload through server (avoids CORS issues with direct R2 upload)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as any).error || "Upload failed");
        }

        const { url, key } = await res.json();

        // Set preview
        if (file.type.startsWith("image/") && preview) {
          const objectUrl = URL.createObjectURL(file);
          setPreviewUrl(objectUrl);
        }

        onUpload(url, key);
        toast.success("File uploaded successfully");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload file. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [folder, maxSizeMB, onUpload, preview]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const clearFile = () => {
    setPreviewUrl(null);
    onUpload("", "");
  };

  return (
    <div className={cn("relative", className)}>
      {previewUrl ? (
        <div className="relative inline-block">
          <div className="overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30">
            {previewUrl.startsWith("blob:") || previewUrl.startsWith("http") ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-32 w-32 object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
            onClick={clearFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <label className="flex cursor-pointer flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <div className="rounded-full bg-primary/10 p-3">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploading ? "Uploading..." : "Click or drag to upload"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Max {maxSizeMB}MB
              </p>
            </div>
            <input
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  );
}
