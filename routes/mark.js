const router = require("express").Router();
const db = require("../modules/connect-db");

// Get mark:http://localhost:3500/api/mark
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM mark";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;