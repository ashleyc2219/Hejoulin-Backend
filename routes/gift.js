const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all gift detail:http://localhost:3500/api/gift
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM product_gift_d";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
