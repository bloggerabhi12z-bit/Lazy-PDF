import { useDropzone, type Accept } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { motion } from "framer-motion";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  hint?: string;
}

export function DropZone({ onFiles, accept, multiple = true, hint }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFiles,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed p-12 text-center transition-all ${
        isDragActive
          ? "scale-[1.01] border-signal bg-signal-soft/70"
          : "border-border bg-gradient-to-b from-card to-secondary/40 hover:scale-[1.005] hover:border-signal/70 hover:shadow-lg"
      }`}
    >
      <input
        {...getInputProps({
          style: {
            border: 0,
            clip: "rect(0px, 0px, 0px, 0px)",
            clipPath: "inset(50%)",
            height: "1px",
            margin: "0px -1px -1px 0px",
            overflow: "hidden",
            padding: 0,
            position: "absolute",
            width: "1px",
            whiteSpace: "nowrap",
          },
        })}
      />
      <motion.div
        animate={{ y: isDragActive ? -6 : 0, scale: isDragActive ? 1.05 : 1 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-signal text-ink shadow-md shadow-signal/30 transition-transform group-hover:-translate-y-1"
      >
        <UploadCloud className="h-8 w-8" />
      </motion.div>
      <div className="mt-5 font-display text-2xl">
        {isDragActive ? "Drop your files" : "Select PDF files"}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isDragActive ? "" : "or drag and drop here"}
      </p>
      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
