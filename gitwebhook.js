const express = require('express');
const bodyParser = require('body-parser');
const createHandler = require('github-webhook-handler');
const { exec } = require('child_process');

const app = express();
const port = 9999;
const secret = '73025532'; // GitHub 웹훅 시크릿 설정
const crypto = require('crypto');
// JSON 파싱 미들웨어 설정
app.use(bodyParser.json());

// GitHub 웹훅 핸들러 생성
const handler = createHandler({ path: '/github-webhook', secret: secret });

// POST 요청 처리
app.post('/github-webhook', (req, res) => {

  handler(req, res, (err) => {
    if (err) {
      console.error('Error handling webhook:', err.message);
      return res.status(500).send('Webhook Error');
    }
    res.status(200).send('Webhook Received');
  });
});

// main 브랜치 업데이트 이벤트 리스너
handler.on('push', (event) => {
  const payload = event.payload;
// 웹훅 요청의 본문과 X-Hub-Signature 헤더 가져오기
const body = req.body;
const signature = req.headers['x-hub-signature'];

// 본문을 HMAC-SHA1으로 서명
const expectedSignature = `sha1=${crypto.createHmac('sha1', secret).update(JSON.stringify(body)).digest('hex')}`;

// 서명 검증
if (signature !== expectedSignature) {
  return res.status(400).send('X-Hub-Signature does not match blob signature');
}
  if (payload.ref === 'refs/heads/main') {
    console.log('main 브랜치에 변경사항이 있습니다. 업데이트를 수행합니다.');

    // main 브랜치 업데이트를 처리하는 코드 추가
    exec('git pull origin main', (error, stdout, stderr) => {
      if (error) {
        console.error('업데이트 중 에러 발생:', error);
        return;
      }
      console.log('업데이트 완료:', stdout);
    });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`Express 서버가 포트 ${port}에서 실행 중입니다.`);
});
//test 5