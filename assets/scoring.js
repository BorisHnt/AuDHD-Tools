export const answerLabel = (answer, item, data) => {
    if (!answer)
        return "Sans réponse";
    if (answer.kind === "unknown")
        return "Je ne sais pas";
    if (answer.kind === "not-applicable")
        return "Non applicable";
    if (answer.kind === "skipped")
        return "Passée pour l’instant";
    const scale = data.responseScales.find((candidate) => candidate.id === item.responseScale);
    return scale?.options.find((option) => option.id === answer.optionId)?.labelFr || String(answer.value ?? "");
};

const itemValue = (item, answer) => {
    if (answer?.kind !== "value" || item.scoring.type === "flag" || item.scoring.type === "none")
        return null;
    const value = answer.value;
    if (typeof value !== "number")
        return null;
    if (item.scoring.type === "reverse") {
        const minimum = item.scoring.minimum ?? 0;
        const maximum = item.scoring.maximum ?? 4;
        return maximum + minimum - value;
    }
    return value;
};

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

export const scoreTest = (session, test, data) => {
    const items = new Map(data.items.map((item) => [item.itemId, item]));
    const concepts = new Map(data.concepts.map((concept) => [concept.id, concept]));
    const policy = data.coveragePolicy;
    const testEntries = test.instances.flatMap((instance) => {
        const item = items.get(instance.itemId);
        return item ? [{ instance, item, answer: session.answers[instance.instanceId] }] : [];
    });
    const results = data.dimensions
        .filter((dimension) => dimension.family === test.family)
        .map((dimension) => {
            const entries = testEntries.filter(({ item }) => item.dimensionId === dimension.id);
            const conceptIds = [...new Set(entries.map(({ item }) => item.conceptId))];
            const conceptResults = conceptIds.map((conceptId) => {
                const conceptEntries = entries.filter(({ item }) => item.conceptId === conceptId);
                const applicableEntries = conceptEntries.filter(({ answer }) => answer?.kind !== "not-applicable");
                const values = applicableEntries.flatMap(({ item, answer }) => {
                    const value = itemValue(item, answer);
                    return value === null ? [] : [value];
                });
                return {
                    conceptId,
                    labelFr: concepts.get(conceptId)?.labelFr || conceptId,
                    applicable: applicableEntries.length > 0,
                    answeredItems: values.length,
                    applicableItems: applicableEntries.length,
                    value: values.length ? mean(values) : null
                };
            });
            const applicableConcepts = conceptResults.filter((concept) => concept.applicable);
            const answeredConcepts = applicableConcepts.filter((concept) => concept.value !== null);
            const flagsOnly = entries.length > 0 && entries.every(({ item }) => item.scoring.type === "flag");
            const coverage = applicableConcepts.length ? answeredConcepts.length / applicableConcepts.length : null;
            const requiredConcepts = policy.minimumAnsweredConcepts;
            const sufficient = !flagsOnly
                && applicableConcepts.length > 0
                && answeredConcepts.length >= requiredConcepts
                && coverage >= policy.minimumConceptCoverage;
            let status = "insufficient";
            if (!entries.length)
                status = "not-explored";
            else if (flagsOnly)
                status = "flags-only";
            else if (!applicableConcepts.length)
                status = "not-applicable";
            else if (sufficient)
                status = "sufficient";
            return {
                dimensionId: dimension.id,
                titleFr: dimension.labelFr,
                group: dimension.group,
                status,
                normalized: sufficient ? mean(answeredConcepts.map((concept) => concept.value)) / 4 : null,
                answeredConcepts: answeredConcepts.length,
                applicableConcepts: applicableConcepts.length,
                totalConcepts: conceptResults.length,
                answeredItems: conceptResults.reduce((sum, concept) => sum + concept.answeredItems, 0),
                applicableItems: conceptResults.reduce((sum, concept) => sum + concept.applicableItems, 0),
                coverage,
                concepts: conceptResults
            };
        });

    const flags = testEntries.flatMap(({ instance, item, answer }) => {
        if (item.scoring.type !== "flag" || answer?.kind !== "value" || (answer.value ?? 0) < (item.scoring.triggerAt ?? 3))
            return [];
        return [{
            instanceId: instance.instanceId,
            dimensionId: item.dimensionId,
            textFr: item.textFr,
            answer: answerLabel(answer, item, data)
        }];
    });

    const counts = Object.values(session.answers).reduce((total, answer) => {
        total[answer.kind] += 1;
        return total;
    }, { value: 0, unknown: 0, "not-applicable": 0, skipped: 0 });

    return { results, flags, counts, coveragePolicy: policy };
};
