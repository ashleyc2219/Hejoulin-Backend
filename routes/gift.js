const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all gift detail:http://localhost:3001/api/gift
// Get kind of gift: http://localhost:3001/api/gift?gift_id=1
// 禮盒資料

router.get("/", async (req, res) => {
  if(req.query.gift_id){
    const {gift_id}=req.query
    const sql = `SELECT * FROM product_gift_d WHERE gift_id = ${gift_id}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM product_gift_d";
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

module.exports = router;
