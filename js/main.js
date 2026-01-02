document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            // Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Simple scroll effect for navbar
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(5, 5, 5, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(5, 5, 5, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Scroll Animations
    const observerOptions = {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Load Team Data (if on team page)
    if (document.getElementById('maintainers-grid')) {
        loadTeamData();
        loadMaintainers();
    }
});

function generateSocialLinks(socials) {
    if (!socials) return '';
    return Object.entries(socials).map(([platform, url]) => {
        let iconClass = `fab fa-${platform}`;
        if (platform === 'website' || platform === 'link') iconClass = 'fas fa-globe';
        
        let color = 'inherit';
        if (platform === 'twitter') color = '#1da1f2';
        if (platform === 'telegram') color = '#0088cc';
        if (platform === 'github') color = '#fff';
        if (platform === 'dribbble') color = '#ea4c89';
        if (platform === 'behance') color = '#1769ff';
        if (platform === 'instagram') color = '#e4405f';

        return `<a href="${url}" target="_blank" style="color: ${color};"><i class="${iconClass}"></i></a>`;
    }).join('');
}

async function loadTeamData() {
    try {
        const response = await fetch('team.json');
        if (!response.ok) throw new Error('Failed to load team data');
        const data = await response.json();

        // Render Lead
        const leadContainer = document.getElementById('lead-container');
        if (leadContainer && data.lead) {
            leadContainer.innerHTML = data.lead.map(member => `
                <div class="card card-lead" style="width: 100%; max-width: 400px; text-align: center;">
                    <div class="team-avatar-lg">
                        <i class="${member.avatar_icon}" style="color: #ffd700;"></i>
                    </div>
                    <h3 style="font-size: 1.8rem; margin-bottom: 5px;">${member.name}</h3>
                    <span class="role-badge role-lead">${member.role}</span>
                    <p style="color: var(--text-muted); margin-bottom: 20px;">${member.description || ''}</p>
                    <div class="social-links" style="font-size: 1.5rem; gap: 20px; display: flex; justify-content: center;">
                        ${generateSocialLinks(member.socials)}
                    </div>
                </div>
            `).join('');
        }

        // Render Core
        const coreContainer = document.getElementById('core-container');
        if (coreContainer && data.core) {
            coreContainer.innerHTML = data.core.map(member => `
                <div class="card" style="text-align: center;">
                    <div class="team-avatar-md">
                        <i class="${member.avatar_icon}" style="color: var(--color-secondary);"></i>
                    </div>
                    <h3>${member.name}</h3>
                    <span class="role-badge role-core">${member.role}</span>
                    <p style="color: var(--text-muted);">${member.description || ''}</p>
                    <div class="social-links" style="margin-top: 15px; font-size: 1.2rem; gap: 15px; display: flex; justify-content: center;">
                        ${generateSocialLinks(member.socials)}
                    </div>
                </div>
            `).join('');
        }

        // Render Designers
        const designContainer = document.getElementById('designers-container');
        if (designContainer && data.designers) {
            designContainer.innerHTML = data.designers.map(member => `
                <div class="card" style="text-align: center;">
                    <div class="team-avatar-md" style="border-color: #ff00dd;">
                        <i class="${member.avatar_icon}" style="color: #ff00dd;"></i>
                    </div>
                    <h3>${member.name}</h3>
                    <span class="role-badge role-design">${member.role}</span>
                    <div class="social-links" style="margin-top: 15px; font-size: 1.2rem; gap: 15px; display: flex; justify-content: center;">
                        ${generateSocialLinks(member.socials)}
                    </div>
                </div>
            `).join('');
        }

        // Render Contributors
        const contribContainer = document.getElementById('contributors-container');
        if (contribContainer && data.contributors) {
            contribContainer.innerHTML = data.contributors.map(member => `
                <div class="card" style="text-align: center; padding: 20px;">
                    <div class="team-avatar-sm">
                        <i class="${member.avatar_icon}"></i>
                    </div>
                    <h4 style="margin-bottom: 5px;">${member.name}</h4>
                    <span class="role-badge role-contrib" style="font-size: 0.7rem; padding: 2px 8px;">${member.role}</span>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error loading team data:', error);
    }
}

async function loadMaintainers() {
    const container = document.getElementById('maintainers-grid');
    if (!container) return;

    try {
        const response = await fetch('maintainers.json');
        if (!response.ok) throw new Error('Failed to load maintainers');
        
        const maintainers = await response.json();
        
        // Sort alphabetically by name
        maintainers.sort((a, b) => a.name.localeCompare(b.name));

        container.innerHTML = maintainers.map(m => {
            const avatarUrl = m.github_username ? `https://github.com/${m.github_username}.png?size=60` : null;
            
            return `
            <div class="card" style="text-align: center; padding: 20px; border-color: rgba(255,255,255,0.05); transition: transform 0.2s;">
                <div class="team-avatar-sm" style="border-color: #333; font-size: 1.2rem; overflow: hidden; background: #000;">
                    ${avatarUrl 
                        ? `<img src="${avatarUrl}" alt="${m.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\'fas fa-user\'></i>'">` 
                        : `<i class="fas fa-user"></i>`}
                </div>
                <h4 style="margin-bottom: 2px; font-size: 1rem;">${m.name}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); font-family: monospace; margin-bottom: 8px;">${m.device}</p>
                
                ${m.github_username ? `
                <a href="https://github.com/${m.github_username}" target="_blank" style="font-size: 0.9rem; color: var(--text-muted); display: inline-block; transition: color 0.3s;">
                    <i class="fab fa-github"></i>
                </a>` : ''}
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = `<p style="text-align: center; color: var(--error-red);">Failed to load maintainers list.</p>`;
    }
}