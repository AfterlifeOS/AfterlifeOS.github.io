document.addEventListener('DOMContentLoaded', () => {
    const timelineContainer = document.querySelector('.timeline');
    
    if (!timelineContainer) return;

    // Debugging: Check if data is loaded
    console.log("Checking for changelogsData...");

    // Try to access the variable directly
    let data = null;
    try {
        if (typeof changelogsData !== 'undefined') {
            data = changelogsData;
        } else if (window.changelogsData) {
            data = window.changelogsData;
        }
    } catch (e) {
        console.error("Error accessing data variable:", e);
    }

    if (!data) {
        console.error('Error: changelogsData is not found. Ensure js/data_changelogs.js is loaded properly.');
        timelineContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Failed to load data. Please refresh.</p>';
        return;
    }

    console.log("Data found, rendering...", data);
    renderChangelogs(data, timelineContainer);
});

function renderChangelogs(logs, container) {
    container.innerHTML = ''; // Clear loading

    logs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        // Parse the multi-line string into HTML list items
        const changesListHtml = parseChanges(log.changes);
        
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

        container.appendChild(item);
    });
}

// Helper to convert raw text block into <li> elements
function parseChanges(textBlock) {
    if (!textBlock) return '';

    return textBlock
        .split('\n')                  // Split by new line
        .map(line => line.trim())     // Remove extra whitespace
        .filter(line => line.length > 0) // Remove empty lines
        .map(line => {
            // Aggressively remove common list markers from the start:
            // 1. Numbers (1., 1), 01.)
            // 2. Bullets (-, *, +, >)
            // 3. Dots (.)
            // 4. Leading whitespace is already trimmed above
            const cleanLine = line.replace(/^(\d+[\.\)]|[-*+>•.])\s*/, ''); 
            return `<li>${cleanLine}</li>`;
        })
        .join('');
}
