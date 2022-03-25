const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1

router.post("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  //訂單編號設定 ex:S0000000012
  const sql1 =
    " SELECT `cart_sake_id` FROM `cart_sake` ORDER BY `cart_sake_id` DESC LIMIT 0 , 1";

  const [result1] = await db.query(sql1);

  let get_cart_id = result1[0].cart_sake_id;

  get_cart_id = (parseInt(get_cart_id.slice(1)) + 1).toString();

  let cart_id = "S" + get_cart_id.padStart(10, "0");

  //如果購物車商品重複 數量會相加
  const sql2 =
    " SELECT `cart_quantity`, `cart_sake_id` FROM `cart_sake` WHERE member_id = ? AND pro_id = ?";

  const [result2] = await db.query(sql2, [req.body.member_id, req.body.pro_id]);

  output.success = !!result2.affectedRows; //rowcount主為布林職
  output.result = result2;
  res.json(output);

  if (output.result.length > 0) {
    const quantity =
      parseInt(result2[0].cart_quantity) + parseInt(req.body.cart_quantity);

    const sql3 =
      " UPDATE `cart_sake` SET `cart_quantity`= ? WHERE `cart_sake_id` = ? ; ";
    const [result3] = await db.query(sql3, [quantity, result2[0].cart_sake_id]);

    output.success = !!result3.affectedRows; //rowcount主為布林職
    output.result = result3;
  } else {
    const sql =
      "INSERT INTO `cart_sake`(`cart_sake_id`,`member_id`, `pro_id`, `cart_quantity`) VALUES (? ,?, ?, ?)";

    const [result] = await db.query(sql, [
      cart_id,
      req.body.member_id,
      req.body.pro_id,
      req.body.cart_quantity,
    ]);

    output.success = !!result.affectedRows; //rowcount主為布林職
    output.result = result;
  }
  return;

  res.json(output);
});

module.exports = router;
