#!/usr/bin/env node
import { generate } from "./generator.js";
import { isStyleId } from "./options.js";
import { InvalidOptionsError, STYLE_IDS } from "./types.js";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg?.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];

    if (key === "pronounceable") {
      parsed[key] = true;
      continue;
    }

    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      i += 1;
      continue;
    }

    parsed[key] = true;
  }

  return parsed;
}

function printHelp(): void {
  console.log(`Usage: graffiti-names generate [options]

Options:
  --style <id>              ${STYLE_IDS.join(" | ")}
  --count <n>               Number of names (default: 10)
  --min-length <n>          Minimum length (default: per-style)
  --max-length <n>          Maximum length (default: per-style)
  --pronounceable           Require pronounceable clusters (default: per-style)
  --no-pronounceable        Allow harsh consonant stacks
  --preferred-letters <s>   Soft letter preference, e.g. KZ
  --forbidden-letters <s>   Hard reject letters, e.g. QW
  --prefix <s>              Prefix up to 4 chars
  --suffix <s>              Suffix up to 4 chars
  --seed <n>                RNG seed for reproducible output
  --format <human|json>     Output format (default: human)
`);
}

function runGenerate(args: Record<string, string | boolean>): void {
  const styleValue = String(args.style ?? "");
  if (!isStyleId(styleValue)) {
    throw new InvalidOptionsError(
      `Missing or invalid --style. Choose: ${STYLE_IDS.join(", ")}`,
    );
  }

  let pronounceable: boolean | undefined;
  if (args["no-pronounceable"] === true) {
    pronounceable = false;
  } else if (args.pronounceable === true) {
    pronounceable = true;
  } else {
    pronounceable = undefined;
  }

  const result = generate({
    style: styleValue,
    count: args.count ? Number(args.count) : undefined,
    minLength: args["min-length"] ? Number(args["min-length"]) : undefined,
    maxLength: args["max-length"] ? Number(args["max-length"]) : undefined,
    pronounceable,
    preferredLetters: args["preferred-letters"]
      ? String(args["preferred-letters"])
      : undefined,
    forbiddenLetters: args["forbidden-letters"]
      ? String(args["forbidden-letters"])
      : undefined,
    prefix: args.prefix ? String(args.prefix) : undefined,
    suffix: args.suffix ? String(args.suffix) : undefined,
    seed: args.seed ? Number(args.seed) : undefined,
  });

  const format = String(args.format ?? "human");
  if (format === "json") {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  for (const entry of result.names) {
    console.log(
      `${entry.name}  (score: ${entry.score}, pattern: ${entry.pattern})`,
    );
  }

  if (result.meta.exhausted) {
    console.error(
      `Warning: only generated ${result.names.length}/${result.meta.requested} names`,
    );
  }
}

function main(): void {
  const [, , command, ...rest] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command !== "generate") {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exit(1);
  }

  try {
    runGenerate(parseArgs(rest));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
