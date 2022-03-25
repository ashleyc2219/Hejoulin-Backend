var express = require("express");
var router = express.Router();
const db = require("../modules/connect-db");

// THINK:
// member_id 要不要寫在所有router外面?

/* 清酒 購物車 --- */
// TODO:
//  member_id要去拿登入的member_id
router.get("/sake", async (req, res) => {
  const member_id = req.query.member_id ? parseInt(req.query.member_id) : 1;
  console.log(member_id);
  const sql = `
   SELECT cs.*, cm.mark_id, mark.pics, mark.mark_name, ps.pro_name, ps.pro_img, pf.pro_price, pf.pro_capacity, pf.pro_gift, pf.pro_mark 
    FROM cart_sake cs 
    LEFT JOIN cart_mark cm 
    ON cs.cart_sake_id=cm.cart_sake_id 
    LEFT JOIN mark 
    ON cm.mark_id=mark.mark_id 
    LEFT JOIN product_sake ps 
    ON cs.pro_id=ps.pro_id 
    LEFT JOIN product_format pf 
    ON cs.pro_id=pf.format_id 
    WHERE cs.member_id=${member_id}
    `;
  const [result, fields] = await db.query(sql);
  res.json(result);
});

/* 刪除 清酒購物車 商品 */
// 商品 酒標一起刪掉
router.delete("/sake", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const member_id = req.body.member_id ? parseInt(req.body.member_id) : 1;
  const cart_sake_id = req.body.cart_sake_id ? req.body.cart_sake_id : "0";
  const pro_id = req.body.pro_id ? parseInt(req.body.pro_id) : "0";
  const sql_sake =
    "DELETE FROM `cart_sake` WHERE `cart_sake_id`=? AND `member_id`=? AND `pro_id`=?";
  const sql_mark = "DELETE FROM `cart_mark` WHERE `cart_sake_id`=?";
  const [result_sake] = await db.query(sql_sake, [
    cart_sake_id,
    member_id,
    pro_id,
  ]);
  const [result_mark] = await db.query(sql_mark, [cart_sake_id]);

  output.success = [!!result_sake.affectedRows, !!result_mark.affectedRows];
  output.result = [result_sake, result_mark];
  res.json(output);
});

/* 更改 清酒購物車 商品數量 */
// TODO: 如果資料沒有傳過來，要怎麼避免出錯 (目前是傳一個無法select到資料的字串)
router.put("/sake", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const cart_quantity = req.body.cart_quantity
    ? parseInt(req.body.cart_quantity)
    : "no quantity";
  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const cart_sake_id = req.body.cart_sake_id ? req.body.cart_sake_id : "0";
  const pro_id = req.body.pro_id ? parseInt(req.body.pro_id) : "0";
  const sql =
    "UPDATE `cart_sake` SET `cart_quantity`=? WHERE `cart_sake_id`=? AND `member_id`=? AND `pro_id`=?;";
  const [result] = await db.query(sql, [
    cart_quantity,
    cart_sake_id,
    member_id,
    pro_id,
  ]);

  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});

/* 酒標 購物車 --- */
// THINK: 要想辦法擋掉非本人刪除酒標

/* 刪除 酒標購物車 酒標 */
router.delete("/mark", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const cart_sake_id = req.body.cart_sake_id ? req.body.cart_sake_id : "0";

  const sql = "DELETE FROM `cart_mark` WHERE `cart_sake_id`=?";
  const [result] = await db.query(sql, [cart_sake_id]);

  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});
/* 更改 酒標購物車 酒標 */
router.put("/mark", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const cart_sake_id = req.body.cart_sake_id ? req.body.cart_sake_id : "0";
  const mark_id = req.body.mark_id ? req.body.mark_id : "0";

  const sql = "UPDATE `cart_mark` SET `mark_id`=? WHERE `cart_sake_id`=?";
  const [result] = await db.query(sql, [mark_id, cart_sake_id]);

  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});
/* TODO: 新增 酒標購物車 酒標 --- */

/* 禮盒 購物車 --- */
// TODO:
//  member_id要去拿登入的member_id
/// TODO: 禮盒送去前端的資料 要做合併跟處理
router.get("/gift", async (req, res) => {
  const member_id = req.query.member_id
    ? parseInt(req.query.member_id)
    : "no member_id";
  //   console.log(member_id);
  const sql = `
    SELECT cg.*, cgd.pro_id, pg.gift_name, ps.pro_name, ps.pro_img, pf.pro_price, pf.pro_capacity, pc.container_name, pc.container_img, pc.container_shadow 
    FROM cart_gift cg 
    LEFT JOIN cart_gift_d_d cgd 
    ON cg.cart_gift_id=cgd.cart_gift_id 
    LEFT JOIN product_gift pg 
    ON cg.gift_id=pg.gift_id 
    LEFT JOIN product_sake ps 
    ON cgd.pro_id=ps.pro_id 
    LEFT JOIN product_format pf 
    ON ps.pro_id=pf.format_id 
    LEFT JOIN product_container pc 
    ON pf.container_id=pc.container_id 
    WHERE cg.member_id=${member_id}
    `;
  const [result, fields] = await db.query(sql);
  let tidyResult = [];
  let twoInOne = {};
  let twoInOne_cartGiftId = 0;

  for (const i of result) {
    if (i.gift_id === 3) {
      if (i.cart_gift_id !== twoInOne_cartGiftId) {
        twoInOne_cartGiftId = i.cart_gift_id;
        console.log(twoInOne_cartGiftId);
        twoInOne.cart_gift_id = i.cart_gift_id;
        twoInOne.member_id = i.member_id;
        twoInOne.cart_quantity = i.cart_quantity;
        twoInOne.gift_id = i.gift_id;
        twoInOne.gift_name = i.gift_name;
        twoInOne.box_color = i.box_color;

        twoInOne.pro_one = {
          pro_id: i.pro_id ,
          pro_name: i.pro_name ,
          pro_img: i.pro_img ,
          pro_price: i.pro_price ,
          pro_capacity: i.pro_capacity ,
        };
      } else {
        console.log("same", twoInOne_cartGiftId);
        twoInOne.pro_two = {
          pro_id: i.pro_id,
          pro_name: i.pro_name,
          pro_img: i.pro_img,
          pro_price: i.pro_price,
          pro_capacity: i.pro_capacity,
        };
        tidyResult = [...tidyResult, {...twoInOne}];
        console.log(tidyResult)
      }
    } else {
      tidyResult = [...tidyResult, i];
      console.log(tidyResult);
    }
  }
  res.json(tidyResult);
  //   res.json(result);
});

/* 刪除 禮盒購物車 商品 */
// 禮盒(cart_gift)、禮盒明細 (cart_gift_d_d)的資料要一起刪
// if the first one didn't success, don't to the second one
router.delete("/gift", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const cart_gift_id = req.body.cart_gift_id ? req.body.cart_gift_id : "0";
  const sql_gift =
    "DELETE FROM `cart_gift` WHERE `cart_gift_id`=? AND `member_id`=?";
  const [result_gift] = await db.query(sql_gift, [cart_gift_id, member_id]);
  if (!!result_gift.affectedRows) {
    const sql_gift_d_d = "DELETE FROM `cart_gift_d_d` WHERE `cart_gift_id`=?";
    const [result_gift_d_d] = await db.query(sql_gift_d_d, [cart_gift_id]);
    output.success = [
      !!result_gift.affectedRows,
      !!result_gift_d_d.affectedRows,
    ];
    output.result = [result_gift, result_gift_d_d];
  } else {
    output.success = [!!result_gift.affectedRows, "didn't run"];
    output.result = [result_gift, "result_gift_d_d"];
  }

  res.json(output);
});

/* 更改 禮盒購物車 數量 */
// TODO: 如果req資料沒有傳過來，要怎麼避免出錯 (目前是傳一個無法select到資料的字串)
router.put("/gift", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };

  const cart_quantity = req.body.cart_quantity
    ? parseInt(req.body.cart_quantity)
    : "no quantity";
  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const cart_gift_id = req.body.cart_gift_id ? req.body.cart_gift_id : "0";
  const sql =
    "UPDATE `cart_gift` SET `cart_quantity`=? WHERE `cart_gift_id`=? AND `member_id`=?";
  const [result] = await db.query(sql, [
    cart_quantity,
    cart_gift_id,
    member_id,
  ]);

  output.success = !!result.affectedRows;
  output.result = result;
  res.json(output);
});

/* 酒標 ---*/
// 讀取 此會員的所有酒標
router.get("/mark", async (req, res) => {
  const output = {
    success: false,
    error: "",
  };
  const member_id = req.body.member_id
    ? parseInt(req.body.member_id)
    : "no member_id";
  const sql = "SELECT * FROM `mark` WHERE member_id =?";
  const [result, fields] = await db.query(sql, [member_id]);

  output.success = !!result.affectedRows;
  output.result = result;
  res.json(result);
});

/* 折扣碼 ---*/
router.post("/discount", async (req, res) => {
  const discountCode = req.body.discountCode ? req.body.discountCode : "";
  const sql = `SELECT * FROM discount WHERE discount_code=?;`;
  const [result, fields] = await db.query(sql, [req.body.discountCode]);
  res.json(result);
});

module.exports = router;
