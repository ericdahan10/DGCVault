const express = require('express');
const path = require('path');

const app = express();

// Serve widget.js and any other static assets from /public
// widget.js will be available at https://vault.dahangroup.io/widget.js
// Static files take precedence — e.g. beflex-demo.html is served as-is
app.use(express.static(path.join(__dirname, 'public')));

const WORKER_URL = 'https://dgc-chat-api.ericdahan10.workers.dev';

// ── Dynamic demo pages ──────────────────────────────────────────────────────
// GET /clients/:slug-demo.html — generates a branded demo page on the fly.
// Static files (e.g. public/clients/beflex-demo.html) are served first by
// express.static above, so custom pages are never overridden.
app.get('/clients/:name', async (req, res) => {
  const match = req.params.name.match(/^(.+)-demo\.html$/);
  if (!match) return res.status(404).send('Not found');
  const slug = match[1];

  // Fetch client config from the worker (same source vault.html uses)
  let cfg = {};
  try {
    const r = await fetch(`${WORKER_URL}/widget-config?client_id=${encodeURIComponent(slug)}`);
    if (r.ok) cfg = await r.json();
  } catch (_) { /* fall through to defaults */ }

  const displayName = cfg.display_name || slug;
  const primaryColor = cfg.primary_color || '#4a8ac7';
  const greeting = cfg.greeting || `Hi! I'm the ${displayName} AI assistant.`;

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${displayName} — AI Assistant Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --primary: ${primaryColor}; }
    body { font-family: "Inter", system-ui, sans-serif; background: #0f0f0f; color: rgba(255,255,255,0.87); min-height: 100vh; }
    .dgc-banner { background: var(--primary); color: #fff; font-size: 11px; font-weight: 700; text-align: center; padding: 6px 16px; letter-spacing: 0.04em; }
    nav { height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; background: rgba(15,15,15,0.95); border-bottom: 1px solid #222; }
    .nav-logo { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
    .nav-cta { background: var(--primary); color: #fff; border: none; border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
    .hero { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 100px 24px 80px; gap: 24px; }
    .hero h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
    .hero h1 span { color: var(--primary); }
    .hero p { font-size: 18px; color: rgba(255,255,255,0.55); max-width: 560px; line-height: 1.6; }
    .hero-cta { background: var(--primary); color: #fff; border: none; border-radius: 10px; padding: 14px 32px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; padding: 60px 48px; max-width: 1100px; margin: 0 auto; }
    .feature-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px; }
    .feature-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .feature-card p { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }
    footer { text-align: center; padding: 40px 24px; font-size: 12px; color: #444; border-top: 1px solid #1a1a1a; }
  </style>
</head>
<body>
  <div class="dgc-banner">⚡ AI-powered demo · Built by Dahan Group Consulting</div>
  <nav>
    <div class="nav-logo">${displayName}</div>
    <button class="nav-cta" onclick="window.__ECHO_WIDGET_OPEN__ && window.__ECHO_WIDGET_OPEN__()">Chat with AI →</button>
  </nav>
  <section class="hero">
    <h1>Meet your <span>${displayName}</span><br>AI Assistant</h1>
    <p>${greeting}</p>
    <button class="hero-cta" onclick="window.__ECHO_WIDGET_OPEN__ && window.__ECHO_WIDGET_OPEN__()">Start chatting →</button>
  </section>
  <div class="features">
    <div class="feature-card"><h3>💬 Instant answers</h3><p>Responds to questions 24/7 with accurate, context-aware replies.</p></div>
    <div class="feature-card"><h3>🎯 Lead capture</h3><p>Collects contact details and routes them to your CRM or inbox.</p></div>
    <div class="feature-card"><h3>⚡ Always on</h3><p>No wait times. Handles multiple visitors simultaneously.</p></div>
  </div>
  <footer>© ${new Date().getFullYear()} ${displayName} · Demo powered by <a href="https://dahangroup.com" style="color:var(--primary);text-decoration:none;">DGC</a></footer>
  <script src="/widget.js" data-client-id="${slug}"></script>
</body>
</html>`);
});

// All other routes → vault.html (single-page app pattern)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vault.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VAULT running on port ${PORT}`);
});
