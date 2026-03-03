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
    const surfaceBg    = isDark ? '#111827' : '#ffffff';  // widget bg, input row, footer
    const msgAreaBg    = isDark ? '#0d1117' : '#f8f9fb';  // scrollable messages area
    const botBubbleBg  = isDark ? '#1a2d42' : '#ffffff';  // bot message bubbles
    const botText      = isDark ? '#dde6f0' : '#1a1a2e';  // bot message text
    const borderColor  = isDark ? 'rgba(255,255,255,0.07)' : '#e5e7eb';  // dividers
    const inputBorder  = isDark ? 'rgba(255,255,255,0.13)' : '#d0d5dd'; // input borders
    const inputBg      = isDark ? '#1a2535' : '#ffffff';  // input field bg
    const inputText    = isDark ? '#e2e8f0' : '#111111';  // input field text
    const qrBg         = isDark ? '#1a2535' : '#ffffff';  // quick reply chip bg
    const qrBorder     = isDark ? 'rgba(255,255,255,0.1)' : '#d0d5dd'; // quick reply border
    const qrText       = isDark ? '#9cb8d8' : '#374151';  // quick reply text
    const scrollThumb  = isDark ? '#2d4a6a' : '#d0d5dd';  // scrollbar thumb
    const footerText   = isDark ? '#3a5a7a' : '#9ca3af';  // footer text
    const widgetBorder = isDark ? 'rgba(45,90,143,0.35)' : 'rgba(0,0,0,0.07)'; // outer border
    const typingDot    = isDark ? '#4a7aaa' : '#aaa';     // typing indicator dots
    const mutedText    = isDark ? '#6a8aaa' : '#6b7280';  // label/secondary text
    const formShadow   = isDark ? '0 24px 60px rgba(0,0,0,0.55)' : '0 8px 40px rgba(0,0,0,0.18)';

    const style = document.createElement('style');
    style.id = 'echo-widget-styles';
    style.textContent = `
      /* ── Launcher ─────────────────────────────────────────────────────── */
      #echo-launcher {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 62px;
        height: 62px;
        border-radius: 50%;
        background: ${primary};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.28);
        z-index: 99998;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: fixed;
      }
      #echo-launcher:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 28px rgba(0,0,0,0.38);
      }
      #echo-launcher svg { pointer-events: none; }

      /* Pulsing ring — draws attention to the launcher after 3s, repeats every 6s */
      #echo-launcher::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: ${primary};
        opacity: 0;
        animation: echo-launcher-pulse 6s ease-out 3s infinite;
        z-index: -1;
      }
      @keyframes echo-launcher-pulse {
        0%   { transform: scale(1);   opacity: 0.5; }
        100% { transform: scale(1.7); opacity: 0;   }
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
        bottom: 96px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: ${surfaceBg};
        border-radius: 18px;
        border: 1px solid ${widgetBorder};
        box-shadow: ${formShadow};
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 99999;
        opacity: 0;
        transform: translateY(16px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.22s ease, transform 0.22s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #echo-widget.echo-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* ── Header ────────────────────────────────────────────────────────── */
      #echo-header {
        background: ${primary};
        /* Subtle radial sheen in top-right corner for depth */
        background-image: radial-gradient(ellipse at top right, rgba(255,255,255,0.12) 0%, transparent 65%);
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
      }
      #echo-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .echo-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      #echo-header h3 {
        margin: 0;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
      }
      #echo-header p {
        margin: 0;
        color: rgba(255,255,255,0.75);
        font-size: 12px;
      }
      #echo-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.75);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        transition: color 0.15s;
      }
      #echo-close:hover { color: #fff; }

      /* ── Messages area ─────────────────────────────────────────────────── */
      #echo-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: ${msgAreaBg};
      }
      #echo-messages::-webkit-scrollbar { width: 4px; }
      #echo-messages::-webkit-scrollbar-track { background: transparent; }
      #echo-messages::-webkit-scrollbar-thumb { background: ${scrollThumb}; border-radius: 4px; }

      /* Message entry animation */
      @keyframes echo-msg-in {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .echo-msg {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 100%;
        animation: echo-msg-in 0.18s ease;
      }
      .echo-msg.echo-bot  { align-self: flex-start; }
      .echo-msg.echo-user { align-self: flex-end; flex-direction: row-reverse; }

      .echo-bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        max-width: 80%;
        word-break: break-word;
      }
      .echo-bot .echo-bubble {
        background: ${botBubbleBg};
        color: ${botText};
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      }
      .echo-user .echo-bubble {
        background: ${primary};
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      .echo-msg-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${primary};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }

      /* Typing indicator dots */
      .echo-typing span {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: ${typingDot};
        border-radius: 50%;
        margin: 0 1px;
        animation: echo-bounce 1.2s infinite;
      }
      .echo-typing span:nth-child(2) { animation-delay: 0.2s; }
      .echo-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes echo-bounce {
        0%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-6px); }
      }

      /* ── Quick reply chips ─────────────────────────────────────────────── */
      #echo-quick-replies {
        padding: 8px 16px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        background: ${msgAreaBg};
      }
      .echo-qr-btn {
        background: ${qrBg};
        border: 1px solid ${qrBorder};
        color: ${qrText};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12.5px;
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
      }
      .echo-qr-btn:hover {
        border-color: ${primary};
        color: ${primary};
        background: rgba(45,90,143,0.08);
      }

      /* ── Inline forms ──────────────────────────────────────────────────── */
      #echo-form-area {
        padding: 10px 16px;
        background: ${msgAreaBg};
        border-top: 1px solid ${borderColor};
      }
      .echo-inline-form label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: ${mutedText};
        margin-bottom: 3px;
      }
      .echo-inline-form input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid ${inputBorder};
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 6px;
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
        padding: 8px;
        background: ${primary};
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s;
      }
      .echo-btn-primary:hover { opacity: 0.88; }
      .echo-btn-secondary {
        padding: 8px 14px;
        background: transparent;
        color: ${mutedText};
        border: 1px solid ${inputBorder};
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
      }

      /* ── Input row ─────────────────────────────────────────────────────── */
      #echo-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid ${borderColor};
        background: ${surfaceBg};
        flex-shrink: 0;
      }
      #echo-input {
        flex: 1;
        border: 1px solid ${inputBorder};
        border-radius: 22px;
        padding: 9px 14px;
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
        box-shadow: 0 0 0 3px ${primary}22;
      }
      #echo-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${primary};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.15s, transform 0.15s;
      }
      #echo-send:hover { opacity: 0.85; transform: scale(1.05); }

      /* ── Footer ────────────────────────────────────────────────────────── */
      #echo-footer {
        text-align: center;
        padding: 6px;
        font-size: 10.5px;
        color: ${footerText};
        background: ${surfaceBg};
        letter-spacing: 0.03em;
        flex-shrink: 0;
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
              <p>${brandLine}</p>
            </div>
          </div>
          <button id="echo-close" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="echo-messages"></div>

        <div id="echo-quick-replies"></div>

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
    const visitorId = getOrCreateVisitorId();

    const widget = document.getElementById('echo-widget');
    const launcher = document.getElementById('echo-launcher');
    const closeBtn = document.getElementById('echo-close');
    const messagesEl = document.getElementById('echo-messages');
    const inputEl = document.getElementById('echo-input');
    const sendBtn = document.getElementById('echo-send');
    const quickRepliesEl = document.getElementById('echo-quick-replies');
    const formAreaEl = document.getElementById('echo-form-area');

    let chatHistory = [];
    let isOpen = false;
    let hasOpened = false;

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
      quickRepliesEl.innerHTML = '';
    }

    function showQuickReplies(options) {
      clearQuickReplies();
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'echo-qr-btn';
        btn.textContent = opt;
        btn.onclick = () => { clearQuickReplies(); sendMessage(opt); };
        quickRepliesEl.appendChild(btn);
      });
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
        if (!name || !email) return;

        formAreaEl.style.display = 'none';
        formAreaEl.innerHTML = '';
        addMsg(`Thanks ${name}! We'll be in touch at ${email} shortly.`, 'bot');

        try {
          await fetch(`${workerUrl}/lead-capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ name, email, phone, client_id: clientId, visitor_id: visitorId, source: 'chat_widget' }),
          });
        } catch (e) { /* best effort */ }
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

        formAreaEl.style.display = 'none';
        formAreaEl.innerHTML = '';
        addMsg(`Got it ${name}! We've created a support ticket and you'll hear from us at ${email} soon.`, 'bot');

        try {
          await fetch(`${workerUrl}/escalation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ name, email, phone, client_id: clientId, visitor_id: visitorId }),
          });
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
            client_id: clientId,
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
      const res = await fetch(WIDGET_CONFIG_URL);
      if (!res.ok) throw new Error('Config fetch failed');
      const cfg = await res.json();
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
