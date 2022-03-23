const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all gift:http://localhost:3500/api/product_gift
// Get kind of gift: http://localhost:3500/api/product_gift?gift=1
router.get("/", async (req, res) => {
  if (req.query.gift) {
    const { gift } = req.query;
    const sql = `SELECT * FROM product_sake ps JOIN  product_format pf ON pf.format_id = ps.format_id WHERE pf.pro_gift = ${gift}`;
    const [rs, fields] = await db.query(sql);
    res.json(rs);
  }
  const sql = `SELECT * FROM product_sake ps JOIN  product_format pf ON pf.format_id = ps.format_id WHERE pf.pro_gift >0`;
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
