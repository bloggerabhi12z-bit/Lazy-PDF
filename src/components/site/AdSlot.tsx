/**
 * AdSense placeholder slot. Renders a labeled reserved area during development
 * so layout is stable. Replace the inner block with the AdSense <ins> tag once
 * your publisher ID and slot IDs are approved.
 */
export function AdSlot({
  label = "Advertisement",
  className = "",
  height = 90,
}: {
  label?: string;
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground ${className}`}
      style={{ minHeight: height }}
      aria-label={label}
    >
      {label}
    </div>
  );
}
