export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "ok", service: "helpmehack", timestamp: new Date().toISOString() },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
