/**
 * DEVOS — MODULES/ACHIEVEMENTS.JS
 * Evaluates and renders achievement cards.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Achievements = (function () {
  const { DOM, Format, State, CONFIG } = window.DevOS;

  function init() {
    const repos = State.get('repos');
    if (repos && repos.length > 0) render();
  }

  function render() {
    const grid = DOM.id('achievementsGrid');
    if (!grid) return;
    DOM.clear(grid);

    const stats = _buildStats();
    let delay   = 0;

    CONFIG.ACHIEVEMENTS.forEach(achieve => {
      const unlocked = achieve.check(stats);
      const card     = _createCard(achieve, unlocked, delay * 0.05);
      grid.appendChild(card);
      if (unlocked) delay++;
    });

    DOM.observeReveal('.achievement-card.reveal');
  }

  function _buildStats() {
    const user  = State.get('user')  || {};
    const repos = State.get('repos') || [];
    const langs = State.get('languages') || {};

    return {
      repos:         repos.length,
      stars:         State.get('totalStars') || 0,
      forks:         State.get('totalForks') || 0,
      followers:     user.followers || 0,
      maxStars:      State.get('maxStars') || 0,
      hasPages:      State.get('hasPages') || false,
      langCount:     Object.keys(langs).filter(l => langs[l] > 0).length,
      yearsOnGithub: State.get('yearsOnGithub') || 0,
    };
  }

  function _createCard(achieve, unlocked, delay) {
    const card = DOM.el('div', {
      class: `achievement-card ${unlocked ? 'unlocked reveal' : 'locked'}`,
      style: `--delay:${delay}s;--achieve-color:${achieve.color || 'rgba(124,106,245,0.15)'};--achieve-glow:${achieve.glow || 'rgba(124,106,245,0.4)'}`,
    });

    card.innerHTML = `
      <div class="achievement-icon">${achieve.icon}</div>
      <div class="achievement-title">${Format.escapeHtml(achieve.title)}</div>
      <div class="achievement-desc">${Format.escapeHtml(achieve.desc)}</div>
      <div class="achievement-badge">
        <span class="badge">${unlocked ? '✓ Unlocked' : '🔒 Locked'}</span>
      </div>
    `;

    if (unlocked) {
      card.title = `Achievement unlocked: ${achieve.title}`;
    }

    return card;
  }

  return { init, render };
})();
