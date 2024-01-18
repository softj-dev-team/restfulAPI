const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const dotenv = require('dotenv'); // dotenv 라이브러리 추가
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
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

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};
const connection = mysql.createConnection(dbConfig);

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
app.post('/api/save-title', (req, res) => {
    const user_id = req.body.user_id;
    const title = req.body.title;
    const id = req.body.id; // 추가: id를 요청에서 받음

    // 이미 있는 id와 title이 전송되면 해당 row를 업데이트, 아닌 경우 삽입
    if (id) {
        // id가 제공된 경우, 해당 id에 대한 title을 업데이트
        const updateQuery = 'UPDATE video SET title = ? WHERE id = ?';
        connection.query(updateQuery, [title, id], (updateError, updateResults) => {
            if (updateError) {
                console.error('Error updating title:', updateError);
                res.status(500).json({ error: 'Error updating title' });
            } else {
                if (updateResults.affectedRows === 0) {
                    res.status(404).json({ error: 'Title not found for the provided id' });
                } else {
                    console.log('Title updated successfully');
                    res.status(200).json({ message: 'Title updated successfully' });
                }
            }
        });
    } else {
        // id가 제공되지 않은 경우, 새로운 데이터 삽입
        const insertQuery = 'INSERT INTO video (user_id, title) VALUES (?, ?)';
        connection.query(insertQuery, [user_id, title], (insertError, insertResults) => {
            if (insertError) {
                console.error('Error saving title:', insertError);
                res.status(500).json({ error: 'Error saving title' });
            } else {
                console.log('Title saved successfully');
                res.status(200).json({ message: 'Title saved successfully' });
            }
        });
    }
});
// 타이틀 검색 API
app.get('/api/search-title/:id', (req, res) => {
    const id = req.params.id;

    // 데이터베이스에서 id에 해당하는 title 검색
    const query = 'SELECT title FROM video WHERE id = ?';
    connection.query(query, [id], (error, results) => {
        if (error) {
            console.error('Error searching title:', error);
            res.status(500).json({ error: 'Error searching title' });
        } else {
            if (results.length > 0) {
                const title = results[0].title;
                console.log('Title search successful');
                res.status(200).json({ title });
            } else {
                res.status(404).json({ error: 'Title not found' });
            }
        }
    });
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
                      const insertAuthQuery = 'INSERT INTO user_auth (user_table_id, email, auth_code) VALUES (?, ?, ?)';
                      connection.query(insertAuthQuery, [userId, email, authCode], (authInsertError, authInsertResults) => {
                          if (authInsertError) {
                              console.error('Error saving auth code:', authInsertError);
                              res.status(500).json({error: 'Error saving auth code'});
                          } else {
                              console.log('Email and auth code saved successfully');
                              res.status(200).json({message: 'Email and auth code saved successfully'});
                          }
                      });
                  }
              });
          }
      });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/', (req, res) => {
  res.send('Hello, HTTPS World!');
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

