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
export const scoreTest = (session, test, data) => {
    const items = new Map(data.items.map((item) => [item.itemId, item]));
    const results = test.themes.map((theme) => {
        const instances = test.instances.filter((instance) => instance.themeId === theme.id);
        const validValues = [];
        let applicable = 0;
        for (const instance of instances) {
            const answer = session.answers[instance.instanceId];
            if (answer?.kind === "not-applicable")
                continue;
            applicable += 1;
            const item = items.get(instance.itemId);
            if (!item || answer?.kind !== "value" || item.scoring.type === "flag")
                continue;
            validValues.push(answer.value ?? 0);
        }
        const normalized = validValues.length
            ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length / 4
            : null;
        return {
            themeId: theme.id,
            titleFr: theme.titleFr,
            role: theme.role,
            normalized,
            answered: validValues.length,
            applicable,
            total: instances.length
        };
    });
    const flags = test.instances.flatMap((instance) => {
        const item = items.get(instance.itemId);
        const answer = session.answers[instance.instanceId];
        if (!item || item.scoring.type !== "flag" || answer?.kind !== "value" || (answer.value ?? 0) < (item.scoring.triggerAt ?? 3))
            return [];
        return [{ instanceId: instance.instanceId, textFr: item.textFr, answer: answerLabel(answer, item, data) }];
    });
    const counts = Object.values(session.answers).reduce((total, answer) => {
        total[answer.kind] += 1;
        return total;
    }, { value: 0, unknown: 0, "not-applicable": 0, skipped: 0 });
    return { results, flags, counts };
};
