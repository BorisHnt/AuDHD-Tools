import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const sourceFiles = ["site-data/tests.json", "site-data/waves.json"];
const outputDirectory = "site-data/en";
const marker = (index) => `⟪${String(index).padStart(4, "0")}⟫`;

const translateBatch = (values) => {
  const input = values.map((value, index) => `${marker(index)} ${value}`).join("\n");
  const raw = execFileSync("curl", [
    "-sS", "--get", "https://translate.googleapis.com/translate_a/single",
    "--data-urlencode", "client=gtx", "--data-urlencode", "sl=fr",
    "--data-urlencode", "tl=en", "--data-urlencode", "dt=t",
    "--data-urlencode", `q=${input}`
  ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  const translated = JSON.parse(raw)[0].map((part) => part[0]).join("");
  const positions = [...translated.matchAll(/⟪(\d{4})⟫\s*/g)];
  if (positions.length !== values.length)
    throw new Error(`Expected ${values.length} translations, received ${positions.length}.`);
  return positions.map((match, index) => translated
    .slice(match.index + match[0].length, positions[index + 1]?.index ?? translated.length)
    .replace(/\n$/, "").trim());
};

const collectTargets = (value, targets) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectTargets(entry, targets));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && key.endsWith("Fr"))
      targets.push({ value: entry, set: (translation) => { value[key] = translation; } });
    else if (key === "contentLines" && Array.isArray(entry))
      entry.forEach((line, index) => {
        const parts = line.split("\t");
        const translatedParts = [...parts];
        parts.forEach((part, partIndex) => targets.push({
          value: part,
          set: (translation) => {
            translatedParts[partIndex] = translation;
            entry[index] = translatedParts.join("\t");
          }
        }));
      });
    else collectTargets(entry, targets);
  }
};

mkdirSync(outputDirectory, { recursive: true });
for (const file of sourceFiles) {
  const document = JSON.parse(readFileSync(file, "utf8"));
  const targets = [];
  collectTargets(document, targets);
  const unique = [...new Set(targets.map((target) => target.value))];
  const translations = new Map();
  let batch = [];
  let characters = 0;
  const flush = () => {
    if (!batch.length) return;
    const translated = translateBatch(batch);
    batch.forEach((value, index) => translations.set(value, translated[index]));
    process.stdout.write(`\r${file}: ${translations.size}/${unique.length}`);
    batch = [];
    characters = 0;
  };
  for (const value of unique) {
    if (batch.length >= 24 || characters + value.length > 4200) flush();
    batch.push(value);
    characters += value.length;
  }
  flush();
  process.stdout.write("\n");
  translations.set("TSA 100", "ASD 100");
  translations.set("TSA 250", "ASD 250");
  translations.set("Impulsion difficile à retenir", "Impulse that is hard to resist");
  translations.set("Crise d’auto-dévalorisation", "Self-devaluation crisis");
  translations.set("Sentiment d’imposture", "Impostor feelings");
  translations.set("Culpabilité envahissante", "Overwhelming guilt");
  translations.set("Vague dépressive et idées passives de disparition", "Depressive wave and passive thoughts of disappearing");
  targets.forEach((target) => target.set(translations.get(target.value)));
  writeFileSync(`${outputDirectory}/${file.split("/").pop()}`, `${JSON.stringify(document, null, 2)}\n`);
}
