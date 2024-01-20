
const { google } = require('googleapis');
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
        user:  process.env.GMAIL_USER, // Gmail 이메일
        pass:  process.env.GMAIL_PASS, // Gmail 비밀번호
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
        const id = req.body.id; // 추가: id를 요청에서 받음

        if (id) {
            // id가 제공된 경우, 해당 id에 대한 title을 업데이트
            const updateQuery = 'UPDATE video SET title = ? WHERE id = ?';
            const [updateResults] = await connection.execute(updateQuery, [title, id]);

            if (updateResults.affectedRows === 0) {
                res.status(404).json({ error: 'Title not found for the provided id' });
            } else {
                console.log('Title updated successfully');
                res.status(200).json({ message: 'Title updated successfully' });
            }
        } else {
            // id가 제공되지 않은 경우, 새로운 데이터 삽입
            const insertQuery = 'INSERT INTO video (user_id, title) VALUES (?, ?)';
            const [insertResults] = await connection.execute(insertQuery, [user_id, title]);

            console.log('Title saved successfully');
            res.status(200).json({ message: 'Title saved successfully' });
        }

        // 연결 종료
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 타이틀 검색 API
app.get('/api/search-title/:id', async (req, res) => {
    try {
        // 데이터베이스 연결 생성
        const connection = await createDatabaseConnection();

        const id = req.params.id;
        const query = 'SELECT title FROM video WHERE id = ?';

        // 데이터베이스 쿼리 실행
        const [results] = await connection.execute(query, [id]);

        if (results.length > 0) {
            const title = results[0].title;
            console.log('Title search successful');
            res.status(200).json({ title });
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

// 모든 레코드 리스트 가져오는 API
app.get('/api/get-all-records', (req, res) => {
  // 데이터베이스에서 모든 레코드 가져오기
  const query = 'SELECT id, title, reg_date FROM video';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching records:', error);
      res.status(500).json({ error: 'Error fetching records' });
    } else {
      console.log('Records fetched successfully');
      res.status(200).json(results);
    }
  });
});
// POST 요청 핸들러
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { email } = req.body;

    // 랜덤한 코드 생성
    const authCode = Math.random().toString(36).substring(2, 14);

    // 코드 해싱
    const hashedAuthCode = await bcrypt.hash(authCode, 10);

    // 이메일 전송
    const mailOptions = {
      from:  process.env.GMAIL_USER,
      to: email,
      subject: '인증 코드',
      text: `인증 코드: ${authCode}`,
    };
    // 이메일 중복 확인 쿼리
    const checkDuplicateEmailQuery = 'SELECT COUNT(*) as count FROM user WHERE email = ?';
    // 먼저 중복된 이메일 주소가 있는지 확인
    connection.query(checkDuplicateEmailQuery, [email], (checkError, checkResults) => {
        if (checkError) {
            console.error('Error checking duplicate email:', checkError);
            res.status(500).json({ error: 'Error checking duplicate email' });
        } else {
            // 중복된 이메일이 없으면 새로운 사용자 등록 진행
            if (checkResults[0].count === 0) {

                // 나머지 코드 및 이메일 전송 코드 추가
                transporter.sendMail(mailOptions, (emailError, emailInfo) => {
                    if (emailError) {
                        console.error('Error sending email:', emailError);
                        res.status(500).json({error: 'Error sending email'});
                    } else {
                        console.log('Email sent:', emailInfo.response);

                        // 이메일 전송이 성공하면 user 테이블에 이메일 저장
                        const insertQuery = 'INSERT INTO user (email,user_id,password) VALUES (?,?,?)';
                        connection.query(insertQuery, [email, email, hashedAuthCode], (insertError, insertResults) => {
                            if (insertError) {
                                console.error('Error saving email:', insertError);
                                res.status(500).json({error: 'Error saving email'});
                            } else {
                                // user_auth 테이블에도 저장
                                const userId = insertResults.insertId;
                                const insertAuthQuery = 'INSERT INTO user_auth (user_table_id, email, auth_code,status_cd) VALUES (?, ?, ?, ?)';
                                connection.query(insertAuthQuery, [userId, email, authCode,0], (authInsertError, authInsertResults) => {
                                    if (authInsertError) {
                                        console.error('Error saving auth code:', authInsertError);
                                        res.status(500).json({error: 'Error saving auth code'});
                                    } else {
                                        console.log('Email and auth code saved successfully');
                                        res.status(200).json({message: '이메일 인증 보안문자 전송이 완료되었습니다.'});
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                // 중복된 이메일이 있는 경우 예외 처리
                console.error('Duplicate email found:', email);
                res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
            }
        }
    });


  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// API 엔드포인트 '/api/user-register'를 생성
app.post('/api/user-register', async (req, res) => {
  const { email, authCode } = req.body;

  try {
    // MySQL 연결 생성
    // const connection = await mysql.createConnection(connectionConfig);

    // 이메일로 사용자 검색
    const [userRows] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);

    if (userRows.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const user = userRows[0];

    // user.id로 user_auth 테이블에서 사용자 검색
    const [userAuthRows] = await connection.execute('SELECT * FROM user_auth WHERE user_table_id = ?', [user.id]);

    if (userAuthRows.length === 0) {
      throw new Error('사용자 인증 정보를 찾을 수 없습니다.');
    }

    const userAuth = userAuthRows[0];

    // bcrypt를 사용하여 인증 코드 비교
    const isAuthCodeMatch = await bcrypt.compare(authCode, userAuth.auth_code);

    if (!isAuthCodeMatch) {
      throw new Error('인증 코드가 일치하지 않습니다.');
    }

    // status_cd를 1로 업데이트
    await connection.execute('UPDATE user_auth SET status_cd = 1 WHERE user_table_id = ?', [user.id]);

    // 연결 종료
    await connection.end();

    res.status(200).json({ message: '회원가입이 완료되었습니다.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ message: '회원가입에 실패하였습니다.' });
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

