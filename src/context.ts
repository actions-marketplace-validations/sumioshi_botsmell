import type { Hit, Lang } from "./types.js";

// ---------------------------------------------------------------- language

const EN = new Set("the and you your is are to of it that this for with have be not we i was what can will".split(" "));
const PT = new Set("o a os as de do da que não nao você voce é pra para com um uma no na isso tá ta vou já".split(" "));

/** Guesses English or Portuguese from common words. Ties go to English. */
export function detectLang(text: string): Lang {
  let en = 0;
  let pt = 0;
  for (const w of text.toLowerCase().match(/[\p{L}']+/gu) ?? []) {
    if (EN.has(w)) en++;
    if (PT.has(w)) pt++;
  }
  if (/[ãõçáéíóúâêô]/i.test(text)) pt += 2;
  return pt > en ? "pt" : "en";
}

// ---------------------------------------------------------------- repetition

const norm = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
const firstWords = (t: string, n: number) => norm(t).split(" ").slice(0, n).join(" ");

const MSG = {
  en: {
    repeated: ["Same text as one of your previous messages.", "Say what is new since then."],
    opening: ["Opens the same way as one of your last messages.", "Change the opening or go straight to the point."],
  },
  pt: {
    repeated: ["Mesmo texto de uma mensagem anterior sua.", "Diga o que mudou desde então."],
    opening: ["Abre igual a uma das suas últimas mensagens.", "Troque a abertura ou vá direto ao ponto."],
  },
} as const;

/** Compares the message with your own recent messages in the same conversation. */
export function repetitionHits(text: string, history: string[], lang: Lang): Hit[] {
  const out: Hit[] = [];
  const t = norm(text);
  if (!t) return out;
  const m = MSG[lang];
  if (history.some((h) => norm(h) === t)) {
    out.push({ rule: "repeated_message", lang: "any", severity: "block", weight: 0, match: text.trim(), index: 0, message: m.repeated[0], suggestion: m.repeated[1] });
    return out;
  }
  const recent = history.slice(-3);
  const open2 = firstWords(text, 2);
  if (open2.split(" ").length === 2 && recent.some((h) => firstWords(h, 2) === open2)) {
    out.push({ rule: "same_opening", lang: "any", severity: "warn", weight: 2, match: open2, index: 0, message: m.opening[0], suggestion: m.opening[1] });
  }
  return out;
}

// ---------------------------------------------------------------- greeting vs. time of day

type Period = "morning" | "afternoon" | "evening";
const GREETING: Record<Lang, RegExp> = {
  en: /(?<![\p{L}])good\s+(morning|afternoon|evening)(?![\p{L}])/iu,
  pt: /(?<![\p{L}\d])(?:(bom\s*dia+)|(boa\s*tarde+)|(boa\s*noit(?:e+|inha)))(?![\p{L}\d])/iu,
};
const LABEL: Record<Lang, Record<Period, string>> = {
  en: { morning: "good morning", afternoon: "good afternoon", evening: "good evening" },
  pt: { morning: "bom dia", afternoon: "boa tarde", evening: "boa noite" },
};
/** Minutes around each change (5:00, 12:00, 18:00) where both greetings are fine. */
const GRACE = 30;

function minuteOfDay(now: Date, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function periodsAllowed(min: number): Set<Period> {
  const at = (m: number): Period => (m >= 300 && m < 720 ? "morning" : m >= 720 && m < 1080 ? "afternoon" : "evening");
  return new Set([at(min), at((min + GRACE) % 1440), at((min - GRACE + 1440) % 1440)]);
}

/** Flags a time-of-day greeting that does not match when the message will be read. */
export function greetingHit(text: string, lang: Lang, now: Date, timeZone?: string): Hit | null {
  const m = GREETING[lang].exec(text);
  if (!m) return null;
  let used: Period;
  if (lang === "en") used = (m[1] ?? "").toLowerCase() as Period;
  else used = m[1] ? "morning" : m[2] ? "afternoon" : "evening";
  const min = minuteOfDay(now, timeZone);
  const allowed = periodsAllowed(min);
  if (allowed.has(used)) return null;
  const right = [...allowed][0] as Period;
  const hhmm = `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
  return lang === "en"
    ? { rule: "greeting_time", lang, severity: "warn", weight: 3, match: m[0], index: m.index, message: `"${m[0]}" but it is ${hhmm} for the reader.`, suggestion: `Use "${LABEL.en[right]}" or a neutral "hi".` }
    : { rule: "greeting_time", lang, severity: "warn", weight: 3, match: m[0], index: m.index, message: `"${m[0]}" mas são ${hhmm} para quem lê.`, suggestion: `Use "${LABEL.pt[right]}" ou um "opa" neutro.` };
}
