/**
 * DEVOS — MODULES/EXPLORER.JS
 * VS Code–style repository file tree explorer.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Explorer = (function () {
  const { DOM, Format, State, API } = window.DevOS;

  let _activeRepo = null;

  function init() {
    const repos = State.get('repos');
    if (repos && repos.length > 0) {
      _renderRepoList(repos);
    }
  }

  /* ── Repo sidebar ── */
  function _renderRepoList(repos) {
    const list = DOM.id('explorerRepoList');
    if (!list) return;
    DOM.clear(list);

    const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    sorted.forEach(repo => {
      const item = DOM.el('div', { class: 'explorer-repo-item', tabindex: '0' });
      item.innerHTML = `
        <svg class="tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span class="explorer-repo-name">${Format.escapeHtml(repo.name)}</span>
        ${repo.language ? `<span class="explorer-repo-lang-dot" style="background:${Format.langColor(repo.language)}"></span>` : ''}
      `;
      item.addEventListener('click', () => _selectRepo(repo, item));
      item.addEventListener('keydown', e => { if (e.key === 'Enter') _selectRepo(repo, item); });
      list.appendChild(item);
    });
  }

  /* ── Select repo ── */
  async function _selectRepo(repo, itemEl) {
    // Update active state
    DOM.qsa('.explorer-repo-item').forEach(i => i.classList.remove('active'));
    if (itemEl) itemEl.classList.add('active');

    _activeRepo = repo;
    const titleEl = DOM.id('explorerRepoTitle');
    if (titleEl) titleEl.textContent = repo.name;

    const tree = DOM.id('explorerTree');
    if (!tree) return;
    tree.innerHTML = `<div class="tree-loading"><div class="tree-spinner"></div><span>Loading file tree…</span></div>`;

    try {
      const branch = await API.getDefaultBranch(repo.owner.login, repo.name);
      const treeData = await API.getRepoTree(repo.owner.login, repo.name, branch);
      _renderTree(tree, treeData.tree || [], repo, branch);
    } catch (e) {
      tree.innerHTML = `
        <div class="explorer-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>Unable to load tree: ${Format.escapeHtml(e.message)}</p>
        </div>
      `;
    }
  }

  /* ── Render tree ── */
  function _renderTree(container, nodes, repo, branch) {
    DOM.clear(container);

    if (!nodes || nodes.length === 0) {
      container.innerHTML = `<div class="explorer-empty-state"><p>Empty repository</p></div>`;
      return;
    }

    // Build hierarchical structure
    const root = _buildTree(nodes);
    const fragment = document.createDocumentFragment();
    _renderNode(fragment, root.children, repo, branch, 0);
    container.appendChild(fragment);
  }

  function _buildTree(nodes) {
    const root = { name: '', children: {}, type: 'tree' };

    nodes.forEach(node => {
      const parts = node.path.split('/');
      let current = root;

      parts.forEach((part, i) => {
        if (!current.children[part]) {
          current.children[part] = {
            name:     part,
            path:     parts.slice(0, i + 1).join('/'),
            type:     i === parts.length - 1 ? node.type : 'tree',
            children: {},
            size:     node.size || 0,
            sha:      node.sha,
          };
        }
        current = current.children[part];
      });
    });

    return root;
  }

  function _renderNode(container, children, repo, branch, depth) {
    const entries = Object.values(children);

    // Folders first, then files
    const folders = entries.filter(n => n.type === 'tree').sort((a, b) => a.name.localeCompare(b.name));
    const files   = entries.filter(n => n.type !== 'tree').sort((a, b) => a.name.localeCompare(b.name));
    const sorted  = [...folders, ...files];

    sorted.forEach(node => {
      if (node.type === 'tree') {
        _renderFolder(container, node, repo, branch, depth);
      } else {
        _renderFile(container, node, repo, branch, depth);
      }
    });
  }

  function _renderFolder(container, node, repo, branch, depth) {
    const folderEl = DOM.el('div', { class: 'tree-folder', style: `padding-left:${depth * 16}px`, tabindex: '0' });
    folderEl.innerHTML = `
      <svg class="tree-chevron tree-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      <svg class="tree-icon tree-folder-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.11 0-2 .89-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/></svg>
      <span class="tree-name">${Format.escapeHtml(node.name)}</span>
    `;

    const childContainer = DOM.el('div', { class: 'tree-children' });
    childContainer.style.height = '0';
    childContainer.style.overflow = 'hidden';

    let isOpen = false;
    let rendered = false;

    folderEl.addEventListener('click', () => {
      isOpen = !isOpen;
      folderEl.classList.toggle('open', isOpen);

      if (isOpen && !rendered) {
        rendered = true;
        _renderNode(childContainer, node.children, repo, branch, depth + 1);
      }

      // Animate height
      if (isOpen) {
        childContainer.style.height = 'auto';
        const h = childContainer.scrollHeight;
        childContainer.style.height = '0';
        requestAnimationFrame(() => {
          childContainer.style.transition = 'height 0.2s ease';
          childContainer.style.height = h + 'px';
          setTimeout(() => { childContainer.style.height = 'auto'; }, 220);
        });
      } else {
        childContainer.style.height = childContainer.scrollHeight + 'px';
        requestAnimationFrame(() => {
          childContainer.style.transition = 'height 0.2s ease';
          childContainer.style.height = '0';
        });
      }
    });

    folderEl.addEventListener('keydown', e => { if (e.key === 'Enter') folderEl.click(); });
    container.appendChild(folderEl);
    container.appendChild(childContainer);
  }

  function _renderFile(container, node, repo, branch, depth) {
    const ext      = node.name.split('.').pop().toLowerCase();
    const iconCls  = Format.fileIconClass(node.name);
    const isHtml   = ext === 'html' || ext === 'htm';
    const isImage  = ['png','jpg','jpeg','gif','svg','webp','ico'].includes(ext);
    const isMd     = ['md','mdx'].includes(ext);

    const fileEl = DOM.el('div', {
      class: 'tree-file',
      style: `padding-left:${depth * 16 + 4}px`,
      tabindex: '0',
    });

    const rawUrl = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${branch}/${node.path}`;
    const liveUrl = isHtml
      ? `https://${repo.owner.login}.github.io/${repo.name}/${node.path}`
      : null;

    fileEl.innerHTML = `
      <svg class="tree-icon tree-file-icon ${iconCls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span class="tree-name">${Format.escapeHtml(node.name)}</span>
      ${isHtml ? '<span class="tree-file-badge">HTML</span>' : ''}
    `;

    fileEl.addEventListener('click', () => {
      if (isHtml && liveUrl) {
        window.DevOS.Modules.Preview.open(liveUrl);
      } else if (isMd) {
        window.DevOS.Modules.Preview.openMarkdown(rawUrl, node.name, repo);
      } else if (isImage) {
        window.DevOS.Modules.Preview.openImage(rawUrl, node.name);
      } else {
        window.open(rawUrl, '_blank', 'noopener,noreferrer');
      }
    });

    fileEl.addEventListener('keydown', e => { if (e.key === 'Enter') fileEl.click(); });
    container.appendChild(fileEl);
  }

  return { init };
})();
