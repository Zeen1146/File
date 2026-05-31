/**
 * DEVOS — MODULES/ACTIVITY.JS
 * Renders GitHub activity feed from public events API.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Activity = (function () {
  const { DOM, Format, State, API } = window.DevOS;

  async function init() {
    try {
      const events = await API.getEvents();
      State.set('events', events);
      render(events);
    } catch (e) {
      console.error('[Activity] Error:', e);
      const feed = DOM.id('activityFeed');
      if (feed) {
        DOM.clear(feed);
        feed.innerHTML = `<div class="empty-state"><p>Could not load activity feed.<br>Rate limit may be exceeded.</p></div>`;
      }
    }
  }

  function render(events) {
    const feed = DOM.id('activityFeed');
    if (!feed || !events) return;
    DOM.clear(feed);

    if (!events.length) {
      feed.innerHTML = `<div class="empty-state"><p>No recent activity found.</p></div>`;
      return;
    }

    let lastDate = null;
    let delay    = 0;

    events.slice(0, 20).forEach(event => {
      const eventDate = Format.date(event.created_at);

      // Date divider
      if (eventDate !== lastDate) {
        lastDate = eventDate;
        const divider = DOM.el('div', { class: 'activity-date-divider' }, eventDate);
        feed.appendChild(divider);
      }

      const item = _createItem(event, delay * 0.04);
      if (item) {
        feed.appendChild(item);
        delay++;
      }
    });

    DOM.observeReveal('.activity-item.reveal');
  }

  function _createItem(event, delay) {
    const { icon, iconClass, text, extra } = _describeEvent(event);
    if (!text) return null;

    const item = DOM.el('div', {
      class: `activity-item reveal`,
      style: `--delay:${delay}s`,
    });

    item.innerHTML = `
      <div class="activity-icon ${iconClass}">${icon}</div>
      <div class="activity-body">
        <div class="activity-text">${text}</div>
        ${extra ? `<div class="activity-extra">${Format.escapeHtml(extra)}</div>` : ''}
        <div class="activity-time">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${Format.relativeTime(event.created_at)}
        </div>
      </div>
    `;

    return item;
  }

  function _describeEvent(event) {
    const repo     = event.repo?.name || 'unknown/repo';
    const repoLink = `<a class="activity-repo-link" href="https://github.com/${repo}" target="_blank" rel="noopener noreferrer">${Format.escapeHtml(repo)}</a>`;
    const payload  = event.payload || {};

    const icons = {
      push:    '⬆',
      star:    '⭐',
      fork:    '🍴',
      create:  '✨',
      watch:   '👁',
      pr:      '↕',
      issue:   '●',
      comment: '💬',
      delete:  '🗑',
      other:   '◦',
    };

    switch (event.type) {
      case 'PushEvent': {
        const count    = payload.commits?.length || 0;
        const commitMsg = payload.commits?.[0]?.message || '';
        return {
          icon:      icons.push,
          iconClass: 'activity-icon-push',
          text:      `Pushed <strong>${count} commit${count !== 1 ? 's' : ''}</strong> to ${repoLink}`,
          extra:     commitMsg ? Format.truncate(commitMsg, 80) : null,
        };
      }
      case 'WatchEvent':
        return {
          icon:      icons.star,
          iconClass: 'activity-icon-star',
          text:      `Starred ${repoLink}`,
          extra:     null,
        };
      case 'ForkEvent':
        return {
          icon:      icons.fork,
          iconClass: 'activity-icon-fork',
          text:      `Forked ${repoLink}`,
          extra:     null,
        };
      case 'CreateEvent': {
        const refType = payload.ref_type || 'repository';
        const ref     = payload.ref ? `<code>${Format.escapeHtml(payload.ref)}</code>` : '';
        return {
          icon:      icons.create,
          iconClass: 'activity-icon-create',
          text:      `Created ${refType} ${ref} in ${repoLink}`,
          extra:     payload.description || null,
        };
      }
      case 'DeleteEvent':
        return {
          icon:      icons.delete,
          iconClass: 'activity-icon-delete',
          text:      `Deleted ${payload.ref_type || 'branch'} <code>${Format.escapeHtml(payload.ref || '')}</code> in ${repoLink}`,
          extra:     null,
        };
      case 'PullRequestEvent': {
        const action = payload.action || 'opened';
        const title  = payload.pull_request?.title || '';
        return {
          icon:      icons.pr,
          iconClass: 'activity-icon-pr',
          text:      `${_capitalize(action)} pull request in ${repoLink}`,
          extra:     title ? Format.truncate(title, 80) : null,
        };
      }
      case 'IssuesEvent': {
        const action = payload.action || 'opened';
        const title  = payload.issue?.title || '';
        return {
          icon:      icons.issue,
          iconClass: 'activity-icon-issue',
          text:      `${_capitalize(action)} issue in ${repoLink}`,
          extra:     title ? Format.truncate(title, 80) : null,
        };
      }
      case 'IssueCommentEvent':
      case 'CommitCommentEvent':
        return {
          icon:      icons.comment,
          iconClass: 'activity-icon-comment',
          text:      `Commented in ${repoLink}`,
          extra:     payload.comment?.body ? Format.truncate(payload.comment.body, 80) : null,
        };
      case 'PublicEvent':
        return {
          icon:      '🔓',
          iconClass: 'activity-icon-create',
          text:      `Made ${repoLink} public`,
          extra:     null,
        };
      case 'MemberEvent':
        return {
          icon:      '👥',
          iconClass: 'activity-icon-watch',
          text:      `${_capitalize(payload.action || 'added')} a member to ${repoLink}`,
          extra:     null,
        };
      default:
        return {
          icon:      icons.other,
          iconClass: '',
          text:      `Activity in ${repoLink}`,
          extra:     null,
        };
    }
  }

  function _capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }

  return { init, render };
})();
