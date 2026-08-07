import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

const root = resolve(import.meta.dirname, "..");
const readJson = async (file) => JSON.parse(await readFile(resolve(root, "site-data", file), "utf8"));
const [tests, waves] = await Promise.all([readJson("tests.json"), readJson("waves.json")]);

assert.equal(tests.source.occurrenceCount, 700, "Le MegaTest doit contenir 700 occurrences.");
assert.equal(tests.tests.length, 4, "Quatre questionnaires sont attendus.");
assert.equal(tests.items.length, 680, "La déduplication attend actuellement 680 items canoniques.");
for (const test of tests.tests) {
  assert.equal(test.instances.length, test.size, `${test.id}: nombre de questions incorrect.`);
  assert.equal(new Set(test.instances.map((instance) => instance.position)).size, test.size, `${test.id}: positions dupliquées.`);
}

const adhd100 = tests.tests.find((test) => test.id === "adhd-100");
const adhd250 = tests.tests.find((test) => test.id === "adhd-250");
for (let position = 1; position <= 18; position += 1) {
  assert.equal(
    adhd100.instances[position - 1].itemId,
    adhd250.instances[position - 1].itemId,
    `TDAH ${position}: itemId différent entre les versions 100 et 250.`
  );
}
assert.equal(
  tests.items.some((item) => /ASRS|WFIRS/i.test(item.textFr)),
  false,
  "Un item du MegaTest mentionne encore un instrument retiré."
);

assert.equal(waves.collections.length, 2, "Deux collections de vagues sont attendues.");
const modules = waves.collections.flatMap((collection) => collection.modules);
assert.equal(modules.length, 30, "Trente modules sont attendus.");
assert.equal(modules.flatMap((module) => module.pages).length, 150, "Cent cinquante fiches sont attendues.");
for (const module of modules) {
  assert.equal(module.pages.length, 5, `${module.id}: cinq fiches attendues.`);
  assert.deepEqual(module.pages.map((page) => page.number), [1, 2, 3, 4, 5], `${module.id}: ordre des fiches incorrect.`);
  const understand = module.pages[0];
  const cycleStart = understand.contentLines.indexOf("Cycle typique");
  if (cycleStart >= 0) {
    const cycleLines = understand.contentLines.slice(cycleStart + 1, cycleStart + 6);
    cycleLines.forEach((line, index) => assert.match(line, new RegExp(`^\\s*${index + 1}\\.`), `${module.id}: cycle mal numéroté.`));
  }
}

console.log("Contenu généré valide : 700 occurrences, 680 items, 30 modules et 150 fiches.");
