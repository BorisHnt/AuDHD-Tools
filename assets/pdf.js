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
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF)
        throw new Error("Le générateur PDF n’est pas chargé sur cette page.");
    const selectedPages = module.pages.filter((candidate) => selectedPageIds.includes(candidate.id));
    if (!selectedPages.length)
        throw new Error("Aucune fiche sélectionnée.");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const bottomLimit = pageHeight - 18;
    const colors = {
        ink: [28, 35, 51],
        muted: [87, 101, 121],
        blue: [54, 89, 162],
        blueSoft: [235, 240, 250],
        teal: [36, 107, 103],
        tealSoft: [229, 242, 239],
        coral: [166, 61, 54],
        coralSoft: [251, 235, 232],
        amber: [164, 105, 14],
        amberSoft: [253, 245, 226],
        line: [205, 215, 224],
        paper: [255, 255, 255],
        panel: [247, 249, 251]
    };
    const exportedAt = new Date();
    let y = 0;
    let activeSheet = selectedPages[0];
    const setText = (size = 9.5, bold = false, color = colors.ink) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
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
        doc.text(`Épisode : ${new Date(episode.startedAt).toLocaleString("fr-FR")}  ·  Export : ${exportedAt.toLocaleString("fr-FR")}`, margin, 42);
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
            const fieldId = `${lineIndex}-${optionIndex}:${label.slice(0, 42)}`;
            const checked = values[fieldId] === true;
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
        const fieldId = `${lineIndex}-0:${label.slice(0, 42)}`;
        const answer = values[fieldId];
        const labelLines = split(label, contentWidth, 8.4, true);
        const empty = answer === undefined || answer === "";
        if (empty) {
            const height = textHeight(labelLines, 8.4) + 4;
            ensureSpace(height);
            setText(8.4, true, colors.muted);
            doc.text(labelLines, margin, y);
            setText(7.4, false, colors.muted);
            doc.text("Non renseigné", pageWidth - margin, y, { align: "right" });
            y += textHeight(labelLines, 8.4) + 1.2;
            doc.setDrawColor(...colors.line);
            doc.setLineWidth(0.25);
            doc.line(margin, y, pageWidth - margin, y);
            y += 2.8;
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
            paragraph(trimmed, { size: 7.2, color: colors.muted, gap: 2.5 });
            return;
        }
        if (headingPattern.test(trimmed)) {
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
        title: `${module.titleFr} — fiches remplies`,
        subject: "Fiches personnelles d’auto-observation",
        author: "AuDHD Tools",
        creator: "AuDHD Tools"
    });
    doc.save(`${safeSlug(collection.titleFr)}_${safeSlug(module.titleFr)}_${timestamp(new Date(episode.startedAt))}.pdf`);
};
