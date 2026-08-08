export const groupGuidance = {
    index: "Indices descriptifs issus des concepts explorés par vos réponses. Ils décrivent une intensité ou une fréquence déclarée, pas une probabilité diagnostique.",
    impact: "Retentissement déclaré dans la vie quotidienne. Il est présenté séparément des caractéristiques centrales.",
    associated: "Caractéristiques fréquemment utiles pour comprendre le vécu, sans renforcer artificiellement un indice central.",
    context: "Informations nécessaires pour interpréter le profil et préparer l’échange clinique ; elles ne constituent pas un score diagnostique."
};

export const resultStateLabels = {
    "not-explored": "Non explorée dans cette version",
    "flags-only": "Points à discuter uniquement — aucun indice",
    "not-applicable": "Non applicable",
    insufficient: "Données insuffisantes"
};

const descriptions = {
    "adhd.core.inattention": "Maintien et orientation de l’attention, distractibilité, oublis et omissions dans les activités.",
    "adhd.core.hyperactivity": "Agitation motrice ou interne et difficulté à ajuster le niveau d’activité à la situation.",
    "adhd.core.impulsivity": "Attente, interruption, parole, décisions ou actions engagées avant d’avoir pu les différer.",
    "adhd.executive.initiation": "Passage de l’intention à l’action, notamment lorsqu’une tâche est peu stimulante ou sans échéance proche.",
    "adhd.executive.organization_planning": "Découpage, séquençage, priorisation et organisation concrète des tâches.",
    "adhd.executive.working_memory": "Maintien temporaire des informations nécessaires pour suivre une consigne ou terminer une action.",
    "adhd.executive.time_management": "Perception du temps, anticipation des durées, ponctualité et utilisation des échéances.",
    "adhd.executive.inhibition": "Capacité à suspendre une réponse, interrompre une action ou passer volontairement à autre chose.",
    "adhd.executive.activation_motivation": "Mobilisation de l’effort et maintien de l’engagement malgré un intérêt ou une récompense différés.",
    "adhd.attention.variability": "Fluctuations de disponibilité attentionnelle selon le moment, la stimulation et le contexte.",
    "adhd.attention.hyperfocus": "Absorption attentionnelle intense et difficulté éventuelle à remarquer le temps ou à changer d’activité.",
    "adhd.trajectory.childhood": "Présence rapportée de manifestations similaires pendant l’enfance et traces développementales disponibles.",
    "adhd.trajectory.persistence": "Continuité ou réapparition des difficultés au fil du temps, au-delà d’un épisode ponctuel.",
    "adhd.trajectory.multiple_contexts": "Présence des difficultés dans plusieurs environnements ou types de situations.",
    "adhd.associated.emotional_regulation": "Intensité, rapidité et durée des réactions émotionnelles et retour à un niveau plus stable.",
    "adhd.associated.compensation": "Stratégies, efforts et soutiens utilisés pour prévenir, masquer ou corriger les difficultés.",
    "adhd.associated.sleep": "Sommeil et rythmes susceptibles d’influencer l’attention, l’activation ou l’impulsivité ; aucun point TDAH n’est ajouté.",
    "adhd.impact.functional": "Conséquences déclarées sur les études, le travail, les relations, l’autonomie ou la vie quotidienne.",
    "adhd.validation.differentials": "Autres explications ou situations à examiner avec un professionnel ; ces réponses ne donnent aucun point TDAH.",
    "adhd.validation.evidence_quality": "Diversité des sources disponibles : souvenirs, proches, documents anciens et observations dans plusieurs contextes.",
    "autism.social.reciprocity": "Allers-retours sociaux et émotionnels, partage, ajustement mutuel et compréhension de la réciprocité.",
    "autism.social.nonverbal_communication": "Utilisation et lecture du regard, des expressions, gestes, postures et autres signaux non verbaux.",
    "autism.social.social_decoding": "Interprétation des implicites, intentions, règles sociales et changements de sens selon le contexte.",
    "autism.social.relationships": "Création, compréhension, ajustement et maintien des relations selon les situations.",
    "autism.restricted.repetitive_behaviors": "Gestes, paroles, séquences ou façons de faire répétitives et fonctions qu’ils peuvent remplir.",
    "autism.restricted.routines_stability": "Besoin de prévisibilité, préparation des changements et effets des imprévus.",
    "autism.restricted.specific_interests": "Intensité, profondeur, place et rôle régulateur d’intérêts particulièrement investis.",
    "autism.sensory.hypersensitivity": "Réactions fortes ou coûteuses à certains sons, lumières, textures, odeurs ou autres stimulations.",
    "autism.sensory.hyposensitivity": "Perception faible ou recherche de certaines stimulations sensorielles.",
    "autism.trajectory.childhood": "Présence rapportée de particularités similaires pendant l’enfance et traces développementales disponibles.",
    "autism.trajectory.persistence": "Continuité des particularités au fil du temps malgré les apprentissages et adaptations.",
    "autism.trajectory.multiple_contexts": "Présence des particularités dans plusieurs environnements ou types de situations.",
    "autism.adaptation.masking": "Dissimulation, imitation ou contrôle volontaire de comportements afin de paraître plus conforme aux attentes.",
    "autism.adaptation.compensation": "Stratégies apprises pour comprendre les situations et soutenir la communication ou l’adaptation.",
    "autism.adaptation.adaptive_cost": "Fatigue, tension, récupération ou perte de disponibilité associées aux efforts d’adaptation.",
    "autism.associated.alexithymia": "Repérage, différenciation et mise en mots des états émotionnels.",
    "autism.associated.interoception": "Perception et interprétation des signaux corporels internes comme la faim, la douleur ou la tension.",
    "autism.impact.functional": "Conséquences déclarées sur les études, le travail, les relations, l’autonomie ou la vie quotidienne.",
    "autism.validation.differentials": "Autres explications ou situations à examiner avec un professionnel ; ces réponses ne donnent aucun point TSA.",
    "autism.validation.evidence_quality": "Diversité des sources disponibles : souvenirs, proches, documents anciens et observations dans plusieurs contextes."
};

export const dimensionDescription = (dimensionId) => descriptions[dimensionId] || "Dimension descriptive construite à partir des concepts renseignés dans cette version du questionnaire.";

export const methodSummary = "Chaque réponse calculable produit une valeur d’item. Les formulations portant sur un même concept sont d’abord moyennées ; les concepts suffisamment renseignés sont ensuite moyennés dans leur dimension. Un concept ne pèse donc pas davantage parce qu’il possède plusieurs formulations.";
