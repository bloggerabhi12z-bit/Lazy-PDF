import { Link } from "@tanstack/react-router";
import { FileStack } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:rotate-[-6deg]">
            <FileStack className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Paperlane
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link to="/tools" className="text-muted-foreground hover:text-foreground transition">
            Tools
          </Link>
          <Link to="/blog" className="text-muted-foreground hover:text-foreground transition">
            Blog
          </Link>
          <a href="/#how" className="text-muted-foreground hover:text-foreground transition">
            How it works
          </a>
          <a href="/#faq" className="text-muted-foreground hover:text-foreground transition">
            FAQ
          </a>
          {/* New Leadership Tab */}
          <a href="/#leadership" className="text-muted-foreground hover:text-foreground transition">
            Leadership
          </a>
        </nav>
        <Link
          to="/tools"
          className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Open tools
        </Link>
      </div>
    </header>
  );
}