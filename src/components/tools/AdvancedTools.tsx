import { useMemo, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import mammoth from "mammoth/mammoth.browser";
import PptxGenJS from "pptxgenjs";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { createWorker } from "tesseract.js";
import { DropZone } from "@/components/site/DropZone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBlob, formatBytes } from "@/lib/download";
import { canvasToBlob, extractPdfText, loadPdf, renderPdfPageToCanvas } from "@/lib/pdf-render";
import { createTextPdf, stripHtml } from "@/lib/text-pdf";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function SinglePdfPicker({ file, onFile, hint }: { file: File | null; onFile: (file: File | null) => void; hint?: string }) {
  if (!file) {
    return <DropZone onFiles={(files) => onFile(files[0] ?? null)} accept={{ "application/pdf": [".pdf"] }} multiple={false} hint={hint ?? "Drop one PDF."} />;
  }
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6">
      <div className="min-w-0">
        <div className="truncate font-medium">{file.name}</div>
        <div className="text-sm text-muted-foreground">{formatBytes(file.size)}</div>
      </div>
      <Button variant="ghost" onClick={() => onFile(null)}>Change</Button>
    </div>
  );
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fileText(file: File) {
  return file.text();
}

function xmlText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function renderPdfToImageZip(file: File, type: "jpg" | "png", password?: string) {
  const pdf = await loadPdf(file, password);
  const zip = new JSZip();
  const mime = type === "jpg" ? "image/jpeg" : "image/png";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const canvas = await renderPdfPageToCanvas(pdf, pageNumber, 2);
    const blob = await canvasToBlob(canvas, mime, type === "jpg" ? 0.92 : undefined);
    zip.file(`page-${String(pageNumber).padStart(3, "0")}.${type}`, blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function PdfToImagesTool({ type }: { type: "jpg" | "png" }) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const zip = await renderPdfToImageZip(file, type, password);
      downloadBlob(zip, `paperlane-${type}-pages.zip`, "application/zip");
      toast.success(`${type.toUpperCase()} pages ready.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <SinglePdfPicker file={file} onFile={setFile} hint={`Drop a PDF to render every page as ${type.toUpperCase()}.`} />
      {file && <Input type="password" placeholder="Password if needed" value={password} onChange={(event) => setPassword(event.target.value)} />}
      <div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Convert to {type.toUpperCase()}</Button></div>
    </div>
  );
}

export function ExtractTextTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pages = await extractPdfText(file);
      const output = pages.map((page, index) => `Page ${index + 1}\n${page}`).join("\n\n");
      setText(output);
      downloadBlob(new Blob([output], { type: "text/plain" }), "paperlane-extracted-text.txt", "text/plain");
      toast.success("Text extracted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not extract text.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <SinglePdfPicker file={file} onFile={setFile} />
      {text && <Textarea value={text} readOnly className="min-h-56" />}
      <div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Extract text</Button></div>
    </div>
  );
}

export function ExtractImagesTool() {
  return <PdfToImagesTool type="png" />;
}

export function ScanToPdfTool() {
  return <ImagesToPdfCaptureTool accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }} hint="Upload scans or camera photos. On mobile, choose your camera." filename="paperlane-scan.pdf" />;
}

function ImagesToPdfCaptureTool({ accept, hint, filename }: { accept: Record<string, string[]>; hint: string; filename: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!files.length) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.create();
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isPng = file.type.includes("png") || file.name.toLowerCase().endsWith(".png");
        const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      downloadBlob(await doc.save(), filename);
      toast.success("PDF ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build PDF.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <DropZone onFiles={(newFiles) => setFiles((current) => [...current, ...newFiles])} accept={accept} hint={hint} />
      {files.length > 0 && <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{files.length} image{files.length > 1 ? "s" : ""} selected</div>}
      <div className="flex justify-end"><Button onClick={run} disabled={!files.length || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create PDF</Button></div>
    </div>
  );
}

export function CropPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [margin, setMargin] = useState(24);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const m = Math.max(0, Math.min(margin, width / 3, height / 3));
        page.setCropBox(m, m, width - m * 2, height - m * 2);
      });
      downloadBlob(await doc.save(), `paperlane-cropped-${file.name}`);
      toast.success("PDF cropped.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Crop failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF and trim the same margin from every page." />
      {file && <div><Label htmlFor="crop-margin">Margin to remove (points)</Label><Input id="crop-margin" type="number" min={0} value={margin} onChange={(event) => setMargin(Number(event.target.value))} className="mt-1" /></div>}
      <div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crop PDF</Button></div>
    </div>
  );
}

export function EditPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("Approved");
  const [x, setX] = useState(72);
  const [y, setY] = useState(72);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      doc.getPages()[0]?.drawText(text, { x, y, size: 18, font, color: rgb(0.1, 0.32, 0.45) });
      downloadBlob(await doc.save(), `paperlane-edited-${file.name}`);
      toast.success("PDF edited.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Edit failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF, then add text to the first page." />
      {file && <div className="grid gap-4 sm:grid-cols-3"><div className="sm:col-span-3"><Label htmlFor="edit-text">Text</Label><Input id="edit-text" value={text} onChange={(event) => setText(event.target.value)} className="mt-1" /></div><div><Label htmlFor="edit-x">X</Label><Input id="edit-x" type="number" value={x} onChange={(event) => setX(Number(event.target.value))} className="mt-1" /></div><div><Label htmlFor="edit-y">Y</Label><Input id="edit-y" type="number" value={y} onChange={(event) => setY(Number(event.target.value))} className="mt-1" /></div></div>}
      <div className="flex justify-end"><Button onClick={run} disabled={!file || busy || !text} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply edit</Button></div>
    </div>
  );
}

export function RedactPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [x, setX] = useState(72);
  const [y, setY] = useState(650);
  const [width, setWidth] = useState(220);
  const [height, setHeight] = useState(36);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      doc.getPages()[0]?.drawRectangle({ x, y, width, height, color: rgb(0, 0, 0), opacity: 1 });
      downloadBlob(await doc.save(), `paperlane-redacted-${file.name}`);
      toast.success("Redaction applied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Redaction failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF and place a black redaction box on the first page." />
      {file && <div className="grid gap-4 sm:grid-cols-4">{[["X", x, setX], ["Y", y, setY], ["Width", width, setWidth], ["Height", height, setHeight]].map(([label, value, setter]) => <div key={String(label)}><Label>{String(label)}</Label><Input type="number" value={Number(value)} onChange={(event) => (setter as (n: number) => void)(Number(event.target.value))} className="mt-1" /></div>)}</div>}
      <div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Redact</Button></div>
    </div>
  );
}

export function RemoveWatermarkTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        page.drawRectangle({ x: width * 0.15, y: height * 0.4, width: width * 0.7, height: height * 0.2, color: rgb(1, 1, 1), opacity: 0.88 });
      });
      downloadBlob(await doc.save(), `paperlane-watermark-covered-${file.name}`);
      toast.success("Watermark area covered.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Watermark removal failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF. This covers the central watermark area on each page." /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Remove watermark</Button></div></div>;
}

export function ProtectPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file || !password) return;
    setBusy(true);
    try {
      const { PDFDocument: EncryptedPDFDocument } = await import("pdf-lib-plus-encrypt/dist/pdf-lib-plus-encrypt.esm.js");
      const doc = await EncryptedPDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      await doc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: "highResolution", copying: false, modifying: false } });
      downloadBlob(await doc.save(), `paperlane-protected-${file.name}`);
      toast.success("PDF protected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Protect failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF and set an open password." />{file && <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />}<div className="flex justify-end"><Button onClick={run} disabled={!file || !password || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Protect PDF</Button></div></div>;
}

export function UnlockPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await loadPdf(file, password);
      const doc = await PDFDocument.create();
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const canvas = await renderPdfPageToCanvas(pdf, pageNumber, 2);
        const png = new Uint8Array(await (await canvasToBlob(canvas, "image/png")).arrayBuffer());
        const image = await doc.embedPng(png);
        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      downloadBlob(await doc.save(), `paperlane-unlocked-${file.name}`);
      toast.success("Unlocked copy ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unlock failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF and enter its known password if prompted." />{file && <Input type="password" placeholder="Known password if required" value={password} onChange={(event) => setPassword(event.target.value)} />}<div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Unlock PDF</Button></div></div>;
}

export function SignPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [signature, setSignature] = useState("Signature");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const font = await doc.embedFont(StandardFonts.TimesRomanItalic);
      const page = doc.getPages()[0];
      page?.drawText(signature, { x: 72, y: 96, size: 28, font, color: rgb(0.05, 0.11, 0.18) });
      downloadBlob(await doc.save(), `paperlane-signed-${file.name}`);
      toast.success("Signature added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF and type a signature for the first page." />{file && <Input value={signature} onChange={(event) => setSignature(event.target.value)} />}<div className="flex justify-end"><Button onClick={run} disabled={!file || !signature || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign PDF</Button></div></div>;
}

export function FillFormsTool() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [json, setJson] = useState("{}");
  const [busy, setBusy] = useState(false);
  async function choose(next: File | null) {
    setFile(next);
    setFields([]);
    if (!next) return;
    try {
      const doc = await PDFDocument.load(new Uint8Array(await next.arrayBuffer()));
      setFields(doc.getForm().getFields().map((field) => field.getName()));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read form fields.");
    }
  }
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const values = JSON.parse(json) as Record<string, string | boolean>;
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const form = doc.getForm();
      Object.entries(values).forEach(([name, value]) => {
        const field = form.getField(name) as unknown as { setText?: (v: string) => void; check?: () => void; uncheck?: () => void; select?: (v: string) => void };
        if (typeof value === "boolean" && field.check && field.uncheck) value ? field.check() : field.uncheck();
        else if (field.setText) field.setText(String(value));
        else if (field.select) field.select(String(value));
      });
      downloadBlob(await doc.save(), `paperlane-filled-${file.name}`);
      toast.success("Form filled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fill failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={choose} hint="Drop a PDF form." />{file && <div className="space-y-3"><div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">Fields: {fields.length ? fields.join(", ") : "No interactive fields found"}</div><Label htmlFor="form-json">Values as JSON</Label><Textarea id="form-json" value={json} onChange={(event) => setJson(event.target.value)} className="min-h-36 font-mono" /></div>}<div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Fill form</Button></div></div>;
}

export function ComparePdfsTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    if (files.length < 2) return;
    setBusy(true);
    try {
      const [a, b] = await Promise.all([extractPdfText(files[0]), extractPdfText(files[1])]);
      const left = a.join("\n").split(/\n|\.\s+/).map((line) => line.trim()).filter(Boolean);
      const right = b.join("\n").split(/\n|\.\s+/).map((line) => line.trim()).filter(Boolean);
      const missing = left.filter((line) => !right.includes(line)).slice(0, 200);
      const added = right.filter((line) => !left.includes(line)).slice(0, 200);
      const output = `Only in ${files[0].name}\n${missing.join("\n")}\n\nOnly in ${files[1].name}\n${added.join("\n")}`;
      setReport(output);
      downloadBlob(new Blob([output], { type: "text/plain" }), "paperlane-compare-report.txt", "text/plain");
      toast.success("Comparison ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Compare failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><DropZone onFiles={(next) => setFiles(next.slice(0, 2))} accept={{ "application/pdf": [".pdf"] }} multiple hint="Drop two PDFs to compare text." />{files.length > 0 && <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{files.map((file) => file.name).join(" + ")}</div>}{report && <Textarea value={report} readOnly className="min-h-56" />}<div className="flex justify-end"><Button onClick={run} disabled={files.length < 2 || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Compare PDFs</Button></div></div>;
}

export function OcrPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await loadPdf(file);
      const worker = await createWorker("eng");
      const out: string[] = [];
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const canvas = await renderPdfPageToCanvas(pdf, pageNumber, 1.5);
        const result = await worker.recognize(canvas);
        out.push(`Page ${pageNumber}\n${result.data.text}`);
      }
      await worker.terminate();
      const text = out.join("\n\n");
      downloadBlob(new Blob([text], { type: "text/plain" }), "paperlane-ocr.txt", "text/plain");
      toast.success("OCR text ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "OCR failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a scanned PDF to OCR in your browser." /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Run OCR</Button></div></div>;
}

export function WordToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
      const pdf = await createTextPdf(file.name, [{ heading: "Converted Word document", body: stripHtml(result.value) }]);
      downloadBlob(pdf, `paperlane-${file.name.replace(/\.docx?$/i, "")}.pdf`);
      toast.success("Word converted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Word conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return <FileToPdf accept={{ "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }} file={file} setFile={setFile} busy={busy} run={run} label="Convert Word to PDF" />;
}

export function ExcelToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const workbook = XLSX.read(await file.arrayBuffer());
      const sections = workbook.SheetNames.map((name) => ({ heading: name, body: XLSX.utils.sheet_to_csv(workbook.Sheets[name]) }));
      downloadBlob(await createTextPdf(file.name, sections), `paperlane-${file.name.replace(/\.xlsx?$/i, "")}.pdf`);
      toast.success("Excel converted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Excel conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return <FileToPdf accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "application/vnd.ms-excel": [".xls"] }} file={file} setFile={setFile} busy={busy} run={run} label="Convert Excel to PDF" />;
}

export function PowerPointToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const slideNames = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const sections = await Promise.all(slideNames.map(async (name, index) => ({ heading: `Slide ${index + 1}`, body: xmlText(await zip.file(name)!.async("text")) })));
      downloadBlob(await createTextPdf(file.name, sections), `paperlane-${file.name.replace(/\.pptx?$/i, "")}.pdf`);
      toast.success("PowerPoint converted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PowerPoint conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return <FileToPdf accept={{ "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"] }} file={file} setFile={setFile} busy={busy} run={run} label="Convert PowerPoint to PDF" />;
}

export function HtmlToPdfTool() {
  const [html, setHtml] = useState("<h1>Document</h1><p>Paste HTML here.</p>");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      downloadBlob(await createTextPdf("HTML to PDF", [{ heading: "HTML document", body: stripHtml(html) }]), "paperlane-html.pdf");
      toast.success("HTML converted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "HTML conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><Textarea value={html} onChange={(event) => setHtml(event.target.value)} className="min-h-64 font-mono" /><div className="flex justify-end"><Button onClick={run} disabled={busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Convert HTML</Button></div></div>;
}

export function EpubToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const names = Object.keys(zip.files).filter((name) => /\.(xhtml|html)$/i.test(name)).sort();
      const sections = await Promise.all(names.map(async (name) => ({ heading: name.split("/").pop() ?? name, body: stripHtml(await zip.file(name)!.async("text")) })));
      downloadBlob(await createTextPdf(file.name, sections), `paperlane-${file.name.replace(/\.epub$/i, "")}.pdf`);
      toast.success("EPUB converted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "EPUB conversion failed.");
    } finally {
      setBusy(false);
    }
  }
  return <FileToPdf accept={{ "application/epub+zip": [".epub"] }} file={file} setFile={setFile} busy={busy} run={run} label="Convert EPUB to PDF" />;
}

function FileToPdf({ accept, file, setFile, busy, run, label }: { accept: Record<string, string[]>; file: File | null; setFile: (file: File | null) => void; busy: boolean; run: () => void; label: string }) {
  return <div className="space-y-6">{!file ? <DropZone onFiles={(files) => setFile(files[0] ?? null)} accept={accept} multiple={false} hint="Drop a file to convert." /> : <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6"><div><div className="font-medium">{file.name}</div><div className="text-sm text-muted-foreground">{formatBytes(file.size)}</div></div><Button variant="ghost" onClick={() => setFile(null)}>Change</Button></div>}<div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{label}</Button></div></div>;
}

export function PdfToWordTool() {
  return <PdfTextExportTool type="word" />;
}

export function PdfToExcelTool() {
  return <PdfTextExportTool type="excel" />;
}

function PdfTextExportTool({ type }: { type: "word" | "excel" }) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pages = await extractPdfText(file);
      if (type === "word") {
        const doc = new Document({ sections: [{ children: pages.flatMap((page, index) => [new Paragraph({ children: [new TextRun({ text: `Page ${index + 1}`, bold: true })] }), ...page.split(/(?<=[.!?])\s+/).filter(Boolean).map((line) => new Paragraph(line))]) }] });
        downloadBlob(await Packer.toBlob(doc), "paperlane-pdf-text.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      } else {
        const workbook = XLSX.utils.book_new();
        const rows = pages.flatMap((page, index) => page.split(/\s{2,}|(?<=[.!?])\s+/).filter(Boolean).map((line) => ({ page: index + 1, text: line })));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "PDF Text");
        const array = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
        downloadBlob(new Blob([array], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "paperlane-pdf-text.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      }
      toast.success("Export ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint={`Drop a PDF to export text to ${type === "word" ? "Word" : "Excel"}.`} /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Export to {type === "word" ? "Word" : "Excel"}</Button></div></div>;
}

export function PdfToPowerPointTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pdf = await loadPdf(file);
      const pptx = new PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const canvas = await renderPdfPageToCanvas(pdf, pageNumber, 1.5);
        const data = await blobToDataUrl(await canvasToBlob(canvas, "image/png"));
        const slide = pptx.addSlide();
        slide.addImage({ data, x: 0, y: 0, w: 13.333, h: 7.5 });
      }
      const blob = await pptx.write({ outputType: "blob" }) as Blob;
      downloadBlob(blob, "paperlane-pdf-slides.pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      toast.success("PowerPoint ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PowerPoint export failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF to turn each page into a slide." /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Export PowerPoint</Button></div></div>;
}

export function PdfToHtmlTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pages = await extractPdfText(file);
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${file.name}</title></head><body>${pages.map((page, index) => `<section><h1>Page ${index + 1}</h1><p>${page.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</p></section>`).join("\n")}</body></html>`;
      downloadBlob(new Blob([html], { type: "text/html" }), "paperlane-pdf.html", "text/html");
      toast.success("HTML ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "HTML export failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF to export a text-based HTML file." /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Export HTML</Button></div></div>;
}

export function PdfToEpubTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!file) return;
    setBusy(true);
    try {
      const pages = await extractPdfText(file);
      const zip = new JSZip();
      zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
      zip.file("META-INF/container.xml", `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
      const manifest = pages.map((_, index) => `<item id="p${index + 1}" href="page${index + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("");
      const spine = pages.map((_, index) => `<itemref idref="p${index + 1}"/>`).join("");
      zip.file("OEBPS/content.opf", `<?xml version="1.0"?><package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">paperlane</dc:identifier><dc:title>${file.name}</dc:title><dc:language>en</dc:language></metadata><manifest>${manifest}</manifest><spine>${spine}</spine></package>`);
      pages.forEach((page, index) => zip.file(`OEBPS/page${index + 1}.xhtml`, `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Page ${index + 1}</title></head><body><h1>Page ${index + 1}</h1><p>${page}</p></body></html>`));
      downloadBlob(await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" }), "paperlane-pdf.epub", "application/epub+zip");
      toast.success("EPUB ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "EPUB export failed.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-6"><SinglePdfPicker file={file} onFile={setFile} hint="Drop a PDF to export a text-based EPUB." /><div className="flex justify-end"><Button onClick={run} disabled={!file || busy} size="lg">{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Export EPUB</Button></div></div>;
}

export function ConversionStatus() {
  const readyCount = useMemo(() => 40, []);
  return <span>{readyCount}</span>;
}
