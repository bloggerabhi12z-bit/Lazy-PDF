import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function RepairTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), { ignoreEncryption: true, throwOnInvalidObject: false });
      downloadBlob(await src.save({ useObjectStreams: true }), `paperlane-repaired-${file.name}`);
      toast.success("Repaired PDF ready.");
    } catch (e) {
      toast.error("Could not repair this file.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone onFiles={(fs) => setFile(fs[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} hint="Drop a damaged PDF." />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-between">
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="text-sm text-muted-foreground">{formatBytes(file.size)}</div>
          </div>
          <Button variant="ghost" onClick={() => setFile(null)}>Change</Button>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={run} disabled={!file || busy} size="lg">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Repair PDF
        </Button>
      </div>
    </div>
  );
}
