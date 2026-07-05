import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreName, applyPreferredPenalty, getThreshold } from "../src/scorer.js";

describe("scoreName", () => {
  it("scores KRAZE at +10", () => {
    assert.equal(scoreName("KRAZE"), 10);
  });

  it("scores SKONE at +5", () => {
    assert.equal(scoreName("SKONE"), 5);
  });

  it("scores VESK at +5", () => {
    assert.equal(scoreName("VESK"), 5);
  });

  it("rejects AIOU pattern via negative score", () => {
    assert.equal(scoreName("AIOU"), -5);
  });

  it("scores STRNK below threshold", () => {
    assert.equal(scoreName("STRNK"), -3);
  });

  it("scores BRRRK below threshold", () => {
    assert.equal(scoreName("BRRRK"), -3);
  });

  it("applies style bonus letters", () => {
    const score = scoreName("KRAZE", { bonusLetters: ["K", "Z"] });
    assert.equal(score, 12);
  });
});

describe("applyPreferredPenalty", () => {
  it("penalizes when no preferred letter present", () => {
    assert.equal(applyPreferredPenalty("VESK", "KZ", 5), 5);
    assert.equal(applyPreferredPenalty("MARE", "KZ", 0), -2);
  });
});

describe("getThreshold", () => {
  it("defaults to 0", () => {
    assert.equal(getThreshold(), 0);
  });
});
