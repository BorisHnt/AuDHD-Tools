# AuDHD Tools

Site statique francophone d’auto-observation pour les personnes concernées par
le TDAH, le TSA ou l’AuDHD.

## Fonctionnalités

- quatre questionnaires descriptifs issus de la source OSS V2 ;
- 700 occurrences dédupliquées dans une banque canonique ;
- 30 modules de vagues et 150 fiches interactives ;
- sauvegarde locale facultative, sans compte ni base de données ;
- export/import portable `.AuDHD`, avec protection AES-256-GCM facultative ;
- génération de PDF dans le navigateur ;
- interface responsive, réglages de contraste, taille et densité ;
- cache hors ligne des ressources publiques du site ;
- déploiement automatique sur GitHub Pages.

Les résultats des questionnaires maison sont des indices descriptifs. Ils ne
constituent ni un diagnostic ni une probabilité diagnostique validée.

## Développement

```bash
npm install
npm run dev
```

Le dépôt étant actuellement placé sur un volume USB `noexec`, la compilation
locale doit être lancée depuis un système de fichiers exécutable. GitHub
Actions n’est pas concerné.

## Génération du contenu

Les fichiers `public/data/tests.json` et `public/data/waves.json` sont générés
depuis les sources canoniques :

```bash
npm run generate:content
```

Les chemins peuvent être remplacés avec :

- `AUDHD_TESTS_SOURCE`
- `AUDHD_TDAH_WAVES_SOURCE`
- `AUDHD_PSYCH_WAVES_SOURCE`

## Validation

```bash
npm run validate:model
npm run build
```
