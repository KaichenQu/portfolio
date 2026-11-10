import type { ReactNode } from "react";

/** A run of the glyph the sync writes in place of redacted text. */
export const REDACTED_RUN = /(▒+)/;

/** Wraps every redacted run in a title in the same span the note body gets. */
export function mosaic(text: string): ReactNode {
  if (!REDACTED_RUN.test(text)) return text;
  return text.split(REDACTED_RUN).map((part, i) =>
    i % 2 ? (
      <span key={i} className="redacted" role="img" aria-label="redacted">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Wraps runs in a rendered diagram's HTML text (Mermaid's `foreignObject`
 * labels). SVG `<text>`/`<tspan>` cannot hold a span, so runs there stay glyphs.
 */
export function wrapRedactedRuns(root: Element): void {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode())
    if (
      REDACTED_RUN.test(n.nodeValue ?? "") &&
      n.parentElement?.namespaceURI !== SVG_NS
    )
      found.push(n as Text);
  for (const node of found)
    node.replaceWith(
      ...node.data
        .split(REDACTED_RUN)
        .map((part, i) => {
          if (i % 2 === 0) return part;
          const span = doc.createElement("span");
          span.className = "redacted";
          span.setAttribute("role", "img");
          span.setAttribute("aria-label", "redacted");
          span.textContent = part;
          return span;
        })
        .filter((part) => part !== ""),
    );
}
