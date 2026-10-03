import { existsSync, readFileSync } from "node:fs";

const fail = (message) => { throw new Error(message); };
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const frenchTests = read("site-data/tests.json");
const frenchWaves = read("site-data/waves.json");

for (const language of ["fr", "en", "ru"])
  for (const path of ["index.html", "tests/index.html", "tests/questionnaire.html", "tests/resultats.html", "fiches/index.html", "fiches/module.html", "documents/index.html", "reglages/index.html", "confidentialite/index.html", "securite/index.html"])
    if (!existsSync(`${language}/${path}`)) fail(`Missing localized page: ${language}/${path}`);

const summaries = [];
for (const language of ["en", "ru"]) {
  const localizedTests = read(`site-data/${language}/tests.json`);
  const localizedWaves = read(`site-data/${language}/waves.json`);
  for (const key of ["tests", "items", "concepts", "dimensions", "responseScales", "resultGroups"])
    if (frenchTests[key].length !== localizedTests[key].length) fail(`${language} test data mismatch: ${key}`);
  if (frenchWaves.collections.length !== localizedWaves.collections.length) fail(`${language} wave collection mismatch.`);

  let pages = 0;
  for (let collectionIndex = 0; collectionIndex < frenchWaves.collections.length; collectionIndex += 1) {
    const frCollection = frenchWaves.collections[collectionIndex];
    const localizedCollection = localizedWaves.collections[collectionIndex];
    if (frCollection.modules.length !== localizedCollection.modules.length) fail(`${language} module mismatch: ${frCollection.id}`);
    frCollection.modules.forEach((frModule, moduleIndex) => {
      const localizedModule = localizedCollection.modules[moduleIndex];
      if (frModule.id !== localizedModule.id || frModule.pages.length !== localizedModule.pages.length) fail(`${language} page mismatch: ${frModule.id}`);
      frModule.pages.forEach((frPage, pageIndex) => {
        const localizedPage = localizedModule.pages[pageIndex];
        pages += 1;
        if (frPage.contentLines.length !== localizedPage.contentLines.length) fail(`${language} line mismatch: ${frPage.id}`);
        if (localizedPage.lineKinds?.length !== localizedPage.contentLines.length) fail(`${language} line metadata mismatch: ${frPage.id}`);
        frPage.contentLines.forEach((line, lineIndex) => {
          if (line.split("\t").length !== localizedPage.contentLines[lineIndex].split("\t").length)
            fail(`${language} table structure mismatch: ${frPage.id}, line ${lineIndex + 1}`);
          if ((line.match(/\[ \]/g) || []).length !== (localizedPage.contentLines[lineIndex].match(/\[ \]/g) || []).length)
            fail(`${language} checkbox structure mismatch: ${frPage.id}, line ${lineIndex + 1}`);
        });
      });
    });
  }
  const ui = read(`site-data/${language}/ui.json`);
  if (Object.keys(ui).length < 250) fail(`${language} interface dictionary is incomplete.`);
  summaries.push(`${language}: ${localizedTests.items.length} questions, ${pages} fiches, ${Object.keys(ui).length} textes d’interface`);
}
console.log(`Localisation valide — ${summaries.join(" ; ")}.`);
