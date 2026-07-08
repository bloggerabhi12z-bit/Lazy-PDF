import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  async function compress() {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const src = await PDFDocument.load(bytes, { updateMetadata: false });
      src.setTitle("");
      src.setSubject("");
      src.setKeywords([]);
      src.setProducer("");
      src.setCreator("");
      const out = await src.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 100,
      });
      setResult({ before: file.size, after: out.byteLength });
      downloadBlob(out, `paperlane-compressed-${file.name}`);
      toast.success("Compressed PDF ready.");
    } catch (e) {
      console.error(e);
      toast.error("Compression failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFiles={(fs) => setFiles(fs)}
          accept={{ "application/pdf": [".pdf"] }}
          multiple={false}
          hint="Drop a PDF to shrink."
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground">{formatBytes(file.size)}</div>
            </div>
            <Button variant="ghost" onClick={() => { setFile(null); setResult(null); }}>Change</Button>
          </div>
          {result && (
            <div className="mt-4 rounded-xl bg-signal-soft/40 p-4 text-sm">
              <div className="font-medium">
                Saved {(((result.before - result.after) / result.before) * 100).toFixed(1)}%
              </div>
              <div className="text-muted-foreground">
                {formatBytes(result.before)} → {formatBytes(result.after)}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={compress} disabled={!file || busy} size="lg">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Compress
        </Button>
      </div>
    </div>
  );

  function setFiles(fs: File[]) {
    setFile(fs[0] ?? null);
  }
}
