/**
 * DEVOS — MODULES/TERMINAL.JS
 * Interactive terminal with GitHub data commands.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Terminal = (function () {
  const { DOM, Format, State, CONFIG } = window.DevOS;

  let _history = [];
  let _histIdx = -1;
  let _cleanup = null;
  let _isOpen  = false;

  const MOTD = [
    '<span class="term-header">╔══════════════════════════════════════╗</span>',
    '<span class="term-header">║   DevOS Terminal v1.0.0              ║</span>',
    '<span class="term-header">║   Powered by GitHub API              ║</span>',
    '<span class="term-header">╚══════════════════════════════════════╝</span>',
    '',
    '<span class="term-muted">Type <span class="term-accent">help</span> to see available commands.</span>',
  ].join('\n');

  function init() {
    _bindButtons();
    _bindKeyboard();
  }

  function _bindButtons() {
    ['terminalBtn', 'heroTerminalBtn', 'footerTerminal', 'mobileTermBtn'].forEach(function (id) {
      var btn = DOM.id(id);
      if (btn) btn.addEventListener('click', open);
    });

    var closeBtn = DOM.id('termClose');
    if (closeBtn) closeBtn.addEventListener('click', close);

    var clearBtn = DOM.id('termClear');
    if (clearBtn) clearBtn.addEventListener('click', _clearOutput);

    var minBtn = DOM.id('termMin');
    if (minBtn) minBtn.addEventListener('click', function () {
      DOM.toast('Terminal minimized', 'info', 1500);
    });

    var maxBtn = DOM.id('termMax');
    if (maxBtn) maxBtn.addEventListener('click', _toggleMaximize);

    var input = DOM.id('terminalInput');
    if (input) input.addEventListener('keydown', _handleInput);

    var overlay = DOM.id('terminalOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });
    }
  }

  function _bindKeyboard() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        _isOpen ? close() : open();
      }
    });
  }

  function open() {
    var overlay = DOM.id('terminalOverlay');
    var input   = DOM.id('terminalInput');
    if (!overlay) return;

    DOM.show(overlay);
    _isOpen = true;
    State.set('terminalOpen', true);

    var outputEl = DOM.id('terminalOutput');
    if (outputEl && outputEl.innerHTML === '') {
      _print(MOTD);
    }

    if (input) setTimeout(function () { input.focus(); }, 50);
    _cleanup = DOM.trapFocus(overlay);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    var overlay = DOM.id('terminalOverlay');
    if (!overlay) return;
    DOM.hide(overlay);
    _isOpen = false;
    State.set('terminalOpen', false);
    if (_cleanup) { _cleanup(); _cleanup = null; }
    document.body.style.overflow = '';
  }

  function _clearOutput() {
    var output = DOM.id('terminalOutput');
    if (output) output.innerHTML = '';
  }

  function _toggleMaximize() {
    var win = document.querySelector('.terminal-window');
    if (!win) return;
    var isFs = win.classList.toggle('terminal-fullscreen');
    win.style.width       = isFs ? '100%' : '';
    win.style.height      = isFs ? '100%' : '';
    win.style.maxHeight   = isFs ? '100%' : '';
    win.style.borderRadius = isFs ? '0' : '';
    var overlay = DOM.id('terminalOverlay');
    if (overlay) overlay.style.padding = isFs ? '0' : '';
  }

  function _handleInput(e) {
    var input = e.target;

    if (e.key === 'Enter') {
      var cmd = input.value.trim();
      if (cmd) {
        _history.unshift(cmd);
        _histIdx = -1;
        _printCommand(cmd);
        _execute(cmd);
        if (window.DevOS.Analytics) window.DevOS.Analytics.trackCommand(cmd);
      }
      input.value = '';
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      _histIdx = Math.min(_histIdx + 1, _history.length - 1);
      input.value = _history[_histIdx] || '';
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _histIdx = Math.max(_histIdx - 1, -1);
      input.value = _histIdx === -1 ? '' : (_history[_histIdx] || '');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      var partial = input.value.toLowerCase();
      var match   = CONFIG.TERMINAL_COMMANDS.find(function (c) {
        return c.startsWith(partial) && c !== partial;
      });
      if (match) input.value = match;
    }
  }

  function _printCommand(cmd) {
    var out = DOM.id('terminalOutput');
    if (!out) return;
    var line = document.createElement('div');
    line.innerHTML = '<span class="term-prompt-echo">devos@github:~$</span> <span class="term-cmd">'
      + Format.escapeHtml(cmd) + '</span>';
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  function _print(html) {
    var out = DOM.id('terminalOutput');
    if (!out) return;
    var div = document.createElement('div');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
  }

  function _execute(raw) {
    var parts = raw.toLowerCase().trim().split(/\s+/);
    var cmd   = parts[0];

    switch (cmd) {

      case 'help':
        _print([
          '<span class="term-header">Available commands:</span>',
          '<span class="term-divider">─────────────────────────────────</span>',
          '  <span class="term-accent">about</span>       — Show profile information',
          '  <span class="term-accent">projects</span>    — List top repositories',
          '  <span class="term-accent">repos</span>       — All public repositories',
          '  <span class="term-accent">github</span>      — Open GitHub profile',
          '  <span class="term-accent">stats</span>       — Show GitHub statistics',
          '  <span class="term-accent">skills</span>      — Show language breakdown',
          '  <span class="term-accent">stars</span>       — Show starred repos count',
          '  <span class="term-accent">whoami</span>      — Who is this developer?',
          '  <span class="term-accent">clear</span>       — Clear terminal output',
          '  <span class="term-accent">help</span>        — Show this help message',
          '<span class="term-divider">─────────────────────────────────</span>',
        ].join('\n'));
        break;

      case 'clear':
        _clearOutput();
        break;

      case 'whoami':
      case 'about': {
        var user = State.get('user');
        if (!user) {
          _print('<span class="term-error">User data not loaded yet.</span>');
          break;
        }
        _print([
          '<span class="term-success">▶ ' + (user.name || user.login) + '</span>',
          '<span class="term-muted">  Username:  </span><span class="term-accent">@' + user.login + '</span>',
          '<span class="term-muted">  Bio:       </span>' + Format.escapeHtml(user.bio || 'No bio'),
          '<span class="term-muted">  Location:  </span>' + Format.escapeHtml(user.location || 'Unknown'),
          '<span class="term-muted">  Company:   </span>' + Format.escapeHtml(user.company || 'None'),
          '<span class="term-muted">  Blog:      </span><a class="term-link" href="' + (user.blog || '#') + '" target="_blank" rel="noopener">' + Format.escapeHtml(user.blog || 'None') + '</a>',
          '<span class="term-muted">  Joined:    </span>' + Format.date(user.created_at),
        ].join('\n'));
        break;
      }

      case 'projects': {
        var repos = State.get('repos');
        if (!repos || !repos.length) {
          _print('<span class="term-error">Repos not loaded.</span>');
          break;
        }
        var topRepos = repos.slice().sort(function (a, b) {
          return b.stargazers_count - a.stargazers_count;
        }).slice(0, 5);
        var lines = ['<span class="term-header">Top 5 Repositories:</span>'];
        topRepos.forEach(function (r, i) {
          lines.push(
            '  <span class="term-muted">' + (i + 1) + '.</span> ' +
            '<a class="term-link" href="' + r.html_url + '" target="_blank" rel="noopener">' + Format.escapeHtml(r.name) + '</a> ' +
            '<span class="term-muted">— ⭐' + r.stargazers_count + (r.language ? ' · ' + r.language : '') + '</span>'
          );
        });
        _print(lines.join('\n'));
        break;
      }

      case 'repos': {
        var allRepos = State.get('repos');
        _print('<span class="term-success">Total public repositories: ' + allRepos.length + '</span>');
        allRepos.slice(0, 10).forEach(function (r) {
          _print(
            '  <span class="term-muted">·</span> ' +
            '<a class="term-link" href="' + r.html_url + '" target="_blank" rel="noopener">' + Format.escapeHtml(r.name) + '</a>'
          );
        });
        if (allRepos.length > 10) {
          _print('<span class="term-muted">  … and ' + (allRepos.length - 10) + ' more</span>');
        }
        break;
      }

      case 'github': {
        var ghUser = State.get('user');
        if (ghUser) {
          window.open(ghUser.html_url, '_blank', 'noopener,noreferrer');
          _print('<span class="term-success">Opening GitHub profile: ' + ghUser.html_url + '</span>');
        }
        break;
      }

      case 'stats': {
        var statsUser  = State.get('user');
        var statsRepos = State.get('repos');
        var stars      = State.get('totalStars');
        var forks      = State.get('totalForks');
        if (!statsUser) {
          _print('<span class="term-error">Data not loaded.</span>');
          break;
        }
        _print([
          '<span class="term-header">GitHub Statistics:</span>',
          '<span class="term-divider">─────────────────────────────────</span>',
          '  <span class="term-muted">Repositories:</span>  ' + statsRepos.length,
          '  <span class="term-muted">Total Stars:  </span>  ⭐ ' + stars.toLocaleString(),
          '  <span class="term-muted">Total Forks:  </span>  🍴 ' + forks.toLocaleString(),
          '  <span class="term-muted">Followers:    </span>  👥 ' + statsUser.followers,
          '  <span class="term-muted">Following:    </span>  ' + statsUser.following,
          '  <span class="term-muted">Public Gists: </span>  ' + (statsUser.public_gists || 0),
          '  <span class="term-muted">Member since: </span>  ' + Format.date(statsUser.created_at),
          '<span class="term-divider">─────────────────────────────────</span>',
        ].join('\n'));
        break;
      }

      case 'skills': {
        var langs = State.get('languages') || {};
        var total = Object.values(langs).reduce(function (s, b) { return s + b; }, 0);
        if (total === 0) {
          _print('<span class="term-error">Language data not loaded.</span>');
          break;
        }
        var skillLines = ['<span class="term-header">Language Breakdown:</span>'];
        Object.entries(langs)
          .sort(function (a, b) { return b[1] - a[1]; })
          .slice(0, 8)
          .forEach(function (entry) {
            var lang  = entry[0];
            var bytes = entry[1];
            var pct   = Math.round(bytes / total * 100);
            var filled = Math.round(pct / 5);
            var bar   = '█'.repeat(filled) + '░'.repeat(20 - filled);
            skillLines.push(
              '  <span class="term-accent">' + lang.padEnd(12) + '</span> ' +
              '<span class="term-muted">' + bar + '</span> ' + pct + '%'
            );
          });
        _print(skillLines.join('\n'));
        break;
      }

      case 'stars': {
        var totalStars = State.get('totalStars');
        _print('<span class="term-success">⭐ Total stars across all repositories: ' + totalStars.toLocaleString() + '</span>');
        break;
      }

      default:
        _print(
          '<span class="term-error">Command not found: \'' +
          Format.escapeHtml(cmd) +
          '\'. Type <span class="term-accent">help</span> for available commands.</span>'
        );
    }
  }

  return { init: init, open: open, close: close };

})();
