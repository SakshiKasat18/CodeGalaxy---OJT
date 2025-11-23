// Simple Node.js server to serve static HTML files
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Default to index.html for root path
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  // Get file extension
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  // Read and serve the file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌌 CodeGalaxy server running at http://localhost:${PORT}`);
  console.log(`📂 Serving static files from: ${__dirname}`);
  console.log('\nOpen these pages in your browser:');
  console.log(`  • Home: http://localhost:${PORT}/index.html`);
  console.log(`  • Timer: http://localhost:${PORT}/timer.html`);
  console.log(`  • Dashboard: http://localhost:${PORT}/dashboard.html`);
});