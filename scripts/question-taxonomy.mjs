const normalize = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

const matches = (value, pattern) => pattern.test(normalize(value));

export const resultGroups = [
  { id: "core", labelFr: "Symptômes centraux", order: 1, presentation: "index" },
  { id: "core-social", labelFr: "Communication et interactions sociales", order: 1, presentation: "index" },
  { id: "core-restricted", labelFr: "Comportements, intérêts et sensorialité", order: 2, presentation: "index" },
  { id: "executive", labelFr: "Fonctions exécutives", order: 2, presentation: "index" },
  { id: "attention", labelFr: "Dynamique attentionnelle", order: 3, presentation: "index" },
  { id: "trajectory", labelFr: "Trajectoire développementale", order: 4, presentation: "context" },
  { id: "impact", labelFr: "Retentissement fonctionnel", order: 5, presentation: "impact" },
  { id: "adaptation", labelFr: "Adaptation, camouflage et compensation", order: 6, presentation: "context" },
  { id: "associated", labelFr: "Éléments associés", order: 7, presentation: "associated" },
  { id: "validation", labelFr: "Contexte et qualité des informations", order: 8, presentation: "context" }
];

export const coveragePolicy = {
  id: "descriptive-concept-coverage-v1",
  minimumAnsweredConcepts: 2,
  minimumConceptCoverage: 0.7,
  descriptionFr: "Un indice est affiché seulement si au moins deux concepts et 70 % des concepts applicables de la dimension ont une réponse exploitable. Cette règle concerne la qualité des données, pas un seuil clinique."
};

export const dimensionFor = ({ family, themeTitle, text }) => {
  const theme = normalize(themeTitle);
  const question = normalize(text);
  if (family === "adhd") {
    if (theme.includes("attention et regulation")) {
      if (/bouger|remuer|assis|sans activite|activite mentale|niveau d.activite/.test(question)) return "adhd.core.hyperactivity";
      if (/impatien|sortir de votre bouche|avant d.avoir verifie|consequences|avant que vous ayez|lancez-vous/.test(question)) return "adhd.core.impulsivity";
      return "adhd.core.inattention";
    }
    if (/enfance|adolescence/.test(theme)) return "adhd.trajectory.childhood";
    if (/persistance|chronicite|multi-contextes/.test(theme)) {
      if (/vie personnelle|travail|etudes|relations|administrative|financiere|loisirs|plusieurs|contexte/.test(question)) return "adhd.trajectory.multiple_contexts";
      return "adhd.trajectory.persistence";
    }
    if (theme.includes("fonctions executives")) {
      if (/commenc|initia|mettre.*action|pression exterieure|premieres actions|sans echeance/.test(question)) return "adhd.executive.initiation";
      if (/oubli|memoire|retenir|consigne|perd.*fil|relire|notez|piece|application/.test(question)) return "adhd.executive.working_memory";
      if (/arret|passer d.une activite|agir|parl|impuls|verifi|erreur|inhibition/.test(question)) return "adhd.executive.inhibition";
      return "adhd.executive.organization_planning";
    }
    if (/temps.*activation|activation.*motivation/.test(theme)) {
      if (/temps|duree|retard|avance|ponctuel|journee|echeance future/.test(question)) return "adhd.executive.time_management";
      return "adhd.executive.activation_motivation";
    }
    if (/hyperfocus|variabilite attentionnelle/.test(theme)) {
      if (/absorbe|passion|tres longtemps|notion du temps|manger|boire|dormir|interrompre/.test(question)) return "adhd.attention.hyperfocus";
      return "adhd.attention.variability";
    }
    if (theme.includes("impulsivite adulte")) return "adhd.core.impulsivity";
    if (theme.includes("regulation emotionnelle")) return "adhd.associated.emotional_regulation";
    if (/compensation|strategies/.test(theme)) return "adhd.associated.compensation";
    if (/retentissement|impact et contraintes/.test(theme)) return "adhd.impact.functional";
    if (/sommeil|rythme circadien/.test(theme) && !theme.includes("diagnostic")) return "adhd.associated.sleep";
    if (/diagnostic|differentiel/.test(theme)) {
      if (/sommeil|insomnie|apnee|nuit|rythme/.test(question) && !/energie.*elevee|besoin.*reduit/.test(question)) return "adhd.associated.sleep";
      return "adhd.validation.differentials";
    }
    if (/elements objectifs|qualite des preuves/.test(theme)) return "adhd.validation.evidence_quality";
    return "adhd.core.inattention";
  }

  if (/reciprocite/.test(theme)) return "autism.social.reciprocity";
  if (/communication non verbale/.test(theme)) return "autism.social.nonverbal_communication";
  if (/comprehension sociale|relations.*decodage|decodage social|pragmatique/.test(theme)) {
    if (/ami|amitie|relation|groupe|isolement|proche|conflit|maintenir|creer des liens/.test(question)) return "autism.social.relationships";
    return "autism.social.social_decoding";
  }
  if (/comportements repetitifs/.test(theme)) return "autism.restricted.repetitive_behaviors";
  if (/routines|stabilite|changement/.test(theme)) return "autism.restricted.routines_stability";
  if (/interets specifiques/.test(theme)) return "autism.restricted.specific_interests";
  if (/sensorialite/.test(theme)) {
    if (/peu sensible|ne remar|recherch|stimulation forte|douleur|temperature|faim|soif|hypo/.test(question)) return "autism.sensory.hyposensitivity";
    return "autism.sensory.hypersensitivity";
  }
  if (/enfance|histoire developpementale/.test(theme)) return "autism.trajectory.childhood";
  if (/camouflage|compensation|assimilation/.test(theme)) {
    if (/fatigue|epuise|cout|effort|recuper|retentissement/.test(question)) return "autism.adaptation.adaptive_cost";
    if (/cach|camoufl|masqu|imiter|copier|apparaitre|dissimuler/.test(question)) return "autism.adaptation.masking";
    return "autism.adaptation.compensation";
  }
  if (/retentissement|besoins de soutien/.test(theme)) return "autism.impact.functional";
  if (/differentiel|comorbid/.test(theme)) return "autism.validation.differentials";
  if (/interoception|alexithymie/.test(theme)) {
    if (/emotion|nommer|identifier ce que|decrire ce que|alexithym/.test(question)) return "autism.associated.alexithymia";
    return "autism.associated.interoception";
  }
  if (/chronicite|contextes|qualite des preuves/.test(theme)) {
    if (/bulletin|document|proche|personne.*connu|exemple|preuve|souvenir|information/.test(question)) return "autism.validation.evidence_quality";
    if (/contexte|travail|etude|famille|social|plusieurs|environnement/.test(question)) return "autism.trajectory.multiple_contexts";
    return "autism.trajectory.persistence";
  }
  return "autism.social.reciprocity";
};

const conceptRules = {
  "adhd.core.inattention": [
    ["distractibility", "Distractibilité externe ou interne", /bruit|mouvement|notification|distrai|nouvelle activite|autre chose/],
    ["sustained_attention", "Maintien de l’attention", /maintenir|longue|cess.*ecouter|peu stimulant|ennuyeu/],
    ["reading_listening", "Traitement de l’information lue ou entendue", /relire|passage|explication|ecouter|lecture/],
    ["forgetfulness_omissions", "Oublis et omissions", /oubli|omet|etape|rappel|agenda|disparaissent de votre esprit/]
  ],
  "adhd.core.hyperactivity": [
    ["motor_restlessness", "Agitation motrice", /bouger|remuer|jambe|position|assis/],
    ["internal_restlessness", "Agitation interne", /mentale|ralentir|sans activite|effort inhabituel/],
    ["stimulation_seeking", "Recherche de stimulation", /stimulation|ennui|nouvelle source/]
  ],
  "adhd.core.impulsivity": [
    ["verbal_impulsivity", "Impulsivité verbale", /bouche|parl|repond|interromp/],
    ["action_decision", "Action ou décision précipitée", /action|decision|consequence|risque|achat|conduite/],
    ["waiting_impatience", "Attente et impatience", /attente|impatien|delai|lenteur/]
  ],
  "adhd.executive.initiation": [
    ["intent_action_gap", "Décalage entre intention et action", /exactement ce que|incapable|mal a commenc|demarrer/],
    ["external_prompt", "Dépendance à une impulsion extérieure", /autre personne|pression exterieure|accompagne|a cote/],
    ["deadline_dependency", "Dépendance à l’échéance", /echeance|semaines|dernier moment/],
    ["first_step", "Identification de la première étape", /premiere|objectif general|action concrete/]
  ],
  "adhd.executive.organization_planning": [
    ["task_breakdown", "Découpage et séquençage", /etape|decoup|ordre logique|complexe/],
    ["prioritization", "Priorisation", /priorit|choisir.*tache/],
    ["task_completion", "Suivi et achèvement", /plusieurs.*tach|plusieurs.*projet|termin|accumul/],
    ["physical_digital_organization", "Organisation matérielle et numérique", /papier|fichier|objet|classement|desorganis/],
    ["external_structure", "Besoin de structure externe", /structure|autonomie|outils externes|systeme exterieur/]
  ],
  "adhd.executive.working_memory": [
    ["instructions", "Maintien des consignes", /consigne|plusieurs etapes/],
    ["prospective_memory", "Mémoire des intentions", /oubl.*faire|piece|application|notez|rappel/],
    ["interruption_recovery", "Reprise après interruption", /interruption|retrouver le fil|perdez.*fil/],
    ["short_term_retention", "Rétention à court terme", /quelques secondes|information|relire|memoire/]
  ],
  "adhd.executive.time_management": [
    ["duration_estimation", "Estimation des durées", /sous-estim|surestim|duree|necessaire/],
    ["time_awareness", "Perception du temps", /notion du temps|temps ecoule|ressentir le temps/],
    ["punctuality", "Ponctualité", /retard|avance|ponctuel/],
    ["daily_planning", "Planification temporelle", /journee|accomplir|prevoir/],
    ["future_deadline", "Représentation des échéances", /echeance|future|lointaine|abstraite/]
  ],
  "adhd.executive.inhibition": [
    ["response_inhibition", "Inhibition d’une réponse", /agir|parler|action impulsive|avant d.avoir/],
    ["stopping_switching", "Arrêt et transition", /arreter|passer d.une activite|interrompre/],
    ["checking_monitoring", "Vérification et contrôle", /verifi|erreur|information necessaire/]
  ],
  "adhd.executive.activation_motivation": [
    ["low_interest_activation", "Activation pour les tâches peu stimulantes", /ennuyeu|interessante|recompense immediate/],
    ["urgency_activation", "Activation par l’urgence", /urgence|dernier moment|echeance proche/],
    ["novelty_motivation", "Motivation par la nouveauté", /nouveaute|debut.*projet/],
    ["delayed_reward", "Effort avec récompense différée", /recompense.*eloignee|effort|motivation chute/]
  ],
  "adhd.attention.variability": [
    ["interest_based", "Attention dépendante de l’intérêt", /interet|ennuyeu|passion/],
    ["context_structure", "Attention dépendante du contexte", /structure|environnement|urgence|nouveaute/],
    ["attention_fluctuation", "Fluctuations attentionnelles", /vari|rapidement|extreme/]
  ],
  "adhd.attention.hyperfocus": [
    ["disengagement", "Difficulté à interrompre l’hyperfocus", /interrompre|arreter|absorbe/],
    ["time_loss", "Perte de la notion du temps", /notion du temps|tres longtemps/],
    ["basic_needs_cost", "Mise à l’écart des besoins et relations", /manger|boire|dormir|repondre aux autres/]
  ],
  "adhd.trajectory.childhood": [
    ["school", "Manifestations scolaires anciennes", /ecole|scolaire|classe|enseignant|devoir|bulletin/],
    ["home", "Manifestations anciennes à la maison", /maison|parent|famille|chambre/],
    ["behavior", "Comportements anciens", /agit|bavard|impuls|attendre|bouge/],
    ["attention_organization", "Attention et organisation dans l’enfance", /oubli|inattention|organis|perd|consigne/]
  ],
  "adhd.trajectory.persistence": [
    ["lifelong_continuity", "Continuité au cours de la vie", /plus jeune|continue|reappara|persiste|existaient/],
    ["mood_independent", "Persistance hors épisodes émotionnels", /humeur|depress|anxiete|episode/],
    ["motivation_independent", "Persistance malgré la motivation", /motive|bien faire/]
  ],
  "adhd.trajectory.multiple_contexts": [
    ["work_study", "Travail ou études", /travail|etude|scolaire/],
    ["home_personal", "Vie personnelle ou domestique", /personnelle|maison|domestique/],
    ["social", "Relations et vie sociale", /relation|social|personne/],
    ["administrative_financial", "Gestion administrative ou financière", /administrative|financiere/],
    ["leisure", "Loisirs et projets personnels", /loisir|projet personnel/]
  ],
  "adhd.associated.emotional_regulation": [
    ["emotional_intensity", "Intensité et montée émotionnelle", /intens|monte|deborde/],
    ["frustration", "Frustration et irritabilité", /frustr|irrit|colere|impatien/],
    ["rejection_sensitivity", "Réactivité à la critique ou au rejet", /rejet|critique|remarque|honte/],
    ["recovery", "Retour à l’équilibre", /calmer|recuper|redescendre|durer/]
  ],
  "adhd.associated.compensation": [
    ["external_tools", "Outils et rappels externes", /alarme|rappel|agenda|liste|telephone|notez|visible/],
    ["overpreparation", "Surpréparation et vérification", /verifi|avance|anticip|prepar/],
    ["external_support", "Soutien organisationnel d’un tiers", /autre personne|depend/],
    ["avoidance", "Évitement compensatoire", /evit/],
    ["compensation_cost", "Coût de la compensation", /fatigue|effort mental|masque|epuise/]
  ],
  "adhd.associated.sleep": [
    ["sleep_onset_circadian", "Endormissement et rythme circadien", /endormir|heure|decal|rythme|coucher/],
    ["sleep_quality", "Sommeil non réparateur", /recuper|mauvaise nuit|satisfaisante|irregulier/],
    ["sleep_disorder_signs", "Signes de trouble du sommeil à explorer", /ronfl|apnee|respiratoire|jambes|insomnie/],
    ["daytime_impact", "Retentissement diurne du sommeil", /journee|retard|absence|attention/]
  ],
  "adhd.impact.functional": [
    ["work", "Retentissement professionnel", /travail|emploi|profession/],
    ["studies", "Retentissement scolaire ou universitaire", /etude|scolaire|universit|formation/],
    ["household", "Vie domestique et autonomie", /maison|domestique|menage|repas|administr/],
    ["financial", "Gestion financière", /argent|financ|dette|achat|facture/],
    ["relationships", "Relations proches", /couple|famille|relation|proche/],
    ["social", "Vie sociale", /social|ami|isolement/],
    ["health_safety", "Santé et sécurité", /sante|securite|accident|conduite|traitement/],
    ["self_image", "Estime de soi et charge subjective", /estime|honte|culpabil|epuise|fatigue|confiance/]
  ],
  "adhd.validation.differentials": [
    ["depression", "Humeur dépressive à explorer", /depress|humeur basse/],
    ["anxiety", "Anxiété à explorer", /anxiete|inquietude|rumination/],
    ["bipolarity", "Épisodes d’activation thymique à explorer", /energie.*elevee|sommeil.*reduit|prise de risque|debit de parole/],
    ["trauma", "Traumatisme à explorer", /trauma|flashback|alerte/],
    ["ocd", "Obsessions ou compulsions à explorer", /obsession|compulsion/],
    ["autism", "Autisme à explorer", /spectre|autisme|sensoriel|social/],
    ["learning", "Trouble des apprentissages à explorer", /lecture|ecriture|calcul|apprentissage/],
    ["substances_medication", "Substances ou médicaments à explorer", /alcool|cannabis|substance|medicament/],
    ["medical", "Contexte médical à explorer", /maladie|douleur|thyroid|carence|neurolog|medical/],
    ["situational", "Explication situationnelle à explorer", /seule situation|seule relation|stress|autre explication/]
  ],
  "adhd.validation.evidence_quality": [
    ["school_records", "Documents scolaires", /bulletin|scolaire|document/],
    ["childhood_informant", "Témoignage d’un proche de l’enfance", /connu enfant|avant 12 ans/],
    ["current_informant", "Observation actuelle par un proche", /connait actuellement|vie adulte/],
    ["concrete_impairment", "Conséquences concrètes dans plusieurs domaines", /consequence|domaines de vie/],
    ["dated_examples", "Exemples précis et datés", /precis|date|avant l.age adulte/],
    ["source_concordance", "Concordance des sources", /souvenir|proche|informations|racontent/]
  ],
  "autism.social.reciprocity": [
    ["conversation_flow", "Rythme et réciprocité conversationnelle", /conversation|prendre la parole|tour|echange/],
    ["sharing_interest_emotion", "Partage d’intérêts et d’émotions", /partager|interet|emotion|enthousiasme/],
    ["social_initiation_response", "Initiation et réponse sociales", /initier|repondre|approche|spontan/],
    ["perspective_empathy", "Ajustement à l’état d’autrui", /ressent|point de vue|besoin|empath|reaction/]
  ],
  "autism.social.nonverbal_communication": [
    ["eye_gaze", "Regard et contact visuel", /regard|yeux|visuel/],
    ["facial_expression", "Expressions faciales", /visage|expression|mimique/],
    ["gesture_posture", "Gestes et posture", /geste|posture|corporel/],
    ["prosody", "Prosodie et ton de voix", /ton|voix|intonation|prosodie/],
    ["integration", "Coordination verbal-non verbal", /coordon|simultan|non verbal/]
  ],
  "autism.social.social_decoding": [
    ["implicit_rules", "Règles sociales implicites", /implicite|regle|attendu|convention/],
    ["figurative_language", "Langage indirect et figuré", /ironie|sarcas|sous-entendu|figure|litteral/],
    ["intentions_emotions", "Décodage des intentions et émotions", /intention|emotion|visage|comprendre.*autre/],
    ["context_pragmatics", "Pragmatique et adaptation au contexte", /contexte|pragmat|adapter|approprie/]
  ],
  "autism.social.relationships": [
    ["friendship_formation", "Création de relations", /creer|nouer|ami|amitie|rencontr/],
    ["relationship_maintenance", "Maintien des relations", /maintenir|durer|contact|eloign/],
    ["group_belonging", "Appartenance aux groupes", /groupe|apparten|integration|exclu/],
    ["conflict_boundaries", "Conflits et limites relationnelles", /conflit|limite|malentendu|rupture/]
  ],
  "autism.restricted.repetitive_behaviors": [
    ["motor", "Mouvements répétitifs", /mouvement|balanc|main|doigt|corps|stereotyp/],
    ["speech", "Paroles ou sons répétitifs", /mot|phrase|son|repete|echolal/],
    ["object_use", "Manipulation répétitive d’objets", /objet|align|tourner|manipul/],
    ["self_regulation", "Fonction d’autorégulation", /calm|regul|stress|tension/]
  ],
  "autism.restricted.routines_stability": [
    ["daily_routines", "Routines quotidiennes", /routine|rituel|habitude|ordre/],
    ["change_response", "Réaction au changement", /changement|imprevu|modifier|annul/],
    ["transition", "Transitions", /transition|passer|interrompre/],
    ["predictability", "Besoin de prévisibilité", /prevoir|previsible|plan|incertitude/]
  ],
  "autism.restricted.specific_interests": [
    ["intensity_depth", "Intensité et profondeur", /intens|profond|expert|detail/],
    ["time_investment", "Temps consacré", /temps|heures|longtemps/],
    ["monotropism", "Focalisation monotropique", /focal|absorbe|monotrop|un seul/],
    ["social_function", "Fonction sociale et identitaire", /partager|identite|conversation|relation/]
  ],
  "autism.sensory.hypersensitivity": [
    ["auditory", "Hypersensibilité auditive", /bruit|son|audit/],
    ["visual", "Hypersensibilité visuelle", /lumiere|visuel|couleur/],
    ["touch", "Hypersensibilité tactile", /toucher|texture|vetement|contact/],
    ["smell_taste", "Hypersensibilité olfactive ou gustative", /odeur|gout|aliment/],
    ["overload", "Surcharge sensorielle", /surcharge|envahi|epuise|fuir/]
  ],
  "autism.sensory.hyposensitivity": [
    ["body_signals", "Perception réduite des signaux corporels", /faim|soif|temperature|douleur|corps/],
    ["sensory_seeking", "Recherche sensorielle", /recherch|stimulation|pression|mouvement/],
    ["low_registration", "Faible enregistrement sensoriel", /ne remar|peu sensible|tard/]
  ],
  "autism.trajectory.childhood": [
    ["early_social", "Manifestations sociales précoces", /jeu|enfant|ami|groupe|social/],
    ["early_communication", "Communication précoce", /langage|parole|geste|communi/],
    ["early_routines_interests", "Routines et intérêts précoces", /routine|changement|interet|repet/],
    ["early_sensory", "Particularités sensorielles précoces", /bruit|sensor|texture|lumiere/]
  ],
  "autism.trajectory.persistence": [
    ["lifelong_continuity", "Continuité au cours de la vie", /toujours|enfance|persiste|continu|stable/],
    ["change_over_time", "Évolution de la présentation", /evolu|change.*age|adulte|periode/]
  ],
  "autism.trajectory.multiple_contexts": [
    ["work_study", "Travail ou études", /travail|etude|ecole/],
    ["home_family", "Vie familiale ou domestique", /famille|maison|domestique/],
    ["social", "Contextes sociaux", /social|groupe|relation/],
    ["environment_variation", "Variation selon l’environnement", /environnement|contexte|structure/]
  ],
  "autism.adaptation.masking": [
    ["imitation", "Imitation sociale", /imit|copi|reprodu/],
    ["suppression", "Dissimulation de comportements", /cach|dissimul|supprim|control/],
    ["social_performance", "Performance sociale apprise", /script|repete|apparaitre|jouer un role|camoufl/]
  ],
  "autism.adaptation.compensation": [
    ["scripts_preparation", "Scripts et préparation", /script|prepar|repete|antici/],
    ["explicit_analysis", "Analyse explicite des situations sociales", /analyse|observe|regle|appris/],
    ["environment_strategy", "Aménagement de l’environnement", /evit|choisir|environnement|strategie/]
  ],
  "autism.adaptation.adaptive_cost": [
    ["fatigue", "Fatigue liée à l’adaptation", /fatigue|epuise|recuper/],
    ["identity_cost", "Coût identitaire", /identite|authent|moi-meme|role/],
    ["delayed_overload", "Surcharge différée", /apres|effond|surcharge|meltdown|shutdown/]
  ],
  "autism.associated.alexithymia": [
    ["emotion_identification", "Identification des émotions", /identifier|nommer|quelle emotion/],
    ["emotion_description", "Description des émotions", /decrire|expliquer|exprimer/],
    ["emotion_body_link", "Lien entre émotions et sensations", /sensation|corps|physique/]
  ],
  "autism.associated.interoception": [
    ["hunger_thirst", "Faim et soif", /faim|soif/],
    ["pain_temperature", "Douleur et température", /douleur|temperature|chaud|froid/],
    ["arousal_fatigue", "Activation, fatigue et besoins corporels", /fatigue|tension|toilette|respir|coeur/]
  ],
  "autism.impact.functional": [
    ["work_studies", "Travail ou études", /travail|etude|ecole|formation/],
    ["relationships", "Relations", /relation|couple|famille|ami|social/],
    ["daily_living", "Vie quotidienne et autonomie", /quotidien|autonom|administr|maison|tache/],
    ["health_exhaustion", "Santé, surcharge et épuisement", /sante|fatigue|epuise|surcharge|crise/],
    ["support_needs", "Besoins de soutien", /aide|soutien|accompagnement|amenagement/]
  ],
  "autism.validation.differentials": [
    ["adhd", "TDAH à explorer", /tdah|attention|hyperactiv|impuls/],
    ["anxiety", "Anxiété à explorer", /anxiete|phobie|peur|inquiet/],
    ["trauma", "Traumatisme à explorer", /trauma|flashback|alerte/],
    ["ocd", "TOC à explorer", /obsession|compulsion|toc/],
    ["mood", "Trouble de l’humeur à explorer", /depress|humeur|mania|bipol/],
    ["language_learning", "Langage ou apprentissages à explorer", /langage|lecture|apprentissage|intellect/],
    ["sensory_medical", "Contexte sensoriel ou médical à explorer", /auditif|visuel|medical|neurolog|maladie/]
  ],
  "autism.validation.evidence_quality": [
    ["records", "Documents disponibles", /bulletin|document|dossier|video/],
    ["informants", "Témoignages de proches", /proche|parent|personne.*connu/],
    ["concrete_examples", "Exemples concrets", /exemple|situation|date|consequence/],
    ["source_concordance", "Concordance des informations", /concord|souvenir|information|meme histoire/]
  ]
};

export const roleForDimension = (dimensionId) => {
  if (dimensionId.endsWith(".differentials")) return "differential";
  if (dimensionId.endsWith(".sleep")) return "medical-context";
  if (dimensionId.endsWith(".evidence_quality")) return "evidence";
  if (dimensionId.includes(".trajectory.")) return "developmental";
  if (dimensionId.includes(".impact.")) return "impairment";
  if (dimensionId.includes(".associated.") || dimensionId.includes(".adaptation.") || dimensionId.includes(".attention.")) return "associated";
  return "core";
};

export const conceptFor = (dimensionId, text, dimensionLabel) => {
  const rules = conceptRules[dimensionId] || [];
  const rule = rules.find(([, , pattern]) => matches(text, pattern));
  const suffix = rule?.[0] || "general_presentation";
  const labelFr = rule?.[1] || `Présentation générale — ${dimensionLabel}`;
  return { id: `${dimensionId}.${suffix}`, dimensionId, labelFr };
};
