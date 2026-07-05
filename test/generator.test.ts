import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "../src/generator.js";
import { setDataDir } from "../src/loader.js";
import { normalizeOptions } from "../src/options.js";
import { InvalidOptionsError } from "../src/types.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(testDir, "..", "..", "data");

describe("generator", () => {
  before(() => {
    setDataDir(dataDir);
  });

  it("is deterministic with a fixed seed", () => {
    const options = {
      style: "old-school" as const,
      count: 5,
      minLength: 4,
      maxLength: 8,
      seed: 42,
    };

    const first = generate(options);
    const second = generate(options);

    assert.deepEqual(
      first.names.map((n) => n.name),
      second.names.map((n) => n.name),
    );
  });

  it("returns golden output for seed 42", () => {
    const result = generate({
      style: "old-school",
      count: 5,
      minLength: 4,
      maxLength: 8,
      seed: 42,
    });

    assert.equal(result.names.length, 5);
    assert.equal(result.meta.exhausted, false);
    assert.equal(result.meta.seed, 42);

    assert.deepEqual(
       result.names.map((n) => n.name),
      ["TREREX", "TROM", "SKAK", "DRAK", "KRIZE"],
     );
  });

  it("respects min and max length", () => {
    const result = generate({
      style: "modern",
      count: 20,
      minLength: 4,
      maxLength: 6,
      seed: 99,
    });

    for (const entry of result.names) {
      assert.ok(entry.name.length >= 4);
      assert.ok(entry.name.length <= 6);
    }
  });

  it("applies prefix and suffix", () => {
    const result = generate({
      style: "old-school",
      count: 3,
      minLength: 6,
      maxLength: 10,
      prefix: "MC",
      seed: 7,
    });

    for (const entry of result.names) {
      assert.ok(entry.name.startsWith("MC"));
    }
  });

  it("throws on invalid options", () => {
    assert.throws(
      () =>
        normalizeOptions({
          style: "old-school",
          minLength: 10,
          maxLength: 4,
        }),
      InvalidOptionsError,
    );
  });
});
