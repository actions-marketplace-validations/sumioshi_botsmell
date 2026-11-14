import type { Rule } from "../types.js";
import { re, reAtLeast, reUnless } from "./util.js";

const TECH_LABEL = /(^|\s)(e\.?g|i\.?e|ps|p\.s|note|ex|url|id|email|e-mail|time|date|ref|tl;?dr|(?:feat|fix|chore|docs|refactor|test|perf|ci|build|style|revert)(?:\([^)]*\))?!?)\s*:/gi;
const COLON_INTRO = /(?<!\d)(?<!https?):(?!\d|\/\/)\s*(\n|\p{L})/u;

export const en: Rule[] = [
  {
    id: "opening_validation",
    lang: "en",
    weight: 2,
    message: "Opens by praising the question or announcing eagerness to help.",
    suggestion: "Open with the answer or the fact.",
    test: re(
      /^\s*(?:(?:great|good|excellent|fantastic) (?:question|point|catch)|certainly[!,.]|(?:absolutely|of course|sure thing|definitely)!|i'?d be (?:happy|glad|delighted) to|happy to help|what a great)/i,
    ),
  },
  {
    id: "read_receipt_opening",
    lang: "en",
    weight: 2,
    message: "Opens by confirming you read or received the message before saying anything.",
    suggestion: "Start with what you did or the answer; replying already shows you read it.",
    test: re(
      /^\s*(?:(?:hi|hey|hello)\b[^\n]{0,25}?[,!.]?\s+)?(?:thanks? (?:you )?for (?:reaching out|your (?:message|email|question|patience))|i (?:got|received|saw|read) (?:your|the) (?:message|email|question|request|note) (?:about|regarding|on)\b)/i,
    ),
  },
  {
    id: "closing_reflex",
    lang: "en",
    weight: 2,
    message: "Stock closing line offering more help.",
    suggestion: "End on the fact or on one concrete question.",
    test: re(
      /let me know if (?:you have|there(?:'s| is| are)) any (?:other |more |further )?(?:questions?|thing)|feel free to (?:reach out|ask|let me know)|(?:i )?hope (?:this|that) helps|don'?t hesitate to|is there anything else|happy to help with anything else/i,
    ),
  },
  {
    id: "hope_finds_you_well",
    lang: "en",
    weight: 2,
    message: "Template pleasantry.",
    suggestion: "Skip it and say why you are writing.",
    test: re(/i hope (?:this|my) (?:message|email|note) finds you well/i),
  },
  {
    id: "canned_empathy",
    lang: "en",
    weight: 2,
    message: "Scripted empathy line from a support template.",
    suggestion: "Acknowledge the specific problem in one short clause, then give the fix or the next step.",
    test: re(/\b(?:i (?:completely |totally |fully )?understand (?:your|how) (?:frustrat|concern|feel)\w*|rest assured|i (?:sincerely )?appreciate your (?:patience|understanding)|(?:we|our team) (?:is|are) (?:working )?diligently)\b/i),
  },
  {
    id: "ai_disclaimer",
    lang: "en",
    severity: "block",
    weight: 0,
    message: "AI assistant boilerplate leaked into the message.",
    suggestion: "Remove the sentence and answer directly.",
    test: re(/\bas an ai(?: language model| assistant)?\b|\bi (?:don'?t|do not) have (?:personal (?:opinions|experiences)|real-time access)|\bmy (?:knowledge|training) (?:cutoff|data)\b/i),
  },
  {
    id: "ai_vocabulary",
    lang: "en",
    weight: 2,
    message: "Words that language models overuse.",
    suggestion: "Use the plain word: improve, use, check, help, part, area.",
    test: re(
      /\b(?:delv(?:e|es|ing)|tapestry|testament to|seamless(?:ly)?|leverag(?:e|es|ed|ing)|robust|elevat(?:e|es|ing)|unlock(?:s|ing)? the|navigat(?:e|ing) the (?:complex|ever)|landscape|realm|pivotal|crucial|furthermore|moreover|in conclusion|it'?s worth noting|it'?s important to (?:note|remember)|embark(?:s|ing)? on|foster(?:s|ing)?|streamlin(?:e|es|ing)|cutting-edge|game[- ]changer|holistic|synerg(?:y|ies)|paradigm|meticulous(?:ly)?|commendable|ever-evolving|in today'?s (?:fast-paced|digital)|a myriad of|plethora)\b/i,
    ),
  },
  {
    id: "ing_tail",
    lang: "en",
    weight: 2,
    message: "Sentence padded with a trailing -ing clause that adds fake depth.",
    suggestion: "End the sentence, then state the effect as a new sentence with a direct verb.",
    test: re(/,\s+(?:ensuring|highlighting|underscoring|showcasing|fostering|enhancing|emphasizing|reflecting|paving the way|contributing to|allowing for)\b/i),
  },
  {
    id: "not_only_but_also",
    lang: "en",
    weight: 2,
    message: "\"Not only X but also Y\" construction.",
    suggestion: "State the second part directly.",
    test: re(/\bnot (?:only|just|merely)\b[^.!?\n]{0,60}\bbut(?: also)?\b/i),
  },
  {
    id: "not_x_its_y",
    lang: "en",
    weight: 2,
    message: "\"It's not X, it's Y\" reframe.",
    suggestion: "Say what it is.",
    test: re(/\b(?:it'?s|this is|that'?s|it is) not (?:just |only |about |simply )?[^,.!?\n]{2,40}[,;—–-]\s*(?:it'?s|it is|but)\b/i),
  },
  {
    id: "rule_of_three",
    lang: "en",
    weight: 1,
    message: "Short list of exactly three items, a common generated rhythm.",
    suggestion: "Two items, or one per sentence.",
    test: re(/\b[a-z]+(?: [a-z]+)?, [a-z]+(?: [a-z]+)?,? and [a-z]+(?: [a-z]+)?\b/i),
  },
  {
    id: "colon_intro",
    lang: "en",
    weight: 1,
    message: "Colon introducing the point (\"Here's the thing: ...\").",
    suggestion: "Use a comma or a period, or split into two messages.",
    test: (text) => {
      const clean = text.replace(TECH_LABEL, "$1");
      const m = COLON_INTRO.exec(clean);
      return m ? { match: clean.slice(Math.max(0, m.index - 20), m.index + 1).trim(), index: m.index } : null;
    },
  },
  {
    id: "confession",
    lang: "en",
    weight: 3,
    message: "Self-blame or over-apology in a professional message.",
    suggestion: "State what happened and the fix: \"X was not being counted; it is now.\"",
    test: re(
      /\b(?:my bad|my fault|my mistake|i messed up|i screwed up|that'?s on me|i dropped the ball|sorry for the (?:inconvenience|confusion|trouble)|i (?:sincerely )?apologi[sz]e for (?:any|the) (?:inconvenience|confusion))\b/i,
    ),
  },
  {
    id: "accident_story",
    lang: "en",
    weight: 2,
    message: "Narrates intent or an accident instead of the impact.",
    suggestion: "Say what changed in the system and what you did.",
    test: re(/\b(?:accidentally|by accident|i forgot to|i missed that|slipped through|i didn'?t notice|i (?:just )?broke)\b/i),
  },
  {
    id: "drama",
    lang: "en",
    weight: 2,
    message: "Dramatizes the problem.",
    suggestion: "Give the number and the scope, without adjectives.",
    test: re(/\b(?:the most serious|the worst (?:part|one)|huge (?:issue|problem)|disaster|close call|luckily|fortunately (?:we|i)|could have been (?:bad|worse))\b/i),
  },
  {
    id: "hedge",
    lang: "en",
    weight: 1,
    message: "Hedge or minimizer that weakens the message.",
    suggestion: "Say the checked fact.",
    test: re(/\b(?:i think|i believe|kind of|sort of|just wanted to|quick question|sorry to bother|i'?ll try to|if that makes sense|(?:tiny|little|small) (?:issue|bug|change|thing))\b/i),
  },
  {
    id: "repeated_apology",
    lang: "en",
    weight: 2,
    message: "More than one apology in the same message.",
    suggestion: "One apology at most, short, after the facts.",
    test: reAtLeast(/\b(?:sorry|apologi[sz]e|apologies)\b/i, 2),
  },
  {
    id: "no_without_alternative",
    lang: "en",
    weight: 1,
    message: "Says no without offering what is possible.",
    suggestion: "Say what you can do and when.",
    test: reUnless(/\b(?:i can'?t|i cannot|we can'?t|we cannot|not possible|unable to)\b/i, /\b(?:but|instead|however|tomorrow|later|next week|by (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b/i),
  },
];
