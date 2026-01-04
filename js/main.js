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

    // Initialize Lightbox
    initLightbox();
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

function initLightbox() {
    // 1. Create Lightbox Elements if they don't exist
    if (!document.getElementById('lightbox')) {
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML = `
            <div class="lightbox-close">&times;</div>
            <div class="lightbox-content">
                <img src="" alt="Preview" class="lightbox-img">
            </div>
        `;
        document.body.appendChild(lightbox);
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');

    // 2. Add Event Listeners to Images
    // Targeting images in the screenshot scroller and any other potential galleries
    const images = document.querySelectorAll('.screenshot-scroller img, .content-gallery img');

    images.forEach(img => {
        img.style.cursor = 'zoom-in'; // UX Hint
        img.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent interfering with swipe logic
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            
            lightbox.style.display = 'flex';
            // Slight delay to allow display:flex to apply before adding active class for opacity transition
            setTimeout(() => {
                lightbox.classList.add('active');
            }, 10);
            
            document.body.style.overflow = 'hidden'; // Disable scroll
        });
    });

    // 3. Close Logic
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
            lightboxImg.src = ''; // Clear src
            document.body.style.overflow = ''; // Enable scroll
        }, 300); // Match CSS transition
    };

    closeBtn.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
}
