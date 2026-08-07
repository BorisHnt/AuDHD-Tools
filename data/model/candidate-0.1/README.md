# Modèle de questionnaires neuro — candidate 0.1

Ce dossier contient un prototype exécutable du contrat de données, pas un
questionnaire clinique prêt à publier.

## Chaîne de données

```text
instanceId → itemId → conceptId → dimensionId
```

Le calcul descriptif suit cette chaîne :

```text
réponse brute → transformation → valeur d'item → concept → dimension → profil
```

Les items descriptifs sont normalisés entre `0` et `1` avant leur agrégation.
Une dimension est la moyenne de ses concepts évalués, chaque concept comptant
une seule fois quel que soit son nombre d'items. L'interface peut ensuite
représenter cette valeur sur une échelle commune de `0` à `4`, sans en faire un
seuil clinique.

Les instruments officiels sont isolés de cette agrégation et utilisent
uniquement leur propre moteur déclaré dans `instruments.json`.

## Source canonique du MegaTest

La seule source textuelle autorisée pour la cartographie est
`mega_tests_TDAH_TSA_original_OSS_v2.txt`. Son empreinte et ses décomptes sont
enregistrés dans `canonical-source.json`.

L'ancien fichier `mega_tests_TDAH_TSA.txt` est historique : il ne doit plus
alimenter `items.json`, les concepts, les dimensions ou les manifestes.

La V2 ne contient ni ASRS ni WFIRS-S. Les entrées correspondantes de
`instruments.json` décrivent seulement d'éventuels modules officiels séparés
du MegaTest.

## Contenu

- `dimensions.json` : taxonomie canonique TDAH et TSA ;
- `contract.json` : énumérations et invariants du modèle ;
- `canonical-source.json` : identité et empreinte de la source V2 ;
- `concepts.json` : dix concepts représentatifs ;
- `response-scales.json` : échelles communes du prototype ;
- `items.json` : dix cas représentatifs ;
- `instruments.json` : statut ASRS v1.1 et WFIRS-S ;
- `tests/prototype-10-cases.json` : instances ordonnées ;
- `fixtures/responses.json` : réponses couvrant les quatre états ;
- `fixtures/expected-results.json` : sortie attendue du moteur de référence.

## États de réponse

| État | Question traitée | Calculable | Applicable |
|---|---:|---:|---:|
| `value` | oui | oui | oui |
| `unknown` | oui | non | oui |
| `not-applicable` | oui | non | non |
| `skipped` | non | non | oui |

## Règles invariantes

- Aucun poids numérique arbitraire.
- Un item possède au maximum un concept principal.
- Une contribution contextuelle n'entre pas dans l'agrégation.
- Les drapeaux différentiels et médicaux ne produisent aucun point.
- Une valeur manquante ne devient jamais zéro.
- Complétion, applicabilité et couverture informative restent séparées.
- Un résultat d'instrument officiel reste distinct d'un indice descriptif.
- Un instrument incomplet ne produit pas de résultat officiel.

## Validation locale

Depuis la racine du dépôt :

```bash
node scripts/validate-prototype.mjs
```

Le script vérifie la syntaxe, les références entre fichiers, les invariants,
les métriques de complétion et les résultats attendus.
