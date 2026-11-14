/**
 * Claude Code hook: reads the PreToolUse payload from stdin and pulls out the
 * text an agent is about to publish (commit messages, PR titles and bodies).
 * Exit code 2 blocks the tool call and shows stderr to the agent, which then
 * rewrites the text.
 */

export interface ClaudeHookInput {
  tool_name?: string;
  tool_input?: { command?: string };
}

const TRAILER = /^(?:co-authored-by|signed-off-by|reviewed-by|🤖 generated with)\b.*$/gim;

/** Heredoc bodies (`<<'EOF' … EOF`), which agents use for multi-line messages. */
function heredocs(cmd: string): string[] {
  const out: string[] = [];
  const re = /<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1\b/g;
  for (const m of cmd.matchAll(re)) out.push(m[2] ?? "");
  return out;
}

/** Values of `-m`, `--message`, `--title` and `--body` given as quoted strings. */
function quotedFlags(cmd: string): string[] {
  const out: string[] = [];
  const re = /(?:^|\s)(?:-m|--message|--title|--body|-t|-b)(?:\s+|=)("((?:[^"\\]|\\.)*)"|'([^']*)')/g;
  for (const m of cmd.matchAll(re)) {
    const v = m[2] ?? m[3] ?? "";
    if (!v.startsWith("$(")) out.push(v.replace(/\\"/g, '"').replace(/\\n/g, "\n"));
  }
  return out;
}

/** The text an agent is about to publish with git or gh, or null if the command does not publish any. */
export function textFromCommand(cmd: string): string | null {
  if (!/\bgit\s+(?:commit|tag)\b|\bgh\s+(?:pr|issue|release)\s+(?:create|edit|comment)\b/.test(cmd)) return null;
  const parts = [...heredocs(cmd), ...quotedFlags(cmd)].map((p) => p.replace(TRAILER, "").trim()).filter(Boolean);
  return parts.length ? parts.join("\n\n") : null;
}

export function textFromHook(input: ClaudeHookInput): string | null {
  if (input.tool_name !== "Bash") return null;
  return textFromCommand(input.tool_input?.command ?? "");
}
