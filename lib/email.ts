// Transactional email sender (provider-agnostic via Resend's REST API — no SDK
// dependency). Gated on env: if RESEND_API_KEY is unset it logs and no-ops, so
// the app runs fine locally and starts sending the moment a key is configured.
//
// Configure in .env.local (see .env.example):
//   RESEND_API_KEY=re_xxx
//   EMAIL_FROM="Wanderstay <bookings@yourdomain.com>"   (must be a verified sender)

export type EmailAttachment = {
  filename: string;
  content: string; // base64
  contentType?: string;
};

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
};

export type SendResult = { sent: boolean; skipped?: boolean; error?: string };

export async function sendEmail(args: SendEmailArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Wanderstay <onboarding@resend.dev>";

  if (!key) {
    console.info(
      `[email] RESEND_API_KEY not set — skipping "${args.subject}" → ${args.to}`
    );
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        attachments: args.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          content_type: a.contentType,
        })),
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[email] send failed (${res.status}): ${detail}`);
      return { sent: false, error: detail };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] send threw:", e);
    return { sent: false, error: String(e) };
  }
}
