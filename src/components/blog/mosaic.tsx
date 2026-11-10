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
