import { NextResponse } from "next/server";
import { isValidNewsletterEmail } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.NEWSLETTER_ENDPOINT) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const endpoint = process.env.NEWSLETTER_ENDPOINT;
  if (!endpoint) return NextResponse.json({ error: "Newsletter signup is not configured yet." }, { status: 503 });

  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const record = attempts.get(address);
  if (record && record.resetAt > now && record.count >= 5) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });
  }
  attempts.set(address, record && record.resetAt > now ? { ...record, count: record.count + 1 } : { count: 1, resetAt: now + 60 * 60_000 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const email = typeof body === "object" && body !== null && "email" in body ? (body as { email: unknown }).email : undefined;
  if (!isValidNewsletterEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NEWSLETTER_API_TOKEN ? { Authorization: `Bearer ${process.env.NEWSLETTER_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ email: email.trim(), source: "helpmehack.com" }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    return NextResponse.json({ message: "Your signup was sent to the newsletter provider." });
  } catch {
    return NextResponse.json({ error: "The newsletter provider is unavailable. Your address was not stored by helpmehack." }, { status: 502 });
  }
}
