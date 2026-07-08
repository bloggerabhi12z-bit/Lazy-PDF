import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBlob, formatBytes } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function MetadataTool() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFiles(fs: File[]) {
    const f = fs[0];
    if (!f) return;
    setFile(f);
    const doc = await PDFDocument.load(new Uint8Array(await f.arrayBuffer()));
    setTitle(doc.getTitle() ?? "");
    setAuthor(doc.getAuthor() ?? "");
    setSubject(doc.getSubject() ?? "");
    setKeywords((doc.getKeywords() ?? "") as string);
  }

  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      doc.setTitle(title);
      doc.setAuthor(author);
      doc.setSubject(subject);
      doc.setKeywords(keywords.split(",").map((k) => k.trim()).filter(Boolean));
      downloadBlob(await doc.save(), `paperlane-metadata-${file.name}`);
      toast.success("Metadata updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone onFiles={onFiles} accept={{ "application/pdf": [".pdf"] }} multiple={false} hint="Drop a PDF." />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-muted-foreground">{formatBytes(file.size)}</div>
            </div>
            <Button variant="ghost" onClick={() => setFile(null)}>Change</Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="t">Title</Label><Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="a">Author</Label><Input id="a" value={author} onChange={(e) => setAuthor(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="s">Subject</Label><Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
            <div><Label htmlFor="k">Keywords (comma-separated)</Label><Input id="k" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="mt-1" /></div>
          </div>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={run} disabled={!file || busy} size="lg">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save metadata
        </Button>
      </div>
    </div>
  );
}
