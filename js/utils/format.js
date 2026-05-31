/**
 * DEVOS — FORMAT.JS
 * Number, date, string, and language formatting helpers.
 */

window.DevOS = window.DevOS || {};

window.DevOS.Format = (function () {

  /**
   * Format large numbers: 1200 → "1.2k", 1500000 → "1.5M"
   * @param {number} n
   * @returns {string}
   */
  function number(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  /**
   * Animate a number counter from 0 to target.
   * @param {HTMLElement} el
   * @param {number} target
   * @param {number} [duration=1200]
   */
  function animateCount(el, target, duration = 1200) {
    if (!el) return;
    const start    = performance.now();
    const startVal = 0;
    const isFormatted = target >= 1000;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * ease);
      el.textContent = isFormatted ? number(current) : current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = isFormatted ? number(target) : target.toLocaleString();
    }
    requestAnimationFrame(tick);
  }

  /**
   * Relative time: "2 hours ago", "3 days ago", etc.
   * @param {string|Date} dateInput
   * @returns {string}
   */
  function relativeTime(dateInput) {
    const date = new Date(dateInput);
    const now  = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60)         return 'just now';
    if (diff < 3600)       return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800)     return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 2592000)    return `${Math.floor(diff / 604800)}w ago`;
    if (diff < 31536000)   return `${Math.floor(diff / 2592000)}mo ago`;
    return `${Math.floor(diff / 31536000)}y ago`;
  }

  /**
   * Format date as "Jan 2024" or "Jan 15, 2024"
   * @param {string|Date} dateInput
   * @param {boolean} [includeDay=false]
   * @returns {string}
   */
  function date(dateInput, includeDay = false) {
    const d = new Date(dateInput);
    const opts = includeDay
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'short', year: 'numeric' };
    return d.toLocaleDateString('en-US', opts);
  }

  /**
   * Get year from date string.
   * @param {string|Date} dateInput
   * @returns {number}
   */
  function year(dateInput) {
    return new Date(dateInput).getFullYear();
  }

  /**
   * Truncate text with ellipsis.
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  function truncate(str, maxLen = 80) {
    if (!str) return '';
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen).trimEnd() + '…';
  }

  /**
   * Escape HTML special characters.
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Return CSS color variable name for a language.
   * @param {string} lang
   * @returns {string} hex color string
   */
  const LANG_COLORS = {
    'HTML':       '#e34c26',
    'CSS':        '#264de4',
    'JavaScript': '#f7df1e',
    'TypeScript': '#3178c6',
    'Python':     '#3572a5',
    'PHP':        '#777bb4',
    'Java':       '#b07219',
    'Kotlin':     '#a97bff',
    'C++':        '#f34b7d',
    'Go':         '#00add8',
    'Rust':       '#dea584',
    'Ruby':       '#701516',
    'Swift':      '#f05138',
    'Dart':       '#00b4ab',
    'Shell':      '#89e051',
    'Vue':        '#41b883',
    'Svelte':     '#ff3e00',
    'Markdown':   '#79c0ff',
    'JSON':       '#fbbf24',
  };

  function langColor(lang) {
    return LANG_COLORS[lang] || '#8b8b8b';
  }

  /**
   * Get file icon class based on extension.
   * @param {string} filename
   * @returns {string}
   */
  function fileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const map = {
      html: 'icon-html', htm: 'icon-html',
      css: 'icon-css', scss: 'icon-css', sass: 'icon-css',
      js: 'icon-js', jsx: 'icon-js', mjs: 'icon-js',
      ts: 'icon-ts', tsx: 'icon-ts',
      py: 'icon-py',
      md: 'icon-md', mdx: 'icon-md',
      json: 'icon-json',
      png: 'icon-img', jpg: 'icon-img', jpeg: 'icon-img',
      gif: 'icon-img', svg: 'icon-img', webp: 'icon-img',
    };
    return map[ext] || '';
  }

  /**
   * Highlight search match within text.
   * @param {string} text
   * @param {string} query
   * @returns {string} HTML with <mark> tags
   */
  function highlight(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped.replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark>$1</mark>');
  }

  /**
   * Calculate years between date and now.
   * @param {string|Date} dateInput
   * @returns {number}
   */
  function yearsAgo(dateInput) {
    const d = new Date(dateInput);
    const now = new Date();
    return now.getFullYear() - d.getFullYear();
  }

  return {
    number,
    animateCount,
    relativeTime,
    date,
    year,
    truncate,
    escapeHtml,
    langColor,
    fileIconClass,
    highlight,
    yearsAgo,
  };
})();
