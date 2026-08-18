import { writeCapsuleMemory } from "@/lib/gemini-note";
import { weatherFromUnknown } from "@/lib/weather";

export async function POST(request: Request) {
  let body: {
    recipient?: string;
    letter?: string;
    weather?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청이 올바르지 않아요." }, { status: 400 });
  }

  try {
    const memory = await writeCapsuleMemory({
      recipient: typeof body.recipient === "string" ? body.recipient : "",
      letter: typeof body.letter === "string" ? body.letter : "",
      weather: weatherFromUnknown(body.weather),
    });
    return Response.json({ memory });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캡슐 기억을 만들지 못했어요.";
    return Response.json({ error: message }, { status: 502 });
  }
}
