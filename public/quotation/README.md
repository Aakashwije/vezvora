# Quotation letterhead

Place the Vezvora letterhead artwork here as:

    public/quotation/vezvora-letterhead.png

Requirements:

- **PNG** (the renderer embeds PNG only).
- **A4 proportions** (1:1.414 — e.g. 2480 x 3508 px at 300dpi). Artwork within
  2% of A4 is scaled to cover the page exactly; anything further off is centred
  and letterboxed instead of cropped, so branding is never cut off.
- Keep the middle of the page clear. Content is laid out inside the safe area
  defined in `src/lib/quotation/pdf.ts` (`SAFE_AREA`). The current values are
  measured from the installed artwork: 155pt clear at the top (logo block and
  top-right wedge end at 141pt), 130pt at the bottom (the bottom-left wedge
  reaches the text margin around 112pt up, and the contact pill sits in the last
  50pt), and 56pt at each side. Override per-deployment with
  `QUOTATION_PDF_MARGIN_TOP` / `_BOTTOM` / `_LEFT` / `_RIGHT`.

If you replace the artwork, re-measure rather than guessing: any pale watermark
is fine to sit under text, but solid shapes are not.

If the file is absent the application does **not** break: it logs a warning
(`[quotation] Letterhead image not found ...`) and renders a clean fallback
layout with a drawn Vezvora header and footer.
