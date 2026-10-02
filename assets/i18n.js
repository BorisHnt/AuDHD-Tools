export const language = document.body.dataset.lang === "en" ? "en" : "fr";
export const locale = language === "en" ? "en-GB" : "fr-FR";

let dictionary = {};
export const setTranslations = (translations = {}) => { dictionary = translations; };

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
  "session temporaire limitée à cet onglet": "temporary session limited to this tab",
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
  "Réglages": "Settings"
};

const dynamicEnglish = (text) => {
  const rules = [
    [/^Commencer (.+)$/, "Start $1"],
    [/^Reprendre (.+)$/, "Resume $1"],
    [/^Créer une nouvelle session (.+)$/, "Create a new $1 session"],
    [/^Progression dans (.+)$/, "$1 progress"],
    [/^Indice descriptif (.+) sur 4$/, "Descriptive score $1 out of 4"],
    [/^(\d+) questions · (\d+) thèmes$/, "$1 questions · $2 themes"],
    [/^(\d+)\/(\d+) traitées$/, "$1/$2 answered"],
    [/^(.+) · question (\d+) sur (\d+)$/, "$1 · question $2 of $3"],
    [/^Question (\d+) sur (\d+)$/, "Question $1 of $2"],
    [/^(\d+) réponses analysées · (\d+) éléments? à discuter$/, "$1 answers analysed · $2 item(s) to discuss"],
    [/^(\d+)\/(\d+) concepts applicables$/, "$1/$2 applicable concepts"],
    [/^Voir le détail des concepts \((\d+)\)$/, "View concept details ($1)"],
    [/^(\d+)\/(\d+) formulations?$/, "$1/$2 wordings"],
    [/^Reprendre la fiche du (.+)$/, "Resume the worksheet from $1"],
    [/^Épisode du (.+)$/, "Episode from $1"],
    [/^(.+) · module (\d+)$/, "$1 · module $2"],
    [/^Fiche (\d+) sur 5$/, "Worksheet $1 of 5"],
    [/^Sources publiques de cette fiche \((\d+)\)$/, "Public sources for this worksheet ($1)"],
    [/^(\d+) questions traitées · commencé le (.+)$/, "$1 questions answered · started $2"],
    [/^(\d+) fiches? remplies? · (.+)$/, "$1 completed worksheet(s) · $2"]
  ];
  for (const [pattern, replacement] of rules)
    if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
};

export const tr = (value) => {
  if (language !== "en" || typeof value !== "string") return value;
  const text = value.replace(/\s+/g, " ").trim();
  return builtinEnglish[text] || dictionary[text] || dynamicEnglish(text);
};

const translateTextNode = (node) => {
  const original = node.nodeValue || "";
  const leading = original.match(/^\s*/)?.[0] || "";
  const trailing = original.match(/\s*$/)?.[0] || "";
  const translated = tr(original);
  if (translated !== original.trim()) node.nodeValue = `${leading}${translated}${trailing}`;
};

export const translatePage = (root) => {
  if (language !== "en") return;
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
  const pattern = language === "en" ? /\/en(?=\/|$)/ : /\/fr(?=\/|$)/;
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
  if (language !== "en") return doc;
  const split = doc.splitTextToSize.bind(doc);
  doc.splitTextToSize = (text, ...args) => split(tr(String(text)), ...args);
  const write = doc.text.bind(doc);
  doc.text = (text, ...args) => write(Array.isArray(text) ? text.map((line) => tr(line)) : tr(String(text)), ...args);
  return doc;
};
