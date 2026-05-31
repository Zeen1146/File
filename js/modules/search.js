/**
 * DEVOS — MODULES/SEARCH.JS
 * Real-time search across repositories, topics, and files.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Search = (function () {
  const { DOM, Format, State } = window.DevOS;

  let _debounceTimer = null;
  let _resultsOverlay = null;

  function init() {
    _bindEvents();
  }

  function _bindEvents() {
    const searchBtn   = DOM.id('searchBtn');
    const searchClose = DOM.id('searchClose');
    const input       = DOM.id('searchInput');
    const filters     = DOM.id('searchFilters');

    if (searchBtn)   searchBtn.addEventListener('click', open);
    if (searchClose) searchClose.addEventListener('click', close);

    if (input) {
      input.addEventListener('input', () => {
        clearTimeout(_debounceTimer);
        _debounceTimer = setTimeout(() => {
          _search(input.value.trim());
          window.DevOS.Analytics && window.DevOS.Analytics.trackSearch(input.value);
        }, 220);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') close();
      });
    }

    // Filter chips
    if (filters) {
      filters.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        DOM.qsa('.filter-chip', filters).forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        State.set('searchFilter', chip.dataset.filter || 'all');
        const currentQuery = (input ? input.value.trim() : '');
        _search(currentQuery);
      });
    }

    // Keyboard shortcut Ctrl+F
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        // Only intercept if not already in a form input
        if (document.activeElement.tagName !== 'INPUT' &&
            document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          open();
        }
      }
    });
  }

  function open() {
    const wrapper = DOM.id('searchBarWrapper');
    const input   = DOM.id('searchInput');
    if (!wrapper) return;
    DOM.show(wrapper);
    State.set('searchOpen', true);
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 80);
    }
    _search('');
  }

  function close() {
    const wrapper = DOM.id('searchBarWrapper');
    if (!wrapper) return;
    DOM.hide(wrapper);
    State.set('searchOpen', false);
    _removeResultsOverlay();
    // Reset project filter
    window.DevOS.Modules.Projects.filterBySearch('');
  }

  function _search(query) {
    const filter = State.get('searchFilter') || 'all';

    // Apply to projects grid
    if (filter === 'all' || ['html','css','javascript','python','php','markdown'].includes(filter)) {
      window.DevOS.Modules.Projects.filterBySearch(query);
    }

    if (!query) {
      _removeResultsOverlay();
      return;
    }

    // Build results overlay
    const repos    = State.get('repos');
    const q        = query.toLowerCase();
    const langMap  = {
      html: 'HTML', css: 'CSS', javascript: 'JavaScript',
      python: 'Python', php: 'PHP', markdown: 'Markdown',
    };
    const filterLang = filter !== 'all' ? langMap[filter] : null;

    let matched = repos.filter(r => {
      const nameMatch  = r.name.toLowerCase().includes(q);
      const descMatch  = r.description && r.description.toLowerCase().includes(q);
      const langMatch  = r.language && r.language.toLowerCase().includes(q);
      const topicMatch = r.topics && r.topics.some(t => t.toLowerCase().includes(q));
      const matchesFilter = !filterLang || r.language === filterLang;
      return (nameMatch || descMatch || langMatch || topicMatch) && matchesFilter;
    }).slice(0, 8);

    _showResultsOverlay(matched, query);
  }

  function _showResultsOverlay(repos, query) {
    _removeResultsOverlay();
    if (!repos.length) return;

    const overlay = DOM.el('div', { class: 'search-results-overlay', id: 'searchResultsOverlay' });
    const section = DOM.el('div', { class: 'search-result-section' });

    const label = DOM.el('div', { class: 'search-result-section-label' }, `${repos.length} Repositories`);
    section.appendChild(label);

    repos.forEach(repo => {
      const item = DOM.el('div', { class: 'search-result-item' });
      item.innerHTML = `
        <div class="search-result-item-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div>
          <div class="search-result-title">${Format.highlight(repo.name, query)}</div>
          <div class="search-result-sub">${Format.escapeHtml(repo.language || '')} · ⭐${repo.stargazers_count}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        window.open(repo.html_url, '_blank', 'noopener,noreferrer');
        close();
      });
      section.appendChild(item);
    });

    overlay.appendChild(section);

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', _outsideClick);
    }, 0);

    document.body.appendChild(overlay);
    _resultsOverlay = overlay;
  }

  function _removeResultsOverlay() {
    if (_resultsOverlay) {
      _resultsOverlay.remove();
      _resultsOverlay = null;
      document.removeEventListener('click', _outsideClick);
    }
  }

  function _outsideClick(e) {
    if (_resultsOverlay && !_resultsOverlay.contains(e.target)) {
      _removeResultsOverlay();
    }
  }

  return { init, open, close };
})();
