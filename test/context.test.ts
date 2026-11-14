import { describe, expect, it } from "vitest";
import { check, detectLang } from "../src/index.js";

describe("language detection", () => {
  it("tells English from Portuguese", () => {
    expect(detectLang("I pushed the fix, can you test it?")).toBe("en");
    expect(detectLang("subi o ajuste, consegue testar agora?")).toBe("pt");
    expect(detectLang("não deu certo")).toBe("pt");
  });
});

describe("context", () => {
  it("chat flags Markdown and bullets, prose does not", () => {
    const t = "**Update**\n- item one\n- item two";
    expect(check(t, { lang: "en", context: "chat" }).hits.map((h) => h.rule)).toEqual(expect.arrayContaining(["markdown", "bullets"]));
    expect(check(t, { lang: "en", context: "prose" }).hits.map((h) => h.rule)).not.toContain("bullets");
  });

  it("disable skips rules", () => {
    expect(check("ok — done", { lang: "en", disable: ["em_dash"] }).hits).toEqual([]);
  });
});

describe("history", () => {
  it("blocks a message identical to a previous one", () => {
    const r = check("Pushed the fix!", { lang: "en", history: ["pushed the fix"] });
    expect(r.ok).toBe(false);
    expect(r.hits[0]?.rule).toBe("repeated_message");
  });

  it("warns when the opening repeats", () => {
    const r = check("Pushed it, check the export", { lang: "en", history: ["Pushed it to staging"] });
    expect(r.hits.map((h) => h.rule)).toContain("same_opening");
  });
});

describe("greeting vs. time of day", () => {
  const at = (iso: string) => new Date(iso);

  it("flags good morning in the afternoon", () => {
    const r = check("Good morning! The report is ready", { lang: "en", now: at("2026-11-14T15:00:00Z"), timeZone: "UTC" });
    expect(r.hits.map((h) => h.rule)).toContain("greeting_time");
  });

  it("accepts both greetings near the change", () => {
    const r = check("Good morning, quick update", { lang: "en", now: at("2026-11-14T12:10:00Z"), timeZone: "UTC" });
    expect(r.hits.map((h) => h.rule)).not.toContain("greeting_time");
  });

  it("works in Portuguese with the reader's zone", () => {
    const r = check("Bom dia! subi o ajuste", { lang: "pt", now: at("2026-11-14T18:00:00Z"), timeZone: "America/Sao_Paulo" });
    expect(r.hits.map((h) => h.rule)).toContain("greeting_time");
  });
});

describe("scoring", () => {
  it("passes below the threshold and fails at it", () => {
    expect(check("I think it works", { lang: "en" }).ok).toBe(true);
    expect(check("Certainly! Hope this helps", { lang: "en" }).ok).toBe(false);
    expect(check("Certainly! Hope this helps", { lang: "en", threshold: 10 }).ok).toBe(true);
  });
});
