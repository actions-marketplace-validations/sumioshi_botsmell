import type { Rule } from "../types.js";

/** Builds a `test` from a regex: first match and its position, or null. */
export function re(pattern: RegExp): Rule["test"] {
  const flags = pattern.flags.replace("g", "");
  const once = new RegExp(pattern.source, flags);
  return (text) => {
    const m = once.exec(text);
    return m ? { match: m[0].trim(), index: m.index } : null;
  };
}

/** Matches `pattern` only when `unless` does not appear anywhere in the text. */
export function reUnless(pattern: RegExp, unless: RegExp): Rule["test"] {
  const base = re(pattern);
  return (text) => (unless.test(text) ? null : base(text));
}

/** Fires when `pattern` appears at least `min` times. */
export function reAtLeast(pattern: RegExp, min: number): Rule["test"] {
  const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  return (text) => {
    const all = [...text.matchAll(global)];
    if (all.length < min) return null;
    const first = all[0];
    return { match: all.map((m) => m[0]).join(" … "), index: first?.index ?? 0 };
  };
}
