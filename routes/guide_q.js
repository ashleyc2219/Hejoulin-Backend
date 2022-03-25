const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all question:http://localhost:3500/api/guide_q
// 先用專業指南的問題(不包含價錢)
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM guide_q gq JOIN guide_a ga ON gq.q_id=ga.q_id WHERE gq.q_cate = 'a' ";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
