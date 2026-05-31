/**
 * DEVOS — STATE.JS
 * Central application state store.
 */

window.DevOS = window.DevOS || {};

window.DevOS.State = (function () {

  const _state = {
    // Loading flags
    loading: {
      user:    true,
      repos:   true,
      langs:   true,
      events:  true,
      tree:    false,
    },

    // Data
    user:            null,
    repos:           [],
    allRepos:        [],
    languages:       {},
    events:          [],

    // UI
    currentSection:  'hero',
    searchQuery:     '',
    searchFilter:    'all',
    projectsFilter:  'all',
    projectsSort:    'stars',
    projectsPage:    1,
    explorerRepo:    null,
    terminalOpen:    false,
    cmdOpen:         false,
    searchOpen:      false,
    previewUrl:      null,

    // Derived
    totalStars:      0,
    totalForks:      0,
    maxStars:        0,
    langCount:       0,
    hasPages:        false,
    yearsOnGithub:   0,
  };

  const _listeners = {};

  /**
   * Get state value.
   * @param {string} [key] - if omitted, returns entire state
   * @returns {*}
   */
  function get(key) {
    if (!key) return { ..._state };
    return _state[key];
  }

  /**
   * Set state value and notify listeners.
   * @param {string} key
   * @param {*} value
   */
  function set(key, value) {
    const prev = _state[key];
    _state[key] = value;
    _notify(key, value, prev);
  }

  /**
   * Patch loading state.
   * @param {Object} patches
   */
  function setLoading(patches) {
    Object.assign(_state.loading, patches);
    _notify('loading', _state.loading, null);
  }

  /**
   * Compute derived stats from repos.
   */
  function computeStats() {
    const repos = _state.repos;
    _state.totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    _state.totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);
    _state.maxStars   = Math.max(0, ...repos.map(r => r.stargazers_count || 0));
    _state.hasPages   = repos.some(r => r.has_pages);

    if (_state.user && _state.user.created_at) {
      _state.yearsOnGithub = Math.floor(
        (Date.now() - new Date(_state.user.created_at)) / (365.25 * 24 * 3600 * 1000)
      );
    }

    const langs = _state.languages;
    _state.langCount = Object.keys(langs).filter(l => langs[l] > 0).length;

    _notify('stats', null, null);
  }

  /**
   * Subscribe to state changes.
   * @param {string} key
   * @param {Function} fn
   * @returns {Function} unsubscribe
   */
  function on(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
    return () => {
      _listeners[key] = _listeners[key].filter(l => l !== fn);
    };
  }

  function _notify(key, newVal, oldVal) {
    (_listeners[key] || []).forEach(fn => fn(newVal, oldVal));
    (_listeners['*'] || []).forEach(fn => fn(key, newVal, oldVal));
  }

  return { get, set, setLoading, computeStats, on };
})();
