document.addEventListener('DOMContentLoaded', async () => {
    await loadCoreTeam();
    await loadMaintainers();
});

async function loadCoreTeam() {
    try {
        const response = await fetch('/team.json');
        if (!response.ok) throw new Error('Failed to load team data');
        const data = await response.json();

        renderSection('lead-container', data.leads, 'card-lead', 'team-avatar-lg');
        renderSection('core-container', data.core, '', 'team-avatar-md');
        renderSection('designers-container', data.designers, '', 'team-avatar-md');
        renderSection('contributors-container', data.contributors, '', 'team-avatar-sm');
    } catch (error) {
        console.error(error);
    }
}

async function loadMaintainers() {
    const container = document.getElementById('maintainers-grid');
    if (!container) return;

    try {
        // Fetch from the same source as downloads page
        const response = await fetch('https://raw.githubusercontent.com/AfterlifeOS/device_afterlife_ota/refs/heads/16/devices.json');
        if (!response.ok) throw new Error('Failed to load maintainers');
        
        const data = await response.json();
        const devices = data.devices || [];

        // Extract unique maintainers
        const maintainerMap = new Map();
        
        devices.forEach(device => {
            // Priority: Explicit github_username -> Empty (Fallback Image)
            const name = device.maintainer;
            const username = device.github_username; // No more guessing from name!
            
            if (!maintainerMap.has(name)) {
                maintainerMap.set(name, {
                    name: name,
                    username: username,
                    devices: []
                });
            }
            maintainerMap.get(name).devices.push(device.codename);
        });

        // Render
        container.innerHTML = '';
        maintainerMap.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.padding = '20px';
            card.style.textAlign = 'center';
            card.style.transition = 'transform 0.2s';
            card.onmouseover = () => card.style.transform = 'translateY(-5px)';
            card.onmouseout = () => card.style.transform = 'translateY(0)';

            // Use github avatar if username exists, otherwise fallback
            const avatarUrl = m.username ? `https://github.com/${m.username}.png` : '/img/fallback.webp';
            // Link to github profile if username exists, otherwise #
            const profileUrl = m.username ? `https://github.com/${m.username}` : '#';

            card.innerHTML = `
                <a href="${profileUrl}" target="${m.username ? '_blank' : '_self'}" style="text-decoration: none; color: inherit; cursor: ${m.username ? 'pointer' : 'default'};">
                    <img src="${avatarUrl}" alt="${m.name}" 
                         style="width: 70px; height: 70px; border-radius: 50%; margin-bottom: 10px; border: 2px solid var(--border-subtle); object-fit: cover;"
                         onerror="this.src='/img/fallback.webp'">
                    <h4 style="margin-bottom: 5px; font-size: 1rem; word-wrap: break-word; overflow-wrap: break-word; line-height: 1.2;">${m.name}</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0;">
                        ${m.devices.join(', ')}
                    </p>
                </a>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p>Failed to load maintainers.</p>';
    }
}

function renderSection(containerId, members, cardClass, avatarClass) {
    const container = document.getElementById(containerId);
    if (!container || !members) return;

    container.innerHTML = '';
    members.forEach(member => {
        const card = document.createElement('div');
        card.className = `card ${cardClass}`;
        
        const avatarUrl = member.github ? `https://github.com/${member.github}.png` : '/img/fallback.webp';
        const profileUrl = member.github ? `https://github.com/${member.github}` : '#';
        
        card.innerHTML = `
            <div class="${avatarClass}">
                <img src="${avatarUrl}" alt="${member.name}" 
                     style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"
                     onerror="this.src='/img/fallback.webp'">
            </div>
            <div style="text-align: center;">
                <h3 style="margin-bottom: 5px;">${member.name}</h3>
                <span class="role-badge role-core" style="margin-bottom: 10px; display: inline-block;">${member.role}</span>
                <p style="color: var(--text-muted); font-style: italic; font-size: 0.9rem; margin-bottom: 15px;">"${member.quote}"</p>
                <div class="social-links">
                    ${member.github ? `<a href="${profileUrl}" target="_blank"><i class="fab fa-github fa-lg"></i></a>` : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
