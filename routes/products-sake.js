const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1
router.get("/items", async (req, res) => {
  const sql =
    "SELECT * FROM product_sake ps LEFT JOIN product_format pf ON ps.format_id = pf.format_id";
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

router.get("/item-detail", async (req, res) => {
  let pro_id = req.query.pro_id

  console.log(pro_id);
  const sql = `SELECT * FROM product_sake ps LEFT JOIN product_format pf ON ps.format_id = pf.format_id WHERE pro_id = ${pro_id}`;
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});


module.exports = router;
