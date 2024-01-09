const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 9999;

// JSON 파싱 미들웨어 설정
app.use(bodyParser.json());

// POST 요청 처리
app.post('/github-webhook', (req, res) => {
  const eventData = req.body;

  // 웹훅 이벤트를 처리하고 원하는 작업을 수행하세요.
  // 이벤트 데이터는 eventData 변수에 있습니다.

  console.log('GitHub 웹훅 이벤트 수신:', eventData);

  // 응답 보내기 (필요에 따라 처리 후 응답할 수 있음)
  res.status(200).send('웹훅 이벤트 수신 완료');
});

// 서버 시작
app.listen(port, () => {
  console.log(`Express 서버가 포트 ${port}에서 실행 중입니다.`);
});