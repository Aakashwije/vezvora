import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

test("public legal routes have pages", () => {
  assert.equal(existsSync(join(root, "src/app/privacy/page.tsx")), true);
  assert.equal(existsSync(join(root, "src/app/terms/page.tsx")), true);
});

test("footer navigation does not ship placeholder links", async () => {
  const { footerNav } = await import("../src/lib/site.ts");
  const hrefs = footerNav.flatMap((section) => section.links.map((link) => link.href));
  assert.equal(hrefs.includes("#"), false);
});
