/**
 * DEVOS — MODULES/HERO.JS
 * Renders the hero section from GitHub user data.
 */

window.DevOS = window.DevOS || {};
window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Hero = (function () {
  const { DOM, Format, State, CONFIG } = window.DevOS;

  let _typingIndex    = 0;
  let _charIndex      = 0;
  let _isDeleting     = false;
  let _typingTimer    = null;

  /**
   * Initialize hero section: fetch user and render.
   */
  async function init() {
    try {
      const user = State.get('user');
      if (user) {
        render(user);
      }
    } catch (e) {
      console.error('[Hero] Init error:', e);
    }
  }

  /**
   * Render hero with user data.
   * @param {Object} user - GitHub user object
   */
  function render(user) {
    _renderAvatar(user);
    _renderInfo(user);
    _renderStats(user);
    _renderCards();
    _startTyping();
  }

  function _renderAvatar(user) {
    const skeleton = DOM.id('avatarSkeleton');
    const avatar   = DOM.id('heroAvatar');
    if (!avatar) return;

    avatar.src = user.avatar_url + '&s=240';
    avatar.alt = `${user.name || user.login}'s avatar`;
    avatar.onload = () => {
      if (skeleton) skeleton.style.display = 'none';
      DOM.show(avatar);
    };
    avatar.onerror = () => {
      if (skeleton) skeleton.style.display = 'none';
      avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.login)}&background=7c6af5&color=fff&size=240`;
      DOM.show(avatar);
    };
  }

  function _renderInfo(user) {
    // Name
    const nameEl = DOM.id('heroName');
    if (nameEl) {
      nameEl.textContent = user.name || user.login;
      DOM.hide('nameSkeleton');
      DOM.show(nameEl);
    }

    // Username
    const usernameEl = DOM.id('heroUsernameText');
    const usernameWrap = DOM.id('heroUsername');
    if (usernameEl && usernameWrap) {
      usernameEl.textContent = `@${user.login}`;
      DOM.hide('usernameSkeleton');
      DOM.show(usernameWrap);
    }

    // Bio
    const bioEl = DOM.id('heroBio');
    if (bioEl) {
      bioEl.textContent = user.bio || 'Software developer — building things that matter.';
      DOM.hide('bioSkeleton');
      DOM.show(bioEl);
    }

    // GitHub link
    const githubBtn = DOM.id('heroGithubBtn');
    if (githubBtn) {
      githubBtn.href = user.html_url;
    }

    // Show CTA
    DOM.show('heroCta');

    // Typing wrap
    DOM.show('heroTypingWrap');

    // Update page title
    if (user.name) document.title = `${user.name} — DevOS`;
  }

  function _renderStats(user) {
    // Followers
    const followersEl = DOM.id('heroFollowers');
    const statsEl     = DOM.id('heroStats');
    const metaEl      = DOM.id('heroMeta');

    if (followersEl) {
      Format.animateCount(followersEl, user.followers || 0, 1000);
    }
    const followingEl = DOM.id('heroFollowing');
    if (followingEl) Format.animateCount(followingEl, user.following || 0, 1000);

    const reposEl = DOM.id('heroRepos');
    if (reposEl) Format.animateCount(reposEl, user.public_repos || 0, 1000);

    // Stat links
    const statFollowers = DOM.id('statFollowers');
    if (statFollowers) statFollowers.href = `${user.html_url}?tab=followers`;

    const statFollowing = DOM.id('statFollowing');
    if (statFollowing) statFollowing.href = `${user.html_url}?tab=following`;

    const statRepos = DOM.id('statRepos');
    if (statRepos) statRepos.href = `${user.html_url}?tab=repositories`;

    // Hide skeletons, show stats
    DOM.qsa('.skeleton-stat').forEach(sk => (sk.style.display = 'none'));
    if (statsEl) DOM.show(statsEl);
  }

  function _renderCards() {
    const repos = State.get('repos');
    if (!repos || repos.length === 0) return;

    // Total Stars
    const totalStars = State.get('totalStars');
    const starsEl    = DOM.id('totalStars');
    const starsSkel  = DOM.id('totalStarsSkel');
    if (starsEl) {
      if (starsSkel) starsSkel.style.display = 'none';
      DOM.show(starsEl);
      Format.animateCount(starsEl, totalStars, 1000);
    }

    // Total Forks
    const totalForks = State.get('totalForks');
    const forksEl    = DOM.id('totalForks');
    const forksSkel  = DOM.id('totalForksSkel');
    if (forksEl) {
      if (forksSkel) forksSkel.style.display = 'none';
      DOM.show(forksEl);
      Format.animateCount(forksEl, totalForks, 1000);
    }

    // Most Popular
    const popular     = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    const popularSkel = DOM.id('popularRepoSkel');
    const popularInfo = DOM.id('popularRepoInfo');
    if (popular && popularInfo) {
      if (popularSkel) popularSkel.style.display = 'none';
      DOM.show(popularInfo);
      const nameEl = DOM.id('popularRepoName');
      if (nameEl) { nameEl.textContent = popular.name; nameEl.href = popular.html_url; }
      const descEl = DOM.id('popularRepoDesc');
      if (descEl) descEl.textContent = Format.truncate(popular.description || 'No description', 80);
      const langDot = DOM.id('popularRepoLangDot');
      const langLabel = DOM.id('popularRepoLang');
      if (langDot && popular.language) { langDot.style.background = Format.langColor(popular.language); DOM.show(langDot); }
      if (langLabel) langLabel.textContent = popular.language || '';
      const starsEl = DOM.id('popularRepoStars');
      if (starsEl) starsEl.textContent = Format.number(popular.stargazers_count);
    }

    // Latest Repo
    const latest     = [...repos].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))[0];
    const latestSkel = DOM.id('latestRepoSkel');
    const latestInfo = DOM.id('latestRepoInfo');
    if (latest && latestInfo) {
      if (latestSkel) latestSkel.style.display = 'none';
      DOM.show(latestInfo);
      const nameEl = DOM.id('latestRepoName');
      if (nameEl) { nameEl.textContent = latest.name; nameEl.href = latest.html_url; }
      const descEl = DOM.id('latestRepoDesc');
      if (descEl) descEl.textContent = Format.truncate(latest.description || 'No description', 80);
      const langDot = DOM.id('latestRepoLangDot');
      const langLabel = DOM.id('latestRepoLang');
      if (langDot && latest.language) { langDot.style.background = Format.langColor(latest.language); DOM.show(langDot); }
      if (langLabel) langLabel.textContent = latest.language || '';
      const updateEl = DOM.id('latestRepoUpdate');
      if (updateEl) updateEl.textContent = 'Updated ' + Format.relativeTime(latest.pushed_at);
    }
  }

  /* ── Typing animation ── */
  function _startTyping() {
    const el    = DOM.id('typingText');
    if (!el) return;
    const texts = CONFIG.TYPING_STRINGS;
    if (!texts || texts.length === 0) return;

    function type() {
      const current = texts[_typingIndex];
      if (_isDeleting) {
        el.textContent = current.slice(0, --_charIndex);
      } else {
        el.textContent = current.slice(0, ++_charIndex);
      }

      let delay = _isDeleting ? 50 : 90;

      if (!_isDeleting && _charIndex === current.length) {
        delay = 2000;
        _isDeleting = true;
      } else if (_isDeleting && _charIndex === 0) {
        _isDeleting = false;
        _typingIndex = (_typingIndex + 1) % texts.length;
        delay = 400;
      }

      _typingTimer = setTimeout(type, delay);
    }

    clearTimeout(_typingTimer);
    type();
  }

  /**
   * Update hero cards when repos are loaded.
   */
  function updateCards() {
    _renderCards();
  }

  return { init, render, updateCards };
})();
