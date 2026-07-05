import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setDataDir } from "../src/loader.js";
import { checkCandidate, validateAffix } from "../src/filters.js";
import { loadData, getStyle } from "../src/loader.js";
import type { NormalizedOptions } from "../src/types.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(testDir, "..", "..", "data");

const baseOptions: NormalizedOptions = {
  minLength: 3,
  maxLength: 12,
  count: 1,
  pronounceable: true,
  preferredLetters: "",
  forbiddenLetters: "",
  prefix: "",
  suffix: "",
  style: "old-school",
  seed: 1,
};

describe("filters", () => {
  before(() => {
    setDataDir(dataDir);
  });

  it("rejects dictionary words", () => {
    const data = loadData();
    const style = getStyle("old-school");
    const accepted = new Set<string>();

    const result = checkCandidate(
      "DESK",
      "DESK",
      "CVC",
      baseOptions,
      style,
      data,
      accepted,
    );

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "dictionary");
  });

  it("rejects forbidden letters", () => {
    const data = loadData();
    const style = getStyle("old-school");
    const accepted = new Set<string>();

    const result = checkCandidate(
      "KRAZE",
      "KRAZE",
      "CCVC",
      { ...baseOptions, forbiddenLetters: "Z" },
      style,
      data,
      accepted,
    );

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "forbidden");
  });

  it("rejects duplicates in batch", () => {
    const data = loadData();
    const style = getStyle("old-school");
    const accepted = new Set<string>(["KRAZE"]);

    const result = checkCandidate(
      "KRAZE",
      "KRAZE",
      "CCVC",
      baseOptions,
      style,
      data,
      accepted,
    );

    assert.equal(result.accepted, false);
    assert.equal(result.reason, "duplicate");
  });

  it("accepts valid graffiti-style names", () => {
    const data = loadData();
    const style = getStyle("old-school");
    const accepted = new Set<string>();

    const result = checkCandidate(
      "KRAZE",
      "KRAZE",
      "CCVC",
      baseOptions,
      style,
      data,
      accepted,
    );

    assert.equal(result.accepted, true);
    assert.equal(result.score, 14);
  });

  it("validates affix against dictionary", () => {
    const data = loadData();
    assert.equal(validateAffix("THE", data), false);
    assert.equal(validateAffix("MC", data), true);
  });
});
