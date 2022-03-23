const router = require("express").Router();
const db = require("../modules/connect-db");

// Get all spmenu : http://localhost:3000/api/spmenu
// Get specific spmenu : http://localhost:3000/api/spmenu?resId=1

router.post("/", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const sql1 =
    " SELECT `cart_sake_id` FROM `cart_sake` ORDER BY `cart_sake_id` DESC LIMIT 0 , 1";

  const [result1] = await db.query(sql1);

  let get_cart_id = result1[0].cart_sake_id;

  get_cart_id = (parseInt(get_cart_id.slice(1)) + 1).toString();

  let cart_id = "S" + get_cart_id.padStart(10, "0");

  console.log(cart_id);

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

  res.json(output);
});

module.exports = router;
