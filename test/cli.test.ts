import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
// The test build compiles src/ alongside the tests into dist-test/src.
const cliPath = join(testDir, "..", "src", "cli.js");

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function run(args: string[]): RunResult {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    encoding: "utf8",
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe("cli", () => {
  it("prints the seed-42 golden output in human format", () => {
    const { status, stdout } = run([
      "generate",
      "--style",
      "old-school",
      "--count",
      "5",
      "--seed",
      "42",
    ]);
    assert.equal(status, 0);
    const names = stdout
      .trim()
      .split("\n")
      .map((line) => line.split("  ")[0]);
    assert.deepEqual(names, ["TRERAK", "KOEX", "TRORK", "SKAZ", "DRAK"]);
  });

  it("emits valid JSON with full meta for --format json", () => {
    const { status, stdout } = run([
      "generate",
      "--style",
      "modern",
      "--count",
      "3",
      "--seed",
      "7",
      "--format",
      "json",
    ]);
    assert.equal(status, 0);
    const parsed = JSON.parse(stdout) as {
      names: { name: string; score: number; pattern: string }[];
      meta: { style: string; seed: number; requested: number };
    };
    assert.equal(parsed.names.length, 3);
    assert.equal(parsed.meta.style, "modern");
    assert.equal(parsed.meta.seed, 7);
    assert.equal(parsed.meta.requested, 3);
  });

  it("exits 1 when --style is missing", () => {
    const { status, stderr } = run(["generate", "--count", "3"]);
    assert.equal(status, 1);
    assert.match(stderr, /style/);
  });

  it("exits 1 for an invalid style", () => {
    const { status } = run(["generate", "--style", "bogus"]);
    assert.equal(status, 1);
  });

  it("exits 1 for an unknown flag", () => {
    const { status, stderr } = run([
      "generate",
      "--style",
      "modern",
      "--lenght",
      "6",
    ]);
    assert.equal(status, 1);
    assert.match(stderr, /Unknown option/);
  });

  it("exits 1 for a non-numeric count", () => {
    const { status } = run(["generate", "--style", "modern", "--count", "abc"]);
    assert.equal(status, 1);
  });

  it("reports exhaustion on stderr while printing partial output on stdout", () => {
    // Forbidding all consonants but K and R shrinks the 3-char space well
    // below the requested 100, forcing exhaustion.
    const { stdout, stderr } = run([
      "generate",
      "--style",
      "minimal",
      "--count",
      "100",
      "--min-length",
      "3",
      "--max-length",
      "3",
      "--forbidden-letters",
      "BCDFGHJLMNPQSTVWXZ",
      "--seed",
      "5",
    ]);
    assert.ok(stdout.trim().length > 0, "expected some names on stdout");
    assert.match(stderr, /only generated \d+\/100/);
  });

  it("prints help and exits 0 for --help", () => {
    const { status, stdout } = run(["--help"]);
    assert.equal(status, 0);
    assert.match(stdout, /Usage: graffiti-names generate/);
  });

  it("exits 1 for an unknown command", () => {
    const { status, stderr } = run(["frobnicate"]);
    assert.equal(status, 1);
    assert.match(stderr, /Unknown command/);
  });
});
