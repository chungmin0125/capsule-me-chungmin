const BODY = "google-site-verification: google251949f12a1c72db.html";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(BODY, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
