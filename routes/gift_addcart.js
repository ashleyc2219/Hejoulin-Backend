const router = require("express").Router();
const db = require("../modules/connect-db");

// 寫入購物車

router.post("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const cart_gift_id =
    "SELECT `cart_gift_id` FROM `cart_gift` DESC LIMIT 0 , 1";

  const [result1] = await db.query(cart_gift_id);
  let get_cart_id = result1[0].cart_sake_id;
  get_cart_id = (parseInt(get_cart_id.slice(1)) + 1).toString();
  let cart_id = "G" + get_cart_id.padStart(10, "0");
  console.log(cart_id);

  async () => {
    const output1 = {
      success: false,
      error: "",
    };
    const sql1 =
      "INSERT INTO `cart_gift`(`cart_gift_id`,`member_id`,`cart_quanlity`,`gift_id`,`box_color`) VALUES (? ,? ,? ,? ,?)";
    const [result] = await db.query(sql1, [
      cart_id,
      req.body.member_id,
      req.body.cart_quanlity,
      req.body.gift_id,
      req.body.box_color,
    ]);
    output1.success = !!result.affectedRows;
    output1.result = result;
    output=[...output1, output]
  }
  
  async()=>{
    const output2 = {
        success: false,
        error: "",
      };
      const sql =
        "INSERT INTO `cart_gift_d_d`(`cart_gift_id`,`pro_id`) VALUES (?,?)";
      const [result] = await db.query(sql, [
        req.body.cart_gift_id,
        req.body.pro_id,
      ]);
      output2.success = !!result.affectedRows;
      output2.result = result;
      output = [...output2,output]
    }
  res.json(output);
});

module.exports = router;
