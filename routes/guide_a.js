const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all question:http://localhost:3001/api/guide_a
//(不包含價錢)
router.get("/", async (req, res) => {
  if (req.query.id) {
    const { id } = req.query;
    const sql =
      `SELECT * FROM guide_a ga JOIN guide_q gq ON ga.q_id= gq.q_id WHERE gq.q_id=${id}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql =
    `SELECT * FROM guide_q gq JOIN guide_a ga ON ga.q_id=gq.q_id`;
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

module.exports = router;
