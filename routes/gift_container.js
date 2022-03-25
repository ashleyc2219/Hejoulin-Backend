const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all container:http://localhost:3500/api/gift_container
// 酒器資料
router.get("/", async (req, res) => {
  const sql = "SELECT * FROM product_container pc JOIN product_format pf ON pc.container_id = pf.container_id WHERE pc.container_id < 5";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
