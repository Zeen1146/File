/**
 * DEVOS — DOM.JS
 * DOM utility helpers.
 */

window.DevOS = window.DevOS || {};

window.DevOS.DOM = (function () {

  /**
   * Get element by ID (cached).
   */
  const _cache = {};
  function id(idStr) {
    if (_cache[idStr]) return _cache[idStr];
    const el = document.getElementById(idStr);
    if (el) _cache[idStr] = el;
    return el;
  }

  /**
   * Query selector shorthand.
   * @param {string} sel
   * @param {Element} [ctx=document]
   */
  function qs(sel, ctx = document) {
    return ctx.querySelector(sel);
  }

  /**
   * Query selector all shorthand.
   * @param {string} sel
   * @param {Element} [ctx=document]
   */
  function qsa(sel, ctx = document) {
    return Array.from(ctx.querySelectorAll(sel));
  }

  /**
   * Create element with optional attributes and children.
   * @param {string} tag
   * @param {Object} [attrs]
   * @param {...(string|Element)} children
   * @returns {Element}
   */
  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'class') {
        element.className = val;
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(element.style, val);
      } else if (key.startsWith('on') && typeof val === 'function') {
        element.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'dataset' && typeof val === 'object') {
        Object.assign(element.dataset, val);
      } else if (key === 'html') {
        element.innerHTML = val;
      } else {
        element.setAttribute(key, val);
      }
    }
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Element || child instanceof DocumentFragment) {
        element.appendChild(child);
      }
    });
    return element;
  }

  /**
   * Show element (remove hidden attribute).
   * @param {Element|string} elOrId
   */
  function show(elOrId) {
    const element = typeof elOrId === 'string' ? id(elOrId) : elOrId;
    if (element) element.hidden = false;
  }

  /**
   * Hide element (set hidden attribute).
   * @param {Element|string} elOrId
   */
  function hide(elOrId) {
    const element = typeof elOrId === 'string' ? id(elOrId) : elOrId;
    if (element) element.hidden = true;
  }

  /**
   * Remove element from DOM.
   */
  function remove(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  /**
   * Clear all children from element.
   * @param {Element} el
   */
  function clear(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /**
   * Show/hide skeleton loaders inside a container.
   * @param {string} selector - selects skeletons inside container
   * @param {Element|string} container
   * @param {boolean} show
   */
  function toggleSkeletons(container, showSkeletons) {
    const cont = typeof container === 'string' ? id(container) : container;
    if (!cont) return;
    qsa('.skeleton', cont).forEach(sk => {
      sk.style.display = showSkeletons ? '' : 'none';
    });
  }

  /**
   * Add class to element.
   */
  function addClass(el, cls) {
    if (el) el.classList.add(cls);
  }

  /**
   * Remove class from element.
   */
  function removeClass(el, cls) {
    if (el) el.classList.remove(cls);
  }

  /**
   * Toggle class on element.
   */
  function toggleClass(el, cls, force) {
    if (el) el.classList.toggle(cls, force);
  }

  /**
   * Show a toast notification.
   * @param {string} message
   * @param {'success'|'error'|'info'} [type='info']
   * @param {number} [duration=3000]
   */
  function toast(message, type = 'info', duration = 3000) {
    const container = id('toastContainer');
    if (!container) return;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const t = el('div', { class: `toast toast-${type}` },
      el('span', { class: 'toast-icon' }, icons[type] || 'ℹ'),
      el('span', {}, message)
    );
    container.appendChild(t);

    setTimeout(() => {
      t.classList.add('toast-out');
      setTimeout(() => remove(t), 300);
    }, duration);
  }

  /**
   * Observe elements for scroll-based reveal.
   * @param {string} selector
   * @param {string} [inViewClass='in-view']
   */
  function observeReveal(selector = '.reveal', inViewClass = 'in-view') {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(inViewClass);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    qsa(selector).forEach(el => observer.observe(el));
    return observer;
  }

  /**
   * Smooth scroll to section.
   * @param {string} sectionId
   */
  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 64;
    const top = section.getBoundingClientRect().top + window.scrollY - navH - 20;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  /**
   * Trap focus within an element (for modals).
   * @param {Element} container
   * @returns {Function} cleanup function
   */
  function trapFocus(container) {
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements  = Array.from(container.querySelectorAll(focusable));
    const first     = elements[0];
    const last      = elements[elements.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last && last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first && first.focus(); }
      }
    }

    container.addEventListener('keydown', handler);
    first && first.focus();

    return () => container.removeEventListener('keydown', handler);
  }

  return {
    id, qs, qsa, el, show, hide, remove, clear,
    toggleSkeletons, addClass, removeClass, toggleClass,
    toast, observeReveal, scrollToSection, trapFocus,
  };
})();
