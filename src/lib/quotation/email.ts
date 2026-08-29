/**
 * Quotation email delivery (Resend).
 *
 * The project had no email provider, so Resend is integrated here in a
 * server-only module. Delivery goes through the `Mailer` interface so the
 * dispatch worker can be tested without touching the network.
 */

import { Resend } from "resend";
import { siteConfig } from "../site.ts";
import { adminEmail, appOrigin, fromEmail, replyToEmail, resendConfigured } from "./config.ts";
import { formatMoney, formatRange } from "./pricing.ts";
import type { QuotationRecord } from "./types.ts";

export type SendResult =
  | { ok: true; provider: string; messageId: string | null }
  | { ok: false; error: string; retryable: boolean };

export interface Mailer {
  sendQuotation(
    record: QuotationRecord,
    pdf: Uint8Array,
    idempotencyKey: string,
  ): Promise<SendResult>;
  notifyAdmin(record: QuotationRecord): Promise<SendResult>;
}

/** Escape untrusted text before it is interpolated into an HTML email. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px">${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

const SHELL_STYLES = {
  body: "margin:0;padding:24px 12px;background:#f1f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#23282f;",
  card: "max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e9e5;",
  header: "padding:26px 30px;background:linear-gradient(120deg,#8ec21a,#28b85f 55%,#2fd3c4);",
  inner: "padding:28px 30px;",
  footer: "padding:20px 30px;background:#fafbf8;border-top:1px solid #eceeea;font-size:12px;color:#5a6472;line-height:1.6;",
};

function shell(title: string, content: string): string {
  return `<!doctype html><html><body style="${SHELL_STYLES.body}">
  <div style="${SHELL_STYLES.card}">
    <div style="${SHELL_STYLES.header}">
      <div style="font-size:19px;font-weight:800;letter-spacing:-0.02em;color:#0e2a1c;">VEZVORA</div>
      <div style="font-size:12px;color:#0e2a1c;opacity:0.75;margin-top:2px;">${escapeHtml(title)}</div>
    </div>
    <div style="${SHELL_STYLES.inner}">${content}</div>
    <div style="${SHELL_STYLES.footer}">
      ${escapeHtml(siteConfig.name)} &middot; ${escapeHtml(siteConfig.office)}<br />
      <a href="mailto:${escapeHtml(siteConfig.email)}" style="color:#1f8f52;">${escapeHtml(siteConfig.email)}</a>
      &middot; ${escapeHtml(siteConfig.phone)}
      &middot; <a href="https://${escapeHtml(siteConfig.domain)}" style="color:#1f8f52;">${escapeHtml(siteConfig.domain)}</a>
    </div>
  </div>
</body></html>`;
}

function statRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:9px 0;font-size:13px;color:#5a6472;">${escapeHtml(label)}</td>
    <td style="padding:9px 0;font-size:14px;font-weight:700;text-align:right;">${escapeHtml(value)}</td>
  </tr>`;
}

export function customerEmailSubject(record: QuotationRecord): string {
  return `Your Vezvora estimate ${record.number} — ${record.requirements.projectName}`;
}

export function customerEmailHtml(record: QuotationRecord): string {
  const { requirements, document } = record;
  const { totals } = document;
  const firstName = requirements.contactName.split(" ")[0] || requirements.contactName;
  const range = formatRange(totals.rangeLow, totals.rangeHigh, totals.currency);

  return shell(
    `Approximate quotation ${record.number}`,
    `
    <p style="margin:0 0 14px;font-size:16px;">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#3e4946;">
      Thank you for telling us about <strong>${escapeHtml(requirements.projectName)}</strong>.
      Your approximate quotation is attached as a PDF. Here is the summary:
    </p>

    <div style="border:1px solid #cfe6c2;background:#f6fcef;border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5a6472;">Estimated price range</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px;">${escapeHtml(range)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      ${statRow("Quotation number", record.number)}
      ${statRow("Estimated delivery", document.schedule.deliveryLabel)}
      ${statRow("Quotation valid for", `${document.validityDays} days`)}
    </table>

    <p style="margin:0 0 18px;font-size:12.5px;line-height:1.6;color:#5a6472;background:#fafbf8;border-left:3px solid #28b85f;padding:12px 14px;border-radius:0 8px 8px 0;">
      ${escapeHtml(document.disclaimer)}
    </p>

    <p style="margin:0 0 8px;font-size:14px;line-height:1.65;color:#3e4946;">
      Reply to this email with any questions, or reach us on
      <a href="${escapeHtml(siteConfig.whatsappUrl)}" style="color:#1f8f52;font-weight:600;">WhatsApp</a>
      and we will walk you through the numbers.
    </p>
    <p style="margin:16px 0 0;font-size:14px;">— The Vezvora team</p>
  `,
  );
}

export function customerEmailText(record: QuotationRecord): string {
  const { requirements, document } = record;
  const range = formatRange(document.totals.rangeLow, document.totals.rangeHigh, document.totals.currency);
  return [
    `Hi ${requirements.contactName.split(" ")[0] || requirements.contactName},`,
    ``,
    `Thank you for telling us about ${requirements.projectName}. Your approximate quotation is attached as a PDF.`,
    ``,
    `Quotation number: ${record.number}`,
    `Estimated price range: ${range}`,
    `Estimated delivery: ${document.schedule.deliveryLabel}`,
    `Valid for: ${document.validityDays} days`,
    ``,
    document.disclaimer,
    ``,
    `Reply to this email with any questions, or reach us on WhatsApp: ${siteConfig.whatsappUrl}`,
    ``,
    `— The Vezvora team`,
    `${siteConfig.email} · ${siteConfig.phone} · https://${siteConfig.domain}`,
  ].join("\n");
}

function adminEmailHtml(record: QuotationRecord): string {
  const { requirements, document } = record;
  const link = `${appOrigin()}/admin/quotations/${record.id}`;
  const deadline = new Date(record.reviewDeadline).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return shell(
    `New estimate request ${record.number}`,
    `
    <p style="margin:0 0 16px;font-size:15px;">
      <strong>${escapeHtml(requirements.contactName)}</strong>
      ${requirements.companyName ? `(${escapeHtml(requirements.companyName)})` : ""}
      requested an estimate for <strong>${escapeHtml(requirements.projectName)}</strong>.
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      ${statRow("Quotation", record.number)}
      ${statRow("Estimated range", formatRange(document.totals.rangeLow, document.totals.rangeHigh, document.totals.currency))}
      ${statRow("Estimated total", formatMoney(document.totals.total, document.totals.currency))}
      ${statRow("Delivery", document.schedule.deliveryLabel)}
      ${statRow("Email", requirements.email)}
      ${statRow("Phone", requirements.phone)}
    </table>

    <div style="border:1px solid #f0d9a8;background:#fdf7e8;border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:#7a5b12;">
      Auto-send at <strong>${escapeHtml(deadline)}</strong> unless you edit, hold or cancel it first.
    </div>

    <p style="margin:0 0 18px;">
      <a href="${escapeHtml(link)}" style="display:inline-block;background:#23282f;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;">
        Review in the console
      </a>
    </p>

    <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8a938f;margin-bottom:6px;">Project description</div>
    <div style="font-size:13.5px;line-height:1.6;color:#3e4946;">${paragraphs(requirements.description)}</div>
  `,
  );
}

/* ------------------------------------------------------------ providers */

function pdfFilename(record: QuotationRecord): string {
  return `${record.number}-vezvora-quotation.pdf`;
}

class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async sendQuotation(
    record: QuotationRecord,
    pdf: Uint8Array,
    idempotencyKey: string,
  ): Promise<SendResult> {
    return this.send(
      {
        to: [record.requirements.email],
        subject: customerEmailSubject(record),
        html: customerEmailHtml(record),
        text: customerEmailText(record),
        attachments: [
          {
            filename: pdfFilename(record),
            content: Buffer.from(pdf),
            contentType: "application/pdf",
          },
        ],
      },
      // Resend deduplicates on this key, so a retried job cannot double-send
      // even if our own status guard were bypassed.
      idempotencyKey,
    );
  }

  async notifyAdmin(record: QuotationRecord): Promise<SendResult> {
    const to = adminEmail();
    if (!to) return { ok: false, error: "QUOTATION_ADMIN_EMAIL is not configured.", retryable: false };
    return this.send(
      {
        to: [to],
        subject: `New estimate ${record.number} — ${record.requirements.projectName}`,
        html: adminEmailHtml(record),
        replyTo: record.requirements.email,
      },
      `admin-${record.id}`,
    );
  }

  private async send(
    payload: {
      to: string[];
      subject: string;
      html: string;
      text?: string;
      replyTo?: string;
      attachments?: { filename: string; content: Buffer; contentType: string }[];
    },
    idempotencyKey: string,
  ): Promise<SendResult> {
    try {
      const { data, error } = await this.client.emails.send(
        {
          from: fromEmail(),
          to: payload.to,
          replyTo: payload.replyTo ?? replyToEmail(),
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          attachments: payload.attachments,
        },
        { idempotencyKey },
      );

      if (error) {
        return { ok: false, error: error.message, retryable: true };
      }
      return { ok: true, provider: "resend", messageId: data?.id ?? null };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown email transport error",
        retryable: true,
      };
    }
  }
}

/**
 * Used when `RESEND_API_KEY` is absent. Logs what would have been sent so local
 * development exercises the whole workflow without a provider account.
 */
class ConsoleMailer implements Mailer {
  async sendQuotation(record: QuotationRecord, pdf: Uint8Array): Promise<SendResult> {
    console.info(
      `[quotation] RESEND_API_KEY not set — would email ${record.number} to ${record.requirements.email} (${pdf.byteLength} byte PDF).`,
    );
    return { ok: true, provider: "console", messageId: `console-${record.id}` };
  }

  async notifyAdmin(record: QuotationRecord): Promise<SendResult> {
    console.info(
      `[quotation] RESEND_API_KEY not set — would notify admin about ${record.number}.`,
    );
    return { ok: true, provider: "console", messageId: `console-admin-${record.id}` };
  }
}

let mailerSingleton: Mailer | null = null;

export function mailer(): Mailer {
  if (!mailerSingleton) {
    const apiKey = process.env.RESEND_API_KEY;
    mailerSingleton = resendConfigured() && apiKey ? new ResendMailer(apiKey) : new ConsoleMailer();
  }
  return mailerSingleton;
}
