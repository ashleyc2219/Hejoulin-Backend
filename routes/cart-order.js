var express = require("express");
var router = express.Router();
const db = require("../modules/connect-db");

// 生成order_id
function order_id_generator() {
  let nowDate = new Date();
  let year = nowDate.getFullYear().toString();
  // getMonth 會是 0-11，所以要加一
  let month = (nowDate.getMonth() + 1).toString();
  let date = nowDate.getDate().toString();
  console.log(nowDate);
  // 如果是 1-9月 或 1-9日 要變成 01-09
  if (month.length == 1) {
    month = "0" + month;
  }
  if (date.length == 1) {
    date = "0" + date;
  }
  let newDate = year + month + date;
  return search_order_id(newDate);
}
// 用今天的日期去資料表裡搜尋 order_id
async function search_order_id(dateString) {
  const sql =
    "SELECT * FROM `order_main` WHERE `order_id` LIKE? ORDER BY `order_id` DESC LIMIT 1";
  const [result, fields] = await db.query(sql, [dateString + "%"]);
  // 如果當日已有訂單建立 則最後一筆order_id+1
  if (result[0]) {
    let last_order_id = result[0].order_id;
    let new_order_id = parseInt(last_order_id) + 1;
    return new_order_id;
  } // 如果是今天第一筆訂單 則 當日日期 + 001
  else {
    let new_order_id = dateString + "001";
    return new_order_id;
  }
}
// 宣告order_id在所有rourt外面，因為都用同一個order_id ---
// TODO: 把order_id都改成下面這個
let order_id = "";

/* 新增 訂單order_main 資料 --- */
router.post("/order-main", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  // 由order_main生成的，存到外面，讓大家都用一個
  order_id = await order_id_generator();

  // 取得生成的order_id後，開始新增資料
  // TODO:
  // member_id要去拿登入的member_id
  const sql =
    "INSERT INTO `order_main`(`order_id`, `member_id`, `order_name`, `order_mobile`, `order_email`, `type`, `used_code`, `order_date`) VALUES (?,?,?,?,?,?,?, NOW())";

  const [result] = await db.query(sql, [
    order_id,
    req.body.member_id,
    req.body.order_name,
    req.body.order_mobile,
    req.body.order_email,
    "S", //order_type 一定是 S
    req.body.used_code ? req.body.used_code : "",
  ]);
  console.log(result);
  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});

// 讀取 會還在購物車裡的商 清酒商品資料
// 2. 將資料用迴圈寫進order_sake_d裡面

// 得知這個member 購物車裡的sake商品，用member_id讀取cart_sake 裡的資料
async function memberCart(memberId) {
  const sql = `SELECT cs.*, pf.pro_price, cm.mark_id FROM cart_sake cs 
                  LEFT JOIN product_sake ps 
                  ON cs.pro_id = ps.pro_id 
                  LEFT JOIN product_format pf 
                  ON cs.pro_id=pf.format_id
                  LEFT JOIN cart_mark cm
                  ON cs.cart_sake_id=cm.cart_sake_id
                  WHERE cs.member_id=?`;
  const [result, fields] = await db.query(sql, [memberId]);
  return result;
}
/* 新增 訂單清酒order_sake_d 訂單酒標order_mark 資料 --- */
router.post("/order-sake-mark", async (req, res) => {
  const member_id = req.body.member_id;
  // THINK: order_id是不是可以直接拿外面的，因為是共用的
  const order_id = req.body.order_id;
  // 取得這個會員購物車裡的資料
  const sakeInCart = await memberCart(member_id);
  let sakeInsertOutput = [];
  let markInsertOutput = [];

  //  用迴圈把會員購物車裡的資料，insert進order_sake_d裡面
  for (const element of sakeInCart) {
    let pro_id = element.pro_id;
    let order_quantity = element.cart_quantity;
    let order_d_price = element.pro_price * element.cart_quantity;
    let mark_id = element.mark_id;
    let order_d_id = await InsertOrderSake(
      order_id,
      pro_id,
      order_quantity,
      order_d_price
    );
    if (element.mark_id) {
      InsertOrderMark(mark_id, order_d_id);
    }
  }

  // 將cart_sake 裡的資料存進order_sake_d
  async function InsertOrderSake(
    order_id,
    pro_id,
    order_quantity,
    order_d_price
  ) {
    const output = {
      success: false,
      error: "",
    };
    const sql =
      "INSERT INTO `order_sake_d`(`order_id`, `pro_id`, `order_quantity`, `order_d_price`, `order_state`) VALUES (?,?,?,?,?)";
    const [result] = await db.query(sql, [
      order_id, //跟order_main用同一個order_id
      pro_id,
      order_quantity,
      order_d_price, //要用算的，需要product資料表的價格
      "待出貨", //order_state 一定是 待出貨
    ]);
    output.success = !!result.affectedRows;
    output.result = result;
    sakeInsertOutput = [...sakeInsertOutput, output];
    return result.insertId;
  }
  // 將cart_mark 裡的資料 存進order_mark裡面
  async function InsertOrderMark(mark_id, order_d_id) {
    const output = {
      success: false,
      error: "",
    };
    const sql =
      "INSERT INTO `order_mark`(`mark_id`, `order_d_id`) VALUES (?, ?)";
    const [result] = await db.query(sql, [mark_id, order_d_id]);
    output.success = !!result.affectedRows;
    output.result = result;
    markInsertOutput = [...markInsertOutput, output];
    console.log("mark", output);
  }

  // console.log(sakeInsertOutput);
  res.json({ sake: sakeInsertOutput, mark: markInsertOutput });
});

/* 刪除 購物車清酒cart_sake_d 購物車酒標cart_mark 資料 --- */
router.delete("/cart-sake-mark", async (req, res) => {
  const output = {
    success: false,
    error: "",
    Mark_rows: 0,
  };
  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const sakeInCart = await memberCart(member_id);
  const sql_sake = "DELETE FROM `cart_sake` WHERE `member_id`=?";
  const [result_sake] = await db.query(sql_sake, [member_id]);
  // THINK: 要怎麼把 sakeInCart 存在外面，因為 del 跟 post都有用到
  let result_mark = [];
  for (const element of sakeInCart) {
    let cart_sake_id = element.cart_sake_id;
    if (element.mark_id) {
      // console.log('mark yes')
      await delMark(cart_sake_id);
    }
  }

  async function delMark(cart_sake_id) {
    const sql_mark = "DELETE FROM `cart_mark` WHERE `cart_sake_id`=?";
    const [result] = await db.query(sql_mark, [cart_sake_id]);
    output.Mark_rows += result.affectedRows;
    result_mark = [...result_mark, result];
    console.log(output);
  }

  output.success = [!!result_sake.affectedRows, output.Mark_rows];
  output.result = [result_sake, result_mark];
  console.log(member_id);
  // res.json(sakeInCart);
  res.json(output);
});

/* 新增  order_gift_d訂單禮盒明細、order_gift_d_d訂單禮盒明細細項 資料  ---*/

// 得知這個member 購物車裡的gift禮盒，用member_id讀取cart_gift 裡的資料
//  讀取購物車禮盒cart_gift 購物車禮盒細項cart_gift_d_d 資料
async function memberGiftCart(memberId) {
  const sql = `SELECT cg.*, cgd.cart_g_d_id, cgd.pro_id, pf.pro_price FROM cart_gift cg
                  LEFT JOIN cart_gift_d_d cgd
                  ON cg.cart_gift_id=cgd.cart_gift_id
                  LEFT JOIN product_sake ps 
                  ON cgd.pro_id=ps.pro_id
                  LEFT JOIN product_format pf 
                  ON ps.pro_id=pf.format_id
                  WHERE cg.member_id=?`;
  const [result] = await db.query(sql, [memberId]);
  return result;
}

router.post("/order-gift-d", async (req, res) => {
  const member_id = req.body.member_id;
  // THINK: order_id是不是可以直接拿外面的，因為是共用的
  const order_id = req.body.order_id;
  // 取得這個會員 禮盒購物車裡的資料
  const giftInCart = await memberGiftCart(member_id);
  let giftInsertOutput = [];
  let gDetialInsertOutput = [];
  let order_gift_id_arr = [];
  let order_g_id = 0;

  //  用迴圈把會員購物車裡的資料，insert進order_gift_d裡面
  // 存進order_gift_d裡面，得到order_gift_d，再insert進 order_gift_d_d裡面
  for (const element of giftInCart) {
    let order_quantity = element.cart_quantity;
    let gift_id = element.gift_id;
    let cart_gift_id = element.cart_gift_id;
    let box_color = element.box_color;
    let pro_price = element.pro_price;

    if (!order_gift_id_arr.includes(cart_gift_id)) {
      order_gift_id_arr = [...order_gift_id_arr, cart_gift_id];
      order_g_id = await InsertOrderGift(
        order_id,
        order_quantity,
        gift_id,
        box_color
      );
      // 計算 禮盒價錢並 update進order_gift_d.order_d_price裡面
      await UpdateOrderGiftPrice(
        gift_id,
        pro_price,
        order_quantity,
        cart_gift_id
      );
    }

    let pro_id = element.pro_id;
    await InsertOrderGiftDetial(order_g_id, pro_id);
  }

  // 將cart_gift 裡的資料存進order_gift_d
  async function InsertOrderGift(order_id, order_quantity, gift_id, box_color) {
    const output = {
      success: false,
      error: "",
    };
    const sql =
      "INSERT INTO `order_gift_d`(`order_id`, `order_quantity`, `order_state`, `gift_id`, `box_color`) VALUES (?,?,?,?,?)";
    const [result] = await db.query(sql, [
      order_id, //跟order_main用同一個order_id
      order_quantity,
      "待出貨", //order_state 一定是 待出貨
      gift_id,
      box_color,
    ]);
    output.success = !!result.affectedRows;
    output.result = result;
    giftInsertOutput = [...giftInsertOutput, output];
    return result.insertId;
  }
  // 將cart_gift_d_d 裡的資料存進order_gift_d_d
  async function InsertOrderGiftDetial(order_g_id, pro_id) {
    const output = {
      success: false,
      error: "",
    };
    const sql =
      "INSERT INTO `order_gift_d_d`(`order_g_id`, `pro_id`) VALUES (?,?)";
    const [result] = await db.query(sql, [order_g_id, pro_id]);
    output.success = !!result.affectedRows;
    output.result = result;
    // TODO: 要改存另一個變數
    gDetialInsertOutput = [...gDetialInsertOutput, output];
  }

  async function UpdateOrderGiftPrice(
    gift_id,
    pro_price,
    order_quantity,
    cart_gift_id
  ) {
    let total_price = 0;
    if (gift_id == 2) {
      total_price = pro_price + 200;
    } else if (gift_id == 4) {
      total_price = pro_price + 200 + 600;
    } else if (gift_id == 3) {
      let giftTwoTotalPrice = 0;
      for (const el of giftInCart) {
        if (el.cart_gift_id == cart_gift_id) {
          giftTwoTotalPrice += el.pro_price;
        }
      }
      total_price = giftTwoTotalPrice + 200;
    }
    let order_d_price = total_price * order_quantity;
    const sql =
      "UPDATE `order_gift_d` SET `order_d_price`=? WHERE `order_g_id`=?;";
    const [result] = await db.query(sql, [order_d_price, order_g_id]);
    console.log("update result: ", result);
  }

  // console.log(insertOutput);
  res.json([giftInsertOutput, gDetialInsertOutput]);
});

/* 刪除 購物車禮盒cart_gift 購物車禮盒細項cart_gift_d_d 資料 --- */
router.delete("/cart-gift-gdtail", async (req, res) => {
  const output = {
    success: false,
    error: "",
    detail_rows: 0,
  };
  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const giftInCart = await memberGiftCart(member_id);
  const sql_sake = "DELETE FROM `cart_gift` WHERE `member_id`=?";
  const [result_sake] = await db.query(sql_sake, [member_id]);
  // THINK: 要怎麼把 giftInCart 存在外面，因為 del 跟 post都有用到
  let result_detail = [];
  let order_gift_id_arr = [];
  for (const element of giftInCart) {
    let cart_gift_id = element.cart_gift_id;
    if (!order_gift_id_arr.includes(cart_gift_id)) {
      order_gift_id_arr = [...order_gift_id_arr, cart_gift_id];
      await delMark(cart_gift_id);
    }
  }

  async function delMark(cart_gift_id) {
    const sql_mark = "DELETE FROM `cart_gift_d_d` WHERE `cart_gift_id`=?";
    const [result] = await db.query(sql_mark, [cart_gift_id]);
    output.detail_rows += result.affectedRows;
    result_detail = [...result_detail, result];
    console.log(output);
  }

  output.success = [!!result_sake.affectedRows, output.detail_rows];
  output.result = [result_sake, result_detail];
  console.log(member_id);
  res.json(output);
});


module.exports = router;
