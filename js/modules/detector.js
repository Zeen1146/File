/**
 * DEVOS — MODULES/DETECTOR.JS
 * GitHub Pages auto-detector.
 * Checks repos for GitHub Pages and updates UI badges.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Detector = (function () {
  const { DOM, Format, State, API } = window.DevOS;

  /**
   * Detect GitHub Pages for all repos and tag them.
   * Uses heuristics (has_pages flag) + optional API call.
   */
  async function init() {
    const repos = State.get('repos');
    const user  = State.get('user');
    if (!repos || !user) return;

    const pagesRepos = repos.filter(r => r.has_pages);

    // Tag repos with pages info in state
    const pagesMap = {};
    pagesRepos.forEach(r => {
      pagesMap[r.name] = `https://${user.login}.github.io/${r.name}`;
    });

    // Special: user's github.io repo
    const userPageRepo = repos.find(r =>
      r.name.toLowerCase() === `${user.login.toLowerCase()}.github.io`
    );
    if (userPageRepo) {
      pagesMap[userPageRepo.name] = `https://${user.login}.github.io`;
    }

    State.set('pagesMap', pagesMap);

    // Update achievement
    if (pagesRepos.length > 0) {
      State.set('hasPages', true);
    }
  }

  /**
   * Get live demo URL for a repo.
   * @param {Object} repo
   * @returns {string|null}
   */
  function getLiveDemoUrl(repo) {
    const user    = State.get('user');
    const pagesMap = State.get('pagesMap') || {};

    if (pagesMap[repo.name]) return pagesMap[repo.name];

    if (repo.has_pages) {
      if (repo.name.toLowerCase() === `${user.login.toLowerCase()}.github.io`) {
        return `https://${user.login}.github.io`;
      }
      return `https://${user.login}.github.io/${repo.name}`;
    }

    // Check homepage field
    if (repo.homepage && (repo.homepage.startsWith('http://') || repo.homepage.startsWith('https://'))) {
      return repo.homepage;
    }

    return null;
  }

  /**
   * Check if a URL is accessible (returns true/false).
   * Uses HEAD request with timeout.
   * @param {string} url
   * @returns {Promise<boolean>}
   */
  async function checkUrl(url) {
    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(url, {
        method: 'HEAD',
        mode:   'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true; // no-cors always "succeeds" if reachable
    } catch (e) {
      return false;
    }
  }

  /**
   * Render pages badge for a repo card element.
   * @param {Element} cardEl
   * @param {Object} repo
   */
  function renderPagesBadge(cardEl, repo) {
    const url = getLiveDemoUrl(repo);
    const existing = cardEl.querySelector('.pages-badge');
    if (existing) existing.remove();

    const badge = DOM.el('span', {
      class: `pages-badge badge ${url ? 'badge-green' : 'badge-neutral'}`,
    }, url ? '🚀 Pages Active' : '⚠ No Pages');

    const header = cardEl.querySelector('.project-card-header');
    if (header) header.appendChild(badge);
  }

  return { init, getLiveDemoUrl, checkUrl, renderPagesBadge };
})();
