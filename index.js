const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const unblocker = require('unblocker');
const http = require('http');

const app = express();
http.createServer((req, res) => {
  res.writeHead(301, {
    Location: 'https://' + req.headers.host + req.url
  });
  res.end();
}).listen(80, () => {
  console.log('🚀 HTTP redirect server listening on port 80');
});

// unblocker のプロキシ設定（302リダイレクト先を書き換え）
const proxy = unblocker({
  prefix: '/proxy',
  responseMiddleware: [
    // data: { url, res, ... }
    async (data) => {
      const headers = data.res && data.res.headers;
      const location = headers && headers.location;
      if (data.res && data.res.statusCode >= 300 && data.res.statusCode < 400 && location) {
        try {
          // 相対パスにも対応
          const target = new URL(location, data.url);
          headers.location = `/proxy/${target.href}`;
        } catch (e) {
          // 無効なURLは無視
        }
      }
    }
  ],
  errorHandler: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('プロキシエラー');
  }
});
app.use(proxy);

// ルートアクセスで index.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// HTTPS
const credentials = {
  key: fs.readFileSync('/etc/letsencrypt/live/siawaseok.duckdns.org/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/siawaseok.duckdns.org/fullchain.pem')
};

// HTTPSサーバー起動
https.createServer(credentials, app).listen(443, () => {
  console.log('✅ HTTPSサーバーが起動しました');
});

