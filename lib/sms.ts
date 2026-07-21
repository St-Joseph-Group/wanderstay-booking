// Transactional SMS sender (Twilio REST API via fetch — no SDK dependency).
// Gated on env: unset creds → logs and no-ops. Sends once configured.
//
// Configure in .env.local (see .env.example):
//   TWILIO_ACCOUNT_SID=ACxxx
//   TWILIO_AUTH_TOKEN=xxx
//   TWILIO_FROM=+1234567890   (a Twilio number)

export type SmsResult = { sent: boolean; skipped?: boolean; error?: string };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (!sid || !token || !from) {
    console.info(`[sms] Twilio not configured — skipping SMS → ${to}`);
    return { sent: false, skipped: true };
  }
  if (!to) return { sent: false, skipped: true };

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[sms] send failed (${res.status}): ${detail}`);
      return { sent: false, error: detail };
    }
    return { sent: true };
  } catch (e) {
    console.error("[sms] send threw:", e);
    return { sent: false, error: String(e) };
  }
}
