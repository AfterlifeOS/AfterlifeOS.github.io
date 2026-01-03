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