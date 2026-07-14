/**
 * Terms & Conditions content.
 * Kept as structured data so the page stays presentational and the copy
 * is easy to review and update in one place.
 */

export type TermsSection = { title: string; body: string[] };

/** Human-readable date the terms were last revised. */
export const termsUpdated = "14 July 2026";

export const termsIntro =
  "These Terms & Conditions govern your access to and use of the Vezvora website and the services we provide. By using our website or engaging Vezvora for any work, you agree to be bound by these terms. Please read them carefully.";

export const termsSections: TermsSection[] = [
  {
    title: "1. Acceptance of terms",
    body: [
      "By accessing vezvora.io or commissioning any product, design, or engineering work from Vezvora, you confirm that you have read, understood, and agree to these Terms & Conditions and to our Privacy Policy.",
      "If you are entering into these terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these terms.",
    ],
  },
  {
    title: "2. Services",
    body: [
      "Vezvora designs and engineers software, including mobile applications, web platforms, POS systems, and custom systems. The specific scope, deliverables, timelines, and fees for any engagement are defined in a separate written proposal or statement of work agreed between you and Vezvora.",
      "Where these Terms & Conditions conflict with a signed proposal or statement of work, the signed document prevails for that engagement.",
    ],
  },
  {
    title: "3. Quotes, fees, and payment",
    body: [
      "Quotes and estimates are valid for the period stated on them and are exclusive of applicable taxes unless noted otherwise. Fees, payment schedules, and milestones are set out in the applicable proposal.",
      "Invoices are payable within the period specified on the invoice. Vezvora reserves the right to pause or suspend work on any engagement where invoices remain unpaid beyond their due date.",
    ],
  },
  {
    title: "4. Client responsibilities",
    body: [
      "You agree to provide, in a timely manner, the content, access, approvals, and information reasonably required for Vezvora to deliver the services. Delays in providing these may affect agreed timelines.",
      "You are responsible for ensuring that any material you supply to us does not infringe the rights of any third party and complies with applicable law.",
    ],
  },
  {
    title: "5. Intellectual property",
    body: [
      "Unless otherwise agreed in writing, ownership of custom deliverables transfers to you upon full payment of all fees due for the relevant engagement.",
      "Vezvora retains ownership of its pre-existing tools, frameworks, libraries, and know-how used to create the deliverables, and grants you a non-exclusive licence to use them as part of the delivered work. Vezvora may reference completed work in its portfolio unless you request otherwise in writing.",
    ],
  },
  {
    title: "6. Confidentiality",
    body: [
      "Each party agrees to keep confidential any non-public information disclosed by the other in connection with an engagement, and to use it only for the purpose of performing or receiving the services.",
      "This obligation does not apply to information that is or becomes public through no fault of the receiving party, or that must be disclosed by law.",
    ],
  },
  {
    title: "7. Warranties and disclaimers",
    body: [
      "Vezvora provides its services with reasonable skill and care. Except as expressly stated in a signed proposal, the website and services are provided on an \"as is\" and \"as available\" basis without warranties of any kind, whether express or implied.",
      "We do not warrant that the website will be uninterrupted, error-free, or free of harmful components.",
    ],
  },
  {
    title: "8. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Vezvora shall not be liable for any indirect, incidental, special, or consequential loss, including loss of profits, revenue, data, or goodwill, arising out of or in connection with the services.",
      "Vezvora's total aggregate liability arising from any engagement shall not exceed the total fees paid by you to Vezvora for that engagement.",
    ],
  },
  {
    title: "9. Third-party services",
    body: [
      "Our deliverables may integrate with or rely on third-party services, platforms, and APIs. Vezvora is not responsible for the availability, performance, or terms of those third-party services, and your use of them may be subject to their own terms.",
    ],
  },
  {
    title: "10. Termination",
    body: [
      "Either party may terminate an engagement in accordance with the terms of the applicable proposal or statement of work. On termination, you agree to pay for all services performed and expenses incurred up to the effective date of termination.",
    ],
  },
  {
    title: "11. Changes to these terms",
    body: [
      "Vezvora may update these Terms & Conditions from time to time. The current version will always be posted on this page with its revision date. Your continued use of the website after changes are posted constitutes acceptance of the updated terms.",
    ],
  },
  {
    title: "12. Governing law",
    body: [
      "These Terms & Conditions are governed by the laws of Sri Lanka, and any disputes arising under them are subject to the exclusive jurisdiction of the courts of Sri Lanka.",
    ],
  },
];
