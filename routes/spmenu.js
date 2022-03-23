const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1
router.get("/", async (req, res) => {
  if (req.query.resId) {
    const { resId } = req.query;
    const sql = `SELECT * FROM special_menu WHERE res_id = ${resId}`;
    const [rs, fields] = await db.query(sql);
    return res.json(rs);
  }
  const sql = "SELECT * FROM special_menu";
  const [rs, fields] = await db.query(sql);
  res.json(rs);
});

module.exports = router;
