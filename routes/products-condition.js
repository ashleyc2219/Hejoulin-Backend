const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1
router.get("/brand", async (req, res) => {
  const sql = "SELECT  pro_brand FROM  product_format  GROUP BY  pro_brand ";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

router.get("/location", async (req, res) => {
  const sql = "SELECT  pro_loca FROM  product_format  GROUP BY  pro_loca ";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

router.get("/random-three", async (req, res) => {
  const sql = "SELECT * FROM `product_sake` ps LEFT JOIN `product_format` pf ON ps.format_id = pf.format_id ORDER BY rand () LIMIT 3";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

router.get("/top-three", async (req, res) => {
  const sql = "SELECT * FROM `product_sake` ps LEFT JOIN `product_format` pf ON ps.format_id = pf.format_id ORDER BY ps.pro_selling DESC LIMIT 3";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;