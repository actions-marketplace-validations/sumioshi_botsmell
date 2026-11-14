import type { Rule } from "../types.js";
import { re } from "./util.js";

/** Rules that read the same in any language. */
export const shared: Rule[] = [
  {
    id: "em_dash",
    lang: "any",
    weight: 2,
    message: "Em dash or spaced hyphen joining two clauses, the most common sign of generated text.",
    suggestion: "Use a comma, a period or a new message.",
    test: re(/[—–]|(?<=\p{L})\s-\s(?=\p{L})/u),
  },
  {
    id: "markdown",
    lang: "any",
    contexts: ["chat"],
    weight: 2,
    message: "Markdown formatting (bold, headings, inline code) in a chat message.",
    suggestion: "Plain text. Chat apps show the asterisks as they are.",
    test: re(/\*\*[^*\n]+\*\*|^#{1,6}\s|`[^`\n]+`/m),
  },
  {
    id: "bullets",
    lang: "any",
    contexts: ["chat"],
    weight: 2,
    message: "A bulleted or numbered list in a chat message.",
    suggestion: "One point per message, or a short sentence.",
    test: re(/^\s*(?:[-•*]|\d+[.)])\s/m),
  },
  {
    id: "emoji_bullet",
    lang: "any",
    contexts: ["chat"],
    weight: 1,
    message: "Emoji used as a bullet at the start of a line.",
    suggestion: "Emoji as a reaction at the end of a message, if at all.",
    test: re(/^\s*\p{Extended_Pictographic}/mu),
  },
];
