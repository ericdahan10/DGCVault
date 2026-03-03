/**
 * ECHO Widget — DGC Dahan Group Consulting
 * Embeddable chat widget, delivered from vault.dahangroup.io
 *
 * Usage on any website:
 *   <script src="https://vault.dahangroup.io/widget.js" data-client-id="your-client-id"></script>
 *
 * The widget fetches its config (colors, greeting, API endpoint) from the Worker
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

  // ─── Inject CSS ────────────────────────────────────────────────────────────
  function injectStyles(cfg) {
    const primary = cfg.primary_color || '#2d5a8f';
    const style = document.createElement('style');
    style.id = 'echo-widget-styles';
    style.textContent = `
      #echo-launcher {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primary};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        z-index: 99998;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #echo-launcher:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 28px rgba(0,0,0,0.32);
      }
      #echo-launcher svg { pointer-events: none; }

      #echo-widget {
        position: fixed;
        bottom: 96px;
        right: 24px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18);
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

      #echo-header {
        background: ${primary};
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
        background: rgba(255,255,255,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
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
        color: rgba(255,255,255,0.8);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        transition: color 0.15s;
      }
      #echo-close:hover { color: #fff; }

      #echo-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: #f8f9fb;
      }
      #echo-messages::-webkit-scrollbar { width: 4px; }
      #echo-messages::-webkit-scrollbar-track { background: transparent; }
      #echo-messages::-webkit-scrollbar-thumb { background: #d0d5dd; border-radius: 4px; }

      .echo-msg {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        max-width: 100%;
      }
      .echo-msg.echo-bot { align-self: flex-start; }
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
        background: #fff;
        color: #1a1a2e;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }
      .echo-user .echo-bubble {
        background: ${primary};
        color: #fff;
        border-bottom-right-radius: 4px;
      }

      .echo-msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${primary};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        flex-shrink: 0;
      }

      .echo-typing span {
        display: inline-block;
        width: 6px;
        height: 6px;
        background: #aaa;
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

      #echo-quick-replies {
        padding: 8px 16px 0;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        background: #f8f9fb;
      }
      .echo-qr-btn {
        background: #fff;
        border: 1px solid #d0d5dd;
        color: #374151;
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
        background: rgba(45,90,143,0.05);
      }

      #echo-form-area {
        padding: 10px 16px;
        background: #f8f9fb;
        border-top: 1px solid #e5e7eb;
      }
      .echo-inline-form label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 3px;
      }
      .echo-inline-form input {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 13px;
        margin-bottom: 6px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.15s;
      }
      .echo-inline-form input:focus { border-color: ${primary}; }
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
        color: #6b7280;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
      }

      #echo-input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        background: #fff;
        flex-shrink: 0;
      }
      #echo-input {
        flex: 1;
        border: 1px solid #d0d5dd;
        border-radius: 22px;
        padding: 9px 14px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        transition: border-color 0.15s;
        resize: none;
      }
      #echo-input:focus { border-color: ${primary}; }
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
        transition: opacity 0.15s;
      }
      #echo-send:hover { opacity: 0.85; }

      #echo-footer {
        text-align: center;
        padding: 6px;
        font-size: 10.5px;
        color: #9ca3af;
        background: #fff;
        letter-spacing: 0.03em;
        flex-shrink: 0;
      }

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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <!-- Chat panel -->
      <div id="echo-widget" role="dialog" aria-label="${name} chat" aria-hidden="true">
        <div id="echo-header">
          <div id="echo-header-left">
            <div class="echo-avatar">💬</div>
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
          <div class="echo-msg-avatar">💬</div>
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
        <div class="echo-msg-avatar">💬</div>
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

        // Send lead to worker
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

        // Handle routing hints from worker
        if (routing.action === 'escalation') {
          showEscalationForm();
        } else if (routing.action === 'contact') {
          showContactForm();
        } else {
          // Show contextual quick replies
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

    // Close on Escape
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
      // Fallback to DGC defaults so the widget never silently breaks
      console.warn('[ECHO widget] Could not load config, using defaults.', err);
      const defaults = {
        display_name: 'ECHO',
        brand_line: 'AI Assistant',
        greeting: "Hi! I'm ECHO. How can I help you today?",
        primary_color: '#2d5a8f',
        api_key: '',
        worker_url: WORKER_URL,
      };
      injectStyles(defaults);
      injectHTML(defaults);
      initChat(defaults);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
