import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { basename, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { conceptFor, coveragePolicy, dimensionFor, resultGroups, roleForDimension } from "./question-taxonomy.mjs";

const root = resolve(import.meta.dirname, "..");
const defaults = {
  tests: resolve(root, "sources/mega-tests-v2.txt"),
  tdah: resolve(root, "sources/manuel-vagues-tdah.odt"),
  psychological: resolve(root, "sources/manuel-vagues-psychologiques.odt")
};
const dimensionsFile = JSON.parse(await readFile(resolve(root, "data/model/taxonomy-v1/dimensions.json"), "utf8"));
const dimensions = dimensionsFile.dimensions;
const dimensionMap = new Map(dimensions.map((dimension) => [dimension.id, dimension]));

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  })
);
const sources = {
  tests: args.tests || process.env.AUDHD_TESTS_SOURCE || defaults.tests,
  tdah: args.tdah || process.env.AUDHD_TDAH_WAVES_SOURCE || defaults.tdah,
  psychological: args.psychological || process.env.AUDHD_PSYCH_WAVES_SOURCE || defaults.psychological
};

const output = resolve(root, "site-data");
await mkdir(output, { recursive: true });

const hash = (value) => createHash("sha256").update(value).digest("hex");
const slug = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 72);

const classifyTheme = (title) => {
  const normalized = slug(title);
  if (/diagnostic|differentiel|comorbid/.test(normalized)) return "differential";
  if (/qualite-des-preuves|elements-objectifs/.test(normalized)) return "evidence";
  if (/retentissement|impact-et-contraintes|besoins-de-soutien/.test(normalized)) return "impairment";
  if (/enfance|developpement|histoire-developpementale|chronicite|multi-contextes/.test(normalized)) return "developmental";
  if (/sommeil|rythme-circadien/.test(normalized)) return "medical-context";
  if (/compensation|camouflage|regulation-emotionnelle|hyperfocus|interoception|alexithymie/.test(normalized)) return "associated";
  return "core";
};

const responseScaleFor = (text) =>
  /fréquence|souvent|régulièrement|fréquemment|parfois|habituellement/i.test(text)
    ? "frequency-0-4"
    : "agreement-0-4";

const parseTests = (text) => {
  const itemBank = new Map();
  const conceptBank = new Map();
  const testManifests = [];
  let currentTest = null;
  let currentTheme = null;

  for (const rawLine of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = rawLine.trim();
    const testMatch = line.match(/^TEST (TDAH|TSA) (100|250)$/);
    if (testMatch) {
      const family = testMatch[1] === "TDAH" ? "adhd" : "autism";
      currentTest = {
        id: `${family}-${testMatch[2]}`,
        family,
        size: Number(testMatch[2]),
        titleFr: `${testMatch[1]} ${testMatch[2]}`,
        themes: [],
        instances: []
      };
      testManifests.push(currentTest);
      currentTheme = null;
      continue;
    }

    const themeMatch = line.match(/^THEME (\d+) : (.+?) \((\d+) questions\)$/);
    if (themeMatch && currentTest) {
      currentTheme = {
        id: `${currentTest.family}.theme.${slug(themeMatch[2])}`,
        number: Number(themeMatch[1]),
        titleFr: themeMatch[2],
        expectedQuestions: Number(themeMatch[3]),
        role: classifyTheme(themeMatch[2])
      };
      currentTest.themes.push(currentTheme);
      continue;
    }

    const questionMatch = line.match(/^(\d+)\. (.+)$/);
    if (!questionMatch || !currentTest || !currentTheme) continue;

    const number = Number(questionMatch[1]);
    const questionText = questionMatch[2].trim();
    const identity = hash(`${currentTest.family}\u0000${questionText}`).slice(0, 14);
    const itemId = `${currentTest.family}-item-${identity}`;
    if (!itemBank.has(itemId)) {
      const dimensionId = dimensionFor({ family: currentTest.family, themeTitle: currentTheme.titleFr, text: questionText });
      const dimension = dimensionMap.get(dimensionId);
      if (!dimension) throw new Error(`Dimension inconnue pour ${itemId}: ${dimensionId}`);
      const concept = conceptFor(dimensionId, questionText, dimension.labelFr);
      conceptBank.set(concept.id, concept);
      const role = roleForDimension(dimensionId);
      const scoringType = role === "differential" || role === "medical-context" ? "flag" : "direct";
      itemBank.set(itemId, {
        itemId,
        family: currentTest.family,
        textFr: questionText,
        conceptId: concept.id,
        dimensionId,
        contributions: scoringType === "flag" ? [] : [{ dimensionId, aggregation: "primary" }],
        role,
        period: dimensionId.includes(".trajectory.childhood") || /avant 12 ans|enfance|enfant/i.test(questionText) ? "childhood" : "current-or-lifetime",
        responseScale: responseScaleFor(questionText),
        scoring: scoringType === "flag"
          ? { type: "flag", triggerAt: 3, addsDiagnosticPoints: false }
          : { type: "direct", minimum: 0, maximum: 4, validatedThreshold: null },
        source: {
          type: "original",
          instrument: null,
          licenseStatus: "not-applicable",
          canonicalSourceId: "mega-tests-original-oss-v2"
        },
        reviewStatus: "generated-concept-mapping-requires-clinical-review"
      });
    }
    currentTest.instances.push({
      instanceId: `${currentTest.id}-q${String(number).padStart(3, "0")}`,
      itemId,
      position: number,
      themeId: currentTheme.id
    });
  }

  for (const test of testManifests) {
    if (test.instances.length !== test.size) {
      throw new Error(`${test.id}: ${test.instances.length} questions trouvées au lieu de ${test.size}.`);
    }
  }

  return {
    schemaVersion: "1.1.0-draft",
    source: {
      fileName: basename(sources.tests),
      sha256: hash(text),
      occurrenceCount: testManifests.reduce((total, test) => total + test.instances.length, 0)
    },
    responseScales: [
      {
        id: "frequency-0-4",
        options: [
          { id: "never", labelFr: "Jamais", value: 0 },
          { id: "rarely", labelFr: "Rarement", value: 1 },
          { id: "sometimes", labelFr: "Parfois", value: 2 },
          { id: "often", labelFr: "Souvent", value: 3 },
          { id: "very-often", labelFr: "Très souvent", value: 4 }
        ]
      },
      {
        id: "agreement-0-4",
        options: [
          { id: "not-at-all", labelFr: "Pas du tout", value: 0 },
          { id: "slightly", labelFr: "Un peu", value: 1 },
          { id: "partly", labelFr: "Partiellement", value: 2 },
          { id: "mostly", labelFr: "En grande partie", value: 3 },
          { id: "completely", labelFr: "Tout à fait", value: 4 }
        ]
      }
    ],
    resultGroups,
    coveragePolicy,
    dimensions,
    concepts: [...conceptBank.values()],
    items: [...itemBank.values()],
    tests: testManifests
  };
};

const phaseIds = {
  "COMPRENDRE": "understand",
  "AVANT LA VAGUE": "before",
  "PENDANT LA VAGUE": "during",
  "APRÈS LA VAGUE": "after",
  "PRÉVENIR / RÉDUIRE": "prevent"
};

const convertOdtToText = async (filePath, tempRoot) => {
  execFileSync("libreoffice", ["--headless", "--convert-to", "txt:Text", "--outdir", tempRoot, filePath], {
    stdio: "ignore"
  });
  return readFile(join(tempRoot, basename(filePath, ".odt") + ".txt"), "utf8");
};

const parsePublicReferences = (text) => {
  const appendixStart = text.indexOf("SOURCES PUBLIQUES");
  if (appendixStart < 0) return [];
  const appendix = text.slice(appendixStart);
  return appendix.split(/\r?\n/).flatMap((line) => {
    const match = line.trim().match(/^(S\d{2})\s+(.+?)\s+(https?:\/\/\S+)$/);
    if (!match) return [];
    const [, id, descriptionFr, url] = match;
    return [{ id, descriptionFr: descriptionFr.trim(), url: url.replace(/[.)]+$/, "") }];
  });
};

const parseWaveCollection = (text, collection) => {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const modules = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const header = lines[index].trim().match(/^MODULE (\d+) - PAGE ([1-5])\/5 - (.+)$/);
    if (!header) continue;
    const moduleNumber = Number(header[1]);
    const pageNumber = Number(header[2]);
    const phaseLabel = header[3].trim();
    const phaseId = phaseIds[phaseLabel];
    if (!phaseId) throw new Error(`Phase inconnue: ${phaseLabel}`);

    const titleFr = lines[index + 1]?.trim() || `Module ${moduleNumber}`;
    const contentLines = [];
    let cursor = index + 2;
    while (cursor < lines.length && !/^MODULE \d+ - PAGE [1-5]\/5 - /.test(lines[cursor].trim()) && !/^ANNEXE /.test(lines[cursor].trim())) {
      const line = lines[cursor].trimEnd();
      if (line.trim()) contentLines.push(line);
      cursor += 1;
    }

    let cycleIndex = 0;
    let insideCycle = false;
    const normalizedContentLines = contentLines.map((line) => {
      if (line.trim() === "Cycle typique") {
        insideCycle = true;
        cycleIndex = 0;
        return line;
      }
      const numbered = insideCycle && line.match(/^(\s*)\d+\.\s*(.+)$/);
      if (numbered) {
        cycleIndex += 1;
        return `${numbered[1]}${cycleIndex}. ${numbered[2]}`;
      }
      if (insideCycle) insideCycle = false;
      return line;
    });

    const module = modules.get(moduleNumber) || {
      id: `${collection.id}-module-${String(moduleNumber).padStart(2, "0")}`,
      number: moduleNumber,
      titleFr,
      slug: slug(titleFr),
      pages: []
    };
    module.pages.push({
      id: `${module.id}-${phaseId}`,
      number: pageNumber,
      phase: phaseId,
      phaseLabelFr: phaseLabel.charAt(0) + phaseLabel.slice(1).toLocaleLowerCase("fr"),
      contentLines: normalizedContentLines
    });
    modules.set(moduleNumber, module);
    index = cursor - 1;
  }

  const parsedModules = [...modules.values()].sort((a, b) => a.number - b.number);
  for (const module of parsedModules) {
    module.pages.sort((a, b) => a.number - b.number);
    if (module.pages.length !== 5) throw new Error(`${module.id}: ${module.pages.length} fiches au lieu de 5.`);
  }

  const { sourcePath, ...publicCollection } = collection;
  return {
    ...publicCollection,
    source: { fileName: basename(sourcePath), sha256: hash(text) },
    references: parsePublicReferences(text),
    modules: parsedModules
  };
};

const tempRoot = await mkdtemp(join(tmpdir(), "audhd-content-"));
try {
  const [testsText, tdahText, psychologicalText] = await Promise.all([
    readFile(sources.tests, "utf8"),
    convertOdtToText(sources.tdah, tempRoot),
    convertOdtToText(sources.psychological, tempRoot)
  ]);

  const testsData = parseTests(testsText);
  const wavesData = {
    schemaVersion: "1.0.0-draft",
    phases: [
      { id: "understand", labelFr: "Comprendre" },
      { id: "before", labelFr: "Avant la vague" },
      { id: "during", labelFr: "Pendant la vague" },
      { id: "after", labelFr: "Après la vague" },
      { id: "prevent", labelFr: "Prévenir / réduire" }
    ],
    collections: [
      parseWaveCollection(tdahText, {
        id: "tdah-waves",
        titleFr: "Vagues TDAH",
        descriptionFr: "Dix modules pratiques associés au TDAH.",
        sourcePath: sources.tdah
      }),
      parseWaveCollection(psychologicalText, {
        id: "psychological-waves",
        titleFr: "Vagues psychologiques",
        descriptionFr: "Vingt modules transdiagnostiques d’auto-observation et de régulation.",
        sourcePath: sources.psychological
      })
    ]
  };

  await Promise.all([
    writeFile(join(output, "tests.json"), JSON.stringify(testsData, null, 2) + "\n"),
    writeFile(join(output, "waves.json"), JSON.stringify(wavesData, null, 2) + "\n")
  ]);

  console.log(`Tests: ${testsData.tests.length}, occurrences: ${testsData.source.occurrenceCount}, items canoniques: ${testsData.items.length}`);
  console.log(`Vagues: ${wavesData.collections.reduce((sum, collection) => sum + collection.modules.length, 0)} modules, ${wavesData.collections.reduce((sum, collection) => sum + collection.modules.flatMap((module) => module.pages).length, 0)} fiches`);
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}
