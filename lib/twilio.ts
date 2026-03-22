import twilio from "twilio";
import type { NotificationChannel } from "./types";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromPhone = process.env.TWILIO_PHONE_NUMBER!;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

function getClient() {
  return twilio(accountSid, authToken);
}

export async function sendSMS(to: string, message: string): Promise<void> {
  const client = getClient();
  await client.messages.create({
    body: message,
    from: fromPhone,
    to,
  });
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  const client = getClient();
  // Ensure the to number is prefixed with whatsapp:
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  await client.messages.create({
    body: message,
    from: fromWhatsApp,
    to: toWhatsApp,
  });
}

export async function sendMessage(
  to: string,
  message: string,
  channel: NotificationChannel
): Promise<void> {
  if (channel === "whatsapp") {
    await sendWhatsApp(to, message);
  } else {
    await sendSMS(to, message);
  }
}

export async function sendOTP(phone: string): Promise<void> {
  // Uses Twilio Verify service
  const client = getClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  await client.verify.v2.services(serviceSid).verifications.create({
    to: phone,
    channel: "sms",
  });
}

export async function verifyOTP(
  phone: string,
  code: string
): Promise<boolean> {
  const client = getClient();
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;
  const result = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: phone, code });
  return result.status === "approved";
}
