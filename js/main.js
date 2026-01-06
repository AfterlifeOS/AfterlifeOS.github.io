document.addEventListener('DOMContentLoaded', () => {
    // Inject Theme Toggle Button
    injectThemeToggle();

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

    // Simple scroll effect for navbar (Desktop Only)
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.innerWidth > 900) {
            if (window.scrollY > 50) {
                navbar.style.background = 'var(--nav-bg-scrolled)';
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
            } else {
                navbar.style.background = 'var(--nav-bg)'; // Match CSS variable
                navbar.style.boxShadow = 'none';
            }
        } else {
            // Mobile: Ensure clear background to respect CSS override
            navbar.style.background = '';
            navbar.style.boxShadow = '';
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

function injectThemeToggle() {
    const navLinks = document.getElementById('navLinks');
    const mobileToggle = document.getElementById('mobileToggle');
    const navContainer = document.querySelector('.nav-container');
    
    if (!navLinks || !navContainer) return;

    // 1. Desktop Toggle (Inside Nav Links)
    if (!document.getElementById('themeToggleBtnDesktop')) {
        const li = document.createElement('li');
        li.className = 'desktop-only-toggle'; // CSS class to hide on mobile
        li.innerHTML = `
            <button id="themeToggleBtnDesktop" class="theme-toggle-btn" aria-label="Toggle Dark Mode">
                <i class="fas fa-moon"></i>
            </button>
        `;
        navLinks.appendChild(li);
    }

    // 2. Mobile Toggle (Next to Hamburger)
    if (!document.getElementById('themeToggleBtnMobile') && mobileToggle) {
        const btn = document.createElement('div');
        btn.innerHTML = `
            <button id="themeToggleBtnMobile" class="theme-toggle-btn mobile-only-toggle" aria-label="Toggle Dark Mode" style="margin-right: 10px;">
                <i class="fas fa-moon"></i>
            </button>
        `;
        // Insert before the hamburger icon
        navContainer.insertBefore(btn.firstElementChild, mobileToggle);
    }

    // Initialize Logic for BOTH buttons
    const toggles = [
        document.getElementById('themeToggleBtnDesktop'),
        document.getElementById('themeToggleBtnMobile')
    ];

    // Check saved preference
    const savedTheme = localStorage.getItem('theme');
    
    // Apply initial theme
    const applyTheme = (isLight) => {
        if (isLight) {
            document.body.classList.add('light-mode');
            toggles.forEach(t => { if(t) t.querySelector('i').className = 'fas fa-sun'; });
        } else {
            document.body.classList.remove('light-mode');
            toggles.forEach(t => { if(t) t.querySelector('i').className = 'fas fa-moon'; });
        }
    };

    if (savedTheme === 'light') {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    // Toggle Event
    toggles.forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            // Prevent event bubbling if necessary
            e.stopPropagation();
            
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            
            // Sync both buttons
            toggles.forEach(t => { 
                if(t) t.querySelector('i').className = isLight ? 'fas fa-sun' : 'fas fa-moon'; 
            });
            
            // Save Preference
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    });
}

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
