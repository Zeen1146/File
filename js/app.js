/**
 * DEVOS — APP.JS
 * Main application entry point. Robust version with null checks.
 */

(function () {
  'use strict';

  const { CONFIG, DOM, Format, State, API, Analytics } = window.DevOS;

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

    if (bar)    bar.style.width = pct + '%';
    if (status) status.textContent = message || LOADER_MESSAGES[_loaderStep % LOADER_MESSAGES.length];
    if (text) {
      const appName = 'DevOS';
      const shown   = appName.slice(0, Math.ceil((pct / 100) * appName.length));
      text.textContent = shown;
    }
    _loaderStep++;
  }

  function _hideLoader() {
    const loader  = DOM.id('pageLoader');
    const wrapper = DOM.id('appWrapper');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 600);
    }
    if (wrapper) wrapper.classList.add('visible');
  }

  function _showLoaderError(msg) {
    const status = DOM.id('loaderStatus');
    if (status) {
      status.textContent = 'Error: ' + msg;
      status.style.color = '#f87171';
    }
    const bar = DOM.id('loaderBar');
    if (bar) bar.style.background = '#f87171';
  }

  /* ── Noise canvas ── */
  function _initNoise() {
    const canvas = DOM.id('noise-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = data[i+1] = data[i+2] = v;
        data[i+3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
  }

  /* ── Mouse glow ── */
  function _initMouseGlow() {
    const glow = DOM.id('mouseGlow');
    if (!glow) return;
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
    }, { passive: true });
    (function animate() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top  = glowY + 'px';
      requestAnimationFrame(animate);
    })();
    window.addEventListener('touchstart', function () { glow.style.opacity = '0'; }, { passive: true });
    window.addEventListener('mousemove', function () { glow.style.opacity = '1'; }, { once: true });
  }

  /* ── Nav scroll ── */
  function _initNavScroll() {
    const nav = DOM.id('topNav');
    if (!nav) return;
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Nav links ── */
  function _initNavLinks() {
    DOM.qsa('.nav-link[data-section]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        DOM.scrollToSection(link.dataset.section);
      });
    });
    DOM.qsa('.mobile-nav-item[data-section]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        DOM.scrollToSection(item.dataset.section);
      });
    });
  }

  /* ── Safe module call ── */
  function _safeInit(moduleName) {
    try {
      const M = window.DevOS.Modules;
      if (M && M[moduleName] && typeof M[moduleName].init === 'function') {
        M[moduleName].init();
      } else {
        console.warn('[App] Module not found or missing init():', moduleName);
      }
    } catch (e) {
      console.error('[App] Error initializing module:', moduleName, e);
    }
  }

  function _safeCall(moduleName, methodName) {
    try {
      const M = window.DevOS.Modules;
      if (M && M[moduleName] && typeof M[moduleName][methodName] === 'function') {
        M[moduleName][methodName]();
      } else {
        console.warn('[App] Module method not found:', moduleName + '.' + methodName);
      }
    } catch (e) {
      console.error('[App] Error calling:', moduleName + '.' + methodName, e);
    }
  }

  /* ══════════════════════════════════════
     MAIN BOOT
  ══════════════════════════════════════ */
  async function boot() {
    console.log('[DevOS] Boot started');

    _initNoise();
    _initMouseGlow();
    _initNavScroll();
    _initNavLinks();

    // Analytics
    try { Analytics.init(); } catch(e) { console.warn('[App] Analytics init failed:', e); }

    // Init UI modules (no data needed)
    _safeInit('Terminal');
    _safeInit('CommandPalette');
    _safeInit('Search');
    _safeInit('Preview');
    _safeInit('Mobile');

    _updateLoader(10, 'Connecting to GitHub API...');

    try {
      // 1. Fetch user
      _updateLoader(20, 'Fetching profile data...');
      const user = await API.getUser();
      if (!user || !user.login) throw new Error('Invalid user data from GitHub API');
      State.set('user', user);
      State.setLoading({ user: false });
      console.log('[DevOS] User loaded:', user.login);

      // Render hero
      const M = window.DevOS.Modules;
      if (M.Hero && typeof M.Hero.render === 'function') {
        M.Hero.render(user);
      }

      // 2. Fetch repos
      _updateLoader(45, 'Loading repositories...');
      const repos = await API.getRepos();
      State.set('repos', repos || []);
      State.setLoading({ repos: false });
      State.computeStats();
      console.log('[DevOS] Repos loaded:', (repos || []).length);

      // Update hero cards
      if (M.Hero && typeof M.Hero.updateCards === 'function') {
        M.Hero.updateCards();
      }

      // 3. Init repo-dependent modules
      _updateLoader(65, 'Building dashboard...');
      _safeInit('Dashboard');
      _safeInit('Projects');
      _safeInit('Explorer');
      _safeInit('Timeline');
      _safeInit('Achievements');
      _safeInit('Detector');

      // 4. Activity feed
      _updateLoader(80, 'Loading activity...');
      _safeInit('Activity');
      _safeInit('Contribution');

      // 5. Languages (background)
      _updateLoader(90, 'Analyzing languages...');
      API.getAggregateLanguages()
        .then(function (langs) {
          State.set('languages', langs || {});
          State.computeStats();
          _safeInit('Skills');
          _safeCall('Achievements', 'render');
        })
        .catch(function (e) {
          console.warn('[App] Language fetch failed, using fallback:', e);
          const repos = State.get('repos') || [];
          const fallbackLangs = {};
          repos.forEach(function (r) {
            if (r.language) {
              fallbackLangs[r.language] = (fallbackLangs[r.language] || 0) + 1000;
            }
          });
          State.set('languages', fallbackLangs);
          _safeInit('Skills');
        });

      _updateLoader(100, 'Ready!');
      setTimeout(_hideLoader, 400);

      // Trigger reveal animations
      setTimeout(function () {
        DOM.observeReveal('.reveal');
        DOM.observeReveal('.reveal-left');
        DOM.observeReveal('.reveal-right');
        DOM.observeReveal('.reveal-scale');
      }, 200);

      console.log('[DevOS] Boot complete');

    } catch (e) {
      console.error('[App] Boot error:', e);
      _updateLoader(100, 'Error');
      _showLoaderError(e.message);

      setTimeout(function () {
        _hideLoader();
        DOM.toast('Failed to load GitHub data: ' + e.message, 'error', 8000);
      }, 2000);
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
