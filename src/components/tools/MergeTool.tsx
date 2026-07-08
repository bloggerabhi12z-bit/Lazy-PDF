import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/download";
import { X, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MergeTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const remove = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    setFiles((f) => {
      const next = [...f];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  async function merge() {
    if (files.length < 2) {
      toast.error("Add at least two PDFs to merge.");
      return;
    }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const src = await PDFDocument.load(bytes);
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const merged = await out.save();
      downloadBlob(merged, "paperlane-merged.pdf");
      toast.success("Merged PDF ready.");
    } catch (e) {
      console.error(e);
      toast.error("Could not merge these files. Are they valid PDFs?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DropZone
        onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}
        accept={{ "application/pdf": [".pdf"] }}
        hint="Add two or more PDFs. Drag rows to reorder."
      />

      {files.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 p-3">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 truncate">
                <div className="truncate text-sm font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(f.size)}</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                <Button variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === files.length - 1}>↓</Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end">
        <Button onClick={merge} disabled={busy || files.length < 2} size="lg">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Merge {files.length > 0 && `${files.length} file${files.length > 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}
