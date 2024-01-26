const {google} = require('googleapis');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv'); // dotenv 라이브러리 추가
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const cors = require('cors');
const express = require('express');
const path = require('path');
const app = express();
// CORS 미들웨어 활성화
app.use(cors());
app.use(express.json());
dotenv.config(); // 환경 변수 로드
// 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Gmail을 사용하는 경우
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_USER, // Gmail 이메일
        pass: process.env.GMAIL_PASS, // Gmail 비밀번호
    },
});

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY // 여기에 획득한 API 키를 입력합니다.
});

async function createDatabaseConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
}

app.get('/youtube/search', async (req, res) => {
    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: req.query.q,  // 쿼리 파라미터에서 검색어(q)를 읽어옵니다.
            maxResults: 10
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// 타이틀 저장 API
// 타이틀 저장 또는 업데이트 API
app.post('/api/save-title', async (req, res) => {
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        const user_id = req.body.user_id;
        const title = req.body.title;
        const keyword = req.body.keyword;
        const id = req.body.id; // 추가: id를 요청에서 받음

        if (id) {
            // id가 제공된 경우, 해당 id에 대한 title을 업데이트
            const updateQuery = 'UPDATE video SET title = ?,keyword = ? WHERE id = ?';
            const [updateResults] = await connection.execute(updateQuery, [title,keyword, id]);

            if (updateResults.affectedRows === 0) {
                res.status(404).json({error: 'Title not found for the provided id'});
            } else {
                console.log('Title updated successfully');
                res.status(200).json({message: '성공적으로 저장 되었습니다.'});
            }
        } else {
            // id가 제공되지 않은 경우, 새로운 데이터 삽입
            const insertQuery = 'INSERT INTO video (user_id, title,keyword) VALUES (?, ?, ?)';
            const [insertResults] = await connection.execute(insertQuery, [user_id, title,keyword]);

            console.log('Title saved successfully');
            res.status(200).json({message: '성공적으로 저장 되었습니다.'});
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});
//작업 스케쥴러
// POST 요청 핸들러
app.post('/api/create-run-task', async (req, res) => {
    const { email } = req.body;
    const { use_random_play } = req.body;
    const { use_filter } = req.body;
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        // 이메일로 검색한 사용자의 video 중 use_status_cd가 1인 비디오 가져오기
        const [videoRows] = await connection.execute('SELECT id FROM video WHERE user_id = ? AND use_status_cd = 1', [email]);
        const videoId = videoRows[0].id;

        const [videoTaskRows] = await connection.execute('SELECT id FROM video WHERE user_id = ? ', [email]);
        // //다음 작업이 들어오면 타스크 종료
        // videoRows에서 각 video.id에 대해 업데이트를 수행
        for (const row of videoTaskRows) {
            const videoId = row.id;

            // 다음 작업이 들어오면 타스크 종료
            const updateQuery = 'UPDATE run_task SET run_status_cd = ? WHERE video_id = ?';
            const [updateResults] = await connection.execute(updateQuery, [1, videoId]);
        }
        // run_task 테이블에 새로운 row 생성 (video_id, run_status_cd)
        const insertQuery = 'INSERT INTO run_task (video_id, run_status_cd,use_random_play,use_filter) VALUES (?, ?, ?, ?)';
        await connection.execute(insertQuery, [videoId, 0,use_random_play,use_filter]);

        console.log('Run task created successfully');
        res.status(200).json({ message: 'Run task created successfully' });

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '서버 내부 오류' });
    }
});
app.delete('/api/delete-video/:id', async (req, res) => {
    const id = req.params.id;

    if (!id) {
        res.status(400).json({ error: 'Video ID is missing' });
        return;
    }

    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        // video 삭제 쿼리 실행
        const deleteQuery = 'DELETE FROM video WHERE id = ?';
        const [deleteResults] = await connection.execute(deleteQuery, [id]);

        if (deleteResults.affectedRows === 0) {
            res.status(404).json({ error: 'Video not found for the provided ID' });
        } else {
            console.log('Video deleted successfully');
            res.status(200).json({ message: 'Video deleted successfully' });
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// 타이틀 검색 API
app.get('/api/search-title', async (req, res) => {
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        const getIdQuery = 'SELECT id,video_id,run_status_cd,use_random_play FROM run_task WHERE run_status_cd = ?';
        const [getIdResults] = await connection.execute(getIdQuery, [0]);

        if (getIdResults.length === 0) {
            res.status(404).json({ error: 'Run task with run_status_cd=0 not found' });
            return;
        }

        const id = getIdResults[0].video_id;
        const query = 'SELECT title, keyword FROM video WHERE id = ?';

        // 데이터베이스 쿼리 실행
        const [results] = await connection.execute(query, [id]);
        const responseDataArray = [];
        if (results.length > 0) {
            responseDataArray.push(
                {
                    use_random_play: getIdResults[0].use_random_play,
                }
            );
            responseDataArray.push(
                {
                    use_random_play: getIdResults[0].use_random_play,
                    // use_filter: getIdResults[0].use_filter,
                    // title : results[0].title,
                    // keword : results[0].keword
                }
            );
            res.status(200).json(responseDataArray);
        } else {
            res.status(404).json({ error: 'Title not found' });
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error searching title:', error);
        res.status(500).json({ error: 'Error searching title' });
    }
});
//관리자용
app.get('/api/search-title-for-admin', async (req, res) => {
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        const query = 'SELECT title, keyword FROM video WHERE use_status_cd = ? and user_id= ?';

        // 데이터베이스 쿼리 실행
        const [results] = await connection.execute(query, [1,'majorsafe4@gmail.com']);

        if (results.length > 0) {

            console.log('Title search successful');
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ error: 'Title not found' });
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error searching title:', error);
        res.status(500).json({ error: 'Error searching title' });
    }
});
//video title 사용 여부 갱신
app.post('/api/use-status-change', async (req, res) => {
    const id = req.body.id;

    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        // 이미 use_status_cd가 1이었던 row를 0으로 업데이트
        const updateZeroQuery = 'UPDATE video SET use_status_cd = 0 WHERE use_status_cd = 1';
        await connection.execute(updateZeroQuery);

        // 입력받은 id와 일치하는 row의 use_status_cd를 1로 업데이트
        const updateOneQuery = 'UPDATE video SET use_status_cd = 1 WHERE id = ?';
        const [updateResults] = await connection.execute(updateOneQuery, [id]);

        if (updateResults.affectedRows === 0) {
            // 일치하는 id를 찾지 못한 경우
            res.status(404).json({error: '일치하는 ID를 찾을 수 없습니다.'});
        } else {
            console.log('Records updated successfully');
            res.status(200).json({message: 'Records updated successfully'});
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error updating records:', error);
        res.status(500).json({error: 'Error updating records'});
    }
});
// 모든 레코드 리스트 가져오는 API
app.post('/api/get-all-records', async (req, res) => {
    const user_id = req.body.user_id;
    const title = req.body.title;
    const keyword = req.body.keyword;
    const id = req.body.id; // 추가: id를 요청에서 받음
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        // 데이터베이스 쿼리 실행
        const [results] = await connection.execute('SELECT id, title,keyword, reg_date, use_status_cd FROM video where user_id=?',[user_id]);

        console.log('Records fetched successfully');
        res.status(200).json(results);

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({error: 'Error fetching records'});
    }
});

// POST 요청 핸들러
app.post('/api/send-verification-email', async (req, res) => {
    try {
        const { email } = req.body;

        const emailSent = await sendVerificationEmail(email);

        if (emailSent) {
            res.status(200).json({ message: '이메일 인증 보안문자 전송이 완료되었습니다.' });
        } else {
            res.status(500).json({ error: '이메일 전송 실패' });
        }
    } catch (error) {
        console.error('오류:', error);
        res.status(500).json({ error: error.message || '서버 내부 오류' });
    }
});

async function sendVerificationEmail(email, authCode) {
    try {
        // 새로운 MySQL 연결 생성
        const connection = await createDatabaseConnection();

        // 중복된 이메일 확인
        const [duplicateEmailRows] = await connection.execute('SELECT COUNT(*) as count FROM user WHERE email = ?', [email]);
        if (duplicateEmailRows[0].count > 0) {
            throw new Error('중복된 이메일이 발견되었습니다.');
        }

        // 랜덤한 코드 생성
        const authCode = Math.random().toString(36).substring(2, 14);

        // 코드 해싱
        const hashedAuthCode = await bcrypt.hash(authCode, 10);

        // 이메일 옵션
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: '인증 코드',
            text: `인증 코드: ${authCode}`,
        };

        // 이메일 보내기
        const emailInfo = await transporter.sendMail(mailOptions);

        // 사용자 테이블에 이메일 및 해싱된 코드 저장
        const [insertUserResult] = await connection.execute('INSERT INTO user (user_id, email,password) VALUES (?, ?,?)', [email, email, hashedAuthCode]);
        const userId = insertUserResult.insertId;

        // user_auth 테이블에 데이터 저장
        await connection.execute('INSERT INTO user_auth (user_table_id, email, auth_code, status_cd) VALUES (?, ?, ?, ?)', [userId, email, hashedAuthCode, 0]);

        // MySQL 연결 닫기
        await connection.end();

        console.log('이메일 전송 성공:', emailInfo.response);
        console.log('이메일 및 인증 코드가 성공적으로 저장되었습니다.');
        return true;
    } catch (error) {
        console.error('오류:', error);
        throw error; // 오류를 상위 핸들러로 다시 던집니다.
    }
}

// API 엔드포인트 '/api/user-register'를 생성
app.post('/api/user-register', async (req, res) => {
    const { email, authCode } = req.body;

    try {
        // MySQL 연결 생성
        const connection = await createDatabaseConnection();

        // 이메일로 사용자 검색
        const [userRows] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);

        if (userRows.length === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        const user = userRows[0];

        // user.id로 user_auth 테이블에서 사용자 검색
        const [userAuthRows] = await connection.execute('SELECT * FROM user_auth WHERE user_table_id = ?', [user.id]);

        if (userAuthRows.length === 0) {
            throw new Error('이미 회원 가입이 완료된 사용자입니다.');
        }

        const userAuth = userAuthRows[0];
        // 이미 인증된 사용자인지 확인
        if (userAuth.status_cd === 1) {
             res.status(200).json({message: '이미 인증이 완료된 사용자입니다.'});
        }else{
             // bcrypt를 사용하여 인증 코드 비교
            const isAuthCodeMatch = await bcrypt.compare(authCode, userAuth.auth_code);
            if (!isAuthCodeMatch) {
                const AuthMessage = "인증 코드가 일치하지 않습니다."
                res.status(400).json({message: AuthMessage});
            } else {
                // status_cd를 1로 업데이트
                await connection.execute('UPDATE user_auth SET status_cd = 1 WHERE user_table_id = ?', [user.id]);
                // 연결 종료
                await connection.end();
                res.status(200).json({message: '회원가입이 완료되었습니다. 초기 비밀번호는 이메일 인증 코드 입니다.'});
            }
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(400).json({ message: error.message || '회원가입에 실패하였습니다.' });
    }
});
// POST 요청 핸들러 - 로그인 API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // MySQL 연결 생성
        const connection = await createDatabaseConnection();

        // 사용자 이메일로 데이터베이스에서 사용자 정보를 검색
        const [userRows] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);

        if (userRows.length === 0) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        const user = userRows[0];

        // user.id로 user_auth 테이블에서 사용자 인증 정보 검색
        const [userAuthRows] = await connection.execute('SELECT * FROM user_auth WHERE user_table_id = ?', [user.id]);

        if (userAuthRows.length === 0) {
            throw new Error('사용자 인증 정보를 찾을 수 없습니다.');
        }

        const userAuth = userAuthRows[0];

        // bcrypt를 사용하여 비밀번호 비교
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        // 연결 종료
        await connection.end();

        res.status(200).json({ message: '로그인이 성공하였습니다.' });
    } catch (error) {
        console.error('오류:', error);
        res.status(401).json({ error: error.message || '로그인에 실패하였습니다.' });
    }
});
// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});
// Include the webhook router
const webhookRouter = require('./webhook/webhook.js');
// Use the webhook router for the '/webhook' endpoint
app.use('/', webhookRouter);


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

