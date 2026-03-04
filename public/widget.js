/**
 * ECHO Widget — DGC Dahan Group Consulting
 * Embeddable chat widget, delivered from vault.dahangroup.io
 *
 * Usage on any website:
 *   <script src="https://vault.dahangroup.io/widget.js" data-client-id="your-client-id"></script>
 *
 * The widget fetches its config (colors, theme, greeting, API endpoint) from the Worker
 * based on the client-id, then injects its UI and handles all chat logic.
 */

(function () {
  'use strict';

  // Capture the script tag reference immediately — unavailable after async operations
  const scriptTag = document.currentScript;
  const clientId = (scriptTag && scriptTag.getAttribute('data-client-id')) || 'dgc';

  const WORKER_URL = 'https://dgc-chat-api.ericdahan10.workers.dev';
  const WIDGET_CONFIG_URL = `${WORKER_URL}/widget-config?client_id=${encodeURIComponent(clientId)}`;

  // Visitor ID — persists across sessions so memory works across page loads
  function getOrCreateVisitorId() {
    const key = `echo_visitor_id_${clientId}`;
    let id = localStorage.getItem(key);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'v-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(key, id);
    }
    return id;
  }

  // Orbit SVG — DGC ECHO brand logo, shared across launcher, header, and message avatars
  const orbitSVG = (size) => `
    <svg width="${size}" height="${size}" viewBox="0 0 50 50" fill="none">
      <circle cx="25" cy="25" r="19" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"/>
      <circle cx="25" cy="25" r="5" fill="#ffffff"/>
      <ellipse cx="25" cy="25" rx="13" ry="8" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.8"
        transform="rotate(-25 25 25)" class="echo-orbit-ring"/>
      <circle cx="38" cy="25" r="2.8" fill="#7db8e8" class="echo-orbit-dot"/>
    </svg>`;

  // ─── Inject CSS ────────────────────────────────────────────────────────────
  function injectStyles(cfg) {
    const primary = cfg.primary_color || '#2d5a8f';
    const isDark = (cfg.theme || 'light') === 'dark';

    // ── Theme tokens — all surface/text colors swap here based on mode ──
    const surfaceBg    = isDark ? '#0f1923' : '#ffffff';
    const msgAreaBg    = isDark ? '#0b1320' : '#f4f6fa';
    const botBubbleBg  = isDark ? 'rgba(26,45,68,0.95)' : '#ffffff';
    const botText      = isDark ? '#dde6f0' : '#1a1a2e';
    const borderColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    const inputBorder  = isDark ? 'rgba(255,255,255,0.12)' : '#d8dde6';
    const inputBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
    const inputText    = isDark ? '#e2e8f0' : '#111111';
    const qrBg         = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
    const qrBorder     = isDark ? 'rgba(255,255,255,0.1)' : '#d8dde6';
    const qrText       = isDark ? '#9cb8d8' : '#374151';
    const scrollThumb  = isDark ? '#2d4a6a' : '#cbd5e1';
    const footerText   = isDark ? '#2d4a6a' : '#9ca3af';
    const widgetBorder = isDark ? `${primary}55` : 'rgba(0,0,0,0.06)';
    const typingDot    = isDark ? '#4a7aaa' : '#94a3b8';
    const mutedText    = isDark ? '#5a7a9a' : '#6b7280';
    const formShadow   = isDark
      ? `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${primary}33`
      : `0 12px 48px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)`;
    const msgAreaPattern = isDark
      ? 'radial-gradient(circle at 20% 80%, rgba(45,90,143,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(45,90,143,0.04) 0%, transparent 50%)'
      : 'radial-gradient(circle at 20% 80%, rgba(45,90,143,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(45,90,143,0.02) 0%, transparent 50%)';

    const style = document.createElement('style');
    style.id = 'echo-widget-styles';
    style.textContent = `
      /* ── Launcher ─────────────────────────────────────────────────────── */
      #echo-launcher {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: linear-gradient(145deg, ${primary}, ${primary}cc);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 24px ${primary}66, 0 2px 8px rgba(0,0,0,0.2);
        z-index: 99998;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #echo-launcher:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 32px ${primary}88, 0 3px 12px rgba(0,0,0,0.25);
      }
      #echo-launcher svg { pointer-events: none; }

      /* Pulsing ring — draws attention to the launcher */
      #echo-launcher::before {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        background: ${primary};
        opacity: 0;
        animation: echo-launcher-pulse 6s ease-out 3s infinite;
        z-index: -1;
      }
      @keyframes echo-launcher-pulse {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(1.9); opacity: 0;   }
      }

      /* ── Orbit ring animations ─────────────────────────────────────────── */
      .echo-orbit-ring {
        animation: echo-orbit-spin 6s linear infinite;
        transform-origin: 25px 25px;
      }
      .echo-orbit-dot {
        animation: echo-orbit-spin 3s linear infinite reverse;
        transform-origin: 25px 25px;
      }
      @keyframes echo-orbit-spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      /* ── Chat panel ────────────────────────────────────────────────────── */
      #echo-widget {
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 390px;
        max-width: calc(100vw - 32px);
        height: 590px;
        max-height: calc(100vh - 120px);
        background: ${surfaceBg};
        border-radius: 20px;
        border: 1px solid ${widgetBorder};
        box-shadow: ${formShadow};
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 99999;
        opacity: 0;
        transform: translateY(20px) scale(0.96);
        pointer-events: none;
        transition: opacity 0.25s cubic-bezier(0.34,1.56,0.64,1), transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #echo-widget.echo-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* ── Header ────────────────────────────────────────────────────────── */
      #echo-header {
        background: linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%);
        background-image:
          radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 60%),
          radial-gradient(ellipse at bottom left, rgba(0,0,0,0.15) 0%, transparent 60%),
          linear-gradient(135deg, ${primary} 0%, ${primary}bb 100%);
        padding: 16px 16px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        position: relative;
      }
      #echo-header-left {
        display: flex;
        align-items: center;
        gap: 11px;
      }
      .echo-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        border: 1.5px solid rgba(255,255,255,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 0 0 4px rgba(255,255,255,0.08);
      }
      #echo-header h3 {
        margin: 0 0 1px;
        color: #fff;
        font-size: 15px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      #echo-header p {
        margin: 0;
        color: rgba(255,255,255,0.8);
        font-size: 11.5px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      /* Animated online indicator */
      .echo-status-dot {
        width: 7px;
        height: 7px;
        background: #4ade80;
        border-radius: 50%;
        flex-shrink: 0;
        box-shadow: 0 0 6px #4ade80aa;
        animation: echo-status-pulse 2.5s ease-in-out infinite;
      }
      @keyframes echo-status-pulse {
        0%, 100% { opacity: 1; box-shadow: 0 0 4px #4ade80aa; }
        50%       { opacity: 0.7; box-shadow: 0 0 10px #4ade80cc; }
      }
      #echo-close {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.85);
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        transition: all 0.15s;
      }
      #echo-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
      }

      /* ── Messages area ─────────────────────────────────────────────────── */
      #echo-messages {
        flex: 1;
        overflow-y: auto;
        padding: 18px 16px 10px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: ${msgAreaBg};
        background-image: ${msgAreaPattern};
      }
      #echo-messages::-webkit-scrollbar { width: 3px; }
      #echo-messages::-webkit-scrollbar-track { background: transparent; }
      #echo-messages::-webkit-scrollbar-thumb { background: ${scrollThumb}; border-radius: 4px; }

      /* Message entry animation */
      @keyframes echo-msg-in {
        from { opacity: 0; transform: translateY(10px) scale(0.98); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .echo-msg {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 100%;
        animation: echo-msg-in 0.2s cubic-bezier(0.34,1.56,0.64,1);
      }
      .echo-msg.echo-bot  { align-self: flex-start; }
      .echo-msg.echo-user { align-self: flex-end; flex-direction: row-reverse; }

      .echo-bubble {
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.55;
        max-width: 78%;
        word-break: break-word;
      }
      .echo-bot .echo-bubble {
        background: ${botBubbleBg};
        color: ${botText};
        border-bottom-left-radius: 5px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
        border: 1px solid ${borderColor};
      }
      .echo-user .echo-bubble {
        background: linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%);
        background-image:
          linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.05) 100%),
          linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%);
        color: #fff;
        border-bottom-right-radius: 5px;
        box-shadow: 0 3px 12px ${primary}55, 0 1px 3px rgba(0,0,0,0.1);
      }

      .echo-msg-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primary}, ${primary}aa);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
        box-shadow: 0 2px 8px ${primary}44;
      }

      /* Typing indicator dots */
      .echo-typing span {
        display: inline-block;
        width: 7px;
        height: 7px;
        background: ${typingDot};
        border-radius: 50%;
        margin: 0 2px;
        animation: echo-bounce 1.2s infinite;
      }
      .echo-typing span:nth-child(2) { animation-delay: 0.2s; }
      .echo-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes echo-bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-7px); }
      }

      /* ── Quick reply chips — rendered inline in message flow ───────────── */
      .echo-chip-row {
        display: flex;
        flex-direction: column;
        gap: 7px;
        overflow: visible;
        padding: 4px 0 2px;
        align-self: flex-start;
        width: 100%;
        max-width: 78%;
      }
      .echo-qr-btn {
        background: ${isDark ? `linear-gradient(135deg, ${primary}22 0%, ${primary}12 100%)` : `linear-gradient(135deg, ${primary}0f 0%, ${primary}06 100%)`};
        border: 1px solid ${isDark ? `${primary}55` : `${primary}44`};
        color: ${isDark ? '#c8dff5' : primary};
        padding: 7px 15px;
        border-radius: 20px;
        font-size: 12.5px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        white-space: normal !important;
        width: 100%;
        text-align: left;
        font-weight: 600;
        letter-spacing: 0.01em;
        box-shadow: 0 2px 8px ${primary}22, inset 0 1px 0 rgba(255,255,255,0.06);
      }
      .echo-qr-btn:hover {
        background: ${isDark ? `linear-gradient(135deg, ${primary}44 0%, ${primary}28 100%)` : `linear-gradient(135deg, ${primary}22 0%, ${primary}12 100%)`};
        border-color: ${primary};
        color: ${isDark ? '#ffffff' : primary};
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 20px ${primary}44, 0 2px 8px ${primary}22;
      }
      .echo-qr-btn:active {
        transform: translateY(0) scale(0.98);
      }

      /* ── Inline forms ──────────────────────────────────────────────────── */
      #echo-form-area {
        padding: 12px 16px;
        background: ${msgAreaBg};
        border-top: 1px solid ${borderColor};
      }
      .echo-inline-form label {
        display: block;
        font-size: 11.5px;
        font-weight: 600;
        color: ${mutedText};
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .echo-inline-form input {
        width: 100%;
        padding: 9px 12px;
        border: 1px solid ${inputBorder};
        border-radius: 10px;
        font-size: 13px;
        margin-bottom: 7px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        background: ${inputBg};
        color: ${inputText};
      }
      .echo-inline-form input:focus {
        border-color: ${primary};
        box-shadow: 0 0 0 3px ${primary}22;
      }
      .echo-inline-form .echo-form-actions {
        display: flex;
        gap: 8px;
        margin-top: 4px;
      }
      .echo-btn-primary {
        flex: 1;
        padding: 9px;
        background: linear-gradient(135deg, ${primary}, ${primary}cc);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        box-shadow: 0 3px 10px ${primary}44;
      }
      .echo-btn-primary:hover {
        opacity: 0.9;
        transform: translateY(-1px);
        box-shadow: 0 5px 14px ${primary}55;
      }
      .echo-btn-secondary {
        padding: 9px 14px;
        background: transparent;
        color: ${mutedText};
        border: 1px solid ${inputBorder};
        border-radius: 10px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .echo-btn-secondary:hover { border-color: ${primary}88; color: ${primary}; }

      /* ── Input row ─────────────────────────────────────────────────────── */
      #echo-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid ${borderColor};
        background: ${surfaceBg};
        flex-shrink: 0;
      }
      #echo-input {
        flex: 1;
        border: 1.5px solid ${inputBorder};
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        transition: border-color 0.15s, box-shadow 0.15s;
        resize: none;
        background: ${inputBg};
        color: ${inputText};
      }
      #echo-input::placeholder { color: ${mutedText}; }
      #echo-input:focus {
        border-color: ${primary};
        box-shadow: 0 0 0 3px ${primary}1a;
      }
      #echo-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, ${primary}, ${primary}cc);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.15s;
        box-shadow: 0 3px 10px ${primary}44;
      }
      #echo-send:hover {
        transform: scale(1.08);
        box-shadow: 0 5px 16px ${primary}66;
      }

      /* ── Footer ────────────────────────────────────────────────────────── */
      #echo-footer {
        text-align: center;
        padding: 7px;
        font-size: 10px;
        color: ${footerText};
        background: ${surfaceBg};
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-weight: 500;
        flex-shrink: 0;
        border-top: 1px solid ${borderColor};
      }

      /* ── Mobile full-screen ────────────────────────────────────────────── */
      @media (max-width: 480px) {
        #echo-widget {
          bottom: 0;
          right: 0;
          width: 100vw;
          max-width: 100vw;
          height: 100dvh;
          max-height: 100dvh;
          border-radius: 0;
        }
        #echo-launcher { bottom: 16px; right: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Inject HTML ───────────────────────────────────────────────────────────
  function injectHTML(cfg) {
    const name = cfg.display_name || 'ECHO';
    const brandLine = cfg.brand_line || 'AI Assistant';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <!-- Launcher button -->
      <button id="echo-launcher" aria-label="Open chat">
        ${orbitSVG(30)}
      </button>

      <!-- Chat panel -->
      <div id="echo-widget" role="dialog" aria-label="${name} chat" aria-hidden="true">
        <div id="echo-header">
          <div id="echo-header-left">
            <div class="echo-avatar">${orbitSVG(26)}</div>
            <div>
              <h3>${name}</h3>
              <p><span class="echo-status-dot"></span>Online · ${brandLine}</p>
            </div>
          </div>
          <button id="echo-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="echo-messages"></div>

        <div id="echo-form-area" style="display:none;"></div>

        <div id="echo-input-row">
          <input id="echo-input" type="text" placeholder="Type a message…" autocomplete="off" />
          <button id="echo-send" aria-label="Send">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div id="echo-footer">Powered by DAHAN GROUP CONSULTING</div>
      </div>
    `;
    document.body.appendChild(wrapper);
  }

  // ─── Chat Logic ────────────────────────────────────────────────────────────
  function initChat(cfg) {
    const workerUrl = cfg.worker_url || WORKER_URL;
    const apiKey = cfg.api_key || '';
    const greeting = cfg.greeting || "Hi! I'm here to help. What can I answer for you?";
    // Use the UUID returned by /widget-config for all API calls — the data-client-id
    // attribute may be a slug which doesn't match Supabase UUID lookups.
    const apiClientId = cfg.client_id || clientId;
    const visitorId = getOrCreateVisitorId();

    const widget = document.getElementById('echo-widget');
    const launcher = document.getElementById('echo-launcher');
    const closeBtn = document.getElementById('echo-close');
    const messagesEl = document.getElementById('echo-messages');
    const inputEl = document.getElementById('echo-input');
    const sendBtn = document.getElementById('echo-send');
    const formAreaEl = document.getElementById('echo-form-area');

    let chatHistory = [];
    let isOpen = false;
    let hasOpened = false;
    let notificationWebhook = null;
    let webhookLoaded = false;

    async function loadNotificationWebhook() {
      if (webhookLoaded) return notificationWebhook;
      webhookLoaded = true;
      try {
        const res = await fetch(`${workerUrl}/client-settings-get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
          body: JSON.stringify({ client_id: apiClientId }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        notificationWebhook = (data.notification_webhook || '').trim() || null;
      } catch {
        notificationWebhook = null;
      }
      return notificationWebhook;
    }

    async function submitFormspreeFallback(leadPayload) {
      const webhook = await loadNotificationWebhook();
      if (!webhook || !/formspree\.io\//i.test(webhook)) return false;
      const params = new URLSearchParams();
      params.set('name', leadPayload.name || 'Unknown');
      params.set('email', leadPayload.email || '');
      params.set('phone', leadPayload.phone || '—');
      params.set('message', leadPayload.message || '—');
      params.set('source', leadPayload.source || 'chatbot');
      params.set('_subject', `New Chatbot Lead · ${leadPayload.name || 'Unknown'}`);
      if (leadPayload.email) params.set('_replyto', leadPayload.email);
      const res = await fetch(webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });
      return res.ok;
    }

    // ── Rendering helpers ──

    function renderMarkdown(text) {
      return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
    }

    function addMsg(text, who) {
      const el = document.createElement('div');
      el.className = `echo-msg echo-${who}`;
      if (who === 'bot') {
        el.innerHTML = `
          <div class="echo-msg-avatar">${orbitSVG(28)}</div>
          <div class="echo-bubble">${renderMarkdown(text)}</div>`;
      } else {
        el.innerHTML = `<div class="echo-bubble">${renderMarkdown(text)}</div>`;
      }
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    function addTyping() {
      const el = document.createElement('div');
      el.className = 'echo-msg echo-bot';
      el.id = 'echo-typing-indicator';
      el.innerHTML = `
        <div class="echo-msg-avatar">${orbitSVG(28)}</div>
        <div class="echo-bubble echo-typing"><span></span><span></span><span></span></div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function removeTyping() {
      const el = document.getElementById('echo-typing-indicator');
      if (el) el.remove();
    }

    function clearQuickReplies() {
      const existing = messagesEl.querySelector('.echo-chip-row');
      if (existing) existing.remove();
    }

    function showQuickReplies(options) {
      clearQuickReplies();
      const row = document.createElement('div');
      row.className = 'echo-chip-row';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'echo-qr-btn';
        btn.textContent = opt;
        btn.onclick = () => { clearQuickReplies(); sendMessage(opt); };
        row.appendChild(btn);
      });
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function showStarters() {
      showQuickReplies(cfg.starters || [
        '📅 Book a consultation',
        '⚡ Automate a process',
        '🤖 What services do you offer?',
        '💰 How much does it cost?',
      ]);
    }

    // ── Forms ──

    function showContactForm() {
      clearQuickReplies();
      formAreaEl.style.display = 'block';
      formAreaEl.innerHTML = `
        <div class="echo-inline-form">
          <label>Name</label>
          <input id="echo-cf-name" type="text" placeholder="Your name" />
          <label>Email</label>
          <input id="echo-cf-email" type="email" placeholder="your@email.com" />
          <label>Phone (optional)</label>
          <input id="echo-cf-phone" type="tel" placeholder="+1 (555) 000-0000" />
          <div class="echo-form-actions">
            <button class="echo-btn-primary" id="echo-cf-submit">Send →</button>
            <button class="echo-btn-secondary" id="echo-cf-cancel">Cancel</button>
          </div>
        </div>`;

      document.getElementById('echo-cf-cancel').onclick = () => {
        formAreaEl.style.display = 'none';
        formAreaEl.innerHTML = '';
      };

      document.getElementById('echo-cf-submit').onclick = async () => {
        const name = document.getElementById('echo-cf-name').value.trim();
        const email = document.getElementById('echo-cf-email').value.trim();
        const phone = document.getElementById('echo-cf-phone').value.trim();
        const submitBtn = document.getElementById('echo-cf-submit');
        if (!name || !email) {
          addMsg('Please fill in your name and email.', 'bot');
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const latestUserMessage = [...chatHistory].reverse().find(m => m.role === 'user')?.content || '';
        const leadPayload = {
          client_id: apiClientId,
          visitor_id: visitorId,
          source: 'chatbot',
          name,
          email,
          phone,
          visitor_name: name,
          visitor_email: email,
          visitor_phone: phone,
          message: latestUserMessage,
        };

        try {
          const res = await fetch(`${workerUrl}/lead-capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify(leadPayload),
          });
          if (!res.ok) {
            let err = `Failed to submit (${res.status})`;
            try {
              const body = await res.json();
              err = body?.error || body?.message || err;
            } catch {}
            throw new Error(err);
          }

          await submitFormspreeFallback(leadPayload).catch(() => false);

          formAreaEl.style.display = 'none';
          formAreaEl.innerHTML = '';
          addMsg(`Thanks ${name}! We'll be in touch at ${email} shortly.`, 'bot');
        } catch (e) {
          addMsg(`I couldn't submit your details right now. Please try again in a moment. (${e.message})`, 'bot');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send →';
        }
      };
    }

    function showEscalationForm() {
      clearQuickReplies();
      formAreaEl.style.display = 'block';
      formAreaEl.innerHTML = `
        <div class="echo-inline-form">
          <label>Name *</label>
          <input id="echo-ef-name" type="text" placeholder="Your name" />
          <label>Email *</label>
          <input id="echo-ef-email" type="email" placeholder="your@email.com" />
          <label>Phone (optional)</label>
          <input id="echo-ef-phone" type="tel" placeholder="+1 (555) 000-0000" />
          <div class="echo-form-actions">
            <button class="echo-btn-primary" id="echo-ef-submit">Submit ticket →</button>
            <button class="echo-btn-secondary" id="echo-ef-cancel">Cancel</button>
          </div>
        </div>`;

      document.getElementById('echo-ef-cancel').onclick = () => {
        formAreaEl.style.display = 'none';
        formAreaEl.innerHTML = '';
      };

      document.getElementById('echo-ef-submit').onclick = async () => {
        const name = document.getElementById('echo-ef-name').value.trim();
        const email = document.getElementById('echo-ef-email').value.trim();
        const phone = document.getElementById('echo-ef-phone').value.trim();
        if (!name || !email) {
          addMsg('Please fill in your name and email.', 'bot');
          return;
        }

        const latestUserMessage = [...chatHistory].reverse().find(m => m.role === 'user')?.content || '';
        const leadPayload = {
          client_id: apiClientId,
          visitor_id: visitorId,
          source: 'chatbot',
          name,
          email,
          phone,
          visitor_name: name,
          visitor_email: email,
          visitor_phone: phone,
          message: latestUserMessage,
        };

        formAreaEl.style.display = 'none';
        formAreaEl.innerHTML = '';
        addMsg(`Got it ${name}! We've created a support ticket and you'll hear from us at ${email} soon.`, 'bot');

        try {
          await fetch(`${workerUrl}/escalation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ name, email, phone, client_id: apiClientId, visitor_id: visitorId }),
          });
          await submitFormspreeFallback(leadPayload).catch(() => false);
        } catch (e) { /* best effort */ }
      };

            }

    // ── Core send ──

    async function sendMessage(text) {
      if (!text.trim()) return;
      clearQuickReplies();
      formAreaEl.style.display = 'none';
      formAreaEl.innerHTML = '';

      addMsg(text, 'user');
      chatHistory.push({ role: 'user', content: text });
      inputEl.value = '';

      addTyping();

      try {
        const res = await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            messages: chatHistory.slice(-10),
            visitor_id: visitorId,
            client_id: apiClientId,
          }),
        });

        removeTyping();

        if (!res.ok) throw new Error('Worker error');

        const data = await res.json();
        const routing = data._routing || {};
        const reply = data?.content?.[0]?.text || "I'm having trouble responding right now. Please try again.";

        chatHistory.push({ role: 'assistant', content: reply });
        addMsg(reply, 'bot');

        if (routing.action === 'escalation') {
          showEscalationForm();
        } else if (routing.action === 'contact') {
          showContactForm();
        } else {
          showQuickReplies(['Tell me more', 'Book a consultation', 'Something else']);
        }
      } catch (err) {
        removeTyping();
        addMsg("Sorry, I couldn't connect. Please try again in a moment.", 'bot');
      }
    }

    // ── Open/close ──

    function open() {
      isOpen = true;
      widget.classList.add('echo-open');
      widget.setAttribute('aria-hidden', 'false');
      launcher.setAttribute('aria-expanded', 'true');
      inputEl.focus();

      if (!hasOpened) {
        hasOpened = true;
        addMsg(greeting, 'bot');
        showStarters();
      }
    }

    function close() {
      isOpen = false;
      widget.classList.remove('echo-open');
      widget.setAttribute('aria-hidden', 'true');
      launcher.setAttribute('aria-expanded', 'false');
    }

    // ── Event listeners ──

    launcher.addEventListener('click', () => isOpen ? close() : open());
    closeBtn.addEventListener('click', close);

    sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(inputEl.value);
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  // ─── Bootstrap ─────────────────────────────────────────────────────────────
  async function init() {
    try {
      const res = await fetch(WIDGET_CONFIG_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error('Config fetch failed');
      const cfg = await res.json();
      console.log('[ECHO] widget config received:', cfg);
      injectStyles(cfg);
      injectHTML(cfg);
      initChat(cfg);
    } catch (err) {
      console.warn('[ECHO widget] Could not load config, using defaults.', err);
      const defaults = {
        display_name: 'ECHO',
        brand_line: 'AI Assistant',
        greeting: "Hi! I'm ECHO. How can I help you today?",
        primary_color: '#2d5a8f',
        theme: 'light',
        api_key: '',
        worker_url: WORKER_URL,
      };
      injectStyles(defaults);
      injectHTML(defaults);
      initChat(defaults);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
