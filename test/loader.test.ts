import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { loadData, setDataDir, getStyle } from "../src/loader.js";
import { MissingDataError } from "../src/types.js";

const testDir = dirname(fileURLToPath(import.meta.url));
const realDataDir = join(testDir, "..", "..", "data");

/** Copy the real data dir to a fresh temp dir, then apply file overrides. */
function makeDataDir(overrides: Record<string, unknown> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "gng-data-"));
  cpSync(realDataDir, dir, { recursive: true });
  for (const [relPath, content] of Object.entries(overrides)) {
    const body =
      typeof content === "string" ? content : JSON.stringify(content);
    writeFileSync(join(dir, relPath), body);
  }
  return dir;
}

describe("loader caching and resolution", () => {
  const dir = makeDataDir();

  before(() => setDataDir(dir));
  after(() => rmSync(dir, { recursive: true, force: true }));

  it("caches and returns the same instance until setDataDir is called", () => {
    const a = loadData();
    const b = loadData();
    assert.equal(a, b);

    setDataDir(dir);
    const c = loadData();
    assert.notEqual(a, c);
  });

  it("throws MissingDataError for a directory without data", () => {
    setDataDir(join(tmpdir(), "gng-nonexistent-xyz"));
    assert.throws(() => loadData(), MissingDataError);
    setDataDir(dir);
  });

  it("exposes styles via getStyle", () => {
    assert.equal(getStyle("old-school").id, "old-school");
  });
});

describe("loader data validation", () => {
  const dirs: string[] = [];
  function fixture(overrides: Record<string, unknown>): string {
    const dir = makeDataDir(overrides);
    dirs.push(dir);
    return dir;
  }

  after(() => {
    for (const dir of dirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function expectInvalid(overrides: Record<string, unknown>): void {
    setDataDir(fixture(overrides));
    assert.throws(() => loadData(), MissingDataError);
    setDataDir(realDataDir);
  }

  it("reports the underlying SyntaxError for malformed JSON", () => {
    setDataDir(fixture({ "clusters.json": "{ not json" }));
    assert.throws(
      () => loadData(),
      (err: unknown) =>
        err instanceof MissingDataError && /Invalid JSON/.test(err.message),
    );
    setDataDir(realDataDir);
  });

  interface StyleJson {
    blocks: { starts: Record<string, number> };
    patterns: Record<string, number>;
    defaults: { minLength: number; maxLength: number };
  }

  function readModernStyle(): StyleJson {
    return JSON.parse(
      readFileSync(join(realDataDir, "styles", "modern.json"), "utf8"),
    ) as StyleJson;
  }

  it("rejects a style block key missing from the master list", () => {
    const style = readModernStyle();
    style.blocks.starts["QQ"] = 5;
    expectInvalid({ "styles/modern.json": style });
  });

  it("rejects a cluster containing a vowel", () => {
    expectInvalid({ "clusters.json": ["KR", "AE"] });
  });

  it("rejects a style referencing an unknown pattern", () => {
    const style = readModernStyle();
    style.patterns["ZZZ"] = 5;
    expectInvalid({ "styles/modern.json": style });
  });

  it("rejects negative weights", () => {
    const style = readModernStyle();
    style.blocks.starts["K"] = -1;
    expectInvalid({ "styles/modern.json": style });
  });

  it("rejects defaults outside the global length limits", () => {
    const style = readModernStyle();
    style.defaults.maxLength = 99;
    expectInvalid({ "styles/modern.json": style });
  });

  it("accepts the real data unchanged", () => {
    setDataDir(makeDataDir());
    assert.doesNotThrow(() => loadData());
    setDataDir(realDataDir);
  });
});
