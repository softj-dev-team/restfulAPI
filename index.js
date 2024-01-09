const express = require('express');
const { google } = require('googleapis');
const connectDB = require('./mongoClient');

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
app.get('/api/videotitle', (req, res) => {
  res.status(200).json({title:'검색어test'})
});
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

