/**
 * Server-side quotation PDF renderer (pdf-lib).
 *
 * pdf-lib is pure JavaScript with no native bindings or headless browser, so it
 * runs unchanged in a Vercel serverless function. The letterhead PNG is drawn
 * as a full-page background on every page and all content is laid out inside a
 * safe area that clears the letterhead's header, footer and branding.
 */

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { siteConfig } from "../site.ts";
import {
  budgetLabel,
  designLabel,
  featureLabel,
  integrationLabel,
  maintenanceLabel,
  platformLabel,
  serviceLabel,
  timelineLabel,
  volumeLabel,
} from "../../content/quotation-options.ts";
import { formatMoney, formatRange } from "./pricing.ts";
import type { QuotationRecord } from "./types.ts";

/** A4 at 72dpi, in PostScript points. */
const PAGE = { width: 595.28, height: 841.89 };

/**
 * Safe content area, measured from the supplied letterhead artwork:
 *
 *  - the logo block and top-right wedge end 141pt down, so content starts at 155pt;
 *  - the bottom-left wedge grows in from the left edge and reaches the 56pt text
 *    margin about 112pt up from the foot, so content stops at 130pt;
 *  - the footer contact pill occupies the bottom ~50pt.
 *
 * Re-measure and adjust these if the artwork changes; each is overridable
 * per-deployment without a code change.
 */
export const SAFE_AREA = {
  top: envNumber("QUOTATION_PDF_MARGIN_TOP", 155),
  bottom: envNumber("QUOTATION_PDF_MARGIN_BOTTOM", 130),
  left: envNumber("QUOTATION_PDF_MARGIN_LEFT", 56),
  right: envNumber("QUOTATION_PDF_MARGIN_RIGHT", 56),
};

export const LETTERHEAD_PATH = path.join(
  process.cwd(),
  "public",
  "quotation",
  "vezvora-letterhead.png",
);

const COLORS = {
  ink: rgb(0.137, 0.157, 0.184),
  soft: rgb(0.29, 0.33, 0.36),
  muted: rgb(0.42, 0.46, 0.5),
  green: rgb(0.157, 0.561, 0.322),
  line: rgb(0.85, 0.87, 0.85),
  band: rgb(0.965, 0.976, 0.957),
  white: rgb(1, 1, 1),
};

function envNumber(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

/**
 * pdf-lib's standard fonts are WinAnsi-encoded and throw on characters outside
 * it. Normalise the typographic characters our copy and `Intl` formatting can
 * produce, then drop anything still unrepresentable.
 */
export function sanitizeForPdf(value: string): string {
  return (
    value
      // Smart quotes, dashes and ellipsis to their ASCII equivalents.
      .replace(/[‘’‛]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—−]/g, "-")
      .replace(/…/g, "...")
      // Non-breaking and thin spaces `Intl` inserts into currency output.
      .replace(/[\u00a0\u2007\u2009\u202f]/g, " ")
      // Anything left outside ASCII printable + Latin-1 supplement.
      .replace(/[^\u0020-\u007e\u00a0-\u00ff\n]/g, "")
  );
}

/* ------------------------------------------------------------ letterhead */

export type LetterheadState = { available: boolean; bytes: Uint8Array | null; reason?: string };

let letterheadCache: LetterheadState | null = null;
let warnedMissing = false;

/**
 * Load the letterhead once per server instance. A missing file is a
 * configuration problem, not a crash: we warn loudly and fall back to a clean
 * drawn header so quotations keep going out.
 */
export async function loadLetterhead(): Promise<LetterheadState> {
  if (letterheadCache) return letterheadCache;

  try {
    const bytes = await readFile(LETTERHEAD_PATH);
    letterheadCache = { available: true, bytes: new Uint8Array(bytes) };
    return letterheadCache;
  } catch {
    // On Vercel the file may not be traced into the function bundle; try the
    // deployment's own static asset as a second source before giving up.
    const fetched = await fetchLetterhead();
    if (fetched) {
      letterheadCache = { available: true, bytes: fetched };
      return letterheadCache;
    }
  }

  const reason = `Letterhead image not found at public/quotation/vezvora-letterhead.png — quotations will use the fallback layout.`;
  if (!warnedMissing) {
    warnedMissing = true;
    console.warn(`[quotation] ${reason}`);
  }
  letterheadCache = { available: false, bytes: null, reason };
  return letterheadCache;
}

async function fetchLetterhead(): Promise<Uint8Array | null> {
  const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  if (!base) return null;
  try {
    const response = await fetch(`${base}/quotation/vezvora-letterhead.png`);
    if (!response.ok) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

/** Test seam: clears the cached image so a fixture change is picked up. */
export function resetLetterheadCache(): void {
  letterheadCache = null;
  warnedMissing = false;
}

/**
 * Fit the artwork to the page. "Cover" is used when the artwork is close to A4
 * so it truly fills the page; a materially different aspect ratio is letterboxed
 * instead, because cropping a letterhead would cut off branding or contact details.
 */
function backgroundRect(image: PDFImage) {
  const cover = Math.max(PAGE.width / image.width, PAGE.height / image.height);
  const contain = Math.min(PAGE.width / image.width, PAGE.height / image.height);
  const overflow = cover / contain - 1;
  const scale = overflow <= 0.02 ? cover : contain;

  const width = image.width * scale;
  const height = image.height * scale;
  return {
    x: (PAGE.width - width) / 2,
    y: (PAGE.height - height) / 2,
    width,
    height,
    letterboxed: scale === contain && overflow > 0.02,
  };
}

/* --------------------------------------------------------- layout engine */

type Fonts = { regular: PDFFont; bold: PDFFont };

/** Greedy word wrap against real glyph widths. */
export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of sanitizeForPdf(text).split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * A paginating cursor. Callers ask for vertical space before drawing; when a
 * block does not fit, a fresh page is started (with the letterhead re-applied)
 * so nothing is ever clipped or split mid-row.
 */
class Layout {
  readonly pages: PDFPage[] = [];
  page!: PDFPage;
  y = 0;

  // Declared explicitly rather than as parameter properties: Node's
  // type-stripping test runner does not support that TypeScript shorthand.
  readonly #doc: PDFDocument;
  readonly #fonts: Fonts;
  readonly #background: PDFImage | null;
  readonly #onNewPage?: (layout: Layout, index: number) => void;

  constructor(
    doc: PDFDocument,
    fonts: Fonts,
    background: PDFImage | null,
    onNewPage?: (layout: Layout, index: number) => void,
  ) {
    this.#doc = doc;
    this.#fonts = fonts;
    this.#background = background;
    this.#onNewPage = onNewPage;
    this.newPage();
  }

  get left() {
    return SAFE_AREA.left;
  }
  get right() {
    return PAGE.width - SAFE_AREA.right;
  }
  get width() {
    return this.right - this.left;
  }
  get bottom() {
    return SAFE_AREA.bottom;
  }

  newPage(): void {
    const page = this.#doc.addPage([PAGE.width, PAGE.height]);
    if (this.#background) {
      page.drawImage(this.#background, backgroundRect(this.#background));
    } else {
      this.drawFallbackChrome(page);
    }
    this.pages.push(page);
    this.page = page;
    this.y = PAGE.height - SAFE_AREA.top;
    if (this.pages.length > 1) this.#onNewPage?.(this, this.pages.length);
  }

  /** Clean brand chrome used when the letterhead image is unavailable. */
  private drawFallbackChrome(page: PDFPage): void {
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 96,
      width: PAGE.width,
      height: 96,
      color: COLORS.band,
    });
    page.drawRectangle({
      x: 0,
      y: PAGE.height - 100,
      width: PAGE.width,
      height: 4,
      color: COLORS.green,
    });
    page.drawText("VEZVORA", {
      x: SAFE_AREA.left,
      y: PAGE.height - 58,
      size: 22,
      font: this.#fonts.bold,
      color: COLORS.ink,
    });
    page.drawText(sanitizeForPdf(siteConfig.tagline), {
      x: SAFE_AREA.left,
      y: PAGE.height - 76,
      size: 9,
      font: this.#fonts.regular,
      color: COLORS.muted,
    });

    const contact = sanitizeForPdf(
      `${siteConfig.email}  |  ${siteConfig.phone}  |  ${siteConfig.domain}`,
    );
    page.drawText(contact, {
      x: SAFE_AREA.left,
      y: 56,
      size: 8.5,
      font: this.#fonts.regular,
      color: COLORS.muted,
    });
    page.drawText(sanitizeForPdf(siteConfig.office), {
      x: SAFE_AREA.left,
      y: 44,
      size: 8.5,
      font: this.#fonts.regular,
      color: COLORS.muted,
    });
  }

  /** Start a new page unless `height` still fits inside the safe area. */
  ensure(height: number): void {
    if (this.y - height < this.bottom) this.newPage();
  }

  space(amount: number): void {
    this.y -= amount;
  }

  text(
    value: string,
    options: {
      size?: number;
      font?: PDFFont;
      color?: RGB;
      x?: number;
      maxWidth?: number;
      lineHeight?: number;
      align?: "left" | "right";
    } = {},
  ): void {
    const size = options.size ?? 10;
    const font = options.font ?? this.#fonts.regular;
    const color = options.color ?? COLORS.soft;
    const lineHeight = options.lineHeight ?? size * 1.45;
    const maxWidth = options.maxWidth ?? this.width;
    const lines = wrapText(value, font, size, maxWidth);

    for (const lineText of lines) {
      this.ensure(lineHeight);
      const x =
        options.align === "right"
          ? (options.x ?? this.right) - font.widthOfTextAtSize(lineText, size)
          : (options.x ?? this.left);
      this.page.drawText(lineText, { x, y: this.y - size, size, font, color });
      this.y -= lineHeight;
    }
  }

  /** Height `text()` would consume, for keep-together decisions. */
  measure(value: string, size: number, font: PDFFont, maxWidth: number, lineHeight?: number): number {
    return wrapText(value, font, size, maxWidth).length * (lineHeight ?? size * 1.45);
  }

  /**
   * Section heading. `keepWith` is the height of the content that must follow it
   * on the same page, so a heading is never stranded at the foot of one.
   */
  heading(value: string, keepWith = 44): void {
    this.ensure(34 + keepWith);
    this.space(6);
    this.page.drawText(sanitizeForPdf(value.toUpperCase()), {
      x: this.left,
      y: this.y - 9,
      size: 9,
      font: this.#fonts.bold,
      color: COLORS.green,
    });
    this.y -= 15;
    this.page.drawLine({
      start: { x: this.left, y: this.y },
      end: { x: this.right, y: this.y },
      thickness: 0.75,
      color: COLORS.line,
    });
    this.y -= 12;
  }

  bullets(items: string[], size = 9.5): void {
    for (const item of items) {
      const indent = 12;
      const lines = wrapText(item, this.#fonts.regular, size, this.width - indent);
      this.ensure(lines.length * size * 1.4);
      this.page.drawText("-", {
        x: this.left,
        y: this.y - size,
        size,
        font: this.#fonts.regular,
        color: COLORS.green,
      });
      for (const lineText of lines) {
        this.page.drawText(lineText, {
          x: this.left + indent,
          y: this.y - size,
          size,
          font: this.#fonts.regular,
          color: COLORS.soft,
        });
        this.y -= size * 1.4;
      }
    }
  }
}

/* ------------------------------------------------------------- rendering */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * 86_400_000).toISOString();
}

type Column = { key: "description" | "qty" | "unit" | "amount"; label: string; width: number; align: "left" | "right" };

function tableColumns(totalWidth: number): Column[] {
  const qty = 44;
  const unit = 92;
  const amount = 100;
  return [
    { key: "description", label: "Scope item", width: totalWidth - qty - unit - amount, align: "left" },
    { key: "qty", label: "Qty", width: qty, align: "right" },
    { key: "unit", label: "Unit price", width: unit, align: "right" },
    { key: "amount", label: "Amount", width: amount, align: "right" },
  ];
}

const TABLE_HEADER_HEIGHT = 26;

function drawTableHeader(layout: Layout, fonts: Fonts, columns: Column[]): void {
  const height = 22;
  layout.page.drawRectangle({
    x: layout.left,
    y: layout.y - height + 6,
    width: layout.width,
    height,
    color: COLORS.band,
  });

  let x = layout.left;
  for (const column of columns) {
    const label = column.label.toUpperCase();
    const width = fonts.bold.widthOfTextAtSize(label, 7.5);
    layout.page.drawText(label, {
      x: column.align === "right" ? x + column.width - width - 8 : x + 8,
      y: layout.y - 8,
      size: 7.5,
      font: fonts.bold,
      color: COLORS.muted,
    });
    x += column.width;
  }
  layout.y -= height + 4;
}

function renderRequirements(layout: Layout, fonts: Fonts, record: QuotationRecord): void {
  const requirements = record.requirements;
  const rows: [string, string][] = [
    ["Service", serviceLabel(requirements.service)],
    ["Platforms", requirements.platforms.map(platformLabel).join(", ") || "-"],
    ["Design scope", designLabel(requirements.design)],
    ["Expected scale", volumeLabel(requirements.userVolume)],
    ["Preferred timeline", timelineLabel(requirements.timeline)],
    ["Support", maintenanceLabel(requirements.maintenance)],
    ["Key features", requirements.features.map(featureLabel).join(", ") || "-"],
    ["Integrations", requirements.integrations.map(integrationLabel).join(", ") || "None specified"],
    ["Indicated budget", budgetLabel(requirements.budget)],
  ];

  const labelWidth = 118;
  for (const [label, value] of rows) {
    const height = Math.max(
      13,
      layout.measure(value, 9.5, fonts.regular, layout.width - labelWidth, 13),
    );
    layout.ensure(height);
    layout.page.drawText(sanitizeForPdf(label), {
      x: layout.left,
      y: layout.y - 9.5,
      size: 9.5,
      font: fonts.bold,
      color: COLORS.ink,
    });
    const lines = wrapText(value, fonts.regular, 9.5, layout.width - labelWidth);
    let cursor = layout.y;
    for (const lineText of lines) {
      layout.page.drawText(lineText, {
        x: layout.left + labelWidth,
        y: cursor - 9.5,
        size: 9.5,
        font: fonts.regular,
        color: COLORS.soft,
      });
      cursor -= 13;
    }
    layout.y = cursor;
  }
}

export type PdfResult = { bytes: Uint8Array; hash: string; usedLetterhead: boolean };

export type RenderOptions = {
  /**
   * Supply the letterhead directly instead of reading `public/quotation`.
   * Used by the tests to exercise both the artwork and fallback paths.
   */
  letterhead?: Uint8Array | null;
};

/**
 * Render a quotation to PDF bytes. Deterministic for a given record, so the
 * document is regenerated on demand rather than stored as a blob.
 */
export async function renderQuotationPdf(
  record: QuotationRecord,
  options: RenderOptions = {},
): Promise<PdfResult> {
  const letterhead: LetterheadState =
    options.letterhead === undefined
      ? await loadLetterhead()
      : { available: options.letterhead !== null, bytes: options.letterhead };
  const doc = await PDFDocument.create();

  doc.setTitle(`Quotation ${record.number} - ${record.requirements.projectName}`);
  doc.setAuthor(siteConfig.name);
  doc.setSubject("Approximate project quotation");
  doc.setCreator(siteConfig.name);
  doc.setProducer(siteConfig.name);
  // Fixed dates keep byte output stable for identical input, which makes the
  // content hash meaningful.
  const created = new Date(record.createdAt);
  doc.setCreationDate(created);
  doc.setModificationDate(new Date(record.updatedAt));

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  let background: PDFImage | null = null;
  if (letterhead.available && letterhead.bytes) {
    try {
      background = await doc.embedPng(letterhead.bytes);
    } catch (error) {
      console.warn(
        `[quotation] Letterhead could not be embedded (expected a PNG): ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      background = null;
    }
  }

  const { document, requirements } = record;
  const { currency } = document.totals;
  const locale = "en-LK";

  const layout = new Layout(doc, fonts, background, (self) => {
    // Continuation header: keeps every page identifiable on its own.
    self.page.drawText(sanitizeForPdf(`Quotation ${record.number} (continued)`), {
      x: self.left,
      y: PAGE.height - SAFE_AREA.top + 18,
      size: 8.5,
      font: fonts.bold,
      color: COLORS.muted,
    });
  });

  /* Title block */
  layout.page.drawText("QUOTATION", {
    x: layout.left,
    y: layout.y - 20,
    size: 21,
    font: fonts.bold,
    color: COLORS.ink,
  });
  layout.page.drawText(sanitizeForPdf(record.number), {
    x: layout.right - fonts.bold.widthOfTextAtSize(sanitizeForPdf(record.number), 13),
    y: layout.y - 18,
    size: 13,
    font: fonts.bold,
    color: COLORS.green,
  });
  layout.y -= 30;

  const issued = formatDate(record.createdAt);
  const validUntil = formatDate(addDays(record.createdAt, document.validityDays));
  layout.text(`Issue date: ${issued}   |   Valid until: ${validUntil}`, {
    size: 9,
    color: COLORS.muted,
  });
  if (record.revision > 0) {
    layout.text(`Revision ${record.revision}`, { size: 9, color: COLORS.muted });
  }
  layout.space(6);

  /* Prepared for */
  layout.heading("Prepared for");
  layout.text(requirements.contactName, { size: 12, font: fonts.bold, color: COLORS.ink });
  if (requirements.companyName) {
    layout.text(requirements.companyName, { size: 10, color: COLORS.soft });
  }
  layout.text(`${requirements.email}   ${requirements.phone}`, { size: 9.5, color: COLORS.muted });
  layout.space(8);

  /* Project summary */
  layout.heading("Project summary");
  layout.text(requirements.projectName, { size: 12, font: fonts.bold, color: COLORS.ink });
  layout.space(2);
  layout.text(document.scopeSummary, { size: 9.5 });
  layout.space(4);
  layout.text(requirements.description, { size: 9.5, color: COLORS.muted });
  layout.space(10);

  /* Requirements captured */
  layout.heading("Requirements captured");
  renderRequirements(layout, fonts, record);
  layout.space(10);

  /* Itemised pricing */
  const columns = tableColumns(layout.width);
  // Keep the heading with the column header and the first row.
  const firstItem = document.lineItems[0];
  const firstRowHeight = firstItem
    ? wrapText(firstItem.description, fonts.bold, 9.5, columns[0].width - 12).length * 12.5 +
      (firstItem.detail
        ? wrapText(firstItem.detail, fonts.regular, 8, columns[0].width - 12).length * 10
        : 0) +
      10
    : 0;
  layout.heading("Itemised scope & pricing", TABLE_HEADER_HEIGHT + firstRowHeight);
  // The header is drawn lazily, immediately before the first row that fits on a
  // page, so it can never be stranded alone at the foot of one.
  let needsHeader = true;

  for (const item of document.lineItems) {
    const descriptionWidth = columns[0].width - 12;
    const nameLines = wrapText(item.description, fonts.bold, 9.5, descriptionWidth);
    const detailLines = item.detail ? wrapText(item.detail, fonts.regular, 8, descriptionWidth) : [];
    const rowHeight = nameLines.length * 12.5 + detailLines.length * 10 + 10;

    // A row is atomic: header and row move to the next page together.
    const needed = rowHeight + (needsHeader ? TABLE_HEADER_HEIGHT : 0);
    if (layout.y - needed < layout.bottom) {
      layout.newPage();
      needsHeader = true;
    }
    if (needsHeader) {
      drawTableHeader(layout, fonts, columns);
      needsHeader = false;
    }

    const rowTop = layout.y;
    let cursor = rowTop;
    for (const lineText of nameLines) {
      layout.page.drawText(lineText, {
        x: layout.left + 8,
        y: cursor - 9.5,
        size: 9.5,
        font: fonts.bold,
        color: COLORS.ink,
      });
      cursor -= 12.5;
    }
    for (const lineText of detailLines) {
      layout.page.drawText(lineText, {
        x: layout.left + 8,
        y: cursor - 8,
        size: 8,
        font: fonts.regular,
        color: COLORS.muted,
      });
      cursor -= 10;
    }

    const values: Record<Column["key"], string> = {
      description: "",
      qty: String(item.quantity),
      unit: formatMoney(item.unitPrice, currency, locale),
      amount: formatMoney(item.total, currency, locale),
    };

    let x = layout.left;
    for (const column of columns) {
      if (column.key !== "description") {
        const value = sanitizeForPdf(values[column.key]);
        const font = column.key === "amount" ? fonts.bold : fonts.regular;
        const width = font.widthOfTextAtSize(value, 9.5);
        layout.page.drawText(value, {
          x: x + column.width - width - 8,
          y: rowTop - 9.5,
          size: 9.5,
          font,
          color: column.key === "amount" ? COLORS.ink : COLORS.soft,
        });
      }
      x += column.width;
    }

    layout.y = rowTop - rowHeight;
    layout.page.drawLine({
      start: { x: layout.left, y: layout.y + 4 },
      end: { x: layout.right, y: layout.y + 4 },
      thickness: 0.5,
      color: COLORS.line,
    });
  }

  /* Totals — kept together on one page */
  const totals = document.totals;
  const totalRows: [string, string, boolean][] = [
    ["Subtotal", formatMoney(totals.subtotal, currency, locale), false],
  ];
  if (totals.discountAmount > 0) {
    totalRows.push([
      `${totals.discountLabel ?? "Discount"} (${Math.round(totals.discountPct * 100)}%)`,
      `- ${formatMoney(totals.discountAmount, currency, locale)}`,
      false,
    ]);
  }
  if (totals.taxAmount > 0) {
    totalRows.push([
      `${totals.taxLabel} (${Math.round(totals.taxPct * 100)}%)`,
      formatMoney(totals.taxAmount, currency, locale),
      false,
    ]);
  }
  totalRows.push(["Estimated total", formatMoney(totals.total, currency, locale), true]);

  layout.ensure(totalRows.length * 16 + 58);
  layout.space(8);
  for (const [label, value, strong] of totalRows) {
    const size = strong ? 11 : 9.5;
    const font = strong ? fonts.bold : fonts.regular;
    layout.page.drawText(sanitizeForPdf(label), {
      x: layout.right - 240,
      y: layout.y - size,
      size,
      font,
      color: strong ? COLORS.ink : COLORS.soft,
    });
    const text = sanitizeForPdf(value);
    layout.page.drawText(text, {
      x: layout.right - font.widthOfTextAtSize(text, size),
      y: layout.y - size,
      size,
      font,
      color: strong ? COLORS.ink : COLORS.soft,
    });
    layout.y -= strong ? 20 : 15;
  }

  /* Headline range */
  const rangeText = sanitizeForPdf(formatRange(totals.rangeLow, totals.rangeHigh, currency, locale));
  const boxHeight = 46;
  layout.ensure(boxHeight + 10);
  layout.page.drawRectangle({
    x: layout.left,
    y: layout.y - boxHeight,
    width: layout.width,
    height: boxHeight,
    color: COLORS.band,
    borderColor: COLORS.green,
    borderWidth: 0.75,
  });
  layout.page.drawText("ESTIMATED PRICE RANGE", {
    x: layout.left + 14,
    y: layout.y - 18,
    size: 7.5,
    font: fonts.bold,
    color: COLORS.muted,
  });
  layout.page.drawText(rangeText, {
    x: layout.left + 14,
    y: layout.y - 36,
    size: 14,
    font: fonts.bold,
    color: COLORS.ink,
  });
  const deliveryText = sanitizeForPdf(document.schedule.deliveryLabel);
  layout.page.drawText(deliveryText, {
    x: layout.right - 14 - fonts.bold.widthOfTextAtSize(deliveryText, 10),
    y: layout.y - 30,
    size: 10,
    font: fonts.bold,
    color: COLORS.green,
  });
  layout.page.drawText("Estimated delivery", {
    x: layout.right - 14 - fonts.regular.widthOfTextAtSize("Estimated delivery", 7.5),
    y: layout.y - 18,
    size: 7.5,
    font: fonts.regular,
    color: COLORS.muted,
  });
  layout.y -= boxHeight + 14;

  /* Payment schedule */
  layout.heading("Payment schedule");
  for (const milestone of document.paymentSchedule) {
    layout.ensure(14);
    layout.page.drawText(
      sanitizeForPdf(`${Math.round(milestone.pct * 100)}%  ${milestone.label}`),
      { x: layout.left, y: layout.y - 9.5, size: 9.5, font: fonts.regular, color: COLORS.soft },
    );
    const amount = sanitizeForPdf(formatMoney(milestone.amount, currency, locale));
    layout.page.drawText(amount, {
      x: layout.right - fonts.bold.widthOfTextAtSize(amount, 9.5),
      y: layout.y - 9.5,
      size: 9.5,
      font: fonts.bold,
      color: COLORS.ink,
    });
    layout.y -= 14;
  }
  layout.space(8);

  layout.heading("Assumptions");
  layout.bullets(document.assumptions);
  layout.space(8);

  layout.heading("Exclusions");
  layout.bullets(document.exclusions);
  layout.space(8);

  layout.heading("Validity & terms");
  layout.text(
    `This quotation is valid for ${document.validityDays} days from ${issued} (until ${validUntil}). Work begins on written confirmation and receipt of the mobilisation payment.`,
    { size: 9.5 },
  );
  layout.space(6);
  layout.text(document.disclaimer, { size: 9, font: fonts.bold, color: COLORS.ink });
  layout.space(8);

  layout.heading("Contact");
  layout.text(
    `${siteConfig.name} - ${siteConfig.email} - ${siteConfig.phone}\n${siteConfig.office}\nhttps://${siteConfig.domain}`,
    { size: 9.5 },
  );

  /* Page numbers, drawn once the final count is known. */
  const pageCount = layout.pages.length;
  layout.pages.forEach((page, index) => {
    const label = sanitizeForPdf(`${record.number}  -  Page ${index + 1} of ${pageCount}`);
    page.drawText(label, {
      x: PAGE.width - SAFE_AREA.right - fonts.regular.widthOfTextAtSize(label, 7.5),
      y: SAFE_AREA.bottom - 16,
      size: 7.5,
      font: fonts.regular,
      color: COLORS.muted,
    });
  });

  const bytes = await doc.save({ useObjectStreams: false });
  return {
    bytes,
    hash: createHash("sha256").update(bytes).digest("hex").slice(0, 32),
    usedLetterhead: background !== null,
  };
}
