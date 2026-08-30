import { NextResponse } from "next/server";
import { getSession } from "@/lib/admin/session";
import { log, safeErrorMessage } from "@/lib/quotation/log";
import { renderQuotationPdf } from "@/lib/quotation/pdf";
import { isQuotationId, quotationStore } from "@/lib/quotation/store";

/**
 * Admin-only PDF stream, used by the console's preview and download controls.
 * The document is regenerated from the stored record on every request, so it
 * always reflects the current revision.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!isQuotationId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = await quotationStore().get(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const pdf = await renderQuotationPdf(record);
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(Buffer.from(pdf.bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-length": String(pdf.bytes.byteLength),
        "content-disposition": `${download ? "attachment" : "inline"}; filename="${record.number}-vezvora-quotation.pdf"`,
        // Never cached: an admin edit must be visible on the next preview.
        "cache-control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    log.error("pdf_stream_failed", { quotationId: id, error: safeErrorMessage(error) });
    return NextResponse.json({ error: "Could not render the PDF." }, { status: 500 });
  }
}
