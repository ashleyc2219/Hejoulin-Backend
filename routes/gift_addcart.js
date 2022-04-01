const router = require("express").Router();
const db = require("../modules/connect-db");

// 寫入購物車

router.post("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // 訂單編號
  const sql =
    "SELECT `cart_gift_id` FROM `cart_gift` ORDER BY `cart_gift_id` DESC LIMIT 0 , 1";

  const [result] = await db.query(sql);
  let get_cart_id = result[0].cart_gift_id;
  get_cart_id = (parseInt(get_cart_id.slice(1)) + 1).toString();
  let cart_id = "G" + get_cart_id.padStart(10, "0");

  const sql1 =
    "INSERT INTO `cart_gift`(`cart_gift_id`,`member_id`,`cart_quantity`,`gift_id`,`box_color`) VALUES (? ,? ,? ,? ,?)";
  const [result1] = await db.query(sql1, [
    cart_id,
    req.body.member_id,
    req.body.cart_quantity,
    req.body.gift_id,
    req.body.box_color,
  ]);
  output.success = !!result1.affectedRows;
  output.result = result1;

  const sql3 =
    "INSERT INTO `cart_gift_d_d`(`cart_gift_id`,`pro_id`) VALUES (?,?)";
  const [result2] = await db.query(sql3, [cart_id, req.body.pro_id01]);
  output.success = !!result2.affectedRows;
  output.result = result2;

  if (!req.body.pro_id02) {
    const sql4 =
      "INSERT INTO `cart_gift_d_d`(`cart_gift_id`,`pro_id`) VALUES (?,?)";
    const [result3] = await db.query(sql4, [cart_id, req.body.pro_id02]);
    output.success = !!result3.affectedRows;
    output.result = result3;
  }

  console.log("output", output);
  console.log("HHHHHHHHHEEEEEEELLLLOOOOOOO!");
  res.json(output);
});

module.exports = router;
