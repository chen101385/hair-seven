#!/usr/bin/env node
/**
 * Prints every outstanding PLACEHOLDER and VERIFY in content/site.ts — the list
 * to take to Kim. `npm run punchlist`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "content", "site.ts");
const lines = readFileSync(file, "utf8").split("\n");

const hits = lines
  .map((text, index) => ({ line: index + 1, text: text.trim() }))
  .filter(({ text }) => text.includes("PLACEHOLDER") || text.includes("VERIFY"))
  // Skip the file's own header comment, which explains what PLACEHOLDER means.
  // Continuation lines of a /** */ block start with "*"; real items never do.
  .filter(({ text }) => !text.startsWith("*"));

if (hits.length === 0) {
  console.log("\n  Nothing outstanding in content/site.ts. Ship it.\n");
  process.exit(0);
}

console.log(`\n  ${hits.length} item(s) still need a real answer from Kim:\n`);
for (const { line, text } of hits) {
  console.log(`  content/site.ts:${String(line).padStart(3)}  ${text}`);
}
console.log(
  "\n  Also outstanding, outside this file:\n" +
    "    - app/favicon.ico + app/icon.svg — placeholder mark, not a real logo\n" +
    "    - NEXT_PUBLIC_SITE_URL — set once a domain is assigned\n" +
    "    - Confirm with Kim that she's happy with both photos being public\n",
);
