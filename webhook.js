// webhook.js
const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
dotenv.config(); // 환경 변수 로드
router.use(express.json());

router.post('/webhook', (req, res) => {
    const secret = process.env.GIGHUB_SECRET; // GitHub 웹훅 시크릿 키
    const eventType = req.headers['x-github-event'];
    const signature = req.headers['x-hub-signature'];

    if (validateSignature(req.body, secret, signature)) {
        if (eventType === 'push') {
            // GitHub에서 푸시 이벤트를 받으면 Jenkins 파이프라인을 실행
            exec('curl http://localhost:8080/job/your-job-name/build', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Jenkins pipeline: ${error}`);
                    res.status(500).send('Internal Server Error');
                } else {
                    console.log('Jenkins pipeline triggered successfully');
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
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha1', secret).update(JSON.stringify(body)).digest('hex');
    const expectedSignature = `sha1=${hash}`;
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

module.exports = router;
