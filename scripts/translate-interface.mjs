import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const source = ["assets/main.js", "assets/pdf.js", "assets/result-guidance.js", "assets/scoring.js", "assets/store.js", "assets/portable.js"]
  .map((file) => readFileSync(file, "utf8")).join("\n");
const candidates = new Set();
const looksFrench = (value) => /[À-ÿ]|\b(?:le|la|les|un|une|des|de|du|et|ou|dans|sur|avec|pour|votre|vos|cette|ces|aucun|plus|pas|réponse|fiche|test|données|session|page|questionnaire|danger|rapport|sauvegarde|épisode|document|profil|méthode|annexe|source|dimension|caractéristique|repère|observation|résultat|calcul|indice|limite)\b/i.test(value);
const add = (value) => {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length > 1 && !text.includes("${") && !/[{}=]/.test(text) && looksFrench(text))
    candidates.add(text);
};
for (const match of source.matchAll(/>([^<>]+)</g)) add(match[1]);
for (const match of source.matchAll(/(["'])([^\n"']{2,})\1/g)) add(match[2]);

const values = [...candidates];
const translated = {};
const marker = (index) => `⟪${String(index).padStart(4, "0")}⟫`;
for (let offset = 0; offset < values.length;) {
  const batch = [];
  let characters = 0;
  while (offset < values.length && batch.length < 24 && characters + values[offset].length < 4200) {
    batch.push(values[offset++]);
    characters += batch.at(-1).length;
  }
  const input = batch.map((value, index) => `${marker(index)} ${value}`).join("\n");
  const raw = execFileSync("curl", [
    "-sS", "--get", "https://translate.googleapis.com/translate_a/single",
    "--data-urlencode", "client=gtx", "--data-urlencode", "sl=fr",
    "--data-urlencode", "tl=en", "--data-urlencode", "dt=t", "--data-urlencode", `q=${input}`
  ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  const output = JSON.parse(raw)[0].map((part) => part[0]).join("");
  const positions = [...output.matchAll(/⟪(\d{4})⟫\s*/g)];
  if (positions.length !== batch.length) throw new Error("Translation markers were not preserved.");
  positions.forEach((match, index) => {
    translated[batch[index]] = output.slice(match.index + match[0].length, positions[index + 1]?.index ?? output.length).replace(/\n$/, "").trim();
  });
  process.stdout.write(`\rInterface: ${offset}/${values.length}`);
}
process.stdout.write("\n");
writeFileSync("site-data/en/ui.json", `${JSON.stringify(translated, null, 2)}\n`);
