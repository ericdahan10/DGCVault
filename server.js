const express = require('express');
const path = require('path');

const app = express();

// Serve widget.js and any other static assets from /public
// widget.js will be available at https://vault.dahangroup.io/widget.js
app.use(express.static(path.join(__dirname, 'public')));

// All other routes → vault.html (single-page app pattern)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vault.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VAULT running on port ${PORT}`);
});
