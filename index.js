const express = require('express');
const path = require('path');
const unblocker = require('unblocker');

const app = express();
const PORT = process.env.PORT || 3000;

const proxy = unblocker({
  prefix: '/proxy',
  responseMiddleware: [
    async (data) => {
      const headers = data.res?.headers;
      const location = headers?.location;
      if (data.res && data.res.statusCode >= 300 && data.res.statusCode < 400 && location) {
        try {
          const target = new URL(location, data.url);
          headers.location = `/proxy/${target.href}`;
        } catch (e) {}
      }
    }
  ],
  errorHandler: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('プロキシエラー');
  }
});
app.use(proxy);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ サーバーが起動しました (PORT=${PORT})`);
});
