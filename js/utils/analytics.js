/**
 * DEVOS — ANALYTICS.JS
 * Lightweight privacy-first analytics (no external service).
 * Tracks page load, section views, and interactions locally.
 */

window.DevOS = window.DevOS || {};

window.DevOS.Analytics = (function () {
  const SESSION_KEY = 'devos_session';
  const DATA_KEY    = 'devos_analytics';

  const session = {
    id:         Math.random().toString(36).slice(2),
    start:      Date.now(),
    events:     [],
    sections:   new Set(),
  };

  /**
   * Record an event.
   * @param {string} category
   * @param {string} action
   * @param {string} [label]
   */
  function track(category, action, label = '') {
    const event = {
      t:  Date.now(),
      c:  category,
      a:  action,
      l:  label,
    };
    session.events.push(event);
    _persist();
  }

  /**
   * Track which section is in view.
   * @param {string} sectionId
   */
  function trackSection(sectionId) {
    if (session.sections.has(sectionId)) return;
    session.sections.add(sectionId);
    track('section', 'view', sectionId);
  }

  /**
   * Track a project click.
   * @param {string} repoName
   * @param {string} action  - 'source' | 'demo' | 'preview'
   */
  function trackProject(repoName, action) {
    track('project', action, repoName);
  }

  /**
   * Track a command in terminal.
   * @param {string} command
   */
  function trackCommand(command) {
    track('terminal', 'command', command);
  }

  /**
   * Track a search query.
   * @param {string} query
   */
  function trackSearch(query) {
    if (query.length < 2) return;
    track('search', 'query', query.slice(0, 40));
  }

  /**
   * Get session summary.
   * @returns {Object}
   */
  function getSessionSummary() {
    return {
      duration:  Math.round((Date.now() - session.start) / 1000),
      events:    session.events.length,
      sections:  Array.from(session.sections),
      sessionId: session.id,
    };
  }

  /** Persist data locally (non-intrusive). */
  function _persist() {
    try {
      const existing = JSON.parse(localStorage.getItem(DATA_KEY) || '{"sessions":[]}');
      // Keep only last 10 sessions
      const sessions = existing.sessions.slice(-9);
      sessions.push({
        id:      session.id,
        start:   session.start,
        events:  session.events.slice(-50), // last 50 events
      });
      localStorage.setItem(DATA_KEY, JSON.stringify({ sessions }));
    } catch (e) {
      // Storage full or unavailable
    }
  }

  /**
   * Initialize: track page load.
   */
  function init() {
    track('page', 'load', window.location.pathname);

    // Track section visibility
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.id) {
          trackSection(entry.target.id);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('[data-section]').forEach(s => io.observe(s));

    // Track time on page before unload
    window.addEventListener('beforeunload', () => {
      track('page', 'exit', String(Math.round((Date.now() - session.start) / 1000)));
      _persist();
    });
  }

  return { init, track, trackSection, trackProject, trackCommand, trackSearch, getSessionSummary };
})();
