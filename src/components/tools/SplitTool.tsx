import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { SingleFilePicker } from "@/components/site/SingleFilePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SplitTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await f.arrayBuffer()));
      setPageCount(doc.getPageCount());
      setFrom(1);
      setTo(doc.getPageCount());
    } catch {
      toast.error("Could not read that PDF.");
    }
  }

  async function split() {
    if (!file) return;
    if (from < 1 || to > pageCount || from > to) {
      toast.error(`Enter a range between 1 and ${pageCount}.`);
      return;
    }
    setBusy(true);
    try {
      const src = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const out = await PDFDocument.create();
      const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      downloadBlob(bytes, `paperlane-split-${from}-${to}.pdf`);
      toast.success("Split PDF ready.");
    } catch (e) {
      console.error(e);
      toast.error("Split failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          onFiles={onFiles}
          accept={{ "application/pdf": [".pdf"] }}
          multiple={false}
          hint="Drop one PDF to split."
        />
      ) : (
        <SingleFilePicker file={file} onChange={() => setFile(null)}>
          <div className="text-xs text-muted-foreground mb-4">{pageCount} pages</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="from">From page</Label>
              <Input id="from" type="number" min={1} max={pageCount} value={from} onChange={(e) => setFrom(+e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="to">To page</Label>
              <Input id="to" type="number" min={1} max={pageCount} value={to} onChange={(e) => setTo(+e.target.value)} className="mt-1" />
            </div>
          </div>
        </SingleFilePicker>
      )}
      <div className="flex justify-end">
        <Button variant="action" size="xl" onClick={split} disabled={!file || busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Extract pages
        </Button>
      </div>
    </div>
  );
}
