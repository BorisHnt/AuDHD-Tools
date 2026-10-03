import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const targetLanguage = process.argv[2] || "en";
if (!/^(en|ru)$/.test(targetLanguage)) throw new Error("Usage: node scripts/translate-interface.mjs [en|ru]");
const russianOverrides = {
  "TDAH": "СДВГ",
  "TSA": "РАС",
  "Fiches": "Рабочие листы",
  "Fiches interactives": "Интерактивные рабочие листы",
  "30 modules · 150 fiches": "30 модулей · 150 рабочих листов",
  "30 modules et 150 fiches pour agir avant, pendant ou après une vague.": "30 модулей и 150 рабочих листов для действий до, во время и после волны.",
  "5 fiches : comprendre, avant, pendant, après et prévenir.": "5 рабочих листов: понять, подготовиться, пройти волну, восстановиться и снизить риск повторения.",
  "Accéder aux fiches": "Перейти к рабочим листам",
  "Trouver une fiche →": "Найти рабочий лист →",
  "Choisir une fiche": "Выбрать рабочий лист",
  "Voir les 5 fiches": "Открыть 5 рабочих листов",
  "Les cinq fiches": "Пять рабочих листов",
  "Fiches remplies": "Заполненные рабочие листы",
  "Fiches imprimables": "Рабочие листы для печати",
  "Fiches complètes imprimables": "Полные рабочие листы для печати",
  "Générer les fiches sélectionnées": "Создать выбранные рабочие листы",
  "Les sources publiques utilisées pour cette fiche sont détaillées ci-dessous.": "Ниже приведены открытые источники, использованные при подготовке этого рабочего листа.",
  "Commencez un épisode pour remplir et sauvegarder cette fiche.": "Начните эпизод, чтобы заполнить и сохранить этот рабочий лист.",
  "Notes personnelles pour cette fiche": "Личные заметки к этому рабочему листу",
  "Retrouvez vos tests et vos fiches remplies, puis générez leur PDF à la demande.": "Найдите свои опросники и заполненные рабочие листы, а затем при необходимости создайте их PDF-версии.",
  "Les questionnaires et fiches facilitent l’auto-observation et la préparation d’une consultation. Ils ne remplacent ni un diagnostic, ni un traitement, ni une aide urgente.": "Опросники и рабочие листы помогают наблюдать за своим состоянием и подготовиться к консультации. Они не заменяют диагностику, лечение или экстренную помощь.",
  "Cette fiche est introuvable.": "Этот рабочий лист не найден.",
  "Sélectionnez au moins une fiche.": "Выберите хотя бы один рабочий лист.",
  "Aucune fiche remplie à exporter.": "Нет заполненных рабочих листов для экспорта.",
  "Aucune fiche sélectionnée.": "Рабочий лист не выбран.",
  "PDF synthétique": "Краткий PDF-отчёт",
  "PDF complet + réponses": "Полный PDF-отчёт с ответами",
  "Rapport synthétique": "Краткий отчёт",
  "rapport synthétique": "краткий отчёт",
  "Rapport complet + réponses": "Полный отчёт с ответами",
  "Rapport d’épisode": "Отчёт об эпизоде",
  "Carte de crise": "Кризисная карта",
  "Résumé de l’épisode": "Краткое описание эпизода",
  "Mes repères ou outils choisis": "Мои выбранные ориентиры и инструменты",
  "Aucun état actuel renseigné dans la fiche Pendant la vague.": "В рабочем листе «Во время волны» текущее состояние не указано.",
  "15 ou 112 · 3114 · rejoindre une aide humaine et ne pas rester isolé": "112 — экстренная помощь · 103 — скорая помощь · +7 (495) 989-50-50 — психологическая помощь МЧС России",
  "Tests descriptifs, documents et fiches interactives pour les personnes concernées par le TDAH, le TSA ou l’AuDHD.": "Описательные тесты, документы и интерактивные рабочие листы для людей с СДВГ, РАС или AuDHD.",
  "Retrouver les tests et fiches conservés sur cet appareil, puis générer leurs PDF.": "Найти сохранённые на этом устройстве опросники и рабочие листы, а затем создать PDF-отчёты.",
  "Pour une consultation, le PDF complet ajoute toutes les questions, les réponses brutes et les points à explorer. Il reste utile d’apporter des exemples précis, des éléments de l’enfance et, si possible, le regard d’un proche ou des documents anciens.": "Полный PDF-отчёт для консультации содержит все вопросы, исходные ответы и темы для обсуждения. Полезно также подготовить конкретные примеры, сведения о детстве и, если возможно, наблюдения близкого человека или старые документы.",
  "Ce mode d’auto-aide ne remplace pas une aide humaine ou urgente.": "Этот режим самопомощи не заменяет поддержку другого человека или экстренную помощь.",
  "Si vous l’autorisez, les tests, fiches et préférences sont conservés dans le stockage local du navigateur. Sans cette autorisation, la progression utilise uniquement le stockage temporaire de l’onglet et disparaît à sa fermeture. Les données persistantes peuvent aussi disparaître lors d’un nettoyage, d’une navigation privée ou d’une désinstallation.": "Если вы дадите разрешение, опросники, рабочие листы и настройки будут храниться локально в браузере. Без разрешения прогресс сохраняется только во временном хранилище вкладки и исчезает после её закрытия. Постоянные данные также могут исчезнуть при очистке браузера, использовании приватного режима или удалении приложения.",
  "Ce fichier est protégé. Saisissez son mot de passe :": "Этот файл защищён. Введите пароль к нему:",
  "Éléments associés": "Сопутствующие особенности",
  "Réactions fortes ou coûteuses à certains sons, lumières, textures, odeurs ou autres stimulations.": "Выраженные или требующие значительных ресурсов реакции на определённые звуки, свет, текстуры, запахи и другие стимулы.",
  "La valeur sur 4 est une moyenne descriptive, jamais un pourcentage de TDAH ou de TSA. Plus elle est élevée, plus les situations couvertes par la dimension ont été déclarées fréquentes ou présentes.": "Значение по шкале от 0 до 4 — это описательное среднее, а не процент СДВГ или РАС. Чем оно выше, тем чаще отмечались ситуации, относящиеся к этой характеристике.",
  "Ces réponses sont présentées comme signaux de discussion et ne produisent aucun point TDAH ou TSA.": "Эти ответы выделены как темы для обсуждения и не добавляют баллов по СДВГ или РАС.",
  "Autres explications ou situations à examiner avec un professionnel ; ces réponses ne donnent aucun point TSA.": "Другие возможные объяснения или ситуации, которые стоит обсудить со специалистом; эти ответы не добавляют баллов по РАС.",
  "Sécurité prioritaire": "Безопасность прежде всего",
  "En France : 15 ou 112 en danger immédiat ; 3114 pour la prévention du suicide ; 114 pour l’urgence accessible.": "В России: при непосредственной опасности звоните 112; скорая медицинская помощь — 103; экстренная психологическая помощь МЧС России — +7 (495) 989-50-50.",
  "ne restez pas uniquement dans l’auto-aide. Éloignez-vous des moyens et personnes exposées, rejoignez un lieu sûr et contactez une aide humaine ou les services d’urgence.": "не ограничивайтесь самопомощью. Отойдите от опасных предметов, веществ и людей, которым может угрожать риск; перейдите в безопасное место и свяжитесь с близким человеком или экстренной службой.",
  "Mettre de la distance avec les moyens, substances, clés et lieux dangereux.": "Уберите подальше опасные предметы и вещества, ключи; покиньте опасное место.",
  "Une personne, un lieu de soin ou un espace sûr. Ne pas rester isolé si le danger est immédiat.": "Обратитесь к человеку, в медицинское учреждение или безопасное место. При непосредственной опасности не оставайтесь в одиночестве.",
  "SI DANGER, INTENTION, PERTE DE CONTRÔLE OU SYMPTÔME INQUIÉTANT": "ЕСЛИ ЕСТЬ ОПАСНОСТЬ, НАМЕРЕНИЕ, ПОТЕРЯ КОНТРОЛЯ ИЛИ ТРЕВОЖНЫЙ СИМПТОМ",
  "Appeler le 3114": "Позвонить в службу психологической помощи МЧС",
  "Ces coordonnées concernent la France. Ailleurs, utilisez les services d’urgence de votre pays.": "Эти контакты предназначены для России. В другой стране используйте местные экстренные службы.",
  "En cas de danger immédiat ou de perte de contrôle : 15 ou 112. En France, le 3114 répond gratuitement 24 h/24 pour la prévention du suicide.": "При непосредственной опасности или потере контроля звоните 112; для вызова скорой помощи — 103. Телефон экстренной психологической помощи МЧС России: +7 (495) 989-50-50.",
  "Outil d’auto-évaluation descriptif. Ce document ne constitue pas un diagnostic médical et ne présente aucune probabilité diagnostique validée.": "Инструмент описательной самооценки. Этот документ не является медицинским диагнозом и не показывает подтверждённую вероятность диагноза."
};
if (targetLanguage === "ru" && process.argv.includes("--review-only")) {
  const output = `site-data/${targetLanguage}/ui.json`;
  const translated = JSON.parse(readFileSync(output, "utf8"));
  Object.assign(translated, russianOverrides);
  writeFileSync(output, `${JSON.stringify(translated, null, 2)}\n`);
  process.stdout.write("Relecture de l’interface russe appliquée.\n");
  process.exit(0);
}
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
for (const match of readFileSync("assets/i18n.js", "utf8").matchAll(/^  "([^"]+)":/gm)) candidates.add(match[1]);

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
    "--data-urlencode", `tl=${targetLanguage}`, "--data-urlencode", "dt=t", "--data-urlencode", `q=${input}`
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
if (targetLanguage === "ru")
  Object.assign(translated, russianOverrides);
writeFileSync(`site-data/${targetLanguage}/ui.json`, `${JSON.stringify(translated, null, 2)}\n`);
