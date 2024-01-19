// webhook.js
const express = require('express');
const dotenv = require('dotenv'); // dotenv 라이브러리 추가
const crypto = require('crypto');
const { exec } = require('child_process');
const router = express.Router();
dotenv.config(); // 환경 변수 로드
router.use(express.json());
router.post('/webhook', (req, res) => {
    const secret = "73025532"; // GitHub 웹훅 시크릿 키
    const eventType = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature'];

    if (validateSignature(req.body, secret, signature)) {
        if (eventType === 'push') {
            // GitHub에서 푸시 이벤트를 받으면 Jenkins 파이프라인을 실행..
            exec('cd /home/ec2-user/searchapps && git pull origin main', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing git pull: ${error}`);
                    res.status(500).send('Internal Server Error');
                } else {
                    console.log('Git pull executed successfully');
                    res.status(200).send('OK');
                }
            });
        } else {
            console.log(`Received unsupported GitHub event: ${eventType}`);
            res.status(400).send('Bad Request');
        }
    } else {
        console.log('Invalid GitHub webhook signature');
        res.status(401).send('Unauthorized');
    }
});

function validateSignature(body, secret, signature) {
    const hash = crypto.createHmac('sha1', secret).update(JSON.stringify(body)).digest('hex');
    const expectedSignature = `sha1=${hash}`;

    // GitHub에서 전달된 서명 값
    const githubSignature = signature.replace(/^sha1=/, '');

    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(githubSignature));
}

module.exports = router;
