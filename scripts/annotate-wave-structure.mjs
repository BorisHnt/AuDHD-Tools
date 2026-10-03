import { existsSync, readFileSync, writeFileSync } from "node:fs";

const source = JSON.parse(readFileSync("site-data/waves.json", "utf8"));
const classify = (line) => {
  const value = line.trim();
  if (/^Protocole immédiat/i.test(value)) return "protocol-heading";
  if (/^(Menu de régulation|À suspendre|Critères de sortie|Questions d’analyse|Ligne du temps|Réparation|Mes signes|Vulnérabilités|Feu tricolore|Mon plan|Quand demander|Cycle typique|Déclencheurs fréquents|Manifestations possibles|Cinq piliers|Mes règles|Entraînement hebdomadaire|Indicateurs personnels)/i.test(value)) return "heading";
  if (/^(AVANT TOUT|SIGNAL DE SÉCURITÉ|DÉCLENCHEUR DU PLAN)/.test(value)) return "safety";
  if (/^À distinguer de/i.test(value)) return "distinguish";
  if (/^DÉFINITION DE TRAVAIL/.test(value)) return "definition";
  if (/^Repères publics/.test(value)) return "references";
  if (/^(PASSAGE À L’ÉTAPE SUIVANTE|CONCLUSION DU MODULE)/.test(value)) return "note";
  return "content";
};

for (const language of ["en", "ru"]) {
  const path = `site-data/${language}/waves.json`;
  if (!existsSync(path)) continue;
  const localized = JSON.parse(readFileSync(path, "utf8"));
  source.collections.forEach((collection, collectionIndex) => collection.modules.forEach((module, moduleIndex) => module.pages.forEach((page, pageIndex) => {
    localized.collections[collectionIndex].modules[moduleIndex].pages[pageIndex].lineKinds = page.contentLines.map(classify);
  })));
  writeFileSync(path, `${JSON.stringify(localized, null, 2)}\n`);
  console.log(`${language}: structure de ${localized.collections.flatMap((collection) => collection.modules.flatMap((module) => module.pages)).length} fiches annotée.`);
}
