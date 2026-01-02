document.addEventListener('DOMContentLoaded', async () => {
    const timelineContainer = document.querySelector('.timeline');
    
    if (!timelineContainer) return;

    try {
        const response = await fetch('/changelogs.json');
        if (!response.ok) throw new Error('Failed to load changelogs');
        
        const changelogs = await response.json();
        renderChangelogs(changelogs, timelineContainer);
    } catch (error) {
        console.error('Error loading changelogs:', error);
        timelineContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Failed to load changelogs.</p>';
    }
});

function renderChangelogs(logs, container) {
    container.innerHTML = ''; // Clear loading/static content

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        // Generate list items HTML
        const changesListHtml = log.changes.map(change => `<li>${change}</li>`).join('');
        
        // Badge HTML if latest
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

        // Add subtle animation delay for staggered entrance (optional, needs CSS support)
        // item.style.animationDelay = `${index * 0.1}s`;

        container.appendChild(item);
    });
}
