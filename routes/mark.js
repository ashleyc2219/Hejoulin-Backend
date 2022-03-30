const router = require("express").Router();
const db = require("../modules/connect-db");
const upload = require("./../modules/upload-images");

// Get mark:http://localhost:3500/api/mark
// 寫入酒標
router.post("/", upload.single("mark"), async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  const sql =
    "INSERT INTO `mark`(`member_id`,`mark_name`,`pics`,`create_at`) VALUES (?, ?, ?, Now())";
  const [result] = await db.query(sql, [
    4, // 要改登入的member id
    req.body.markname, // 酒標名稱
    req.file.filename,
  ]);
  output.success = !!result.affectedRows; //rowcount主為布林職
  output.result = result;
  res.json(output);
});

module.exports = router;
