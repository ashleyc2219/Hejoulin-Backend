const router = require("express").Router();
const db = require("../modules/connect-db");

// Get mark:http://localhost:3500/api/mark
// 寫入酒標
router.post("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const sql =
    "INSERT INTO `mark`(`member_id`,`mark_name`,`pics`,`creat_at`) VALUES (?, ?, ?, NOW())";
  const [result] = await db.query(sql, [
    req.body.member_id,
    req.body.mark_name,
    req.body.pics,
  ]);
  output.success = !!result.affectedRows; //rowcount主為布林職
  output.result = result;

  res.json(output);
});

module.exports = router;
