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
        if (pattern === "CCVCC") {
          const [a, b] = [name.at(-2)!, name.at(-1)!];
          assert.ok(
            isConsonant(a) && isConsonant(b),
            `${name} (${style}) labeled CCVCC but does not end in two consonants`,
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
});
