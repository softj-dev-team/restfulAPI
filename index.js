const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const dbConfig  = require('./dbConfig.json');
const connection = mysql.createConnection(dbConfig);

const app = express();
const youtube = google.youtube({
  version: 'v3',
  auth: 'AIzaSyAMoow-JnzjEWorJUa6653jTBxbvjygBrw'  // 여기에 획득한 API 키를 입력합니다.
});

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
app.use(express.json());

// 타이틀 저장 API
app.post('/api/save-title', (req, res) => {
    const user_id = req.body.user_id;
    const title = req.body.title;

    // 데이터베이스에 타이틀 저장
    const query = 'INSERT INTO video (user_id, title) VALUES (?, ?)';
    connection.query(query, [user_id, title], (error, results) => {
        if (error) {
            console.error('Error saving title:', error);
            res.status(500).json({ error: 'Error saving title' });
        } else {
            console.log('Title saved successfully');
            res.status(200).json({ message: 'Title saved successfully' });
        }
    });
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

