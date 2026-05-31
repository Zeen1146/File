/**
 * DEVOS — API.JS
 * GitHub API wrapper with caching, rate-limit handling, and error management.
 */

window.DevOS = window.DevOS || {};

window.DevOS.API = (function () {
  const { CONFIG } = window.DevOS;
  const { Cache }  = window.DevOS;

  const BASE    = CONFIG.GITHUB_API;
  const HEADERS = { 'Accept': 'application/vnd.github.v3+json' };

  let _rateLimitRemaining = 60;
  let _rateLimitReset     = 0;

  /**
   * Core fetch with error handling and cache.
   * @param {string} url
   * @param {string} cacheKey
   * @param {number} cacheTTL
   * @returns {Promise<any>}
   */
  async function _fetch(url, cacheKey, cacheTTL = 0) {
    // Return cached if valid
    if (cacheKey) {
      const cached = Cache.get(cacheKey);
      if (cached !== null) return cached;
    }

    // Check rate limit
    if (_rateLimitRemaining <= 1 && Date.now() < _rateLimitReset * 1000) {
      const wait = Math.ceil((_rateLimitReset * 1000 - Date.now()) / 1000);
      throw new Error(`GitHub API rate limit exceeded. Resets in ${wait}s.`);
    }

    const resp = await fetch(url, { headers: HEADERS });

    // Update rate limit info from headers
    const remaining = resp.headers.get('X-RateLimit-Remaining');
    const reset     = resp.headers.get('X-RateLimit-Reset');
    if (remaining) _rateLimitRemaining = parseInt(remaining, 10);
    if (reset)     _rateLimitReset     = parseInt(reset, 10);

    if (resp.status === 403 && _rateLimitRemaining === 0) {
      throw new Error('GitHub API rate limit exceeded. Try again later.');
    }
    if (resp.status === 404) {
      throw new Error(`Not found: ${url}`);
    }
    if (!resp.ok) {
      throw new Error(`GitHub API error ${resp.status}: ${resp.statusText}`);
    }

    const data = await resp.json();
    if (cacheKey && cacheTTL > 0) Cache.set(cacheKey, data, cacheTTL);
    return data;
  }

  /**
   * Fetch GitHub user profile.
   * @param {string} [username]
   * @returns {Promise<Object>}
   */
  async function getUser(username) {
    const u    = username || CONFIG.GITHUB_USERNAME;
    const key  = `user_${u}`;
    const url  = `${BASE}/users/${u}`;
    return _fetch(url, key, CONFIG.CACHE_USER);
  }

  /**
   * Fetch all public repos (paginated up to REPOS_PER_PAGE).
   * @param {string} [username]
   * @returns {Promise<Array>}
   */
  async function getRepos(username) {
    const u    = username || CONFIG.GITHUB_USERNAME;
    const key  = `repos_${u}`;
    const cached = Cache.get(key);
    if (cached) return cached;

    const url = `${BASE}/users/${u}/repos?per_page=${CONFIG.REPOS_PER_PAGE}&sort=updated&type=public`;
    const data = await _fetch(url, null);

    // Filter out forks if desired, sort by stars
    const repos = data.filter(r => !r.fork || r.stargazers_count > 0);
    Cache.set(key, repos, CONFIG.CACHE_REPOS);
    return repos;
  }

  /**
   * Fetch all repos including forked (for skill analysis).
   */
  async function getAllRepos(username) {
    const u   = username || CONFIG.GITHUB_USERNAME;
    const key = `allrepos_${u}`;
    const cached = Cache.get(key);
    if (cached) return cached;

    const url  = `${BASE}/users/${u}/repos?per_page=${CONFIG.REPOS_PER_PAGE}&sort=pushed&type=public`;
    const data = await _fetch(url, null);
    Cache.set(key, data, CONFIG.CACHE_REPOS);
    return data;
  }

  /**
   * Fetch language breakdown for a single repo.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<Object>}
   */
  async function getRepoLanguages(owner, repo) {
    const key = `langs_${owner}_${repo}`;
    const url = `${BASE}/repos/${owner}/${repo}/languages`;
    return _fetch(url, key, CONFIG.CACHE_LANGS);
  }

  /**
   * Fetch languages for all repos and aggregate.
   * @param {string} [username]
   * @returns {Promise<Object>} { Language: totalBytes }
   */
  async function getAggregateLanguages(username) {
    const u   = username || CONFIG.GITHUB_USERNAME;
    const key = `agg_langs_${u}`;
    const cached = Cache.get(key);
    if (cached) return cached;

    const repos = await getAllRepos(u);
    const aggregate = {};

    // Fetch languages in parallel batches of 5
    const BATCH = 5;
    for (let i = 0; i < repos.length; i += BATCH) {
      const batch = repos.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(r => getRepoLanguages(u, r.name))
      );
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          for (const [lang, bytes] of Object.entries(result.value)) {
            aggregate[lang] = (aggregate[lang] || 0) + bytes;
          }
        }
      });
    }

    Cache.set(key, aggregate, CONFIG.CACHE_LANGS);
    return aggregate;
  }

  /**
   * Fetch public events (activity feed).
   * @param {string} [username]
   * @returns {Promise<Array>}
   */
  async function getEvents(username) {
    const u   = username || CONFIG.GITHUB_USERNAME;
    const key = `events_${u}`;
    const url = `${BASE}/users/${u}/events/public?per_page=30`;
    return _fetch(url, key, CONFIG.CACHE_EVENTS);
  }

  /**
   * Fetch file tree for a repository.
   * @param {string} owner
   * @param {string} repo
   * @param {string} [branch='HEAD']
   * @returns {Promise<Object>} git tree
   */
  async function getRepoTree(owner, repo, branch = 'HEAD') {
    const key = `tree_${owner}_${repo}_${branch}`;
    const url = `${BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
    return _fetch(url, key, CONFIG.CACHE_TREE);
  }

  /**
   * Fetch raw file content from GitHub.
   * @param {string} owner
   * @param {string} repo
   * @param {string} branch
   * @param {string} path
   * @returns {Promise<string>}
   */
  async function getRawFile(owner, repo, branch, path) {
    const url = `${CONFIG.GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`File not found: ${path}`);
    return resp.text();
  }

  /**
   * Detect GitHub Pages for a repo.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<Object|null>}
   */
  async function getPages(owner, repo) {
    const key = `pages_${owner}_${repo}`;
    const url = `${BASE}/repos/${owner}/${repo}/pages`;
    try {
      const data = await _fetch(url, key, CONFIG.CACHE_TREE);
      return data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get current rate limit status.
   * @returns {Promise<Object>}
   */
  async function getRateLimit() {
    return _fetch(`${BASE}/rate_limit`, null);
  }

  /**
   * Fetch repo default branch.
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<string>}
   */
  async function getDefaultBranch(owner, repo) {
    const key = `branch_${owner}_${repo}`;
    const url = `${BASE}/repos/${owner}/${repo}`;
    const data = await _fetch(url, key, CONFIG.CACHE_TREE);
    return data.default_branch || 'main';
  }

  return {
    getUser,
    getRepos,
    getAllRepos,
    getRepoLanguages,
    getAggregateLanguages,
    getEvents,
    getRepoTree,
    getRawFile,
    getPages,
    getRateLimit,
    getDefaultBranch,
  };
})();
