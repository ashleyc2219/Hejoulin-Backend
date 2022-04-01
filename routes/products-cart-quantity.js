const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1
router.post("/", async (req, res) => {
  const sql =
    "SELECT SUM(`cart_quantity`) FROM `cart_sake` WHERE `member_id` = ?";
  const [rs, fields] = await db.query(sql, [req.body.member_id]);

  const sql2 =
    "SELECT SUM(`cart_quantity`) FROM `cart_gift` WHERE `member_id` = ?";
  const [rs2, fields2] = await db.query(sql2, [req.body.member_id]);

  let sake = parseInt(rs[0]["SUM(`cart_quantity`)"]);
  let gift = parseInt(rs2[0]["SUM(`cart_quantity`)"]);

  if (isNaN(sake)) {
    sake = 0;
  }
  if (isNaN(gift)) {
    gift = 0;
  }

  const quantity = sake + gift;

  console.log(quantity);

  res.json(quantity);
});

module.exports = router;
