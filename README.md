# AuDHD Tools

Site statique bilingue (français et anglais) d’auto-observation pour les
personnes concernées par le TDAH, le TSA ou l’AuDHD.

## Technologie

Le site publié est entièrement en Vanilla :

- HTML multipage ;
- CSS natif ;
- modules JavaScript natifs ;
- fichiers JSON statiques ;
- aucune compilation, aucun framework et aucune dépendance npm ;
- jsPDF est embarqué localement dans `assets/vendor` pour les exports PDF.

La racine `/` choisit la langue enregistrée ou celle du navigateur. Les pages
existent sous `/fr/` et `/en/` :

- `/fr/` et `/en/` : accueils localisés ;
- `/{lang}/tests/` : questionnaires ;
- `/{lang}/tests/questionnaire.html` : remplissage d’un questionnaire ;
- `/{lang}/tests/resultats.html` : synthèse et PDF ;
- `/{lang}/fiches/` et `/{lang}/fiches/module.html` : modules et fiches ;
- `/{lang}/documents/`, `/{lang}/reglages/`, `/{lang}/confidentialite/` et
  `/{lang}/securite/`.

## Fonctionnalités

- quatre questionnaires descriptifs issus de la source OSS V2 ;
- 700 occurrences dédupliquées dans une banque de 680 items ;
- agrégation prudente `réponse → item → concept → dimension → profil` ;
- 30 modules de vagues et 150 fiches interactives ;
- sauvegarde locale facultative, sans compte ni base de données ;
- export/import `.AuDHD`, avec protection AES-256-GCM facultative ;
- page « Mes documents » et génération de PDF dans le navigateur ;
- rapports de test synthétiques ou complets avec réponses brutes ;
- carte de crise, rapport d’épisode et fiches complètes imprimables ;
- police Liberation Sans embarquée localement dans les PDF ;
- interface responsive avec réglages de contraste, taille et densité ;
- cache hors ligne des ressources publiques ;
- publication directe depuis la branche `main` avec GitHub Pages.

Les résultats sont des indices descriptifs. Ils ne constituent ni un
diagnostic ni une probabilité diagnostique validée.

## Tester localement

Aucune installation n’est nécessaire. Depuis la racine du dépôt :

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080/`. Il faut utiliser un serveur HTTP : les
modules JavaScript et le chargement des JSON ne fonctionnent pas correctement
en ouvrant directement `index.html` avec une URL `file://`.

## GitHub Pages

Dans **Settings → Pages**, conserver **Deploy from a branch**, sélectionner la
branche `main` et le dossier `/ (root)`. GitHub Pages sert alors directement les
fichiers du dépôt. Aucun workflow, npm, TypeScript ou Vite n’intervient.

## Régénérer les contenus

Le script Node standard `scripts/generate-content.mjs` reconstruit
`site-data/tests.json` et `site-data/waves.json` depuis les sources canoniques.
Node n’est utile que pour cette opération de maintenance, jamais pour servir le
site.

Un clone neuf contient toutes les entrées nécessaires dans `sources/` :

- `sources/mega-tests-v2.txt` ;
- `sources/manuel-vagues-tdah.odt` ;
- `sources/manuel-vagues-psychologiques.odt`.

Pour régénérer les JSON publics :

```bash
node scripts/generate-content.mjs
```

La conversion des ODT demande LibreOffice en ligne de commande. Le site publié
lui-même n’en dépend pas.

Les chemins peuvent être remplacés avec :

- `AUDHD_TESTS_SOURCE` ;
- `AUDHD_TDAH_WAVES_SOURCE` ;
- `AUDHD_PSYCH_WAVES_SOURCE`.

Les enveloppes HTML bilingues sont régénérées avec :

```bash
node scripts/generate-localized-pages.mjs
```

Les traductions anglaises versionnées se trouvent dans `site-data/en/`. Les
scripts `translate-content.mjs` et `translate-interface.mjs` permettent de
recréer une première traduction à l’aide de Google Translate ; une relecture
humaine spécialisée reste recommandée après toute régénération.

## Validation des données

```bash
node scripts/validate-prototype.mjs
node scripts/validate-generated-content.mjs
```
