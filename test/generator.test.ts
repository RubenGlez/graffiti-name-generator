import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "../src/generator.js";
import { setDataDir, loadData } from "../src/loader.js";
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
      ["TRERAK", "KOEX", "TRORK", "SKAZ", "DRAK"],
    );
  });

  it("labels patterns consistently with their ending shape", () => {
    const styles = [
      "old-school",
      "modern",
      "wildstyle",
      "tech",
      "minimal",
      "hardcore",
    ] as const;
    const isConsonant = (c: string) => /[BCDFGHJKLMNPQRSTVWXYZ]/.test(c);

    for (const style of styles) {
      const result = generate({
        style,
        count: 20,
        minLength: 3,
        maxLength: 12,
        seed: 123,
      });
      for (const { name, pattern } of result.names) {
        if (pattern.endsWith("CC")) {
          const [a, b] = [name.at(-2)!, name.at(-1)!];
          assert.ok(
            isConsonant(a) && isConsonant(b),
            `${name} (${style}) labeled ${pattern} but does not end in two consonants`,
          );
        }
      }
    }
  });

  it("applies per-style length defaults when lengths are omitted", () => {
    const wild = generate({ style: "wildstyle", count: 12, seed: 3 });
    for (const entry of wild.names) {
      assert.ok(entry.name.length >= 6, `${entry.name} shorter than 6`);
      assert.ok(entry.name.length <= 10, `${entry.name} longer than 10`);
    }

    const minimal = generate({ style: "minimal", count: 12, seed: 3 });
    for (const entry of minimal.names) {
      assert.ok(entry.name.length >= 3, `${entry.name} shorter than 3`);
      assert.ok(entry.name.length <= 5, `${entry.name} longer than 5`);
    }
  });

  it("lets explicit lengths override style defaults", () => {
    const result = generate({
      style: "wildstyle",
      count: 8,
      minLength: 4,
      maxLength: 5,
      seed: 3,
    });
    for (const entry of result.names) {
      assert.ok(entry.name.length >= 4 && entry.name.length <= 5);
    }
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

  it("reports exhaustion honestly when the space is too small", () => {
    const result = generate({
      style: "minimal",
      count: 100,
      minLength: 3,
      maxLength: 3,
      forbiddenLetters: "BCDFGHJLMNPQSTVWXZ",
      seed: 5,
    });
    assert.equal(result.meta.exhausted, true);
    assert.ok(result.names.length < result.meta.requested);
    assert.equal(
      result.names.length,
      new Set(result.names.map((n) => n.name)).size,
    );
  });

  it("treats seed 0 as an explicit deterministic seed", () => {
    const a = generate({ style: "modern", count: 5, seed: 0 });
    const b = generate({ style: "modern", count: 5, seed: 0 });
    assert.equal(a.meta.seed, 0);
    assert.deepEqual(
      a.names.map((n) => n.name),
      b.names.map((n) => n.name),
    );
  });

  it("throws when the prefix contains a forbidden letter", () => {
    assert.throws(
      () =>
        generate({
          style: "modern",
          prefix: "KX",
          forbiddenLetters: "X",
          seed: 1,
        }),
      InvalidOptionsError,
    );
  });

  it("throws when an affix is a dictionary word or blocklisted term", () => {
    assert.throws(
      () => generate({ style: "modern", prefix: "THE", seed: 1 }),
      InvalidOptionsError,
    );
    assert.throws(
      () => generate({ style: "modern", suffix: "ASS", seed: 1 }),
      InvalidOptionsError,
    );
  });

  it("never emits a name containing a blocklisted term", () => {
    const blocklist = loadData().blocklist;
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const style of [
        "old-school",
        "wildstyle",
        "hardcore",
        "tech",
      ] as const) {
        const result = generate({ style, count: 20, seed });
        for (const { name } of result.names) {
          const lower = name.toLowerCase();
          for (const term of blocklist) {
            assert.ok(
              !lower.includes(term.toLowerCase()),
              `${name} contains blocklisted "${term}"`,
            );
          }
        }
      }
    }
  });
});
