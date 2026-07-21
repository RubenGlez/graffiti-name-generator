import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setDataDir } from "../src/loader-node.js";
import {
  checkCandidate,
  hasValidClusters,
  validateAffix,
} from "../src/filters.js";
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
      "D",
      "SK",
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
      "KR",
      "ZE",
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
      "KR",
      "ZE",
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
      "KR",
      "ZE",
      baseOptions,
      style,
      data,
      accepted,
    );

    assert.equal(result.accepted, true);
    assert.equal(result.score, 14);
  });

  it("allows dictionary-word affixes while still applying the blocklist", () => {
    const data = loadData();
    assert.equal(validateAffix("THE", data), true);
    assert.equal(validateAffix("ONE", data), true);
    assert.equal(validateAffix("MC", data), true);
  });
});

describe("hasValidClusters affix boundaries", () => {
  let clusters: Set<string>;

  before(() => {
    setDataDir(dataDir);
    clusters = loadData().clusters;
  });

  it("accepts a clean word (no affix)", () => {
    // KRAZE = KR-A-ZE; only run is KR (approved cluster / onset)
    assert.equal(
      hasValidClusters("KRAZE", "KR", "ZE", true, true, clusters),
      true,
    );
  });

  it("rejects a consonant-ending prefix that forms an unapproved junction", () => {
    // prefix "N" (dirty onset) + KRURK -> run NKR, not a cluster
    assert.equal(
      hasValidClusters("NKRURK", "KR", "RK", false, true, clusters),
      false,
    );
  });

  it("keeps a vowel-ending prefix clean (onset preserved)", () => {
    // prefix "LA" ends in a vowel -> KR is a clean onset cluster
    assert.equal(
      hasValidClusters("LAKRURK", "KR", "RK", true, true, clusters),
      true,
    );
  });

  it("rejects a consonant-starting suffix that forms an unapproved coda", () => {
    // core ...RK + suffix "S" -> run RKS, not a cluster, dirty coda
    assert.equal(
      hasValidClusters("STARKS", "ST", "RK", true, false, clusters),
      false,
    );
  });

  it("accepts a vowel-starting suffix (coda preserved)", () => {
    // suffix "ER" starts with a vowel -> RK stays a clean coda cluster
    assert.equal(
      hasValidClusters("STARKER", "ST", "RK", true, true, clusters),
      true,
    );
  });
});
