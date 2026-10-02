import { answerLabel, scoreTest } from "./scoring.js";
import { dimensionDescription, groupGuidance, methodSummary, resultStateLabels } from "./result-guidance.js";
import { locale, localizePdfDocument } from "./i18n.js";

const colors = {
    ink: [28, 35, 51], muted: [87, 101, 121], blue: [54, 89, 162], blueSoft: [235, 240, 250],
    teal: [36, 107, 103], tealSoft: [229, 242, 239], coral: [166, 61, 54], coralSoft: [251, 235, 232],
    amber: [164, 105, 14], amberSoft: [253, 245, 226], line: [205, 215, 224], paper: [255, 255, 255], panel: [247, 249, 251]
};

const fontFiles = {
    normal: new URL("./fonts/LiberationSans-Regular.ttf", import.meta.url),
    bold: new URL("./fonts/LiberationSans-Bold.ttf", import.meta.url)
};
const fontCache = new Map();
const loadFont = async (style) => {
    if (!fontCache.has(style)) {
        fontCache.set(style, fetch(fontFiles[style]).then(async (response) => {
            if (!response.ok)
                throw new Error(`Chargement de la police PDF impossible (${response.status}).`);
            const bytes = new Uint8Array(await response.arrayBuffer());
            let binary = "";
            for (let offset = 0; offset < bytes.length; offset += 0x8000)
                binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
            return binary;
        }));
    }
    return fontCache.get(style);
};
const registerFonts = async (doc) => {
    const [regular, bold] = await Promise.all([loadFont("normal"), loadFont("bold")]);
    doc.addFileToVFS("LiberationSans-Regular.ttf", regular);
    doc.addFont("LiberationSans-Regular.ttf", "LiberationSans", "normal");
    doc.addFileToVFS("LiberationSans-Bold.ttf", bold);
    doc.addFont("LiberationSans-Bold.ttf", "LiberationSans", "bold");
    doc.setFont("LiberationSans", "normal");
};
const createPdf = async () => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF)
        throw new Error("Le générateur PDF n’est pas chargé sur cette page.");
    const doc = new jsPDF({ unit: "mm", format: "a4", putOnlyUsedFonts: true, compress: true });
    await registerFonts(doc);
    return localizePdfDocument(doc);
};
const safeSlug = (value) => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const timestamp = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}`;
};
const createWriter = async (title, subtitle) => {
    const doc = await createPdf();
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin * 2;
    let y = 0;
    const setText = (size = 10, bold = false, color = colors.ink) => {
        doc.setFont("LiberationSans", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setLineHeightFactor(1.2);
    };
    const pageHeader = (continuation = false) => {
        doc.setFillColor(...colors.blue);
        doc.rect(0, 0, pageWidth, 27, "F");
        setText(8, true, [225, 236, 255]);
        doc.text(subtitle.toLocaleUpperCase("fr"), margin, 9);
        setText(16, true, colors.paper);
        doc.text(doc.splitTextToSize(title, 138).slice(0, 2), margin, 17);
        if (continuation) {
            setText(8, true, colors.paper);
            doc.text("SUITE", pageWidth - margin, 10, { align: "right" });
        }
        y = 35;
    };
    pageHeader();
    const ensureSpace = (height = 10) => {
        if (y + height > pageHeight - 18) {
            doc.addPage();
            pageHeader(true);
        }
    };
    const newPage = () => {
        doc.addPage();
        pageHeader(true);
    };
    const write = (text, options = {}) => {
        const size = options.size ?? 10;
        setText(size, options.bold ?? false, options.color ?? colors.ink);
        const lines = doc.splitTextToSize(String(text), options.width ?? contentWidth);
        const height = lines.length * size * 0.3528 * 1.2 + (options.gap ?? 2);
        ensureSpace(height);
        const startY = y;
        doc.text(lines, options.x ?? margin, y);
        if (options.link)
            doc.link(options.x ?? margin, startY - size * 0.3528, options.width ?? contentWidth, height, { url: options.link });
        y += height;
    };
    const heading = (text, tone = "teal") => {
        ensureSpace(25);
        const fill = tone === "blue" ? colors.blueSoft : tone === "warning" ? colors.amberSoft : colors.tealSoft;
        const ink = tone === "blue" ? colors.blue : tone === "warning" ? colors.amber : colors.teal;
        doc.setFillColor(...fill);
        doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
        setText(11, true, ink);
        doc.text(text, margin + 5, y + 6.5);
        y += 13;
    };
    const callout = (text, tone = "info") => {
        const palette = tone === "danger" ? [colors.coralSoft, colors.coral] : tone === "warning" ? [colors.amberSoft, colors.amber] : [colors.blueSoft, colors.blue];
        setText(9, tone === "danger", colors.ink);
        const lines = doc.splitTextToSize(text, contentWidth - 12);
        const height = lines.length * 9 * 0.3528 * 1.2 + 7;
        ensureSpace(height + 2);
        doc.setFillColor(...palette[0]);
        doc.setDrawColor(...palette[1]);
        doc.roundedRect(margin, y, contentWidth, height, 2, 2, "FD");
        doc.text(lines, margin + 6, y + 5.5);
        y += height + 3;
    };
    const resultRow = (result, includeConcepts = false) => {
        const score = result.status === "sufficient"
            ? `${(result.normalized * 4).toFixed(1)} / 4`
            : result.status === "flags-only"
                ? `Contexte · ${result.triggeredItems} à discuter`
                : result.insufficientReason === "concept-diversity"
                    ? "Non calculé · concepts insuffisants"
                    : resultStateLabels[result.status];
        const description = dimensionDescription(result.dimensionId);
        setText(9.2, false, colors.ink);
        const descriptionLines = doc.splitTextToSize(description, 125);
        const height = Math.max(21, 11 + descriptionLines.length * 3.6 + 6);
        ensureSpace(height + 2);
        doc.setFillColor(...colors.panel);
        doc.setDrawColor(...colors.line);
        doc.roundedRect(margin, y, contentWidth, height, 2, 2, "FD");
        setText(10, true, colors.ink);
        doc.text(result.titleFr, margin + 5, y + 6);
        setText(9.2, true, result.status === "sufficient" ? colors.blue : colors.muted);
        doc.text(score, pageWidth - margin - 5, y + 6, { align: "right" });
        setText(8.3, false, colors.muted);
        doc.text(descriptionLines, margin + 5, y + 11);
        const coverage = result.status === "flags-only"
            ? `Traitement contextuel : ${result.contextAnsweredItems}/${result.contextApplicableItems} réponses analysées · ${result.triggeredItems} à discuter`
            : `Couverture conceptuelle : ${result.answeredConcepts}/${result.applicableConcepts}`;
        doc.text(coverage, margin + 5, y + height - 3.5);
        if (result.status === "sufficient") {
            doc.setFillColor(...colors.line);
            doc.roundedRect(pageWidth - margin - 48, y + height - 6, 43, 2.2, 1, 1, "F");
            doc.setFillColor(...colors.teal);
            doc.roundedRect(pageWidth - margin - 48, y + height - 6, 43 * result.normalized, 2.2, 1, 1, "F");
        }
        y += height + 2;
        if (includeConcepts && result.concepts.some((concept) => concept.value !== null)) {
            const concepts = result.concepts.filter((concept) => concept.value !== null).map((concept) => `${concept.labelFr} : ${concept.value.toFixed(1)}/4`).join(" · ");
            write(`Concepts renseignés — ${concepts}`, { size: 7.8, color: colors.muted, gap: 2.5 });
        }
    };
    const profileRow = (result) => {
        const height = 7.2;
        ensureSpace(height);
        setText(8.6, true, colors.ink);
        doc.text(result.titleFr, margin + 2, y + 4.8);
        if (result.status === "sufficient") {
            const trackX = margin + 77;
            const trackWidth = 62;
            doc.setFillColor(...colors.line);
            doc.roundedRect(trackX, y + 2.1, trackWidth, 3, 1.2, 1.2, "F");
            doc.setFillColor(...colors.teal);
            doc.roundedRect(trackX, y + 2.1, trackWidth * result.normalized, 3, 1.2, 1.2, "F");
            setText(8.5, true, colors.blue);
            doc.text(`${(result.normalized * 4).toFixed(1)} / 4`, pageWidth - margin - 2, y + 4.8, { align: "right" });
        } else {
            const label = result.insufficientReason === "concept-diversity" ? "Non calculé · concepts insuffisants" : resultStateLabels[result.status];
            setText(7.5, false, colors.muted);
            doc.text(label, pageWidth - margin - 2, y + 4.8, { align: "right" });
        }
        y += height;
    };
    const finalize = (footer) => {
        const count = doc.getNumberOfPages();
        for (let page = 1; page <= count; page += 1) {
            doc.setPage(page);
            doc.setDrawColor(...colors.line);
            doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
            setText(7.2, false, colors.muted);
            doc.text(footer, margin, pageHeight - 7.5);
            doc.text(`${page} / ${count}`, pageWidth - margin, pageHeight - 7.5, { align: "right" });
        }
    };
    return { doc, write, heading, callout, resultRow, profileRow, ensureSpace, newPage, finalize, margin, pageWidth, getY: () => y, setY: (value) => { y = value; } };
};
const exportTestReport = async (session, test, data, complete) => {
    const writer = await createWriter(test.titleFr, complete ? "Rapport complet + réponses" : "Rapport synthétique");
    const scored = scoreTest(session, test, data);
    const { results, flags, counts, coveragePolicy } = scored;
    const treated = counts.value + counts.unknown + counts["not-applicable"];
    writer.write(`Session commencée le ${new Date(session.startedAt).toLocaleString(locale)} · exportée le ${new Date().toLocaleString(locale)} · ${treated}/${test.size} questions traitées.`, { size: 8.5, color: colors.muted, gap: 4 });
    writer.callout("Outil d’auto-évaluation descriptif. Ce document ne constitue pas un diagnostic médical et ne présente aucune probabilité diagnostique validée.", "warning");
    writer.heading("Profil descriptif", "blue");
    const pageOneGroups = data.resultGroups
        .map((group) => ({ ...group, results: results.filter((result) => result.group === group.id) }))
        .filter((group) => group.results.length && (group.presentation === "index" || group.presentation === "impact" || group.id === "trajectory"))
        .sort((left, right) => left.order - right.order);
    pageOneGroups.forEach((group, groupIndex) => {
        if (groupIndex)
            writer.setY(writer.getY() + 3);
        writer.write(group.labelFr.toLocaleUpperCase("fr"), { size: 8.2, bold: true, color: colors.teal, gap: 1.2 });
        group.results.forEach((result) => writer.profileRow(result));
    });
    writer.setY(writer.getY() + 4);
    writer.write("Les barres facilitent la comparaison au sein de ce questionnaire. Elles ne définissent aucun niveau clinique « faible », « modéré » ou « fort ».", { size: 7.4, color: colors.muted, gap: 2 });
    writer.newPage();
    writer.heading("Repères de lecture", "blue");
    writer.write("L’indice sur 4 est la moyenne descriptive des concepts suffisamment renseignés. Plus il se rapproche de 4, plus les situations couvertes ont été déclarées fréquentes ou présentes. Il ne s’agit ni d’un pourcentage, ni d’un seuil clinique.", { size: 9.2, gap: 3 });
    writer.write(`Réponses calculables : ${counts.value} · Je ne sais pas : ${counts.unknown} · Non applicables : ${counts["not-applicable"]} · Sans réponse : ${test.size - Object.keys(session.answers).length + counts.skipped}.`, { size: 8.8, bold: true, gap: 3 });
    writer.write(coveragePolicy.descriptionFr, { size: 8.2, color: colors.muted, gap: 4 });
    const groupMap = new Map(data.resultGroups.map((group) => [group.id, group]));
    const presentationMap = new Map(data.resultGroups.map((group) => [group.id, group.presentation]));
    const highlights = results.filter((result) => result.status === "sufficient" && ["index", "impact"].includes(presentationMap.get(result.group))).sort((left, right) => right.normalized - left.normalized).slice(0, 4);
    writer.heading("Observations descriptives principales");
    if (highlights.length)
        highlights.forEach((result) => writer.resultRow(result));
    else
        writer.write("Aucune dimension ne possède encore une couverture suffisante pour produire une observation principale.", { color: colors.muted, gap: 4 });
    writer.write("Cette sélection facilite la lecture et ne classe pas les dimensions selon une importance clinique.", { size: 7.8, color: colors.muted, gap: 4 });
    if (complete) {
        let lastGroup = "";
        for (const result of results) {
            if (result.group !== lastGroup) {
                const group = groupMap.get(result.group);
                writer.heading(group?.labelFr || result.group, group?.presentation === "impact" ? "warning" : "teal");
                writer.write(groupGuidance[group?.presentation] || groupGuidance.context, { size: 8.2, color: colors.muted, gap: 3 });
                lastGroup = result.group;
            }
            writer.resultRow(result, false);
        }
    } else {
        writer.heading("Comprendre les grandes familles", "blue");
        [
            ["Caractéristiques centrales et fonctions", groupGuidance.index],
            ["Retentissement", groupGuidance.impact],
            ["Éléments associés", groupGuidance.associated],
            ["Trajectoire et contexte", groupGuidance.context]
        ].forEach(([label, description]) => {
            writer.write(label.toLocaleUpperCase("fr"), { size: 8.5, bold: true, color: colors.teal, gap: 1 });
            writer.write(description, { size: 8.3, color: colors.muted, gap: 2.3 });
        });
        const unavailable = results.filter((result) => result.status !== "sufficient" && result.status !== "flags-only");
        if (unavailable.length) {
            writer.heading("Dimensions non calculées", "warning");
            unavailable.forEach((result) => writer.write(`• ${result.titleFr} — ${result.insufficientReason === "concept-diversity" ? `cette version contient moins de ${coveragePolicy.minimumAnsweredConcepts} concepts distincts` : resultStateLabels[result.status]}`, { size: 8.6, gap: 1.8 }));
        }
    }
    if (flags.length) {
        writer.heading("Points à explorer avec un professionnel", "warning");
        writer.write("Ces réponses sont présentées comme signaux de discussion et ne produisent aucun point TDAH ou TSA.", { size: 8.5, color: colors.muted });
        const dimensionMap = new Map(data.dimensions.map((dimension) => [dimension.id, dimension]));
        const groupedFlags = flags.reduce((groups, flag) => groups.set(flag.dimensionId, [...(groups.get(flag.dimensionId) || []), flag]), new Map());
        for (const [dimensionId, dimensionFlags] of groupedFlags) {
            writer.write((dimensionMap.get(dimensionId)?.labelFr || dimensionId).toLocaleUpperCase("fr"), { size: 8.5, bold: true, color: colors.amber, gap: 1.5 });
            dimensionFlags.forEach((flag) => writer.write(`• ${flag.textFr}\n  Réponse : ${flag.answer}`, { size: 9, gap: 2.5 }));
        }
        writer.write("Ces éléments ne renforcent ni ne diminuent automatiquement un indice. Ils servent à préparer l’évaluation différentielle et contextuelle.", { size: 8.2, color: colors.muted, gap: 4 });
    }
    writer.heading("Méthode et limites", "blue");
    writer.write(methodSummary, { size: 8.8 });
    writer.write("L’interprétation professionnelle doit également considérer les exemples concrets, l’histoire développementale, la présence dans plusieurs contextes, le retentissement, les compensations et les autres explications possibles.", { size: 8.8, gap: 4 });
    if (complete) {
        writer.newPage();
        writer.heading("Annexe — questions et réponses brutes", "blue");
        writer.write("Les réponses « Je ne sais pas », « Non applicable » et absentes sont conservées comme telles ; elles ne sont jamais transformées en zéro.", { size: 8.5, color: colors.muted, gap: 4 });
        const itemMap = new Map(data.items.map((item) => [item.itemId, item]));
        const conceptMap = new Map(data.concepts.map((concept) => [concept.id, concept]));
        const dimensionMap = new Map(data.dimensions.map((dimension) => [dimension.id, dimension]));
        let lastTheme = "";
        for (const instance of test.instances) {
            const theme = test.themes.find((candidate) => candidate.id === instance.themeId);
            if (theme && theme.id !== lastTheme) {
                writer.heading(theme.titleFr);
                lastTheme = theme.id;
            }
            const item = itemMap.get(instance.itemId);
            if (!item)
                continue;
            writer.write(`${instance.position}. ${item.textFr}`, { bold: true, size: 8.7, gap: .7 });
            writer.write(`● ${answerLabel(session.answers[instance.instanceId], item, data)}  ·  ${dimensionMap.get(item.dimensionId)?.labelFr || item.dimensionId}  ·  ${conceptMap.get(item.conceptId)?.labelFr || item.conceptId}`, { size: 7.8, color: colors.blue, gap: 2.2 });
        }
    }
    writer.finalize(`${test.titleFr} · AuDHD Tools · rapport descriptif`);
    writer.doc.setProperties({ title: `${test.titleFr} — ${complete ? "rapport complet" : "rapport synthétique"}`, subject: "Auto-évaluation descriptive", author: "AuDHD Tools", creator: "AuDHD Tools" });
    writer.doc.save(`${safeSlug(test.titleFr)}_${complete ? "complet" : "synthese"}_${timestamp(new Date(session.startedAt))}.pdf`);
};
export const exportTestSummaryPdf = (session, test, data) => exportTestReport(session, test, data, false);
export const exportTestPdf = (session, test, data) => exportTestReport(session, test, data, true);

const waveSectionPattern = /^(Cycle typique|Déclencheurs fréquents|Manifestations possibles|Mes signes|Vulnérabilités|Feu tricolore|Mes règles|Protocole immédiat|Menu de régulation|À suspendre|Critères de sortie|Ligne du temps|Questions d’analyse|Réparation|Cinq piliers|Entraînement hebdomadaire|Indicateurs personnels|Mon plan|Quand demander)/i;
const waveFieldKey = (lineIndex, optionIndex) => `${lineIndex}-${optionIndex}`;
const waveFieldValue = (values, key) => values[key] ?? Object.entries(values).find(([candidate]) => candidate.startsWith(`${key}:`))?.[1];
const extractWaveEntries = (episode, module) => module.pages.map((page) => {
    const values = episode.answers[page.id] || {};
    const entries = [];
    let section = page.phaseLabelFr;
    page.contentLines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (waveSectionPattern.test(trimmed)) {
            section = trimmed;
            return;
        }
        if (trimmed.includes("[ ]")) {
            const options = trimmed.split("[ ]").map((part) => part.trim()).filter(Boolean);
            options.forEach((label, optionIndex) => {
                if (waveFieldValue(values, waveFieldKey(lineIndex, optionIndex)) === true)
                    entries.push({ type: "choice", section, label, value: "Oui" });
            });
            return;
        }
        const isField = /\.{4,}/.test(trimmed) || ((page.phase === "after" || page.phase === "before") && trimmed.endsWith("?"));
        if (!isField)
            return;
        const label = /\.{4,}/.test(trimmed) ? trimmed.replace(/\.{4,}/g, "").replace(/\s+/g, " ").trim() || "Réponse" : trimmed;
        const value = waveFieldValue(values, waveFieldKey(lineIndex, 0));
        if (value !== undefined && String(value).trim())
            entries.push({ type: "text", section, label, value: String(value).trim() });
    });
    if (values.notes && String(values.notes).trim())
        entries.push({ type: "text", section: "Notes personnelles", label: "Notes", value: String(values.notes).trim() });
    return { page, entries };
});

export const exportWaveCrisisCard = async (episode, collection, module) => {
    const doc = await createPdf();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const width = pageWidth - margin * 2;
    const extracted = extractWaveEntries(episode, module);
    const duringPage = module.pages.find((page) => page.phase === "during");
    const duringEntries = extracted.find((group) => group.page.phase === "during")?.entries || [];
    const selectedTools = extracted.flatMap((group) => group.entries).filter((entry) => entry.type === "choice").slice(0, 6);
    const protocol = (duringPage?.contentLines || []).flatMap((line) => {
        const cells = line.split("\t").map((cell) => cell.trim()).filter(Boolean);
        return /^\d+$/.test(cells[0]) && cells.length >= 3 ? [{ number: cells[0], action: cells[1], instruction: cells.slice(2).join(" — ") }] : [];
    }).slice(0, 5);
    const setText = (size, bold = false, color = colors.ink) => {
        doc.setFont("LiberationSans", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setLineHeightFactor(1.15);
    };
    doc.setFillColor(...colors.blue);
    doc.rect(0, 0, pageWidth, 38, "F");
    setText(8, true, [225, 236, 255]);
    doc.text(`${collection.titleFr.toLocaleUpperCase("fr")} · CARTE DE CRISE`, margin, 10);
    setText(17, true, colors.paper);
    doc.text(doc.splitTextToSize(module.titleFr, width - 10).slice(0, 2), margin, 20);
    setText(8, false, colors.muted);
    doc.text(`Épisode du ${new Date(episode.startedAt).toLocaleString(locale)} · carte générée le ${new Date().toLocaleString(locale)}`, margin, 45);
    let y = 54;
    const sectionTitle = (text) => {
        setText(9, true, colors.teal);
        doc.text(text.toLocaleUpperCase("fr"), margin, y);
        doc.setDrawColor(...colors.teal);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 8;
    };
    sectionTitle("État et repères renseignés");
    const stateEntries = duringEntries.filter((entry) => entry.type === "text").slice(0, 3);
    if (stateEntries.length) {
        stateEntries.forEach((entry) => {
            setText(8.4, true, colors.muted);
            doc.text(doc.splitTextToSize(entry.label, 76).slice(0, 1), margin, y);
            setText(9, false, colors.ink);
            doc.text(doc.splitTextToSize(entry.value, 92).slice(0, 2), margin + 80, y);
            y += 7;
        });
    } else {
        setText(8.8, false, colors.muted);
        doc.text("Aucun état actuel renseigné dans la fiche Pendant la vague.", margin, y);
        y += 7;
    }
    sectionTitle("Maintenant — une action à la fois");
    protocol.forEach((step) => {
        const instruction = doc.splitTextToSize(step.instruction, width - 57).slice(0, 2);
        const height = Math.max(13, instruction.length * 4 + 6);
        doc.setFillColor(...colors.panel);
        doc.setDrawColor(...colors.line);
        doc.roundedRect(margin, y, width, height, 2, 2, "FD");
        doc.setFillColor(...colors.blue);
        doc.roundedRect(margin + 4, y + 3, 8, 8, 2, 2, "F");
        setText(9, true, colors.paper);
        doc.text(step.number, margin + 8, y + 8.4, { align: "center" });
        setText(8.7, true, colors.ink);
        doc.text(step.action, margin + 17, y + 6);
        setText(8.2, false, colors.ink);
        doc.text(instruction, margin + 52, y + 6);
        y += height + 2;
    });
    if (selectedTools.length) {
        sectionTitle("Mes repères ou outils choisis");
        setText(8.4, false, colors.ink);
        selectedTools.forEach((entry) => {
            doc.setFillColor(...colors.teal);
            doc.circle(margin + 2, y - 1.2, 1.4, "F");
            doc.text(doc.splitTextToSize(entry.label, width - 8).slice(0, 1), margin + 6, y);
            y += 5.3;
        });
    }
    const safetyY = Math.max(y + 4, 261);
    doc.setFillColor(...colors.coralSoft);
    doc.setDrawColor(...colors.coral);
    doc.roundedRect(margin, safetyY, width, 20, 2, 2, "FD");
    setText(10, true, colors.coral);
    doc.text("SI DANGER, INTENTION, PERTE DE CONTRÔLE OU SYMPTÔME INQUIÉTANT", margin + 5, safetyY + 6);
    setText(10, true, colors.ink);
    doc.text("15 ou 112 · 3114 · rejoindre une aide humaine et ne pas rester isolé", margin + 5, safetyY + 13);
    doc.setProperties({ title: `${module.titleFr} — carte de crise`, subject: "Carte personnelle de crise", author: "AuDHD Tools", creator: "AuDHD Tools" });
    doc.save(`${safeSlug(collection.titleFr)}_${safeSlug(module.titleFr)}_carte-crise_${timestamp(new Date(episode.startedAt))}.pdf`);
};

export const exportWaveEpisodeReport = async (episode, collection, module) => {
    const writer = await createWriter(module.titleFr, "Rapport d’épisode");
    const extracted = extractWaveEntries(episode, module);
    const filled = extracted.filter((group) => group.entries.length);
    const entryCount = filled.reduce((sum, group) => sum + group.entries.length, 0);
    writer.write(`Épisode commencé le ${new Date(episode.startedAt).toLocaleString(locale)} · dernière modification le ${new Date(episode.updatedAt).toLocaleString(locale)} · export le ${new Date().toLocaleString(locale)}.`, { size: 8.5, color: colors.muted, gap: 4 });
    writer.callout("Ce rapport reprend uniquement les informations personnelles renseignées. Les champs vides et les consignes génériques sont volontairement masqués.", "info");
    writer.heading("Résumé de l’épisode", "blue");
    writer.write(`${filled.length} phase${filled.length > 1 ? "s" : ""} documentée${filled.length > 1 ? "s" : ""} · ${entryCount} information${entryCount > 1 ? "s" : ""} personnelle${entryCount > 1 ? "s" : ""}.`, { bold: true });
    if (!filled.length)
        writer.write("Aucun champ personnel n’est actuellement renseigné pour cet épisode.", { color: colors.muted });
    for (const group of filled) {
        writer.heading(group.page.phaseLabelFr, group.page.phase === "during" ? "warning" : "teal");
        let lastSection = "";
        for (const entry of group.entries) {
            if (entry.section !== lastSection) {
                writer.write(entry.section.toLocaleUpperCase("fr"), { size: 8.2, bold: true, color: colors.teal, gap: 1.5 });
                lastSection = entry.section;
            }
            if (entry.type === "choice")
                writer.write(`✓ ${entry.label}`, { size: 9, gap: 1.8 });
            else {
                writer.write(entry.label, { size: 8.2, bold: true, color: colors.muted, gap: .8 });
                writer.write(entry.value, { size: 9.4, gap: 2.5 });
            }
        }
    }
    const referenceIds = [...new Set(filled.flatMap((group) => group.page.contentLines.flatMap((line) => line.match(/S\d{2}/g) || [])))];
    const references = referenceIds.flatMap((id) => collection.references?.find((reference) => reference.id === id) || []);
    if (references.length) {
        writer.heading("Sources publiques", "blue");
        references.forEach((reference) => {
            writer.write(`${reference.id} · ${reference.descriptionFr}`, { size: 7.5, color: colors.muted, gap: .8 });
            writer.write(reference.url, { size: 7.5, color: colors.blue, gap: 2.5, link: reference.url });
        });
    }
    writer.callout("En cas de danger immédiat ou de perte de contrôle : 15 ou 112. En France, le 3114 répond gratuitement 24 h/24 pour la prévention du suicide.", "danger");
    writer.finalize(`${module.titleFr} · ${collection.titleFr} · rapport d’épisode`);
    writer.doc.setProperties({ title: `${module.titleFr} — rapport d’épisode`, subject: "Rapport personnel d’auto-observation", author: "AuDHD Tools", creator: "AuDHD Tools" });
    writer.doc.save(`${safeSlug(collection.titleFr)}_${safeSlug(module.titleFr)}_rapport-episode_${timestamp(new Date(episode.startedAt))}.pdf`);
};

export const exportWavePdf = async (episode, collection, module, selectedPageIds) => {
    const selectedPages = module.pages.filter((candidate) => selectedPageIds.includes(candidate.id));
    if (!selectedPages.length)
        throw new Error("Aucune fiche sélectionnée.");
    const doc = await createPdf();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 18;
    const exportedAt = new Date();
    let y = 0;
    let activeSheet = selectedPages[0];
    const setText = (size = 9.5, bold = false, color = colors.ink) => {
        doc.setFont("LiberationSans", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setLineHeightFactor(1.22);
    };
    const textHeight = (lines, size) => lines.length * size * 0.3528 * 1.22;
    const split = (text, width, size = 9.5, bold = false) => {
        setText(size, bold);
        return doc.splitTextToSize(String(text).replace(/\s+/g, " ").trim(), width);
    };
    const addHeader = (sheet, continuation = false) => {
        doc.setFillColor(...colors.blue);
        doc.rect(0, 0, pageWidth, 35, "F");
        setText(8, true, [225, 236, 255]);
        doc.text(collection.titleFr.toLocaleUpperCase("fr"), margin, 10);
        const moduleLines = split(module.titleFr, 132, 16, true).slice(0, 2);
        setText(16, true, colors.paper);
        doc.text(moduleLines, margin, 19);
        const phaseLabel = continuation ? `${sheet.phaseLabelFr} · suite` : `Fiche ${sheet.number}/5 · ${sheet.phaseLabelFr}`;
        setText(8.5, true, colors.paper);
        doc.text(phaseLabel, pageWidth - margin, 12, { align: "right" });
        setText(7.5, false, colors.muted);
        doc.text(`Épisode : ${new Date(episode.startedAt).toLocaleString(locale)}  ·  Export : ${exportedAt.toLocaleString(locale)}`, margin, 42);
        y = 49;
    };
    const continueSheet = () => {
        doc.addPage();
        addHeader(activeSheet, true);
    };
    const ensureSpace = (height, allowSplit = false) => {
        if (y + height <= bottomLimit)
            return;
        if (!allowSplit || y > 60)
            continueSheet();
    };
    const paragraph = (text, options = {}) => {
        const size = options.size ?? 9.4;
        const width = options.width ?? contentWidth;
        const lines = split(text, width, size, options.bold ?? false);
        const height = textHeight(lines, size) + (options.gap ?? 2.2);
        ensureSpace(height);
        setText(size, options.bold ?? false, options.color ?? colors.ink);
        doc.text(lines, options.x ?? margin, y);
        y += height;
    };
    const section = (title) => {
        const lines = split(title, contentWidth - 10, 11, true);
        const height = Math.max(10, textHeight(lines, 11) + 5);
        ensureSpace(height + 2);
        doc.setFillColor(...colors.tealSoft);
        doc.roundedRect(margin, y, contentWidth, height, 2, 2, "F");
        setText(11, true, colors.teal);
        doc.text(lines, margin + 5, y + 6.5);
        y += height + 2.5;
    };
    const callout = (text, tone = "info") => {
        const palette = tone === "danger"
            ? { fill: colors.coralSoft, edge: colors.coral }
            : tone === "warning"
                ? { fill: colors.amberSoft, edge: colors.amber }
                : { fill: colors.blueSoft, edge: colors.blue };
        const lines = split(text, contentWidth - 12, 8.8, tone === "danger");
        const height = textHeight(lines, 8.8) + 7;
        ensureSpace(height + 2);
        doc.setFillColor(...palette.fill);
        doc.setDrawColor(...palette.edge);
        doc.setLineWidth(0.7);
        doc.roundedRect(margin, y, contentWidth, height, 2, 2, "FD");
        setText(8.8, tone === "danger", colors.ink);
        doc.text(lines, margin + 6, y + 5.5);
        y += height + 3;
    };
    const tableRow = (cells) => {
        const count = cells.length;
        const ratios = count === 2 && cells[0].length < 28 ? [0.27, 0.73] : Array(count).fill(1 / count);
        const widths = ratios.map((ratio) => contentWidth * ratio);
        const header = cells.every((cell) => cell === cell.toLocaleUpperCase("fr") && /[A-ZÀ-Ý]/.test(cell));
        const cellLines = cells.map((cell, index) => split(cell, widths[index] - 6, header ? 8.2 : 8.7, header || index === 0));
        const height = Math.max(...cellLines.map((lines) => textHeight(lines, header ? 8.2 : 8.7))) + 5;
        ensureSpace(height);
        let x = margin;
        cellLines.forEach((lines, index) => {
            doc.setFillColor(...(header ? colors.blueSoft : index % 2 === 0 ? colors.panel : colors.paper));
            doc.setDrawColor(...colors.line);
            doc.setLineWidth(0.25);
            doc.rect(x, y, widths[index], height, "FD");
            setText(header ? 8.2 : 8.7, header || index === 0, header ? colors.blue : colors.ink);
            doc.text(lines, x + 3, y + 4.2);
            x += widths[index];
        });
        y += height;
    };
    const checkboxRow = (options, lineIndex, values) => {
        const gap = 5;
        const columnWidth = options.length > 1 ? (contentWidth - gap) / 2 : contentWidth;
        const wrapped = options.map((label) => split(label, columnWidth - 9, 8.8));
        const rowHeight = Math.max(...wrapped.map((lines) => textHeight(lines, 8.8))) + 4;
        ensureSpace(rowHeight + 1);
        options.forEach((label, optionIndex) => {
            const x = margin + (optionIndex % 2) * (columnWidth + gap);
            const fieldId = waveFieldKey(lineIndex, optionIndex);
            const checked = waveFieldValue(values, fieldId) === true;
            doc.setLineWidth(0.45);
            doc.setDrawColor(...(checked ? colors.teal : colors.muted));
            doc.setFillColor(...(checked ? colors.teal : colors.paper));
            doc.roundedRect(x, y + 0.5, 4.2, 4.2, 0.6, 0.6, "FD");
            if (checked) {
                doc.setDrawColor(...colors.paper);
                doc.setLineWidth(0.7);
                doc.line(x + 1, y + 2.6, x + 1.8, y + 3.4);
                doc.line(x + 1.8, y + 3.4, x + 3.4, y + 1.3);
            }
            setText(8.8, false, colors.ink);
            doc.text(wrapped[optionIndex], x + 7, y + 3.6);
        });
        y += rowHeight + 0.8;
    };
    const answerField = (label, lineIndex, values) => {
        const fieldId = waveFieldKey(lineIndex, 0);
        const answer = waveFieldValue(values, fieldId);
        const labelLines = split(label, contentWidth, 8.4, true);
        const empty = answer === undefined || answer === "";
        if (empty) {
            const height = textHeight(labelLines, 8.4) + 4;
            ensureSpace(height);
            setText(8.4, true, colors.muted);
            doc.text(labelLines, margin, y);
            y += textHeight(labelLines, 8.4) + 1.2;
            doc.setDrawColor(...colors.line);
            doc.setLineWidth(0.25);
            doc.line(margin, y, pageWidth - margin, y);
            y += 4.2;
            return;
        }
        const answerText = String(answer);
        const answerLines = split(answerText, contentWidth - 8, 9.2);
        const height = textHeight(labelLines, 8.4) + Math.max(8, textHeight(answerLines, 9.2) + 5) + 3;
        ensureSpace(height);
        setText(8.4, true, colors.muted);
        doc.text(labelLines, margin, y);
        y += textHeight(labelLines, 8.4) + 1.5;
        doc.setFillColor(...colors.tealSoft);
        doc.setDrawColor(...colors.line);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, y, contentWidth, Math.max(8, textHeight(answerLines, 9.2) + 5), 1.5, 1.5, "FD");
        setText(9.2, false, colors.ink);
        doc.text(answerLines, margin + 4, y + 5);
        y += Math.max(8, textHeight(answerLines, 9.2) + 5) + 3;
    };
    const headingPattern = /^(Cycle typique|Déclencheurs fréquents|Manifestations possibles|Mes signes|Vulnérabilités|Feu tricolore|Mes règles|Protocole immédiat|Menu de régulation|À suspendre|Critères de sortie|Ligne du temps|Questions d’analyse|Réparation|Cinq piliers|Entraînement hebdomadaire|Indicateurs personnels|Mon plan|Quand demander)/i;
    const renderLine = (sheet, line, lineIndex, values) => {
        if (lineIndex === 0)
            return;
        const trimmed = line.trim();
        if (!trimmed)
            return;
        if (trimmed.includes("[ ]")) {
            const options = trimmed.split("\t").map((part) => part.trim()).filter((part) => part && part !== "[ ]");
            checkboxRow(options, lineIndex, values);
            return;
        }
        if (/\.{4,}/.test(trimmed)) {
            const label = trimmed.replace(/\.{4,}/g, "").replace(/\s+/g, " ").trim() || "Réponse";
            answerField(label, lineIndex, values);
            return;
        }
        if ((sheet.phase === "after" || sheet.phase === "before") && trimmed.endsWith("?")) {
            answerField(trimmed, lineIndex, values);
            return;
        }
        if (/^(AVANT TOUT|SIGNAL DE SÉCURITÉ)/.test(trimmed)) {
            callout(trimmed, "danger");
            return;
        }
        if (/^À distinguer de/i.test(trimmed)) {
            callout(trimmed, "warning");
            return;
        }
        if (/^(PASSAGE À L’ÉTAPE SUIVANTE|CONCLUSION DU MODULE)/.test(trimmed)) {
            callout(trimmed, "info");
            return;
        }
        if (/^DÉFINITION DE TRAVAIL/.test(trimmed)) {
            callout(trimmed.replace(/^DÉFINITION DE TRAVAIL\s*/, ""), "info");
            return;
        }
        if (/^Repères publics/.test(trimmed)) {
            const ids = trimmed.match(/S\d{2}/g) || [];
            const references = ids.flatMap((id) => collection.references?.find((reference) => reference.id === id) || []);
            if (!references.length) {
                paragraph("Sources publiques : voir la bibliographie du module.", { size: 7.2, color: colors.muted, gap: 2.5 });
                return;
            }
            section("Sources publiques");
            references.forEach((reference) => {
                const label = `${reference.id} · ${reference.descriptionFr}`;
                paragraph(label, { size: 7.2, color: colors.muted, gap: 1.4 });
                const linkY = y - 1.4;
                doc.link(margin, linkY - 5, contentWidth, 6, { url: reference.url });
            });
            return;
        }
        if (headingPattern.test(trimmed)) {
            if (/^Protocole immédiat/i.test(trimmed))
                ensureSpace(95);
            else if (/^(Critères de sortie|SIGNAL DE SÉCURITÉ)/i.test(trimmed))
                ensureSpace(55);
            else
                ensureSpace(25);
            section(trimmed);
            return;
        }
        if (sheet.phase === "prevent" && lineIndex >= 16 && lineIndex <= 19) {
            tableRow([trimmed, " ", " ", " "]);
            return;
        }
        const cells = trimmed.split("\t").map((cell) => cell.trim()).filter(Boolean);
        if (cells.length > 1) {
            tableRow(cells);
            return;
        }
        paragraph(trimmed.replace(/^\s+/, ""), { size: /^\d+\./.test(trimmed) ? 8.8 : 9.2, gap: 1.8 });
    };
    selectedPages.forEach((sheet, sheetIndex) => {
        activeSheet = sheet;
        if (sheetIndex > 0)
            doc.addPage();
        addHeader(sheet);
        if (sheetIndex === 0)
            callout("Document personnel. Cet outil d’auto-observation ne remplace ni un diagnostic, ni un traitement personnalisé, ni les services d’urgence.", "warning");
        const values = episode.answers[sheet.id] || {};
        sheet.contentLines.forEach((line, lineIndex) => renderLine(sheet, line, lineIndex, values));
        if (values.notes) {
            section("Notes personnelles");
            paragraph(String(values.notes), { size: 9.4, gap: 3 });
        }
    });
    const pageCount = doc.getNumberOfPages();
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setDrawColor(...colors.line);
        doc.setLineWidth(0.25);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        setText(7.2, false, colors.muted);
        doc.text(`${module.titleFr}  ·  ${collection.titleFr}`, margin, pageHeight - 7.5);
        doc.text(`${pageNumber} / ${pageCount}`, pageWidth - margin, pageHeight - 7.5, { align: "right" });
    }
    doc.setProperties({
        title: `${module.titleFr} — fiches complètes imprimables`,
        subject: "Fiches de travail personnelles imprimables",
        author: "AuDHD Tools",
        creator: "AuDHD Tools"
    });
    doc.save(`${safeSlug(collection.titleFr)}_${safeSlug(module.titleFr)}_fiches-imprimables_${timestamp(new Date(episode.startedAt))}.pdf`);
};
