import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { downloadBlob, formatBytes } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FlattenTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      try {
        const form = src.getForm();
        form.flatten();
      } catch {
        // no form fields — that's ok
      }
      downloadBlob(await src.save(), `paperlane-flattened-${file.name}`);
      toast.success("Flattened PDF ready.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Flatten failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone onFiles={(fs) => setFile(fs[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} hint="Drop a PDF with form fields." />
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
          Flatten
        </Button>
      </div>
    </div>
  );
}
