const router = require("express").Router();
const db = require("../modules/connect-db");

// Get kind of gift: http://localhost:3001/api/product_guide
// 指南推薦酒
router.get("/", async (req, res) => {
  let taste = req.query.pro_taste ? req.query.pro_taste : "";
  let temp = req.query.pro_temp ? req.query.pro_temp : "";
  let priceLow = req.query.pro_price_low ? req.query.pro_price_low : "";
  let priceHigh = req.query.pro_price_high ? req.query.pro_price_high : "";
  let gift = req.query.pro_gift ? req.query.pro_gift : "";

  let where = ` WHERE 1`;

  // 搜尋關鍵字串接
  if (taste) where += ` AND pf.pro_taste LIKE "%${taste}%"`;
  if (temp) where += ` AND pf.pro_temp LIKE "%${temp}%"`;
  if (priceLow || priceHigh)
    where += ` AND pf.pro_price BETWEEN ${priceLow} AND ${priceHigh}`;
  if (!+gift) {
    where += ` AND pf.pro_gift > 0`;
  } else {
    where += ` AND pf.pro_gift = 0`;
  }

  const sql = `SELECT * FROM product_sake ps JOIN product_format pf ON pf.format_id = ps.format_id ${where} ORDER BY rand () LIMIT 3`;
  const [rs, fields] = await db.query(sql);
  return res.json(rs);
});

module.exports = router;
