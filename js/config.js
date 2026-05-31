/**
 * DEVOS — CONFIG.JS
 * Global configuration. Edit GITHUB_USERNAME to deploy.
 */

window.DevOS = window.DevOS || {};

window.DevOS.CONFIG = {
  /* ── YOUR GITHUB USERNAME ── */
  GITHUB_USERNAME: 'Zeen1146', // ← CHANGE THIS

  /* ── GitHub API ── */
  GITHUB_API:       'https://api.github.com',
  GITHUB_BASE:      'https://github.com',
  GITHUB_RAW:       'https://raw.githubusercontent.com',
  GITHUB_PAGES_BASE:'https://{username}.github.io',

  /* ── Site ── */
  SITE_TITLE:       'DevOS — GitHub Portfolio',
  SITE_URL:         'https://zeen1146.github.io/File/',
  SITE_THEME_COLOR: '#0a0a0f',

  /* ── Cache (milliseconds) ── */
  CACHE_USER:         10 * 60 * 1000,   // 10 min
  CACHE_REPOS:         5 * 60 * 1000,   // 5 min
  CACHE_EVENTS:        3 * 60 * 1000,   // 3 min
  CACHE_TREE:         30 * 60 * 1000,   // 30 min
  CACHE_LANGS:        60 * 60 * 1000,   // 1 hr

  /* ── Repo settings ── */
  REPOS_PER_PAGE:    100,
  REPOS_SHOWN_INIT:   12,
  REPOS_LOAD_MORE:     9,

  /* ── Typing animation strings ── */
  TYPING_STRINGS: [
    'Full Stack Developer',
    'Open Source Contributor',
    'Building great software',
    'Coffee → Code → Commit',
    'git push origin main',
  ],

  /* ── Skills to track ── */
  SKILLS: [
    { name: 'HTML',       key: 'HTML',       color: '#e34c26' },
    { name: 'CSS',        key: 'CSS',        color: '#264de4' },
    { name: 'JavaScript', key: 'JavaScript', color: '#f7df1e' },
    { name: 'TypeScript', key: 'TypeScript', color: '#3178c6' },
    { name: 'Python',     key: 'Python',     color: '#3572a5' },
    { name: 'PHP',        key: 'PHP',        color: '#777bb4' },
    { name: 'Java',       key: 'Java',       color: '#b07219' },
    { name: 'Kotlin',     key: 'Kotlin',     color: '#a97bff' },
    { name: 'C++',        key: 'C++',        color: '#f34b7d' },
    { name: 'Go',         key: 'Go',         color: '#00add8' },
    { name: 'Rust',       key: 'Rust',       color: '#dea584' },
  ],

  /* ── Achievement definitions ── */
  ACHIEVEMENTS: [
    {
      id:    'first_repo',
      icon:  '🎯',
      title: 'First Repository',
      desc:  'Created your very first repository',
      check: (stats) => stats.repos >= 1,
      color: '#fbbf24',
      glow:  'rgba(251,191,36,0.4)',
    },
    {
      id:    'ten_repos',
      icon:  '📦',
      title: '10 Repositories',
      desc:  'Reached 10 public repositories',
      check: (stats) => stats.repos >= 10,
      color: '#a78bfa',
      glow:  'rgba(167,139,250,0.4)',
    },
    {
      id:    'fifty_repos',
      icon:  '🗄️',
      title: '50 Repositories',
      desc:  'Built an extensive portfolio',
      check: (stats) => stats.repos >= 50,
      color: '#7c6af5',
      glow:  'rgba(124,106,245,0.4)',
    },
    {
      id:    'first_star',
      icon:  '⭐',
      title: 'First Star',
      desc:  'Someone starred your project',
      check: (stats) => stats.stars >= 1,
      color: '#fbbf24',
      glow:  'rgba(251,191,36,0.4)',
    },
    {
      id:    'hundred_stars',
      icon:  '🌟',
      title: '100 Stars',
      desc:  'Earned 100 stars across repositories',
      check: (stats) => stats.stars >= 100,
      color: '#fbbf24',
      glow:  'rgba(251,191,36,0.5)',
    },
    {
      id:    'thousand_stars',
      icon:  '🏆',
      title: '1K Stars',
      desc:  'Legendary status: 1000+ stars',
      check: (stats) => stats.stars >= 1000,
      color: '#f472b6',
      glow:  'rgba(244,114,182,0.5)',
    },
    {
      id:    'popular',
      icon:  '🔥',
      title: 'Going Viral',
      desc:  'A repo with 50+ stars',
      check: (stats) => stats.maxStars >= 50,
      color: '#f87171',
      glow:  'rgba(248,113,113,0.4)',
    },
    {
      id:    'follower_100',
      icon:  '👥',
      title: '100 Followers',
      desc:  'A growing community follows you',
      check: (stats) => stats.followers >= 100,
      color: '#2dd4bf',
      glow:  'rgba(45,212,191,0.4)',
    },
    {
      id:    'forked',
      icon:  '🍴',
      title: 'Fork Magnet',
      desc:  'Your repos have been forked 10+ times',
      check: (stats) => stats.forks >= 10,
      color: '#34d399',
      glow:  'rgba(52,211,153,0.4)',
    },
    {
      id:    'polyglot',
      icon:  '🌐',
      title: 'Polyglot',
      desc:  'Used 5 or more languages',
      check: (stats) => stats.langCount >= 5,
      color: '#60a5fa',
      glow:  'rgba(96,165,250,0.4)',
    },
    {
      id:    'pages',
      icon:  '🚀',
      title: 'Deployed',
      desc:  'Has at least one GitHub Pages site',
      check: (stats) => stats.hasPages,
      color: '#a78bfa',
      glow:  'rgba(167,139,250,0.4)',
    },
    {
      id:    'senior',
      icon:  '💎',
      title: 'Senior Dev',
      desc:  'Over 3 years on GitHub',
      check: (stats) => stats.yearsOnGithub >= 3,
      color: '#fbbf24',
      glow:  'rgba(251,191,36,0.5)',
    },
  ],

  /* ── Terminal commands ── */
  TERMINAL_COMMANDS: ['help', 'about', 'projects', 'github', 'stats', 'skills', 'clear', 'whoami', 'repos', 'stars'],
};
