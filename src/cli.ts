#!/usr/bin/env node
import { parseArgs } from "node:util";
import { generate } from "./generator.js";
import { isStyleId } from "./options.js";
import { InvalidOptionsError, STYLE_IDS } from "./types.js";

const HELP = `Usage: graffiti-names generate [options]

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
  -h, --help                Show this help
`;

const OPTIONS = {
  style: { type: "string" },
  count: { type: "string" },
  "min-length": { type: "string" },
  "max-length": { type: "string" },
  "preferred-letters": { type: "string" },
  "forbidden-letters": { type: "string" },
  prefix: { type: "string" },
  suffix: { type: "string" },
  seed: { type: "string" },
  format: { type: "string" },
  pronounceable: { type: "boolean" },
  "no-pronounceable": { type: "boolean" },
  help: { type: "boolean", short: "h" },
} as const;

function printHelp(): void {
  console.log(HELP);
}

function toNumber(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Number(value);
}

function runGenerate(args: string[]): void {
  const { values } = parseArgs({
    args,
    allowPositionals: false,
    strict: true,
    options: OPTIONS,
  });

  if (values.help) {
    printHelp();
    return;
  }

  const styleValue = values.style ?? "";
  if (!isStyleId(styleValue)) {
    throw new InvalidOptionsError(
      `Missing or invalid --style. Choose: ${STYLE_IDS.join(", ")}`,
    );
  }

  if (values.pronounceable && values["no-pronounceable"]) {
    throw new InvalidOptionsError(
      "--pronounceable and --no-pronounceable are mutually exclusive",
    );
  }

  let pronounceable: boolean | undefined;
  if (values["no-pronounceable"]) {
    pronounceable = false;
  } else if (values.pronounceable) {
    pronounceable = true;
  } else {
    pronounceable = undefined;
  }

  const format = values.format ?? "human";
  if (format !== "human" && format !== "json") {
    throw new InvalidOptionsError('--format must be "human" or "json"');
  }

  const result = generate({
    style: styleValue,
    count: toNumber(values.count),
    minLength: toNumber(values["min-length"]),
    maxLength: toNumber(values["max-length"]),
    pronounceable,
    preferredLetters: values["preferred-letters"],
    forbiddenLetters: values["forbidden-letters"],
    prefix: values.prefix,
    suffix: values.suffix,
    seed: toNumber(values.seed),
  });

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
    runGenerate(rest);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
