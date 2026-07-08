import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { POSTS, getAuthor } from "@/lib/blog-data";

// TODO: replace with project URL once assigned.
const BASE_URL = "";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sorted = [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
        const items = sorted
          .map((p) => {
            const author = getAuthor(p.authorSlug);
            return [
              `    <item>`,
              `      <title>${escapeXml(p.title)}</title>`,
              `      <link>${BASE_URL}/blog/${p.slug}</link>`,
              `      <guid isPermaLink="true">${BASE_URL}/blog/${p.slug}</guid>`,
              `      <description>${escapeXml(p.excerpt)}</description>`,
              `      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>`,
              author ? `      <author>noreply@paperlane (${escapeXml(author.name)})</author>` : null,
              ...p.tags.map((t) => `      <category>${escapeXml(t)}</category>`),
              `    </item>`,
            ]
              .filter(Boolean)
              .join("\n");
          })
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
          `  <channel>`,
          `    <title>Paperlane Blog</title>`,
          `    <link>${BASE_URL}/blog</link>`,
          `    <description>Tutorials, comparison guides, and productivity tips for working with PDFs.</description>`,
          `    <language>en-us</language>`,
          `    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
          items,
          `  </channel>`,
          `</rss>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
