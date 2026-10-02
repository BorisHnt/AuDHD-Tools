import { existsSync, readFileSync } from "node:fs";

const fail = (message) => { throw new Error(message); };
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const frenchTests = read("site-data/tests.json");
const englishTests = read("site-data/en/tests.json");
const frenchWaves = read("site-data/waves.json");
const englishWaves = read("site-data/en/waves.json");

for (const path of [
  "fr/index.html", "en/index.html", "fr/tests/index.html", "en/tests/index.html",
  "fr/fiches/index.html", "en/fiches/index.html", "fr/documents/index.html", "en/documents/index.html",
  "fr/reglages/index.html", "en/reglages/index.html", "fr/confidentialite/index.html", "en/confidentialite/index.html",
  "fr/securite/index.html", "en/securite/index.html"
]) if (!existsSync(path)) fail(`Missing localized page: ${path}`);

for (const key of ["tests", "items", "concepts", "dimensions", "responseScales", "resultGroups"])
  if (frenchTests[key].length !== englishTests[key].length) fail(`Test data mismatch: ${key}`);
if (frenchWaves.collections.length !== englishWaves.collections.length) fail("Wave collection mismatch.");

let pages = 0;
for (let collectionIndex = 0; collectionIndex < frenchWaves.collections.length; collectionIndex += 1) {
  const frCollection = frenchWaves.collections[collectionIndex];
  const enCollection = englishWaves.collections[collectionIndex];
  if (frCollection.modules.length !== enCollection.modules.length) fail(`Module mismatch: ${frCollection.id}`);
  frCollection.modules.forEach((frModule, moduleIndex) => {
    const enModule = enCollection.modules[moduleIndex];
    if (frModule.id !== enModule.id || frModule.pages.length !== enModule.pages.length) fail(`Page mismatch: ${frModule.id}`);
    frModule.pages.forEach((frPage, pageIndex) => {
      const enPage = enModule.pages[pageIndex];
      pages += 1;
      if (frPage.contentLines.length !== enPage.contentLines.length) fail(`Line mismatch: ${frPage.id}`);
      frPage.contentLines.forEach((line, lineIndex) => {
        if (line.split("\t").length !== enPage.contentLines[lineIndex].split("\t").length)
          fail(`Table structure mismatch: ${frPage.id}, line ${lineIndex + 1}`);
        if ((line.match(/\[ \]/g) || []).length !== (enPage.contentLines[lineIndex].match(/\[ \]/g) || []).length)
          fail(`Checkbox structure mismatch: ${frPage.id}, line ${lineIndex + 1}`);
      });
    });
  });
}

const ui = read("site-data/en/ui.json");
if (Object.keys(ui).length < 250) fail("English interface dictionary is incomplete.");
console.log(`Localisation valide : ${englishTests.items.length} questions, ${pages} fiches et ${Object.keys(ui).length} textes d’interface.`);
