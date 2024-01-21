const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3443;

// HTTP 리디렉션 설정
app.use((req, res, next) => {
  if (req.secure) {
    next();
  } else {
    res.redirect(`https://${req.headers.host}${req.url}`);
  }
});

// 정적 파일 서비스 설정 (public 폴더에 정적 파일을 넣어주세요)
app.use(express.static('public'));

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/cert.pem'),
};

const server = https.createServer(options, app);

server.listen(port, () => {
  console.log(`Server is running on https://localhost:${port}`);
});
