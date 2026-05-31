/**
 * DEVOS — APP.JS
 * Main application entry point. Initializes all modules and loads data.
 */

(function () {
  'use strict';

  const { CONFIG, DOM, Format, State, API, Analytics } = window.DevOS;
  const M = window.DevOS.Modules;

  /* ══════════════════════════════════════
     LOADER
  ══════════════════════════════════════ */
  const LOADER_MESSAGES = [
    'Initializing DevOS...',
    'Connecting to GitHub API...',
    'Fetching profile data...',
    'Loading repositories...',
    'Analyzing languages...',
    'Building components...',
    'Almost ready...',
  ];

  let _loaderStep = 0;

  function _updateLoader(pct, message) {
    const bar    = DOM.id('loaderBar');
    const status = DOM.id('loaderStatus');
    const text   = DOM.id('loaderText');

    if (bar)    bar.style.width = `${pct}%`;
    if (status) status.textContent = message || LOADER_MESSAGES[_loaderStep % LOADER_MESSAGES.length];
    if (text) {
      const appName = 'DevOS';
      const chars   = appName.split('');
      const shown   = chars.slice(0, Math.ceil((pct / 100) * chars.length)).join('');
      text.textContent = shown;
    }
    _loaderStep++;
  }

  function _hideLoader() {
    const loader  = DOM.id('pageLoader');
    const wrapper = DOM.id('appWrapper');

    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 600);
    }

    if (wrapper) {
      wrapper.classList.add('visible');
    }
  }

  /* ══════════════════════════════════════
     NOISE CANVAS
  ══════════════════════════════════════ */
  function _initNoise() {
    const canvas = DOM.id('noise-canvas');
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      drawNoise();
    }

    function drawNoise() {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data      = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v       = Math.random() * 255;
        data[i]       = v;
        data[i + 1]   = v;
        data[i + 2]   = v;
        data[i + 3]   = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  /* ══════════════════════════════════════
     MOUSE GLOW
  ══════════════════════════════════════ */
  function _initMouseGlow() {
    const glow = DOM.id('mouseGlow');
    if (!glow) return;

    let mouseX = 0, mouseY = 0;
    let glowX  = 0, glowY  = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    function animate() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top  = glowY + 'px';
      requestAnimationFrame(animate);
    }
    animate();

    // Hide on mobile
    window.addEventListener('touchstart', () => { glow.style.opacity = '0'; }, { passive: true });
    window.addEventListener('mousemove', () => { glow.style.opacity = '1'; }, { once: true });
  }

  /* ══════════════════════════════════════
     NAV SCROLL EFFECT
  ══════════════════════════════════════ */
  function _initNavScroll() {
    const nav = DOM.id('topNav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ══════════════════════════════════════
     NAV LINKS SCROLL
  ══════════════════════════════════════ */
  function _initNavLinks() {
    DOM.qsa('.nav-link[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.scrollToSection(link.dataset.section);
      });
    });
    DOM.qsa('.mobile-nav-item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.scrollToSection(item.dataset.section);
      });
    });
  }

  /* ══════════════════════════════════════
     MAIN BOOT
  ══════════════════════════════════════ */
  async function boot() {
    // Init noise + mouse glow immediately
    _initNoise();
    _initMouseGlow();
    _initNavScroll();
    _initNavLinks();

    // Init analytics
    Analytics.init();

    // Initialize modals/overlays that need binding
    M.Terminal.init();
    M.CommandPalette.init();
    M.Search.init();
    M.Preview.init();
    M.Mobile.init();

    _updateLoader(10, 'Connecting to GitHub API...');

    try {
      // 1. Fetch user
      _updateLoader(20, 'Fetching profile data...');
      const user = await API.getUser();
      State.set('user', user);
      State.setLoading({ user: false });
      M.Hero.render(user);

      // 2. Fetch repos
      _updateLoader(45, 'Loading repositories...');
      const repos = await API.getRepos();
      State.set('repos', repos);
      State.setLoading({ repos: false });
      State.computeStats();

      // Update hero cards with repo data
      M.Hero.updateCards();

      // 3. Init sections that depend on repos
      _updateLoader(65, 'Building dashboard...');
      M.Dashboard.init();
      M.Projects.init();
      M.Explorer.init();
      M.Timeline.init();
      M.Achievements.init();
      M.Detector.init();

      // 4. Fetch events (non-blocking)
      _updateLoader(80, 'Loading activity feed...');
      M.Activity.init();
      M.Contribution.init();

      // 5. Fetch languages (background, non-blocking)
      _updateLoader(90, 'Analyzing languages...');
      API.getAggregateLanguages().then(langs => {
        State.set('languages', langs);
        State.computeStats();
        M.Skills.init();
        M.Achievements.render(); // Re-render with updated lang count
      }).catch(e => {
        console.warn('[App] Language fetch failed:', e);
        // Fallback: use primary language from repos
        const fallbackLangs = {};
        repos.forEach(r => {
          if (r.language) fallbackLangs[r.language] = (fallbackLangs[r.language] || 0) + 1000;
        });
        State.set('languages', fallbackLangs);
        M.Skills.init();
      });

      _updateLoader(100, 'Ready!');
      setTimeout(_hideLoader, 400);

      // Trigger reveal animations
      setTimeout(() => {
        DOM.observeReveal('.reveal');
        DOM.observeReveal('.reveal-left');
        DOM.observeReveal('.reveal-right');
        DOM.observeReveal('.reveal-scale');
      }, 200);

    } catch (e) {
      console.error('[App] Boot error:', e);
      _updateLoader(100, 'Error loading data');

      DOM.id('loaderStatus').textContent = `Error: ${e.message}`;
      DOM.id('loaderStatus').style.color = '#f87171';

      // Show error in loader, still hide after delay
      setTimeout(() => {
        _hideLoader();
        DOM.toast(`Failed to load GitHub data: ${e.message}`, 'error', 8000);
      }, 2000);
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
