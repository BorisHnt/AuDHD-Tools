export const language = ["fr", "en", "ru"].includes(document.body.dataset.lang) ? document.body.dataset.lang : "fr";
export const locale = language === "en" ? "en-GB" : language === "ru" ? "ru-RU" : "fr-FR";

let dictionary = {};
let dictionaryLower = {};
export const setTranslations = (translations = {}) => {
  dictionary = translations;
  dictionaryLower = Object.fromEntries(Object.entries(translations).map(([key, value]) => [key.toLocaleLowerCase("fr"), value]));
};

const builtinEnglish = {
  "Accueil AuDHD Tools": "AuDHD Tools home",
  "Navigation principale": "Main navigation",
  "Fiches": "Worksheets",
  "Fiches interactives": "Interactive worksheets",
  "30 modules · 150 fiches": "30 modules · 150 worksheets",
  "Quelle vague traversez-vous ?": "What kind of wave are you experiencing?",
  "Mes documents": "My documents",
  "Voir mes documents →": "View my documents →",
  "Langue": "Language",
  "Français": "Français",
  "TDAH": "ADHD",
  "TSA": "ASD",
  "Comprendre · traverser · documenter": "Understand · navigate · document",
  "Des outils pour mieux comprendre votre fonctionnement": "Tools to better understand how you function",
  "Il ne pose aucun diagnostic": "It does not diagnose",
  "Trouver une fiche →": "Find a worksheet →",
  "Accéder aux fiches": "Go to worksheets",
  "Commencer": "Start",
  "Nouveau": "New",
  "Reprendre": "Resume",
  "Suivante": "Next",
  "Passer pour l’instant": "Skip for now",
  "← Précédente": "← Previous",
  "Voir la synthèse": "View summary",
  "Je ne sais pas": "I don’t know",
  "Non applicable": "Not applicable",
  "non applicables": "not applicable",
  "Affichage prudent :": "Cautious display:",
  "Aucun concept applicable": "No applicable concepts",
  "Affichage": "Display",
  "Normale": "Normal",
  "Grande": "Large",
  "Contraste": "Contrast",
  "Clair": "Light",
  "Sombre": "Dark",
  "Confortable": "Comfortable",
  "Compacte": "Compact",
  "Confirmer": "Confirm",
  "Exporter .AuDHD": "Export .AuDHD",
  "Importer .AuDHD": "Import .AuDHD",
  "Transparence": "Transparency",
  "Stockage local facultatif": "Optional local storage",
  "Fichiers sensibles": "Sensitive files",
  "Persistance actuelle :": "Current storage:",
  "sauvegarde locale autorisée": "local storage enabled",
  "sauvegarde locale autorisée.": "local storage enabled.",
  "session temporaire limitée à cet onglet": "temporary session limited to this tab",
  "session temporaire limitée à cet onglet.": "temporary session limited to this tab.",
  "Sécurité prioritaire": "Safety first",
  "Dire": "Tell someone",
  "S’éloigner": "Move away",
  "Contacter": "Contact help",
  "Rejoindre": "Reach safety",
  "Transmettre": "Share key information",
  "En France : 15 ou 112 en danger immédiat ; 3114 pour la prévention du suicide ; 114 pour l’urgence accessible.": "In France: 15 or 112 for immediate danger; 3114 for suicide prevention; 114 for accessible emergency services.",
  "Retour aux modules": "Back to worksheets",
  "Ouvrir": "Open",
  "Complet": "Complete",
  "En cours": "In progress",
  "Épisode local": "Local episode",
  "Carte de crise": "Crisis card",
  "Aucune fiche sélectionnée.": "No worksheet selected.",
  "Profil descriptif": "Descriptive profile",
  "Rapport d’épisode": "Episode report",
  "Fiches imprimables": "Printable worksheets",
  "Fiches remplies": "Completed worksheets",
  "Choisir une fiche": "Choose a worksheet",
  "Gérer maintenant": "Manage it now",
  "Voir les 5 fiches": "View all 5 worksheets",
  "Les cinq fiches": "The five worksheets",
  "Remplie": "Completed",
  "À lire": "Read",
  "Non commencée": "Not started",
  "Mode crise": "Crisis mode",
  "Plan de sécurité": "Safety plan",
  "Nouvel épisode": "New episode",
  "Commencer un épisode": "Start an episode",
  "Réponse": "Answer",
  "Réglages": "Settings",
  "Passée pour l’instant": "Skipped for now",
  "Aucun état actuel renseigné dans la fiche Pendant la vague.": "No current status has been entered in the During the wave worksheet.",
  "15 ou 112 · 3114 · rejoindre une aide humaine et ne pas rester isolé": "15 or 112 · 3114 · reach a trusted person and do not remain alone",
  "Sélectionnez au moins une fiche.": "Select at least one worksheet.",
  "Aucune fiche remplie à exporter.": "There are no completed worksheets to export.",
  "Ce fichier est protégé. Saisissez son mot de passe :": "This file is protected. Enter its password:",
  "Import impossible.": "Could not import the file."
};
const builtinEnglishLower = Object.fromEntries(Object.entries(builtinEnglish).map(([key, value]) => [key.toLocaleLowerCase("fr"), value]));
const builtinRussian = {
  "Français": "Français",
  "English": "English",
  "Русский (Beta)": "Русский (Beta)",
  "TDAH": "СДВГ",
  "TSA": "РАС"
};
const builtinRussianLower = Object.fromEntries(Object.entries(builtinRussian).map(([key, value]) => [key.toLocaleLowerCase("fr"), value]));

const translateEmbeddedFrench = (text) => [
  [/Rapport complet \+ réponses/gi, "Full report + answers"],
  [/Rapport synthétique/gi, "Summary report"],
  [/Rapport d’épisode/gi, "Episode report"],
  [/rapport descriptif/gi, "descriptive report"],
  [/Session commencée le/gi, "Session started on"],
  [/Épisode commencé le/gi, "Episode started on"],
  [/dernière modification le/gi, "last updated on"],
  [/exportée le/gi, "exported on"],
  [/export le/gi, "exported on"],
  [/carte générée le/gi, "card generated on"],
  [/questions traitées/gi, "questions answered"],
  [/Réponses calculables/gi, "Scorable answers"],
  [/Je ne sais pas/gi, "I don’t know"],
  [/Non applicables/gi, "Not applicable"],
  [/Sans réponse/gi, "Unanswered"],
  [/Contexte/gi, "Context"],
  [/Traitement contextuel/gi, "Contextual processing"],
  [/réponses analysées/gi, "answers analysed"],
  [/Réponse\s*:/gi, "Answer:"],
  [/à discuter/gi, "to discuss"],
  [/cette version contient moins de/gi, "this version contains fewer than"],
  [/concepts distincts/gi, "distinct concepts"],
  [/Non explorée dans cette version/gi, "Not explored in this version"],
  [/Fiche (\d+)\/5/gi, "Worksheet $1/5"],
  [/Épisode\s*:/gi, "Episode:"],
  [/Notes personnelles/gi, "Personal notes"],
  [/Sources publiques/gi, "Public sources"],
  [/phase documentée/gi, "documented phase"],
  [/phases documentées/gi, "documented phases"],
  [/informations personnelles/gi, "personal details"],
  [/information personnelle/gi, "personal detail"],
  [/\bsuite\b/gi, (match) => match === match.toLocaleUpperCase("fr") ? "CONTINUED" : "continued"],
  [/ÉTAT ET REPÈRES RENSEIGNÉS/gi, "RECORDED STATUS AND MARKERS"],
  [/MAINTENANT — UNE ACTION À LA FOIS/gi, "NOW — ONE ACTION AT A TIME"],
  [/MES REPÈRES OU OUTILS CHOISIS/gi, "MY SELECTED MARKERS OR TOOLS"]
].reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);

const translateEmbeddedRussian = (text) => [
  [/Rapport complet \+ réponses/gi, "Полный отчёт + ответы"],
  [/Rapport synthétique/gi, "Краткий отчёт"],
  [/Rapport d’épisode/gi, "Отчёт об эпизоде"],
  [/rapport descriptif/gi, "описательный отчёт"],
  [/Session commencée le/gi, "Сеанс начат"],
  [/Épisode commencé le/gi, "Эпизод начат"],
  [/dernière modification le/gi, "последнее изменение"],
  [/exportée le/gi, "экспортировано"],
  [/export le/gi, "экспортировано"],
  [/carte générée le/gi, "карта создана"],
  [/questions traitées/gi, "обработано вопросов"],
  [/Réponses calculables/gi, "Ответы для расчёта"],
  [/Je ne sais pas/gi, "Не знаю"],
  [/Non applicables/gi, "Неприменимо"],
  [/Sans réponse/gi, "Без ответа"],
  [/Contexte/gi, "Контекст"],
  [/Traitement contextuel/gi, "Контекстный анализ"],
  [/réponses analysées/gi, "проанализировано ответов"],
  [/Réponse\s*:/gi, "Ответ:"],
  [/à discuter/gi, "для обсуждения"],
  [/cette version contient moins de/gi, "в этой версии менее"],
  [/concepts distincts/gi, "различных концепций"],
  [/Non explorée dans cette version/gi, "Не исследуется в этой версии"],
  [/Fiche (\d+)\/5/gi, "Рабочий лист $1/5"],
  [/Épisode\s*:/gi, "Эпизод:"],
  [/Notes personnelles/gi, "Личные заметки"],
  [/Sources publiques/gi, "Открытые источники"],
  [/Données insuffisantes/gi, "Недостаточно данных"],
  [/CARTE DE CRISE/gi, "КРИЗИСНАЯ КАРТА"],
  [/Export\s*:/gi, "Экспорт:"],
  [/phases? documentées?/gi, "задокументированных этапов"],
  [/informations? personnelles?/gi, "личных сведений"],
  [/\bsuite\b/gi, (match) => match === match.toLocaleUpperCase("fr") ? "ПРОДОЛЖЕНИЕ" : "продолжение"],
  [/ÉTAT ET REPÈRES RENSEIGNÉS/gi, "ЗАПИСАННЫЕ СОСТОЯНИЕ И ОРИЕНТИРЫ"],
  [/MAINTENANT — UNE ACTION À LA FOIS/gi, "СЕЙЧАС — ПО ОДНОМУ ДЕЙСТВИЮ"],
  [/MES REPÈRES OU OUTILS CHOISIS/gi, "МОИ ВЫБРАННЫЕ ОРИЕНТИРЫ ИЛИ ИНСТРУМЕНТЫ"]
].reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text);

const dynamicEnglish = (text) => {
  const rules = [
    [/^Commencer (.+)$/, "Start $1"],
    [/^Reprendre la fiche du (.+)$/, "Resume the worksheet from $1"],
    [/^Reprendre (.+)$/, "Resume $1"],
    [/^Créer une nouvelle session (.+)$/, "Create a new $1 session"],
    [/^Progression dans (.+)$/, "$1 progress"],
    [/^Indice descriptif (.+) sur 4$/, "Descriptive score $1 out of 4"],
    [/^(\d+) questions · (\d+) thèmes$/, "$1 questions · $2 themes"],
    [/^(\d+)\/(\d+) traitées$/, "$1/$2 answered"],
    [/^(.+) · question (\d+) sur (\d+)$/, "$1 · question $2 of $3"],
    [/^Question (\d+) sur (\d+)$/, "Question $1 of $2"],
    [/^(\d+) réponses analysées · (\d+) éléments? à discuter$/, "$1 answers analysed · $2 item(s) to discuss"],
    [/^Non calculé dans (.+) : moins de (\d+) concepts distincts$/, "Not calculated in $1: fewer than $2 distinct concepts"],
    [/^Traitement contextuel : (\d+)\/(\d+) réponses analysées · (\d+) éléments? à discuter$/, "Contextual processing: $1/$2 answers analysed · $3 item(s) to discuss"],
    [/^Couverture conceptuelle : Aucun concept applicable$/, "Concept coverage: no applicable concepts"],
    [/^Couverture conceptuelle : (.+)$/, "Concept coverage: $1"],
    [/^(\d+)\/(\d+) concepts applicables$/, "$1/$2 applicable concepts"],
    [/^Voir le détail des concepts \((\d+)\)$/, "View concept details ($1)"],
    [/^(\d+)\/(\d+) formulations?$/, "$1/$2 wordings"],
    [/^Reprendre la fiche du (.+)$/, "Resume the worksheet from $1"],
    [/^Épisode du (.+)$/, "Episode from $1"],
    [/^(.+) · module (\d+)$/, "$1 · module $2"],
    [/^Fiche (\d+) sur 5$/, "Worksheet $1 of 5"],
    [/^Sources publiques de cette fiche \((\d+)\)$/, "Public sources for this worksheet ($1)"],
    [/^(\d+) questions traitées · commencé le (.+)$/, "$1 questions answered · started $2"],
    [/^(\d+)\/(\d+) questions traitées · commencé le (.+)$/, "$1/$2 questions answered · started $3"],
    [/^Générer le rapport synthétique (.+) du (.+)$/, "Generate the $1 summary report from $2"],
    [/^Générer le rapport complet (.+) du (.+)$/, "Generate the $1 full report from $2"],
    [/^Réponse : (.+)$/, "Answer: $1"],
    [/^(\d+) fiches? remplies? · (.+)$/, "$1 completed worksheet(s) · $2"]
  ];
  for (const [pattern, replacement] of rules)
    if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
};

const russianPlural = (value, one, few, many) => {
  const number = Number(value);
  if (number % 10 === 1 && number % 100 !== 11) return one;
  if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return few;
  return many;
};
const dynamicRussian = (text) => {
  const rules = [
    [/^(\d+) phases? documentées? · (\d+) informations? personnelles?\.?$/, (_match, phases, details) => `${phases} ${russianPlural(phases, "задокументированный этап", "задокументированных этапа", "задокументированных этапов")} · ${details} ${russianPlural(details, "личное сведение", "личных сведения", "личных сведений")}.`],
    [/^Commencer (.+)$/, "Начать: $1"],
    [/^Reprendre la fiche du (.+)$/, "Продолжить рабочий лист от $1"],
    [/^Reprendre (.+)$/, "Продолжить: $1"],
    [/^Créer une nouvelle session (.+)$/, "Создать новый сеанс: $1"],
    [/^Progression dans (.+)$/, "Ход заполнения: $1"],
    [/^Indice descriptif (.+) sur 4$/, "Описательный индекс $1 из 4"],
    [/^(\d+) questions · (\d+) thèmes$/, "$1 вопросов · $2 тем"],
    [/^(\d+)\/(\d+) traitées$/, "Обработано: $1/$2"],
    [/^(.+) · question (\d+) sur (\d+)$/, "$1 · вопрос $2 из $3"],
    [/^Question (\d+) sur (\d+)$/, "Вопрос $1 из $2"],
    [/^(\d+) réponses analysées · (\d+) éléments? à discuter$/, "Проанализировано ответов: $1 · для обсуждения: $2"],
    [/^Non calculé dans (.+) : moins de (\d+) concepts distincts$/, "Не рассчитано в $1: менее $2 различных концепций"],
    [/^Traitement contextuel : (\d+)\/(\d+) réponses analysées · (\d+) éléments? à discuter$/, "Контекстный анализ: $1/$2 ответов · для обсуждения: $3"],
    [/^Couverture conceptuelle : Aucun concept applicable$/, "Охват концепций: применимых концепций нет"],
    [/^Couverture conceptuelle : (.+)$/, "Охват концепций: $1"],
    [/^(\d+)\/(\d+) concepts applicables$/, "$1/$2 применимых концепций"],
    [/^Voir le détail des concepts \((\d+)\)$/, "Подробнее о концепциях ($1)"],
    [/^(\d+)\/(\d+) formulations?$/, "$1/$2 формулировок"],
    [/^Épisode du (.+)$/, "Эпизод от $1"],
    [/^(.+) · module (\d+)$/, "$1 · модуль $2"],
    [/^Fiche (\d+) sur 5$/, "Рабочий лист $1 из 5"],
    [/^Sources publiques de cette fiche \((\d+)\)$/, "Открытые источники для этого листа ($1)"],
    [/^(\d+) questions traitées · commencé le (.+)$/, "Обработано вопросов: $1 · начато $2"],
    [/^(\d+)\/(\d+) questions traitées · commencé le (.+)$/, "Обработано вопросов: $1/$2 · начато $3"],
    [/^Générer le rapport synthétique (.+) du (.+)$/, "Создать краткий отчёт $1 от $2"],
    [/^Générer le rapport complet (.+) du (.+)$/, "Создать полный отчёт $1 от $2"],
    [/^Réponse : (.+)$/, "Ответ: $1"],
    [/^(\d+) fiches? remplies? · (.+)$/, "Заполнено листов: $1 · $2"]
  ];
  for (const [pattern, replacement] of rules)
    if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
};

export const tr = (value) => {
  if (language === "fr" || typeof value !== "string") return value;
  const text = value.replace(/\s+/g, " ").trim();
  const builtin = language === "en" ? builtinEnglish : builtinRussian;
  const builtinLower = language === "en" ? builtinEnglishLower : builtinRussianLower;
  const exact = builtin[text] || dictionary[text];
  if (exact) return exact;
  const lower = text.toLocaleLowerCase("fr");
  const insensitive = builtinLower[lower] || dictionaryLower[lower];
  if (insensitive) return text === text.toLocaleUpperCase("fr") ? insensitive.toLocaleUpperCase(locale) : insensitive;
  return language === "en" ? translateEmbeddedFrench(dynamicEnglish(text)) : translateEmbeddedRussian(dynamicRussian(text));
};

const translateTextNode = (node) => {
  const original = node.nodeValue || "";
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  const translated = tr(original);
  if (translated !== original.trim()) node.nodeValue = `${leading}${translated}${trailing}`;
};

export const translatePage = (root) => {
  if (language === "fr") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
  root.querySelectorAll("[aria-label], [aria-valuetext], [placeholder], [title]").forEach((element) => {
    for (const attribute of ["aria-label", "aria-valuetext", "placeholder", "title"])
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, tr(element.getAttribute(attribute)));
  });
};

export const counterpartUrl = (targetLanguage) => {
  const url = new URL(window.location.href);
  const pattern = /\/(?:fr|en|ru)(?=\/|$)/;
  url.pathname = pattern.test(url.pathname)
    ? url.pathname.replace(pattern, `/${targetLanguage}`)
    : (() => {
        const siteRoot = new URL(document.body.dataset.root || "./", document.baseURI);
        const relative = url.pathname.startsWith(siteRoot.pathname) ? url.pathname.slice(siteRoot.pathname.length) : "";
        return `${siteRoot.pathname}${targetLanguage}/${relative}`;
      })();
  return url.href;
};

export const localizePdfDocument = (doc) => {
  if (language === "fr") return doc;
  const split = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = (text, ...args) => split(tr(String(text)), ...args);
  const write = doc.text.bind(doc);
  doc.text = (text, ...args) => write(Array.isArray(text) ? text.map((line) => tr(line)) : tr(String(text)), ...args);
  return doc;
};
