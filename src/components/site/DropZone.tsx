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
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-10 text-center transition hover:scale-[1.005] ${
        isDragActive
          ? "border-signal bg-signal-soft/60"
          : "border-border bg-card/60 hover:border-signal/60"
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
        animate={{ y: isDragActive ? -4 : 0 }}
        className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground"
      >
        <UploadCloud className="h-6 w-6" />
      </motion.div>
      <div className="mt-4 font-display text-xl">
        {isDragActive ? "Drop your files" : "Drop files here or click to upload"}
      </div>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
