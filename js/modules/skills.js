/**
 * DEVOS — MODULES/SKILLS.JS
 * Analyzes repository languages and renders skill bars + radar chart.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Skills = (function () {
  const { DOM, Format, State, CONFIG, API } = window.DevOS;

  let _chart = null;

  async function init() {
    try {
      let langs = State.get('languages');
      if (!langs || Object.keys(langs).length === 0) {
        langs = await API.getAggregateLanguages();
        State.set('languages', langs);
        State.computeStats();
      }
      render(langs);
    } catch (e) {
      console.error('[Skills] Error:', e);
      const barsEl = DOM.id('skillsBars');
      if (barsEl) {
        DOM.clear(barsEl);
        barsEl.innerHTML = '<p style="color:var(--color-text-3);font-size:.85rem;padding:1rem">Unable to load language data.</p>';
      }
    }
  }

  function render(langs) {
    const barsEl = DOM.id('skillsBars');
    if (!barsEl) return;
    DOM.clear(barsEl);

    // Build skill list from config
    const tracked = CONFIG.SKILLS.map(skill => ({
      ...skill,
      bytes: langs[skill.key] || 0,
    })).filter(s => s.bytes > 0);

    // Add any untracked languages
    const trackedKeys = new Set(CONFIG.SKILLS.map(s => s.key));
    Object.entries(langs).forEach(([lang, bytes]) => {
      if (!trackedKeys.has(lang) && bytes > 0) {
        tracked.push({ name: lang, key: lang, color: Format.langColor(lang), bytes });
      }
    });

    // Sort by bytes descending
    tracked.sort((a, b) => b.bytes - a.bytes);

    // Compute total and percentages
    const total = tracked.reduce((s, sk) => s + sk.bytes, 0);
    const skills = tracked.map(sk => ({ ...sk, pct: total > 0 ? Math.round((sk.bytes / total) * 100) : 0 }));

    // Render top skills (show all with > 0 bytes, max 12)
    const shown = skills.slice(0, 12);

    shown.forEach((skill, i) => {
      const item = DOM.el('div', {
        class: `skill-item reveal`,
        style: { '--delay': `${i * 0.06}s`, '--fill-delay': `${i * 0.08}s` },
      });
      item.innerHTML = `
        <div class="skill-header">
          <div class="skill-name-wrap">
            <span class="skill-lang-dot" style="background:${skill.color}"></span>
            <span class="skill-name">${Format.escapeHtml(skill.name)}</span>
            <span class="skill-count">${_formatBytes(skill.bytes)}</span>
          </div>
          <span class="skill-pct">${skill.pct}%</span>
        </div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="--skill-color:${skill.color};--fill-width:${skill.pct}%"></div>
        </div>
      `;
      barsEl.appendChild(item);
    });

    // Trigger animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          const fill = entry.target.querySelector('.skill-bar-fill');
          if (fill) fill.classList.add('filled');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    DOM.qsa('.skill-item').forEach(el => observer.observe(el));

    // Draw radar chart (canvas-based)
    _drawRadar(shown.slice(0, 8));
  }

  function _formatBytes(bytes) {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
    if (bytes >= 1_000)     return `${(bytes / 1_000).toFixed(1)}KB`;
    return `${bytes}B`;
  }

  function _drawRadar(skills) {
    const canvas = DOM.id('skillsChart');
    if (!canvas || !skills.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W      = canvas.width;
    const H      = canvas.height;
    const cx     = W / 2;
    const cy     = H / 2;
    const radius = Math.min(cx, cy) * 0.75;
    const n      = skills.length;
    const maxPct = Math.max(...skills.map(s => s.pct));

    ctx.clearRect(0, 0, W, H);

    // Draw background web
    for (let level = 1; level <= 5; level++) {
      const r = (radius * level) / 5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw spokes
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw data polygon
    const points = skills.map((sk, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const r     = (sk.pct / (maxPct || 1)) * radius;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });

    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(124,106,245,0.4)');
    gradient.addColorStop(1, 'rgba(45,212,191,0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(124,106,245,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw data points
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = skills[i].color || '#7c6af5';
      ctx.fill();
      ctx.strokeStyle = '#0a0a0f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Draw labels
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    skills.forEach((sk, i) => {
      const angle   = (i / n) * Math.PI * 2 - Math.PI / 2;
      const labelR  = radius + 20;
      const lx      = cx + labelR * Math.cos(angle);
      const ly      = cy + labelR * Math.sin(angle);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(sk.name.slice(0, 4), lx, ly);
    });
  }

  return { init, render };
})();
