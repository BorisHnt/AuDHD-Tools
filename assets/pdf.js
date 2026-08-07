import { answerLabel, scoreTest } from "./scoring.js";
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
const createWriter = (title) => {
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF)
        throw new Error("Le générateur PDF n’est pas chargé sur cette page.");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 16;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 18;
    const ensureSpace = (height = 10) => {
        if (y + height > pageHeight - 16) {
            doc.addPage();
            y = 18;
        }
    };
    const write = (text, options = {}) => {
        const size = options.size ?? 10;
        doc.setFont("helvetica", options.bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(...(options.color ?? [28, 35, 51]));
        const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
        const height = lines.length * size * 0.42 + (options.gap ?? 2);
        ensureSpace(height);
        doc.text(lines, margin, y);
        y += height;
    };
    write(title, { size: 18, bold: true, color: [54, 89, 162], gap: 5 });
    return { doc, write, ensureSpace, getY: () => y, setY: (value) => { y = value; }, margin, pageWidth };
};
export const exportTestPdf = (session, test, data) => {
    const writer = createWriter(`${test.titleFr} — réponses et synthèse`);
    writer.write(`Commencé le ${new Date(session.startedAt).toLocaleString("fr-FR")}. Exporté le ${new Date().toLocaleString("fr-FR")}.`);
    writer.write("Outil d’auto-évaluation descriptif : ce document ne constitue pas un diagnostic médical et ne présente aucune probabilité diagnostique validée.", { bold: true, color: [166, 61, 54], gap: 5 });
    const { results, flags } = scoreTest(session, test, data);
    writer.write("Synthèse dimensionnelle", { size: 14, bold: true, gap: 4 });
    for (const result of results) {
        const value = result.normalized === null ? "Données insuffisantes" : `${(result.normalized * 4).toFixed(1)} / 4`;
        writer.write(`${result.titleFr} — ${value} — couverture ${result.answered}/${result.applicable}`);
    }
    if (flags.length) {
        writer.write("Points à explorer avec un professionnel", { size: 14, bold: true, color: [166, 61, 54] });
        flags.forEach((flag) => writer.write(`• ${flag.textFr} — ${flag.answer}`));
    }
    writer.write("Questions et réponses", { size: 14, bold: true, gap: 4 });
    const itemMap = new Map(data.items.map((item) => [item.itemId, item]));
    let lastTheme = "";
    for (const instance of test.instances) {
        const theme = test.themes.find((candidate) => candidate.id === instance.themeId);
        if (theme && theme.id !== lastTheme) {
            writer.write(theme.titleFr, { size: 12, bold: true, color: [36, 107, 103], gap: 3 });
            lastTheme = theme.id;
        }
        const item = itemMap.get(instance.itemId);
        if (!item)
            continue;
        writer.write(`${instance.position}. ${item.textFr}`, { bold: true, gap: 1 });
        writer.write(`Réponse : ${answerLabel(session.answers[instance.instanceId], item, data)}`, { gap: 3 });
    }
    writer.doc.save(`${safeSlug(test.titleFr)}_${timestamp(new Date(session.startedAt))}.pdf`);
};
export const exportWavePdf = (episode, collection, module, selectedPageIds) => {
    const writer = createWriter(`${module.titleFr} — fiches remplies`);
    writer.write(`${collection.titleFr}. Épisode commencé le ${new Date(episode.startedAt).toLocaleString("fr-FR")}. Exporté le ${new Date().toLocaleString("fr-FR")}.`);
    writer.write("Outil d’auto-observation et de régulation. Il ne remplace pas un diagnostic, un traitement personnalisé ni les services d’urgence.", { bold: true, color: [166, 61, 54], gap: 5 });
    for (const page of module.pages.filter((candidate) => selectedPageIds.includes(candidate.id))) {
        writer.write(page.phaseLabelFr, { size: 15, bold: true, color: [36, 107, 103], gap: 4 });
        page.contentLines.forEach((line) => writer.write(line.replace(/\[ \]/g, "□").replace(/\.{4,}/g, "________________"), { gap: 1 }));
        const answers = episode.answers[page.id] || {};
        const nonEmpty = Object.entries(answers).filter(([, value]) => value !== "" && value !== false);
        if (nonEmpty.length) {
            writer.write("Réponses personnelles", { size: 12, bold: true });
            for (const [field, value] of nonEmpty)
                writer.write(`• ${field.replace(/^.*?:/, "")} : ${value === true ? "Oui" : String(value)}`);
        }
    }
    writer.doc.save(`${safeSlug(collection.titleFr)}_${safeSlug(module.titleFr)}_${timestamp(new Date(episode.startedAt))}.pdf`);
};
