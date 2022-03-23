const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all menu-pic : http://localhost:3000/api/menu-pic
// Get specific menu-pic : http://localhost:3000/api/menu-pic?resId=1
router.get("/", async (req, res) => {
  if (req.query.resId) {
    const { resId } = req.query;
    const sql = `SELECT * FROM menu_pictures WHERE res_id = ${resId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM menu_pictures";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
