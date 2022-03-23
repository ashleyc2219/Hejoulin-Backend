const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all container:http://localhost:3500/api/
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM product_container";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
