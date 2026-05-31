/**
 * DEVOS — MODULES/COMMAND-PALETTE.JS
 * Spotlight-style command palette with Ctrl+K shortcut.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.CommandPalette = (function () {
  const { DOM, Format, State } = window.DevOS;

  var _selected = 0;
  var _results  = [];
  var _cleanup  = null;

  var COMMANDS = [
    { label: 'Dashboard',            icon: 'grid',     section: 'dashboard',    type: 'nav',    iconColor: 'accent' },
    { label: 'Skills',               icon: 'activity', section: 'skills',       type: 'nav',    iconColor: 'teal'   },
    { label: 'Projects',             icon: 'folder',   section: 'projects',     type: 'nav',    iconColor: 'amber'  },
    { label: 'Explorer',             icon: 'chevron',  section: 'explorer',     type: 'nav',    iconColor: 'accent' },
    { label: 'Activity',             icon: 'clock',    section: 'activity',     type: 'nav',    iconColor: 'teal'   },
    { label: 'Timeline',             icon: 'clock',    section: 'timeline',     type: 'nav',    iconColor: 'amber'  },
    { label: 'Achievements',         icon: 'star',     section: 'achievements', type: 'nav',    iconColor: 'amber'  },
    { label: 'Open Terminal',        icon: 'terminal', type: 'action', action: 'terminal', iconColor: 'teal'   },
    { label: 'Open GitHub Profile',  icon: 'github',   type: 'action', action: 'github',   iconColor: 'accent' },
    { label: 'Search Repositories',  icon: 'search',   type: 'action', action: 'search',   iconColor: 'accent' },
  ];

  var SVG_ICONS = {
    grid:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<rect x="3" y="3" width="7" height="7"/>' +
      '<rect x="14" y="3" width="7" height="7"/>' +
      '<rect x="3" y="14" width="7" height="7"/>' +
      '<rect x="14" y="14" width="7" height="7"/></svg>',

    activity:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',

    folder:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',

    chevron:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<polyline points="9 18 15 12 9 6"/></svg>',

    clock:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<circle cx="12" cy="12" r="10"/>' +
      '<polyline points="12 6 12 12 16 14"/></svg>',

    star:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',

    terminal:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<polyline points="4 17 10 11 4 5"/>' +
      '<line x1="12" y1="19" x2="20" y2="19"/></svg>',

    github:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>',

    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<circle cx="11" cy="11" r="8"/>' +
      '<path d="m21 21-4.35-4.35"/></svg>',

    repo:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  };

  function init() {
    _bindEvents();
  }

  function _bindEvents() {
    ['cmdBtn', 'footerCmd'].forEach(function (id) {
      var btn = DOM.id(id);
      if (btn) btn.addEventListener('click', open);
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        _isOpen() ? close() : open();
      }
    });

    var input = DOM.id('cmdInput');
    if (input) {
      input.addEventListener('input', function () {
        _search(input.value);
      });
      input.addEventListener('keydown', _handleKeys);
    }

    var overlay = DOM.id('cmdOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && _isOpen()) {
        e.preventDefault();
        close();
      }
    });
  }

  function _isOpen() {
    var overlay = DOM.id('cmdOverlay');
    return overlay && !overlay.hidden;
  }

  function open() {
    var overlay = DOM.id('cmdOverlay');
    var input   = DOM.id('cmdInput');
    if (!overlay) return;

    DOM.show(overlay);
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 50);
    }
    _search('');
    _cleanup = DOM.trapFocus(overlay);
    document.body.style.overflow = 'hidden';
  }

  function close() {
    var overlay = DOM.id('cmdOverlay');
    if (!overlay) return;
    DOM.hide(overlay);
    if (_cleanup) { _cleanup(); _cleanup = null; }
    document.body.style.overflow = '';
  }

  function _search(query) {
    var q = (query || '').toLowerCase().trim();
    var results = [];

    var matchedCmds = COMMANDS.filter(function (c) {
      return !q || c.label.toLowerCase().indexOf(q) !== -1;
    });
    if (matchedCmds.length) {
      results.push({ type: 'group', label: 'Navigation & Actions' });
      matchedCmds.slice(0, 6).forEach(function (c) {
        results.push({ type: 'cmd', data: c });
      });
    }

    var repos = State.get('repos') || [];
    var matchedRepos = repos.filter(function (r) {
      if (!q) return true;
      return (
        r.name.toLowerCase().indexOf(q) !== -1 ||
        (r.description && r.description.toLowerCase().indexOf(q) !== -1) ||
        (r.language && r.language.toLowerCase().indexOf(q) !== -1)
      );
    }).slice(0, 6);

    if (matchedRepos.length) {
      results.push({ type: 'group', label: 'Repositories' });
      matchedRepos.forEach(function (r) {
        results.push({ type: 'repo', data: r });
      });
    }

    _results  = results.filter(function (r) { return r.type !== 'group'; });
    _selected = 0;
    _renderResults(results, q);
  }

  function _renderResults(items, query) {
    var container = DOM.id('cmdResults');
    if (!container) return;
    DOM.clear(container);

    if (items.length === 0) {
      container.innerHTML = '<div class="cmd-empty">No results found</div>';
      return;
    }

    var itemIndex = 0;

    items.forEach(function (item) {
      if (item.type === 'group') {
        var label = document.createElement('div');
        label.className = 'cmd-group-label';
        label.textContent = item.label;
        container.appendChild(label);
        return;
      }

      var idx = itemIndex++;
      var el  = document.createElement('div');
      el.className = 'cmd-item' + (idx === _selected ? ' selected' : '');
      el.setAttribute('role', 'option');
      el.setAttribute('tabindex', '-1');
      el.setAttribute('aria-selected', idx === _selected ? 'true' : 'false');

      if (item.type === 'cmd') {
        var c = item.data;
        el.innerHTML =
          '<div class="cmd-item-icon cmd-icon-' + c.iconColor + '">' + (SVG_ICONS[c.icon] || '') + '</div>' +
          '<div class="cmd-item-body">' +
            '<div class="cmd-item-title">' + Format.highlight(c.label, query) + '</div>' +
            '<div class="cmd-item-sub">' + (c.type === 'nav' ? 'Navigate to section' : 'Action') + '</div>' +
          '</div>' +
          (c.type === 'nav' ? '<span class="cmd-item-right">↵</span>' : '');

        (function (cmd) {
          el.addEventListener('click', function () { _selectCmd(cmd); });
        }(c));

      } else if (item.type === 'repo') {
        var r = item.data;
        el.innerHTML =
          '<div class="cmd-item-icon">' + SVG_ICONS.repo + '</div>' +
          '<div class="cmd-item-body">' +
            '<div class="cmd-item-title">' + Format.highlight(r.name, query) + '</div>' +
            '<div class="cmd-item-sub">' + (r.language || 'No language') + ' · ⭐' + r.stargazers_count + '</div>' +
          '</div>' +
          '<span class="cmd-item-right">↗</span>';

        (function (repo) {
          el.addEventListener('click', function () {
            window.open(repo.html_url, '_blank', 'noopener,noreferrer');
            close();
          });
        }(r));
      }

      container.appendChild(el);
    });
  }

  function _handleKeys(e) {
    var items = _results;
    var len   = Math.max(items.length, 1);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      _selected = (_selected + 1) % len;
      _updateSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      _selected = (_selected - 1 + len) % len;
      _updateSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      _executeSelected();
    }
  }

  function _updateSelected() {
    var container = DOM.id('cmdResults');
    if (!container) return;
    var els = DOM.qsa('.cmd-item', container);
    els.forEach(function (el, i) {
      el.classList.toggle('selected', i === _selected);
      el.setAttribute('aria-selected', i === _selected ? 'true' : 'false');
    });
    var sel = els[_selected];
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function _executeSelected() {
    var item = _results[_selected];
    if (!item) return;
    if (item.type === 'cmd') {
      _selectCmd(item.data);
    } else if (item.type === 'repo') {
      window.open(item.data.html_url, '_blank', 'noopener,noreferrer');
      close();
    }
  }

  function _selectCmd(cmd) {
    close();
    if (cmd.type === 'nav') {
      setTimeout(function () { DOM.scrollToSection(cmd.section); }, 100);
    } else if (cmd.type === 'action') {
      if (cmd.action === 'terminal') {
        window.DevOS.Modules.Terminal.open();
      } else if (cmd.action === 'github') {
        var user = State.get('user');
        if (user) window.open(user.html_url, '_blank', 'noopener,noreferrer');
      } else if (cmd.action === 'search') {
        window.DevOS.Modules.Search.open();
      }
    }
  }

  return { init: init, open: open, close: close };

})();
