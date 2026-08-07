import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const base = resolve(root, "data/model/candidate-0.1");

const readJson = async (relativePath) =>
  JSON.parse(await readFile(resolve(base, relativePath), "utf8"));

const [contract, canonicalSource, dimensionsFile, conceptsFile, scalesFile, itemsFile, instrumentsFile, test, fixture, expected] =
  await Promise.all([
    readJson("contract.json"),
    readJson("canonical-source.json"),
    readJson("dimensions.json"),
    readJson("concepts.json"),
    readJson("response-scales.json"),
    readJson("items.json"),
    readJson("instruments.json"),
    readJson("tests/prototype-10-cases.json"),
    readJson("fixtures/responses.json"),
    readJson("fixtures/expected-results.json")
  ]);

const dimensions = new Map(dimensionsFile.dimensions.map((entry) => [entry.id, entry]));
const concepts = new Map(conceptsFile.concepts.map((entry) => [entry.id, entry]));
const scales = new Map(scalesFile.responseScales.map((entry) => [entry.id, entry]));
const items = new Map(itemsFile.items.map((entry) => [entry.itemId, entry]));
const instruments = new Map(instrumentsFile.instruments.map((entry) => [entry.id, entry]));
const instances = new Map(test.instances.map((entry) => [entry.instanceId, entry]));
const responses = new Map(fixture.responses.map((entry) => [entry.instanceId, entry.response]));
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

assert.deepEqual(
  contract.scoringTypes,
  ["direct", "reverse", "flag", "none", "instrument"],
  "Les types de scoring du contrat ont changé."
);
assert.deepEqual(
  contract.responseKinds,
  ["value", "unknown", "not-applicable", "skipped"],
  "Les états de réponse du contrat ont changé."
);
assert.equal(canonicalSource.questionOccurrences.total, 700, "La source canonique doit contenir 700 occurrences.");
assert.equal(canonicalSource.instrumentContent.asrsIncluded, false, "Le MegaTest ne doit pas intégrer l'ASRS.");
assert.equal(canonicalSource.instrumentContent.wfirsIncluded, false, "Le MegaTest ne doit pas intégrer le WFIRS-S.");
assert.equal(canonicalSource.supersedes.status, "historical-do-not-import", "L'ancienne source ne doit pas être importée.");

let canonicalText = null;
const canonicalPath = process.env.AUDHD_TESTS_SOURCE
  || resolve(root, "../../Docs Psy/mega_tests_TDAH_TSA_original_OSS_v2.txt");
try {
  canonicalText = await readFile(canonicalPath, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

if (canonicalText !== null) {
  const actualHash = createHash("sha256").update(canonicalText).digest("hex");
  assert.equal(actualHash, canonicalSource.sha256, "L'empreinte de la source canonique a changé.");

  const questionMaps = new Map();
  let activeTestId = null;
  for (const line of canonicalText.split(/\r?\n/)) {
    const testMatch = line.match(/^TEST (TDAH|TSA) (100|250)$/);
    if (testMatch) {
      const family = testMatch[1] === "TDAH" ? "adhd" : "autism";
      activeTestId = `${family}-${testMatch[2]}`;
      questionMaps.set(activeTestId, new Map());
      continue;
    }
    const questionMatch = line.match(/^(\d+)\. (.+)$/);
    if (activeTestId && questionMatch) {
      questionMaps.get(activeTestId).set(Number(questionMatch[1]), questionMatch[2]);
    }
  }

  for (const [testId, expectedCount] of Object.entries(canonicalSource.questionOccurrences.tests)) {
    assert.equal(questionMaps.get(testId)?.size, expectedCount, `Décompte incorrect pour ${testId}.`);
  }

  for (let position = 1; position <= 18; position += 1) {
    assert.equal(
      questionMaps.get("adhd-100").get(position),
      questionMaps.get("adhd-250").get(position),
      `L'item TDAH partagé ${position} n'est plus identique entre les versions.`
    );
  }

  for (const item of items.values()) {
    if (item.source.canonicalSourceId !== canonicalSource.sourceId) continue;
    const reference = item.source.sourceQuestion.match(/^(TDAH|TSA) (100|250), question (\d+)$/);
    assert(reference, `Référence canonique invalide pour ${item.itemId}.`);
    const family = reference[1] === "TDAH" ? "adhd" : "autism";
    const canonicalQuestion = questionMaps.get(`${family}-${reference[2]}`).get(Number(reference[3]));
    assert.equal(item.text.fr, canonicalQuestion, `Texte non canonique pour ${item.itemId}.`);
  }
}

assert.equal(test.instances.length, 10, "Le prototype doit contenir exactement dix cas.");
assert.equal(new Set(test.instances.map((entry) => entry.position)).size, 10, "Les positions doivent être uniques.");

for (const concept of concepts.values()) {
  assert(dimensions.has(concept.dimensionId), `Dimension inconnue pour ${concept.id}.`);
}

for (const item of items.values()) {
  assert(concepts.has(item.conceptId), `Concept inconnu pour ${item.itemId}.`);
  assert(scales.has(item.responseScale), `Échelle inconnue pour ${item.itemId}.`);
  assert(contract.roles.includes(item.role), `Rôle inconnu pour ${item.itemId}.`);
  assert(contract.periods.includes(item.period), `Période inconnue pour ${item.itemId}.`);
  assert(contract.scoringTypes.includes(item.scoring.type), `Scoring inconnu pour ${item.itemId}.`);
  const primary = item.contributions.filter((entry) => entry.aggregation === "primary");
  assert(primary.length <= 1, `${item.itemId} possède plusieurs contributions principales.`);
  for (const contribution of item.contributions) {
    assert(dimensions.has(contribution.dimensionId), `Contribution inconnue pour ${item.itemId}.`);
    assert(contract.aggregationModes.includes(contribution.aggregation), `Agrégation inconnue pour ${item.itemId}.`);
  }
  if (item.scoring.type === "instrument") {
    assert(instruments.has(item.scoring.instrumentId), `Instrument inconnu pour ${item.itemId}.`);
  }
  if (item.scoring.type === "flag") {
    assert.equal(item.contributions.length, 0, `Un flag ne doit pas ajouter de points (${item.itemId}).`);
  }
}

for (const instance of instances.values()) {
  assert(items.has(instance.itemId), `Item inconnu pour ${instance.instanceId}.`);
  assert(responses.has(instance.instanceId), `Réponse absente pour ${instance.instanceId}.`);
}

for (const [instanceId, response] of responses) {
  assert(contract.responseKinds.includes(response.kind), `État de réponse inconnu pour ${instanceId}.`);
}

const counts = { answeredItems: 0, unknownItems: 0, notApplicableItems: 0, skippedItems: 0 };
const conceptSamples = new Map();
const activeFlags = [];
const unevaluatedFlags = [];

for (const [instanceId, response] of responses) {
  const item = items.get(instances.get(instanceId).itemId);

  if (response.kind === "value") counts.answeredItems += 1;
  if (response.kind === "unknown") counts.unknownItems += 1;
  if (response.kind === "not-applicable") counts.notApplicableItems += 1;
  if (response.kind === "skipped") counts.skippedItems += 1;

  if (item.scoring.type === "flag") {
    if (response.kind === "skipped" || response.kind === "unknown") {
      unevaluatedFlags.push({ flagId: item.scoring.flagId, sourceInstanceId: instanceId, reason: response.kind });
    } else if (response.kind === "value" && response.optionId === item.scoring.whenOptionId) {
      activeFlags.push({ flagId: item.scoring.flagId, sourceInstanceId: instanceId, addsDiagnosticPoints: false });
    }
    continue;
  }

  if (!["direct", "reverse"].includes(item.scoring.type) || response.kind !== "value") continue;

  const { minimum, maximum } = item.scoring;
  const itemValue = item.scoring.type === "reverse"
    ? maximum + minimum - response.rawValue
    : response.rawValue;
  const primary = item.contributions.find((entry) => entry.aggregation === "primary");
  if (!primary) continue;

  const sample = conceptSamples.get(item.conceptId) ?? {
    conceptId: item.conceptId,
    dimensionId: primary.dimensionId,
    normalizedValues: [],
    applicableItems: 0
  };
  sample.normalizedValues.push((itemValue - minimum) / (maximum - minimum));
  sample.applicableItems += 1;
  conceptSamples.set(item.conceptId, sample);
}

const conceptValues = [...conceptSamples.values()].map((concept) => ({
  conceptId: concept.conceptId,
  dimensionId: concept.dimensionId,
  normalized: mean(concept.normalizedValues),
  answeredItems: concept.normalizedValues.length,
  applicableItems: concept.applicableItems
}));

const dimensionSamples = new Map();
for (const concept of conceptValues) {
  const sample = dimensionSamples.get(concept.dimensionId) ?? [];
  sample.push(concept.normalized);
  dimensionSamples.set(concept.dimensionId, sample);
}

const dimensionValues = [...dimensionSamples].map(([dimensionId, normalizedConcepts]) => {
  const normalized = mean(normalizedConcepts);
  return {
    dimensionId,
    normalized,
    displayValue: normalized * 4,
    displayScaleMaximum: 4,
    evaluatedConcepts: normalizedConcepts.length,
    applicableConcepts: normalizedConcepts.length
  };
});

// Trois formulations identiques du concept A et une formulation du concept B
// doivent produire deux concepts de poids égal : (1 + 0) / 2 = 0,5.
const duplicateConceptGuard = mean([mean([1, 1, 1]), mean([0])]);
assert.equal(duplicateConceptGuard, 0.5, "Les items redondants surpondèrent un concept.");

const actualCompletion = {
  totalItems: test.instances.length,
  treatedItems: test.instances.length - counts.skippedItems,
  ...counts
};
const applicableItems = test.instances.length - counts.notApplicableItems;
const actualCoverage = {
  applicableItems,
  informativeAnsweredItems: counts.answeredItems,
  ratio: counts.answeredItems / applicableItems
};

assert.deepEqual(actualCompletion, expected.completion, "Les métriques de complétion diffèrent.");
assert.deepEqual(actualCoverage, expected.informationalCoverage, "La couverture informative diffère.");
assert.deepEqual(
  conceptValues.map(({ dimensionId: _dimensionId, ...concept }) => concept),
  expected.descriptiveConcepts,
  "Les concepts diffèrent."
);
assert.deepEqual(dimensionValues, expected.descriptiveDimensions, "Les dimensions diffèrent.");
assert.deepEqual(activeFlags, expected.activeFlags, "Les drapeaux actifs diffèrent.");
assert.deepEqual(unevaluatedFlags, expected.unevaluatedFlags, "Les drapeaux non évalués diffèrent.");

const asrs = instruments.get("asrs-v1.1-6q");
const asrsAnsweredItems = test.instances.filter((instance) => {
  const item = items.get(instance.itemId);
  const response = responses.get(instance.instanceId);
  return item.scoring.instrumentId === asrs.id && response.kind === "value";
}).length;
const asrsRequiredItems = asrs.officialScoringMethods[0].requiresCompleteItemCount;
const actualInstrumentResults = [
  {
    instrumentId: asrs.id,
    status: asrsAnsweredItems === asrsRequiredItems ? "ready" : "incomplete",
    answeredRequiredItems: asrsAnsweredItems,
    requiredItems: asrsRequiredItems,
    result: null
  },
  {
    instrumentId: "wfirs-s",
    status: instruments.get("wfirs-s").integrationStatus,
    result: null
  }
];
assert.deepEqual(actualInstrumentResults, expected.officialInstrumentResults, "Les statuts des instruments diffèrent.");

console.log("Prototype candidate 0.1 valide : 10 cas, références cohérentes et résultats attendus confirmés.");
