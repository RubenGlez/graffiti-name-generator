import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeOptions } from "../src/options.js";
import { InvalidOptionsError } from "../src/types.js";

describe("normalizeOptions numeric validation", () => {
  it("rejects NaN minLength", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", minLength: NaN }),
      InvalidOptionsError,
    );
  });

  it("rejects NaN maxLength", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", maxLength: NaN }),
      InvalidOptionsError,
    );
  });

  it("rejects NaN count", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", count: NaN }),
      InvalidOptionsError,
    );
  });

  it("rejects NaN seed", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", seed: NaN }),
      InvalidOptionsError,
    );
  });

  it("rejects non-integer minLength", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", minLength: 4.5 }),
      InvalidOptionsError,
    );
  });

  it("rejects out-of-range count", () => {
    assert.throws(
      () => normalizeOptions({ style: "modern", count: 0 }),
      InvalidOptionsError,
    );
    assert.throws(
      () => normalizeOptions({ style: "modern", count: 101 }),
      InvalidOptionsError,
    );
  });

  it("accepts valid integer options and defaults", () => {
    const normalized = normalizeOptions({ style: "modern", seed: 42 });
    assert.equal(normalized.minLength, 4);
    assert.equal(normalized.maxLength, 8);
    assert.equal(normalized.count, 10);
    assert.equal(normalized.seed, 42);
  });

  it("accepts seed 0 as an explicit deterministic seed", () => {
    const normalized = normalizeOptions({ style: "modern", seed: 0 });
    assert.equal(normalized.seed, 0);
  });
});
