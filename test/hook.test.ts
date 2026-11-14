import { describe, expect, it } from "vitest";
import { textFromCommand, textFromHook } from "../src/index.js";

describe("claude code hook", () => {
  it("reads a heredoc commit message and drops trailers", () => {
    const cmd = `git commit -m "$(cat <<'EOF'\nfeat: seamless login — ensuring tokens refresh\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)"`;
    expect(textFromCommand(cmd)).toBe("feat: seamless login — ensuring tokens refresh");
  });

  it("reads -m and gh pr flags", () => {
    expect(textFromCommand('git commit -m "fix: totals"')).toBe("fix: totals");
    expect(textFromCommand(`gh pr create --title 'Add export' --body 'Adds CSV export'`)).toBe("Add export\n\nAdds CSV export");
  });

  it("ignores commands that publish nothing", () => {
    expect(textFromCommand("git status")).toBeNull();
    expect(textFromCommand("npm test")).toBeNull();
    expect(textFromHook({ tool_name: "Edit", tool_input: {} })).toBeNull();
  });
});

import { check } from "../src/index.js";
describe("conventional commit prefixes", () => {
  it("do not count as a colon intro", () => {
    expect(check("fix(api): totals match after cache reset", { lang: "en" }).hits).toEqual([]);
    expect(check("feat!: drop node 16", { lang: "en" }).hits).toEqual([]);
  });
});
