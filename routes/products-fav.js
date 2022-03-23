const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1

router.post("/insert", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const sql =
    "INSERT INTO `favorite`(`member_id`, `pro_id`) VALUES (?, ?)";

  const [result] = await db.query(sql, [
    req.body.member_id,
    req.body.pro_id,
  ]);

  console.log(result);
  output.success = !!result.affectedRows; //rowcount主為布林職
  output.result = result;

  res.json(output);
});

router.post("/delete", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const sql =
    "DELETE FROM `favorite` WHERE `member_id` = ? AND `pro_id` = ?";

  const [result] = await db.query(sql, [
    req.body.member_id,
    req.body.pro_id,
  ]);

  console.log(result);
  output.success = !!result.affectedRows; //rowcount主為布林職
  output.result = result;

  res.json(output);
});

router.post("/search", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const sql =
    "SELECT `pro_id`  FROM `favorite` WHERE `member_id` = ?";

  const [result] = await db.query(sql, [
    req.body.member_id,
  ]);

  output.success = !!result.length;
  output.result = result;

  res.json(output);
});

module.exports = router;
