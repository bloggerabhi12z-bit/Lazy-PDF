import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ToolMeta } from "@/lib/tools-registry";

export function ComingSoonTool({ tool }: { tool: ToolMeta }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-signal-soft/50">
        <Sparkles className="h-5 w-5 text-signal" />
      </div>
      <h2 className="mt-4 font-display text-2xl">{tool.name} is on the way</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        We're polishing this tool. In the meantime, try one of our ready-to-use tools.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link to="/tools">Browse all tools</Link>
        </Button>
      </div>
    </div>
  );
}
