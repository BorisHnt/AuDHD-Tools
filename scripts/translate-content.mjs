import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const targetLanguage = process.argv[2] || "en";
if (!/^(en|ru)$/.test(targetLanguage)) throw new Error("Usage: node scripts/translate-content.mjs [en|ru]");
const sourceFiles = ["site-data/tests.json", "site-data/waves.json"];
const outputDirectory = `site-data/${targetLanguage}`;
const russianOverrides = {
  "TDAH 100": "СДВГ 100",
  "TDAH 250": "СДВГ 250",
  "TSA 100": "РАС 100",
  "TSA 250": "РАС 250",
  "Initiation": "Начало действий",
  "Gestion du temps": "Управление временем",
  "Inhibition": "Тормозный контроль",
  "Activation et motivation": "Активация деятельности и мотивация",
  "Persistance temporelle": "Устойчивость во времени",
  "Présence dans plusieurs contextes": "Проявления в разных ситуациях",
  "Sommeil": "Сон",
  "Retentissement fonctionnel": "Влияние на повседневную жизнь",
  "Diagnostics différentiels à explorer": "Возможные альтернативные объяснения",
  "Qualité des preuves": "Качество данных",
  "Retentissement diurne du sommeil": "Влияние сна на дневное состояние",
  "Être empêché de réaliser un comportement régulateur peut-il augmenter votre inconfort ?": "Усиливается ли ваш дискомфорт, если вам мешают использовать привычный способ саморегуляции?",
  "RETENTISSEMENT FONCTIONNEL CONDENSE": "КРАТКОЕ ОПИСАНИЕ ВЛИЯНИЯ НА ПОВСЕДНЕВНУЮ ЖИЗНЬ",
  "RETENTISSEMENT FONCTIONNEL": "ВЛИЯНИЕ НА ПОВСЕДНЕВНУЮ ЖИЗНЬ",
  "Intérêts spécifiques": "Особые интересы",
  "Camouflage": "Маскирование",
  "Coût adaptatif": "Цена адаптации",
  "Comportements, intérêts et sensorialité": "Поведение, интересы и сенсорные особенности",
  "Éléments associés": "Сопутствующие особенности",
  "Vague TDAH indéterminée ou mixte": "Неопределённая или смешанная волна СДВГ",
  "Crise de frustration et d’impatience": "Приступ фрустрации и нетерпения",
  "Montée de colère et impulsivité émotionnelle": "Нарастание гнева и эмоциональная импульсивность",
  "Effondrement face à la critique ou au rejet": "Острая реакция на критику или отвержение",
  "Crise de sous-stimulation et d’ennui": "Приступ из-за недостатка стимуляции и скуки",
  "Paralysie au démarrage d’une tâche": "Паралич при начале задачи",
  "Débordement devant trop de tâches ou de décisions": "Перегрузка из-за множества задач или решений",
  "Impulsion difficile à retenir": "Импульс, который трудно сдержать",
  "Interruption forcée de l’hyperfocus ou transition imprévue": "Вынужденное прерывание гиперфокуса или неожиданное переключение",
  "Panique temporelle : retard, échéance et accumulation": "Паника из-за времени: опоздание, дедлайн и накопившиеся дела",
  "Vague indéterminée ou mixte": "Неопределённая или смешанная волна",
  "Attachement anxieux et peur de l’abandon": "Тревожная привязанность и страх быть покинутым",
  "Peur d’être remplacé et jalousie anxieuse": "Страх быть заменённым и тревожная ревность",
  "Limérence et focalisation affective": "Лимеренция и эмоциональная фиксация",
  "Rumination mentale": "Руминации — зацикленные размышления",
  "Pensées intrusives": "Навязчивые мысли",
  "Besoin de certitude, vérifications et réassurance": "Потребность в определённости, перепроверках и заверениях",
  "Montée d’angoisse et crise de panique": "Нарастание тревоги и паническая атака",
  "Crise d’auto-dévalorisation": "Приступ самообесценивания",
  "Sentiment d’imposture": "Чувство самозванца",
  "Vague de honte": "Волна стыда",
  "Culpabilité envahissante": "Всепоглощающее чувство вины",
  "Vague dépressive et idées passives de disparition": "Депрессивная волна и пассивные мысли об исчезновении",
  "Surcharge autistique, shutdown et meltdown": "Аутистическая перегрузка, шатдаун и мелтдаун",
  "Paralysie exécutive et blocage devant une tâche": "Исполнительный паралич и блокировка перед задачей",
  "Hyperfocus difficile à interrompre": "Гиперфокус, который трудно прервать",
  "Épuisement, surinvestissement et risque de burn-out": "Истощение, чрезмерная отдача и риск выгорания",
  "Conflit et saturation relationnelle": "Конфликт и перегрузка в отношениях",
  "Colère retournée contre soi, autopunition et autosabotage": "Гнев, направленный на себя, самонаказание и самосаботаж",
  "Spirale nocturne, rumination et insomnie": "Ночная спираль мыслей, руминации и бессонница",
  "Critères de sortie": "Критерии выхода",
  "Prochaine vérification": "Следующая проверка",
  "Ligne du temps": "Хронология",
  "Avant": "До",
  "Déclencheur": "Триггер",
  "Montée": "Нарастание",
  "Pic": "Пик",
  "Descente": "Спад",
  "Maintenant": "Сейчас",
  "Traitement": "Работа со специалистом",
  "REPRENDRE": "ПРОДОЛЖИТЬ",
  "Long débat": "Затяжной спор",
  "Achat ou message chargé": "Импульсивная покупка или эмоциональное сообщение",
  "Boire de l’eau": "Выпить воды",
  "Casser ou frapper": "Ломать вещи или бить",
  "Conduire énervé": "Сесть за руль в гневе",
  "Multiplier les essais au hasard": "Бессистемно повторять попытки",
  "Body doubling silencieux": "Тихая совместная работа с присутствующим рядом человеком",
  "TCC/ERP avec professionnel si TOC possible.": "КПТ с экспозицией и предотвращением реакций — со специалистом, если возможно ОКР.",
  "TCC/ERP avec professionnel si TOC probable.": "КПТ с экспозицией и предотвращением реакций — со специалистом, если вероятно ОКР.",
  "Comprendre": "Понять",
  "COMPRENDRE": "ПОНЯТЬ",
  "Cette page doit rester exécutable avec peu de mémoire de travail. Lire une ligne, faire l’action, puis seulement passer à la suivante.": "Эта страница должна оставаться простой даже при сниженной концентрации. Прочитайте одну строку, выполните действие и только затем переходите к следующей.",
  "Capacité": "Ресурсы",
  "Hygiène de capacité": "Поддержание ресурсов",
  "Choisir le module dominant ou contacter une personne si la capacité ne revient pas.": "Выберите наиболее подходящий модуль или свяжитесь с человеком, если способность действовать не восстанавливается.",
  "Protéger sommeil, repas, hydratation et temps de récupération.": "Беречь сон, регулярное питание, водный баланс и время на восстановление.",
  "Suivre sommeil, faim, substances et horaire des traitements.": "Отслеживать сон, голод, употребление веществ и график приёма лекарств.",
  "Menace de perte du lien": "Угроза потери отношений",
  "Lien menacé pendant le désaccord": "Угроза отношениям во время разногласий",
  "Peur de perdre le lien": "Страх потерять отношения",
  "Rompre tous les liens": "Разорвать все отношения",
  "Séparer le fait de l’interprétation et protéger le lien sans exiger une certitude immédiate.": "Отделить факты от интерпретаций и сохранить отношения, не требуя немедленных заверений.",
  "Correction ou retour négatif": "Исправление или негативная обратная связь",
  "Si la critique est précise": "Если критика конкретна",
  "je réponds au point local sans condamner mon identité.": "я отвечаю по существу, не осуждая себя как личность",
  "Faire une activité extérieure au lien puis réévaluer à l’heure fixée.": "Заняться делом, не связанным с отношениями, и вернуться к оценке в назначенное время.",
  "Lire la colonne « fait »": "Прочитать колонку «Факт»",
  "Faire une tâche identitaire extérieure au lien": "Сделать что-то важное для себя вне этих отношений",
  "Répondre au contenu précis de la critique": "Ответить на конкретное содержание критики",
  "Recevoir un petit feedback sans répondre immédiatement": "Получить небольшую обратную связь и не отвечать сразу",
  "Envoyer un message chargé": "Отправить эмоционально заряженное сообщение",
  "Fuite ; Hyperventilation ; Appels répétés ; Évitement futur": "Бегство; гипервентиляция; повторные звонки; последующее избегание",
  "Les autres tâches sont garées": "Остальные задачи временно отложены",
  "Charge prolongée": "Длительная нагрузка",
  "Pas de grande discussion épuisé ou intoxiqué.": "Не вести серьёзные разговоры в состоянии истощения или опьянения.",
  "Le sujet est garé": "Тема отложена до подходящего времени",
  "Regarder l’heure sans cesse": "Постоянно смотреть на часы",
  "Protéger la journée suivante avec un niveau de charge réduit.": "Снизить нагрузку на следующий день, чтобы дать себе восстановиться.",
  "Urgence": "Ощущение срочности",
  "URGENCE": "ЭКСТРЕННАЯ ПОМОЩЬ",
  "Irritation ; Impuissance ; Urgence ; Découragement": "Раздражение; беспомощность; ощущение срочности; упадок духа",
  "Excitation ; Urgence ; Colère ; Soulagement anticipé": "Возбуждение; ощущение срочности; гнев; предвкушение облегчения",
  "Confusion ; Urgence ; Irritabilité ; Peur ou découragement": "Растерянность; ощущение срочности; раздражительность; страх или упадок духа",
  "Terreur ; Urgence ; Déréalisation ; Vulnérabilité": "Ужас; ощущение срочности; дереализация; уязвимость",
  "Travaillez-vous beaucoup plus efficacement lorsqu'une urgence apparaît ?": "Работаете ли вы гораздо эффективнее, когда возникает срочная задача?",
  "Scènes imaginées ; Relecture de signes ; Pensées intrusives centrées sur la personne ; Conviction que le lien résoudra tout": "Воображаемые сцены; повторный анализ знаков; навязчивые мысли о человеке; убеждение, что отношения решат все проблемы",
  "Surveillance ; Messages préparés longtemps ; Négligence d’autres liens ; Cadeaux ou promesses disproportionnés": "Наблюдение за человеком; долгое составление сообщений; пренебрежение другими отношениями; несоразмерные подарки или обещания",
  "    5. Escalade et menace du lien": "5. Эскалация и угроза отношениям",
  "AVANT TOUT  Si l’un de ces signes est présent - Envie de se blesser ; Moyens à proximité ; Plan ou intention ; Perte de contrôle ou intoxication - ne pas rester uniquement dans l’auto-aide.": "ПРЕЖДЕ ВСЕГО  Если есть желание причинить себе вред, опасные средства находятся рядом, есть план или намерение, возникает потеря контроля или опьянение — не ограничивайтесь самопомощью.",
  "j’appelle le 3114, le 15/112 ou je vais aux urgences": "я звоню по номеру 112 или еду в ближайшее отделение неотложной помощи",
  "Appel au 3114": "Телефон экстренной психологической помощи МЧС: +7 (495) 989-50-50",
  "je vais vers un lieu sûr ou appelle le 3114": "я иду в безопасное место или звоню по номеру 112",
  "3114 ; 15/112 si danger immédiat, ne pas rester seul.": "112 при непосредственной опасности; 103 для вызова скорой помощи; +7 (495) 989-50-50 для экстренной психологической помощи; не оставайтесь в одиночестве.",
  "Conserver le 3114 et les urgences visibles": "Держать на виду номера 112, 103 и +7 (495) 989-50-50",
  "Toute intention, plan ou préparation : urgence": "Любое намерение, план или подготовка требуют экстренной помощи",
  "Lire le dossier de preuves": "Прочитать подборку подтверждающих фактов",
  "Dossier de preuves": "Подборка подтверждающих фактов",
  "Mesurer la part de responsabilité, réparer ce qui peut l’être, puis fermer le dossier.": "Определить свою долю ответственности, исправить то, что возможно, а затем закрыть вопрос.",
  "Fixer la condition objective de fin du dossier.": "Определить объективное условие, при котором вопрос можно считать закрытым.",
  "Dossiers réellement clos": "Вопросы, которые действительно закрыты",
  "Préparer sa défense ; Généraliser ; Lire une rupture ; Dossier historique": "Готовить защиту; обобщать; видеть угрозу разрыва; поднимать историю прошлых конфликтов",
  "Quel était le sujet initial avant le dossier historique ?": "Какой была исходная тема до того, как всплыла история прошлых конфликтов?",
  "Demander cinq avis": "Спросить мнение у пяти человек",
  "Demander « suis-je dangereux ? »": "Спрашивать: «Я опасен?»",
  "Comparer avec des témoignages en ligne": "Сравнивать себя с чужими историями в интернете",
  "Si je veux refuser": "Если мне хочется отказаться от возможности",
  "j’attends un retour factuel externe": "я сначала запрашиваю конкретную внешнюю оценку",
  "Avis neutre": "Нейтральная оценка",
  "Si le danger est possible ou incertain": "Если опасность возможна или её трудно оценить",
  "je contacte immédiatement une aide humaine ou médicale.": "я немедленно связываюсь с близким человеком, специалистом или медицинской службой",
  "SIGNAL DE SÉCURITÉ  intention ou plan de se faire du mal ou de faire du mal ; peur de perdre le contrôle, conduite dangereuse, menace ou violence ; confusion, agitation très inhabituelle, symptôme physique inquiétant ou changement brutal après traitement ou substance. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Намерение или план причинить вред себе или другому человеку; страх потерять контроль; опасное вождение; угрозы или насилие; спутанность сознания; крайне необычное возбуждение; тревожный физический симптом; резкое изменение состояния после лечения или употребления вещества. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Danger immédiat ; Confusion inhabituelle ; Perte de contrôle redoutée ; Symptôme physique nouveau ou intense. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Непосредственная опасность; необычная спутанность сознания; страх потерять контроль; новый или сильный физический симптом. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Menaces ou violence dans la relation ; Impossibilité répétée de respecter un refus ; Idées suicidaires liées à la peur de perdre le lien. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Угрозы или насилие в отношениях; неоднократное нарушение отказа или личных границ; суицидальные мысли из-за страха потерять отношения. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Espionnage ou accès non consenti ; Menace, intimidation ou confrontation dangereuse ; Violence reçue ou exercée. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Слежка или доступ без согласия; угрозы, запугивание или опасная конфронтация; пережитое или совершённое насилие. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Contact répété malgré un refus ; Surveillance ou présence non souhaitée ; Perte majeure de fonctionnement ; Idées de mort après rejet. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Повторные попытки контакта вопреки отказу; слежка или нежелательное присутствие; значительное нарушение повседневной жизни; мысли о смерти после отвержения. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Nuits entières perdues ; Fonctionnement quotidien fortement altéré ; Rumination suicidaire ou violente avec intention. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Полностью бессонные ночи; серьёзное нарушение повседневной жизни; зацикленные мысли о самоубийстве или насилии с намерением действовать. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Pensée devenue désirée et planifiée ; Préparation ou accès organisé à des moyens ; Voix donnant des ordres ; Peur réelle de perdre le contrôle. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Мысль стала желанной и спланированной; подготовка или доступ к опасным средствам; голоса, отдающие приказы; реальный страх потерять контроль. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Vérifications dangereuses ; Retards ou incapacité à sortir ; Conflits répétés avec les proches ; Détresse majeure si la vérification est empêchée. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Опасные проверки; опоздания или невозможность выйти из дома; повторные конфликты с близкими; сильный дистресс, если проверку невозможно выполнить. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Douleur thoracique nouvelle ; Perte de connaissance ; Faiblesse d’un côté, trouble de la parole ; Difficulté respiratoire sévère ou symptôme inhabituel. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Новая боль в груди; потеря сознания; слабость с одной стороны тела или нарушение речи; сильное затруднение дыхания или необычный симптом. В этих случаях в первую очередь обратитесь за медицинской помощью.",
  "SIGNAL DE SÉCURITÉ  Idées de mort ; Autopunition ou privation ; Incapacité à assurer les besoins de base. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Мысли о смерти; самонаказание или лишение себя необходимого; неспособность обеспечить базовые потребности. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Épuisement sévère ; Fraude ou responsabilité réelle non examinée ; Dépression associée. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Сильное истощение; реальные признаки обмана или ответственности, которые ещё не были объективно проверены; сопутствующая депрессия. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Humiliation ou violence en cours ; Autopunition ; Idées suicidaires ; Isolement total après exposition. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Продолжающееся унижение или насилие; самонаказание; суицидальные мысли; полная изоляция после того, как ситуация стала известна другим. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Exploitation financière ou relationnelle ; Autopunition ; Idées suicidaires ; Tort grave nécessitant un professionnel ou une autorité. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Финансовая эксплуатация или эксплуатация в отношениях; самонаказание; суицидальные мысли; серьёзный вред, требующий вмешательства специалиста или компетентной службы. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Intention de mourir ; Plan ou préparation ; Accès organisé à des moyens ; Adieux, don d’objets, peur de passer à l’acte. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Намерение умереть; план или подготовка; доступ к опасным средствам; прощания, раздача вещей или страх совершить задуманное. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Blocage sur soins, alimentation ou sécurité ; Dégradation globale soudaine ; Épuisement sévère. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Невозможность позаботиться о здоровье, питании или безопасности; внезапное общее ухудшение состояния; сильное истощение. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Plusieurs nuits très réduites sans fatigue ressentie ; Agitation ou impulsivité inhabituelles ; Douleur ou déshydratation ; Conduite dangereuse. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Несколько ночей с очень коротким сном без ощущения усталости; необычное возбуждение или импульсивность; боль или обезвоживание; опасное вождение. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Incapacité à fonctionner ; Idées suicidaires ; Confusion ; Symptômes physiques persistants ou importants. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Неспособность справляться с повседневными делами; суицидальные мысли; спутанность сознания; стойкие или выраженные физические симптомы. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Insultes, menace, violence ; Blocage physique de la sortie ; Conduite dangereuse ; Enfants exposés à une escalade. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Оскорбления, угрозы или насилие; физическое препятствование выходу; опасное вождение; дети становятся свидетелями эскалации конфликта. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Envie de se blesser ; Moyens à proximité ; Plan ou intention ; Perte de contrôle ou intoxication. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Желание причинить себе вред; опасные средства находятся рядом; есть план или намерение; потеря контроля или опьянение. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "SIGNAL DE SÉCURITÉ  Plusieurs nuits avec très peu de sommeil et agitation inhabituelle ; Confusion ; Idées suicidaires ; Somnolence dangereuse au volant. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Несколько ночей с очень коротким сном и необычным возбуждением; спутанность сознания; суицидальные мысли; опасная сонливость за рулём. В этих случаях в первую очередь обратитесь к близкому человеку, специалисту или в медицинскую службу.",
  "Capacité dépassée": "Ресурсы исчерпаны",
  "DÉFINITION DE TRAVAIL  Les demandes sensorielles, sociales, cognitives ou émotionnelles dépassent les ressources disponibles. Le meltdown extériorise la perte de régulation ; le shutdown réduit fortement parole, mouvement ou initiative.": "РАБОЧЕЕ ОПРЕДЕЛЕНИЕ  Сенсорные, социальные, когнитивные или эмоциональные требования превышают доступные ресурсы. При мелтдауне утрата саморегуляции проявляется вовне; при шатдауне резко снижаются речь, движение или инициатива.",
  "Manifestations possibles chez une personne autiste ; ni shutdown ni meltdown ne sont des diagnostics séparés.": "Возможные проявления у аутичного человека; ни шатдаун, ни мелтдаун не являются отдельными диагнозами.",
  "Réduire les entrées, protéger la sécurité et laisser la récupération précéder toute explication.": "Уменьшить сенсорную и социальную нагрузку, обеспечить безопасность и дать восстановиться до любых объяснений.",
  "Lorsque cette expérience domine la vague ou apparaît comme son moteur principal.": "Когда это состояние преобладает или становится основной движущей силой волны.",
  "Charge accumulée": "Накопленная нагрузка",
  "Signaux précoces ignorés": "Ранние признаки остались без внимания",
  "Meltdown/shutdown": "Мелтдаун/шатдаун",
  "Récupération prolongée": "Длительное восстановление",
  "    1. Charge accumulée": "1. Накопленная нагрузка",
  "    2. Signaux précoces ignorés": "2. Ранние признаки остались без внимания",
  "    3. Capacité dépassée": "3. Ресурсы исчерпаны",
  "    4. Meltdown/shutdown": "4. Мелтдаун/шатдаун",
  "    5. Récupération prolongée": "5. Длительное восстановление",
  "Demandes simultanées": "Несколько требований одновременно",
  "Imprévu": "Неожиданное изменение",
  "Manifestations possibles": "Возможные проявления",
  "Douleur sensorielle ; Tête pleine ; Perte de parole ; Agitation ou immobilité": "Сенсорная боль; переполненность мыслями; потеря речи; возбуждение или неподвижность",
  "Difficulté à traiter le langage ; Pensée littérale ; Plus aucun choix possible ; Besoin de sortie": "Трудно понимать речь; буквальное мышление; невозможно сделать выбор; необходимо уйти",
  "Irritabilité ; Panique ; Détresse ; Engourdissement": "Раздражительность; паника; сильный дистресс; оцепенение",
  "Fuite ; Mouvements répétitifs ; Cris/pleurs ; Silence ou retrait": "Бегство; повторяющиеся движения; крики или плач; молчание или уход в себя",
  "À distinguer de : Crise de panique ; Colère volontaire ; Dépression ; Cause médicale ou douleur.": "Следует отличать от панической атаки, намеренной агрессии, депрессии, медицинской причины или боли.",
  "SIGNAL DE SÉCURITÉ  Risque physique pendant la fuite ; Auto-agression ; Confusion inhabituelle ; Douleur ou symptôme médical non expliqué. Dans ces cas, prioriser une aide humaine ou médicale.": "СИГНАЛ ОПАСНОСТИ  Риск травмы при попытке убежать; самоповреждение; необычная спутанность сознания; необъяснимая боль или медицинский симптом. В этих случаях в первую очередь обратитесь за помощью к человеку или медицинскому специалисту.",
  "Intensité actuelle /10": "Текущая интенсивность /10",
  "Sons plus agressifs": "Звуки воспринимаются резче",
  "Répétition": "Повторение движений или слов",
  "Besoin de rigidité": "Потребность в неизменности",
  "Signes faibles, choix encore souples": "Слабые признаки, выбор ещё остаётся гибким",
  "Urgence mentale, rétrécissement": "Ощущение срочности, сужение восприятия",
  "Capacité très réduite ou danger": "Способность действовать резко снижена или есть опасность",
  "Si le langage baisse": "Если становится труднее говорить",
  "j’utilise une phrase ou carte courte": "я использую короткую фразу или карточку",
  "je demande une pause avec heure de reprise": "я прошу о паузе и называю время возвращения",
  "Sécurité immédiate": "Немедленная оценка безопасности",
  "AVANT TOUT  Si l’un de ces signes est présent - Risque physique pendant la fuite ; Auto-agression ; Confusion inhabituelle ; Douleur ou symptôme médical non expliqué - ne pas rester uniquement dans l’auto-aide.": "ПРЕЖДЕ ВСЕГО  Если есть риск травмы при попытке убежать, самоповреждение, необычная спутанность сознания, необъяснимая боль или медицинский симптом — не ограничивайтесь самопомощью.",
  "N°": "№",
  "Gagner un lieu calme, sûr et connu.": "Перейдите в тихое, безопасное и знакомое место.",
  "Mouvement répétitif sûr, pression choisie, eau, température.": "Безопасные повторяющиеся движения, комфортное давление, вода или изменение температуры.",
  "Aucune analyse du conflit avant retour des capacités.": "Не анализируйте конфликт, пока способность воспринимать информацию не восстановится.",
  "Menu de régulation - en choisir une ou deux": "Способы саморегуляции — выберите один или два",
  "Position corporelle choisie": "Удобное положение тела",
  "Multiplier les questions": "Задавать много вопросов подряд",
  "Punir les comportements de régulation sûrs": "Наказывать за безопасные способы саморегуляции",
  "Le langage ou moyen alternatif revient": "Речь или альтернативный способ общения снова доступны",
  "Personne / service contacté": "Человек или служба, с которыми связались",
  "Quand la sécurité et la capacité sont revenues, remplir la page 4 - pas au pic.": "Когда безопасность и способность действовать восстановятся, заполните страницу 4 — не на пике волны.",
  "PASSAGE À L’ÉTAPE SUIVANTE  Quand la sécurité et la capacité sont revenues, remplir la page 4 - pas au pic.": "ПЕРЕХОД К СЛЕДУЮЩЕМУ ШАГУ  Когда безопасность и способность действовать восстановятся, заполните страницу 4 — не на пике волны.",
  "Réparation et mise à jour": "Исправление последствий и обновление плана",
  "Réparer matériellement ou relationnellement de façon simple.": "Простым способом возместить материальный ущерб или восстановить отношения.",
  "Une réparation observable": "Конкретный шаг по исправлению последствий",
  "Une modification de la fiche": "Одно изменение рабочего листа",
  "Qu’est-ce qui l’a réellement fait redescendre, même légèrement ?": "Что помогло волне ослабнуть хотя бы немного?",
  "Quelle charge s’est accumulée avant le dernier déclencheur ?": "Какая нагрузка накопилась до последнего триггера?",
  "Cinq piliers de fond": "Пять основных опор",
  "Entraînement hebdomadaire": "Еженедельная практика",
  "Cartes et phrases écrites.": "Письменные карточки и фразы.",
  "Repérer les lieux calmes et chemins.": "Заранее найти тихие места и пути выхода.",
  "Situations adaptées": "Ситуации, в которых удалось адаптировать условия",
  "Prévenir / réduire": "Профилактика / снижение интенсивности",
  "PRÉVENIR / RÉDUIRE": "ПРОФИЛАКТИКА / СНИЖЕНИЕ ИНТЕНСИВНОСТИ",
  "Cartographier sons, lumière, toucher, température et foule.": "Определить влияние звуков, света, прикосновений, температуры и толпы.",
  "Une pause sensorielle planifiée par demi-journée chargée": "Планировать сенсорную паузу на каждую насыщенную половину дня",
  "Tester le kit calme hors crise": "Проверить набор для успокоения вне кризиса",
  "Noter le coût des événements": "Отмечать, сколько сил отнимают события",
  "Ma limite non négociable": "Моя граница, которую нельзя нарушать",
  "Date de révision": "Дата пересмотра",
  "Besoin d’aménagements professionnels": "Необходимы адаптации на работе",
  "CONCLUSION DU MODULE  La cible n’est pas de « vaincre » capacité dépassée, mais de reconnaître plus tôt la vague, protéger la sécurité et reprendre des choix compatibles avec ses valeurs.": "ЗАКЛЮЧЕНИЕ МОДУЛЯ  Цель не в том, чтобы «победить» истощение ресурсов, а в том, чтобы раньше распознавать волну, сохранять безопасность и снова делать выбор в соответствии со своими ценностями.",
  "Cette page sert à apprendre, pas à recommencer la vague en haute définition. Répondre brièvement ; si l’intensité remonte au-dessus de 5/10, faire une pause.": "Эта страница помогает извлечь уроки, а не пережить волну заново во всех подробностях. Отвечайте кратко; если интенсивность снова поднимется выше 5/10, сделайте паузу.",
  "Profil de difficulté exécutive. Il ne permet pas à lui seul de distinguer TDAH, anxiété, dépression, perfectionnisme ou épuisement.": "Профиль трудностей исполнительных функций. Сам по себе он не позволяет отличить СДВГ от тревоги, депрессии, перфекционизма или истощения.",
  "CONCLUSION DU MODULE  La cible n’est pas de « vaincre » vague tdah mixte, mais de reconnaître plus tôt la vague, protéger la sécurité et reprendre des choix compatibles avec ses valeurs.": "ЗАКЛЮЧЕНИЕ МОДУЛЯ  Цель не в том, чтобы «победить» смешанную волну СДВГ, а в том, чтобы раньше её распознавать, сохранять безопасность и снова делать выбор в соответствии со своими ценностями."
};
const marker = (index) => `⟪${String(index).padStart(4, "0")}⟫`;
const classifyWaveLine = (line) => {
  const value = line.trim();
  if (/^Protocole immédiat/i.test(value)) return "protocol-heading";
  if (/^(Menu de régulation|À suspendre|Critères de sortie|Questions d’analyse|Ligne du temps|Réparation|Mes signes|Vulnérabilités|Feu tricolore|Mon plan|Quand demander|Cycle typique|Déclencheurs fréquents|Manifestations possibles|Cinq piliers|Mes règles|Entraînement hebdomadaire|Indicateurs personnels)/i.test(value)) return "heading";
  if (/^(AVANT TOUT|SIGNAL DE SÉCURITÉ|DÉCLENCHEUR DU PLAN)/.test(value)) return "safety";
  if (/^À distinguer de/i.test(value)) return "distinguish";
  if (/^DÉFINITION DE TRAVAIL/.test(value)) return "definition";
  if (/^Repères publics/.test(value)) return "references";
  if (/^(PASSAGE À L’ÉTAPE SUIVANTE|CONCLUSION DU MODULE)/.test(value)) return "note";
  return "content";
};
const annotateWaveLines = (document) => document.collections?.forEach((collection) => collection.modules.forEach((module) => module.pages.forEach((page) => {
  page.lineKinds = page.contentLines.map(classifyWaveLine);
})));

const translateBatch = (values) => {
  const input = values.map((value, index) => `${marker(index)} ${value}`).join("\n");
  const raw = execFileSync("curl", [
    "-sS", "--get", "https://translate.googleapis.com/translate_a/single",
    "--data-urlencode", "client=gtx", "--data-urlencode", "sl=fr",
    "--data-urlencode", `tl=${targetLanguage}`, "--data-urlencode", "dt=t",
    "--data-urlencode", `q=${input}`
  ], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  const translated = JSON.parse(raw)[0].map((part) => part[0]).join("");
  const positions = [...translated.matchAll(/⟪(\d{4})⟫\s*/g)];
  if (positions.length !== values.length)
    throw new Error(`Expected ${values.length} translations, received ${positions.length}.`);
  return positions.map((match, index) => translated
    .slice(match.index + match[0].length, positions[index + 1]?.index ?? translated.length)
    .replace(/\n$/, "").trim());
};

const collectTargets = (value, targets) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectTargets(entry, targets));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && key.endsWith("Fr"))
      targets.push({ value: entry, set: (translation) => { value[key] = translation; } });
    else if (key === "contentLines" && Array.isArray(entry))
      entry.forEach((line, index) => {
        const parts = line.split("\t");
        const translatedParts = [...parts];
        parts.forEach((part, partIndex) => targets.push({
          value: part,
          set: (translation) => {
            translatedParts[partIndex] = translation;
            entry[index] = translatedParts.join("\t");
          }
        }));
      });
    else collectTargets(entry, targets);
  }
};

const applyRussianReview = (source, translated) => {
  if (typeof source === "string" && typeof translated === "string") {
    if (russianOverrides[source]) return russianOverrides[source];
    if (source.includes("\t") && translated.includes("\t")) {
      const sourceParts = source.split("\t");
      const translatedParts = translated.split("\t");
      translated = translatedParts.map((part, index) => russianOverrides[sourceParts[index]] || part).join("\t");
    }
    return translated
      .replace(/^Публичные тесты:/, "Открытые источники:")
      .replace(/ОПРЕДЕЛЕНИЕ РАБОТЫ/g, "РАБОЧЕЕ ОПРЕДЕЛЕНИЕ");
  }
  if (Array.isArray(source) && Array.isArray(translated)) {
    source.forEach((entry, index) => { translated[index] = applyRussianReview(entry, translated[index]); });
    return translated;
  }
  if (source && translated && typeof source === "object" && typeof translated === "object")
    Object.entries(source).forEach(([key, entry]) => {
      if (key in translated) translated[key] = applyRussianReview(entry, translated[key]);
    });
  return translated;
};

const harmonizeRussianSafety = (document) => document.collections?.forEach((collection) => {
  collection.modules.forEach((module) => {
    const understandingPage = module.pages.find((page) => page.phase === "understand");
    const duringPage = module.pages.find((page) => page.phase === "during");
    const sourceIndex = understandingPage?.lineKinds?.findIndex((kind) => kind === "safety") ?? -1;
    const targetIndex = duringPage?.lineKinds?.findIndex((kind) => kind === "safety") ?? -1;
    if (sourceIndex < 0 || targetIndex < 0) return;
    const safetyBody = understandingPage.contentLines[sourceIndex]
      .replace(/^СИГНАЛ (?:ОПАСНОСТИ|БЕЗОПАСНОСТИ)\s*/u, "")
      .replace(/\s*В этих случаях.*$/u, "")
      .replace(/[.\s]+$/u, "");
    duringPage.contentLines[targetIndex] = `ПРЕЖДЕ ВСЕГО  Если присутствует хотя бы один из этих признаков — ${safetyBody} — не ограничивайтесь самопомощью.`;
  });
  collection.references?.forEach((reference) => {
    if (reference.url === "https://3114.fr/") {
      reference.descriptionFr = "МЧС России — интернет-служба экстренной психологической помощи и телефон +7 (495) 989-50-50.";
      reference.url = "https://psi.mchs.gov.ru/";
    } else if (reference.url === "https://www.service-public.fr/particuliers/vosdroits/F33954") {
      reference.descriptionFr = "МЧС России — единый номер экстренных служб 112; скорая медицинская помощь 103.";
      reference.url = "https://ngc.organizations.mchs.gov.ru/export/pdf/Resource/159559";
    }
  });
});

if (targetLanguage === "ru" && process.argv.includes("--review-only")) {
  for (const file of sourceFiles) {
    const source = JSON.parse(readFileSync(file, "utf8"));
    const output = `${outputDirectory}/${file.split("/").pop()}`;
    const translated = JSON.parse(readFileSync(output, "utf8"));
    applyRussianReview(source, translated);
    if (file.endsWith("waves.json")) harmonizeRussianSafety(translated);
    writeFileSync(output, `${JSON.stringify(translated, null, 2)}\n`);
  }
  process.stdout.write("Relecture russe appliquée.\n");
  process.exit(0);
}

mkdirSync(outputDirectory, { recursive: true });
for (const file of sourceFiles) {
  const document = JSON.parse(readFileSync(file, "utf8"));
  if (file.endsWith("waves.json")) annotateWaveLines(document);
  const targets = [];
  collectTargets(document, targets);
  const unique = [...new Set(targets.map((target) => target.value))];
  const translations = new Map();
  let batch = [];
  let characters = 0;
  const flush = () => {
    if (!batch.length) return;
    const translated = translateBatch(batch);
    batch.forEach((value, index) => translations.set(value, translated[index]));
    process.stdout.write(`\r${file}: ${translations.size}/${unique.length}`);
    batch = [];
    characters = 0;
  };
  for (const value of unique) {
    if (batch.length >= 24 || characters + value.length > 4200) flush();
    batch.push(value);
    characters += value.length;
  }
  flush();
  process.stdout.write("\n");
  if (targetLanguage === "en") {
    translations.set("TDAH 100", "ADHD 100");
    translations.set("TDAH 250", "ADHD 250");
    translations.set("TSA 100", "ASD 100");
    translations.set("TSA 250", "ASD 250");
    translations.set("Impulsion difficile à retenir", "Impulse that is hard to resist");
    translations.set("Crise d’auto-dévalorisation", "Self-devaluation crisis");
    translations.set("Sentiment d’imposture", "Impostor feelings");
    translations.set("Culpabilité envahissante", "Overwhelming guilt");
    translations.set("Vague dépressive et idées passives de disparition", "Depressive wave and passive thoughts of disappearing");
  } else {
    Object.entries(russianOverrides).forEach(([source, translation]) => translations.set(source, translation));
  }
  targets.forEach((target) => target.set(translations.get(target.value)));
  if (targetLanguage === "ru" && file.endsWith("waves.json")) harmonizeRussianSafety(document);
  writeFileSync(`${outputDirectory}/${file.split("/").pop()}`, `${JSON.stringify(document, null, 2)}\n`);
}
