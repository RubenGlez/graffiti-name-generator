import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assembleCandidate } from "../src/assembler.js";
import { setDataDir } from "../src/loader.js";
import { createRng } from "../src/rng.js";
import { STYLE_IDS } from "../src/types.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(testDir, "..", "..", "data");

describe("assembleCandidate", () => {
  before(() => setDataDir(dataDir));

  it("returns start/end blocks consistent with the core", () => {
    for (const style of STYLE_IDS) {
      const rng = createRng(1234);
      for (let i = 0; i < 200; i += 1) {
        const { core, startBlock, endBlock } = assembleCandidate(style, rng);
        assert.ok(
          core.startsWith(startBlock),
          `${style}: core "${core}" does not start with block "${startBlock}"`,
        );
        if (endBlock !== "") {
          assert.ok(
            core.endsWith(endBlock),
            `${style}: core "${core}" does not end with block "${endBlock}"`,
          );
        }
      }
    }
  });

  it("is deterministic for a fixed seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 50; i += 1) {
      assert.equal(
        assembleCandidate("wildstyle", a).core,
        assembleCandidate("wildstyle", b).core,
      );
    }
  });
});
