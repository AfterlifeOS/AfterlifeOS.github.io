document.addEventListener('DOMContentLoaded', async () => {
    const timelineContainer = document.querySelector('.timeline');
    if (!timelineContainer) return;

    // Fetch data from External Repo (No Redeploy Needed)
    // Using timestamp to bust cache
    const dataUrl = `https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/16.2/source_changelogs.json?t=${Date.now()}`;

    try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error("Failed to load changelogs");

        // Parse pure JSON
        const data = await response.json();

        if (Array.isArray(data)) {
            renderChangelogs(data, timelineContainer);
        } else {
            throw new Error("Data format invalid");
        }

    } catch (e) {
        console.error("Changelog loading error:", e);
        timelineContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                <p>Failed to load updates. Check connection.</p>
            </div>
        `;
    }
});

function renderChangelogs(logs, container) {
    container.innerHTML = '';

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const changesListHtml = parseChanges(log.changes);
        const badgeHtml = log.isLatest ? '<span class="badge" style="margin-left: 10px;">Latest</span>' : '';

        item.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-date">${log.date}</div>
            <div class="card timeline-content">
                <h3 class="version-title">${log.version} ${badgeHtml}</h3>
                <ul class="changelog-list">
                    ${changesListHtml}
                </ul>
            </div>
        `;

        container.appendChild(item);
    });
}

function parseChanges(textBlock) {
    if (!textBlock) return '';
    return textBlock
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const cleanLine = line.replace(/^(\d+[\.\)]|[-*+>•.])\s*/, ''); 
            return `<li>${cleanLine}</li>`;
        })
        .join('');
}
