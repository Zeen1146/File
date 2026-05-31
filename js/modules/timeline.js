/**
 * DEVOS — MODULES/TIMELINE.JS
 * Auto-generates developer timeline from repository history.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Timeline = (function () {
  const { DOM, Format, State } = window.DevOS;

  function init() {
    const repos = State.get('repos');
    if (repos && repos.length > 0) render(repos);
  }

  function render(repos) {
    const container = DOM.id('timelineWrap');
    if (!container) return;
    DOM.clear(container);

    // Group repos by year of creation
    const byYear = {};
    repos.forEach(repo => {
      const y = Format.year(repo.created_at);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(repo);
    });

    // Sort years descending
    const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

    let itemDelay = 0;
    years.forEach(year => {
      const group = DOM.el('div', { class: 'timeline-year-group reveal' });
      group.innerHTML = `
        <div class="timeline-year-label">
          <span class="timeline-year-dot"></span>
          ${year}
        </div>
      `;

      // Sort repos by creation date within year
      const yearRepos = byYear[year]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5); // Max 5 per year

      yearRepos.forEach((repo, i) => {
        const delay = (itemDelay * 0.08).toFixed(2);
        const item  = _createItem(repo, delay);
        group.appendChild(item);
        itemDelay++;
      });

      container.appendChild(group);
    });

    DOM.observeReveal('.timeline-year-group.reveal');
    DOM.observeReveal('.timeline-item.reveal');
  }

  function _createItem(repo, delay) {
    const item = DOM.el('div', {
      class: `timeline-item reveal`,
      style: `--delay:${delay}s`,
    });

    const liveUrl = repo.has_pages
      ? `https://${repo.owner.login}.github.io/${repo.name}`
      : repo.homepage;

    item.innerHTML = `
      <div class="timeline-item-header">
        <a class="timeline-item-title" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
          📁 ${Format.escapeHtml(repo.name)}
        </a>
        <span class="timeline-item-date">${Format.date(repo.created_at, true)}</span>
      </div>
      <p class="timeline-item-desc">
        ${Format.escapeHtml(repo.description || 'A project created in this period.')}
      </p>
      <div class="timeline-item-meta">
        ${repo.language ? `
          <span class="timeline-meta-item">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${Format.langColor(repo.language)};flex-shrink:0;"></span>
            ${Format.escapeHtml(repo.language)}
          </span>` : ''}
        <span class="timeline-meta-item">
          <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg>
          ${repo.stargazers_count}
        </span>
        ${liveUrl ? `<span class="timeline-meta-item"><a href="${liveUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--color-teal)">🚀 Live</a></span>` : ''}
      </div>
    `;
    return item;
  }

  return { init, render };
})();
