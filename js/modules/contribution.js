/**
 * DEVOS — MODULES/CONTRIBUTION.JS
 * Renders a GitHub-style contribution heatmap.
 * Uses public events to estimate contribution activity since
 * the GraphQL contribution API requires authentication.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Contribution = (function () {
  const { DOM, Format, State, API } = window.DevOS;

  async function init() {
    try {
      const events = State.get('events') || await API.getEvents();
      render(events);
    } catch (e) {
      console.error('[Contribution] Error:', e);
    }
  }

  function render(events) {
    const grid = DOM.id('contribGrid');
    if (!grid) return;
    DOM.clear(grid);

    // Build date map from events (last 52 weeks)
    const dateMap = _buildDateMap(events);

    // Generate 52 weeks (364 days) ending today
    const today    = new Date();
    const startDay = new Date(today);
    startDay.setDate(startDay.getDate() - 51 * 7 - today.getDay());

    // Month labels
    _renderMonths(startDay);

    // Render weeks
    const weeks = [];
    let d = new Date(startDay);
    for (let w = 0; w < 52; w++) {
      const weekEl = DOM.el('div', { class: 'contrib-week' });
      for (let day = 0; day < 7; day++) {
        const dateStr = _dateKey(d);
        const count   = dateMap[dateStr] || 0;
        const level   = _countToLevel(count);
        const cell    = DOM.el('div', {
          class:             'contrib-cell',
          'data-level':      String(level),
          'data-tooltip':    `${count} contribution${count !== 1 ? 's' : ''} on ${Format.date(d, true)}`,
          'data-date':       dateStr,
          role:              'gridcell',
          'aria-label':      `${count} contributions on ${dateStr}`,
        });
        weekEl.appendChild(cell);
        d.setDate(d.getDate() + 1);
      }
      grid.appendChild(weekEl);
      weeks.push(weekEl);
    }

    // Animate cells in
    grid.querySelectorAll('.contrib-cell').forEach((cell, i) => {
      cell.style.opacity = '0';
      cell.style.transform = 'scale(0.5)';
      cell.style.transition = 'none';
      setTimeout(() => {
        cell.style.transition = `opacity 0.3s ease ${(i * 1.2)}ms, transform 0.3s ease ${(i * 1.2)}ms`;
        cell.style.opacity = '1';
        cell.style.transform = 'scale(1)';
      }, 10);
    });

    // Subtitle
    const total   = Object.values(dateMap).reduce((s, v) => s + v, 0);
    const subEl   = DOM.id('contribSubtitle');
    if (subEl) subEl.textContent = `${total} contributions in the last year`;
  }

  function _buildDateMap(events) {
    const map = {};
    if (!events || !events.length) return map;

    // Count events per day
    events.forEach(e => {
      if (!e.created_at) return;
      const key       = _dateKey(new Date(e.created_at));
      const weight    = _eventWeight(e.type);
      map[key]        = (map[key] || 0) + weight;
    });

    return map;
  }

  function _eventWeight(type) {
    const weights = {
      PushEvent:          3,
      CreateEvent:        2,
      PullRequestEvent:   2,
      IssuesEvent:        1,
      IssueCommentEvent:  1,
      CommitCommentEvent: 1,
      ForkEvent:          1,
      WatchEvent:         1,
    };
    return weights[type] || 1;
  }

  function _countToLevel(count) {
    if (count === 0) return 0;
    if (count <= 1)  return 1;
    if (count <= 3)  return 2;
    if (count <= 6)  return 3;
    return 4;
  }

  function _dateKey(d) {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function _renderMonths(startDay) {
    const container = DOM.id('contribMonths');
    if (!container) return;
    DOM.clear(container);

    const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let lastMonth = -1;
    let d         = new Date(startDay);

    for (let w = 0; w < 52; w++) {
      const m = d.getMonth();
      const labelEl = DOM.el('span', {
        class: 'contrib-month-label',
        style: `width: ${13 + 3}px; flex-shrink: 0; text-align: center;`,
      });

      if (m !== lastMonth) {
        labelEl.textContent = months[m];
        lastMonth = m;
      }

      container.appendChild(labelEl);
      d.setDate(d.getDate() + 7);
    }
  }

  return { init, render };
})();
