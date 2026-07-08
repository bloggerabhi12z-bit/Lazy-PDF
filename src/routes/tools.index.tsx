import { createFileRoute } from "@tanstack/react-router";
import { ToolsIndex } from "./tools";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "All PDF tools — Paperlane" },
      { name: "description", content: "Every Paperlane PDF tool in one place. Merge, split, compress, rotate, and convert — all in your browser." },
      { property: "og:title", content: "All PDF tools — Paperlane" },
      { property: "og:description", content: "Every Paperlane PDF tool in one place." },
      { property: "og:url", content: "/tools" },
    ],
    links: [{ rel: "canonical", href: "/tools" }],
  }),
  component: ToolsIndex,
});
