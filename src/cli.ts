import { readFileSync } from "node:fs";
import { check } from "./index.js";
import type { CheckOptions, Context, Lang } from "./types.js";

const HELP = `botsmell: lint text for signs that a bot wrote it

Usage
  botsmell "Great question! I'd be happy to help."
  echo "message" | botsmell
  botsmell --file reply.txt --json

Options
  --lang <en|pt|auto>     rules language (default: auto)
  --context <chat|prose>  chat also flags Markdown and bullets (default: chat)
  --threshold <n>         score that fails the check (default: 4)
  --history <file>        your previous messages, one per line, oldest first
  --timezone <iana>       check "good morning" against the current time there
  --file <path>           read the message from a file
  --json                  print the full result as JSON
  -h, --help              show this help

Exit code is 1 when the text smells like a bot, so you can use it in scripts and CI.`;

function parse(argv: string[]) {
  const opts: CheckOptions & { json?: boolean; file?: string; historyFile?: string } = {};
  const words: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      return v;
    };
    if (a === "-h" || a === "--help") {
      console.log(HELP);
      process.exit(0);
    } else if (a === "--json") opts.json = true;
    else if (a === "--lang") opts.lang = next() as Lang | "auto";
    else if (a === "--context") opts.context = next() as Context;
    else if (a === "--threshold") opts.threshold = Number(next());
    else if (a === "--history") opts.historyFile = next();
    else if (a === "--timezone") {
      opts.timeZone = next();
      opts.now = new Date();
    } else if (a === "--file") opts.file = next();
    else words.push(a);
  }
  return { opts, words };
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const { opts, words } = parse(process.argv.slice(2));
  const text = opts.file ? readFileSync(opts.file, "utf8") : words.length ? words.join(" ") : await readStdin();
  if (!text.trim()) {
    console.log(HELP);
    process.exit(2);
  }
  if (opts.historyFile) opts.history = readFileSync(opts.historyFile, "utf8").split(/\r?\n/).filter(Boolean);
  const r = check(text, opts);
  if (opts.json) {
    console.log(JSON.stringify(r, null, 2));
  } else if (!r.hits.length) {
    console.log("✓ no bot smell");
  } else {
    for (const h of r.hits) {
      const tag = h.severity === "block" ? "BLOCK" : `+${h.weight}`;
      console.log(`${tag.padEnd(5)} ${h.rule}  "${h.match}"\n      ${h.message}\n      → ${h.suggestion}`);
    }
    console.log(`\nscore ${r.score}/${r.threshold} · ${r.ok ? "passes" : "smells like a bot"} · lang ${r.lang}`);
  }
  process.exit(r.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(2);
});
