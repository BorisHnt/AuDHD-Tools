import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { scoreTest } from "../assets/scoring.js";

const root = resolve(import.meta.dirname, "..");
const readJson = async (file) => JSON.parse(await readFile(resolve(root, "site-data", file), "utf8"));
const [tests, waves] = await Promise.all([readJson("tests.json"), readJson("waves.json")]);

assert.equal(tests.source.occurrenceCount, 700, "Le MegaTest doit contenir 700 occurrences.");
assert.equal(tests.tests.length, 4, "Quatre questionnaires sont attendus.");
assert.equal(tests.items.length, 680, "La déduplication attend actuellement 680 items canoniques.");
assert.equal(tests.dimensions.length, 40, "Quarante dimensions canoniques sont attendues.");
assert.ok(tests.concepts.length < tests.items.length, "Les formulations doivent être réellement regroupées en concepts.");
assert.equal(new Set(tests.dimensions.map((dimension) => dimension.id)).size, tests.dimensions.length, "dimensionId dupliqué.");
assert.equal(new Set(tests.concepts.map((concept) => concept.id)).size, tests.concepts.length, "conceptId dupliqué.");
const dimensions = new Map(tests.dimensions.map((dimension) => [dimension.id, dimension]));
const concepts = new Map(tests.concepts.map((concept) => [concept.id, concept]));
for (const item of tests.items) {
  assert.ok(dimensions.has(item.dimensionId), `${item.itemId}: dimension inconnue.`);
  assert.ok(concepts.has(item.conceptId), `${item.itemId}: concept inconnu.`);
  assert.equal(concepts.get(item.conceptId).dimensionId, item.dimensionId, `${item.itemId}: concept et dimension incohérents.`);
  if (item.scoring.type === "flag") {
    assert.equal(item.contributions.length, 0, `${item.itemId}: un flag ne doit ajouter aucun point.`);
    assert.equal(item.scoring.addsDiagnosticPoints, false, `${item.itemId}: le flag doit explicitement exclure les points diagnostiques.`);
  } else {
    assert.deepEqual(item.contributions, [{ dimensionId: item.dimensionId, aggregation: "primary" }], `${item.itemId}: contribution primaire incorrecte.`);
  }
}
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

const oneAnswerSession = {
  answers: {
    [adhd100.instances[0].instanceId]: { kind: "value", optionId: "very-often", value: 4 }
  }
};
assert.equal(
  scoreTest(oneAnswerSession, adhd100, tests).results.some((result) => result.status === "sufficient"),
  false,
  "Une seule réponse ne doit jamais produire un indice dimensionnel."
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
for (const collection of waves.collections) {
  assert.ok(collection.references.length >= 20, `${collection.id}: bibliographie publique absente ou incomplète.`);
  collection.references.forEach((reference) => {
    assert.match(reference.id, /^S\d{2}$/, `${collection.id}: identifiant de source incorrect.`);
    assert.match(reference.url, /^https:\/\//, `${collection.id}: URL de source incorrecte.`);
  });
}

console.log(`Contenu généré valide : 700 occurrences, 680 items, ${tests.concepts.length} concepts, 40 dimensions, 30 modules et 150 fiches.`);
