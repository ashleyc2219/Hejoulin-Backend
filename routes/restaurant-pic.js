const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all restaurant-pic : http://localhost:3000/api/restaurant-pic
// Get specific restaurant-pic : http://localhost:3000/api/restaurant-pic?resId=1
router.get("/", async (req, res) => {
  if (req.query.resId) {
    const { resId } = req.query;
    const sql = `SELECT * FROM restaurant_pictures WHERE res_id = ${resId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM restaurant_pictures";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
