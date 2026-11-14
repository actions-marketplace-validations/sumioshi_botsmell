import { detectLang, greetingHit, repetitionHits } from "./context.js";
import { en } from "./rules/en.js";
import { pt } from "./rules/pt.js";
import { shared } from "./rules/shared.js";
import type { CheckOptions, Hit, Lang, Result, Rule } from "./types.js";

export type { CheckOptions, Context, Hit, Lang, Result, Rule, Severity } from "./types.js";
export { detectLang } from "./context.js";
export { textFromCommand, textFromHook } from "./hook.js";

export const DEFAULT_THRESHOLD = 4;

const RULES: Record<Lang, Rule[]> = { en: [...en, ...shared], pt: [...pt, ...shared] };

/** Every rule for a language, for docs and tooling. */
export function rules(lang: Lang): readonly Rule[] {
  return RULES[lang];
}

/**
 * Checks a message for signs that it was written by a bot.
 *
 * ```ts
 * const r = check("Great question! I'd be happy to help — let me know if you have any questions.");
 * r.ok    // false
 * r.hits  // opening_validation, em_dash, closing_reflex
 * ```
 */
export function check(text: string, options: CheckOptions = {}): Result {
  const lang: Lang = !options.lang || options.lang === "auto" ? detectLang(text) : options.lang;
  const context = options.context ?? "chat";
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const disabled = new Set(options.disable ?? []);

  const hits: Hit[] = [];
  for (const rule of RULES[lang]) {
    if (disabled.has(rule.id)) continue;
    if (rule.contexts && !rule.contexts.includes(context)) continue;
    const m = rule.test(text);
    if (!m) continue;
    hits.push({
      rule: rule.id,
      lang: rule.lang,
      severity: rule.severity ?? "warn",
      weight: rule.weight,
      match: m.match,
      index: m.index,
      message: rule.message,
      suggestion: rule.suggestion,
    });
  }
  if (options.history?.length) {
    for (const h of repetitionHits(text, options.history, lang)) if (!disabled.has(h.rule)) hits.push(h);
  }
  if (options.now && !disabled.has("greeting_time")) {
    const g = greetingHit(text, lang, options.now, options.timeZone);
    if (g) hits.push(g);
  }

  hits.sort((a, b) => a.index - b.index);
  const score = hits.reduce((s, h) => s + (h.severity === "warn" ? h.weight : 0), 0);
  const blocked = hits.some((h) => h.severity === "block");
  return { ok: !blocked && score < threshold, score, threshold, lang, hits };
}
