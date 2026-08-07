import "./styles.css";
import { exportTestPdf, exportWavePdf } from "./pdf";
import { createPortableFile, downloadText, readPortableFile } from "./portable";
import { scoreTest } from "./scoring";
import {
  clearAllLocalData,
  createTestSession,
  createWaveEpisode,
  getState,
  getStorageConsent,
  getTestSession,
  getWaveEpisode,
  isPersistent,
  replaceState,
  setStorageConsent,
  updatePreferences,
  updateTestSession,
  updateWaveField
} from "./store";
import type {
  Answer,
  TestItem,
  TestManifest,
  TestsData,
  WaveCollection,
  WaveEpisode,
  WaveModule,
  WavePage,
  WavesData
} from "./types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("Conteneur d’application introuvable.");

const base = import.meta.env.BASE_URL;
const [testsData, wavesData] = await Promise.all([
  fetch(`${base}data/tests.json`).then((response) => response.json() as Promise<TestsData>),
  fetch(`${base}data/waves.json`).then((response) => response.json() as Promise<WavesData>)
]);

const itemMap = new Map(testsData.items.map((item) => [item.itemId, item]));
const scaleMap = new Map(testsData.responseScales.map((scale) => [scale.id, scale]));

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatDate = (value: string) => new Date(value).toLocaleString("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short"
});

const applyPreferences = () => {
  const preferences = getState().preferences;
  document.documentElement.dataset.fontScale = preferences.fontScale;
  document.documentElement.dataset.contrast = preferences.contrast;
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.density = preferences.density;
  document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion);
};

const navigate = (path: string) => {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
};

const parseRoute = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path = "/", queryString = ""] = raw.split("?");
  return {
    segments: path.split("/").filter(Boolean),
    query: new URLSearchParams(queryString)
  };
};

const icon = (name: "tests" | "documents" | "waves" | "privacy") => ({
  tests: "◇",
  documents: "▤",
  waves: "≈",
  privacy: "⌂"
}[name]);

const layout = (content: string) => `
  <header class="site-header">
    <a class="brand" href="#/" aria-label="Accueil AuDHD Tools"><span class="brand-mark">A</span><span>AuDHD Tools</span></a>
    <nav aria-label="Navigation principale">
      <a href="#/tests">Tests</a>
      <a href="#/waves">Fiches</a>
      <a href="#/documents">Documents</a>
      <a href="#/settings" aria-label="Réglages">Réglages</a>
    </nav>
  </header>
  <main id="main-content" tabindex="-1">${content}</main>
  <footer>
    <p><strong>AuDHD Tools</strong> — données conservées uniquement sur cet appareil.</p>
    <p><a href="#/privacy">Confidentialité et limites</a> · <a href="#/waves">Accéder aux fiches</a></p>
  </footer>
  ${getStorageConsent() ? "" : consentDialog()}
`;

const consentDialog = () => `
  <div class="modal-backdrop" role="presentation">
    <section class="modal" role="dialog" aria-modal="true" aria-labelledby="storage-title">
      <p class="eyebrow">Confidentialité</p>
      <h2 id="storage-title">Vos données restent sur votre appareil</h2>
      <p>Ce site ne possède aucune base de données et n’envoie pas vos réponses à un serveur. Vous pouvez autoriser leur sauvegarde dans le stockage local de ce navigateur ou continuer sans sauvegarde persistante.</p>
      <div class="button-row">
        <button class="button primary" data-action="storage-consent" data-value="yes">Autoriser la sauvegarde locale</button>
        <button class="button secondary" data-action="storage-consent" data-value="no">Continuer sans sauvegarder</button>
      </div>
      <p class="fine-print">Les données du navigateur peuvent être effacées par celui-ci. Utilisez un fichier .AuDHD pour créer une sauvegarde portable.</p>
    </section>
  </div>
`;

const homeView = () => {
  const latestTest = getState().testSessions[0];
  const latestWave = getState().waveEpisodes[0];
  const resume = latestTest || latestWave ? `
    <section class="resume-panel" aria-labelledby="resume-title">
      <div><p class="eyebrow">Reprendre</p><h2 id="resume-title">Votre dernière activité</h2></div>
      ${latestTest ? `<a class="button secondary" href="#/test/${latestTest.id}">${escapeHtml(testsData.tests.find((test) => test.id === latestTest.testId)?.titleFr)} · question ${latestTest.cursor + 1}</a>` : ""}
      ${latestWave ? `<a class="button secondary" href="#/waves/${latestWave.collectionId}/${latestWave.moduleId}?episode=${latestWave.id}">Reprendre la fiche du ${escapeHtml(formatDate(latestWave.updatedAt))}</a>` : ""}
    </section>` : "";
  return `
    <section class="hero">
      <p class="eyebrow">Comprendre · traverser · documenter</p>
      <h1>Des outils pour mieux comprendre votre fonctionnement</h1>
      <p class="lead">Tests descriptifs, documents et fiches interactives pour les personnes concernées par le TDAH, le TSA ou l’AuDHD.</p>
      <div class="notice calm"><strong>Sans compte et sans serveur de données.</strong> Vos réponses restent dans votre navigateur.</div>
    </section>
    ${resume}
    <section class="feature-grid" aria-label="Catégories principales">
      <a class="feature-card tests" href="#/tests"><span class="feature-icon">${icon("tests")}</span><h2>Tests</h2><p>Quatre questionnaires descriptifs de 100 ou 250 questions.</p><span class="text-link">Choisir un test →</span></a>
      <a class="feature-card waves" href="#/waves"><span class="feature-icon">${icon("waves")}</span><h2>Fiches interactives</h2><p>30 modules et 150 fiches pour agir avant, pendant ou après une vague.</p><span class="text-link">Trouver une fiche →</span></a>
      <a class="feature-card documents" href="#/documents"><span class="feature-icon">${icon("documents")}</span><h2>Documents</h2><p>Télécharger les manuels complets dans leur format d’origine.</p><span class="text-link">Voir les documents →</span></a>
    </section>
    <section class="principles">
      <h2>Ce que le site fait — et ne fait pas</h2>
      <div class="two-columns"><p><strong>Il aide à structurer un vécu</strong>, conserver des exemples et préparer un échange avec un professionnel.</p><p><strong>Il ne pose aucun diagnostic</strong> et ne transforme jamais un indice descriptif en probabilité médicale.</p></div>
    </section>
  `;
};

const testsView = () => `
  <section class="page-heading">
    <p class="eyebrow">Auto-évaluation descriptive</p>
    <h1>Choisir un questionnaire</h1>
    <p class="lead">Les versions 250 explorent davantage de situations. Vous pouvez faire une pause et reprendre plus tard si la sauvegarde locale est activée.</p>
    <div class="notice warning"><strong>Version de travail :</strong> les regroupements par thème sont générés depuis la source V2 et doivent encore faire l’objet d’une relecture clinique question par question. Aucun seuil clinique maison n’est appliqué.</div>
  </section>
  <section class="test-grid">
    ${testsData.tests.map((test) => {
      const existing = getState().testSessions.find((session) => session.testId === test.id);
      return `<article class="test-card">
        <p class="tag">${test.family === "adhd" ? "TDAH" : "TSA"}</p>
        <h2>${escapeHtml(test.titleFr)}</h2>
        <p>${test.size} questions · ${test.themes.length} thèmes</p>
        <p class="fine-print">Durée libre, aucune réponse obligatoire.</p>
        <div class="button-row">
          ${existing ? `<a class="button primary" href="#/test/${existing.id}">Reprendre</a>` : `<button class="button primary" data-action="start-test" data-test-id="${test.id}">Commencer</button>`}
          <button class="button ghost" data-action="start-test" data-test-id="${test.id}">Nouveau</button>
        </div>
      </article>`;
    }).join("")}
  </section>
`;

const testRunnerView = (sessionId: string) => {
  const session = getTestSession(sessionId);
  if (!session) return notFoundView("Cette session de test n’existe plus.");
  const test = testsData.tests.find((candidate) => candidate.id === session.testId);
  if (!test) return notFoundView("Ce questionnaire est introuvable.");
  const cursor = Math.max(0, Math.min(session.cursor, test.instances.length - 1));
  const instance = test.instances[cursor];
  if (!instance) return notFoundView("Cette question est introuvable.");
  const item = itemMap.get(instance.itemId);
  if (!item) return notFoundView("Le contenu de cette question est introuvable.");
  const theme = test.themes.find((candidate) => candidate.id === instance.themeId);
  const scale = scaleMap.get(item.responseScale);
  const answer = session.answers[instance.instanceId];
  const answered = Object.values(session.answers).filter((candidate) => candidate.kind !== "skipped").length;

  return `
    <section class="test-runner">
      <div class="runner-topline"><a href="#/tests">← Quitter et reprendre plus tard</a><span>${answered}/${test.size} traitées</span></div>
      <div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="${test.size}" aria-valuenow="${cursor + 1}"><span style="width:${((cursor + 1) / test.size) * 100}%"></span></div>
      <p class="eyebrow">${escapeHtml(test.titleFr)} · question ${cursor + 1} sur ${test.size}</p>
      <p class="theme-label">${escapeHtml(theme?.titleFr || "")}</p>
      <h1 class="question">${escapeHtml(item.textFr)}</h1>
      <div class="answer-list" role="radiogroup" aria-label="Choisir une réponse">
        ${scale?.options.map((option) => `<button class="answer ${answer?.kind === "value" && answer.optionId === option.id ? "selected" : ""}" data-action="answer-test" data-session-id="${session.id}" data-instance-id="${instance.instanceId}" data-option-id="${option.id}" data-value="${option.value}" role="radio" aria-checked="${answer?.kind === "value" && answer.optionId === option.id}"><span>${option.value}</span>${escapeHtml(option.labelFr)}</button>`).join("") || ""}
      </div>
      <div class="special-answers">
        <button class="button ${answer?.kind === "unknown" ? "selected secondary" : "ghost"}" data-action="special-answer" data-kind="unknown" data-session-id="${session.id}" data-instance-id="${instance.instanceId}">Je ne sais pas</button>
        <button class="button ${answer?.kind === "not-applicable" ? "selected secondary" : "ghost"}" data-action="special-answer" data-kind="not-applicable" data-session-id="${session.id}" data-instance-id="${instance.instanceId}">Non applicable</button>
      </div>
      <nav class="runner-navigation" aria-label="Questions">
        <button class="button secondary" data-action="test-nav" data-session-id="${session.id}" data-cursor="${cursor - 1}" ${cursor === 0 ? "disabled" : ""}>← Précédente</button>
        ${cursor < test.size - 1
          ? `<button class="button primary" data-action="test-nav" data-session-id="${session.id}" data-cursor="${cursor + 1}">${answer ? "Suivante" : "Passer pour l’instant"} →</button>`
          : `<a class="button primary" href="#/results/${session.id}">Voir la synthèse</a>`}
      </nav>
    </section>
  `;
};

const resultsView = (sessionId: string) => {
  const session = getTestSession(sessionId);
  if (!session) return notFoundView("Cette session de test n’existe plus.");
  const test = testsData.tests.find((candidate) => candidate.id === session.testId);
  if (!test) return notFoundView("Ce questionnaire est introuvable.");
  const { results, flags, counts } = scoreTest(session, test, testsData);
  return `
    <section class="page-heading">
      <p class="eyebrow">Synthèse descriptive</p>
      <h1>${escapeHtml(test.titleFr)}</h1>
      <p class="lead">Ces indices décrivent vos réponses. Ils ne mesurent ni une probabilité diagnostique, ni une certitude clinique.</p>
      <div class="button-row"><button class="button primary" data-action="export-test-pdf" data-session-id="${session.id}">Télécharger le PDF</button><a class="button secondary" href="#/test/${session.id}">Revoir mes réponses</a></div>
    </section>
    <section class="summary-metrics">
      <div><strong>${counts.value}</strong><span>réponses calculables</span></div>
      <div><strong>${counts.unknown}</strong><span>« Je ne sais pas »</span></div>
      <div><strong>${counts["not-applicable"]}</strong><span>non applicables</span></div>
      <div><strong>${test.size - Object.keys(session.answers).length + counts.skipped}</strong><span>sans réponse</span></div>
    </section>
    <section class="results-list" aria-label="Indices par thème">
      ${results.map((result) => `<article class="result-row">
        <div><h2>${escapeHtml(result.titleFr)}</h2><p>Couverture informative : ${result.answered}/${result.applicable} questions applicables</p></div>
        ${result.normalized === null ? `<span class="insufficient">Données insuffisantes</span>` : `<div class="score"><div class="score-track"><span style="width:${result.normalized * 100}%"></span></div><strong>${(result.normalized * 4).toFixed(1)} / 4</strong></div>`}
      </article>`).join("")}
    </section>
    ${flags.length ? `<section class="flags"><h2>Points à explorer avec un professionnel</h2><p>Ces réponses ne produisent aucun point TDAH ou TSA.</p><ul>${flags.map((flag) => `<li>${escapeHtml(flag.textFr)} — <strong>${escapeHtml(flag.answer)}</strong></li>`).join("")}</ul></section>` : ""}
  `;
};

const waveCategory = (title: string) => {
  const value = title.toLowerCase();
  if (/attachement|jalous|limérence|rejet|relation|honte|culpabil|impost|colère|auto-dévalorisation/.test(value)) return "relations";
  if (/rumination|intrusive|certitude|angoisse|panique|nocturne|insomnie/.test(value)) return "thoughts";
  if (/frustration|ennui|tâche|exécutif|impulsion|hyperfocus|temps|retard/.test(value)) return "action";
  if (/autistique|épuisement|burn-out|dépressive/.test(value)) return "overload";
  return "mixed";
};

const wavesView = () => {
  const groups = [
    { id: "mixed", label: "Je ne sais pas / vagues mixtes" },
    { id: "action", label: "Attention, action et impulsivité" },
    { id: "relations", label: "Relations et émotions" },
    { id: "thoughts", label: "Pensées et anxiété" },
    { id: "overload", label: "Surcharge et épuisement" }
  ];
  const modules = wavesData.collections.flatMap((collection) => collection.modules.map((module) => ({ collection, module, category: waveCategory(module.titleFr) })));
  return `
    <section class="page-heading waves-heading">
      <p class="eyebrow">30 modules · 150 fiches</p>
      <h1>Quelle vague traversez-vous ?</h1>
      <p class="lead">Choisissez l’expérience la plus proche. Il n’est pas nécessaire de trouver l’étiquette parfaite.</p>
      <div class="urgent-actions">
        <a class="button danger" href="#/safety">Je suis peut-être en danger</a>
        <a class="button secondary" href="#/waves/psychological-waves/psychological-waves-module-00?phase=during">Je ne sais pas ce qui monte</a>
      </div>
      <label class="search-label" for="wave-search">Rechercher un mot ou une situation</label>
      <input class="search-input" id="wave-search" type="search" placeholder="Colère, rejet, retard, blocage, panique…" autocomplete="off" />
      <div class="filter-chips" aria-label="Aller à un thème">${groups.map((group) => `<a href="#wave-group-${group.id}">${group.label}</a>`).join("")}</div>
    </section>
    <div id="wave-no-results" class="notice warning" hidden>Aucun module ne correspond à cette recherche. Vous pouvez utiliser le module universel.</div>
    ${groups.map((group) => `<section class="wave-group" id="wave-group-${group.id}"><h2>${group.label}</h2><div class="module-grid">
      ${modules.filter((entry) => entry.category === group.id).map(({ collection, module }) => `<article class="module-card" data-wave-card data-search="${escapeHtml(`${module.titleFr} ${collection.titleFr}`.toLowerCase())}">
        <p class="tag">${escapeHtml(collection.titleFr)}</p><h3>${escapeHtml(module.titleFr)}</h3><p>5 fiches : comprendre, avant, pendant, après et prévenir.</p>
        <div class="button-row"><a class="button primary" href="#/waves/${collection.id}/${module.id}?phase=during">Gérer maintenant</a><a class="button ghost" href="#/waves/${collection.id}/${module.id}">Voir les 5 fiches</a></div>
      </article>`).join("")}
    </div></section>`).join("")}
  `;
};

const findWave = (collectionId: string, moduleId: string) => {
  const collection = wavesData.collections.find((candidate) => candidate.id === collectionId);
  return { collection, module: collection?.modules.find((candidate) => candidate.id === moduleId) };
};

const waveFieldId = (lineIndex: number, optionIndex: number, label: string) => `${lineIndex}-${optionIndex}:${label.slice(0, 42)}`;

const renderWaveLine = (page: WavePage, line: string, lineIndex: number, episode?: WaveEpisode) => {
  const values = episode?.answers[page.id] || {};
  if (line.includes("[ ]")) {
    const options = line.split("[ ]").map((part) => part.trim()).filter(Boolean);
    return `<div class="check-grid">${options.map((label, optionIndex) => {
      const fieldId = waveFieldId(lineIndex, optionIndex, label);
      return `<label class="check-option"><input type="checkbox" data-wave-field data-episode-id="${episode?.id || ""}" data-page-id="${page.id}" data-field-id="${escapeHtml(fieldId)}" ${values[fieldId] === true ? "checked" : ""} ${episode ? "" : "disabled"}/><span>${escapeHtml(label)}</span></label>`;
    }).join("")}</div>`;
  }
  if (/\.{4,}/.test(line)) {
    const label = line.replace(/\.{4,}/g, "").replace(/\s+/g, " ").trim() || "Réponse";
    const fieldId = waveFieldId(lineIndex, 0, label);
    return `<label class="wave-field"><span>${escapeHtml(label)}</span><textarea rows="2" data-wave-field data-episode-id="${episode?.id || ""}" data-page-id="${page.id}" data-field-id="${escapeHtml(fieldId)}" ${episode ? "" : "disabled"}>${escapeHtml(values[fieldId] || "")}</textarea></label>`;
  }
  if ((page.phase === "after" || page.phase === "before") && line.trim().endsWith("?")) {
    const fieldId = waveFieldId(lineIndex, 0, line);
    return `<label class="wave-field"><span>${escapeHtml(line)}</span><textarea rows="2" data-wave-field data-episode-id="${episode?.id || ""}" data-page-id="${page.id}" data-field-id="${escapeHtml(fieldId)}" ${episode ? "" : "disabled"}>${escapeHtml(values[fieldId] || "")}</textarea></label>`;
  }
  const cells = line.split("\t").map((cell) => cell.trim()).filter(Boolean);
  if (cells.length > 1) return `<div class="content-row">${cells.map((cell) => `<span>${escapeHtml(cell)}</span>`).join("")}</div>`;
  if (/^(Protocole immédiat|Menu de régulation|À suspendre|Critères de sortie|Questions d’analyse|Ligne du temps|Réparation|Mes signes|Vulnérabilités|Feu tricolore|Mon plan|Quand demander|Cycle typique|Déclencheurs fréquents|Manifestations possibles|Cinq piliers)/i.test(line)) return `<h3 class="content-heading">${escapeHtml(line)}</h3>`;
  if (/^(AVANT TOUT|SIGNAL DE SÉCURITÉ|DÉCLENCHEUR DU PLAN)/.test(line)) return `<p class="safety-line">${escapeHtml(line)}</p>`;
  if (/^(Repères publics|PASSAGE À L’ÉTAPE SUIVANTE|CONCLUSION DU MODULE)/.test(line)) return `<p class="fine-print content-note">${escapeHtml(line)}</p>`;
  return `<p>${escapeHtml(line)}</p>`;
};

const waveModuleView = (collectionId: string, moduleId: string, query: URLSearchParams) => {
  const { collection, module } = findWave(collectionId, moduleId);
  if (!collection || !module) return notFoundView("Ce module est introuvable.");
  const requestedEpisode = query.get("episode");
  const episode = (requestedEpisode && getWaveEpisode(requestedEpisode)) || getState().waveEpisodes.find((candidate) => candidate.collectionId === collectionId && candidate.moduleId === moduleId);
  const phase = query.get("phase") || "understand";
  const page = module.pages.find((candidate) => candidate.phase === phase) || module.pages[0];
  if (!page) return notFoundView("Cette fiche est introuvable.");
  const filledPageIds = episode ? Object.entries(episode.answers).filter(([, fields]) => Object.values(fields).some((value) => value !== "" && value !== false)).map(([id]) => id) : [];
  return `
    <section class="page-heading module-heading">
      <p class="eyebrow">${escapeHtml(collection.titleFr)} · module ${module.number}</p>
      <h1>${escapeHtml(module.titleFr)}</h1>
      <div class="button-row">
        ${episode ? `<span class="session-badge">Épisode du ${escapeHtml(formatDate(episode.startedAt))}</span>` : `<button class="button primary" data-action="new-wave-episode" data-collection-id="${collection.id}" data-module-id="${module.id}" data-phase="${page.phase}">Commencer un épisode</button>`}
        ${episode ? `<button class="button ghost" data-action="new-wave-episode" data-collection-id="${collection.id}" data-module-id="${module.id}" data-phase="${page.phase}">Nouvel épisode</button>` : ""}
        <a class="button danger ghost" href="#/safety">Plan de sécurité</a>
      </div>
    </section>
    <nav class="phase-navigation" aria-label="Les cinq fiches">
      ${module.pages.map((candidate) => `<a class="phase-card ${candidate.id === page.id ? "active" : ""}" href="#/waves/${collection.id}/${module.id}?phase=${candidate.phase}${episode ? `&episode=${episode.id}` : ""}"><span>${candidate.number}</span><strong>${escapeHtml(candidate.phaseLabelFr)}</strong><small>${filledPageIds.includes(candidate.id) ? "Remplie" : candidate.phase === "understand" ? "À lire" : "Non commencée"}</small></a>`).join("")}
    </nav>
    <section class="wave-sheet phase-${page.phase}">
      <div class="sheet-heading"><p class="eyebrow">Fiche ${page.number} sur 5</p><h2>${escapeHtml(page.phaseLabelFr)}</h2></div>
      ${!episode && page.phase !== "understand" ? `<div class="notice warning">Commencez un épisode pour remplir et sauvegarder cette fiche.</div>` : ""}
      <div class="sheet-content">${page.contentLines.map((line, index) => renderWaveLine(page, line, index, episode)).join("")}</div>
      ${episode ? `<label class="wave-field notes"><span>Notes personnelles pour cette fiche</span><textarea rows="4" data-wave-field data-episode-id="${episode.id}" data-page-id="${page.id}" data-field-id="notes">${escapeHtml(episode.answers[page.id]?.notes || "")}</textarea></label>` : ""}
    </section>
    ${episode ? `<section class="export-panel"><div><h2>Exporter cet épisode</h2><p>Choisissez les fiches à inclure dans le PDF.</p></div><div class="export-pages">${module.pages.map((candidate) => `<label><input type="checkbox" name="wave-export-page" value="${candidate.id}" ${filledPageIds.includes(candidate.id) || candidate.id === page.id ? "checked" : ""}/> ${escapeHtml(candidate.phaseLabelFr)}</label>`).join("")}</div><button class="button primary" data-action="export-wave-pdf" data-episode-id="${episode.id}">Générer le PDF</button></section>` : ""}
  `;
};

const safetyView = () => `
  <section class="safety-page">
    <p class="eyebrow">Sécurité prioritaire</p><h1>Si la vague devient dangereuse</h1>
    <div class="notice danger"><strong>En cas de danger immédiat :</strong> ne restez pas uniquement dans l’auto-aide. Éloignez-vous des moyens et personnes exposées, rejoignez un lieu sûr et contactez une aide humaine ou les services d’urgence.</div>
    <ol class="safety-steps"><li><strong>Dire</strong><span>« Je ne me sens pas en sécurité seul. J’ai besoin que tu restes ou que tu m’aides à contacter les urgences. »</span></li><li><strong>S’éloigner</strong><span>Mettre de la distance avec les moyens, substances, clés et lieux dangereux.</span></li><li><strong>Contacter</strong><span>En France : 15 ou 112 en danger immédiat ; 3114 pour la prévention du suicide ; 114 pour l’urgence accessible.</span></li><li><strong>Rejoindre</strong><span>Une personne, un lieu de soin ou un espace sûr. Ne pas rester isolé si le danger est immédiat.</span></li><li><strong>Transmettre</strong><span>Dire clairement pensée, envie, intention, plan, moyens, substances, symptômes et localisation.</span></li></ol>
    <div class="button-row"><a class="button danger" href="tel:112">Appeler le 112</a><a class="button secondary" href="tel:3114">Appeler le 3114</a><a class="button ghost" href="#/waves">Retour aux modules</a></div>
    <p class="fine-print">Ces coordonnées concernent la France. Ailleurs, utilisez les services d’urgence de votre pays.</p>
  </section>
`;

const documentsView = () => `
  <section class="page-heading"><p class="eyebrow">Ressources originales</p><h1>Documents à télécharger</h1><p class="lead">Les fichiers sont proposés dans leur format ODT original. Une copie remplie peut contenir des informations intimes.</p></section>
  <section class="document-list">
    <article><div class="document-icon">ODT</div><div><h2>Manuel des vagues TDAH</h2><p>69 pages · 10 modules · 50 fiches.</p></div><a class="button secondary" href="${base}documents/manuel-des-vagues-tdah.odt" download>Télécharger</a></article>
    <article><div class="document-icon">ODT</div><div><h2>Manuel de navigation des vagues psychologiques</h2><p>119 pages · 20 modules · 100 fiches.</p></div><a class="button secondary" href="${base}documents/manuel-navigation-vagues-psychologiques.odt" download>Télécharger</a></article>
  </section>
`;

const settingsView = () => {
  const preferences = getState().preferences;
  return `
    <section class="page-heading"><p class="eyebrow">Confort et données</p><h1>Réglages</h1><p class="lead">Ces préférences s’appliquent uniquement à cet appareil.</p></section>
    <section class="settings-grid">
      <div class="settings-card"><h2>Affichage</h2>
        <label>Taille du texte<select data-preference="fontScale"><option value="normal" ${preferences.fontScale === "normal" ? "selected" : ""}>Normale</option><option value="large" ${preferences.fontScale === "large" ? "selected" : ""}>Grande</option><option value="x-large" ${preferences.fontScale === "x-large" ? "selected" : ""}>Très grande</option></select></label>
        <label>Contraste<select data-preference="contrast"><option value="standard" ${preferences.contrast === "standard" ? "selected" : ""}>Standard</option><option value="high" ${preferences.contrast === "high" ? "selected" : ""}>Renforcé</option></select></label>
        <label>Thème<select data-preference="theme"><option value="light" ${preferences.theme === "light" ? "selected" : ""}>Clair</option><option value="dark" ${preferences.theme === "dark" ? "selected" : ""}>Sombre</option></select></label>
        <label>Densité<select data-preference="density"><option value="comfortable" ${preferences.density === "comfortable" ? "selected" : ""}>Confortable</option><option value="compact" ${preferences.density === "compact" ? "selected" : ""}>Compacte</option></select></label>
        <label class="check-option"><input type="checkbox" data-preference="reduceMotion" ${preferences.reduceMotion ? "checked" : ""}/><span>Réduire les animations</span></label>
      </div>
      <div class="settings-card"><h2>Sauvegarde portable .AuDHD</h2><p>Exportez tests, épisodes et réglages vers un fichier JSON portable.</p>
        <label class="check-option"><input id="protect-export" type="checkbox"/><span>Protéger le fichier avec un mot de passe</span></label>
        <div id="password-fields" hidden><label>Mot de passe<input id="export-password" type="password" autocomplete="new-password"/></label><label>Confirmer<input id="export-password-confirm" type="password" autocomplete="new-password"/></label><p class="fine-print">Ce mot de passe ne peut pas être récupéré.</p></div>
        <div class="button-row"><button class="button primary" data-action="export-portable">Exporter .AuDHD</button><label class="button secondary file-button">Importer .AuDHD<input id="import-portable" type="file" accept=".AuDHD,.audhd,application/json"/></label></div>
      </div>
      <div class="settings-card danger-zone"><h2>Effacer les données</h2><p>Supprime les sessions enregistrées par le site dans ce navigateur. Les PDF et fichiers déjà téléchargés ne sont pas affectés.</p><button class="button danger" data-action="clear-data">Effacer toutes les données locales</button></div>
    </section>
  `;
};

const privacyView = () => `
  <section class="prose-page"><p class="eyebrow">Transparence</p><h1>Confidentialité et limites</h1><h2>Aucune base de données</h2><p>Le site fonctionne entièrement dans votre navigateur. Il ne possède aucun compte utilisateur et n’envoie pas vos réponses à un serveur.</p><h2>Stockage local facultatif</h2><p>Si vous l’autorisez, les tests, fiches et préférences sont conservés dans le stockage local du navigateur. Ils peuvent disparaître lors d’un nettoyage, d’une navigation privée ou d’une désinstallation.</p><h2>Fichiers sensibles</h2><p>Les PDF et fichiers .AuDHD peuvent contenir des informations de santé ou de vie privée. Un export sans mot de passe reste lisible par toute personne ayant accès au fichier.</p><h2>Limites médicales</h2><p>Les questionnaires et fiches facilitent l’auto-observation et la préparation d’une consultation. Ils ne remplacent ni un diagnostic, ni un traitement, ni une aide urgente.</p><p><strong>Persistance actuelle :</strong> ${isPersistent() ? "sauvegarde locale autorisée" : "session en mémoire uniquement"}.</p></section>
`;

const notFoundView = (message = "Cette page n’existe pas.") => `<section class="empty-state"><h1>Page introuvable</h1><p>${escapeHtml(message)}</p><a class="button primary" href="#/">Revenir à l’accueil</a></section>`;

const render = () => {
  applyPreferences();
  const { segments, query } = parseRoute();
  let content = "";
  if (!segments.length) content = homeView();
  else if (segments[0] === "tests" && segments.length === 1) content = testsView();
  else if (segments[0] === "test" && segments[1]) content = testRunnerView(segments[1]);
  else if (segments[0] === "results" && segments[1]) content = resultsView(segments[1]);
  else if (segments[0] === "waves" && segments.length === 1) content = wavesView();
  else if (segments[0] === "waves" && segments[1] && segments[2]) content = waveModuleView(segments[1], segments[2], query);
  else if (segments[0] === "safety") content = safetyView();
  else if (segments[0] === "documents") content = documentsView();
  else if (segments[0] === "settings") content = settingsView();
  else if (segments[0] === "privacy") content = privacyView();
  else content = notFoundView();
  app.innerHTML = layout(content);
};

document.addEventListener("click", async (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "storage-consent") {
    setStorageConsent(target.dataset.value === "yes");
    render();
  }
  if (action === "start-test" && target.dataset.testId) {
    navigate(`/test/${createTestSession(target.dataset.testId).id}`);
  }
  if (action === "answer-test") {
    const session = getTestSession(target.dataset.sessionId || "");
    if (!session || !target.dataset.instanceId) return;
    session.answers[target.dataset.instanceId] = { kind: "value", optionId: target.dataset.optionId, value: Number(target.dataset.value) };
    updateTestSession(session.id, { answers: session.answers });
    render();
  }
  if (action === "special-answer") {
    const session = getTestSession(target.dataset.sessionId || "");
    if (!session || !target.dataset.instanceId) return;
    session.answers[target.dataset.instanceId] = { kind: target.dataset.kind as Answer["kind"] };
    updateTestSession(session.id, { answers: session.answers });
    render();
  }
  if (action === "test-nav") {
    const sessionId = target.dataset.sessionId || "";
    updateTestSession(sessionId, { cursor: Number(target.dataset.cursor) });
    render();
    document.querySelector(".question")?.scrollIntoView({ block: "start" });
  }
  if (action === "export-test-pdf") {
    const session = getTestSession(target.dataset.sessionId || "");
    const test = session && testsData.tests.find((candidate) => candidate.id === session.testId);
    if (session && test) exportTestPdf(session, test, testsData);
  }
  if (action === "new-wave-episode") {
    const collectionId = target.dataset.collectionId || "";
    const moduleId = target.dataset.moduleId || "";
    const episode = createWaveEpisode(collectionId, moduleId);
    navigate(`/waves/${collectionId}/${moduleId}?phase=${target.dataset.phase || "understand"}&episode=${episode.id}`);
  }
  if (action === "export-wave-pdf") {
    const episode = getWaveEpisode(target.dataset.episodeId || "");
    if (!episode) return;
    const { collection, module } = findWave(episode.collectionId, episode.moduleId);
    if (!collection || !module) return;
    const selected = [...document.querySelectorAll<HTMLInputElement>('input[name="wave-export-page"]:checked')].map((input) => input.value);
    if (!selected.length) return window.alert("Sélectionnez au moins une fiche.");
    exportWavePdf(episode, collection, module, selected);
  }
  if (action === "export-portable") {
    const protect = document.querySelector<HTMLInputElement>("#protect-export")?.checked;
    const password = document.querySelector<HTMLInputElement>("#export-password")?.value || "";
    const confirmation = document.querySelector<HTMLInputElement>("#export-password-confirm")?.value || "";
    if (protect && (!password || password !== confirmation)) return window.alert("Les mots de passe doivent être identiques et non vides.");
    const content = await createPortableFile(getState(), protect ? password : undefined);
    downloadText(content, `session_${new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-")}.AuDHD`, "application/vnd.audhd+json");
  }
  if (action === "clear-data") {
    if (window.confirm("Effacer toutes les sessions locales de ce navigateur ?")) {
      clearAllLocalData();
      render();
    }
  }
});

document.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (target.id === "wave-search") {
    const query = target.value.trim().toLocaleLowerCase("fr");
    let visible = 0;
    document.querySelectorAll<HTMLElement>("[data-wave-card]").forEach((card) => {
      const matches = !query || card.dataset.search?.includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    const empty = document.querySelector<HTMLElement>("#wave-no-results");
    if (empty) empty.hidden = visible > 0;
  }
  if (target.matches("[data-wave-field]")) {
    updateWaveField(target.dataset.episodeId || "", target.dataset.pageId || "", target.dataset.fieldId || "", target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value);
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (target.id === "protect-export") {
    const fields = document.querySelector<HTMLElement>("#password-fields");
    if (fields) fields.hidden = !(target as HTMLInputElement).checked;
  }
  if (target.dataset.preference) {
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    updatePreferences({ [target.dataset.preference]: value });
    applyPreferences();
  }
  if (target.id === "import-portable" && (target as HTMLInputElement).files?.[0]) {
    const file = (target as HTMLInputElement).files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      let state;
      try {
        state = await readPortableFile(text);
      } catch (error) {
        if (error instanceof Error && error.message === "PASSWORD_REQUIRED") {
          const password = window.prompt("Ce fichier est protégé. Saisissez son mot de passe :");
          if (password === null) return;
          state = await readPortableFile(text, password);
        } else throw error;
      }
      if (!window.confirm("Remplacer la session actuelle par les données importées ?")) return;
      replaceState(state);
      render();
      window.alert("Session importée avec succès.");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Import impossible.");
    }
  }
});

window.addEventListener("hashchange", () => {
  render();
  window.scrollTo({ top: 0, behavior: getState().preferences.reduceMotion ? "auto" : "smooth" });
});

render();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register(`${base}sw.js`));
}
