import { describe, expect, it } from "vitest";
import { check } from "../src/index.js";

const rules = (t: string, o = {}) => check(t, { lang: "en", ...o }).hits.map((h) => h.rule);

describe("english rules", () => {
  it("catches the classic assistant reply", () => {
    const r = check("Great question! I'd be happy to help — here's what you need. Let me know if you have any questions.", { lang: "en" });
    expect(r.ok).toBe(false);
    expect(r.hits.map((h) => h.rule)).toEqual(expect.arrayContaining(["opening_validation", "em_dash", "closing_reflex"]));
  });

  it("lets a plain human reply through", () => {
    const r = check("Pushed the fix, the totals match now. Can you test the export again?", { lang: "en" });
    expect(r.hits).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("opening validation and read receipts", () => {
    expect(rules("Certainly! The deploy is done")).toContain("opening_validation");
    expect(rules("Absolutely, will do")).not.toContain("opening_validation");
    expect(rules("Thanks for reaching out! The invoice is attached")).toContain("read_receipt_opening");
    expect(rules("I got your message about the invoice, sending it now")).toContain("read_receipt_opening");
    expect(rules("Got it")).not.toContain("read_receipt_opening");
  });

  it("closings and pleasantries", () => {
    expect(rules("Done. Hope this helps!")).toContain("closing_reflex");
    expect(rules("Feel free to reach out anytime")).toContain("closing_reflex");
    expect(rules("I hope this email finds you well")).toContain("hope_finds_you_well");
  });

  it("assistant boilerplate blocks on its own", () => {
    const r = check("As an AI language model, I can't browse the web.", { lang: "en" });
    expect(r.ok).toBe(false);
    expect(r.hits.find((h) => h.rule === "ai_disclaimer")?.severity).toBe("block");
  });

  it("vocabulary and padded -ing tails", () => {
    expect(rules("Let's delve into the data")).toContain("ai_vocabulary");
    expect(rules("We shipped it, ensuring the totals match")).toContain("ing_tail");
    expect(rules("We shipped it and the totals match")).not.toContain("ing_tail");
  });

  it("rhetorical constructions", () => {
    expect(rules("It's not just a tool, it's a mindset")).toContain("not_x_its_y");
    expect(rules("It fixes not only the total but also the column")).toContain("not_only_but_also");
    expect(rules("fast, light and clean")).toContain("rule_of_three");
  });

  it("colon intros, but not times, URLs or labels", () => {
    expect(rules("Here's the thing: the cache was stale")).toContain("colon_intro");
    expect(rules("Call at 10:30 tomorrow")).not.toContain("colon_intro");
    expect(rules("See https://example.com/x")).not.toContain("colon_intro");
    expect(rules("e.g: the export page")).not.toContain("colon_intro");
  });

  it("blame, drama and hedges", () => {
    expect(rules("My bad, I forgot to deploy")).toEqual(expect.arrayContaining(["confession", "accident_story"]));
    expect(rules("Luckily we caught it")).toContain("drama");
    expect(rules("I think it works now")).toContain("hedge");
    expect(rules("Sorry for the delay, sorry again")).toContain("repeated_apology");
  });

  it("no without an alternative", () => {
    expect(rules("I can't do that")).toContain("no_without_alternative");
    expect(rules("I can't do it today, but tomorrow morning works")).not.toContain("no_without_alternative");
  });
});

describe("support templates", () => {
  it("canned empathy", () => {
    const r = check("I completely understand your frustration. Rest assured, we will fix it.", { lang: "en" });
    expect(r.hits.map((h) => h.rule)).toContain("canned_empathy");
  });
});
