# botsmell

**Lint text for bot smell.** Catch the phrases, punctuation and habits that make an AI-written message read like a bot, before your users see it.

[![npm](https://img.shields.io/npm/v/botsmell.svg)](https://www.npmjs.com/package/botsmell)
[![license](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](./LICENSE)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

<p align="center"><img src="docs/demo.gif" width="760" alt="botsmell flags a typical assistant reply and lets a plain human message through"></p>

Your support agent, chatbot or email assistant can be accurate and still sound like a template: "Certainly!", "I completely understand your frustration", an em dash in every sentence, a bulleted list in a chat bubble, "Hope this helps!". People notice, and trust drops. botsmell checks a message in microseconds with plain rules, so you can **block it, rewrite it or ask the model to try again** before it is sent.

- **Rules, not a model.** Deterministic and fast. No API key, no network, zero dependencies.
- **Every hit comes with a fix.** A positive suggestion you can feed back to the LLM ("open with the answer"), which works better than telling it what not to say.
- **English and Portuguese**, detected automatically.
- **Context-aware.** Remembers your previous messages to catch repeated openings and duplicates, and checks "good morning" against the reader's clock.

## Install

```bash
npm install botsmell
```

## Use it in code

```ts
import { check } from "botsmell";

const draft = "Certainly! I've updated the invoice, ensuring the totals are correct.";
const r = check(draft);

if (!r.ok) {
  // Ask the model to rewrite, using the suggestions
  const feedback = r.hits.map((h) => `- "${h.match}": ${h.suggestion}`).join("\n");
  // → "- "Certainly!": Open with the answer or the fact."
  //   "- ", ensuring": End the sentence, then state the effect as a new sentence…"
}
```

`check(text, options)` returns:

```ts
{
  ok: boolean,        // false if anything blocks or score >= threshold
  score: number,      // sum of the weights of the hits
  threshold: number,  // default 4
  lang: "en" | "pt",
  hits: [{ rule, severity, weight, match, index, message, suggestion }]
}
```

### Options

| Option | Default | What it does |
|---|---|---|
| `lang` | `"auto"` | `"en"`, `"pt"` or `"auto"` |
| `context` | `"chat"` | `"chat"` also flags Markdown, bullets and emoji bullets. Use `"prose"` for emails and docs |
| `threshold` | `4` | Score at which the check fails |
| `history` | none | Your previous messages in the conversation, oldest first. Flags a repeated message (blocks) and a repeated opening |
| `now`, `timeZone` | none | When the message will be read and the reader's IANA zone. Flags "good morning" at 3 p.m. |
| `disable` | `[]` | Rule ids to skip |

### A guard before sending

```ts
async function sendReply(chatId: string, draft: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = check(draft, { history: await lastMessagesFromMe(chatId), now: new Date(), timeZone: "America/New_York" });
    if (r.ok) return send(chatId, draft);
    draft = await llm.rewrite(draft, r.hits.map((h) => h.suggestion));
  }
  return queueForHumanReview(chatId, draft);
}
```

## Block bot-sounding commits in Claude Code

Coding agents love em dashes, "seamless" and "ensuring that". Add botsmell as a `PreToolUse` hook and Claude Code gets its commit messages and PR text checked before they are published. When the text smells like a bot, the hook blocks the command and tells the agent what to rewrite.

```jsonc
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      { "matcher": "Bash", "hooks": [{ "type": "command", "command": "npx -y botsmell --claude-hook" }] }
    ]
  }
}
```

It reads `git commit`, `git tag` and `gh pr|issue|release create|edit|comment`, including heredoc messages, ignores trailers like `Co-Authored-By`, and lets every other command through.

## Check pull requests with GitHub Actions

```yaml
# .github/workflows/botsmell.yml
name: botsmell
on: pull_request
jobs:
  smell:
    runs-on: ubuntu-latest
    steps:
      - uses: sumioshi/botsmell@v0
```

By default it checks the PR title and body. Use `with: { file: CHANGELOG.md }` or `with: { text: "..." }` for anything else, plus `lang`, `context` and `threshold`.

## Use it from the command line

```bash
npx botsmell "your message"
echo "your message" | npx botsmell
npx botsmell --file reply.txt --context prose --json
```

The exit code is `1` when the text smells like a bot, so it works in scripts, git hooks and CI (for example, to test the outputs of a prompt before shipping it).

## Rules

### English

| Rule | Weight | Catches |
|---|---|---|
| `opening_validation` | +2 | Opens by praising the question or announcing eagerness to help ("Great question!", "I'd be happy to") |
| `read_receipt_opening` | +2 | Opens by confirming you read the message ("Thanks for reaching out!") |
| `closing_reflex` | +2 | Stock closing ("Let me know if you have any questions", "Hope this helps") |
| `hope_finds_you_well` | +2 | Template pleasantry |
| `canned_empathy` | +2 | Scripted empathy ("I completely understand your frustration", "Rest assured") |
| `ai_disclaimer` | block | Assistant boilerplate ("As an AI language model") |
| `ai_vocabulary` | +2 | Words models overuse: delve, tapestry, seamless, leverage, robust, pivotal… |
| `ing_tail` | +2 | Padded -ing clause (", ensuring that…", ", highlighting…") |
| `not_only_but_also` | +2 | "Not only X but also Y" |
| `not_x_its_y` | +2 | "It's not X, it's Y" |
| `rule_of_three` | +1 | Three-item rhythm ("fast, light and clean") |
| `colon_intro` | +1 | "Here's the thing: …" (ignores times, URLs and labels like `e.g.:`) |
| `confession` | +3 | Self-blame or over-apology in a professional message |
| `accident_story` | +2 | Narrates an accident instead of the impact ("I accidentally…") |
| `drama` | +2 | Dramatizes the problem ("huge issue", "luckily") |
| `hedge` | +1 | Minimizers ("I think", "just wanted to", "tiny issue") |
| `repeated_apology` | +2 | More than one apology in a message |
| `no_without_alternative` | +1 | Says no without offering what is possible |

### Portuguese

`validacao_abertura`, `recibo_abertura`, `fechamento_reflexo`, `vocabulario_ia`, `gerundio_profundidade`, `nao_so_mas`, `nao_e_x_e_y`, `triade`, `dois_pontos_intro`, `confissao`, `narrativa_acidente`, `drama`, `hedge`, `desculpa_repetida`, `nao_sem_alternativa`. Same ideas, written for Brazilian Portuguese chat ("Ótima pergunta!", "fico à disposição", "garantindo que…", "acabei derrubando…").

### Both languages

| Rule | Weight | Catches |
|---|---|---|
| `em_dash` | +2 | Em dash or spaced hyphen between clauses |
| `markdown` | +2 | Bold, headings or inline code in a chat message (chat only) |
| `bullets` | +2 | Bulleted or numbered list in a chat message (chat only) |
| `emoji_bullet` | +1 | Emoji used as a bullet (chat only) |
| `repeated_message` | block | Same text as one of your previous messages (needs `history`) |
| `same_opening` | +2 | Same first words as a recent message (needs `history`) |
| `greeting_time` | +3 | "Good morning" / "bom dia" at the wrong time for the reader (needs `now`) |

Why these rules: [The tells that make AI text read like a bot](https://wacrew.com.br/en/ai-text-tells/).

## What it is not

botsmell is not an AI detector and does not tell you who wrote a text. It flags **habits** that make a message read like a template, whoever wrote it. A human can trip a rule and a model can pass them all. Use it to make your bot's messages better, not to judge people.

## Where it comes from

botsmell was extracted from [**WACrew**](https://github.com/sumioshi/wacrew), an open-source WhatsApp AI agent where every reply goes through this review before it is delivered at a human pace. The Portuguese rules come from that review and were tuned on real chat history so they rarely flag messages a person wrote by hand.

If your agent talks to people on WhatsApp, take a look at [WACrew](https://wacrew.com.br/en/).

## Contributing

New rules are welcome, especially for other languages. A good rule has a clear pattern, a low false-positive rate on human messages, and a positive suggestion. Add tests with examples that should and should not match.

```bash
npm install
npm test
```

## License

Apache 2.0 © [Rodrigo Sumioshi](https://rodrigosumioshi.com)
