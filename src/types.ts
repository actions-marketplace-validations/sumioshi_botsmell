export type Lang = "en" | "pt";

/**
 * Where the text will be read. `chat` (default) also flags Markdown, bullets and
 * emoji used as bullets, which look generated in a chat bubble. `prose` skips them,
 * since documents and emails legitimately use structure.
 */
export type Context = "chat" | "prose";

export type Severity = "block" | "warn";

export interface Hit {
  /** Stable rule id, e.g. `opening_validation`. */
  rule: string;
  /** Language of the rule that matched. */
  lang: Lang | "any";
  /** `block` fails the check on its own; `warn` adds `weight` to the score. */
  severity: Severity;
  weight: number;
  /** The exact text that matched. */
  match: string;
  /** Position of the match in the input. */
  index: number;
  /** What the rule catches, in plain words. */
  message: string;
  /** A positive rewrite hint: what to do instead. */
  suggestion: string;
}

export interface Result {
  /** True when nothing blocks and the score stays below the threshold. */
  ok: boolean;
  score: number;
  threshold: number;
  lang: Lang;
  hits: Hit[];
}

export interface CheckOptions {
  /** Language of the rules. `auto` (default) detects English or Portuguese. */
  lang?: Lang | "auto";
  context?: Context;
  /** Score at which the text fails. Default 4. */
  threshold?: number;
  /** Your previous messages in the same conversation, oldest first. Enables repetition checks. */
  history?: string[];
  /**
   * When the message will be read. Enables the time-of-day greeting check
   * ("good morning" at 3 p.m.). Use together with `timeZone`.
   */
  now?: Date;
  /** IANA time zone of the reader, e.g. `America/New_York`. Default: the system zone. */
  timeZone?: string;
  /** Rule ids to skip. */
  disable?: string[];
}

export interface Rule {
  id: string;
  lang: Lang | "any";
  /** Only runs in these contexts. Default: all. */
  contexts?: Context[];
  severity?: Severity;
  weight: number;
  message: string;
  suggestion: string;
  test: (text: string) => { match: string; index: number } | null;
}
