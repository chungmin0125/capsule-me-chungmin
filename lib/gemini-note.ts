import { GoogleGenAI } from "@google/genai";
import {
  CAPSULE_FINISHES,
  CAPSULE_FORMS,
  CAPSULE_SHAPES,
  fallbackMemory,
  lookFromContents,
  sanitizeLook,
  type CapsuleFinish,
  type CapsuleForm,
  type CapsuleMemory,
  type CapsuleShape,
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
    shape: {
      type: "string",
      enum: [...CAPSULE_SHAPES],
    },
    form: {
      type: "string",
      enum: [...CAPSULE_FORMS],
      description: "캡슐 실루엣. classic, stout, slender, ribbed, faceted, twin",
    },
    finish: {
      type: "string",
      enum: [...CAPSULE_FINISHES],
      description: "봉인 밴드 재질. gold, silver, copper, obsidian",
    },
    from: { type: "string", description: "캡슐 위쪽 색. #RRGGBB" },
    to: { type: "string", description: "캡슐 아래쪽 색. #RRGGBB" },
    accent: { type: "string", description: "뚜껑·장식 색. #RRGGBB" },
  },
  required: ["line", "keywords", "shape", "form", "finish", "from", "to", "accent"],
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
  const suggested = lookFromContents({
    weather: input.weather,
    letter: input.letter,
    recipient: input.recipient,
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: MODEL,
      system_instruction: `너는 타임캡슐 디자이너다. 편지 문장을 그대로 쓰지 말고, 열기 전에도 봐도 되는 힌트만 만든다.
규칙:
- line: 날씨·기온·습도 분위기의 한마디. 편지 내용을 베끼지 말 것.
- keywords: 3~5개, 한 단어. 편지를 열어보기 전에 보고 '아하!' 할 수 있는 주제 힌트. 문장·인용·구체적 비밀은 금지.
- shape: 오늘 날씨에 맞는 sun, rain, cloud, snow, wind, storm, clear 중 하나.
- form: 편지 분위기와 날씨에 맞는 classic, stout, slender, ribbed, faceted, twin 중 하나. 편지마다 다르게.
- finish: gold, silver, copper, obsidian 중 하나. 더우면 copper, 비·눈이면 silver, 맑으면 gold, 폭풍이면 obsidian.
- from/to/accent: 그 날씨·온습도·편지 분위기에 맞는 #RRGGBB. 더우면 따뜻하게, 습하면 탁하게, 추우면 차갑게. 같은 날씨라도 편지마다 색을 조금 다르게.`,
      input: [
        `받는 사람: ${input.recipient || "친구"}`,
        `묻는 날 날씨: ${weatherLine}`,
        `기온: ${input.weather?.temperature ?? "모름"}℃, 습도: ${input.weather?.humidity ?? "모름"}%`,
        `추천 형태: ${suggested.shape} / ${suggested.form} / ${suggested.finish}, 추천색 ${suggested.from} ${suggested.to} ${suggested.accent}`,
        `편지 일부(힌트용, 인용 금지): ${letterExcerpt || "(없음)"}`,
      ].join("\n"),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: MEMORY_SCHEMA,
      },
    });

    const parsed = parseMemoryJson(interaction.output_text);
    if (!parsed) return fallback;

    return {
      line: parsed.line || fallback.line,
      keywords: parsed.keywords.length > 0 ? parsed.keywords : fallback.keywords,
      look: sanitizeLook(
        {
          shape: parsed.shape,
          form: parsed.form,
          finish: parsed.finish,
          from: parsed.from,
          to: parsed.to,
          accent: parsed.accent,
        },
        suggested,
      ),
    };
  } catch (error) {
    console.error("writeCapsuleMemory failed", error);
    return fallback;
  }
}

function parseMemoryJson(raw: string | undefined): {
  line: string;
  keywords: string[];
  shape?: CapsuleShape;
  form?: CapsuleForm;
  finish?: CapsuleFinish;
  from?: string;
  to?: string;
  accent?: string;
} | null {
  if (!raw) return null;
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]) as {
      line?: unknown;
      keywords?: unknown;
      shape?: unknown;
      form?: unknown;
      finish?: unknown;
      from?: unknown;
      to?: unknown;
      accent?: unknown;
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
      shape: typeof data.shape === "string" ? (data.shape as CapsuleShape) : undefined,
      form: typeof data.form === "string" ? (data.form as CapsuleForm) : undefined,
      finish: typeof data.finish === "string" ? (data.finish as CapsuleFinish) : undefined,
      from: typeof data.from === "string" ? data.from : undefined,
      to: typeof data.to === "string" ? data.to : undefined,
      accent: typeof data.accent === "string" ? data.accent : undefined,
    };
  } catch {
    return null;
  }
}
