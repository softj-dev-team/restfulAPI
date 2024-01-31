const http = require('http');
const httpProxy = require('http-proxy');

// 프록시 서버 생성
const proxy = httpProxy.createProxyServer({});

// 프록시 서버를 15222 포트에서 실행
const server = http.createServer((req, res) => {
  // 클라이언트 요청의 호스트 헤더를 사용하여 타겟 설정
  const target = `http://${req.headers.host}`;

  // 요청을 목적지로 우회
  proxy.web(req, res, { target: target, changeOrigin: true });
});

server.listen(15222, () => {
  console.log('프록시 서버가 포트 15222에서 실행 중입니다.');
});
