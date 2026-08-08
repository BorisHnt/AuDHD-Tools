# AuDHD Tools

Site statique francophone d’auto-observation pour les personnes concernées par
le TDAH, le TSA ou l’AuDHD.

## Technologie

Le site publié est entièrement en Vanilla :

- HTML multipage ;
- CSS natif ;
- modules JavaScript natifs ;
- fichiers JSON statiques ;
- aucune compilation, aucun framework et aucune dépendance npm ;
- jsPDF est embarqué localement dans `assets/vendor` pour les exports PDF.

Les principales URL sont :

- `/` : accueil ;
- `/tests/` : questionnaires ;
- `/tests/questionnaire.html` : remplissage d’un questionnaire ;
- `/tests/resultats.html` : synthèse et PDF ;
- `/fiches/` : sommaire des 30 modules ;
- `/fiches/module.html` : cinq fiches d’un module ;
- `/documents/` : documents téléchargeables ;
- `/reglages/` : accessibilité et fichiers `.AuDHD` ;
- `/confidentialite/` et `/securite/`.

## Fonctionnalités

- quatre questionnaires descriptifs issus de la source OSS V2 ;
- 700 occurrences dédupliquées dans une banque de 680 items ;
- agrégation prudente `réponse → item → concept → dimension → profil` ;
- 30 modules de vagues et 150 fiches interactives ;
- sauvegarde locale facultative, sans compte ni base de données ;
- export/import `.AuDHD`, avec protection AES-256-GCM facultative ;
- génération de PDF dans le navigateur ;
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

Pour régénérer les JSON et les copies publiques des manuels :

```bash
node scripts/generate-content.mjs
```

La conversion des ODT demande LibreOffice en ligne de commande. Le site publié
lui-même n’en dépend pas.

Les chemins peuvent être remplacés avec :

- `AUDHD_TESTS_SOURCE` ;
- `AUDHD_TDAH_WAVES_SOURCE` ;
- `AUDHD_PSYCH_WAVES_SOURCE`.

## Validation des données

```bash
node scripts/validate-prototype.mjs
node scripts/validate-generated-content.mjs
```
