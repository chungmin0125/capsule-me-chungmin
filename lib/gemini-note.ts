import { GoogleGenAI } from "@google/genai";
import {
  fallbackMemory,
  lookFromContents,
  type CapsuleMemory,
} from "@/lib/capsule-memory";
import { formatWeatherLine, type WeatherSnapshot } from "@/lib/weather";

const MODEL = "gemini-3.7-flash";

const MEMORY_SCHEMA = {
  type: "object",
  properties: {
    line: {
      type: "string",
      description: "날씨·온습도 분위기의 한마디. 한 문장.",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "편지 주제를 짐작하게 하는 한 단어 힌트 3~5개. 비밀은 말하지 말 것.",
    },
  },
  required: ["line", "keywords"],
};

export async function writeCapsuleMemory(input: {
  recipient: string;
  letter: string;
  weather: WeatherSnapshot | null;
}): Promise<CapsuleMemory> {
  const fallback = fallbackMemory({
    letter: input.letter,
    recipient: input.recipient,
    weather: input.weather,
  });

  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallback;

  const weatherLine = input.weather
    ? formatWeatherLine(input.weather)
    : "날씨 정보 없음";
  const letterExcerpt = input.letter.trim().slice(0, 600);
  const look = lookFromContents({
    weather: input.weather,
    letter: input.letter,
    recipient: input.recipient,
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: MODEL,
      system_instruction: `너는 타임캡슐 힌트를 만든다. 편지 문장을 그대로 쓰지 말고, 열기 전에도 봐도 되는 힌트만 만든다.
규칙:
- line: 날씨·기온·습도 분위기의 한마디. 편지 내용을 베끼지 말 것.
- keywords: 3~5개, 한 단어. 편지를 열어보기 전에 보고 '아하!' 할 수 있는 주제 힌트. 문장·인용·구체적 비밀은 금지.
캡슐 모양·색은 만들지 말 것.`,
      input: [
        `받는 사람: ${input.recipient || "친구"}`,
        `묻는 날 날씨: ${weatherLine}`,
        `기온: ${input.weather?.temperature ?? "모름"}℃, 습도: ${input.weather?.humidity ?? "모름"}%`,
        `편지 일부(힌트용, 인용 금지): ${letterExcerpt || "(없음)"}`,
      ].join("\n"),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: MEMORY_SCHEMA,
      },
    });

    const parsed = parseMemoryJson(interaction.output_text);
    if (!parsed) return { ...fallback, look };

    return {
      line: parsed.line || fallback.line,
      keywords: parsed.keywords.length > 0 ? parsed.keywords : fallback.keywords,
      look,
    };
  } catch (error) {
    console.error("writeCapsuleMemory failed", error);
    return { ...fallback, look };
  }
}

function parseMemoryJson(raw: string | undefined): {
  line: string;
  keywords: string[];
} | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as {
      line?: unknown;
      keywords?: unknown;
    };
    const keywords = Array.isArray(data.keywords)
      ? data.keywords
          .filter((word): word is string => typeof word === "string")
          .map((word) => word.replace(/^#/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];
    return {
      line: typeof data.line === "string" ? data.line.trim().slice(0, 80) : "",
      keywords,
    };
  } catch {
    return null;
  }
}
