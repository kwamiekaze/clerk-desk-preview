import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, X, Loader2 } from "lucide-react";

export type UploadedImage = { path: string; url: string };

const MAX = 4;
const MAX_BYTES = 5 * 1024 * 1024;

// Uploads to the private `project-images` bucket under `${uid}/${uuid}.ext`.
// Displays them via the public proxy at /api/public/img/project-images/{path}.
export function ImageAttachments({
  value,
  onChange,
  className = "",
}: {
  value: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | File[]) {
    setErr(null);
    const arr = Array.from(files);
    if (value.length + arr.length > MAX) {
      setErr(`Up to ${MAX} images per message.`);
      return;
    }
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) throw new Error("Sign in required.");
      const uploads: UploadedImage[] = [];
      for (const f of arr) {
        if (f.size > MAX_BYTES) throw new Error(`${f.name} is over 5MB.`);
        if (!f.type.startsWith("image/")) throw new Error(`${f.name} is not an image.`);
        const ext = (f.name.split(".").pop() || "png").toLowerCase().slice(0, 5);
        const key = `${uid}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("project-images").upload(key, f, { upsert: false, contentType: f.type });
        if (error) throw new Error(error.message);
        uploads.push({ path: key, url: `/api/public/img/project-images/${key}` });
      }
      onChange([...value, ...uploads]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }}
        className="flex flex-wrap items-center gap-2"
      >
        {value.map((img, i) => (
          <div key={img.path} className="group relative h-14 w-14 overflow-hidden rounded border border-border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-0 top-0 hidden h-4 w-4 items-center justify-center rounded-bl bg-black/70 text-white group-hover:flex"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < MAX && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex h-14 w-14 items-center justify-center rounded border border-dashed border-border text-mute hover:border-primary/60 hover:text-primary"
            title="Attach images (up to 4, 5MB each)"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
        />
      </div>
      {err && <div className="mt-1 text-xs text-destructive">{err}</div>}
    </div>
  );
}
