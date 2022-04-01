const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all question:http://localhost:3500/api/guide_q
// 先用專業指南的問題(不包含價錢)
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM guide_q gq WHERE gq.q_cate = 'a' ORDER BY rand () LIMIT 4";
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

module.exports = router;
