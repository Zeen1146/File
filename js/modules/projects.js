/**
 * DEVOS — MODULES/PROJECTS.JS
 * Renders repository cards with filtering, sorting, and pagination.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Projects = (function () {
  const { DOM, Format, State, CONFIG } = window.DevOS;

  let _allRepos    = [];
  let _filtered    = [];
  let _shown       = CONFIG.REPOS_SHOWN_INIT;
  let _sortKey     = 'stars';
  let _filterLang  = 'all';

  function init() {
    const repos = State.get('repos');
    if (repos && repos.length > 0) {
      _allRepos = repos;
      _buildFilters();
      _applyAndRender();
    }
    _bindEvents();
  }

  function _bindEvents() {
    // Sort
    const sortSel = DOM.id('sortSelect');
    if (sortSel) {
      sortSel.addEventListener('change', (e) => {
        _sortKey = e.target.value;
        _shown   = CONFIG.REPOS_SHOWN_INIT;
        _applyAndRender();
      });
    }

    // Load more
    const loadMoreBtn = DOM.id('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        _shown += CONFIG.REPOS_LOAD_MORE;
        _renderCards();
      });
    }
  }

  function _buildFilters() {
    const container = DOM.id('projectsFilters');
    if (!container) return;
    DOM.clear(container);

    // Get unique languages
    const langCounts = {};
    _allRepos.forEach(r => {
      if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
    });

    const langs = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([lang]) => lang);

    const allBtn = DOM.el('button', { class: 'filter-chip active', 'data-lang': 'all' }, 'All');
    allBtn.addEventListener('click', () => _setFilter('all', allBtn));
    container.appendChild(allBtn);

    langs.forEach(lang => {
      const btn = DOM.el('button', { class: 'filter-chip', 'data-lang': lang });
      const dot = DOM.el('span', { class: 'lang-dot', 'data-lang': lang, style: `background:${Format.langColor(lang)}` });
      btn.appendChild(dot);
      btn.appendChild(document.createTextNode(lang));
      btn.addEventListener('click', () => _setFilter(lang, btn));
      container.appendChild(btn);
    });
  }

  function _setFilter(lang, btn) {
    _filterLang = lang;
    _shown      = CONFIG.REPOS_SHOWN_INIT;
    DOM.qsa('.filter-chip', DOM.id('projectsFilters')).forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    _applyAndRender();
  }

  function _applyAndRender() {
    // Filter
    _filtered = _filterLang === 'all'
      ? [..._allRepos]
      : _allRepos.filter(r => r.language === _filterLang);

    // Sort
    _filtered.sort((a, b) => {
      if (_sortKey === 'stars')   return b.stargazers_count - a.stargazers_count;
      if (_sortKey === 'forks')   return b.forks_count - a.forks_count;
      if (_sortKey === 'updated') return new Date(b.pushed_at) - new Date(a.pushed_at);
      if (_sortKey === 'name')    return a.name.localeCompare(b.name);
      return 0;
    });

    // Subtitle
    const sub = DOM.id('projectsSubtitle');
    if (sub) sub.textContent = `${_filtered.length} ${_filterLang !== 'all' ? _filterLang + ' ' : ''}repositories`;

    _renderCards();
  }

  function _renderCards() {
    const grid = DOM.id('projectsGrid');
    if (!grid) return;
    DOM.clear(grid);

    const visible = _filtered.slice(0, _shown);

    if (visible.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <p>No repositories found</p>
        </div>
      `;
      DOM.hide('projectsLoadMore');
      return;
    }

    visible.forEach((repo, i) => {
      const card = _createCard(repo, i);
      grid.appendChild(card);
    });

    // Load more button
    const loadMore = DOM.id('projectsLoadMore');
    if (loadMore) {
      if (_shown < _filtered.length) DOM.show(loadMore);
      else DOM.hide(loadMore);
    }

    DOM.observeReveal('.project-card.reveal');
  }

  function _createCard(repo, index) {
    const delay = (index % CONFIG.REPOS_SHOWN_INIT) * 0.04;
    const card  = DOM.el('div', {
      class: `project-card reveal`,
      style: `transition-delay:${delay}s`,
    });

    // Language color
    const langColor = repo.language ? Format.langColor(repo.language) : '#8b8b8b';

    // Topics HTML
    const topicsHtml = (repo.topics || []).slice(0, 4)
      .map(t => `<span class="topic-tag">${Format.escapeHtml(t)}</span>`)
      .join('');

    // GitHub Pages detection
    const hasPages = repo.has_pages;
    const pagesUrl = hasPages
      ? `https://${repo.owner.login}.github.io/${repo.name}`
      : null;

    // HTML file badge (heuristic)
    const isHtmlRepo = repo.language === 'HTML';

    // Actions
    let actionsHtml = `
      <a class="btn btn-ghost btn-xs" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
        Source
      </a>
    `;

    if (hasPages && pagesUrl) {
      actionsHtml += `
        <a class="btn btn-teal btn-xs" href="${pagesUrl}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 8 16 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
          🚀 Live Demo
        </a>
        <button class="btn btn-secondary btn-xs preview-btn" data-url="${Format.escapeHtml(pagesUrl)}" data-repo="${Format.escapeHtml(repo.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          Preview
        </button>
      `;
    } else if (isHtmlRepo) {
      actionsHtml += `
        <button class="btn btn-secondary btn-xs preview-btn" data-url="https://${repo.owner.login}.github.io/${repo.name}" data-repo="${Format.escapeHtml(repo.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          Preview
        </button>
      `;
    }

    card.innerHTML = `
      <div class="project-card-header">
        <a class="project-card-title" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          ${Format.escapeHtml(repo.name)}
        </a>
        <div class="project-card-badges">
          ${hasPages ? '<span class="badge badge-live">● Live</span>' : ''}
          ${repo.stargazers_count >= 50 ? '<span class="badge badge-amber">⭐ Popular</span>' : ''}
        </div>
      </div>
      <p class="project-card-desc">${Format.escapeHtml(repo.description || 'No description provided.')}</p>
      ${topicsHtml ? `<div class="project-card-topics">${topicsHtml}</div>` : ''}
      <div class="project-card-meta">
        ${repo.language ? `
          <span class="project-meta-item">
            <span class="project-lang-dot" style="background:${langColor}"></span>
            <span class="project-lang-name">${Format.escapeHtml(repo.language)}</span>
          </span>` : ''}
        <span class="project-meta-item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${Format.number(repo.stargazers_count)}
        </span>
        <span class="project-meta-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="12" x2="12" y2="15"/></svg>
          ${Format.number(repo.forks_count)}
        </span>
        <span class="project-meta-item" title="${Format.date(repo.pushed_at, true)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${Format.relativeTime(repo.pushed_at)}
        </span>
      </div>
      <div class="project-card-actions">${actionsHtml}</div>
    `;

    // Mouse glow effect on card
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y      = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });

    // Preview buttons
    card.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.dataset.url;
        if (url) window.DevOS.Modules.Preview.open(url);
      });
    });

    return card;
  }

  /**
   * Filter by search query.
   * @param {string} query
   */
  function filterBySearch(query) {
    const repos = State.get('repos');
    if (!query) {
      _allRepos = repos;
      _applyAndRender();
      return;
    }
    const q = query.toLowerCase();
    _allRepos = repos.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.language && r.language.toLowerCase().includes(q)) ||
      (r.topics && r.topics.some(t => t.toLowerCase().includes(q)))
    );
    _applyAndRender();
  }

  return { init, filterBySearch };
})();
