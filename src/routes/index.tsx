import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  MonitorSmartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { AdSlot } from "@/components/site/AdSlot";
import { TOOLS } from "@/lib/tools-registry";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paperlane — A calmer way to work with PDFs" },
      {
        name: "description",
        content:
          "Merge, split, compress, rotate, and convert PDFs directly in your browser. Fast, private, and free — your files never leave your device.",
      },
      { property: "og:title", content: "Paperlane — A calmer way to work with PDFs" },
      {
        property: "og:description",
        content:
          "Fast, private PDF tools that run entirely in your browser. No uploads, no accounts, no waiting.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const faqs = [
  {
    q: "Are my files uploaded to a server?",
    a: "No. Every tool on Paperlane runs entirely inside your browser using WebAssembly and modern JavaScript. Your PDFs never touch our servers.",
  },
  {
    q: "Is there a file size limit?",
    a: "Because processing happens on your device, the practical limit is your machine's memory. Most desktops handle 200+ page documents comfortably.",
  },
  {
    q: "Do I need to create an account?",
    a: "No account needed. Open a tool, drop a file, download the result. That's it.",
  },
  {
    q: "How much does Paperlane cost?",
    a: "The core tools are free. Paperlane is supported by non-intrusive ads and a future optional premium tier.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-signal" />
              Runs locally. Zero uploads.
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              A calmer way to
              <br />
              <span className="ink-gradient-text">work with PDFs.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Merge, split, compress, rotate, and convert — right in your browser.
              No sign-ups, no waiting queues, no files quietly sent to strangers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tools"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Browse tools <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/tools/merge"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium transition hover:border-signal"
              >
                Try Merge PDF
              </Link>
            </div>
          </motion.div>

          {/* Floating paper stack illustration */}
          <div className="pointer-events-none absolute right-[-60px] top-16 hidden md:block">
            <motion.div
              initial={{ opacity: 0, rotate: -10, y: 20 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative h-[420px] w-[320px]"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-2xl border border-border/60 bg-card shadow-xl"
                  style={{
                    transform: `rotate(${(i - 1) * 6}deg) translateY(${i * 10}px)`,
                    zIndex: 3 - i,
                  }}
                >
                  <div className="h-8 rounded-t-2xl border-b border-border/60 bg-muted/50" />
                  <div className="space-y-3 p-6">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                    <div className="mt-4 h-24 rounded-lg bg-gradient-to-br from-signal-soft to-muted" />
                    <div className="h-3 w-2/3 rounded bg-muted" />
                    <div className="h-3 w-3/4 rounded bg-muted" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-6xl px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Private by design",
              body: "Files are processed on your device. Nothing is uploaded, stored, or logged.",
            },
            {
              icon: Zap,
              title: "Instant results",
              body: "No queues, no round-trips. Most jobs finish in under a second.",
            },
            {
              icon: MonitorSmartphone,
              title: "Works everywhere",
              body: "Any modern browser, on any device — mobile, tablet, desktop.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6">
              <f.icon className="h-6 w-6 text-signal" />
              <div className="mt-4 font-display text-xl">{f.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="mx-auto max-w-6xl px-6 pt-24">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-signal">
              The toolkit
            </div>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">
              Five focused tools.
            </h2>
          </div>
          <Link
            to="/tools"
            className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-flex"
          >
            See all →
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                to="/$slug"
                params={{ slug: tool.seoSlug }}
                className="group block h-full rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-signal hover:shadow-lg"
              >
                <div
                  className={`inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${tool.accentClass}`}
                >
                  <tool.icon className="h-5 w-5 text-ink" />
                </div>
                <div className="mt-4 font-display text-lg">{tool.name}</div>
                <p className="mt-1 text-sm text-muted-foreground">{tool.tagline}</p>
                <div className="mt-4 inline-flex items-center text-sm font-medium text-signal opacity-0 transition group-hover:opacity-100">
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Ad slot */}
        <div className="mt-10">
          <AdSlot label="Sponsored" height={110} />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 pt-24">
        <div className="text-xs font-semibold uppercase tracking-widest text-signal">
          How it works
        </div>
        <h2 className="mt-2 font-display text-4xl md:text-5xl">Three steps. No fuss.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Pick a tool", d: "Choose from merge, split, compress, rotate, or JPG to PDF." },
            { n: "02", t: "Drop your file", d: "Drag a PDF (or image) into the drop zone. It stays on your device." },
            { n: "03", t: "Download", d: "The processed file is ready to save the moment it finishes." },
          ].map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6">
              <div className="font-display text-6xl text-signal/30">{s.n}</div>
              <div className="mt-2 font-display text-xl">{s.t}</div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-6 pt-24">
        <div className="text-xs font-semibold uppercase tracking-widest text-signal">
          FAQ
        </div>
        <h2 className="mt-2 font-display text-4xl md:text-5xl">Questions, answered.</h2>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-medium">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Footer />
    </div>
  );
}
