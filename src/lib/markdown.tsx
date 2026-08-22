import type { ReactNode } from "react";

/** Safe Markdown subset for assistant messages. Never uses innerHTML. */

function safeHref(href: string): string | null {
  try {
    const url = new URL(href, "https://invalid.local");
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
  } catch {
    return null;
  }
  return null;
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i}`;
    i += 1;
    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="safe-md-code">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key}>{token.slice(2, -2)}</strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2] ?? "") : null;
      if (href && link) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="safe-md-link"
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function stripTags(value: string): string {
  return value.replace(/<\/?[a-zA-Z][^>]*>/g, "");
}

export function SafeMarkdown({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        body.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre key={`pre-${k}`} className="safe-md-pre">
          <code data-lang={lang || undefined}>{body.join("\n")}</code>
        </pre>,
      );
      k += 1;
      continue;
    }
    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 1;
      const text = stripTags(line.replace(/^#{1,3}\s+/, ""));
      const Tag = (level === 1 ? "h3" : level === 2 ? "h3" : "h4") as "h3" | "h4";
      blocks.push(
        <Tag key={`h-${k}`} className="safe-md-h">
          {inline(text, `h${k}`)}
        </Tag>,
      );
      i += 1;
      k += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push(stripTags((lines[i] ?? "").replace(/^\s*[-*]\s+/, "")));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${k}`} className="safe-md-list">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ul${k}-${idx}`)}</li>
          ))}
        </ul>,
      );
      k += 1;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push(stripTags((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${k}`} className="safe-md-list">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item, `ol${k}-${idx}`)}</li>
          ))}
        </ol>,
      );
      k += 1;
      continue;
    }
    if (!line.trim()) {
      i += 1;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && (lines[i] ?? "").trim() && !/^(#{1,3}\s+|```|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i] ?? "")) {
      para.push(stripTags(lines[i] ?? ""));
      i += 1;
    }
    blocks.push(
      <p key={`p-${k}`} className="safe-md-p">
        {inline(para.join(" "), `p${k}`)}
      </p>,
    );
    k += 1;
  }
  return <div className="safe-md">{blocks}</div>;
}
