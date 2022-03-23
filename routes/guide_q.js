const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all question:http://localhost:3500/api/guide_q
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM guide_q JOIN guide_a WHERE q_sid=q_sid";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
