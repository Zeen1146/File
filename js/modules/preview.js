/**
 * DEVOS — MODULES/PREVIEW.JS
 * Website preview engine with iframe, markdown, and image preview.
 */

window.DevOS.Modules = window.DevOS.Modules || {};

window.DevOS.Modules.Preview = (function () {
  const { DOM, Format } = window.DevOS;

  let _cleanup = null;

  function init() {
    _bindClose();
  }

  function _bindClose() {
    const overlay = DOM.id('previewOverlay');
    const closeBtn = DOM.id('previewClose');
    const fullscreenBtn = DOM.id('previewFullscreen');
    const refreshBtn = DOM.id('previewRefresh');

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', _toggleFullscreen);
    if (refreshBtn) refreshBtn.addEventListener('click', _refresh);

    // Click outside
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const o = DOM.id('previewOverlay');
        if (o && !o.hidden) close();
      }
    });
  }

  /**
   * Open website preview in iframe.
   * @param {string} url
   */
  function open(url) {
    const overlay = DOM.id('previewOverlay');
    const iframe  = DOM.id('previewIframe');
    const loading = DOM.id('previewLoading');
    const urlText = DOM.id('previewUrlText');
    const extLink = DOM.id('previewOpenExternal');

    if (!overlay || !iframe) return;

    // Set URL
    const cleanUrl = url.replace(/^https?:\/\//, '');
    if (urlText) urlText.textContent = cleanUrl;
    if (extLink) extLink.href = url;

    // Show loading
    if (loading) loading.classList.remove('hidden');
    iframe.style.opacity = '0';

    // Load iframe
    iframe.src = url;
    iframe.onload = () => {
      if (loading) loading.classList.add('hidden');
      iframe.style.transition = 'opacity 0.3s ease';
      iframe.style.opacity = '1';
    };
    iframe.onerror = () => {
      if (loading) {
        loading.innerHTML = `
          <svg style="width:40px;height:40px;opacity:.4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style="color:var(--color-text-2)">Preview unavailable</span>
          <a href="${Format.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Open in new tab →</a>
        `;
      }
    };

    // Show overlay
    DOM.show(overlay);
    _cleanup = DOM.trapFocus(overlay);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Open markdown file preview.
   * @param {string} rawUrl
   * @param {string} filename
   * @param {Object} repo
   */
  async function openMarkdown(rawUrl, filename, repo) {
    const overlay = DOM.id('previewOverlay');
    const iframe  = DOM.id('previewIframe');
    const loading = DOM.id('previewLoading');
    const urlText = DOM.id('previewUrlText');
    const extLink = DOM.id('previewOpenExternal');

    if (!overlay || !iframe) return;

    if (urlText) urlText.textContent = filename;
    if (extLink) extLink.href = rawUrl;
    if (loading) loading.classList.remove('hidden');
    iframe.style.opacity = '0';

    try {
      const text = await fetch(rawUrl).then(r => r.text());
      const html = _renderMarkdown(text, repo);
      const blob = new Blob([html], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      iframe.src = blobUrl;
      iframe.onload = () => {
        if (loading) loading.classList.add('hidden');
        iframe.style.transition = 'opacity 0.3s ease';
        iframe.style.opacity = '1';
        URL.revokeObjectURL(blobUrl);
      };
    } catch (e) {
      if (loading) {
        loading.innerHTML = `<span style="color:var(--color-text-2)">Cannot load README</span>`;
      }
    }

    DOM.show(overlay);
    _cleanup = DOM.trapFocus(overlay);
    document.body.style.overflow = 'hidden';
  }

  /**
   * Open image preview.
   * @param {string} url
   * @param {string} filename
   */
  function openImage(url, filename) {
    const overlay = DOM.id('previewOverlay');
    const iframe  = DOM.id('previewIframe');
    const loading = DOM.id('previewLoading');
    const urlText = DOM.id('previewUrlText');
    const extLink = DOM.id('previewOpenExternal');

    if (!overlay || !iframe) return;

    if (urlText) urlText.textContent = filename;
    if (extLink) extLink.href = url;
    if (loading) loading.classList.remove('hidden');
    iframe.style.opacity = '0';

    const html = `<!DOCTYPE html><html><head><style>body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;} img{max-width:100%;max-height:100vh;object-fit:contain;border-radius:4px;}</style></head><body><img src="${url}" alt="${filename}"/></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    iframe.src = blobUrl;
    iframe.onload = () => {
      if (loading) loading.classList.add('hidden');
      iframe.style.transition = 'opacity 0.3s ease';
      iframe.style.opacity = '1';
      URL.revokeObjectURL(blobUrl);
    };

    DOM.show(overlay);
    _cleanup = DOM.trapFocus(overlay);
    document.body.style.overflow = 'hidden';
  }

  /** Close preview */
  function close() {
    const overlay = DOM.id('previewOverlay');
    const iframe  = DOM.id('previewIframe');
    if (!overlay) return;
    DOM.hide(overlay);
    if (iframe) { iframe.src = 'about:blank'; iframe.style.opacity = '0'; }
    if (_cleanup) { _cleanup(); _cleanup = null; }
    document.body.style.overflow = '';
  }

  function _refresh() {
    const iframe = DOM.id('previewIframe');
    if (iframe && iframe.src && iframe.src !== 'about:blank') {
      const src = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => { iframe.src = src; }, 50);
    }
  }

  function _toggleFullscreen() {
    const win = document.querySelector('.preview-window');
    if (!win) return;
    const isFs = win.classList.toggle('preview-fullscreen');
    win.style.maxWidth = isFs ? '100%' : '';
    win.style.height   = isFs ? '100%' : '';
    const overlay = DOM.id('previewOverlay');
    if (overlay) overlay.style.padding = isFs ? '0' : '';
  }

  /**
   * Minimal Markdown → HTML renderer.
   * @param {string} md
   * @param {Object} repo
   * @returns {string} HTML document
   */
  function _renderMarkdown(md, repo) {
    let html = md
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bold/Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links with images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // HR
      .replace(/^---+$/gm, '<hr>')
      // Lists
      .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p>');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, system-ui, sans-serif; font-size: 15px; line-height: 1.7; color: #e8e8f0; background: #0d0d14; padding: 32px; max-width: 860px; margin: 0 auto; }
      h1,h2,h3 { color: #fff; margin: 1.5em 0 0.5em; font-weight: 700; }
      h1 { font-size: 2em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: .5em; }
      h2 { font-size: 1.4em; }
      h3 { font-size: 1.15em; }
      p { margin: 1em 0; }
      a { color: #a78bfa; }
      code { background: rgba(255,255,255,0.08); border-radius: 4px; padding: 2px 6px; font-family: monospace; font-size: .9em; }
      pre { background: rgba(0,0,0,0.4); border-radius: 8px; padding: 16px; overflow-x: auto; margin: 1em 0; }
      pre code { background: none; padding: 0; }
      blockquote { border-left: 3px solid #7c6af5; padding-left: 16px; color: rgba(232,232,240,0.6); margin: 1em 0; }
      hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 2em 0; }
      li { margin: .3em 0; padding-left: 1.5em; position: relative; }
      li::before { content: "•"; position: absolute; left: .5em; color: #7c6af5; }
      img { border-radius: 8px; }
    </style></head><body><p>${html}</p></body></html>`;
  }

  return { init, open, openMarkdown, openImage, close };
})();
