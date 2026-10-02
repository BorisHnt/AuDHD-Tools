import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const pages = [
  ["index.html", "home", "AuDHD Tools"],
  ["tests/index.html", "tests", "Questionnaires — AuDHD Tools"],
  ["tests/questionnaire.html", "test", "Questionnaire — AuDHD Tools", true],
  ["tests/resultats.html", "results", "Résultats — AuDHD Tools", true],
  ["fiches/index.html", "waves", "Fiches interactives — AuDHD Tools"],
  ["fiches/module.html", "wave-module", "Fiche — AuDHD Tools", true],
  ["documents/index.html", "documents", "Mes documents — AuDHD Tools", true],
  ["reglages/index.html", "settings", "Réglages — AuDHD Tools"],
  ["confidentialite/index.html", "privacy", "Confidentialité — AuDHD Tools"],
  ["securite/index.html", "safety", "Sécurité — AuDHD Tools"]
];

const englishTitles = {
  tests: "Questionnaires — AuDHD Tools", test: "Questionnaire — AuDHD Tools",
  results: "Results — AuDHD Tools", waves: "Interactive worksheets — AuDHD Tools",
  "wave-module": "Worksheet — AuDHD Tools", documents: "My documents — AuDHD Tools",
  settings: "Settings — AuDHD Tools", privacy: "Privacy — AuDHD Tools",
  safety: "Safety — AuDHD Tools"
};

for (const lang of ["fr", "en"]) {
  for (const [path, page, frenchTitle, pdf] of pages) {
    const nested = path.includes("/");
    const assetRoot = nested ? "../../" : "../";
    const siteRoot = nested ? "../" : "./";
    const description = lang === "fr"
      ? "Outils privés d’auto-observation pour les personnes concernées par le TDAH, le TSA ou l’AuDHD."
      : "Private self-observation tools for people with ADHD, autism or AuDHD.";
    const html = `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="#f7f7f2" />
    <link rel="manifest" href="${assetRoot}manifest.webmanifest" />
    <link rel="icon" href="${assetRoot}icon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="${assetRoot}assets/styles.css" />
    <title>${lang === "en" ? englishTitles[page] || "AuDHD Tools" : frenchTitle}</title>
  </head>
  <body data-page="${page}" data-lang="${lang}" data-root="${siteRoot}" data-assets-root="${assetRoot}">
    <a class="skip-link" href="#main-content">${lang === "fr" ? "Aller au contenu" : "Skip to content"}</a>
    <div id="app" aria-live="polite"></div>
    <noscript>${lang === "fr" ? "Ce site a besoin de JavaScript pour les formulaires interactifs et la génération locale des PDF." : "This site requires JavaScript for interactive forms and local PDF generation."}</noscript>
    ${pdf ? `<script src="${assetRoot}assets/vendor/jspdf.umd.min.js"></script>\n    ` : ""}<script type="module" src="${assetRoot}assets/main.js"></script>
  </body>
</html>
`;
    const destination = `${lang}/${path}`;
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, html);
  }
}
