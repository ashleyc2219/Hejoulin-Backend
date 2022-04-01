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
  output.result1 = result1;
  output.result2 = [];


for(let i of req.body.pro_id){
  let pid = +i;
  if(pid){
    const sql3 =
    "INSERT INTO `cart_gift_d_d`(`cart_gift_id`,`pro_id`) VALUES (?,?)";
    output.result2.push( await db.query(sql3, [cart_id, pid]) );
  }
}

  console.log("output", output);
  res.json(output);
});

module.exports = router;
