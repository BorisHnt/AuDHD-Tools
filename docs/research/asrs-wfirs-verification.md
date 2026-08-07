# Vérification ASRS v1.1 et WFIRS-S

Date de vérification : 7 août 2026.

Cette note documente les décisions d'intégration du prototype. Elle ne vaut
pas avis juridique et devra être revue si les détenteurs modifient leurs
conditions.

## ASRS v1.1 — screener à 6 questions

La page officielle du National Comorbidity Survey indique que le screener
ASRS v1.1 à six questions peut être utilisé sans autorisation formelle. Elle
demande toutefois :

- de citer l'article de Kessler et al. (2005) ;
- d'afficher la notice de copyright ;
- de ne modifier ni les items, ni les choix de réponse, ni l'algorithme ;
- de conserver les deux niveaux d'ombrage lorsque le scoring original est
  reproduit.

Le site officiel préfère qu'un service tiers fournisse un lien vers son PDF,
afin que les mises à jour méthodologiques restent centralisées.

Une [version française officielle à six questions](https://www.hcp.med.harvard.edu/ncs/ftpdir/adhd/6Q_French_final.pdf)
est disponible.

Une [mise à jour officielle du scoring publiée en 2024](https://www.hcp.med.harvard.edu/ncs/ftpdir/adhd/ASRS_v1.1_screener%286Q%29_scoring_update.pdf)
documente notamment une méthode additive 0–24 en plus de la méthode
dichotomique historique. Le choix de la méthode devra être explicitement
versionné dans le rapport.

Sources principales :

- [Page officielle ASRS du National Comorbidity Survey](https://www.hcp.med.harvard.edu/ncs/asrs.php)
- [Note méthodologique officielle](https://www.hcp.med.harvard.edu/ncs/ftpdir/adhd/background_memo_rev_2023_edit.pdf)

### Décision

`conditionally-permitted` : intégration possible uniquement à partir de la
version officielle, sans reformulation et avec ses mentions obligatoires.
Le prototype ne recopie pas encore le texte.

## ASRS v1.1 — liste à 18 questions

La même page officielle renvoie vers une procédure de demande d'autorisation
pour la liste de symptômes à 18 questions. Les 18 premières questions des
tests TDAH du fichier de travail ne doivent donc pas être publiées sous le nom
ASRS avant obtention et archivage de cette autorisation.

### Décision

`blocked-pending-permission`.

## WFIRS-S

La [fiche officielle ePROVIDE de Mapi Research Trust](https://eprovide.mapi-trust.org/instruments/weiss-functional-impairment-rating-scale-self-report)
identifie Margaret D. Weiss comme détentrice et Mapi comme distributeur. Elle
précise que les exemplaires d'examen ne peuvent pas être modifiés, retapés,
traduits, copiés ou distribués sans autorisation écrite préalable. Les projets
informatiques doivent soumettre une demande de licence. Une version française
existe, mais sa disponibilité ne constitue pas une autorisation de la publier.

Les informations publiques permettent seulement de documenter la structure
pour préparer le moteur : 69 items, sept domaines, réponses 0–3, période du
mois écoulé et option « Non applicable ». Les instructions publiques indiquent
que les éléments non applicables sont exclus de la moyenne. Cela ne nous
autorise pas à reproduire les formulations.

Sources complémentaires :

- [Instructions WFIRS publiées par CADDRA](https://www.caddra.ca/etoolkit/eToolkit-CADDRA-etrousse/assets/wfirs-instructions--digital-march-25-.pdf)
- [Validation scientifique de la version française](https://pubmed.ncbi.nlm.nih.gov/30191748/)

### Décision

`blocked-pending-written-permission` : aucune formulation WFIRS-S ne doit être
ajoutée au dépôt public avant accord et réception de la version autorisée.

## Conséquence pour le MegaTest V2

Le fichier `mega_tests_TDAH_TSA_original_OSS_v2.txt` remplace le fichier de
travail précédent comme source canonique. Les anciens blocs ASRS-18 et WFIRS-S
ont été remplacés par des formulations originales du projet.

- Aucun item de la V2 ne doit être scoré comme un item ASRS ou WFIRS-S.
- Les 69 positions du thème 2 de TDAH 250 ne constituent pas un WFIRS-S.
- Tous les items de la V2 utilisent le moteur descriptif du projet.
- Les instruments officiels restent d'éventuels modules autonomes et séparés.
- L'ancien fichier `mega_tests_TDAH_TSA.txt` est historique et ne doit plus
  alimenter le dépôt public ni le moteur.

Conserver une logique générale similaire ne doit jamais conduire à employer
le nom, le texte ou le scoring d'un instrument officiel sans respecter ses
conditions.
