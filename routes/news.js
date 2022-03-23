const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all news : http://localhost:3000/api/news

// Get onenews : http://localhost:3000/api/news/detail?newsId=1

router.get("/", async (req, res) => {
  if (req.query.newsId) {
    const { newsId } = req.query;
    const sql = `SELECT * FROM news WHERE news_id = ${newsId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM news";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});


module.exports = router;
