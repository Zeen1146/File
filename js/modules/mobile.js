/**
 * DEVOS — MODULES/MOBILE.JS
 * Mobile experience: bottom nav active state, swipe gestures, touch UX.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Mobile = (function () {
  const { DOM, State } = window.DevOS;

  let _touchStartX = 0;
  let _touchStartY = 0;
  let _touchStartTime = 0;

  function init() {
    _bindBottomNav();
    _bindScrollSpy();
    _bindSwipe();
    _bindViewportHeight();
  }

  /* ── Bottom nav active state ── */
  function _bindBottomNav() {
    const navItems = DOM.qsa('.mobile-nav-item[data-section]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  /* ── Section scroll spy ── */
  function _bindScrollSpy() {
    const sections = ['hero', 'dashboard', 'skills', 'projects', 'explorer', 'activity'];
    const navItems = DOM.qsa('.mobile-nav-item[data-section]');
    const topNavLinks = DOM.qsa('.nav-link[data-section]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;

          // Mobile nav
          navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === id);
          });

          // Top nav links
          topNavLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === id);
          });

          State.set('currentSection', id);
        });
      },
      { threshold: 0.3, rootMargin: '-64px 0px 0px 0px' }
    );

    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ── Swipe gestures ── */
  function _bindSwipe() {
    document.addEventListener('touchstart', (e) => {
      _touchStartX    = e.touches[0].clientX;
      _touchStartY    = e.touches[0].clientY;
      _touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx        = e.changedTouches[0].clientX - _touchStartX;
      const dy        = e.changedTouches[0].clientY - _touchStartY;
      const dt        = Date.now() - _touchStartTime;
      const speed     = Math.abs(dx) / dt;

      // Horizontal swipe: fast, mostly horizontal, significant distance
      if (Math.abs(dx) > Math.abs(dy) * 2 && speed > 0.5 && Math.abs(dx) > 60) {
        if (dx < 0) {
          _swipeLeft();
        } else {
          _swipeRight();
        }
      }
    }, { passive: true });
  }

  function _swipeLeft() {
    const sections = ['hero', 'dashboard', 'skills', 'projects', 'explorer', 'activity'];
    const current  = State.get('currentSection') || 'hero';
    const idx      = sections.indexOf(current);
    if (idx < sections.length - 1) {
      DOM.scrollToSection(sections[idx + 1]);
    }
  }

  function _swipeRight() {
    const sections = ['hero', 'dashboard', 'skills', 'projects', 'explorer', 'activity'];
    const current  = State.get('currentSection') || 'hero';
    const idx      = sections.indexOf(current);
    if (idx > 0) {
      DOM.scrollToSection(sections[idx - 1]);
    }
  }

  /* ── Fix 100vh on mobile browsers (address bar) ── */
  function _bindViewportHeight() {
    function setVh() {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    setVh();
    window.addEventListener('resize', setVh, { passive: true });
  }

  return { init };
})();
