/* ============================================================
   KrishiSathi India - Main Script
   Page Background Images | Navigation | Utils | PWA
   ============================================================ */

// ---- Page Loader ----
window.addEventListener('load', () => {
  setTimeout(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => overlay.remove(), 600);
    }
  }, 1200);
});

// ---- Navbar Scroll Effect ----
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ---- Hamburger Menu ----
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
const mobileClose = document.getElementById('mobile-close');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

if (mobileClose) {
  mobileClose.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  });
}

// Close mobile nav on link click
document.querySelectorAll('.mobile-nav a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav?.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ---- Active Nav Link ----
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
  if (link.getAttribute('href') === currentPage) {
    link.classList.add('active');
  }
});

// ---- Page Background Image (with parallax "toggle" effect) ----
// A calm, illustrated scene per page instead of a 3D render — no WebGL,
// nothing to download but a small SVG, so it's lighter and works on every
// device (including ones without WebGL support). The image still gently
// shifts with mouse movement, echoing the depth the old 3D scene had.
const PAGE_BACKGROUNDS = {
  'index.html':              'bg-home.svg',        // sunrise over the fields
  '':                        'bg-home.svg',
  'dashboard.html':          'bg-dashboard.svg',    // field overview
  'crop-prediction.html':    'bg-crop.svg',         // growing crop rows
  'disease-prediction.html': 'bg-disease.svg',      // leaf close-up
  'weather.html':            'bg-weather.svg',      // sky & monsoon
  'market-prices.html':      'bg-market.svg',       // mandi / harvest
  'soil-map.html':           'bg-soil.svg',         // earth cross-section
  'schemes.html':            'bg-schemes.svg',      // government & fields
  'chat.html':                'bg-chat.svg',
  'voice.html':               'bg-chat.svg',
  'tips.html':                'bg-tips.svg',
  'about.html':                'bg-community.svg',
  'contact.html':              'bg-community.svg',
  'login.html':                'bg-auth.svg',        // welcoming sunrise gate
  'register.html':             'bg-auth.svg',
};

function getPageBackground() {
  return PAGE_BACKGROUNDS[currentPage] || PAGE_BACKGROUNDS['index.html'];
}

function initPageBackground() {
  const layer = document.createElement('div');
  layer.className = 'page-bg-layer';
  layer.id = 'page-bg-layer';
  layer.style.backgroundImage = `url('/static/img/${getPageBackground()}')`;
  document.body.prepend(layer);

  // Fade in once the image is ready (or immediately if it's already cached)
  const img = new Image();
  img.onload = () => requestAnimationFrame(() => layer.classList.add('is-loaded'));
  img.onerror = () => layer.classList.add('is-loaded'); // don't hide the page if the image fails
  img.src = `/static/img/${getPageBackground()}`;

  // Respect users who've asked their OS/browser to minimize motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // Subtle parallax: the background drifts a few pixels opposite the
  // pointer, giving a light sense of depth without any render loop.
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 24;
    targetY = (e.clientY / window.innerHeight - 0.5) * 24;
  });

  function tick() {
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;
    layer.style.transform = `translate(${-currentX}px, ${-currentY}px) scale(1.05)`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  initPageBackground();
  initScrollAnimations();
  initLanguageToggle();
  initPWA();
  initCounters();

  // Keep footer "© 20XX" correct forever, without editing every template each year
  document.querySelectorAll('.copy-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
});

// ---- Scroll Animations ----
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-card, .dash-card, .soil-card, .scheme-card, .tip-card, .team-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ---- Language Toggle ----
const translations = {
  en: {
    'nav-home': 'Home',
    'nav-dashboard': 'Dashboard',
    'nav-crop': 'Crop AI',
    'nav-weather': 'Weather',
    'nav-market': 'Markets',
    'hero-title': 'Smart Farming for <span class="highlight">Indian Farmers</span>',
    'hero-sub': 'AI-powered crop predictions, real-time weather, market prices, and government scheme information — all in one place.',
    'get-started': 'Get Started Free',
    'view-demo': 'View Demo'
  },
  hi: {
    'nav-home': 'होम',
    'nav-dashboard': 'डैशबोर्ड',
    'nav-crop': 'फसल AI',
    'nav-weather': 'मौसम',
    'nav-market': 'बाज़ार',
    'hero-title': '<span class="highlight">भारतीय किसानों</span> के लिए स्मार्ट खेती',
    'hero-sub': 'AI-संचालित फसल भविष्यवाणी, रियल-टाइम मौसम, बाज़ार भाव और सरकारी योजनाएं — एक ही जगह।',
    'get-started': 'मुफ्त शुरू करें',
    'view-demo': 'डेमो देखें'
  }
};

let currentLang = localStorage.getItem('agro-lang') || 'en';

function initLanguageToggle() {
  updateLangButtons();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem('agro-lang', currentLang);
      updateLangButtons();
      applyTranslations();
    });
  });
  applyTranslations();
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

function applyTranslations() {
  const t = translations[currentLang];
  Object.entries(t).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.innerHTML = val;
  });
}

// ---- Counter Animation ----
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            el.textContent = target + suffix;
            clearInterval(timer);
          } else {
            el.textContent = Math.floor(current) + suffix;
          }
        }, 25);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

// ---- PWA Install ----
function initPWA() {
  let deferredPrompt;
  const banner = document.getElementById('pwa-banner');
  const installBtn = document.getElementById('pwa-install');
  const closeBtn = document.getElementById('pwa-close');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (banner) {
      setTimeout(() => banner.classList.add('show'), 3000);
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        banner?.classList.remove('show');
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => banner?.classList.remove('show'));
  }
}

// ---- Auth State Check ----
function checkAuth() {
  return localStorage.getItem('agro-user') !== null;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('agro-user')); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem('agro-user');
  window.location.href = 'login.html';
}

// ---- Toast Notification ----
function showToast(message, type = 'success') {
  const existing = document.querySelectorAll('.toast');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast alert alert-${type}`;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 1.5rem; z-index: 9000;
    min-width: 260px; max-width: 380px;
    animation: slideUp 0.3s ease;
    box-shadow: 0 8px 30px rgba(0,0,0,0.3);
  `;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠'}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ---- Format numbers ----
function formatPrice(num) {
  return '₹' + num.toLocaleString('en-IN');
}

// Register service worker (root-scoped so it can offline-cache the whole site)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .catch(() => { /* offline support just won't be available — the site still works fully online */ });
  });
}

// Export for use in other scripts
window.KrishiSathi = {
  showToast,
  checkAuth,
  getUser,
  logout,
  formatPrice,
  currentLang: () => currentLang
};
